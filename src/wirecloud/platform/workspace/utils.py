# -*- coding: utf-8 -*-

# Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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
from wirecloud.platform.preferences.views import get_workspace_preference_values, get_tab_preference_values
from wirecloud.platform.models import IWidget, Tab, UserWorkspace, Variable, Workspace
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
    return base64.b64encode(cipher.encrypt(padded_value))


def decrypt_value(value):
    cipher = AES.new(settings.SECRET_KEY[:32])
    try:
        value = cipher.decrypt(base64.b64decode(value))
        return json.loads(value.decode('utf8'))
    except:
        return ''


def set_variable_value(var_id, value):

    variable = Variable.objects.select_related('vardef').get(id=var_id)
    variable.set_variable_value(value)
    variable.save()


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


def _populate_variables_values_cache(workspace, user, key, forced_values=None):
    """ populates VariableValue cached values for that user """
    values_by_varid = {}
    values_by_varname = {}

    if forced_values is None:
        context_values = get_context_values(workspace, user)
        preferences = get_workspace_preference_values(workspace)
        forced_values = process_forced_values(workspace, user, context_values, preferences)

    var_values = Variable.objects.filter(iwidget__tab__workspace=workspace)
    for variable in var_values.select_related('vardef'):
        variwidget = variable.iwidget.id
        varname = variable.vardef.name
        # forced_values uses string keys
        svariwidget = str(variwidget)

        if not variwidget in values_by_varname:
            values_by_varname[variwidget] = {}

        entry = {}
        if svariwidget in forced_values['iwidget'] and varname in forced_values['iwidget'][svariwidget]:
            fv_entry = forced_values['iwidget'][svariwidget][varname]

            entry['value'] = fv_entry['value']
            if variable.vardef.secure:
                entry['value'] = encrypt_value(entry['value'])

            entry['readonly'] = True
            entry['hidden'] = fv_entry.get('hidden', False)

        else:
            entry['value'] = variable.value

            entry['readonly'] = False
            entry['hidden'] = False

        entry['type'] = variable.vardef.type
        entry['secure'] = variable.vardef.secure

        values_by_varname[variwidget][varname] = entry
        values_by_varid[variable.id] = entry

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
    elif entry['type'] == 'N':
        value = float(value)

    return value


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
            elif entry['type'] == 'N':
                value = float(value)

            data_ret['value'] = value

        data_ret['readonly'] = entry['readonly']
        data_ret['hidden'] = entry['hidden']

        return data_ret


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
        'creator': workspace.creator.username,
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


def process_forced_values(workspace, user, concept_values, preferences):
    try:
        forced_values = json.loads(workspace.forcedValues)
    except:
        forced_values = {
            'iwidget': {},
            'ioperator': {},
        }

    if not 'extra_prefs' in forced_values:
        forced_values['extra_prefs'] = []

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
            iwidget_data.append(get_iwidget_data(iwidget, workspaceDAO, cache_manager))

        tab['iwidgets'] = iwidget_data

    data_ret['wiring'] = json.loads(workspaceDAO.wiringStatus)
    for forced_operator_id, forced_preferences in six.iteritems(forced_values['ioperator']):
        for forced_pref_name, forced_preference in six.iteritems(forced_preferences):
            data_ret['wiring']['operators'][forced_operator_id]['preferences'][forced_pref_name]['value'] = forced_preference['value']

    return json.dumps(data_ret, cls=LazyEncoder)


def get_global_workspace_data(workspace, user):
    key = _workspace_cache_key(workspace, user)
    data = cache.get(key)
    if data is None:
        data = CacheableData(_get_global_workspace_data(workspace, user))
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

    if cache_manager is None:
        cache_manager = VariableValueCacheManager(workspace, user)

    variables = _get_cached_variables(iwidget)
    data_ret['preferences'] = {}
    data_ret['properties'] = {}
    for variable in variables:
        var_data = get_variable_data(variable, workspace, cache_manager)
        if variable.vardef.aspect == "PROP":
            data_ret['properties'][variable.vardef.name] = var_data
        else:
            data_ret['preferences'][variable.vardef.name] = var_data

    return data_ret


def get_variable_data(variable, workspace, cache_manager=None, user=None):
    data_ret = {
        'name': variable.vardef.name,
    }

    if cache_manager is None:
        cache_manager = VariableValueCacheManager(workspace, user)

    # Variable info is splited into 2 entities: VariableDef and VariableValue
    data_ret.update(cache_manager.get_variable_data(variable))

    return data_ret
