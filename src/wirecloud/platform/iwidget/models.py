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
import json

from django.db import models
from django.utils.translation import ugettext as _

from wirecloud.platform.wiring.utils import remove_related_iwidget_connections


class Position(models.Model):

    posX = models.IntegerField(_('PositionX'))
    posY = models.IntegerField(_('PositionY'))
    posZ = models.IntegerField(_('PositionZ'), default=0)
    height = models.IntegerField(_('Height'), blank=True, null=True)
    width = models.IntegerField(_('Width'), blank=True, null=True)
    minimized = models.BooleanField(_('Minimized'), default=False)
    fulldragboard = models.BooleanField(_('Fulldragboard'), default=False)

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_position'

    def __unicode__(self):
        return str(self.pk)


class IWidget(models.Model):

    name = models.CharField(_('Name'), max_length=250)
    widget = models.ForeignKey('platform.Widget', verbose_name=_('Widget'))
    tab = models.ForeignKey('platform.Tab', verbose_name=_('Tab'))
    layout = models.IntegerField(_('Layout'), default=0)
    position = models.ForeignKey(Position, verbose_name=_('Position'), related_name="Position")
    icon_position = models.ForeignKey(Position, verbose_name=_('Icon Position'), related_name="Icon_Position", blank=True, null=True)
    refused_version = models.CharField(_('Refused Version'), max_length=150, blank=True, null=True)
    readOnly = models.BooleanField(_('Read Only'), default=False)

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_iwidget'

    def __unicode__(self):
        return str(self.pk)

    def delete(self, *args, **kwargs):

        from wirecloud.platform.workspace.models import VariableValue

        # Delete all IWidget's variables
        variables = Variable.objects.filter(iwidget=self)
        for var in variables:

            # Deleting variable value
            VariableValue.objects.filter(variable=var).delete()

            var.delete()

        # Delete IWidget and its position
        self.position.delete()
        icon_position = self.icon_position
        if icon_position is not None:
            icon_position.delete()

        # Delete IWidget from wiring
        wiring = json.loads(self.tab.workspace.wiringStatus)
        remove_related_iwidget_connections(wiring, self)
        self.tab.workspace.wiringStatus = json.dumps(wiring, ensure_ascii=False)
        self.tab.workspace.save()

        from wirecloud.platform.get_data import _invalidate_cached_variables
        _invalidate_cached_variables(self)

        super(IWidget, self).delete(*args, **kwargs)


class Variable(models.Model):

    vardef = models.ForeignKey('platform.VariableDef', verbose_name=_('Variable definition'))
    iwidget = models.ForeignKey(IWidget, verbose_name=_('IWidget'))

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_variable'

    def __unicode__(self):
        return str(self.pk) + " " + self.vardef.name

    def has_public_value(self):
        return self.vardef.has_public_value()

    def get_default_value(self):
        return self.vardef.get_default_value()
