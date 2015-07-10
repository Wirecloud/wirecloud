# -*- coding: utf-8 -*-

# Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.utils.translation import ugettext as _
from six import text_type

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.platform.models import IWidget, Tab


def parse_value_from_text(info, value):
    if info['type'] == 'boolean':
        if isinstance(value, text_type):
            return value.strip().lower() in ('true', '1', 'on')
        else:
            return bool(value)
    elif info['type'] == 'number':
        return float(value)
    elif info['type'] in ('list', 'text', 'password'):
        return text_type(value)


def process_initial_value(vardef, initial_value=None):

    # Sets the default value of variable
    if vardef.get('readonly', False) is False and initial_value is not None:
        value = initial_value
    elif vardef.get('value', None) is not None:
        value = vardef['value']
    elif vardef['default']:
        value = vardef['default']
    else:
        value = ''

    return parse_value_from_text(vardef, value)


def update_title_value(iwidget, data):

    if 'title' in data:
        if data['title'] is None or data['title'].strip() == '':
            iwidget_info = iwidget.widget.resource.get_processed_info()
            iwidget.name = iwidget_info['title']
        else:
            iwidget.name = data['title']


def update_position_value(model, data, field):
    if field in data:
        size = data[field]

        if not isinstance(size, int):
            raise TypeError(_('Field %(field)s must contain a number value') % {"field": field})

        if size < 0:
            raise ValueError(_('Invalid value for %(field)s') % {"field": field})

        model[field] = size


def update_size_value(model, data, field):
    if field in data:
        size = data[field]

        if not isinstance(size, int):
            raise TypeError(_('Field %(field)s must contain a number value') % {"field": field})

        if size <= 0:
            raise ValueError(_('Invalid value for %(field)s') % {"field": field})

        model[field] = size


def update_icon_position(iwidget, data):
    if 'icon' not in iwidget.positions:
        iwidget.positions['icon'] = {}

    position = iwidget.positions['icon']

    update_position_value(position, data, 'top')
    update_position_value(position, data, 'left')


def update_position(iwidget, key, data):
    if key not in iwidget.positions:
        iwidget.positions[key] = {}

    position = iwidget.positions[key]

    update_size_value(position, data, 'width')
    update_size_value(position, data, 'height')
    update_position_value(position, data, 'top')
    update_position_value(position, data, 'left')
    update_position_value(position, data, 'zIndex')


def SaveIWidget(iwidget, user, tab, initial_variable_values):

    widget_uri = iwidget.get('widget')

    (widget_vendor, widget_name, widget_version) = widget_uri.split('/')
    resource = CatalogueResource.objects.select_related('widget').get(vendor=widget_vendor, short_name=widget_name, version=widget_version)
    if not resource.is_available_for(user):
        raise CatalogueResource.DoesNotExist

    iwidget_info = resource.get_processed_info()
    layout = iwidget.get('layout', 0)

    # Creates IWidget positions
    default_positions = {
        'widget': {
            'top': 0,
            'left': 0,
            'zIndex': 0,
            'height': 0,
            'width': 0,
            'minimized': False,
            'fulldragboard': False,
        },
        'icon': {
            'top': 0,
            'left': 0,
        },
    }

    new_iwidget = IWidget(name=iwidget_info['title'], widget=resource.widget, tab=tab, layout=layout, positions=default_positions)
    for vardef in (iwidget_info['preferences'] + iwidget_info['properties']):
        if initial_variable_values and vardef['name'] in initial_variable_values:
            initial_value = initial_variable_values[vardef['name']]
        else:
            initial_value = None
        new_iwidget.set_variable_value(vardef['name'], process_initial_value(vardef, initial_value))

    update_title_value(new_iwidget, iwidget)
    update_position(new_iwidget, 'widget', iwidget)
    update_icon_position(new_iwidget, iwidget)

    new_iwidget.save()
    return new_iwidget


def UpdateIWidget(data, user, tab):

    iwidget = IWidget.objects.get(tab=tab, pk=data.get('id'))

    if 'widget' in data:
        widget_uri = data.get('widget')

        (widget_vendor, widget_name, widget_version) = widget_uri.split('/')
        resource = CatalogueResource.objects.select_related('widget').get(vendor=widget_vendor, short_name=widget_name, version=widget_version)
        if not resource.is_available_for(user):
            raise CatalogueResource.DoesNotExist

        iwidget.widget = resource.widget

    update_title_value(iwidget, data)

    if 'tab' in data:
        if data['tab'] != tab.id:
            newtab = Tab.objects.get(workspace__pk=tab.workspace_id, pk=data['tab'])
            iwidget.tab = newtab

    if 'layout' in data:
        layout = data['layout']
        iwidget.layout = layout

    # update positions
    update_position(iwidget, 'widget', data)
    update_icon_position(iwidget, data)

    # save the changes
    iwidget.save()
