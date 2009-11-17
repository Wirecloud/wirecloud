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

from django.utils.translation import ugettext as  _

from gadget.models import Gadget, VariableDef
from workspace.models import Tab, AbstractVariable

class Position(models.Model):

    posX = models.IntegerField(_('PositionX'))
    posY = models.IntegerField(_('PositionY'))
    posZ = models.IntegerField(_('PositionZ'), default=0)
    height = models.IntegerField(_('Height'), blank=True, null=True)
    width = models.IntegerField(_('Width'), blank=True, null=True)
    minimized = models.BooleanField(_('Minimized'), default=False)

    def __unicode__(self):
        return str(self.pk)

class IGadget(models.Model):

    name = models.CharField(_('Name'), max_length=250)
    gadget = models.ForeignKey(Gadget, verbose_name=_('Gadget'))
    tab = models.ForeignKey(Tab, verbose_name=_('Tab'))
    layout = models.IntegerField(_('Layout'), default=0)
    transparency = models.BooleanField(_('Transparency'), default=False)
    position = models.ForeignKey(Position, verbose_name=_('Position'), related_name="Position")
    icon_position = models.ForeignKey(Position, verbose_name=_('Icon Position'), related_name="Icon_Position", blank=True, null=True)
    menu_color = models.CharField(max_length=6, default="FFFFFF")
    refused_version = models.CharField(_('Refused Version'), max_length=150, blank=True, null=True)

    def __unicode__(self):
        return str(self.pk)

class Variable(models.Model):

    vardef = models.ForeignKey(VariableDef, verbose_name=_('Variable definition'))
    igadget = models.ForeignKey(IGadget, verbose_name=_('IGadget'))
    abstract_variable = models.ForeignKey(AbstractVariable, verbose_name=_('AbstractVariable'))

    def __unicode__(self):
        return str(self.pk) + " " + self.vardef.name

    def has_public_value(self):   
        return self.vardef.has_public_value()
   
    def get_default_value(self):
        return self.vardef.default_value