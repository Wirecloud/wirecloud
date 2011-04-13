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

from django.db import models
from django.contrib.auth.models import User, Group
from django.utils.translation import ugettext as  _

from connectable.models import InOut
from gadget.models import SharedVariableDef
from layout.models import Branding


class WorkSpace(models.Model):

    name = models.CharField(_('Name'), max_length=30)
    creator = models.ForeignKey(User, related_name='creator', verbose_name=_('Creator'), blank=False, null=False)

    users = models.ManyToManyField(User, verbose_name=_('Users'), through='UserWorkSpace')
    targetOrganizations = models.ManyToManyField(Group, verbose_name=_('Target Organizations'), blank=True, null=True)
    forcedValues = models.TextField(blank=True)

    branding = models.ForeignKey(Branding, verbose_name=_('Branding'), blank=True, null=True)

    def __unicode__(self):
        return unicode(self.pk) + " " + unicode(self.name)

    def is_shared(self):
        return len(self.users.all()) > 1

    def setReadOnlyFields(self, readOnly):
        # Get the igadget identifiers
        tabs = self.tab_set.all()
        try:
            for ig in reduce(lambda x, y: x + y, [list(t.igadget_set.all()) for t in tabs]):
                ig.readOnly = readOnly
                ig.save()
        except Exception:
            pass

        # Get the channel identifiers
        inouts = InOut.objects.filter(workspace=self)
        for inout in inouts:
            inout.readOnly = readOnly
            inout.save()


class UserWorkSpace(models.Model):

    workspace = models.ForeignKey(WorkSpace)
    user = models.ForeignKey(User)
    active = models.BooleanField(_('Active'), default=False)

    def __unicode__(self):
        return unicode(self.workspace) + " - " + unicode(self.user)


class PublishedWorkSpace(models.Model):

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

    workspace = models.ForeignKey(WorkSpace, verbose_name=_('Original Workspace'), null=True, blank=True)

    template = models.TextField(_('Template'))
    params = models.TextField(_('Params used for publishing'))

    contratable = models.BooleanField(_('Contratable'), default=False)

    def __unicode__(self):
        return unicode(self.pk) + " " + unicode(self.name)


#Category for which a workspace is the defalult workspace
class Category(models.Model):

    category_id = models.IntegerField()
    default_workspace = models.ForeignKey(PublishedWorkSpace, verbose_name=_('Default Workspace'), null=True, blank=True)
    new_workspace = models.ForeignKey(PublishedWorkSpace, verbose_name=_('New Workspace'), related_name="new_workspace_", null=True, blank=True)

    def __unicode__(self):
        return unicode(self.category_id)


#sharing variables. Each user can have a value for a specified concept (SharedVariableDef)
class SharedVariableValue(models.Model):

    shared_var_def = models.ForeignKey(SharedVariableDef)
    user = models.ForeignKey(User)
    value = models.TextField(_('Value'), null=True, blank=True)

    class Meta:
        unique_together = ('shared_var_def', 'user')

    def __unicode__(self):
        return unicode(self.shared_var_def.name) + " - " + unicode(self.user)


class VariableValue(models.Model):

    variable = models.ForeignKey('igadget.Variable', verbose_name=_('Variable'))
    user = models.ForeignKey(User, verbose_name=_('User'))
    value = models.TextField(_('Value'), blank=True)
    shared_var_value = models.ForeignKey(SharedVariableValue, blank=True, null=True)

    class Meta:
        unique_together = ('variable', 'user')

    def get_variable_value(self):
        if self.shared_var_value != None:
            return self.shared_var_value.value
        else:
            return self.value

    def __unicode__(self):
        return unicode(self.variable.vardef.name) + " - " + unicode(self.user)


class Tab(models.Model):

    name = models.CharField(_('Name'), max_length=30)
    visible = models.BooleanField(_('Visible'))
    position = models.IntegerField(null=True, blank=True)
    workspace = models.ForeignKey(WorkSpace, verbose_name=_('WorkSpace'))

    class Admin:
        pass

    class Meta:
        unique_together = ('name', 'workspace')

    def __unicode__(self):
        return unicode(self.pk) + " " + unicode(self.name)
