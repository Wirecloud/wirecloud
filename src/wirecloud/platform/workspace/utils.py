# -*- coding: utf-8 -*-

# Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import unicode_literals

import base64
from copy import deepcopy
from Crypto.Cipher import AES
import json
import re

from django.conf import settings
from django.core.cache import cache
from django.db.models import Q
from django.utils.translation import ugettext as _
import markdown
import six

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.cache import CacheableData
from wirecloud.commons.utils.db import save_alternative
from wirecloud.commons.utils.encoding import LazyEncoder
from wirecloud.commons.utils.html import clean_html
from wirecloud.platform.context.utils import get_workspace_context, get_context_values
from wirecloud.platform.iwidget.utils import parse_value_from_text
from wirecloud.platform.preferences.views import get_workspace_preference_values, get_tab_preference_values
from wirecloud.platform.models import IWidget, Tab, UserWorkspace, Workspace
from wirecloud.platform.workspace.managers import get_workspace_managers


def deleteTab(tab, user):
    # Delete iwidgets
    for iwidget in tab.iwidget_set.all():
        iwidget.delete()

    # Delete tab
    tab.delete()


def createTab(tab_name, workspace, allow_renaming=False):

    visible = False
    tabs = Tab.objects.filter(workspace=workspace, visible=True)
    if tabs.count() == 0:
        visible = True

    # It's always the last tab
    position = Tab.objects.filter(workspace=workspace).count()

    # Creating tab
    tab = Tab(name=tab_name, visible=visible, position=position, workspace=workspace)
    if allow_renaming:
        save_alternative(Tab, 'name', tab)
    else:
        tab.save()

    return tab


def setVisibleTab(user, workspace_id, tab):
    visibleTabs = Tab.objects.filter(workspace__users__id=user.id, workspace__pk=workspace_id, visible=True).exclude(pk=tab.pk)
    for visibleTab in visibleTabs:
        visibleTab.visible = False
        visibleTab.save()
    tab.visible = True
    tab.save()


def encrypt_value(value):
    cipher = AES.new(settings.SECRET_KEY[:32])
    json_value = json.dumps(value, ensure_ascii=False).encode('utf8')
    padded_value = json_value + (cipher.block_size - len(json_value) % cipher.block_size) * b' '
    return base64.b64encode(cipher.encrypt(padded_value)).decode('utf-8')


def decrypt_value(value):
    cipher = AES.new(settings.SECRET_KEY[:32])
    try:
        value = cipher.decrypt(base64.b64decode(value))
        return json.loads(value.decode('utf8'))
    except:
        return ''


def sync_base_workspaces(user):

    from wirecloud.platform.workspace.mashupTemplateParser import buildWorkspaceFromTemplate

    reload_showcase = False
    managers = get_workspace_managers()

    workspaces_by_manager = {}
    workspaces_by_ref = {}
    for manager in managers:
        workspaces_by_manager[manager.get_id()] = []
        workspaces_by_ref[manager.get_id()] = {}

    workspaces = UserWorkspace.objects.filter(user=user)
    for workspace in workspaces:
        if workspace.manager != '':
            workspaces_by_manager[workspace.manager].append(workspace.reason_ref)
            workspaces_by_ref[workspace.manager][workspace.reason_ref] = workspace

    for manager in managers:
        current_workspaces = workspaces_by_manager[manager.get_id()]
        result = manager.update_base_workspaces(user, current_workspaces)

        for workspace_to_remove in result[0]:
            user_workspace = workspaces_by_ref[manager.get_id()][workspace_to_remove]
            workspace = user_workspace.workspace
            user_workspace.delete()

            if workspace.userworkspace_set.count() == 0:
                workspace.delete()

        for workspace_to_add in result[1]:
            from_workspace = workspace_to_add[1]

            if isinstance(from_workspace, CatalogueResource):
                # TODO
                continue
            else:
                # TODO warning
                continue

            user_workspace.manager = manager.get_id()
            user_workspace.reason_ref = workspace_to_add[0]
            user_workspace.save()
            reload_showcase = True

    return reload_showcase


