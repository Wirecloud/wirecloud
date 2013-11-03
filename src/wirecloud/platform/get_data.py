#-*- coding: utf-8 -*-

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
import json
import random
import re

from django.core.cache import cache
from django.utils.translation import ugettext as _

from wirecloud.commons.utils.cache import CacheableData
from wirecloud.commons.utils.encoding import LazyEncoder
from wirecloud.platform.models import IWidget, PublishedWorkspace, Tab, UserWorkspace, Variable, VariableValue
from wirecloud.platform.context.utils import get_workspace_context, get_context_values
from wirecloud.platform.preferences.views import get_workspace_preference_values, get_tab_preference_values
from wirecloud.platform.workspace.utils import createTab, decrypt_value, encrypt_value


def _variable_cache_key(iwidget):
    return '_variable_cache/' + str(iwidget.id)


def _get_cached_variables(iwidget):
    key = _variable_cache_key(iwidget)

    variables = cache.get(key)
    if variables == None:
        variable_query = Variable.objects.filter(iwidget__id=iwidget.id).select_related('iwidget', 'vardef')
        variables = variable_query[::1]
        cache.set(key, variables)

    return variables


def _invalidate_cached_variables(iwidget):
    key = _variable_cache_key(iwidget)
    cache.delete(key)
    _invalidate_cached_variable_values(iwidget.tab.workspace)


def _populate_variables_values_cache(workspace, user, key, forced_values=None):
    """ populates VariableValue cached values for that user """
    values_by_varid = {}
    values_by_varname = {}

    if forced_values == None:
        user_workspace = UserWorkspace.objects.get(user=user, workspace=workspace)
        context_values = get_context_values(user_workspace)
        preferences = get_workspace_preference_values(workspace)
        forced_values = process_forced_values(workspace, user, context_values, preferences)

    var_values = VariableValue.objects.filter(user__id=user.id, variable__iwidget__tab__workspace=workspace)
    for var_value in var_values.select_related('variable__vardef'):
        variwidget = var_value.variable.iwidget.id
        varname = var_value.variable.vardef.name
        # forced_values uses string keys
        svariwidget = str(variwidget)

        if not variwidget in values_by_varname:
            values_by_varname[variwidget] = {}

        entry = {}
        if svariwidget in forced_values['iwidget'] and varname in forced_values['iwidget'][svariwidget]:
            fv_entry = forced_values['iwidget'][svariwidget][varname]

            entry['value'] = fv_entry['value']
            if var_value.variable.vardef.secure:
                entry['value'] = encrypt_value(entry['value'])

            entry['readonly'] = True
            entry['hidden'] = fv_entry.get('hidden', False)

        else:
            entry['value'] = var_value.value

            entry['readonly'] = False
            entry['hidden'] = False

        entry['type'] = var_value.variable.vardef.type
        entry['secure'] = var_value.variable.vardef.secure

        values_by_varname[variwidget][varname] = entry
        values_by_varid[var_value.variable.id] = entry

    values = {
        'by_varid': values_by_varid,
        'by_varname': values_by_varname,
    }
    cache.set(key, values)

    return values


def _get_workspace_version(workspace):
    version = cache.get('_workspace_version/' + str(workspace.id))
    if version is None:
        version = random.randrange(1, 100000)
        cache.set('_workspace_version/' + str(workspace.id), version)
    return version


def _variable_values_cache_key(workspace, user):
    version = _get_workspace_version(workspace)
    return '/'.join(('_variables_values_cache', str(workspace.id), str(version), str(user.id)))


def _workspace_cache_key(workspace, user):
    version = _get_workspace_version(workspace)
    return '/'.join(('_workspace_global_data', str(workspace.id), str(version), str(user.id)))


def get_variable_value_from_varname(user, iwidget, var_name):

    if isinstance(iwidget, IWidget):
        iwidget_id = iwidget.id
    elif 'id' in iwidget:
        iwidget_id = iwidget.id
        iwidget = IWidget.objects.get(id=iwidget_id)
    else:
        iwidget_id = int(iwidget)
        iwidget = IWidget.objects.get(id=iwidget_id)

    workspace = iwidget.tab.workspace
    key = _variable_values_cache_key(workspace, user)
    values = cache.get(key)
    if values == None:
        values = _populate_variables_values_cache(workspace, user, key)

    entry = values['by_varname'][iwidget_id][var_name]
    if entry['secure'] == True:
        value = decrypt_value(entry['value'])
    else:
        value = entry['value']

    if entry['type'] == 'B':
        value = value.lower() == 'true'

    return value


def _invalidate_cached_variable_values(workspace, user=None):
    if user is not None:
        key = _variable_values_cache_key(workspace, user)
        cache.delete(key)

        key = _workspace_cache_key(workspace, user)
        cache.delete(key)
    else:
        try:
            cache.incr('_workspace_version/' + str(workspace.id))
        except ValueError:
            pass


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
            return decrypt_value(entry['value'])
        else:
            return entry['value']

    def get_variable_values(self):
        if self.values == None:
            key = _variable_values_cache_key(self.workspace, self.user)
            self.values = cache.get(key)
            if self.values == None:
                self.values = _populate_variables_values_cache(self.workspace, self.user, key, self.forced_values)

        return self.values

    def get_variable_value_from_var(self, variable):
        values = self.get_variable_values()
        entry = values['by_varid'][variable.id]
        return self._process_entry(entry)

    def get_variable_value_from_varname(self, iwidget, var_name):

        if 'id' in iwidget:
            iwidget_id = iwidget.id
            iwidget = IWidget.objects.get(id=iwidget_id)
        elif not isinstance(iwidget, IWidget):
            iwidget_id = int(iwidget)
            iwidget = IWidget.objects.get(id=iwidget_id)
        else:
            iwidget_id = iwidget

        values = self.get_variable_values()
        entry = values['by_varname'][iwidget_id][var_name]
        return self._process_entry(entry)

    def get_variable_data(self, variable):
        values = self.get_variable_values()
        entry = values['by_varid'][variable.id]
        data_ret = {}

        if entry['secure']:
            data_ret['value'] = ''
            data_ret['secure'] = True
        else:
            value = entry['value']

            if entry['type'] == 'B':
                value = value.lower() == 'true'

            data_ret['value'] = value

        data_ret['readonly'] = entry['readonly']
        data_ret['hidden'] = entry['hidden']

        return data_ret

    def invalidate(self):
        _invalidate_cached_variable_values(self.workspace, self.user)


