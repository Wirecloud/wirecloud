# -*- coding: utf-8 -*-

# Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

from __future__ import unicode_literals

from datetime import datetime
import os
import time

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.utils.encoding import force_text
from whoosh.collectors import Collector
from whoosh.compat import xrange
from whoosh.fields import BOOLEAN, DATETIME, ID, NGRAM, SchemaClass, TEXT
from whoosh.index import create_in, exists_in, LockError, open_dir
from whoosh.qparser import MultifieldParser, QueryParser
from whoosh.query import And, Every
from whoosh.writing import IndexWriter as WhooshIndexWriter
import pytz


class IndexManager(object):

    indexname = ''
    schema_class = None

    def __init__(self):
        self.clear_cache()

    def clear_cache(self):
        self._index_cached = None

    def clear_index(self):

        dirname = self.get_dirname()
        schema = self.schema_class()

        if not os.path.exists(dirname):
            os.mkdir(dirname)

        self._index_cached = create_in(dirname, schema, self.indexname)

        return self._index_cached

    def get_dirname(self):
        dirname = getattr(settings, 'WIRECLOUD_INDEX_DIR', 'index')

        if dirname is None:
            raise AttributeError('"dirname" has not been provided.')

        return dirname

    def open_index(self):
        if self._index_cached is not None:
            return self._index_cached

        dirname = self.get_dirname()

        if not os.path.exists(dirname):
            os.mkdir(dirname)

        if not exists_in(dirname, self.indexname):
            schema = self.schema_class()
            self._index_cached = create_in(dirname, schema, self.indexname)
        else:
            self._index_cached = open_dir(dirname, self.indexname)

        return self._index_cached

    def searcher(self):
        return self.open_index().searcher()


class IndexWriter(IndexManager):

    model = None

    def add_resource(self, resource, created=True, render=True):
        if render:
            resource = self.build_compatible_fields(resource)

        with self.get_batch_writer() as writer:
            if created:
                writer.add_document(**resource)
            else:
                writer.update_document(**resource)

    def delete_resource(self, fieldname, text):
        with self.get_batch_writer() as writer:
            writer.delete_by_term(fieldname, force_text(text))

    def build_compatible_fields(self, resource):
        raise NotImplementedError

    def get_batch_writer(self):
        index = self.open_index()
        return SafeWriter(index)

    def get_model(self):
        if self.model is None:
            raise AttributeError('"model" has not been provided.')

        return self.model


def build_fields_adapter(schema):

    bool_fields = []
    date_fields = []
    for fieldname in schema.stored_names():
        if isinstance(schema[fieldname], BOOLEAN):
            bool_fields.append(fieldname)
        elif isinstance(schema[fieldname], DATETIME):
            date_fields.append(fieldname)

    def adapter(hit):
        fields = hit.fields()
        for fieldname in bool_fields:
            if not isinstance(fields[fieldname], bool):
                fields[fieldname] = fields[fieldname].lower() == "true"
        for fieldname in date_fields:
            fields[fieldname] = (fields[fieldname].replace(tzinfo=pytz.utc) - datetime(1970, 1, 1, tzinfo=pytz.utc)).total_seconds()

        return fields

    return adapter


class BaseSearcher(IndexWriter):

    default_search_fields = ('content',)

    def __init__(self, *args, **kwargs):

        schema = self.schema_class()
        self.result_adapter = build_fields_adapter(schema)
        if len(self.default_search_fields) == 1:
            self.parser = QueryParser(self.default_search_fields[0], schema)
        elif len(self.default_search_fields) > 1:
            self.parser = MultifieldParser(self.default_search_fields, schema)
        else:
            raise ValueError('invalid value for the default_search_fields attribute: %s' % self.default_search_fields)

        super(BaseSearcher, self).__init__(*args, **kwargs)

    def restrict_query(self, request):
        return Every()

    def search(self, querytext, request, pagenum=1, maxresults=30):

        user_q = querytext and self.parser.parse(querytext) or Every()
        restricted_q = And([user_q, self.restrict_query(request)])
        result = {}

        if pagenum < 1:
            pagenum = 1

        with self.searcher() as searcher:
            hits = searcher.search(restricted_q, limit=(pagenum * maxresults) + 1)

            if querytext and hits.is_empty():
                corrected = searcher.correct_query(user_q, querytext)

                if corrected.query != user_q:
                    querytext = corrected.string
                    result['corrected_q'] = querytext
                    restricted_q = And([corrected.query, self.restrict_query(request)])
                    hits = searcher.search(restricted_q, limit=(pagenum * maxresults))

            self.prepare_search_response(result, hits, pagenum, maxresults)

        return result

    def prepare_search_response(self, search_result, hits, pagenum, maxresults):
        if hits.has_exact_length():
            search_result['total'] = len(hits)
        else:
            search_result['total'] = hits.estimated_length()

        search_result['pagecount'] = search_result['total'] // maxresults
        if (search_result['total'] % maxresults) != 0:
            search_result['pagecount'] += 1

        if pagenum > search_result['pagecount']:
            pagenum = max(1, search_result['pagecount'])

        search_result['pagenum'] = pagenum
        start = (pagenum - 1) * maxresults
        end = pagenum * maxresults

        search_result['offset'] = start
        search_result['results'] = [self.result_adapter(hit) for hit in hits[start:end]]
        search_result['pagelen'] = len(search_result['results'])

        return search_result


