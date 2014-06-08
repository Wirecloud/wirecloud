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
from urlparse import urlparse

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
from whoosh import sorting
from whoosh.qparser import MultifieldParser
from whoosh.qparser import QueryParser
from whoosh.query import And
from whoosh.query import Every
from whoosh.query import Or
from whoosh.query import Term

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
    fromWGT = models.BooleanField(_('fromWGT'), default=False)

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

    def get_template(self, request=None):

        if urlparse(self.template_uri).scheme == '':
            template_uri = get_absolute_reverse_url('wirecloud.showcase_media', kwargs={
                'vendor': self.vendor,
                'name': self.short_name,
                'version': self.version,
                'file_path': self.template_uri
            }, request=request)
        else:
            template_uri = self.template_uri

        parser = TemplateParser(self.json_description, base=template_uri)
        return parser

    def get_processed_info(self, request=None, lang=None, process_urls=True):

        parser = self.get_template(request)

        return parser.get_resource_processed_info(lang=lang, process_urls=process_urls)

    def delete(self, *args, **kwargs):

        from wirecloud.catalogue.utils import wgt_deployer

        if hasattr(self, 'widget'):
            from wirecloud.platform.models import Widget
            try:
                self.widget.delete()
            except Widget.DoesNotExist:
                pass

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
        ix = open_index('catalogue_resources')

        try:
            with ix.writer() as writer:
                writer.delete_document('pk', old_id)
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
    name = fields.TEXT(stored=True)
    vendor = fields.TEXT(stored=True, spelling=True)
    version = fields.TEXT(stored=True)
    type = fields.TEXT(stored=True)
    creation_date = fields.DATETIME
    title = fields.TEXT(stored=True, spelling=True)
    image = fields.TEXT(stored=True)
    description = fields.TEXT(stored=True)
    public = fields.BOOLEAN
    users = fields.KEYWORD(stored=True, commas=True)
    groups = fields.KEYWORD(commas=True)


@receiver(post_save, sender=CatalogueResource)
def add_document(sender, instance, created, raw, **kwargs):

    resource = instance
    resource_info = resource.get_processed_info()

    data = {
        'pk': unicode(resource.pk),
        'name': unicode(resource.short_name),
        'vendor': unicode(resource.vendor),
        'version': resource_info['version'],
        'type': resource_info['type'],
        'creation_date': resource.creation_date.utcnow(),
        'public': resource.public,
        'title': resource_info['title'],
        'description': resource_info['description'],
        'image': resource_info['image'],
        'users': ', '.join(resource.users.all().values_list('username', flat=True)),
        'groups': ', '.join(resource.groups.all().values_list('name', flat=True)),
    }

    ix = open_index('catalogue_resources')

    try:
        with ix.writer() as writer:
            writer.update_document(**data)
    except:
        with ix.writer() as writer:
            writer.add_document(**data)


@receiver(m2m_changed, sender=CatalogueResource.users.through)
def update_users(sender, instance, action, reverse, model, pk_set, using, **kwargs):

    if reverse or action.startswith('pre_') or (pk_set is not None and len(pk_set) == 0):
        return

    add_document(sender, instance, False, False)


def groupby_name_and_vendor(results):

    storedfields_list = [hit.fields() for hit in results]
    items_not_looking = [i for i in xrange(len(storedfields_list))]
    new_results = []

    while items_not_looking != []:

        first_document = storedfields_list[items_not_looking.pop(0)].copy()
        others = []

        for i in items_not_looking[:]:

            current_document = storedfields_list[i].copy()

            if (first_document['name'] == current_document['name'] and
                first_document['vendor'] == current_document['vendor']):

                if version_greater(first_document['version'], current_document['version']):
                    others.append(current_document)
                else:
                    others.append(first_document)
                    first_document = current_document.copy()

                items_not_looking.remove(i)

        first_document['others'] = others[:]
        new_results.append(first_document)

    return new_results


def open_index(indexname, dirname=None):

    if dirname is None:
        dirname = settings.WIRECLOUD_INDEX_DIR

    if not os.path.exists(dirname):
        os.mkdir(dirname)

    if not index.exists_in(dirname, indexname=indexname):
        return index.create_in(dirname, CatalogueResourceSchema(), indexname=indexname)

    return index.open_dir(dirname, indexname=indexname)


def search(querytext, user, scope=None, pagenum=1, pagelen=10, orderby='-creation_date', staff=False):

    ix = open_index('catalogue_resources')
    qp = MultifieldParser(['name', 'title', 'vendor', 'description'], ix.schema)

    allow_q = Every()
    user_q = querytext and qp.parse(querytext) or None

    if not staff:
        allow_q = And([allow_q, Or([Term('public', 't'), Term('users', user.username.lower())] +
            [Term('groups', group.name.lower()) for group in user.groups.all()])])

    if scope:
        allow_q = And([allow_q, Term('type', scope)])

    order_f = sorting.FieldFacet(orderby.replace('-', ''), reverse=orderby.find('-') > -1)

    """
    corrected = searcher.correct_query(user_q, keywords)
    if corrected.query != user_q:
        print("Did you mean:", corrected.string)
    """

    search_result = {}

    with ix.searcher() as searcher:
        # TODO: name-vendor groups do not work with limit

        allow_hits = searcher.search(allow_q, limit=(pagenum+1) * pagelen, sortedby=[order_f,])
        results = groupby_name_and_vendor(allow_hits)

        if user_q:

            if not staff:
                user_q = And([user_q, Or([Term('public', 't'), Term('users', user.username.lower())] +
                    [Term('groups', group.name.lower()) for group in user.groups.all()])])

            if scope:
                user_q = And([user_q, Term('type', scope)])

            user_hits = searcher.search(user_q, limit=(pagenum+1) * pagelen, sortedby=[order_f,])
            query_results = groupby_name_and_vendor(user_hits)
            results = upgrade_results(query_results, results)

        search_result = search_page(shorten_response(results), pagenum, pagelen)

    return search_result


def shorten_response(results):

    for hit in results:
        hit['others'] = [other['version'] for other in hit['others']]

    return results


def search_page(results, pagenum, pagelen):

    results_page = {}

    results_page['total'] = len(results)
    results_page['pagecount'] = results_page['total'] // pagelen + 1

    if pagenum > results_page['pagecount']:
        pagenum = results_page['pagecount']

    results_page['pagenum'] = pagenum
    offset = (pagenum - 1) * pagelen

    if (offset + pagelen) > results_page['total']:
        pagelen = results_page['total'] - offset

    results_page['offset'] = offset
    results_page['pagelen'] = pagelen
    results_page['results'] = results[offset:(offset + pagelen)]

    return results_page


def upgrade_results(main_results, allow_results):

    for hit in main_results:

        for allow_hit in allow_results:

            if (hit['name'] == allow_hit['name'] and hit['vendor'] == allow_hit['vendor']):

                versions = [hit['version']] + [other['version'] for other in hit['others']]
                current_hit = allow_hit.copy()
                del current_hit['others']

                others = [current_hit] + allow_hit['others']
                hit['others'] += [other for other in others if not other['version'] in versions]

    return main_results


def version_greater(version1, version2):
    # TODO: the version can include letters too.
    return version1 > version2
