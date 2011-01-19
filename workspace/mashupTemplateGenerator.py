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


class TemplateGenerator:

    def getTemplate(self, published_workspace, parametrization):

        workspace_tabs = Tab.objects.filter(workspace=published_workspace.workspace)
        included_igadgets = IGadget.objects.filter(tab__workspace=published_workspace.workspace)

        template = etree.Element('Template', schemaLocation="http://morfeo-project.org/2007/Template")
        desc = etree.Element('Catalog.ResourceDescription')
        template.append(desc)
        etree.SubElement(desc, 'Vendor').text = published_workspace.vendor
        etree.SubElement(desc, 'Name').text = published_workspace.name
        etree.SubElement(desc, 'Version').text = published_workspace.version
        etree.SubElement(desc, 'Author').text = published_workspace.author
        etree.SubElement(desc, 'Mail').text = published_workspace.mail
        etree.SubElement(desc, 'Description').text = published_workspace.description
        etree.SubElement(desc, 'ImageURI').text = published_workspace.imageURI
        etree.SubElement(desc, 'WikiURI').text = published_workspace.wikiURI
        etree.SubElement(desc, 'Organization').text = published_workspace.organization

        resources = etree.SubElement(desc, 'IncludedResources', mashupId=str(published_workspace.id))

        # Workspace preferences
        preferences = WorkSpacePreference.objects.filter(workspace=published_workspace.workspace)
        for preference in preferences:
            if not preference.inherit:
                etree.SubElement(resources, 'Preference', name=preference.name, value=preference.value)

        # Tabs and their preferences
        tabs = {}
        for tab in workspace_tabs:
            tabElement = etree.SubElement(resources, 'Tab', name=tab.name)
            tabs[tab.id] = tabElement
            preferences = TabPreference.objects.filter(tab=tab.pk)
            for preference in preferences:
                if not preference.inherit:
                    etree.SubElement(tabElement, 'Preference', name=preference.name, value=preference.value)

        wiring = etree.Element('Platform.Wiring')
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
                read_only = False
                if pref.name in igadget_params:
                    value = igadget_params[pref.name]
                    read_only = True
                else:
                    value = igadget.get_var_value(pref, published_workspace.workspace.creator)

                element = etree.SubElement(resource, 'Preference', name=pref.name, value=value)
                if read_only:
                    element.set('readonly', 'true')

            gadget_properties = gadget.get_related_properties()
            for prop in gadget_properties:
                read_only = False
                if prop.name in igadget_params:
                    value = igadget_params[prop.name]
                    read_only = True
                else:
                    value = igadget.get_var_value(prop, published_workspace.workspace.creator)

                element = etree.SubElement(resource, 'Property', name=prop.name, value=value)
                if read_only:
                    element.set('readonly', 'true')

            events = gadget.get_related_events()

            for event in events:
                wiring.append(etree.Element('Event', name=event.name, type=typeCode2typeText(event.type), label=event.label, friendcode=event.friend_code))

            slots = gadget.get_related_slots()

            for slot in slots:
                wiring.append(etree.Element('Slot', name=slot.name, type=typeCode2typeText(slot.type), label=slot.label, friendcode=slot.friend_code))

        if contratable:
            etree.append(etree.Element('Capability', name="contratable", value="true"))

        channel_vars = WorkSpaceVariable.objects.filter(workspace=published_workspace.workspace, aspect='CHANNEL')
        for channel_var in channel_vars:
            connectable = InOut.objects.get(workspace_variable=channel_var)
            element = etree.SubElement(wiring, 'Channel', id=str(connectable.id), name=connectable.name)

            ins = In.objects.filter(inouts=connectable)
            for inp in ins:
                etree.SubElement(element, 'In', igadget=str(inp.variable.igadget.id), name=inp.name)

            in_inouts = RelatedInOut.objects.filter(in_inout=connectable)
            for in_inout in in_inouts:
                etree.SubElement(element, 'Channel', id=str(in_inout.out_inout_id))

            outs = Out.objects.filter(inouts=connectable)
            for out in outs:
                variable = Variable.objects.get(abstract_variable=out.abstract_variable)
                etree.SubElement(element, 'Out', igadget=str(variable.igadget.id), name=out.name)

        template.append(wiring)

        return etree.tostring(template, method='xml', xml_declaration=True, encoding="UTF-8", pretty_print=True)
