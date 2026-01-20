# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.

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
            except (KeyError, ValueError):
                return 0
    else:  # info['type'] in ('list', 'text', 'password'):
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

def update_screen_size_value(model, data, field):
    if field in data:
        value = data[field]

        if type(value) not in (int,):
            raise TypeError(_('Field %(field)s must contain a number value') % {"field": field})

        if value < -1:
            raise ValueError(_('Invalid value for %(field)s') % {"field": field})

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


def update_anchor_value(model, data):
    if "anchor" in data:
        anchor = data["anchor"]

        if type(anchor) != str:
            raise TypeError(_('anchor field must contain a string value'))

        if anchor not in ("top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"):
            raise ValueError(_('Invalid value for anchor field'))

        model["anchor"] = anchor

def check_intervals(data):
    # The screen size intervals should cover the interval [0, +inf) and should not overlap nor have gaps,
    # each interval is defined by the properties 'moreOrEqual' and 'lessOrEqual'

    data.sort(key=lambda x: x.get('moreOrEqual', float('-inf')))

    if data[0].get('moreOrEqual') != 0:
        raise ValueError('The first interval must start from 0')

    for i in range(len(data) - 1):
        if data[i]['lessOrEqual'] + 1 != data[i + 1].get('moreOrEqual'):
            raise ValueError('Intervals should not overlap nor have gaps')

    if data[-1]['lessOrEqual'] != -1:
        raise ValueError('The last interval must extend to infinity')

def update_position(iwidget, key, data):
    # Check if we have duplicate ids in the layoutConfigurations
    ids = set()
    for layoutConfig in data["layoutConfigurations"]:
        if 'id' not in layoutConfig:
            raise ValueError('Missing id field')
        if layoutConfig['id'] in ids:
            raise ValueError('Duplicate id field')
        ids.add(layoutConfig['id'])

    intervals = {}
    for conf in iwidget.positions["configurations"]:
        intervals[conf['id']] = conf

    for layoutConfig in data["layoutConfigurations"]:
        if not 'action' in layoutConfig:
            raise ValueError('Missing action field')
        if layoutConfig['action'] not in ('update', 'delete'):
            raise ValueError('Invalid value for action field: ' + layoutConfig['action'])

        if layoutConfig['action'] == 'delete':
            del intervals[layoutConfig['id']]
        else:
            if not layoutConfig['id'] in intervals:
                intervals[layoutConfig['id']] = {
                    'id': layoutConfig['id'],
                    'moreOrEqual': 0,
                    'lessOrEqual': -1,
                }

                intervals[layoutConfig['id']][key] = {
                    'top': 0,
                    'left': 0,
                    'zIndex': 0,
                    'height': 0,
                    'width': 0,
                    'minimized': False,
                    'titlevisible': True,
                    'fulldragboard': False
                }

            update_screen_size_value(intervals[layoutConfig['id']], layoutConfig, 'moreOrEqual')
            update_screen_size_value(intervals[layoutConfig['id']], layoutConfig, 'lessOrEqual')
            update_position_value(intervals[layoutConfig['id']][key], layoutConfig, 'top')
            update_position_value(intervals[layoutConfig['id']][key], layoutConfig, 'left')
            update_position_value(intervals[layoutConfig['id']][key], layoutConfig, 'zIndex')
            update_size_value(intervals[layoutConfig['id']][key], layoutConfig, 'height')
            update_size_value(intervals[layoutConfig['id']][key], layoutConfig, 'width')
            update_boolean_value(intervals[layoutConfig['id']][key], layoutConfig, 'minimized')
            update_boolean_value(intervals[layoutConfig['id']][key], layoutConfig, 'titlevisible')
            update_boolean_value(intervals[layoutConfig['id']][key], layoutConfig, 'fulldragboard')
            update_boolean_value(intervals[layoutConfig['id']][key], layoutConfig, 'relwidth')
            update_boolean_value(intervals[layoutConfig['id']][key], layoutConfig, 'relheight')
            update_boolean_value(intervals[layoutConfig['id']][key], layoutConfig, 'relx')
            update_boolean_value(intervals[layoutConfig['id']][key], layoutConfig, 'rely')
            update_anchor_value(intervals[layoutConfig['id']][key], layoutConfig)

    newPositions = list(intervals.values())
    check_intervals(newPositions)

    iwidget.positions["configurations"] = newPositions


def update_permissions(iwidget, data):
    permissions = iwidget.permissions.setdefault('viewer', {})
    update_boolean_value(permissions, data, 'move')


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

    new_iwidget.positions = {
        'configurations': []
    }


    if initial_variable_values is not None:
        set_initial_values(new_iwidget, initial_variable_values, iwidget_info, user)

    update_title_value(new_iwidget, iwidget)
    if "layoutConfigurations" in iwidget:
        update_position(new_iwidget, 'widget', iwidget)
    else:
        # set default positions
        new_iwidget.positions['configurations'] = [{
            'moreOrEqual': 0,
            'lessOrEqual': -1,
            'id': 0,
            'widget': {
                'top': 0,
                'left': 0,
                'zIndex': 0,
                'height': 1,
                'width': 1,
                'minimized': False,
                'titlevisible': True,
                'fulldragboard': False,
            },
        }]

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
        if data['layout'] < 0:
            raise ValueError('Invalid value for layout field')
        layout = data['layout']
        iwidget.layout = layout

    update_permissions(iwidget, data.get('permissions', {}).get('viewer', {}))

    # update positions
    if "layoutConfigurations" in data:
        update_position(iwidget, 'widget', data)

    # save the changes
    iwidget.save(updatecache=updatecache)
