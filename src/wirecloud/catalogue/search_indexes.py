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

from six.moves.urllib.parse import urlparse, urljoin

from django.db.models import Q

from wirecloud.catalogue.models import CatalogueResource, get_template_url
from wirecloud.commons.search_indexes import buildSearchResults, SearchQuerySet
from wirecloud.commons.utils.version import Version
from wirecloud.commons.utils.http import get_absolute_reverse_url

from haystack import indexes


class CatalogueResourceIndex(indexes.SearchIndex, indexes.Indexable):

    text = indexes.CharField(document=True)

    from wirecloud.commons.haystack_backends.solr_backend import GroupedSolrSearchBackend
    if isinstance(SearchQuerySet().query.backend, GroupedSolrSearchBackend):
        vendor_name = indexes.CharField()
    else:
        vendor_name = indexes.MultiValueField()

    vendor = indexes.EdgeNgramField(model_attr='vendor')
    name = indexes.EdgeNgramField(model_attr="short_name")
    version = indexes.CharField(model_attr='version')
    version_sortable = indexes.CharField()
    template_uri = indexes.CharField(model_attr="template_uri")
    type = indexes.CharField(model_attr='type')
    creation_date = indexes.CharField(model_attr="creation_date")
    public = indexes.CharField(model_attr="public")

    title = indexes.EdgeNgramField()
    endpoint_descriptions = indexes.EdgeNgramField()

    description = indexes.NgramField()
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
        self.prepared_data["endpoint_descriptions"] = endpoint_descriptions

        types = ["widget", "mashup", "operator"]

        self.prepared_data["type"] = types[object.type]
        self.prepared_data["users"] = ', '.join(object.users.all().values_list('username', flat=True))
        self.prepared_data["groups"] = ', '.join(object.groups.all().values_list('name', flat=True))

        self.prepared_data["version_sortable"] = buildVersionSortable(object.version);
        self.prepared_data['vendor_name'] = '%s/%s' % (object.vendor, object.short_name)
        self.prepared_data['title'] = resource_info['title']
        self.prepared_data['description'] = resource_info['description']
        self.prepared_data['image'] = resource_info['image']
        self.prepared_data['smartphoneimage'] = resource_info['smartphoneimage']

        return self.prepared_data

def buildVersionSortable(version, length=5):
    result = "";

    ver = Version(version)

    # Version number
    for v in ver.version:

        prefix = ""
        count = len(str(v))

        for t in range (0, length - count):
            prefix += "0"

        result += prefix + "%d." % v

    # Prerelease
    prerelease = ver.prerelease
    if prerelease is not None:
        # prerelease letter
        result+= prerelease[0]

        #prerelease number
        prefix = ""
        count = len(str(prerelease[1]))

        for t in range (0, length - count):
            prefix += "0"

        result += prefix + "%d." % prerelease[1]

    return result;


def searchCatalogueResource(querytext, request, pagenum=1, maxresults=30, staff=False, scope=None, orderby='-creation_date'):
    sqs = SearchQuerySet().models(CatalogueResource).all()

    #import ipdb; ipdb.sset_trace()

    if len(querytext) > 0:
        q = Q(name=querytext) | Q(vendor=querytext) | Q(version=querytext) | Q(type__contains=querytext) | Q(title=querytext) | Q(description=querytext) | Q(endpoint_descriptions=querytext)
        sqs = sqs.filter(q)

    sqs = sqs.order_by(orderby).group_by('vendor_name', order_by='-version_sortable')

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
    return buildSearchResults(sqs, pagenum, maxresults, cleanResults, request)


def cleanResults(document, request):
    results = document.documents

    res = results[0].get_stored_fields()

    others = []

    for i in range(1, len(results)):
        others.append(results[i].version)

    res["pk"] = results[0].pk
    res["others"] = others

    add_absolute_urls(res, request)

    del res["users"]
    del res["groups"]
    del res["text"]
    return res

def add_absolute_urls(hit, request=None):

    base_url = get_template_url(hit['vendor'], hit['name'], hit['version'], hit['template_uri'], request=request)
    hit['uri'] = "/".join((hit['vendor'], hit['name'], hit['version']))
    hit['image'] = "" if hit['image'] == '' else urljoin(base_url, hit['image'])
    hit['smartphoneimage'] = "" if hit['image'] == '' else urljoin(base_url, hit['smartphoneimage'])


from django.dispatch import receiver
from django.db.models.signals import m2m_changed
@receiver(m2m_changed, sender=CatalogueResource.users.through)
def reindex_catalogue(sender, **kwargs):
    CatalogueResourceIndex().update_object(kwargs['instance'])
