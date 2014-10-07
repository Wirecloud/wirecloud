# -*- coding: utf-8 -*-

# Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

import os
import time

from django.conf import settings
from django.contrib.auth.models import Group, User
from whoosh.fields import ID, NGRAM, SchemaClass, TEXT
from whoosh.index import create_in, exists_in, LockError, open_dir
from whoosh.qparser import QueryParser
from whoosh.writing import IndexWriter as WhooshIndexWriter


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
        dirname = getattr(settings, 'WIRECLOUD_INDEX_DIR', None)

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

    def build_compatible_fields(self, resource):
        raise NotImplementedError

    def get_batch_writer(self):
        index = self.open_index()
        return SafeWriter(index)

    def get_model(self):
        if self.model is None:
            raise AttributeError('"model" has not been provided.')

        return self.model


class BaseSearcher(IndexWriter):

    fieldname = 'content'

    def search(self, querytext, *args, **kwargs):
        ix = self.open_index()

        user_q = QueryParser(self.fieldname, ix.schema).parse(querytext)
        result = {}

        with self.searcher() as searcher:
            hits = searcher.search(user_q)
            result.update({'results': [hit.fields() for hit in hits]})

        return result

    def search_page(self, result, hits, pagenum, maxresults):
        result['total'] = hits.estimated_length()
        result['pagecount'] = result['total'] // maxresults + 1

        if pagenum > result['pagecount']:
            pagenum = result['pagecount']

        result['pagenum'] = pagenum
        offset = (pagenum - 1) * maxresults

        result['offset'] = offset
        result['results'] = hits[offset:]
        result['pagelen'] = len(result['results'])

        return result


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
    content = NGRAM(phrase=True)


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
    full_name = TEXT(stored=True, spelling=True)
    username = TEXT(stored=True, spelling=True)
    content = NGRAM(phrase=True)


class UserSearcher(BaseSearcher):

    indexname = 'user'
    model = User
    schema_class = UserSchema

    def build_compatible_fields(self, resource):
        fields = {
            'pk': '%s' % resource.pk,
            'full_name': '%s' % (resource.get_full_name()),
            'username': '%s' % resource.username,
            'content': '%s %s' % (resource.get_full_name(), resource.username),
        }

        return fields


_available_search_engines = None
def get_available_search_engines():
    global _available_search_engines

    if _available_search_engines is None:
        from wirecloud.catalogue.models import CatalogueResourceSearcher

        _available_search_engines = [GroupSearcher(), UserSearcher(), CatalogueResourceSearcher()]

    return _available_search_engines


def is_available(indexname):
    indexnames = [s.indexname for s in get_available_search_engines()]

    return indexname in indexnames


def get_search_engine(indexname):
    for s in get_available_search_engines():
        if s.indexname == indexname:
            return s

    return None
