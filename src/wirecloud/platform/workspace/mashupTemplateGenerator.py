# -*- coding: utf-8 -*-

# Copyright 2012-2013 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import json
from lxml import etree

from django.conf import settings

from wirecloud.commons.utils.template.writers import rdf
from wirecloud.platform.get_data import get_variable_value_from_varname
from wirecloud.platform.models import IWidget, Tab, TabPreference, WorkspacePreference


def typeCode2typeText(typeCode):
    if typeCode == 'S':
            return 'text'
    elif typeCode == 'N':
            return 'number'
    elif typeCode == 'D':
            return 'date'
    elif typeCode == 'B':
            return 'boolean'
    elif typeCode == 'L':
            return 'list'
    elif typeCode == 'P':
            return 'password'

    return None


def get_iwidgets_description(included_iwidgets):
    description = "Wirecloud Mashup composed of: "

    for iwidget in included_iwidgets:
        description += iwidget.widget.resource.display_name + ', '

    return description[:-2]


def get_workspace_description(workspace):
    included_iwidgets = IWidget.objects.filter(tab__workspace=workspace)

    return get_iwidgets_description(included_iwidgets)


def build_template_from_workspace(options, workspace, user):

    # process
    vendor = options.get('vendor')
    name = options.get('name')
    version = options.get('version')
    email = options.get('email')

    description = options.get('description')
    if description:
        description = description + " \n " + get_workspace_description(workspace)
    else:
        description = get_workspace_description(workspace)

    author = options.get('author')
    if not author:
        author = user.username

    readOnlyWidgets = options.get('readOnlyWidgets', False)
    readOnlyConnectables = options.get('readOnlyConnectables', False)

    parametrization = options.get('parametrization')
    if not parametrization:
        parametrization = {}

    # Build the template
    workspace_tabs = Tab.objects.filter(workspace=workspace).order_by('position')
    included_iwidgets = IWidget.objects.filter(tab__workspace=workspace)

    template = etree.Element('Template', xmlns="http://morfeo-project.org/2007/Template")
    desc = etree.Element('Catalog.ResourceDescription')
    template.append(desc)
    etree.SubElement(desc, 'Vendor').text = vendor
    etree.SubElement(desc, 'Name').text = name
    etree.SubElement(desc, 'Version').text = version
    etree.SubElement(desc, 'Author').text = author
    etree.SubElement(desc, 'Mail').text = email
    etree.SubElement(desc, 'Description').text = description
    etree.SubElement(desc, 'ImageURI').text = options.get('imageURI', '')
    etree.SubElement(desc, 'WikiURI').text = options.get('doc_uri', '')

    resources = etree.SubElement(desc, 'IncludedResources')

    # Workspace preferences
    preferences = WorkspacePreference.objects.filter(workspace=workspace)
    for preference in preferences:
        if not preference.inherit:
            etree.SubElement(resources, 'Preference', name=preference.name, value=preference.value)

    # Tabs and their preferences
    tabs = {}
    for tab in workspace_tabs:
        tabElement = etree.SubElement(resources, 'Tab', name=tab.name, id=str(tab.id))
        tabs[tab.id] = tabElement
        preferences = TabPreference.objects.filter(tab=tab.pk)
        for preference in preferences:
            if not preference.inherit:
                etree.SubElement(tabElement, 'Preference', name=preference.name, value=preference.value)

    wiring = etree.SubElement(template, 'Platform.Wiring')

    # iWidgets
    for iwidget in included_iwidgets:
        widget = iwidget.widget
        iwidget_id = str(iwidget.id)
        iwidget_params = {}
        if iwidget_id in parametrization:
            iwidget_params = parametrization[iwidget_id]

        resource = etree.SubElement(tabs[iwidget.tab.id], 'Resource', id=iwidget_id, vendor=widget.resource.vendor, name=widget.resource.short_name, version=widget.resource.version, title=iwidget.name)
        if readOnlyWidgets:
            resource.set('readonly', 'true')

        position = iwidget.position
        etree.SubElement(resource, 'Position', x=str(position.posX), y=str(position.posY), z=str(position.posZ))
        etree.SubElement(resource, 'Rendering', height=str(position.height),
            width=str(position.width), minimized=str(position.minimized),
            fulldragboard=str(position.fulldragboard), layout=str(iwidget.layout))

        widget_preferences = widget.get_related_preferences()
        for pref in widget_preferences:
            status = 'normal'
            if pref.name in iwidget_params:
                iwidget_param_desc = iwidget_params[pref.name]
                if iwidget_param_desc['source'] == 'default':
                    # Do not issue a Preference element for this preference
                    continue
                value = iwidget_param_desc['value']
                status = iwidget_param_desc['status']
            else:
                value = get_variable_value_from_varname(workspace.creator, iwidget, pref.name)

            element = etree.SubElement(resource, 'Preference', name=pref.name, value=value)
            if status != 'normal':
                element.set('readonly', 'true')
                if status != 'readonly':
                    element.set('hidden', 'true')

        widget_properties = widget.get_related_properties()
        for prop in widget_properties:
            status = 'normal'
            if prop.name in iwidget_params:
                iwidget_param_desc = iwidget_params[prop.name]
                if iwidget_param_desc['source'] == 'default':
                    # Do not issue a Property element for this property
                    continue
                value = iwidget_param_desc['value']
                status = iwidget_param_desc['status']
            else:
                value = get_variable_value_from_varname(workspace.creator, iwidget, prop.name)

            element = etree.SubElement(resource, 'Property', name=prop.name, value=value)
            if status != 'normal':
                element.set('readonly', 'true')

        outputs = widget.get_related_events()

        for output_endpoint in outputs:
            wiring.append(etree.Element('OutputEndpoint', name=output_endpoint.name, type=typeCode2typeText(output_endpoint.type), label=output_endpoint.label, friendcode=output_endpoint.friend_code))

        inputs = widget.get_related_slots()

        for input_endpoint in inputs:
            wiring.append(etree.Element('InputEndpoint', name=input_endpoint.name, type=typeCode2typeText(input_endpoint.type), label=input_endpoint.label, friendcode=input_endpoint.friend_code))

    # wiring
    try:
        wiring_status = json.loads(workspace.wiringStatus)
    except:
        wiring_status = {
            "operators": {},
            "connections": [],
        }

    for id_, operator in wiring_status['operators'].iteritems():
        etree.SubElement(wiring, 'Operator', id=id_, name=operator['name'])

    for connection in wiring_status['connections']:
        element = etree.SubElement(wiring, 'Connection')
        if readOnlyConnectables:
            element.set('readonly', 'true')

        etree.SubElement(element, 'Source', type=connection['source']['type'], id=str(connection['source']['id']), endpoint=connection['source']['endpoint'])
        etree.SubElement(element, 'Target', type=connection['target']['type'], id=str(connection['target']['id']), endpoint=connection['target']['endpoint'])

    return template


