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

from django.db.models import Q

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.search_indexes import buildSearchResults, SearchQuerySet

from haystack import indexes


class CatalogueResourceIndex(indexes.SearchIndex, indexes.Indexable):

    text = indexes.CharField(document=True)

    from wirecloud.commons.haystack_backends.solr_backend import GroupedSolrSearchBackend
    if isinstance(SearchQuerySet().query.backend, GroupedSolrSearchBackend):
        vendor_name = indexes.CharField()
    else:
        vendor_name = indexes.MultiValueField()

    vendor = indexes.CharField(model_attr='vendor')
    name = indexes.EdgeNgramField(model_attr="short_name")
    version = indexes.CharField(model_attr='version')
    template_uri = indexes.CharField(model_attr="template_uri")
    type = indexes.CharField(model_attr='type')
    creation_date = indexes.CharField(model_attr="creation_date")
    public = indexes.CharField(model_attr="public")

    title = indexes.EdgeNgramField()

    description = indexes.EdgeNgramField()
    wiring = indexes.CharField()
    image = indexes.CharField()
    smartphoneimage = indexes.CharField()

    users = indexes.MultiValueField()
    groups = indexes.MultiValueField()
    input_friendcodes = indexes.MultiValueField()
    output_friendcodes = indexes.MultiValueField()

    def get_model(self):
        return CatalogueResource

    def prepare(self, object):
        self.prepared_data = super(CatalogueResourceIndex, self).prepare(object)
        resource_info = object.get_processed_info(process_urls=False)

        endpoint_descriptions = ''
        input_friendcodes = []
        output_friendcodes = []

        for endpoint in resource_info['wiring']['inputs']:
            endpoint_descriptions += endpoint['description'] + ' '
            input_friendcodes.extend(endpoint['friendcode'].split(' '))

        for endpoint in resource_info['wiring']['outputs']:
            endpoint_descriptions += endpoint['description'] + ' '
            output_friendcodes.extend(endpoint['friendcode'].split(' '))

        types = ["widget", "mashup", "operator"]

        self.prepared_data["type"] = types[object.type]
        self.prepared_data["users"] = ', '.join(object.users.all().values_list('username', flat=True))
        self.prepared_data["groups"] = ', '.join(object.groups.all().values_list('name', flat=True))

        self.prepared_data['vendor_name'] = '%s/%s' % (object.vendor, object.short_name)
        self.prepared_data['title'] = resource_info['title']
        self.prepared_data['description'] = resource_info['description']
        self.prepared_data['image'] = resource_info['image']
        self.prepared_data['smartphoneimage'] = resource_info['smartphoneimage']

        return self.prepared_data


def searchCatalogueResource(querytext, request, pagenum=1, maxresults=30, staff=False, scope=None, orderby='-creation_date'):
    sqs = SearchQuerySet().models(CatalogueResource)

    if len(querytext) > 0:
        q = Q(name=querytext) | Q(version=querytext) | Q(type__contains=querytext) | Q(title=querytext) | Q(description=querytext)
        sqs = sqs.filter(q)

    sqs = sqs.order_by(orderby).group_by('vendor_name', order_by='-version')

    # Filter resource type
    q = None
    if scope is not None:
        for s in scope:
            if q is None:
                q = Q(type=s)
            else:
                q |= Q(type=s)

        sqs = sqs.filter(q)

    # Filter available only
    if not staff:
        q = Q(public=True) | Q(users=request.user.username) | Q(groups=request.user.groups.name)
    else:
        q = Q(public=True) | Q(public=False) # Without this filter it does not work (?)
    sqs = sqs.filter(q)

    # Build response data
    return buildSearchResults(sqs, pagenum, maxresults, cleanResults)


def cleanResults(document):
    results = document.documents

    res = results[0].get_stored_fields()

    others = []

    for i in range(1, len(results)):
        others.append(results[i].version)

    res["pk"] = results[0].pk
    res["uri"] = "%s/%s/%s" % (results[0].vendor, results[0].short_name, results[0].version)
    res["others"] = others

    del res["users"]
    del res["groups"]
    del res["text"]
    return res