def get_workspace_list(user):

    from wirecloud.platform.workspace.views import setActiveWorkspace

    if not user.is_authenticated():
        workspaces = Workspace.objects.filter(public=True)
        return workspaces, None

    sync_base_workspaces(user)

    # Now we can fetch all the workspaces for the user
    workspaces = Workspace.objects.filter(Q(public=True) | Q(users__id=user.id))

    # if there is no active workspace
    active_workspaces = UserWorkspace.objects.filter(user=user, active=True)
    if len(active_workspaces) == 0:

        try:
            # set the first workspace as active
            active_workspace = UserWorkspace.objects.filter(user=user)[0]
            setActiveWorkspace(user, active_workspace.workspace)
        except IndexError:
            active_workspace = None

    elif len(active_workspaces) > 1:

        active_workspaces[1:].update(active=False)
        active_workspace = active_workspaces[0]

    else:
        active_workspace = active_workspaces[0]

    return workspaces, active_workspace


def _process_variable(iwidget, svariwidget, vardef, forced_values, values_by_varname, values_by_varid):
    varname = vardef['name']
    entry = {
        'type': vardef['type'],
        'secure': vardef['secure'],
    }
    if svariwidget in forced_values['iwidget'] and varname in forced_values['iwidget'][svariwidget]:
        fv_entry = forced_values['iwidget'][svariwidget][varname]

        entry['value'] = fv_entry['value']
        if vardef['secure']:
            entry['value'] = encrypt_value(entry['value'])
        else:
            entry['value'] = parse_value_from_text(entry, entry['value'])

        entry['readonly'] = True
        entry['hidden'] = fv_entry.get('hidden', False)

    else:
        entry['value'] = iwidget.variables.get(varname, parse_value_from_text(entry, vardef['default']))
        entry['readonly'] = False
        entry['hidden'] = False

    values_by_varname[iwidget.id][varname] = entry
    values_by_varid["%s/%s" % (iwidget.id, varname)] = entry


def _populate_variables_values_cache(workspace, user, key, forced_values=None):
    """ populates VariableValue cached values for that user """
    values_by_varid = {}
    values_by_varname = {}

    if forced_values is None:
        context_values = get_context_values(workspace, user)
        preferences = get_workspace_preference_values(workspace)
        forced_values = process_forced_values(workspace, user, context_values, preferences)

    for iwidget in IWidget.objects.filter(tab__workspace=workspace):
        # forced_values uses string keys
        svariwidget = str(iwidget.id)
        values_by_varname[iwidget.id] = {}

        if iwidget.widget is None:
            continue

        iwidget_info = iwidget.widget.resource.get_processed_info()

        for vardef in iwidget_info['preferences']:
            _process_variable(iwidget, svariwidget, vardef, forced_values, values_by_varname, values_by_varid)

        for vardef in iwidget_info['properties']:
            _process_variable(iwidget, svariwidget, vardef, forced_values, values_by_varname, values_by_varid)

    values = {
        'by_varid': values_by_varid,
        'by_varname': values_by_varname,
    }
    cache.set(key, values)

    return values


def _variable_values_cache_key(workspace, user):
    return '_variables_values_cache/%s/%s/%s' % (workspace.id, workspace.last_modified, user.id)


def _workspace_cache_key(workspace, user):
    return '_workspace_global_data/%s/%s/%s' % (workspace.id, workspace.last_modified, user.id)


class VariableValueCacheManager():

    workspace = None
    user = None
    values = None
    forced_values = None

    def __init__(self, workspace, user, forced_values=None):
        self.workspace = workspace
        self.user = user
        self.forced_values = forced_values

    def _process_entry(self, entry):

        if entry['secure'] == True:
            value = decrypt_value(entry['value'])
            return parse_value_from_text(entry, value)
        else:
            return entry['value']

    def get_variable_values(self):
        if self.values is None:
            key = _variable_values_cache_key(self.workspace, self.user)
            self.values = cache.get(key)
            if self.values is None:
                self.values = _populate_variables_values_cache(self.workspace, self.user, key, self.forced_values)

        return self.values

    def get_variable_value_from_varname(self, iwidget, var_name):

        if isinstance(iwidget, IWidget):
            iwidget_id = iwidget.id
        elif 'id' in iwidget:
            iwidget_id = iwidget.id
        else:
            iwidget_id = int(iwidget)

        values = self.get_variable_values()
        entry = values['by_varname'][iwidget_id][var_name]
        value = self._process_entry(entry)

        return value

    def get_variable_data(self, iwidget, var_name):
        values = self.get_variable_values()
        entry = values['by_varname'][iwidget.id][var_name]
        return {
            'name': var_name,
            'secure': entry['secure'],
            'readonly': entry['readonly'],
            'hidden': entry['hidden'],
            'value': '' if entry['secure'] else entry['value']
        }


