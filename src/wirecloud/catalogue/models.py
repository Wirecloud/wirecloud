# -*- coding: utf-8 -*-

# Copyright (c) 2011-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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
import random
import regex
from six import string_types
from six.moves.urllib.parse import urlparse, urljoin

from django.conf import settings
from django.contrib.auth.models import User, Group
from django.core.cache import cache
from django.db import models
from django.db.models.signals import m2m_changed, post_save
from django.dispatch import receiver
from django.utils.encoding import python_2_unicode_compatible
from django.utils.translation import ugettext_lazy as _
from whoosh import index
from whoosh import fields
from whoosh.qparser import MultifieldParser, QueryParser
from whoosh.query import And, Every, Or, Term
from whoosh.sorting import FieldFacet, FunctionFacet

from wirecloud.commons.searchers import BaseSearcher, get_search_engine
from wirecloud.commons.utils.http import get_absolute_reverse_url
from wirecloud.commons.utils.template.parsers import TemplateParser


@python_2_unicode_compatible
class CatalogueResource(models.Model):

    RESOURCE_TYPES = ('widget', 'mashup', 'operator')
    RESOURCE_MIMETYPES = ('application/x-widget+mashable-application-component', 'application/x-mashup+mashable-application-component', 'application/x-operator+mashable-application-component')
    TYPE_CHOICES = (
        (0, 'Widget'),
        (1, 'Mashup'),
        (2, 'Operator'),
    )

    vendor = models.CharField(_('Vendor'), max_length=250)
    short_name = models.CharField(_('Name'), max_length=250)
    version = models.CharField(_('Version'), max_length=150)
    type = models.SmallIntegerField(_('Type'), choices=TYPE_CHOICES, null=False, blank=False)

    # Person who added the resource to catalogue!
    creator = models.ForeignKey(User, null=True, blank=True, related_name='uploaded_resources')
    public = models.BooleanField(_('Available to all users'), default=False)
    users = models.ManyToManyField(User, verbose_name=_('Users'), related_name='local_resources', blank=True)
    groups = models.ManyToManyField(Group, verbose_name=_('Groups'), related_name='local_resources', blank=True)

    creation_date = models.DateTimeField('creation_date')
    template_uri = models.CharField(_('templateURI'), max_length=200, blank=True)

    popularity = models.DecimalField(_('popularity'), default=0, max_digits=2, decimal_places=1)

    json_description = models.TextField(_('JSON description'))

    @property
    def local_uri_part(self):

        return self.vendor + '/' + self.short_name + '/' + self.version

    @property
    def cache_version(self):
        version = cache.get('_catalogue_resource_version/' + str(self.id))
        if version is None:
            version = random.randrange(1, 100000)
            cache.set('_catalogue_resource_version/' + str(self.id), version)

        return version

    def is_available_for(self, user):

        return self.public or self.users.filter(id=user.id).exists() or len(set(self.groups.all()) & set(user.groups.all())) > 0

    def get_template_url(self, request=None, for_base=False):
        return get_template_url(self.vendor, self.short_name, self.version, '' if for_base else self.template_uri, request=request)

    def get_template(self, request=None):

        template_uri = self.get_template_url(request=request)
        parser = TemplateParser(self.json_description, base=template_uri)
        return parser

    def get_processed_info(self, request=None, lang=None, process_urls=True):

        parser = self.get_template(request)
        return parser.get_resource_processed_info(lang=lang, process_urls=process_urls)

    def delete(self, *args, **kwargs):

        from wirecloud.catalogue.utils import wgt_deployer

        # Delete media resources if needed
        if not self.template_uri.startswith(('http', 'https')):
            wgt_deployer.undeploy(self.vendor, self.short_name, self.version)

        old_id = self.id
        super(CatalogueResource, self).delete(*args, **kwargs)

        # Remove cache for this resource
        try:
            cache.incr('_catalogue_resource_version/' + str(old_id))
        except ValueError:
            pass

        # Remove document from search indexes
        try:
            with get_search_engine('resource').get_batch_writer() as writer:
                writer.delete_by_term('pk', '%s' % old_id)
        except:
            pass  # ignore errors

    def resource_type(self):
        return self.RESOURCE_TYPES[self.type]

    @property
    def mimetype(self):
        return self.RESOURCE_MIMETYPES[self.type]

    class Meta:
        unique_together = ("short_name", "vendor", "version")

    def __str__(self):
        return self.local_uri_part


