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
import random

from django.contrib.auth.models import User
from django.core.cache import cache
from django.db import models
from django.utils.translation import ugettext as _

from wirecloud.commons.models import TransModel


class XHTML(models.Model):

    uri = models.CharField(_('URI'), max_length=255, unique=True)
    code = models.TextField(_('Code'), blank=True)
    code_timestamp = models.BigIntegerField(_('Cache timestamp'), null=True, blank=True)
    url = models.CharField(_('URL'), max_length=500)
    content_type = models.CharField(_('Content type'), max_length=50, blank=True, null=True)
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


class Widget(TransModel):

    uri = models.CharField(_('URI'), max_length=500)
    vendor = models.CharField(_('Vendor'), max_length=250)
    name = models.CharField(_('Name'), max_length=250)
    version = models.CharField(_('Version'), max_length=150)
    display_name = models.CharField(_('Display Name'), max_length=250, null=True, blank=True)

    xhtml = models.ForeignKey(XHTML)

    author = models.CharField(_('Author'), max_length=250)
    mail = models.CharField(_('Mail'), max_length=100)

    wikiURI = models.URLField(_('wikiURI'))
    imageURI = models.URLField(_('imageURI'))
    iPhoneImageURI = models.URLField(_('iPhoneImageURI'))

    width = models.IntegerField(_('Width'), default=1)
    height = models.IntegerField(_('Height'), default=1)
    description = models.TextField(_('Description'))

    users = models.ManyToManyField(User, verbose_name=_('Users'))
    last_update = models.DateTimeField(_('Last update'), null=True)

    class Meta:
        unique_together = ('vendor', 'name', 'version')
        ordering = ('uri', )
        app_label = 'platform'
        db_table = 'wirecloud_widget'

    def delete(self, *args, **kwargs):
        if self.xhtml is not None:
            self.xhtml.delete()

        import wirecloud.platform.widget.utils as showcase_utils
        showcase_utils.wgt_deployer.undeploy(self.vendor, self.name, self.version)
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
        ('GCTX', _('WidgetContext')),
        ('ECTX', _('ExternalContext')),
    )
    secure = models.BooleanField(_('Secure'), default=False)
    aspect = models.CharField(_('Aspect'), max_length=4, choices=ASPECTS)
    label = models.CharField(_('Label'), max_length=150, null=True)
    action_label = models.CharField(_('Action label'), max_length=50, null=True)
    description = models.CharField(_('Description'), max_length=250, null=True)
    friend_code = models.CharField(_('Friend code'), max_length=30, null=True)
    default_value = models.TextField(_('Default value'), blank=True, null=True)
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


class ContextOption(models.Model):

    concept = models.CharField(_('Concept'), max_length=256)
    varDef = models.ForeignKey(VariableDef, verbose_name=_('Variable'))

    def __unicode__(self):
        return self.concept

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_contextoption'
