# -*- coding: utf-8 -*-

# Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.contrib.auth.models import Group, User
from haystack import indexes
from haystack.query import SearchQuerySet as HaystackSearchQuerySet
from haystack import connections

from wirecloud.commons.haystack_queryparser import ParseSQ


# Binds Haystack SearchQuerySet to the custom GroupedSearchQuerySets
class SearchQuerySet(HaystackSearchQuerySet):

    def _clone(self, klass=None):
        if klass is None:
            klass = connections[self.query._using].queryset

        return super(SearchQuerySet, self)._clone(klass)


_available_search_engines = None


def get_available_search_engines():
    global _available_search_engines

    if _available_search_engines is None:
        from wirecloud.catalogue.search_indexes import searchCatalogueResource
        from wirecloud.platform.search_indexes import searchWorkspace

        _available_search_engines = {"group": searchGroup, "user": searchUser, "catalogueresource": searchCatalogueResource, "workspace": searchWorkspace}

    return _available_search_engines


def is_available(indexname):
    return indexname in get_available_search_engines()


def get_search_engine(indexname):
    return get_available_search_engines().get(indexname)


# Clean search results
def buildSearchResults(sqs, pagenum, maxresults, clean, request=None):
    # Count how many docs there are
    total = sqs._clone().count()

    # If the selected page is out of bounds, get the last page
    if total == 0:
        pagenum = 1
    elif pagenum > total // maxresults:
        pagenum = total // maxresults
        if (total % maxresults) != 0:
            pagenum += 1

    sqs.query.set_limits(low=(pagenum - 1) * maxresults, high=pagenum * maxresults)
    res = sqs.query.get_results()

    results = [clean(result, request) for result in res]

    # Build response data
    return prepare_search_response(results, total, pagenum, maxresults)


# Build response structure
def prepare_search_response(search_results, hits, pagenum, maxresults):
    search_result = {}
    search_result['total'] = hits

    search_result['pagecount'] = search_result['total'] // maxresults
    if (search_result['total'] % maxresults) != 0:
        search_result['pagecount'] += 1

    if pagenum > search_result['pagecount']:
        pagenum = max(1, search_result['pagecount'])

    search_result['pagenum'] = pagenum
    start = (pagenum - 1) * maxresults

    search_result['offset'] = start
    search_result['results'] = search_results
    search_result['pagelen'] = len(search_results)

    return search_result


USER_CONTENT_FIELDS = ["fullname", "username"]


class UserIndex(indexes.SearchIndex, indexes.Indexable):

    text = indexes.CharField(document=True)

    fullname = indexes.NgramField()
    username = indexes.NgramField(model_attr='username')
    organization = indexes.CharField()

    def get_model(self):
        return User

    def prepare(self, object):
        self.prepared_data = super(UserIndex, self).prepare(object)

        try:
            is_organization = object.organization is not None
        except:
            is_organization = False

        self.prepared_data['fullname'] = '%s' % (object.get_full_name())
        self.prepared_data['organization'] = '%s' % is_organization
        self.prepared_data['text'] = '%s %s' % (object.get_full_name(), object.username)

        return self.prepared_data


# Search for users
def searchUser(request, querytext, pagenum, maxresults):
    sqs = SearchQuerySet().models(User).all()
    if len(querytext) > 0:
        parser = ParseSQ()
        query = parser.parse(querytext, USER_CONTENT_FIELDS)
        # If there's any query
        if len(query) > 0:
            sqs = sqs.filter(query)

    return buildSearchResults(sqs, pagenum, maxresults, cleanResults)


def cleanResults(result, request):
    res = result.get_stored_fields()
    del res["text"]
    return res


GROUP_CONTENT_FIELDS = ["name"]


class GroupIndex(indexes.SearchIndex, indexes.Indexable):
    text = indexes.CharField(document=True)

    name = indexes.CharField(model_attr='name')

    def get_model(self):
        return Group


# Search for groups
def searchGroup(request, querytext, pagenum, maxresults):
    sqs = SearchQuerySet().models(Group).all()
    if len(querytext) > 0:
        parser = ParseSQ()
        query = parser.parse(querytext, GROUP_CONTENT_FIELDS)
        # If there's any query
        if len(query) > 0:
            sqs = sqs.filter(query)

    return buildSearchResults(sqs, pagenum, maxresults, cleanResults)
