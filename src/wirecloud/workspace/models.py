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
        app_label = 'wirecloud'
        unique_together = ('creator', 'name')

    def __unicode__(self):
        return unicode(self.pk) + " " + unicode(self.name)

    def is_shared(self):
        return len(self.users.all()) > 1


class UserWorkspace(models.Model):

    workspace = models.ForeignKey(Workspace)
    user = models.ForeignKey(User)
    active = models.BooleanField(_('Active'), default=False)
    manager = models.CharField(_('Manager'), max_length=100, blank=True)
    reason_ref = models.CharField(_('Reason Ref'), max_length=100, help_text=_('Reference to the reason why it was added. Used by Workspace Managers to sync workspaces'), blank=True)

    class Meta:
        app_label = 'wirecloud'

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

    #For implementing "private mashups" only visible for users that belongs to a concrete group
    organization = models.CharField(_('Organization'), max_length=80, null=True, blank=True)

    workspace = models.ForeignKey(Workspace, verbose_name=_('Original Workspace'), null=True, blank=True)

    template = models.TextField(_('Template'))
    params = models.TextField(_('Params used for publishing'))

    class Meta:
        app_label = 'wirecloud'

    def get_template_url(self, request=None):
        return get_absolute_reverse_url('wirecloud_showcase.mashup_template', request, args=(self.id,))

    def __unicode__(self):
        return unicode(self.pk) + " " + unicode(self.name)


class GroupPublishedWorkspace(models.Model):

    group = models.ForeignKey(Group)
    workspace = models.ForeignKey(PublishedWorkspace)

    class Meta:
        app_label = 'wirecloud'

    def __unicode__(self):
        return '%s => %s' % (unicode(self.workspace), unicode(self.group))


#Category for which a workspace is the defalult workspace
class Category(models.Model):

    category_id = models.IntegerField()
    default_workspace = models.ForeignKey(PublishedWorkspace, verbose_name=_('Default Workspace'), null=True, blank=True)
    new_workspace = models.ForeignKey(PublishedWorkspace, verbose_name=_('New Workspace'), related_name="new_workspace_", null=True, blank=True)

    class Meta:
        app_label = 'wirecloud'

    def __unicode__(self):
        return unicode(self.category_id)


class VariableValue(models.Model):

    variable = models.ForeignKey('wirecloud.Variable', verbose_name=_('Variable'))
    user = models.ForeignKey(User, verbose_name=_('User'))
    value = models.TextField(_('Value'), blank=True)

    class Meta:
        app_label = 'wirecloud'
        unique_together = ('variable', 'user')

    def get_variable_value(self):
        value = self.value

        if self.variable.vardef.secure:
            from wirecloud.workspace.utils import decrypt_value
            value = decrypt_value(value)

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
        app_label = 'wirecloud'
        unique_together = ('name', 'workspace')

    def __unicode__(self):
        return unicode(self.pk) + " " + unicode(self.name)
