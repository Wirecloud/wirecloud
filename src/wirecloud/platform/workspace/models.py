# -*- coding: utf-8 -*-

# Copyright (c) 2008-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.contrib.auth.models import User, Group
from django.db import models
from django.utils.translation import ugettext as _

from wirecloud.commons.utils.http import get_absolute_reverse_url


class Workspace(models.Model):

    name = models.CharField(_('Name'), max_length=30)
    creator = models.ForeignKey(User, related_name='creator', verbose_name=_('Creator'), blank=False, null=False)

    users = models.ManyToManyField(User, verbose_name=_('Users'), through='UserWorkspace')
    targetOrganizations = models.ManyToManyField(Group, verbose_name=_('Target Organizations'), blank=True, null=True)
    forcedValues = models.TextField(blank=True)
    wiringStatus = models.TextField(blank=True)

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_workspace'
        unique_together = ('creator', 'name')

    def __unicode__(self):
        return unicode(self.pk) + " " + unicode(self.name)

    def save(self, *args, **kwargs):

        super(Workspace, self).save(*args, **kwargs)

        from wirecloud.platform.get_data import _invalidate_cached_variable_values
        _invalidate_cached_variable_values(self)

    def is_shared(self):
        return len(self.users.all()) > 1


class UserWorkspace(models.Model):

    workspace = models.ForeignKey(Workspace)
    user = models.ForeignKey(User)
    active = models.BooleanField(_('Active'), default=False)
    manager = models.CharField(_('Manager'), max_length=100, blank=True)
    reason_ref = models.CharField(_('Reason Ref'), max_length=100, help_text=_('Reference to the reason why it was added. Used by Workspace Managers to sync workspaces'), blank=True)

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_userworkspace'

    def __unicode__(self):
        return unicode(self.workspace) + " - " + unicode(self.user)


class PublishedWorkspace(models.Model):

    vendor = models.CharField(_('Vendor'), max_length=250)
    name = models.CharField(_('Name'), max_length=250)
    version = models.CharField(_('Version'), max_length=150)

    wikiURI = models.URLField(_('wikiURI'))
    imageURI = models.URLField(_('imageURI'))

    description = models.TextField(_('Description'))

    author = models.CharField(_('Author'), max_length=250)
    creator = models.ForeignKey(User)
    mail = models.CharField(_('Mail'), max_length=100)

    workspace = models.ForeignKey(Workspace, verbose_name=_('Original Workspace'), null=True, blank=True)

    template = models.TextField(_('Template'))
    params = models.TextField(_('Params used for publishing'))

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_publishedworkspace'

    def get_template_url(self, request=None):
        return get_absolute_reverse_url('wirecloud_showcase.mashup_template', request, args=(self.id,))

    def __unicode__(self):
        return unicode(self.pk) + " " + unicode(self.name)


class GroupPublishedWorkspace(models.Model):

    group = models.ForeignKey(Group)
    workspace = models.ForeignKey(PublishedWorkspace)

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_grouppublishedworkspace'

    def __unicode__(self):
        return '%s => %s' % (unicode(self.workspace), unicode(self.group))


class VariableValue(models.Model):

    variable = models.ForeignKey('platform.Variable', verbose_name=_('Variable'))
    user = models.ForeignKey(User, verbose_name=_('User'))
    value = models.TextField(_('Value'), blank=True)

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_variablevalue'
        unique_together = ('variable', 'user')

    def save(self, *args, **kwargs):

        super(VariableValue, self).save(*args, **kwargs)

        from wirecloud.platform.get_data import _invalidate_cached_variable_values
        _invalidate_cached_variable_values(self.variable.iwidget.tab.workspace, self.user)

    def set_variable_value(self, value):

        new_value = unicode(value)
        if self.variable.vardef.secure:
            from wirecloud.platform.workspace.utils import encrypt_value
            new_value = encrypt_value(new_value)

        self.value = new_value

    def get_variable_value(self):
        value = self.value

        if self.variable.vardef.secure:
            from wirecloud.platform.workspace.utils import decrypt_value
            value = decrypt_value(value)

        if self.variable.vardef.type == 'B':
            value = value.lower() == 'true'

        return value

    def __unicode__(self):
        return unicode(self.variable.vardef.name) + " - " + unicode(self.user)


class Tab(models.Model):

    name = models.CharField(_('Name'), max_length=30)
    visible = models.BooleanField(_('Visible'))
    position = models.IntegerField(null=True, blank=True)
    workspace = models.ForeignKey(Workspace, verbose_name=_('Workspace'))

    class Admin:
        pass

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_tab'
        unique_together = ('name', 'workspace')

    def __unicode__(self):
        return unicode(self.pk) + " " + unicode(self.name)

    def save(self, *args, **kwargs):

        super(Tab, self).save(*args, **kwargs)

        from wirecloud.platform.get_data import _invalidate_cached_variable_values
        _invalidate_cached_variable_values(self.workspace)
