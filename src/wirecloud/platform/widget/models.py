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

import os
import random

from django.core.cache import cache
from django.db import models
from django.db.models.signals import pre_delete, post_save
from django.dispatch import receiver
from django.utils.encoding import python_2_unicode_compatible
from django.utils.translation import ugettext as _

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.wgt import WgtFile


@python_2_unicode_compatible
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

    def get_cache_key(self, domain, mode):
        version = cache.get('_widget_xhtml_version/' + str(self.id))
        if version is None:
            version = random.randrange(1, 100000)
            cache.set('_widget_xhtml_version/' + str(self.id), version)

        return '_widget_xhtml/' + str(version) + '/' + domain + '/' + str(self.id) + '?mode=' + mode

    def delete(self, *args, **kwargs):
        old_id = self.id
        super(XHTML, self).delete(*args, **kwargs)
        try:
            cache.incr('_widget_xhtml_version/' + str(old_id))
        except ValueError:
            pass

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_xhtml'


class WidgetManager(models.Manager):

    def get_query_set(self):
        return super(WidgetManager, self).get_query_set().select_related('resource')


@python_2_unicode_compatible
class Widget(models.Model):

    resource = models.OneToOneField('catalogue.CatalogueResource')

    xhtml = models.ForeignKey(XHTML)

    width = models.IntegerField(_('Width'), default=1)
    height = models.IntegerField(_('Height'), default=1)

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

        for iwidget in self.iwidget_set.all():
            iwidget.delete()

        try:
            self.xhtml.delete()
        except XHTML.DoesNotExist:
            pass

        import wirecloud.platform.widget.utils as showcase_utils
        showcase_utils.wgt_deployer.undeploy(self.resource.vendor, self.resource.short_name, self.resource.version)
        super(Widget, self).delete(*args, **kwargs)

    def __str__(self):
        return self.uri

    def get_related_preferences(self):
        return VariableDef.objects.filter(widget=self, aspect='PREF')

    def get_related_properties(self):
        return VariableDef.objects.filter(widget=self, aspect='PROP')


@python_2_unicode_compatible
class VariableDef(models.Model):

    name = models.CharField(_('Name'), max_length=30)
    TYPES = (
        ('N', _('Number')),
        ('S', _('String')),
        ('D', _('Date')),
        ('B', _('Boolean')),
        ('P', _('Password')),
        ('L', _('List')),
    )
    type = models.CharField(_('Type'), max_length=1, choices=TYPES)
    ASPECTS = (
        ('PREF', _('Preference')),
        ('PROP', _('Property')),
    )
    secure = models.BooleanField(_('Secure'), default=False)
    aspect = models.CharField(_('Aspect'), max_length=4, choices=ASPECTS)
    readonly = models.BooleanField(_('Read only'), default=False)
    default_value = models.TextField(_('Default value'), blank=True, null=True)
    value = models.TextField(_('Value'), blank=True, null=True)
    widget = models.ForeignKey(Widget)

    def __str__(self):
        return self.widget.uri + " " + self.aspect

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_variabledef'


@receiver(post_save, sender=CatalogueResource)
def create_widget_on_resource_creation(sender, instance, created, raw, **kwargs):

    from wirecloud.catalogue import utils as catalogue
    from wirecloud.platform.widget.utils import create_widget_from_template, create_widget_from_wgt

    if not created or raw:
        return

    resource = instance
    if resource.resource_type() == 'widget':
        try:
            resource.widget
        except Widget.DoesNotExist:
            base_dir = catalogue.wgt_deployer.get_base_dir(resource.vendor, resource.short_name, resource.version)
            wgt_file = WgtFile(os.path.join(base_dir, resource.template_uri))
            resource.widget = create_widget_from_wgt(wgt_file, resource.creator)


@receiver(pre_delete, sender=CatalogueResource)
def delete_widget_on_resource_deletion(sender, instance, using, **kwargs):
    if instance.resource_type() == 'widget':
        try:
            instance.widget.delete()
        except Widget.DoesNotExist:
            pass
