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

from django.db.models import Q
from haystack import indexes

from wirecloud.platform.models import Workspace
from wirecloud.commons.search_indexes import buildSearchResults, SearchQuerySet
from wirecloud.commons.haystack_queryparser import ParseSQ


CONTENT_FIELDS = ["owner", "name"]


class WorkspaceIndex(indexes.SearchIndex, indexes.Indexable):

    text = indexes.CharField(document=True)
    name = indexes.EdgeNgramField(model_attr='name', boost=1.3)
    title = indexes.EdgeNgramField(model_attr='title', boost=1.3)

    description = indexes.CharField(model_attr='description')
    longdescription = indexes.CharField(model_attr='longdescription')
    public = indexes.CharField(model_attr="public")

    searchable = indexes.CharField(model_attr="searchable", stored=False)

    lastmodified = indexes.CharField()
    owner = indexes.CharField()
    users = indexes.MultiValueField()
    groups = indexes.MultiValueField()
    shared = indexes.CharField()

    def get_model(self):
        return Workspace

    def prepare(self, object):
        self.prepared_data = super(WorkspaceIndex, self).prepare(object)

        if object.last_modified is not None:
            lastmodified = "%s" % datetime.utcfromtimestamp(object.last_modified / 1e3)
        else:
            lastmodified = "%s" % datetime.utcfromtimestamp(object.creation_date / 1e3)

        self.prepared_data["lastmodified"] = lastmodified
        self.prepared_data["owner"] = object.creator.username
        self.prepared_data["users"] = ', '.join(object.users.all().values_list('username', flat=True))
        self.prepared_data["groups"] = ', '.join(object.groups.all().values_list('name', flat=True))
        self.prepared_data["shared"] = object.is_shared()

        return self.prepared_data


def searchWorkspace(request, querytext, pagenum, maxresults):
    sqs = SearchQuerySet().models(Workspace).all()

    # Only searchable results
    sqs = sqs.filter(searchable=1)

    if len(querytext) > 0:
        parser = ParseSQ()
        query = parser.parse(querytext, CONTENT_FIELDS)

        # If there's any query
        if len(query) > 0:
            sqs = sqs.filter(query)

    q = Q(public=True) | Q(users=request.user.username) | Q(groups=request.user.groups.name)
    sqs = sqs.filter(q)

    # Build response data
    return buildSearchResults(sqs, pagenum, maxresults, cleanResults)


def cleanResults(result, request):
    res = result.get_stored_fields()
    del res["text"]
    return res
