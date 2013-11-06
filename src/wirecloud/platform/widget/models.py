# -*- coding: utf-8 -*-

#...............................licence...........................................
#
#     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
#     S.A.Unipersonal (Telefonica I+D)
#
#     This file is part of Morfeo EzWeb Platform.
#
#     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
#
#     You should have received a copy of the GNU Affero General Public License
#     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
#
#     Info about members and contributors of the MORFEO project
#     is available at
#
#     http://morfeo-project.org
#
#...............................licence...........................................#


#
import os
import random

from django.core.cache import cache
from django.db import models
from django.db.models.signals import post_save
from django.utils.translation import ugettext as _

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.models import TransModel
from wirecloud.commons.utils.wgt import WgtFile


class XHTML(models.Model):

    uri = models.CharField(_('URI'), max_length=255, unique=True)
    code = models.TextField(_('Code'), blank=True)
    code_timestamp = models.BigIntegerField(_('Cache timestamp'), null=True, blank=True)
    url = models.CharField(_('URL'), max_length=500)
    content_type = models.CharField(_('Content type'), max_length=50, blank=True, null=True)
    use_platform_style = models.BooleanField(_('Uses platform style'), default=False)
    cacheable = models.BooleanField(_('Cacheable'), default=True, blank=True)

    def __unicode__(self):
        return self.uri

    def get_cache_key(self, domain):
        version = cache.get('_widget_xhtml_version/' + str(self.id))
        if version is None:
            version = random.randrange(1, 100000)
            cache.set('_widget_xhtml_version/' + str(self.id), version)

        return '_widget_xhtml/' + str(version) + '/' + domain + '/' + str(self.id)

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
        try:
            self.xhtml.delete()
        except XHTML.DoesNotExist:
            pass

        import wirecloud.platform.widget.utils as showcase_utils
        showcase_utils.wgt_deployer.undeploy(self.resource.vendor, self.resource.short_name, self.resource.version)
        super(Widget, self).delete(*args, **kwargs)

    def __unicode__(self):
        return self.uri

    def get_related_preferences(self):
        return VariableDef.objects.filter(widget=self, aspect='PREF')

    def get_related_properties(self):
        return VariableDef.objects.filter(widget=self, aspect='PROP')

    def get_related_events(self):
        return VariableDef.objects.filter(widget=self, aspect='EVEN')

    def get_related_slots(self):
        return VariableDef.objects.filter(widget=self, aspect='SLOT')


class VariableDef(TransModel):

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
        ('SLOT', _('Slot')),
        ('EVEN', _('Event')),
        ('PREF', _('Preference')),
        ('PROP', _('Property')),
    )
    secure = models.BooleanField(_('Secure'), default=False)
    aspect = models.CharField(_('Aspect'), max_length=4, choices=ASPECTS)
    label = models.CharField(_('Label'), max_length=150, null=False, blank=True, default='')
    action_label = models.CharField(_('Action label'), max_length=50, null=False, blank=True, default='')
    description = models.CharField(_('Description'), max_length=250, null=False, blank=True, default='')
    friend_code = models.CharField(_('Friend code'), max_length=30, null=False, blank=True, default='')
    readonly = models.BooleanField(_('Read only'), default=False)
    default_value = models.TextField(_('Default value'), blank=True, null=True)
    value = models.TextField(_('Value'), blank=True, null=True)
    widget = models.ForeignKey(Widget)
    order = models.IntegerField(default=0, blank=True)

    def __unicode__(self):
        return self.widget.uri + " " + self.aspect

    #Values that cannot be public: passwords, produced events and consumed events
    def has_public_value(self):
        return self.type != 'P' and self.aspect != 'SLOT' and self.aspect != 'EVENT'

    def get_default_value(self):
        if self.default_value is None:
            return ''
        else:
            return self.default_value

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_variabledef'


class UserPrefOption(TransModel):

    value = models.CharField(_('Value'), max_length=50)
    name = models.CharField(_('Name'), max_length=50)
    variableDef = models.ForeignKey(VariableDef)

    def __unicode__(self):
        return self.variableDef.widget.uri + " " + self.name

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_userprefoption'


class VariableDefAttr(models.Model):

    value = models.CharField(_('Value'), max_length=30)
    name = models.CharField(_('Name'), max_length=30)
    variableDef = models.ForeignKey(VariableDef)

    def __unicode__(self):
        return self.variableDef + self.name

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_variabledefattr'


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
            if resource.fromWGT:
                base_dir = catalogue.wgt_deployer.get_base_dir(resource.vendor, resource.short_name, resource.version)
                wgt_file = WgtFile(os.path.join(base_dir, resource.template_uri))
                resource.widget = create_widget_from_wgt(wgt_file, resource.creator)
            else:
                resource.widget = create_widget_from_template(resource.template_uri, resource.creator)

post_save.connect(create_widget_on_resource_creation, sender=CatalogueResource)