def get_workspace_data(workspace, user):
    user_workspace = UserWorkspace.objects.get(user=user, workspace=workspace)

    return {
        'id': workspace.id,
        'name': workspace.name,
        'shared': workspace.is_shared(),
        'creator': workspace.creator.username,
        'owned': workspace.creator == user,
        'removable': workspace.creator == user and user_workspace.manager == '',
        'active': user_workspace.active,
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


def process_forced_values(workspace, user, concept_values, preferences):
    try:
        forced_values = json.loads(workspace.forcedValues)
    except:
        forced_values = {
            'iwidget': {},
            'ioperator': {},
        }

    if not 'extra_prefs' in forced_values:
        forced_values['extra_prefs'] = {}

    if not 'ioperator' in forced_values:
        forced_values['ioperator'] = {}

    if not 'iwidget' in forced_values:
        forced_values['iwidget'] = {}

    if len(forced_values['iwidget']) == 0 and len(forced_values['ioperator']) == 0:
        forced_values['empty_params'] = []
        return forced_values

    param_values = {}
    empty_params = []
    for param in forced_values['extra_prefs']:
        if param in preferences:
            param_values[param] = preferences[param]['value']
        else:
            empty_params.append(param)
            param_values[param] = ''
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
    user_workspace = UserWorkspace.objects.get(user=user, workspace=workspaceDAO)
    data_ret = get_workspace_data(workspaceDAO, user)

    # Context information
    data_ret['context'] = get_workspace_context(user_workspace)

    # Workspace preferences
    preferences = get_workspace_preference_values(workspaceDAO.pk)
    data_ret['preferences'] = preferences

    # Process forced variable values
    concept_values = get_context_values(user_workspace)
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
        if tabs[0].position != None:
            tabs = tabs.order_by('position')
        else:
            #set default order
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
            iwidget_data.append(get_iwidget_data(iwidget, user, workspaceDAO, cache_manager))

        tab['iwidgets'] = iwidget_data

    data_ret['wiring'] = json.loads(workspaceDAO.wiringStatus)
    for forced_operator_id, forced_preferences in forced_values['ioperator'].iteritems():
        for forced_pref_name, forced_preference in forced_preferences.iteritems():
            data_ret['wiring']['operators'][forced_operator_id]['preferences'][forced_pref_name]['value'] = forced_preference['value']

    # Params
    last_published_workspace = PublishedWorkspace.objects.filter(workspace=workspaceDAO).order_by('-pk')
    if len(last_published_workspace) > 0:
        data_ret["params"] = json.loads(last_published_workspace[0].params)

    return json.dumps(data_ret, cls=LazyEncoder)


def get_global_workspace_data(workspace, user):
    key = _workspace_cache_key(workspace, user)
    data = cache.get(key)
    if data is None:
        data = CacheableData(_get_global_workspace_data(workspace, user))
        cache.set(key, data)

    return data


def get_tab_data(tab):
    return {
        'id': tab.id,
        'name': tab.name,
        'visible': tab.visible,
        'preferences': get_tab_preference_values(tab),
    }


def get_iwidget_data(iwidget, user, workspace, cache_manager=None):

    data_ret = {'id': iwidget.id,
        'name': iwidget.name,
        'tab': iwidget.tab.id,
        'layout': iwidget.layout,
        'refused_version': iwidget.refused_version,
        'widget': iwidget.widget.uri,
        'top': iwidget.position.posY,
        'left': iwidget.position.posX,
        'zIndex': iwidget.position.posZ,
        'width': iwidget.position.width,
        'height': iwidget.position.height,
        'fulldragboard': iwidget.position.fulldragboard,
        'minimized': iwidget.position.minimized,
        'readOnly': iwidget.readOnly,
    }

    if iwidget.icon_position:
        data_ret['icon_top'] = iwidget.icon_position.posY
        data_ret['icon_left'] = iwidget.icon_position.posX
    else:
        data_ret['icon_top'] = 0
        data_ret['icon_left'] = 0

    if cache_manager == None:
        cache_manager = VariableValueCacheManager(workspace, user)

    variables = _get_cached_variables(iwidget)
    data_ret['variables'] = {}
    for variable in variables:
        var_data = get_variable_data(variable, user, workspace, cache_manager)
        data_ret['variables'][variable.vardef.name] = var_data

    return data_ret


def get_variable_data(variable, user, workspace, cache_manager=None):
    data_ret = {
        'id': variable.id,
        'name': variable.vardef.name,
    }

    if variable.vardef.aspect != 'PREF' and variable.vardef.aspect != 'PROP':
        return data_ret

    if cache_manager == None:
        cache_manager = VariableValueCacheManager(workspace, user)

    # Variable info is splited into 2 entities: VariableDef and VariableValue
    data_ret.update(cache_manager.get_variable_data(variable))

    return data_ret
