# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.template.base import parse_contacts_info
from wirecloud.commons.utils.template.writers import rdf
from wirecloud.commons.utils.template.writers import xml
from wirecloud.platform.models import IWidget
from wirecloud.platform.wiring.utils import get_wiring_skeleton, parse_wiring_old_version
from wirecloud.platform.workspace.utils import VariableValueCacheManager


def get_iwidgets_description(included_iwidgets):
    description = "Wirecloud Mashup composed of: "

    description = ', '.join([iwidget.widget.resource.get_processed_info()['title'] for iwidget in included_iwidgets])

    return description


def get_workspace_description(workspace):
    included_iwidgets = IWidget.objects.filter(tab__workspace=workspace)

    return get_iwidgets_description(included_iwidgets)


def process_iwidget(workspace, iwidget, wiring, parametrization, readOnlyWidgets, cache_manager):

    widget = iwidget.widget
    widget_description = widget.resource.get_template().get_resource_info()
    iwidget_id = str(iwidget.id)
    iwidget_params = {}
    if iwidget_id in parametrization:
        iwidget_params = parametrization[iwidget_id]

    # input and output endpoints
    for output_endpoint in widget_description['wiring']['outputs']:
        wiring['outputs'].append({
            'name': output_endpoint['name'],
            'type': output_endpoint['type'],
            'label': output_endpoint['label'],
            'description': output_endpoint['description'],
            'friendcode': output_endpoint['friendcode'],
        })

    for input_endpoint in widget_description['wiring']['inputs']:
        wiring['inputs'].append({
            'name': input_endpoint['name'],
            'type': input_endpoint['type'],
            'label': input_endpoint['label'],
            'description': input_endpoint['description'],
            'friendcode': input_endpoint['friendcode'],
            'actionlabel': input_endpoint['actionlabel'],
        })

    # preferences
    widget_preferences = widget_description['preferences']
    preferences = {}
    for pref in widget_preferences:
        status = 'normal'
        if pref['name'] in iwidget_params:
            iwidget_param_desc = iwidget_params[pref['name']]
            status = iwidget_param_desc.get('status', 'normal')
            source = iwidget_param_desc.get('source', 'current')
            if source == 'default':
                if status == 'normal':
                    # Do not issue a Preference element for this preference
                    continue
                value = None
            elif source == 'current':
                value = cache_manager.get_variable_value_from_varname("iwidget", iwidget.id, pref['name'])
            elif source == 'custom':
                value = iwidget_param_desc['value']
            else:
                raise Exception('Invalid preference value source: %s' % source)

        else:
            value = cache_manager.get_variable_value_from_varname("iwidget", iwidget.id, pref['name'])

        preferences[pref['name']] = {
            'readonly': status != 'normal',
            'hidden': status == 'hidden',
        }

        if value is not None:
            if pref['type'] == 'boolean':
                value = str(value).lower()
            elif pref['type'] == 'number':
                value = str(value)

            preferences[pref['name']]['value'] = value

    # iWidget properties
    widget_properties = widget_description['properties']
    properties = {}
    for prop in widget_properties:
        status = 'normal'
        if prop['name'] in iwidget_params:
            iwidget_param_desc = iwidget_params[prop['name']]
            status = iwidget_param_desc.get('status', 'normal')
            source = iwidget_param_desc.get('source', 'current')
            if source == 'default':
                if status == 'normal':
                    # Do not issue a Property element for this property
                    continue
                else:
                    value = None
            elif source == 'current':
                value = cache_manager.get_variable_value_from_varname("iwidget", iwidget.id, prop['name'])
            elif source == 'custom':
                value = iwidget_param_desc['value']
            else:
                raise Exception('Invalid property value source: %s' % source)
        else:
            value = cache_manager.get_variable_value_from_varname("iwidget", iwidget.id, prop['name'])

        properties[prop['name']] = {
            'readonly': status != 'normal',
            'value': value,
        }

    return {
        'id': iwidget_id,
        'vendor': iwidget.widget.resource.vendor,
        'name': iwidget.widget.resource.short_name,
        'version': iwidget.widget.resource.version,
        'title': iwidget.name,
        'readonly': readOnlyWidgets,
        'properties': properties,
        'preferences': preferences,
        'position': {
            'x': str(iwidget.positions['widget']['left']),
            'y': str(iwidget.positions['widget']['top']),
            'z': str(iwidget.positions['widget']['zIndex']),
        },
        'rendering': {
            'width': str(iwidget.positions['widget']['width']),
            'height': str(iwidget.positions['widget']['height']),
            'layout': str(iwidget.layout),
            'fulldragboard': bool(iwidget.positions['widget']['fulldragboard']),
            'minimized': bool(iwidget.positions['widget']['minimized']),
            'titlevisible': bool(iwidget.positions['widget'].get('titlevisible', True)),
        },
    }


