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

import random
from six.moves.urllib.parse import urlparse, urljoin

from django.contrib.auth.models import User, Group
from django.core.cache import cache
from django.db import models
from django.utils.encoding import python_2_unicode_compatible
from django.utils.translation import ugettext_lazy as _

from wirecloud.commons.fields import JSONField
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
    creator = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='uploaded_resources')
    public = models.BooleanField(_('Available to all users'), default=False)
    users = models.ManyToManyField(User, verbose_name=_('Users'), related_name='local_resources', blank=True)
    groups = models.ManyToManyField(Group, verbose_name=_('Groups'), related_name='local_resources', blank=True)

    creation_date = models.DateTimeField('creation_date')
    template_uri = models.CharField(_('templateURI'), max_length=200, blank=True)

    popularity = models.DecimalField(_('popularity'), default=0, max_digits=2, decimal_places=1)

    json_description = JSONField(_('JSON description'))

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

    def get_template_url(self, request=None, for_base=False, url_pattern_name='wirecloud_catalogue.media'):
        return get_template_url(self.vendor, self.short_name, self.version, '' if for_base else self.template_uri, request=request, url_pattern_name=url_pattern_name)

    def get_template(self, request=None, url_pattern_name='wirecloud_catalogue.media'):

        template_uri = self.get_template_url(request=request, url_pattern_name=url_pattern_name)
        parser = TemplateParser(self.json_description, base=template_uri)
        return parser

    def get_processed_info(self, request=None, lang=None, process_urls=True, translate=True, process_variables=False, url_pattern_name='wirecloud_catalogue.media'):

        if translate and lang is None:
            from django.utils import translation
            lang = translation.get_language()
        else:
            lang = None

        parser = self.get_template(request, url_pattern_name=url_pattern_name)
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


def get_template_url(vendor, name, version, url, request=None, url_pattern_name='wirecloud_catalogue.media'):

    if urlparse(url).scheme == '':
        template_url = get_absolute_reverse_url(url_pattern_name, kwargs={
            'vendor': vendor,
            'name': name,
            'version': version,
            'file_path': url
        }, request=request)
    else:
        template_url = url

    return template_url
