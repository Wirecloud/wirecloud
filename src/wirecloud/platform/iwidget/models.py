# -*- coding: utf-8 -*-

# Copyright (c) 2011-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

import json

from django.db import models
from django.utils.encoding import python_2_unicode_compatible
from django.utils.translation import ugettext as _
from six import text_type

from wirecloud.platform.wiring.utils import remove_related_iwidget_connections


@python_2_unicode_compatible
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

    def __str__(self):
        return str(self.pk)


@python_2_unicode_compatible
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

    def __str__(self):
        return str(self.pk)

    def save(self, *args, **kwargs):

        super(IWidget, self).save(*args, **kwargs)
        self.tab.workspace.save()  # Invalidate workspace cache

    def delete(self, *args, **kwargs):

        # Delete all IWidget's variables
        self.variable_set.all().delete()

        # Delete IWidget and its position
        self.position.delete()
        icon_position = self.icon_position
        if icon_position is not None:
            icon_position.delete()

        # Delete IWidget from wiring
        wiring = json.loads(self.tab.workspace.wiringStatus)
        remove_related_iwidget_connections(wiring, self)
        self.tab.workspace.wiringStatus = json.dumps(wiring, ensure_ascii=False)
        self.tab.workspace.save()  # This also invalidates the workspace cache

        super(IWidget, self).delete(*args, **kwargs)


@python_2_unicode_compatible
class Variable(models.Model):

    vardef = models.ForeignKey('platform.VariableDef', verbose_name=_('Variable definition'))
    iwidget = models.ForeignKey(IWidget, verbose_name=_('IWidget'))
    value = models.TextField(_('Value'), blank=True)

    def save(self, *args, **kwargs):

        super(Variable, self).save(*args, **kwargs)
        self.iwidget.tab.workspace.save()  # Invalidate workspace cache

    def set_variable_value(self, value):

        new_value = text_type(value)
        if self.vardef.secure:
            from wirecloud.platform.workspace.utils import encrypt_value
            new_value = encrypt_value(new_value)

        self.value = new_value

    def get_variable_value(self):
        value = self.value

        if self.vardef.secure:
            from wirecloud.platform.workspace.utils import decrypt_value
            value = decrypt_value(value)

        if self.vardef.type == 'B':
            value = value.lower() == 'true'

        return value

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_variable'

    def __str__(self):
        return str(self.pk) + " " + self.vardef.name
