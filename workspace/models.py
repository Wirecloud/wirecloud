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
from django.utils import simplejson

class WorkSpace(models.Model):
    
    name = models.CharField(_('Name'), max_length=30)
    creator = models.ForeignKey(User, related_name='creator', verbose_name=_('Creator'), blank=True, null=True)
    
    users = models.ManyToManyField(User, verbose_name=_('Users'), through='UserWorkSpace')
    targetOrganizations = models.ManyToManyField(Group, verbose_name=_('Target Organizations'), blank=True, null=True)

    def __unicode__(self):
        return str(self.pk) + " " + self.name
    
    def get_creator(self):
        if self.creator:
            return self.creator
    
        #No creator specified (previous version of the model didn't have this field)
        #First element in the user relationship returned!
        creator = self.users.all()[0]
        
        self.creator = creator
        self.save()
        
        return self.creator

    def is_shared(self, user):
        if (len(self.users.all()) < 2):
            return False

        return self.get_creator() != user
    
    def setReadOnlyFields(self, readOnly):
        #Get the igadget identifiers
        tabs = self.tab_set.all()
        try:
            for ig in reduce(lambda x,y: x+y, [list(t.igadget_set.all()) for t in tabs]):
                ig.readOnly = readOnly
                ig.save()
        except Exception, e:
            pass
            
        #Get the channel identifiers
        try:
            wsvars = self.workspacevariable_set.filter(workspace=self,aspect="CHANNEL") #there must be at most one  
            for c in [wsvar.inout_set.all()[0] for wsvar in wsvars]:
                c.readOnly = readOnly
                c.save()
        except WorkSpaceVariable.DoesNotExist, e:
            pass
            

class UserWorkSpace(models.Model):
    workspace = models.ForeignKey(WorkSpace)
    user = models.ForeignKey(User)
    active = models.BooleanField(_('Active'), default=False)
    
    def __unicode__(self):
        return str(self.workspace) + " - " + str(self.user)
    
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
    mail = models.CharField(_('Mail'), max_length=100)
    
    #For implementing "private mashups" only visible for users that belongs to a concrete group
    organization = models.CharField(_('Organization'), max_length=80, null=True, blank=True)
    
    workspace = models.ForeignKey(WorkSpace, verbose_name=_('Workspace'))
    
    contratable = models.BooleanField(_('Contratable'), default=False)

    def __unicode__(self):
        return str(self.pk) + " " + self.workspace.name  

#Category for which a workspace is the defalult workspace
class Category(models.Model):
    category_id = models.IntegerField()
    default_workspace = models.ForeignKey(PublishedWorkSpace, verbose_name=_('Default Workspace'), null=True, blank=True)
    new_workspace = models.ForeignKey(PublishedWorkSpace, verbose_name=_('New Workspace'), related_name="new_workspace_", null=True, blank=True)

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

    def has_public_value(self):
       #In workspace variables, channel values are not public
       if self.type=='WORKSPACE':
           ws_var = WorkSpaceVariable.objects.get(abstract_variable=self)   
           return ws_var.has_public_value()
       
       #Cycling import 
       from igadget.models import Variable
       
       #Igadget variable
       igadget_var = Variable.objects.get(abstract_variable=self)
       
       return igadget_var.has_public_value()
   
    def get_default_value(self):
       #If it's a workspace variable, and there is not creator value!
       #Returning ""
       if self.type=='WORKSPACE':
           return ""
       
       #Cycling import 
       from igadget.models import Variable
       
       #Igadget variable
       igadget_var = Variable.objects.get(abstract_variable=self)
       
       return igadget_var.get_default_value()
       
        

class VariableValue(models.Model):
    
    user = models.ForeignKey(User, verbose_name=_('User'))
    value = models.TextField(_('Value'), null=True, blank=True)
    abstract_variable = models.ForeignKey(AbstractVariable, verbose_name=_('AbstractVariable'))
    
    def clone_variable_value(self, user):
        cloned_value = VariableValue(user=user, value=self.get_variable_value(), abstract_variable=self.abstract_variable)
        cloned_value.save()
        
        return cloned_value
        
    def get_variable_value(self):
        if (self.abstract_variable.has_public_value()):
            return self.value
        
        return self.abstract_variable.get_default_value()

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

    def has_public_value(self):
        return self.aspect!="CHANNEL"

    def __unicode__(self):
        return str(self.pk) + " " + self.aspect

class Tab(models.Model):

    name = models.CharField(_('Name'), max_length=30)
    visible = models.BooleanField(_('Visible'))
    position = models.IntegerField(null=True, blank=True)
    workspace = models.ForeignKey(WorkSpace, verbose_name=_('WorkSpace'))
    abstract_variable = models.ForeignKey(AbstractVariable, verbose_name=_('AbstractVariable'))

    class Admin:
        pass

    def __unicode__(self):
        return str(self.pk) + " " + self.name
