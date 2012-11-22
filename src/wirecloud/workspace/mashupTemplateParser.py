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
from django.utils import simplejson

from commons.get_data import get_concept_values, TemplateValueProcessor
from commons.utils import save_alternative

from wirecloud.widget.utils import get_or_add_widget_from_catalogue
from wirecloud.iwidget.utils import SaveIWidget
from wirecloud.localcatalogue.utils import get_or_add_resource_from_available_marketplaces
from wirecloud.preferences.views import update_tab_preferences, update_workspace_preferences
from wirecloud.models import Workspace, UserWorkspace
from wirecloud.workspace.utils import createTab
from wirecloudcommons.utils.template import TemplateParser


def buildWorkspaceFromTemplate(template, user, allow_renaming=False):

    parser = TemplateParser(template)

    if parser.get_resource_type() != 'mashup':
        raise Exception()

    name = parser.get_resource_name()

    # Workspace creation
    workspace = Workspace(name=name, creator=user)
    if allow_renaming:
        save_alternative(Workspace, 'name', workspace)
    else:
        workspace.save()

    # Adding user reference to workspace in the many to many relationship
    user_workspace = UserWorkspace(user=user, workspace=workspace, active=False)
    user_workspace.save()

    fillWorkspaceUsingTemplate(workspace, parser)

    return (workspace, user_workspace)


def fillWorkspaceUsingTemplate(workspace, template):

    if isinstance(template, TemplateParser):
        parser = template
    else:
        parser = TemplateParser(template)

    if parser.get_resource_type() != 'mashup':
        raise Exception()

    user = workspace.creator
    concept_values = get_concept_values(user)
    processor = TemplateValueProcessor({'user': user, 'context': concept_values})

    workspace_info = parser.get_resource_info()
    read_only_workspace = workspace_info['readonly']

    new_values = {}
    iwidget_id_mapping = {}
    for preference_name in workspace_info['preferences']:
        new_values[preference_name] = {
            'inherit': False,
            'value': workspace_info['preferences'][preference_name],
        }

    if len(new_values) > 0:
        update_workspace_preferences(workspace, new_values)

    forced_values = {
        'extra_prefs': {},
        'iwidget': {},
    }
    for param_name in workspace_info['params']:
        param = workspace_info['params'][param_name]
        forced_values['extra_prefs'][param_name] = {
            'inheritable': False,
            'label': param.get('label'),
            'type': param.get('type'),
        }

    for tab_entry in workspace_info['tabs']:
        tab = createTab(tab_entry.get('name'), user, workspace, allow_renaming=True)

        new_values = {}
        for preference_name in tab_entry['preferences']:
            new_values[preference_name] = {
                'inherit': False,
                'value': tab_entry['preferences'][preference_name],
            }

        if len(new_values) > 0:
            update_tab_preferences(tab, new_values)

        for resource in tab_entry['resources']:

            position = resource['position']
            rendering = resource['rendering']

            initial_variable_values = {}
            iwidget_forced_values = {}
            for prop_name in resource['properties']:
                prop = resource['properties'][prop_name]
                read_only = prop.get('readonly')
                if read_only:
                    iwidget_forced_values[prop.get('name')] = {'value': prop.get('value')}
                else:
                    initial_variable_values[prop.get('name')] = processor.process(prop.get('value'))

            for pref_name in resource['preferences']:
                pref = resource['preferences'][pref_name]
                read_only = pref.get('readonly')
                if read_only:
                    iwidget_forced_values[pref.get('name')] = {'value': pref.get('value'), 'hidden': pref.get('hidden')}
                else:
                    initial_variable_values[pref.get('name')] = processor.process(pref.get('value'))

            widget = get_or_add_widget_from_catalogue(resource.get('vendor'), resource.get('name'), resource.get('version'), user, None)

            iwidget_data = {
                "left": int(position.get('x')),
                "top": int(position.get('y')),
                "icon_left": -1,
                "icon_top": -1,
                "zIndex": int(position.get('z')),
                "width": int(rendering.get('width')),
                "height": int(rendering.get('height')),
                "name": resource.get('title'),
                "layout": int(rendering.get('layout')),
                "widget": widget.uri,
            }

            iwidget = SaveIWidget(iwidget_data, user, tab, initial_variable_values)
            if read_only_workspace or resource.get('readonly'):
                iwidget.readOnly = True
                iwidget.save()

            forced_values['iwidget'][str(iwidget.id)] = iwidget_forced_values
            iwidget_id_mapping[resource.get('id')] = iwidget

    if workspace.forcedValues is not None and workspace.forcedValues != '':
        old_forced_values = simplejson.loads(workspace.forcedValues)
    else:
        old_forced_values = {
            'extra_preferences': {},
            'iwidget': {},
        }

    forced_values['iwidget'].update(old_forced_values['iwidget'])
    workspace.forcedValues = simplejson.dumps(forced_values, ensure_ascii=False)

    # wiring
    wiring_status = {
        'operators': {},
        'connections': [],
    }

    if workspace.wiringStatus != '':
        workspace_wiring_status = simplejson.loads(workspace.wiringStatus)
    else:
        workspace_wiring_status = {
            'operators': {},
            'connections': []
        }

    max_id = 0
    operators = {}

    for id_ in workspace_wiring_status['operators'].keys():
        if int(id_) > max_id:
            max_id = int(id_)

    # Change string ids by integer ids and install unavailable operators
    for id_, op in workspace_info['wiring']['operators'].iteritems():
        max_id += 1
        #mapping between string ids and integer id
        operators[id_] = max_id
        wiring_status['operators'][max_id] = {
            'id': max_id,
            'name': op['name']
        }
        op_id_args = op['name'].split('/')
        op_id_args.append(user)
        get_or_add_resource_from_available_marketplaces(*op_id_args)

    wiring_status['operators'].update(workspace_wiring_status['operators'])

    if workspace_wiring_status['connections']:
        wiring_status['connections'] = workspace_wiring_status['connections']

    for connection in workspace_info['wiring']['connections']:
        source_id = connection['source']['id']
        target_id = connection['target']['id']

        if connection['source']['type'] == 'iwidget':
            source_id = iwidget_id_mapping[source_id].id
        elif connection['source']['type'] == 'ioperator':
            source_id = operators[source_id]

        if connection['target']['type'] == 'iwidget':
            target_id = iwidget_id_mapping[target_id].id
        elif connection['target']['type'] == 'ioperator':
            target_id = operators[target_id]

        wiring_status['connections'].append({
            'readonly': connection['readonly'],
            'source': {
                'id': source_id,
                'type': connection['source']['type'],
                'endpoint': connection['source']['endpoint'],
            },
            'target': {
                'id': target_id,
                'type': connection['target']['type'],
                'endpoint': connection['target']['endpoint'],
            },
        })

    if 'views' in workspace_info['wiring']:
        wiring_status['views'] = []
        for wiring_view in workspace_info['wiring']['views']:
            iwidgets_views = {}
            for key, widget in wiring_view['iwidgets'].iteritems():
                iwidgets_views[iwidget_id_mapping[key].id] = widget

            operators_views = {}
            for key, operator in wiring_view['operators'].iteritems():
                operators_views[operators[key]] = operator

            wiring_status['views'].append({
                'iwidgets': iwidgets_views,
                'operators': operators_views,
                'label': wiring_view['label'],
                'multiconnectors': {},
                'connections': []
            })

    workspace.wiringStatus = simplejson.dumps(wiring_status)

    workspace.save()

    from commons.get_data import _invalidate_cached_variable_values
    _invalidate_cached_variable_values(workspace)