class SafeWriter(WhooshIndexWriter):

    def __init__(self, index, delay=0.25, writerargs=None):
        """
        :param index: the :class:`whoosh.index.Index` to write to.
        :param delay: the delay (in seconds) between attempts to instantiate
            the actual writer.
        :param writerargs: an optional dictionary specifying keyword arguments
            to to be passed to the index's ``writer()`` method.
        """

        self.running = False
        self.index = index
        self.writerargs = writerargs or {}
        self.delay = delay
        self.events = []
        try:
            self.writer = self.index.writer(**self.writerargs)
        except LockError:
            self.writer = None

    def reader(self):
        return self.index.reader()

    def searcher(self, **kwargs):
        from whoosh.searching import Searcher
        return Searcher(self.reader(), fromindex=self.index, **kwargs)

    def _record(self, method, args, kwargs):
        if self.writer:
            getattr(self.writer, method)(*args, **kwargs)
        else:
            self.events.append((method, args, kwargs))

    def delete_document(self, *args, **kwargs):
        self._record("delete_document", args, kwargs)

    def add_document(self, *args, **kwargs):
        self._record("add_document", args, kwargs)

    def update_document(self, *args, **kwargs):
        self._record("update_document", args, kwargs)

    def add_field(self, *args, **kwargs):
        self._record("add_field", args, kwargs)

    def remove_field(self, *args, **kwargs):
        self._record("remove_field", args, kwargs)

    def delete_by_term(self, *args, **kwargs):
        self._record("delete_by_term", args, kwargs)

    def commit(self, *args, **kwargs):
        writer = self.writer
        while writer is None:
            try:
                writer = self.index.writer(**self.writerargs)
            except LockError:
                time.sleep(self.delay)
        for method, evt_args, evt_kwargs in self.events:
            getattr(writer, method)(*evt_args, **evt_kwargs)
        writer.commit(*args, **kwargs)

    def cancel(self, *args, **kwargs):
        if self.writer:
            self.writer.cancel(*args, **kwargs)


class GroupSchema(SchemaClass):

    pk = ID(stored=True, unique=True)
    name = TEXT(stored=True, spelling=True)
    content = NGRAM(minsize=1, phrase=True)


class GroupSearcher(BaseSearcher):

    indexname = 'group'
    model = Group
    schema_class = GroupSchema

    def build_compatible_fields(self, resource):
        fields = {
            'pk': '%s' % resource.pk,
            'name': '%s' % resource.name,
            'content': '%s' % resource.name,
        }

        return fields


class UserSchema(SchemaClass):

    pk = ID(stored=True, unique=True)
    fullname = TEXT(stored=True, spelling=True)
    username = TEXT(stored=True, spelling=True)
    organization = BOOLEAN(stored=True)
    content = NGRAM(minsize=1, phrase=True)


class UserSearcher(BaseSearcher):

    indexname = 'user'
    model = User
    schema_class = UserSchema

    def build_compatible_fields(self, resource):
        try:
            is_organization = resource.organization is not None
        except:
            is_organization = False

        fields = {
            'pk': '%s' % resource.pk,
            'fullname': '%s' % (resource.get_full_name()),
            'username': '%s' % resource.username,
            'organization': '%s' % is_organization,
            'content': '%s %s' % (resource.get_full_name(), resource.username),
        }

        return fields


_available_search_engines = None


def get_available_search_engines():
    global _available_search_engines

    if _available_search_engines is None:
        from wirecloud.catalogue.searchers import CatalogueResourceSearcher
        from wirecloud.platform.workspace.searchers import WorkspaceSearcher

        _available_search_engines = [GroupSearcher(), UserSearcher(), CatalogueResourceSearcher(), WorkspaceSearcher()]

    return _available_search_engines


def is_available(indexname):
    indexnames = [s.indexname for s in get_available_search_engines()]

    return indexname in indexnames


def get_search_engine(indexname):
    for s in get_available_search_engines():
        if s.indexname == indexname:
            return s

    return None


# Fix whoosh bug #453
def remove(self, global_docnum):
    """Removes a document from the collector. Not that this method uses the
    global document number as opposed to :meth:`Collector.collect` which
    takes a segment-relative docnum.
    """

    items = self.items
    for i in xrange(len(items)):
        if items[i][1] == global_docnum:
            items.pop(i)
            self.docset.remove(global_docnum)
            return
    raise KeyError(global_docnum)


Collector.remove = remove
