# -*- coding: utf-8 -*-

# Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

import logging
import operator
import random
from six.moves.urllib.parse import urlparse, urljoin

from django.contrib.auth.models import User, Group
from django.core.cache import cache
from django.db import models
from django.db.models.signals import m2m_changed, post_save
from django.dispatch import receiver
from django.utils.encoding import python_2_unicode_compatible
from django.utils.translation import ugettext_lazy as _
from whoosh import fields
from whoosh.qparser import MultifieldParser, QueryParser
from whoosh.query import And, Every, Or, Term
from whoosh.sorting import FieldFacet, FunctionFacet

from wirecloud.commons.searchers import BaseSearcher, get_search_engine, patch_expand_prefix
from wirecloud.commons.utils.http import get_absolute_reverse_url
from wirecloud.commons.utils.template.parsers import TemplateParser
from wirecloud.commons.utils.version import Version


# Get an instance of a logger
logger = logging.getLogger(__name__)


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
    def cache_version_key(self):
        return '_catalogue_resource_version/%s' % self.id

    @property
    def cache_version(self):
        version = cache.get(self.cache_version_key)
        if version is None:
            version = random.randrange(1, 100000)
            cache.set(self.cache_version_key, version)

        return version

    def invalidate_cache(self):
        try:
            cache.incr(self.cache_version_key)
        except ValueError:
            pass

    def is_available_for(self, user):

        return self.public or self.users.filter(id=user.id).exists() or len(set(self.groups.all()) & set(user.groups.all())) > 0

    def is_removable_by(self, user):
        return user.is_superuser or self.creator == user

    def get_template_url(self, request=None, for_base=False):
        return get_template_url(self.vendor, self.short_name, self.version, '' if for_base else self.template_uri, request=request)

    def get_template(self, request=None):

        template_uri = self.get_template_url(request=request)
        parser = TemplateParser(self.json_description, base=template_uri)
        return parser

    def get_processed_info(self, request=None, lang=None, process_urls=True, translate=True, process_variables=False):

        if translate and lang is None:
            from django.utils import translation
            lang = translation.get_language()
        else:
            lang = None

        parser = self.get_template(request)
        return parser.get_resource_processed_info(lang=lang, process_urls=process_urls, translate=True, process_variables=process_variables)

    def delete(self, *args, **kwargs):

        from wirecloud.catalogue.utils import wgt_deployer

        old_id = self.id
        super(CatalogueResource, self).delete(*args, **kwargs)

        # Preserve the id attribute a bit more so CatalogueResource methods can use it
        self.id = old_id

        # Undeploy the resource from the filesystem
        try:
            wgt_deployer.undeploy(self.vendor, self.short_name, self.version)
        except:
            # TODO log this error
            pass  # ignore errors

        # Remove cache for this resource
        self.invalidate_cache()

        # Remove document from search indexes
        try:
            with get_search_engine('resource').get_batch_writer() as writer:
                writer.delete_by_term('pk', '%s' % old_id)
        except:
            pass  # ignore errors

        # Remove id attribute definetly
        self.id = None

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


@receiver(post_save, sender=CatalogueResource)
def update_catalogue_index(sender, instance, created, **kwargs):
    try:
        get_search_engine('resource').add_resource(instance, created)
    except:
        logger.warning("Error adding %s into the catalogue search index" % instance.local_uri_part)


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
        hit['image'] = "" if hit['image'] == '' else urljoin(base_url, hit['image'])
        hit['smartphoneimage'] = "" if hit['image'] == '' else urljoin(base_url, hit['smartphoneimage'])


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

            patch_expand_prefix(searcher)
            correction_q = multif_p.parse(querytext)
            corrected = searcher.correct_query(correction_q, querytext)

            if corrected.query != correction_q:
                querytext = corrected.string
                search_result['corrected_q'] = querytext

                user_q = query_p.parse(querytext)
                user_q, search_kwargs = build_search_kwargs(user_q, request, scope, staff, orderby)
                hits = searcher.search(user_q, limit=(pagenum * maxresults), **search_kwargs)

        search_engine.prepare_search_response(search_result, hits, pagenum, maxresults)
        search_result['results'] = add_other_versions(searcher, search_result['results'], request.user, staff)
        add_absolute_urls(search_result['results'], request)

    return search_result


def suggest(request, prefix='', limit=30):

    reader = get_search_engine('resource').open_index().reader()
    frequent_terms = {}

    for fieldname in ['title', 'vendor', 'description']:
        for frequency, term in reader.most_frequent_terms(fieldname, limit, prefix):
            if term in frequent_terms:
                frequent_terms[term] += frequency
            else:
                frequent_terms[term] = frequency

    # flatten terms
    return [term.decode('utf-8') for term, frequency in sorted(frequent_terms.items(), key=operator.itemgetter(1), reverse=True)[:limit]]


def order_by_version(searcher, docnum):

    return Version(searcher.stored_fields(docnum)['version'], reverse=True)
