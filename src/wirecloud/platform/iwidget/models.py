# -*- coding: utf-8 -*-

# Copyright (c) 2011-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.db import models
from django.utils.translation import ugettext as _

from wirecloud.commons.fields import JSONField
from wirecloud.platform.wiring.utils import remove_widget_from_wiring_status


class IWidget(models.Model):

    widget = models.ForeignKey('platform.Widget', on_delete=models.SET_NULL, verbose_name=_('Widget'), null=True)
    widget_uri = models.CharField(_('Widget URI'), max_length=250, null=False, blank=False)
    name = models.CharField(_('Name'), max_length=250)
    tab = models.ForeignKey('platform.Tab', on_delete=models.CASCADE, verbose_name=_('Tab'))
    layout = models.IntegerField(_('Layout'), default=0)
    positions = JSONField(blank=True)
    readOnly = models.BooleanField(_('Read Only'), default=False)
    variables = JSONField(blank=True)

    class Meta:
        app_label = 'platform'
        db_table = 'wirecloud_iwidget'

    def __str__(self):
        return str(self.pk)

    def set_variable_value(self, var_name, value, user):

        iwidget_info = self.widget.resource.get_processed_info(translate=False, process_variables=True)

        vardef = iwidget_info['variables']['all'][var_name]
        if vardef['secure']:
            from wirecloud.platform.workspace.utils import encrypt_value
            value = encrypt_value(value)
        elif vardef['type'] == 'boolean':
            if isinstance(value, str):
                value = value.strip().lower() == "true"
            else:
                value = bool(value)

        elif vardef['type'] == 'number':
            value = float(value)

        if "users" in self.variables.get(var_name, ""):
            self.variables[var_name]["users"] = {"%s" % user.id: value}
        else:
            self.variables[var_name] = {"users": {"%s" % user.id: value}}

    def save(self, *args, **kwargs):

        updatecache = kwargs.pop('updatecache', True)
        if self.widget is not None:
            self.widget_uri = self.widget.resource.local_uri_part

        super(IWidget, self).save(*args, **kwargs)

        if updatecache:
            self.tab.workspace.save()  # Invalidate workspace cache

    def delete(self, *args, **kwargs):

        # Delete IWidget from wiring
        remove_widget_from_wiring_status("%s" % self.id, self.tab.workspace.wiringStatus)
        self.tab.workspace.save()  # This also invalidates the workspace cache

        super(IWidget, self).delete(*args, **kwargs)