def process_iwidget(workspace, iwidget, wiring, parametrization, readOnlyWidgets):

    widget = iwidget.widget
    iwidget_id = str(iwidget.id)
    iwidget_params = {}
    if iwidget_id in parametrization:
        iwidget_params = parametrization[iwidget_id]

    # input and output endpoints
    outputs = widget.get_related_events()

    for output_endpoint in outputs:
        wiring['outputs'].append({
            'name': output_endpoint.name,
            'type': output_endpoint.type,
            'label': output_endpoint.label,
            'friendcode': output_endpoint.friend_code,
        })

    inputs = widget.get_related_slots()

    for input_endpoint in inputs:
        wiring['inputs'].append({
            'name': input_endpoint.name,
            'type': input_endpoint.type,
            'label': input_endpoint.label,
            'friendcode': input_endpoint.friend_code,
            'action_label': input_endpoint.action_label,
        })

    # preferences
    widget_preferences = widget.get_related_preferences()
    preferences = {}
    for pref in widget_preferences:
        status = 'normal'
        if pref.name in iwidget_params:
            iwidget_param_desc = iwidget_params[pref.name]
            if iwidget_param_desc['source'] == 'default':
                # Do not issue a Preference element for this preference
                continue
            value = iwidget_param_desc['value']
            status = iwidget_param_desc['status']
        else:
            value = get_variable_value_from_varname(workspace.creator, iwidget, pref.name)

        preferences[pref.name] = {
            'readonly': status != 'normal',
            'hidden': status == 'hidden',
            'value': value,
        }

    # iWidget properties
    widget_properties = widget.get_related_properties()
    properties = {}
    for prop in widget_properties:
        status = 'normal'
        if prop.name in iwidget_params:
            iwidget_param_desc = iwidget_params[prop.name]
            if iwidget_param_desc['source'] == 'default':
                # Do not issue a Property element for this property
                continue
            value = iwidget_param_desc['value']
            status = iwidget_param_desc['status']
        else:
            value = get_variable_value_from_varname(workspace.creator, iwidget, prop.name)

        properties[prop.name] = {
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
            'x': str(iwidget.position.posX),
            'y': str(iwidget.position.posY),
            'z': str(iwidget.position.posZ),
        },
        'rendering': {
            'width': str(iwidget.position.width),
            'height': str(iwidget.position.height),
            'layout': str(iwidget.layout),
            'fulldragboard': str(iwidget.position.fulldragboard),
            'minimized': str(iwidget.position.minimized),
        },
    }

