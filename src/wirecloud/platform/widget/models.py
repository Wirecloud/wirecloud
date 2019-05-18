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

import random

from django.core.cache import cache
from django.db import models
from django.utils.translation import ugettext as _


class XHTML(models.Model):

    uri = models.CharField(_('URI'), max_length=255, unique=True)
    code = models.TextField(_('Code'), blank=True)
    code_timestamp = models.BigIntegerField(_('Cache timestamp'), null=True, blank=True)
    url = models.CharField(_('URL'), max_length=500)
    content_type = models.CharField(_('Content type'), max_length=50, blank=True, null=True)
    use_platform_style = models.BooleanField(_('Uses platform style'), default=False)
    cacheable = models.BooleanField(_('Cacheable'), default=True, blank=True)

    def __str__(self):
        return self.uri

    def get_cache_key(self, domain, mode, theme):
        version = cache.get('_widget_xhtml_version/%s' % self.id)
        if version is None:
            version = random.randrange(1, 100000)
            cache.set('_widget_xhtml_version/%s' % self.id, version)

        return '_widget_xhtml/%s/%s/%s?mode=%s&theme=%s' % (version, domain, self.id, mode, theme)

    def delete(self, *args, **kwargs):
        old_id = self.id
        super(XHTML, self).delete(*args, **kwargs)
        try:
            cache.incr('_widget_xhtml_version/%s' % old_id)
        except ValueError:
            pass

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_xhtml'


class WidgetManager(models.Manager):

    def get_query_set(self):
        return super(WidgetManager, self).get_query_set().select_related('resource')


class Widget(models.Model):

    resource = models.OneToOneField('catalogue.CatalogueResource')

    xhtml = models.ForeignKey(XHTML, on_delete=models.CASCADE)
    objects = WidgetManager()

    @property
    def uri(self):
        return '/'.join((self.resource.vendor, self.resource.short_name, self.resource.version))

    class Meta:
        ordering = ('resource__vendor', 'resource__short_name', 'resource__version')
        app_label = 'platform'
        db_table = 'wirecloud_widget'

    def is_available_for(self, user):

        return self.resource.is_available_for(user)

    def delete(self, *args, **kwargs):

        try:
            self.xhtml.delete()
        except XHTML.DoesNotExist:
            pass

        import wirecloud.platform.widget.utils as showcase_utils
        showcase_utils.wgt_deployer.undeploy(self.resource.vendor, self.resource.short_name, self.resource.version)
        super(Widget, self).delete(*args, **kwargs)

    def __str__(self):
        return self.uri
