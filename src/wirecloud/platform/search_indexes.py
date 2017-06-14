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

from wirecloud.platform.models import Workspace
from wirecloud.commons.search_indexes import buildSearchResults, SearchQuerySet

from haystack import indexes


class WorkspaceIndex(indexes.SearchIndex, indexes.Indexable):

    text = indexes.CharField(document=True)

    name = indexes.CharField(model_attr='name')
    description = indexes.CharField(model_attr='description')
    longdescription = indexes.CharField(model_attr='longdescription')
    public = indexes.CharField(model_attr="public")

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

        self.prepared_data["text"] = "%s %s" % (object.creator, object.name)

        self.prepared_data["lastmodified"] = lastmodified
        self.prepared_data["owner"] = object.creator
        self.prepared_data["users"] = ', '.join(object.users.all().values_list('username', flat=True))
        self.prepared_data["groups"] = ', '.join(object.groups.all().values_list('name', flat=True))
        self.prepared_data["shared"] = object.is_shared()

        return self.prepared_data


def searchWorkspace(request, querytext, pagenum, maxresults):
    sqs = SearchQuerySet().models(Workspace).filter(text__contains=querytext)

    q = Q(public=True) | Q(users=request.user.username) | Q(groups=request.user.groups.name)
    sqs = sqs.filter(q)

    # Build response data
    return buildSearchResults(sqs, pagenum, maxresults, cleanResults)


def cleanResults(result, request):
    res = result.get_stored_fields()
    del res["text"]
    return res