class CatalogueResourceSchema(fields.SchemaClass):

    pk = fields.ID(stored=True, unique=True)
    vendor_name = fields.ID
    name = fields.TEXT(stored=True)
    vendor = fields.TEXT(stored=True, spelling=True)
    version = fields.TEXT(stored=True)
    template_uri = fields.STORED
    type = fields.TEXT(stored=True)
    creation_date = fields.DATETIME
    title = fields.TEXT(stored=True, spelling=True)
    image = fields.STORED
    smartphoneimage = fields.STORED
    description = fields.TEXT(stored=True, spelling=True)
    wiring = fields.TEXT(spelling=True)
    public = fields.BOOLEAN
    users = fields.KEYWORD(commas=True)
    groups = fields.KEYWORD(commas=True)
    content = fields.NGRAMWORDS()


class CatalogueResourceSearcher(BaseSearcher):

    indexname = 'resource'
    model = CatalogueResource
    schema_class = CatalogueResourceSchema

    def build_compatible_fields(self, resource):

        resource_info = resource.get_processed_info(process_urls=False)

        endpoint_descriptions = ''

        for endpoint in resource_info['wiring']['inputs']:
            endpoint_descriptions += endpoint['description'] + ' '

        for endpoint in resource_info['wiring']['outputs']:
            endpoint_descriptions += endpoint['description'] + ' '

        content = ' '.join([resource_info['description'],
                            resource_info['title'],
                            resource.short_name,
                            resource.vendor,
                            endpoint_descriptions])

        fields = {
            'pk': '%s' % resource.pk,
            'vendor_name': '%s/%s' % (resource.vendor, resource.short_name),
            'vendor': '%s' % resource.vendor,
            'name': '%s' % resource.short_name,
            'version': resource_info['version'],
            'template_uri': resource.template_uri,
            'type': resource_info['type'],
            'creation_date': resource.creation_date.utcnow(),
            'public': resource.public,
            'title': resource_info['title'],
            'description': resource_info['description'],
            'wiring': endpoint_descriptions,
            'image': resource_info['image'],
            'smartphoneimage': resource_info['smartphoneimage'],
            'users': ', '.join(resource.users.all().values_list('username', flat=True)),
            'groups': ', '.join(resource.groups.all().values_list('name', flat=True)),
            'content': content,
        }

        return fields


def get_template_url(vendor, name, version, url, request=None):

    if urlparse(url).scheme == '':
        template_url = get_absolute_reverse_url('wirecloud_catalogue.media', kwargs={
            'vendor': vendor,
            'name': name,
            'version': version,
            'file_path': url
        }, request=request)
    else:
        template_url = url

    return template_url


def cmp(a, b):
    return (a > b) - (a < b)


class Version(object):

    version_re = regex.compile(r'^([1-9]\d*|0)((?:\.(?:[1-9]\d*|0))*)(?:(a|b|rc)([1-9]\d*))?$')

    def __init__(self, vstring, reverse=False):

        match = self.version_re.match(vstring)

        if not match:
            raise ValueError("invalid version number '%s'" % vstring)

        (major, patch, prerelease, prerelease_num) = match.group(1, 2, 3, 4)

        if patch:
            self.version = tuple(map(int, [major] + patch[1:].split('.')))
        else:
            self.version = (int(major),)

        if prerelease:
            self.prerelease = (prerelease, int(prerelease_num))
        else:
            self.prerelease = None

        self.reverse = reverse

    def __cmp__(self, other):

        if isinstance(other, string_types):
            other = Version(other)

        if not isinstance(other, Version):
            raise ValueError("invalid version number '%s'" % other)

        maxlen = max(len(self.version), len(other.version))
        compare = cmp(self.version + (0,)*(maxlen - len(self.version)), other.version + (0,)*(maxlen - len(other.version)))

        if compare == 0:

            # case 1: neither has prerelease; they're equal
            if not self.prerelease and not other.prerelease:
                compare = 0

            # case 2: self has prerelease, other doesn't; other is greater
            elif self.prerelease and not other.prerelease:
                compare = -1

            # case 3: self doesn't have prerelease, other does: self is greater
            elif not self.prerelease and other.prerelease:
                compare = 1

            # case 4: both have prerelease: must compare them!
            elif self.prerelease and other.prerelease:
                compare = cmp(self.prerelease, other.prerelease)

        return compare if not self.reverse else (compare * -1)

    def __eq__(self, other):
        return self.__cmp__(other) == 0

    def __lt__(self, other):
        return self.__cmp__(other) < 0

    def __gt__(self, other):
        return self.__cmp__(other) > 0


