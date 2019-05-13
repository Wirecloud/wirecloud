# -*- coding: utf-8 -*-

# Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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

from urllib.parse import urljoin

from django.db.models import Q
from haystack import indexes

from wirecloud.catalogue.models import CatalogueResource, get_template_url
from wirecloud.commons.haystack_fields import BooleanField
from wirecloud.commons.haystack_queryparser import ParseSQ
from wirecloud.commons.search_indexes import buildSearchResults, SearchQuerySet
from wirecloud.commons.utils.version import Version


CONTENT_FIELDS = ["name", "vendor", "version", "type", "title", "description", "endpoint_descriptions"]


class ResourceIndex(indexes.SearchIndex, indexes.Indexable):
    model = CatalogueResource

    text = indexes.CharField(document=True, stored=False)

    group_field = indexes.FacetField(facet_for="vendor_name")
    vendor_name = indexes.CharField()

    vendor = indexes.EdgeNgramField(model_attr='vendor')
    name = indexes.EdgeNgramField(model_attr="short_name", boost=1.5)
    version = indexes.CharField(model_attr='version')
    version_sortable = indexes.FloatField()
    description_url = indexes.CharField(model_attr="template_uri")
    type = indexes.CharField(model_attr='type')
    creation_date = indexes.DateTimeField(model_attr="creation_date")
    public = BooleanField(model_attr="public")

    title = indexes.NgramField(boost=1.5)
    endpoint_descriptions = indexes.EdgeNgramField(stored=False)

    description = indexes.NgramField()
    wiring = indexes.CharField()
    image = indexes.CharField()
    smartphoneimage = indexes.CharField()

    users = indexes.MultiValueField(stored=False)
    groups = indexes.MultiValueField(stored=False)
    input_friendcodes = indexes.MultiValueField()
    output_friendcodes = indexes.MultiValueField()

    def get_model(self):
        return self.model

    def should_update(self, instance, **kwargs):
        if instance.template_uri == "":
            self.remove_object(instance, **kwargs)
        return instance.template_uri != ""

    def prepare(self, object):
        self.prepared_data = super(ResourceIndex, self).prepare(object)
        resource_info = object.get_processed_info(process_urls=False)

        endpoint_descriptions = ''
        input_friendcodes = set()
        output_friendcodes = set()

        for endpoint in resource_info['wiring']['inputs']:
            endpoint_descriptions += endpoint['description'] + ' '
            input_friendcodes.update(endpoint['friendcode'].split(' '))

        for endpoint in resource_info['wiring']['outputs']:
            endpoint_descriptions += endpoint['description'] + ' '
            output_friendcodes.update(endpoint['friendcode'].split(' '))
        self.prepared_data["endpoint_descriptions"] = endpoint_descriptions
        self.prepared_data["input_friendcodes"] = tuple(input_friendcodes)
        self.prepared_data["output_friendcodes"] = tuple(output_friendcodes)

        # TODO This is required as elasticsearch has problems with "operator"
        types = ["_widget_", "_mashup_", "_operator_"]

        self.prepared_data["type"] = types[object.type]
        self.prepared_data["users"] = tuple(object.users.all().values_list('id', flat=True))
        self.prepared_data["groups"] = tuple(object.groups.all().values_list('id', flat=True))

        self.prepared_data["version_sortable"] = buildVersionSortable(object.version)
        self.prepared_data['vendor_name'] = '%s/%s' % (object.vendor, object.short_name)
        self.prepared_data['title'] = resource_info['title']
        self.prepared_data['description'] = resource_info['description']
        self.prepared_data['image'] = resource_info['image']
        self.prepared_data['smartphoneimage'] = resource_info['smartphoneimage']

        return self.prepared_data


def buildVersionSortable(version, length=5):

    code = 0
    ver = Version(version)

    code += ver.version[0] * 1000 * 1000
    code += ver.version[1] * 1000 if len(ver.version) > 1 else 0
    code += ver.version[2] if len(ver.version) > 2 else 0

    # Prerelease
    prerelease = ver.prerelease
    if prerelease is None:
        code += .999
    elif prerelease[0] == "a":
        code += prerelease[1] / 1000
    elif prerelease[0] == "b":
        code += (100 + prerelease[1]) / 1000
    else:  # prerelease[0:1] == "rc"
        code += (200 + prerelease[1]) / 1000

    return code


def searchResource(querytext, request, pagenum=1, maxresults=30, staff=False, scope=None, orderby=('-creation_date',)):
    sqs = SearchQuerySet().models(CatalogueResource).all()

    if len(querytext) > 0:
        parser = ParseSQ()
        query = parser.parse(querytext, CONTENT_FIELDS)
        # If there's any query
        if len(query) > 0:
            sqs = sqs.filter(query)

    sqs = sqs.order_by(*orderby).group_by("group_field", order_by='-version_sortable')

    # Filter resource type
    if scope is not None and len(scope) > 0:
        q = Q(type='_%s_' % scope.pop())
        for s in scope:
            q |= Q(type='_%s_' % s)
        sqs = sqs.filter(q)

    # Filter available only
    if not staff:
        q = Q(public=True) | Q(users=request.user.id)

        # Add group filters
        for group in request.user.groups.values_list('id', flat=True):
            q |= Q(groups=group)
        sqs = sqs.filter(q)

    # Build response data
    return buildSearchResults(sqs, pagenum, maxresults, cleanResults, request)


def cleanResults(document, request):
    results = document.documents

    res = results[0].get_stored_fields()

    others = []

    for i in range(1, len(results)):
        others.append(results[i].version)

    res["pk"] = results[0].pk
    res["others"] = others
    res["creation_date"] = res["creation_date"].isoformat()
    # TODO This is required as elasticsearch has problems with "operator"
    res["type"] = res["type"][1:-1]
    add_absolute_urls(res, request)

    del res["group_field"]
    del res["version_sortable"]
    return res


def add_absolute_urls(hit, request=None):

    base_url = get_template_url(hit['vendor'], hit['name'], hit['version'], hit['description_url'], request=request)
    hit['uri'] = "/".join((hit['vendor'], hit['name'], hit['version']))
    hit['image'] = "" if not hit['image'] or hit['image'] == '' else urljoin(base_url, hit['image'])
    hit['smartphoneimage'] = "" if not hit['smartphoneimage'] or hit['smartphoneimage'] == '' else urljoin(base_url, hit['smartphoneimage'])
    hit['description_url'] = urljoin(base_url, hit['description_url'])
