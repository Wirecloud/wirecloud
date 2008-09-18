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
from django.utils.translation import ugettext as _

#class Template(models.Model):
#    uri = models.CharField(_('URI'), max_length=500, unique=True)
#    description = models.CharField(_('Description'), max_length=250)
#    image = models.CharField(max_length=500)
#    width = models.IntegerField(_('Width'), default=1)
#    height = models.IntegerField(_('Height'), default=1)    
#
#    class Admin:
#        pass
#
#    def __unicode__(self):
#        return self.uri

class XHTML(models.Model):
    uri = models.CharField(_('URI'), max_length=500, unique=True)
    code = models.TextField(_('Code'))
    url = models.URLField(_('URL'), max_length=500)

    def __unicode__(self):
        return self.uri


class Gadget(models.Model):
    uri = models.CharField(_('URI'), max_length=500)
    
    vendor = models.CharField(_('Vendor'), max_length=250)
    name = models.CharField(_('Name'), max_length=250)
    version = models.CharField(_('Version'), max_length=150)
    
    xhtml = models.ForeignKey(XHTML)
    
    author = models.CharField(_('Author'), max_length=250)
    mail = models.CharField(_('Mail'), max_length=30)
   
    wikiURI = models.URLField(_('wikiURI'))
    imageURI = models.URLField(_('imageURI'))
    iPhoneImageURI = models.URLField(_('iPhoneImageURI'))

    width = models.IntegerField(_('Width'), default=1)
    height = models.IntegerField(_('Height'), default=1)
    description = models.CharField(_('Description'), max_length=250)
    
    shared = models.BooleanField(_('Shared'), default=False, null=True)
    users = models.ManyToManyField(User, verbose_name=_('Users'))
    last_update = models.DateTimeField(_('Last update'), null=True)

    class Meta:
        unique_together = ('vendor', 'name', 'version')

    def __unicode__(self):
        return self.uri
    
    def get_related_events(self):
        return VariableDef.objects.filter(gadget=self, aspect='EVEN')

    def get_related_slots(self):
        return VariableDef.objects.filter(gadget=self, aspect='SLOT')


class VariableDef(models.Model):
    name = models.CharField(_('Name'), max_length=30)
    TYPES = (
        ('N', _('Number')),
        ('S', _('String')),
        ('D', _('Date')),
        ('B', _('Boolean')),
        ('P', _('Password')),
    )
    type = models.CharField(_('Type'), max_length=1, choices=TYPES)
    ASPECTS = (
        ('SLOT', _('Slot')),
        ('EVEN', _('Event')),
        ('PREF', _('Preference')),
        ('PROP', _('Property')),
        ('GCTX', _('GadgetContext')),
        ('ECTX', _('ExternalContext')),
    )
    aspect = models.CharField(_('Aspect'), max_length=4, choices=ASPECTS)
    label = models.CharField(_('Label'), max_length=50, null=True)
    description = models.CharField(_('Description'), max_length=250, null=True)
    friend_code = models.CharField(_('Friend code'), max_length=30, null=True)
    default_value = models.TextField(_('Default value'), blank=True, null=True)
    gadget = models.ForeignKey(Gadget)

    def __unicode__(self):
        return self.gadget.uri + " " + self.aspect


class UserPrefOption(models.Model):
    value = models.CharField(_('Value'), max_length=30)
    name = models.CharField(_('Name'), max_length=30)
    variableDef = models.ForeignKey(VariableDef)
        
    def __unicode__(self):
        return self.variableDef.gadget.uri + " " + self.name


class VariableDefAttr(models.Model):
    value = models.CharField(_('Value'), max_length=30)
    name = models.CharField(_('Name'), max_length=30)
    variableDef = models.ForeignKey(VariableDef)
    
    def __unicode__(self):
        return self.variableDef + self.name

class ContextOption(models.Model):
    concept = models.CharField(_('Concept'), max_length=256)
    varDef = models.ForeignKey(VariableDef, verbose_name=_('Variable'))

    def __unicode__(self):
        return self.concept
