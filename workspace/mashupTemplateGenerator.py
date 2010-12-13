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

from django.shortcuts import get_object_or_404
from lxml import etree

from igadget.models import IGadget
from workspace.models import PublishedWorkSpace


class TemplateGenerator:

    def getTemplate(self, workspace_id):

        published_workspace = get_object_or_404(PublishedWorkSpace, id=workspace_id)

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

        resources = etree.Element('IncludeResources', mashupId=workspace_id)
        template.append(resources)

        wiring = etree.Element('Platform.Wiring')
        contratable = False

        for igadget in included_igadgets:
            gadget = igadget.gadget

            contratable = contratable or gadget.is_contratable()

            etree.Element('Resource', vendor=gadget.vendor, name=gadget.name, version=gadget.version)

            events = gadget.get_related_events()

            for event in events:
                wiring.append(etree.Element('Event', name=event.name, type=event.type, label=event.label, friendcode=event.friend_code))

            slots = gadget.get_related_slots()

            for slot in slots:
                wiring.append(etree.Element('Slot', name=slot.name, type=slot.type, label=slot.label, friendcode=slot.friend_code))

        if contratable:
            etree.append(etree.Element('Capability', name="contratable", value="true"))

        preferences = etree.Element('Platform.Preferences')
        template.append(preferences)
        properties = etree.Element('Platform.StateProperties')
        template.append(properties)

        template.append(wiring)

        return etree.tostring(template, method='xml', xml_declaration=True, encoding="UTF-8", pretty_print=True)
