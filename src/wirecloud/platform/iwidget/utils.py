# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.platform.models import IWidget, Tab


def parse_value_from_text(info, value):
    if info['type'] == 'boolean':
        return value.strip().lower() in ('true', '1', 'on')
    elif info['type'] == 'number':
        try:
            return float(value)
        except ValueError:
            try:
                return float(info['default'])
            except ValueError:
                return 0
    elif info['type'] in ('list', 'text', 'password'):
        return str(value)


def process_initial_value(vardef, initial_value=None):

    # Sets the default value of variable
    if vardef.get('readonly', False) is False and initial_value is not None:
        value = initial_value
    elif vardef.get('value', None) is not None:
        value = vardef['value']
    elif vardef['default']:
        value = parse_value_from_text(vardef, vardef['default'])
    else:
        value = ''
    return value


def update_title_value(iwidget, data):

    if 'title' in data:
        if data['title'] is None or data['title'].strip() == '':
            iwidget_info = iwidget.widget.resource.get_processed_info()
            iwidget.name = iwidget_info['title']
        else:
            iwidget.name = data['title']


def update_boolean_value(model, data, field):
    if field in data:
        value = data[field]

        if type(value) is not bool:
            raise TypeError(_('Field %(field)s must contain a boolean value') % {"field": field})

        model[field] = value


def update_position_value(model, data, field, data_field=None):
    data_field = data_field if data_field is not None else field
    if data_field in data:
        size = data[data_field]

        if type(size) not in (int, float):
            raise TypeError(_('Field %(field)s must contain a number value') % {"field": data_field})

        if size < 0:
            raise ValueError(_('Invalid value for %(field)s') % {"field": data_field})

        model[field] = size


def update_size_value(model, data, field):
    if field in data:
        size = data[field]

        if type(size) not in (int, float):
            raise TypeError(_('Field %(field)s must contain a number value') % {"field": field})

        if size <= 0:
            raise ValueError(_('Invalid value for %(field)s') % {"field": field})

        model[field] = size


def update_icon_position(iwidget, data):
    if 'icon' not in iwidget.positions:
        iwidget.positions['icon'] = {}

    position = iwidget.positions['icon']

    update_position_value(position, data, 'top', 'icon_top')
    update_position_value(position, data, 'left', 'icon_left')


def update_position(iwidget, key, data):
    if key not in iwidget.positions:
        iwidget.positions[key] = {}

    position = iwidget.positions[key]

    update_size_value(position, data, 'width')
    update_size_value(position, data, 'height')
    update_position_value(position, data, 'top')
    update_position_value(position, data, 'left')
    update_position_value(position, data, 'zIndex')
    update_boolean_value(position, data, 'minimized')
    update_boolean_value(position, data, 'titlevisible')
    update_boolean_value(position, data, 'fulldragboard')


def update_widget_value(iwidget, data, user, required=False):

    if 'widget' in data:
        (widget_vendor, widget_name, widget_version) = data['widget'].split('/')
        resource = CatalogueResource.objects.select_related('widget').get(vendor=widget_vendor, short_name=widget_name, version=widget_version)
        if not resource.is_available_for(user):
            raise CatalogueResource.DoesNotExist

        if resource.resource_type() != 'widget':
            raise ValueError(_('%(uri)s is not a widget') % {"uri": data['widget']})

        iwidget.widget = resource.widget
        return resource
    elif required:
        raise ValueError('Missing widget info')


def set_initial_values(iwidget, initial_values, iwidget_info, user):

    for vardef in (iwidget_info['preferences'] + iwidget_info['properties']):
        if vardef['name'] in initial_values:
            initial_value = initial_values[vardef['name']]
        else:
            initial_value = None
        iwidget.set_variable_value(vardef['name'], process_initial_value(vardef, initial_value), user)


def SaveIWidget(iwidget, user, tab, initial_variable_values=None, commit=True):

    new_iwidget = IWidget(tab=tab)

    resource = update_widget_value(new_iwidget, iwidget, user, required=True)
    iwidget_info = resource.get_processed_info()
    new_iwidget.name = iwidget_info['title']
    new_iwidget.layout = iwidget.get('layout', 0)

    # set default positions
    new_iwidget.positions = {
        'widget': {
            'top': 0,
            'left': 0,
            'zIndex': 0,
            'height': 0,
            'width': 0,
            'minimized': False,
            'titlevisible': True,
            'fulldragboard': False,
        },
        'icon': {
            'top': 0,
            'left': 0,
        },
    }

    if initial_variable_values is not None:
        set_initial_values(new_iwidget, initial_variable_values, iwidget_info, user)

    update_title_value(new_iwidget, iwidget)
    update_position(new_iwidget, 'widget', iwidget)
    update_icon_position(new_iwidget, iwidget)

    if commit:
        new_iwidget.save()

    return new_iwidget


def UpdateIWidget(data, user, tab, updatecache=True):

    iwidget = IWidget.objects.get(tab=tab, pk=data.get('id'))

    update_widget_value(iwidget, data, user)
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
    iwidget.save(updatecache=updatecache)
