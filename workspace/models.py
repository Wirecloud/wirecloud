# -*- coding: utf-8 -*-

# MORFEO Project 
# http://morfeo-project.org 
# 
# Component: EzWeb
# 
# (C) Copyright 2004 Telefónica Investigación y Desarrollo 
#     S.A.Unipersonal (Telefónica I+D) 
# 
# Info about members and contributors of the MORFEO project 
# is available at: 
# 
#   http://morfeo-project.org/
# 
# This program is free software; you can redistribute it and/or modify 
# it under the terms of the GNU General Public License as published by 
# the Free Software Foundation; either version 2 of the License, or 
# (at your option) any later version. 
# 
# This program is distributed in the hope that it will be useful, 
# but WITHOUT ANY WARRANTY; without even the implied warranty of 
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
# GNU General Public License for more details. 
# 
# You should have received a copy of the GNU General Public License 
# along with this program; if not, write to the Free Software 
# Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
# 
# If you want to use this software an plan to distribute a 
# proprietary application in any way, and you are not licensing and 
# distributing your source code under GPL, you probably need to 
# purchase a commercial license of the product.  More info about 
# licensing options is available at: 
# 
#   http://morfeo-project.org/
#

from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import ugettext as  _
    
class WorkSpace(models.Model):
    
    name = models.CharField(_('Name'), max_length=30)
    active = models.BooleanField(_('Active'))
    
    users = models.ManyToManyField(User, verbose_name=_('Users'))
    
    class Admin:
        pass

    def __unicode__(self):
        return str(self.pk) + " " + self.name  

class AbstractVariable(models.Model):
    
    VAR_TYPES = (
        ('IGADGET', _('IGadget')),
        ('WORKSPACE', _('WorkSpace')),
    )
    type = models.CharField(_('Type'), max_length=10, choices=VAR_TYPES)
    name = models.CharField(_('Name'), max_length=30)

    class Admin:
        pass

    def __unicode__(self):
        return str(self.pk) + " " + self.name

class VariableValue(models.Model):
    
    user = models.ForeignKey(User, verbose_name=_('User'))
    value = models.TextField(_('Value'))
    abstract_variable = models.ForeignKey(AbstractVariable, verbose_name=_('AbstractVariable'))
    
    class Meta:
        unique_together = ('user', 'abstract_variable')

    class Admin:
        pass

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
    aspect = models.CharField(_('Aspect'), max_length=10, choices=ASPECTS)

    class Admin:
        pass

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
