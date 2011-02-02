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

from commons.get_data import get_concept_values, TemplateValueProcessor
from django.utils import simplejson
from igadget.models import Variable
from igadget.views import SaveIGadget
from preferences.views import update_tab_preferences, update_workspace_preferences
from workspace.models import WorkSpace, UserWorkSpace
from workspace.utils import createTab
from connectable.models import In, Out, RelatedInOut, Filter
from connectable.views import createChannel
from lxml import etree


NAME_XPATH = etree.ETXPath('/Template/Catalog.ResourceDescription/Name')
INCLUDED_RESOURCES_XPATH = etree.ETXPath('/Template/Catalog.ResourceDescription/IncludedResources')
TAB_XPATH = etree.ETXPath('Tab')
RESOURCE_XPATH = etree.ETXPath('Resource')
POSITION_XPATH = etree.ETXPath('Position')
RENDERING_XPATH = etree.ETXPath('Rendering')
PREFERENCE_XPATH = etree.ETXPath('Preference')
PROPERTIES_XPATH = etree.ETXPath('Property')
WIRING_XPATH = etree.ETXPath('/Template/Platform.Wiring')
CHANNEL_XPATH = etree.ETXPath('Channel')
IN_XPATH = etree.ETXPath('In')
OUT_XPATH = etree.ETXPath('Out')


def buildWorkspaceFromTemplate(template, user):

    if isinstance(template, unicode):
        template = template.encode('utf-8')

    xml = etree.fromstring(template)

    name = NAME_XPATH(xml)[0].text

    # Workspace creation
    workspace = WorkSpace(name=name, creator=user)
    workspace.save()

    # Adding user reference to workspace in the many to many relationship
    user_workspace = UserWorkSpace(user=user, workspace=workspace, active=False)
    user_workspace.save()

    fillWorkspaceUsingTemplate(workspace, template, xml)

    return workspace


def fillWorkspaceUsingTemplate(workspace, template, xml=None):

    if xml is None:
        xml = etree.fromstring(template)

    user = workspace.creator
    concept_values = get_concept_values(user)
    processor = TemplateValueProcessor({'user': user, 'context': concept_values})

    workspace_structure = INCLUDED_RESOURCES_XPATH(xml)[0]
    read_only_workspace = workspace_structure.get('readonly') == 'true'

    preferences = PREFERENCE_XPATH(workspace_structure)
    new_values = {}
    igadget_id_mapping = {}
    for preference in preferences:
        new_values[preference.get('name')] = {
            'inherit': False,
            'value': preference.get('value'),
        }

    if len(new_values) > 0:
        update_workspace_preferences(workspace, new_values)

    tabs = TAB_XPATH(workspace_structure)
    tab_id_mapping = {}

    forced_values = {
        'igadget': {},
    }
    for tabElement in tabs:
        tab, _junk = createTab(tabElement.get('name'), user, workspace)
        tab_id_mapping[tabElement.get('id')] = tab

        preferences = PREFERENCE_XPATH(tabElement)
        new_values = {}
        for preference in preferences:
            new_values[preference.get('name')] = {
                'inherit': False,
                'value': preference.get('value'),
            }

        if len(new_values) > 0:
            update_tab_preferences(tab, new_values)

        resources = RESOURCE_XPATH(tabElement)
        for resource in resources:
            igadget_uri = "/workspace/" + str(workspace.id) + "/tab/" + str(tab.id) + "/igadgets"
            gadget_uri = "/user/" + user.username + "/gadgets/" + '/'.join([resource.get('vendor'), resource.get('name'), resource.get('version')])

            position = POSITION_XPATH(resource)[0]
            rendering = RENDERING_XPATH(resource)[0]

            initial_variable_values = {}
            igadget_forced_values = {}
            properties = PROPERTIES_XPATH(resource)
            for prop in properties:
                read_only = prop.get('readonly')
                if read_only and read_only == 'true':
                    igadget_forced_values[prop.get('name')] = {'value': prop.get('value')}
                else:
                    initial_variable_values[prop.get('name')] = processor.process(prop.get('value'))

            preferences = PREFERENCE_XPATH(resource)
            for pref in preferences:
                read_only = pref.get('readonly')
                if read_only and read_only == 'true':
                    hidden = pref.get('hidden') == 'true'
                    igadget_forced_values[pref.get('name')] = {'value': pref.get('value'), 'hidden': hidden}
                else:
                    initial_variable_values[pref.get('name')] = processor.process(pref.get('value'))

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

            igadget = SaveIGadget(igadget_data, user, tab, initial_variable_values)
            if read_only_workspace:
                igadget.readOnly = True
                igadget.save()

            forced_values['igadget'][str(igadget.id)] = igadget_forced_values
            igadget_id_mapping[resource.get('id')] = igadget

    if workspace.forcedValues != None and workspace.forcedValues != '':
        old_forced_values = simplejson.loads(workspace.forcedValues)
    else:
        old_forced_values = {
            'igadget': {},
        }

    forced_values['igadget'].update(old_forced_values['igadget'])
    workspace.forcedValues = simplejson.dumps(forced_values, ensure_ascii=False)
    workspace.save()

    # wiring
    wiring = WIRING_XPATH(xml)[0]
    channels = CHANNEL_XPATH(wiring)
    channel_connectables = {}
    for channel in channels:
        connectable = createChannel(workspace, channel.get('name'))

        save = False
        if read_only_workspace:
            connectable.readOnly = True
            save = True

        filter_name = channel.get('filter')
        if filter_name:
            save = True
            connectable.filter = Filter.objects.get(name=filter_name)
            connectable.filter_param_values = channel.get('filter_params')

        if save:
            connectable.save()

        channel_connectables[channel.get('id')] = {
            'connectable': connectable,
            'element': channel,
        }

    for key in channel_connectables:
        channel = channel_connectables[key]
        ins = IN_XPATH(channel['element'])
        for in_ in ins:
            igadget_id = in_.get('igadget')
            igadget = igadget_id_mapping[igadget_id]
            name = in_.get('name')

            connectable = In.objects.get(variable__abstract_variable__name=name, variable__igadget=igadget)
            connectable.inouts.add(channel['connectable'])
            connectable.save()

        outs = OUT_XPATH(channel['element'])
        for out in outs:
            if 'igadget' in out.attrib:
                igadget_id = out.get('igadget')
                igadget = igadget_id_mapping[igadget_id]
                name = out.get('name')

                variable = Variable.objects.get(igadget=igadget, abstract_variable__name=name)
                connectable = Out.objects.get(abstract_variable=variable.abstract_variable)
            else:
                tab_id = out.get('tab')
                tab = tab_id_mapping[tab_id]

                connectable = Out.objects.get(abstract_variable=tab.abstract_variable)

            connectable.inouts.add(channel['connectable'])
            connectable.save()

        out_channels = CHANNEL_XPATH(channel['element'])
        for out_channel_element in out_channels:
            out_channel = channel_connectables[out_channel_element.get('id')]['connectable']
            relation = RelatedInOut(in_inout=channel['connectable'], out_inout=out_channel)
            relation.save()