@receiver(post_save, sender=CatalogueResource)
def update_catalogue_index(sender, instance, created, **kwargs):
    get_search_engine('resource').add_resource(instance, created)


@receiver(m2m_changed, sender=CatalogueResource.groups.through)
@receiver(m2m_changed, sender=CatalogueResource.users.through)
def update_users_or_groups(sender, instance, action, reverse, model, pk_set, using, **kwargs):
    if reverse or action.startswith('pre_') or (pk_set is not None and len(pk_set) == 0):
        return

    update_catalogue_index(sender, instance, False)


def add_absolute_urls(results, request=None):

    for hit in results:
        base_url = get_template_url(hit['vendor'], hit['name'], hit['version'], hit['template_uri'], request=request)
        hit['uri'] = "/".join((hit['vendor'], hit['name'], hit['version']))
        hit['image'] = urljoin(base_url, hit['image'])
        hit['smartphoneimage'] = urljoin(base_url, hit['smartphoneimage'])


def add_other_versions(searcher, hits, user, staff):

    results = [hit.fields() for hit in hits]
    allow_q = []

    if not staff:
        allow_q = [Or([Term('public', 't'), Term('users', user.username.lower())] +
            [Term('groups', group.name.lower()) for group in user.groups.all()])]

    for result in results:
        user_q = And([Term('vendor_name', '%s/%s' % (result['vendor'], result['name']))] + allow_q)
        version_results = [h.fields()['version'] for h in searcher.search(user_q)]
        result['others'] = [v for v in version_results if v != result['version']]

    return results


def build_search_kwargs(user_q, request, types, staff, orderby):

    if not staff:
        user_q = And([user_q, Or([Term('public', 't'), Term('users', request.user.username)] +
            [Term('groups', group.name) for group in request.user.groups.all()])])

    if types and len(types) > 0:
        user_q = And([user_q, Or([Term('type', resource_type) for resource_type in types])])

    orderby_f = FieldFacet(orderby.replace('-', ''), reverse=orderby.find('-') > -1)

    search_kwargs = {
        'sortedby': [orderby_f],
        'collapse': FieldFacet('vendor_name'),
        'collapse_limit': 1,
        'collapse_order': FunctionFacet(order_by_version)
    }

    return (user_q, search_kwargs)


def search(querytext, request, pagenum=1, maxresults=30, staff=False, scope=None,
           orderby='-creation_date'):

    search_engine = get_search_engine('resource')
    search_result = {}

    if pagenum < 1:
        pagenum = 1

    with search_engine.searcher() as searcher:

        fieldnames = ['description', 'vendor', 'title', 'wiring']
        query_p = QueryParser('content', searcher.schema)
        multif_p = MultifieldParser(fieldnames, searcher.schema)

        user_q = querytext and query_p.parse(querytext) or Every()
        user_q, search_kwargs = build_search_kwargs(user_q, request, scope, staff, orderby)
        hits = searcher.search(user_q, limit=(pagenum * maxresults) + 1, **search_kwargs)

        if querytext and hits.is_empty():

            # TODO currently searches from BufferedWriters give problems when correcting queries
            with search_engine.open_index().searcher() as corrector:
                correction_q = multif_p.parse(querytext)
                corrected = corrector.correct_query(correction_q, querytext)

            if corrected.query != correction_q:
                querytext = corrected.string
                search_result['corrected_q'] = querytext

                user_q = query_p.parse(querytext)
                user_q, search_kwargs = build_search_kwargs(user_q, request, scope, staff, orderby)
                hits = searcher.search(user_q, limit=(pagenum * maxresults), **search_kwargs)

        search_page(search_result, hits, pagenum, maxresults)
        search_result['results'] = add_other_versions(searcher, search_result['results'], request.user, staff)
        add_absolute_urls(search_result['results'], request)

    return search_result


def search_page(search_result, hits, pagenum, maxresults):

    if hits.has_exact_length():
        search_result['total'] = len(hits.top_n)
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
    search_result['results'] = hits[start:end]
    search_result['pagelen'] = len(search_result['results'])

    return search_result


def suggest(request, prefix='', number=30):

    reader = get_search_engine('resource').open_index().reader()
    filenames = ['title', 'vendor', 'description']
    result_suggestion = {}
    frequent_terms = []

    for fn in filenames:
        frequent_terms += [t for f, t in reader.most_frequent_terms(fn, number, prefix)]

    result_suggestion['terms'] = list(set(frequent_terms))

    return result_suggestion


def order_by_version(searcher, docnum):

    return Version(searcher.stored_fields(docnum)['version'], reverse=True)
