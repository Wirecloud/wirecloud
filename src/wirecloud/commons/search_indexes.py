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

from datetime import datetime
import os
import time

from django.conf import settings
from django.contrib.auth.models import Group, User
from haystack import indexes
from haystack.query import SearchQuerySet as HaystackSearchQuerySet
from haystack import connections


# Binds Haystack SearchQuerySet to the custom GroupedSearchQuerySets
class SearchQuerySet(HaystackSearchQuerySet):

    def _clone(self, klass=None):
        if klass is None:
            klass = connections[self.query._using].queryset

        return super(SearchQuerySet, self)._clone(klass)


# Clean search results
def buildSearchResults(sqs, pagenum, maxresults, clean):
    # Take current page
    sqs.query.set_limits(low=(pagenum - 1) * maxresults, high=pagenum * maxresults - 1)
    res = sqs.query.get_results()
    total = len(res)

    results = [clean(result) for result in res]

    # Build response data
    return prepare_search_response(results, total, pagenum, maxresults)


# Build response structure
def prepare_search_response(hits, total, pagenum, maxresults):
    search_result = {}
    search_result['total'] = total

    search_result['pagecount'] = search_result['total'] // maxresults
    if (search_result['total'] % maxresults) != 0:
        search_result['pagecount'] += 1

    search_result['pagenum'] = pagenum
    start = (pagenum - 1) * maxresults

    search_result['offset'] = start
    search_result['results'] = hits
    search_result['pagelen'] = len(search_result['results'])

    return search_result


class UserIndex(indexes.SearchIndex, indexes.Indexable):

    text = indexes.CharField(document=True)

    fullname = indexes.CharField()
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
def searchUser(querytext, pagenum, maxresults):
    sqs = SearchQuerySet().models(User).all().filter(text__contains=querytext) #añadir set_limits
    return buildSearchResults(sqs, pagenum, maxresults, cleanResults)


def cleanResults(result):
    res = result.get_stored_fields()
    del res["text"]
    return res;


class GroupIndex(indexes.SearchIndex, indexes.Indexable):
    text = indexes.CharField(document=True)

    name = indexes.CharField(model_attr='name')

    def get_model(self):
        return Group

    def prepare(self, object):
        self.prepared_data = super(UserIndex, self).prepare(object)

        self.prepared_data['text'] = object.name

        return self.prepared_data


# Search for groups
def searchGroup(querytext, pagenum, maxresults):
    sqs = SearchQuerySet().models(group).all().filter(text__contains=querytext) #añadir set_limits
    return buildSearchResults(sqs, pagenum, maxresults, cleanResults)