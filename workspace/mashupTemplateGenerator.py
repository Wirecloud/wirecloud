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

from django.conf import settings
from lxml import etree

from igadget.models import IGadget, Variable
from workspace.models import Tab, WorkSpaceVariable
from preferences.models import WorkSpacePreference, TabPreference
from connectable.models import InOut, In, Out, RelatedInOut


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


def get_igadgets_description(included_igadgets):
    description = "EzWeb Mashup composed of: "

    for igadget in included_igadgets:
        description += igadget.gadget.name + ', '

    return description[:-2]


def get_workspace_description(workspace):
    included_igadgets = IGadget.objects.filter(tab__workspace=workspace)

    return get_igadgets_description(included_igadgets)


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

    imageURI = options.get('imageURI')
    if not imageURI:
        imageURI = settings.MEDIA_URL + 'images/headshot_mashup.jpg'

    wikiURI = options.get('wikiURI')
    if not wikiURI:
        wikiURI = 'http://trac.morfeo-project.org/trac/ezwebplatform/wiki/options'

    organization = options.get('organization')
    if not organization:
        organization = ''

    readOnly = options.get('readOnly')
    if not readOnly:
        readOnly = False

    contratable = options.get('contratable')
    if not contratable:
        contratable = False

    parametrization = options.get('parametrization')
    if not parametrization:
        parametrization = {}

    # Build the template
    workspace_tabs = Tab.objects.filter(workspace=workspace).order_by('position')
    included_igadgets = IGadget.objects.filter(tab__workspace=workspace)

    template = etree.Element('Template', schemaLocation="http://morfeo-project.org/2007/Template")
    desc = etree.Element('Catalog.ResourceDescription')
    template.append(desc)
    etree.SubElement(desc, 'Vendor').text = vendor
    etree.SubElement(desc, 'Name').text = name
    etree.SubElement(desc, 'Version').text = version
    etree.SubElement(desc, 'Author').text = author
    etree.SubElement(desc, 'Mail').text = email
    etree.SubElement(desc, 'Description').text = description
    etree.SubElement(desc, 'ImageURI').text = imageURI
    etree.SubElement(desc, 'WikiURI').text = wikiURI
    etree.SubElement(desc, 'Organization').text = organization

    resources = etree.SubElement(desc, 'IncludedResources')

    # Workspace preferences
    preferences = WorkSpacePreference.objects.filter(workspace=workspace)
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
    contratable = False

    # iGadgets
    for igadget in included_igadgets:
        gadget = igadget.gadget
        igadget_id = str(igadget.id)
        igadget_params = {}
        if igadget_id in parametrization:
            igadget_params = parametrization[igadget_id]

        contratable = contratable or gadget.is_contratable()

        resource = etree.SubElement(tabs[igadget.tab.id], 'Resource', id=igadget_id, vendor=gadget.vendor, name=gadget.name, version=gadget.version, title=igadget.name)
        position = igadget.position
        etree.SubElement(resource, 'Position', x=str(position.posX), y=str(position.posY), z=str(position.posZ))
        etree.SubElement(resource, 'Rendering', height=str(position.height),
            width=str(position.width), minimized=str(position.minimized),
            fulldragboard=str(position.fulldragboard), layout=str(igadget.layout))

        gadget_preferences = gadget.get_related_preferences()
        for pref in gadget_preferences:
            status = 'normal'
            if pref.name in igadget_params:
                igadget_param_desc = igadget_params[pref.name]
                if igadget_param_desc['source'] == 'default':
                    # Do not issue a Preference element for this preference
                    continue
                value = igadget_param_desc['value']
                status = igadget_param_desc['status']
            else:
                value = igadget.get_var_value(pref, workspace.creator)

            element = etree.SubElement(resource, 'Preference', name=pref.name, value=value)
            if status != 'normal':
                element.set('readonly', 'true')
                if status != 'readonly':
                    element.set('hidden', 'true')

        gadget_properties = gadget.get_related_properties()
        for prop in gadget_properties:
            status = 'normal'
            if prop.name in igadget_params:
                igadget_param_desc = igadget_params[prop.name]
                if igadget_param_desc['source'] == 'default':
                    # Do not issue a Property element for this property
                    continue
                value = igadget_param_desc['value']
                status = igadget_param_desc['status']
            else:
                value = igadget.get_var_value(prop, workspace.creator)

            element = etree.SubElement(resource, 'Property', name=prop.name, value=value)
            if status != 'normal':
                element.set('readonly', 'true')

        events = gadget.get_related_events()

        for event in events:
            wiring.append(etree.Element('Event', name=event.name, type=typeCode2typeText(event.type), label=event.label, friendcode=event.friend_code))

        slots = gadget.get_related_slots()

        for slot in slots:
            wiring.append(etree.Element('Slot', name=slot.name, type=typeCode2typeText(slot.type), label=slot.label, friendcode=slot.friend_code))

    if contratable:
        etree.append(etree.Element('Capability', name="contratable", value="true"))

    # wiring channel and connections
    channel_vars = WorkSpaceVariable.objects.filter(workspace=workspace, aspect='CHANNEL')
    for channel_var in channel_vars:
        connectable = InOut.objects.get(workspace_variable=channel_var)
        element = etree.SubElement(wiring, 'Channel', id=str(connectable.id), name=connectable.name)
        if connectable.filter:
            element.set('filter', connectable.filter.name)
            element.set('filter_params', connectable.filter_param_values)

        ins = In.objects.filter(inouts=connectable)
        for inp in ins:
            etree.SubElement(element, 'In', igadget=str(inp.variable.igadget.id), name=inp.name)

        in_inouts = RelatedInOut.objects.filter(in_inout=connectable)
        for in_inout in in_inouts:
            etree.SubElement(element, 'Channel', id=str(in_inout.out_inout_id))

        outs = Out.objects.filter(inouts=connectable)
        for out in outs:
            try:
                variable = Variable.objects.get(abstract_variable=out.abstract_variable)
                etree.SubElement(element, 'Out', igadget=str(variable.igadget.id), name=out.name)
            except Variable.DoesNotExist:
                variable = Tab.objects.get(abstract_variable=out.abstract_variable)
                etree.SubElement(element, 'Out', tab=str(tab.id))

    return etree.tostring(template, method='xml', xml_declaration=True, encoding="UTF-8", pretty_print=True)