def build_json_template_from_workspace(options, workspace, user):
    options['type'] = 'mashup'
    options['params'] = []
    options['embedmacs'] = options.get('embedmacs', False) is True
    options['embedded'] = set()
    options['translations'] = {}
    options['translation_index_usage'] = {}

    description = options.get('description', '').strip()
    if description == '':
        options['description'] = get_workspace_description(workspace)

    if 'authors' not in options:
        options['authors'] = ({'name': str(user)},)
    elif isinstance(options['authors'], str):
        options['authors'] = parse_contacts_info(options['authors'])

    if 'contributors' not in options:
        options['contributors'] = ()
    elif isinstance(options['contributors'], str):
        options['contributors'] = parse_contacts_info(options['contributors'])

    options['requirements'] = []

    readOnlyWidgets = options.get('readOnlyWidgets', False)
    parametrization = options.get('parametrization')
    if not parametrization:
        parametrization = {}
    if 'iwidgets' not in parametrization:
        parametrization['iwidgets'] = {}
    if 'ioperators' not in parametrization:
        parametrization['ioperators'] = {}

    cache_manager = VariableValueCacheManager(workspace, workspace.creator)

    # Workspace preferences
    options['preferences'] = {}
    for preference in workspace.workspacepreference_set.all():
        # Filter public and sharelist preferences
        if not preference.inherit and preference.name not in ("public", "sharelist"):
            options['preferences'][preference.name] = preference.value

    # Tabs and their preferences
    options['tabs'] = []
    options['wiring'] = {
        'inputs': [],
        'outputs': [],
    }
    for tab in workspace.tab_set.order_by('position'):
        preferences = {}
        for preference in tab.tabpreference_set.all():
            if not preference.inherit:
                preferences[preference.name] = preference.value

        resources = []
        for iwidget in tab.iwidget_set.select_related('widget__resource').all():
            resource_info = process_iwidget(workspace, iwidget, options['wiring'], parametrization['iwidgets'], readOnlyWidgets, cache_manager)
            resources.append(resource_info)
            if options['embedmacs']:
                options['embedded'].add('/'.join((resource_info['vendor'], resource_info['name'], resource_info['version'])))

        tab_info = {
            'name': tab.name,
            'resources': resources,
            'preferences': preferences,
        }
        if tab.title is not None and tab.title.strip() != "":
            tab_info['title'] = tab.title

        options['tabs'].append(tab_info)

    # wiring conections and operators
    readOnlyConnectables = options.get('readOnlyConnectables', False)
    wiring_status = workspace.wiringStatus
    if len(wiring_status) == 0:
        wiring_status = get_wiring_skeleton()

    # Set the wiring status' version
    if wiring_status.get('version', '1.0') == '1.0':
        wiring_status = parse_wiring_old_version(wiring_status)

    options['wiring']['version'] = '2.0'
    options['wiring']['operators'] = {}
    for operator_id, operator in wiring_status['operators'].items():
        operator_data = {
            'name': operator['name'],
            'preferences': {},
        }

        vendor, name, version = operator['name'].split('/')
        resource = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version)
        operator_info = resource.json_description
        operator_params = parametrization['ioperators'].get(operator_id, {})
        for pref_index, preference in enumerate(operator_info['preferences']):

            status = 'normal'
            if preference['name'] in operator_params:
                ioperator_param_desc = operator_params[preference['name']]
                status = ioperator_param_desc.get('status', 'normal')
                source = ioperator_param_desc.get('source', 'current')
                if source == 'default':
                    if status == 'normal':
                        # Do not issue a Preference element for this preference
                        continue
                    value = None
                elif source == 'current':
                    value = cache_manager.get_variable_value_from_varname("ioperator", operator_id, preference['name'])
                elif source == 'custom':
                    value = ioperator_param_desc['value']
                else:
                    raise Exception('Invalid preference value source: %s' % source)

            else:
                value = cache_manager.get_variable_value_from_varname("ioperator", operator_id, preference['name'])

            operator_data['preferences'][preference['name']] = {
                'readonly': status != 'normal',
                'hidden': status == 'hidden',
            }
            if value is not None:
                operator_data['preferences'][preference['name']]['value'] = value

        options['wiring']['operators'][operator_id] = operator_data
        if options['embedmacs']:
            options['embedded'].add(operator['name'])

    options['wiring']['connections'] = []
    for connection in wiring_status['connections']:
        options['wiring']['connections'].append({
            'source': connection['source'],
            'target': connection['target'],
            'readonly': readOnlyConnectables,
        })

    options['wiring']['visualdescription'] = wiring_status['visualdescription']

    embedded = options['embedded']
    options['embedded'] = []
    for resource in embedded:
        (vendor, name, version) = resource.split('/')
        options['embedded'].append({
            'vendor': vendor,
            'name': name,
            'version': version,
            'src': 'macs/%s_%s_%s.wgt' % (vendor, name, version)
        })
    del options['embedmacs']

    return options


def build_xml_template_from_workspace(options, workspace, user, raw=False):

    build_json_template_from_workspace(options, workspace, user)

    return xml.write_xml_description(options, raw=raw)


def build_rdf_template_from_workspace(options, workspace, user):

    build_json_template_from_workspace(options, workspace, user)

    return rdf.build_rdf_graph(options)
