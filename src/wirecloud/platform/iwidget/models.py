# -*- coding: utf-8 -*-

# Copyright (c) 2011-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from wirecloud.commons.fields import JSONField
from wirecloud.platform.wiring.utils import remove_related_iwidget_connections


@python_2_unicode_compatible
class IWidget(models.Model):

    name = models.CharField(_('Name'), max_length=250)
    widget = models.ForeignKey('platform.Widget', verbose_name=_('Widget'))
    tab = models.ForeignKey('platform.Tab', verbose_name=_('Tab'))
    layout = models.IntegerField(_('Layout'), default=0)
    positions = JSONField(blank=True)
    refused_version = models.CharField(_('Refused Version'), max_length=150, blank=True, null=True)
    readOnly = models.BooleanField(_('Read Only'), default=False)
    variables = JSONField(blank=True)

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_iwidget'

    def __str__(self):
        return str(self.pk)

    def set_variable_value(self, var_name, value):

        iwidget_info = self.widget.resource.get_processed_info(translate=False, process_variables=True)

        vardef = iwidget_info['variables']['all'][var_name]
        if vardef['secure']:
            from wirecloud.platform.workspace.utils import encrypt_value
            value = encrypt_value(value)
        elif vardef['type'] == 'boolean':
            value = bool(value)
        elif vardef['type'] == 'number':
            value = float(value)

        self.variables[var_name] = value

    def save(self, *args, **kwargs):

        super(IWidget, self).save(*args, **kwargs)
        self.tab.workspace.save()  # Invalidate workspace cache

    def delete(self, *args, **kwargs):

        # Delete IWidget from wiring
        wiring = json.loads(self.tab.workspace.wiringStatus)
        remove_related_iwidget_connections(wiring, self)
        self.tab.workspace.wiringStatus = json.dumps(wiring, ensure_ascii=False)
        self.tab.workspace.save()  # This also invalidates the workspace cache

        super(IWidget, self).delete(*args, **kwargs)