def build_rdf_template_from_workspace(options, workspace, user):

    options['type'] = 'mashup'
    description = options.get('description', '').strip()
    if description == '':
        options['description'] = get_workspace_description(workspace)
    else:
        options['description'] = description + '\n' + get_workspace_description(workspace)

    if options.get('author', '').strip() == '':
        options['author'] = unicode(user)

    readOnlyWidgets = options.get('readOnlyWidgets', False)
    parametrization = options.get('parametrization')
    if not parametrization:
        parametrization = {}

    # Workspace preferences
    preferences = WorkspacePreference.objects.filter(workspace=workspace)
    options['preferences'] = {}
    for preference in preferences:
        if not preference.inherit:
            options['preferences'][preference.name] = preference.value

    # Tabs and their preferences
    workspace_tabs = Tab.objects.filter(workspace=workspace).order_by('position')
    options['tabs'] = []
    options['wiring'] = {
        'inputs': [],
        'outputs': [],
    }
    for tab in workspace_tabs:
        preferences = {}
        for preference in tab.tabpreference_set.all():
            if not preference.inherit:
                preferences[preference.name] = preference.value

        resources = []
        for iwidget in tab.iwidget_set.select_related('widget__resource', 'position').all():
            resources.append(process_iwidget(workspace, iwidget, options['wiring'], parametrization, readOnlyWidgets))

        options['tabs'].append({
            'name': tab.name,
            'resources': resources,
            'preferences': preferences,
        })

    # wiring conections and operators
    readOnlyConnectables = options.get('readOnlyConnectables', False)
    try:
        wiring_status = json.loads(workspace.wiringStatus)
    except:
        wiring_status = {
            "operators": {},
            "connections": [],
        }

    options['wiring']['operators'] = {}
    for id_, operator in wiring_status['operators'].iteritems():
        options['wiring']['operators'][id_] = {
            'name': operator['name'],
        }

    options['wiring']['connections'] = []
    for connection in wiring_status['connections']:
        options['wiring']['connections'].append({
            'source': connection['source'],
            'target': connection['target'],
            'readonly': readOnlyConnectables,
        })

    options['wiring']['views'] = wiring_status.get('views', ())

    # TODO wikiURI => doc_uri
    return rdf.build_rdf_graph(options)
