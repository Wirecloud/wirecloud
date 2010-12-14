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

from igadget.models import IGadget
from workspace.models import Tab


class TemplateGenerator:

    def getTemplate(self, published_workspace):

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

        tabs = {}
        for tab in workspace_tabs:
            tabs[tab.id] = etree.SubElement(resources, 'Tab', name=tab.name)

        wiring = etree.Element('Platform.Wiring')
        contratable = False

        for igadget in included_igadgets:
            gadget = igadget.gadget

            contratable = contratable or gadget.is_contratable()

            resource = etree.SubElement(tabs[igadget.tab.id], 'Resource', vendor=gadget.vendor, name=gadget.name, version=gadget.version, title=igadget.name)
            position = igadget.position
            etree.SubElement(resource, 'Position', x=str(position.posX), y=str(position.posY), z=str(position.posZ))
            etree.SubElement(resource, 'Rendering', height=str(position.height),
                width=str(position.width), minimized=str(position.minimized),
                fulldragboard=str(position.fulldragboard), layout=str(igadget.layout))

            gadget_preferences = gadget.get_related_preferences()
            for pref in gadget_preferences:
                value = igadget.get_var_value(pref, published_workspace.workspace.creator)
                resource.append(etree.Element('Preference', name=pref.name, value=value))

            gadget_properties = gadget.get_related_properties()
            for prop in gadget_properties:
                value = igadget.get_var_value(prop, published_workspace.workspace.creator)
                resource.append(etree.Element('Property', name=prop.name, value=value))

            events = gadget.get_related_events()

            for event in events:
                wiring.append(etree.Element('Event', name=event.name, type=event.type, label=event.label, friendcode=event.friend_code))

            slots = gadget.get_related_slots()

            for slot in slots:
                wiring.append(etree.Element('Slot', name=slot.name, type=slot.type, label=slot.label, friendcode=slot.friend_code))

        if contratable:
            etree.append(etree.Element('Capability', name="contratable", value="true"))

        template.append(wiring)

        return etree.tostring(template, method='xml', xml_declaration=True, encoding="UTF-8", pretty_print=True)
