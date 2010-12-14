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

from igadget.views import SaveIGadget
from workspace.models import WorkSpace, UserWorkSpace
from workspace.utils import createTab
from lxml import etree

NAME_XPATH = etree.ETXPath('/Template/Catalog.ResourceDescription/Name')
TAB_XPATH = etree.ETXPath('/Template/Catalog.ResourceDescription/IncludedResources/Tab')
RESOURCE_XPATH = etree.ETXPath('Resource')
POSITION_XPATH = etree.ETXPath('Position')
RENDERING_XPATH = etree.ETXPath('Rendering')
PREFERENCES_XPATH = etree.ETXPath('Preference')
PROPERTIES_XPATH = etree.ETXPath('Property')


def buildWorkspaceFromTemplate(template, user):

    xml = etree.fromstring(template)

    name = NAME_XPATH(xml)[0].text

    #Workspace creation
    workspace = WorkSpace(name=name, creator=user)
    workspace.save()

    #Adding user reference to workspace in the many to many relationship
    user_workspace = UserWorkSpace(user=user, workspace=workspace, active=False)
    user_workspace.save()

    tabs = TAB_XPATH(xml)

    for tabElement in tabs:
        tab, junk = createTab(tabElement.get('name'), user, workspace)

        resources = RESOURCE_XPATH(tabElement)
        for resource in resources:
            igadget_uri = "/workspace/" + str(workspace.id) + "/tab/" + str(tab.id) + "/igadgets"
            gadget_uri = "/user/" + user.username + "/gadgets/" + '/'.join([resource.get('vendor'), resource.get('name'), resource.get('version')])

            position = POSITION_XPATH(resource)[0]
            rendering = RENDERING_XPATH(resource)[0]

            initial_variable_values = {}
            properties = PROPERTIES_XPATH(resource)
            for prop in properties:
                initial_variable_values[prop.get('name')] = prop.get('value')

            preferences = PREFERENCES_XPATH(resource)
            for pref in preferences:
                initial_variable_values[pref.get('name')] = pref.get('value')

            igadget_data = {
                "left": int(position.get('x')),
                "top": int(position.get('y')),
                "icon_left": -1,
                "icon_top": -1,
                "zIndex": int(position.get('z')),
                "width": int(rendering.get('width')),
                "height": int(rendering.get('height')),
                "name": resource.get('title'),
                "menu_color": "FFFFFF",
                "layout": int(rendering.get('layout')),
                "uri": igadget_uri,
                "gadget": gadget_uri}
            SaveIGadget(igadget_data, user, tab, initial_variable_values)

    return workspace