def get_workspace_data(workspace, user):

    user_workspace = None

    if user.is_authenticated():
        try:
            user_workspace = UserWorkspace.objects.get(user=user, workspace=workspace)
        except UserWorkspace.DoesNotExist:
            pass

    longdescription = workspace.longdescription
    if longdescription != '':
        longdescription = clean_html(markdown.markdown(longdescription, output_format='xhtml5'))
    else:
        longdescription = workspace.description

    return {
        'id': workspace.id,
        'name': workspace.name,
        'shared': workspace.is_shared(),
        'owner': workspace.creator.username,
        'owned': workspace.creator == user,
        'removable': workspace.creator == user and (user_workspace is None or user_workspace.manager == ''),
        'active': user_workspace is not None and user_workspace.active,
        'lastmodified': workspace.last_modified,
        'description': workspace.description,
        'longdescription': longdescription,
    }


class TemplateValueProcessor:

    _RE = re.compile(r'(%+)\(([a-zA-Z][\w-]*(?:\.[a-zA-Z\][\w-]*)*)\)')

    def __init__(self, context):
        self._context = context

    def __repl(self, matching):
        plen = len(matching.group(1))
        if (plen % 2) == 0:
            return '%' * (plen / 2) + '(' + matching.group(1) + ')'

        var_path = matching.group(2).split('.')
        current_context = self._context

        while len(var_path) > 0:
            current_path = var_path.pop(0)

            if hasattr(current_context, current_path):
                current_context = getattr(current_context, current_path)
            elif current_path in current_context:
                current_context = current_context[current_path]
            else:
                current_context = self._context
                break

        if current_context != self._context:
            return current_context
        else:
            return matching.group(0)

    def process(self, value):
        return self._RE.sub(self.__repl, value)


def normalize_forced_values(workspace):

    if 'extra_prefs' not in workspace.forcedValues:
        workspace.forcedValues['extra_prefs'] = []

    if 'ioperator' not in workspace.forcedValues:
        workspace.forcedValues['ioperator'] = {}

    if 'iwidget' not in workspace.forcedValues:
        workspace.forcedValues['iwidget'] = {}


def process_forced_values(workspace, user, concept_values, preferences):
    normalize_forced_values(workspace)
    forced_values = deepcopy(workspace.forcedValues)

    if len(forced_values['iwidget']) == 0 and len(forced_values['ioperator']) == 0:
        forced_values['empty_params'] = []
        return forced_values

    param_values = {}
    empty_params = []
    for param in forced_values['extra_prefs']:
        if param['name'] in preferences:
            param_values[param['name']] = preferences[param['name']]['value']
        else:
            empty_params.append(param['name'])
            param_values[param['name']] = ''
    forced_values['empty_params'] = empty_params

    processor = TemplateValueProcessor({'user': user, 'context': concept_values, 'params': param_values})

    collection = forced_values['iwidget']
    for key in collection:
        values = collection[key]
        for var_name in values:
            collection[key][var_name]['value'] = processor.process(values[var_name]['value'])

    collection = forced_values['ioperator']
    for key in collection:
        values = collection[key]
        for var_name in values:
            collection[key][var_name]['value'] = processor.process(values[var_name]['value'])

    return forced_values


