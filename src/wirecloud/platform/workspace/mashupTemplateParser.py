# -*- coding: utf-8 -*-

# Copyright (c) 2011-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.utils import simplejson
from django.utils.translation import ugettext as _

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.db import save_alternative
from wirecloud.commons.utils.template import TemplateParser
from wirecloud.platform.context.utils import get_context_values
from wirecloud.platform.get_data import TemplateValueProcessor
from wirecloud.platform.widget.utils import get_or_add_widget_from_catalogue
from wirecloud.platform.iwidget.utils import SaveIWidget
from wirecloud.platform.localcatalogue.utils import get_or_add_resource_from_available_marketplaces
from wirecloud.platform.preferences.views import update_tab_preferences, update_workspace_preferences
from wirecloud.platform.models import Workspace, UserWorkspace
from wirecloud.platform.workspace.utils import createTab


def buildWorkspaceFromTemplate(template, user, allow_renaming=False):

    if not isinstance(template, TemplateParser):
        template = TemplateParser(template)

    if template.get_resource_type() != 'mashup':
        raise Exception()

    name = template.get_resource_name()

    # Workspace creation
    workspace = Workspace(name=name, creator=user)
    if allow_renaming:
        save_alternative(Workspace, 'name', workspace)
    else:
        workspace.save()

    # Adding user reference to workspace in the many to many relationship
    user_workspace = UserWorkspace(user=user, workspace=workspace, active=False)
    user_workspace.save()

    fillWorkspaceUsingTemplate(workspace, template)

    return (workspace, user_workspace)

class MissingDependencies(Exception):

    def __init__(self, missing_dependencies):
        self.missing_dependencies = missing_dependencies

    def __unicode__(self):
        return _('Missing dependencies')

def check_mashup_dependencies(template, user):

    if not isinstance(template, TemplateParser):
        template = TemplateParser(template)

    missing_dependencies = []
    workspace_info = template.get_resource_info()

    for tab_entry in workspace_info['tabs']:
        for resource in tab_entry['resources']:
            try:
                catalogue_resource = CatalogueResource.objects.get(vendor=resource.get('vendor'), short_name=resource.get('name'), version=resource.get('version'))
                if not catalogue_resource.is_available_for(user):
                    raise CatalogueResource.DoesNotExist
            except CatalogueResource.DoesNotExist:
                missing_dependencies.append('/'.join((resource.get('vendor'), resource.get('name'), resource.get('version'))))

    for id_, op in workspace_info['wiring']['operators'].iteritems():
        (vendor, name, version) = op['name'].split('/')
        try:
            resource = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version)
            if not resource.is_available_for(user):
                raise CatalogueResource.DoesNotExist
        except CatalogueResource.DoesNotExist:
            missing_dependencies.append('/'.join((vendor, name, version)))

    if len(missing_dependencies) > 0:
        raise MissingDependencies(missing_dependencies)

def fillWorkspaceUsingTemplate(workspace, template):

    if not isinstance(template, TemplateParser):
        template = TemplateParser(template)

    if template.get_resource_type() != 'mashup':
        raise Exception()

    user = workspace.creator

    user_workspace = UserWorkspace.objects.get(user=workspace.creator, workspace=workspace)
    context_values = get_context_values(user_workspace)
    processor = TemplateValueProcessor({'user': user, 'context': context_values})

    workspace_info = template.get_resource_info()

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
            if resource.get('readonly'):
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
            'connections': [],
            'views': []
        }

    if 'views' not in workspace_wiring_status:
        workspace_wiring_status['views'] = []

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
            'readOnly': connection['readonly'],
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

    wiring_status['views'] = workspace_wiring_status['views']

    if 'views' in workspace_info['wiring']:
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
