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
from django.contrib.auth.models import User
from django.utils.translation import ugettext as  _

class WorkSpace(models.Model):
    
    name = models.CharField(_('Name'), max_length=30)
    active = models.BooleanField(_('Active'))
    
    users = models.ManyToManyField(User, verbose_name=_('Users'))

    def __unicode__(self):
        return str(self.pk) + " " + self.name  

class PublishedWorkSpace(models.Model):
    WORKSPACE_TYPES = (
        ('CLONED', _('Cloned')),
        ('SHARED', _('Shared')),
    )
    type = models.CharField(_('Type'), max_length=10, choices=WORKSPACE_TYPES)
    
    credentials = models.CharField(_('Credentials'), max_length=30)
    
    vendor = models.CharField(_('Vendor'), max_length=250)
    name = models.CharField(_('Name'), max_length=250)
    version = models.CharField(_('Version'), max_length=150)
    
    wikiURI = models.URLField(_('wikiURI'))
    imageURI = models.URLField(_('imageURI'))
    
    description = models.TextField(_('Description'))
    
    author = models.CharField(_('Author'), max_length=250)
    mail = models.CharField(_('Mail'), max_length=30)
    
    workspace = models.ForeignKey(WorkSpace, verbose_name=_('Workspace'))

    def __unicode__(self):
        return str(self.pk) + " " + self.workspace.name  
    
class Category(models.Model):
    category_id = models.IntegerField()
    default_workspace = models.ForeignKey(PublishedWorkSpace, verbose_name=_('Default Workspace'))
    
    def __unicode__(self):
        return str(self.category_id) + " " + str(self.default_workspace)

class AbstractVariable(models.Model):
    
    VAR_TYPES = (
        ('IGADGET', _('IGadget')),
        ('WORKSPACE', _('WorkSpace')),
    )
    type = models.CharField(_('Type'), max_length=10, choices=VAR_TYPES)
    name = models.CharField(_('Name'), max_length=30)

    def __unicode__(self):
        return str(self.pk) + " " + self.name

class VariableValue(models.Model):
    
    user = models.ForeignKey(User, verbose_name=_('User'))
    value = models.TextField(_('Value'))
    abstract_variable = models.ForeignKey(AbstractVariable, verbose_name=_('AbstractVariable'))
    
    class Meta:
        unique_together = ('user', 'abstract_variable')

    def __unicode__(self):
        return self.abstract_variable.name + self.value
    
class WorkSpaceVariable(models.Model):
    
    workspace = models.ForeignKey(WorkSpace, verbose_name=_('WorkSpace'))
    abstract_variable = models.ForeignKey(AbstractVariable, verbose_name=_('AbstractVariable'))
    
    TYPES = (
        ('N', _('Number')),
        ('S', _('String')),
        ('D', _('Date')),
        ('B', _('Boolean')),
    )
    type = models.CharField(_('Type'), max_length=1, choices=TYPES)
    
    ASPECTS = (
        ('CHANNEL', _('Channel')),
        ('TAB', _('Tab')),
    )
    aspect = models.CharField(_('Aspect'), max_length=12, choices=ASPECTS)

    def __unicode__(self):
        return str(self.pk) + " " + self.aspect

class Tab(models.Model):
    
    name = models.CharField(_('Name'), max_length=30)
    visible = models.BooleanField(_('Visible'))
    locked = models.BooleanField(_('Locked'))
    workspace = models.ForeignKey(WorkSpace, verbose_name=_('WorkSpace'))
    abstract_variable = models.ForeignKey(AbstractVariable, verbose_name=_('AbstractVariable'))
        
    class Admin:
        pass

    def __unicode__(self):
        return str(self.pk) + " " + self.name