def _get_global_workspace_data(workspaceDAO, user):
    data_ret = get_workspace_data(workspaceDAO, user)

    # Context information
    data_ret['context'] = get_workspace_context(workspaceDAO, user)

    # Workspace preferences
    preferences = get_workspace_preference_values(workspaceDAO)
    data_ret['preferences'] = preferences

    data_ret['users'] = []

    for user in workspaceDAO.users.all():
        try:
            is_organization = resource.organization is not None
        except:
            is_organization = False

        data_ret['users'].append({
            "fullname": user.get_full_name(),
            "username": user.username,
            "organization": is_organization,
            "accesslevel": "owner" if workspaceDAO.creator == user else "read",
        })

    # Process forced variable values
    concept_values = get_context_values(workspaceDAO, user)
    forced_values = process_forced_values(workspaceDAO, user, concept_values, preferences)
    data_ret['empty_params'] = forced_values['empty_params']
    data_ret['extra_prefs'] = forced_values['extra_prefs']
    if len(forced_values['empty_params']) > 0:
        return json.dumps(data_ret, cls=LazyEncoder)

    cache_manager = VariableValueCacheManager(workspaceDAO, user, forced_values)

    # Tabs processing
    # Check if the workspace's tabs have order
    tabs = Tab.objects.filter(workspace=workspaceDAO).order_by('position')
    if tabs.count() > 0:
        if tabs[0].position is not None:
            tabs = tabs.order_by('position')
        else:
            # set default order
            for i in range(len(tabs)):
                tabs[i].position = i
                tabs[i].save()
    else:
        tabs = [createTab(_('Tab'), workspaceDAO)]

    tabs_data = [get_tab_data(tab) for tab in tabs]

    data_ret['tabs'] = tabs_data

    for tab in tabs_data:
        tab_pk = tab['id']
        iwidgets = IWidget.objects.filter(tab__id=tab_pk).order_by('id')

        iwidget_data = []
        for iwidget in iwidgets:
            iwidget_data.append(get_iwidget_data(iwidget, workspaceDAO, cache_manager))

        tab['iwidgets'] = iwidget_data

    data_ret['wiring'] = workspaceDAO.wiringStatus
    for operator_id, operator in six.iteritems(data_ret['wiring'].get('operators', {})):
        try:
            (vendor, name, version) = operator['name'].split('/')
        except:
            continue

        try:
            resource = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version)
            if not resource.is_available_for(workspaceDAO.creator):
                # The operator used by this instance is missing
                continue
        except CatalogueResource.DoesNotExist:
            continue

        operator_info = resource.get_processed_info(process_variables=True)

        operator_forced_values = forced_values['ioperator'].get(operator_id, {})
        for preference_name, preference in six.iteritems(operator.get('preferences', {})):
            vardef = operator_info['variables']['preferences'].get(preference_name)
            if preference_name in operator_forced_values:
                preference['value'] = operator_forced_values[preference_name]['value']
            elif preference.get('value') is None and vardef is not None:
                preference['value'] = parse_value_from_text(vardef, vardef['default'])

    return json.dumps(data_ret, cls=LazyEncoder)


def get_global_workspace_data(workspace, user):
    key = _workspace_cache_key(workspace, user)
    data = cache.get(key)
    if data is None:
        data = CacheableData(_get_global_workspace_data(workspace, user), timestamp=workspace.last_modified)
        key = _workspace_cache_key(workspace, user)
        cache.set(key, data)

    return data


def get_tab_data(tab):
    return {
        'id': tab.id,
        'name': tab.name,
        'visible': tab.visible,
        'preferences': get_tab_preference_values(tab),
    }


def get_iwidget_data(iwidget, workspace, cache_manager=None, user=None):

    data_ret = {
        'id': iwidget.id,
        'title': iwidget.name,
        'tab': iwidget.tab.id,
        'layout': iwidget.layout,
        'refused_version': iwidget.refused_version,
        'widget': iwidget.widget_uri,
        'top': iwidget.positions['widget']['top'],
        'left': iwidget.positions['widget']['left'],
        'zIndex': iwidget.positions['widget']['zIndex'],
        'width': iwidget.positions['widget']['width'],
        'height': iwidget.positions['widget']['height'],
        'fulldragboard': iwidget.positions['widget']['fulldragboard'],
        'minimized': iwidget.positions['widget']['minimized'],
        'icon_top': iwidget.positions['icon']['top'],
        'icon_left': iwidget.positions['icon']['left'],
        'readonly': iwidget.readOnly,
        'preferences': {},
        'properties': {},
    }

    if iwidget.widget is None or not iwidget.widget.resource.is_available_for(workspace.creator):
        # The widget used by this iwidget is missing
        return data_ret

    if cache_manager is None:
        cache_manager = VariableValueCacheManager(workspace, user)

    iwidget_info = iwidget.widget.resource.get_processed_info()
    data_ret['preferences'] = {preference['name']: cache_manager.get_variable_data(iwidget, preference['name']) for preference in iwidget_info['preferences']}
    data_ret['properties'] = {property['name']: cache_manager.get_variable_data(iwidget, property['name']) for property in iwidget_info['properties']}

    return data_ret
