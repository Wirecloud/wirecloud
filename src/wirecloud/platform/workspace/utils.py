# -*- coding: utf-8 -*-

# Copyright (c) 2008-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

import base64
from io import BytesIO
from copy import deepcopy
from Crypto.Cipher import AES
import json
import os
import re

from django.conf import settings
from django.core.cache import cache
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _
import markdown

from wirecloud.catalogue import utils as catalogue
from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.models import Organization
from wirecloud.commons.utils.cache import CacheableData
from wirecloud.commons.utils.db import save_alternative
from wirecloud.commons.utils.downloader import download_http_content
from wirecloud.commons.utils.encoding import LazyEncoder
from wirecloud.commons.utils.html import clean_html
from wirecloud.commons.utils.template.parsers import TemplateParser
from wirecloud.commons.utils.urlify import URLify
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.context.utils import get_context_values
from wirecloud.platform.iwidget.utils import parse_value_from_text
from wirecloud.platform.localcatalogue.utils import install_component
from wirecloud.platform.preferences.views import get_workspace_preference_values, get_tab_preference_values, update_workspace_preferences
from wirecloud.platform.models import IWidget, Tab, UserWorkspace, Workspace
from wirecloud.platform.workspace.managers import get_workspace_managers


def deleteTab(tab, user):
    # Delete iwidgets
    for iwidget in tab.iwidget_set.all():
        iwidget.delete()

    # Delete tab
    tab.delete()


def createTab(title, workspace, allow_renaming=False, name=None):

    if name is None or name.strip() == '':
        name = URLify(title)

    visible = False
    tabs = Tab.objects.filter(workspace=workspace, visible=True)
    if tabs.count() == 0:
        visible = True

    # It's always the last tab
    position = Tab.objects.filter(workspace=workspace).count()

    # Creating tab
    tab = Tab(name=name, title=title, visible=visible, position=position, workspace=workspace)
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
    except Exception:
        return ''


def sync_base_workspaces(user):

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

    if not user.is_authenticated():
        return Workspace.objects.filter(public=True, searchable=True)

    sync_base_workspaces(user)

    # Now we can fetch all the workspaces for the user
    workspaces = Workspace.objects.filter(Q(public=True, searchable=True) | Q(users__id=user.id))

    return workspaces


def _process_variable(component_type, component_id, vardef, value, forced_values, values_by_varname, current_user, workspace_creator):
    varname = vardef['name']
    entry = {
        'type': vardef['type'],
        'secure': vardef['secure'],
    }
    if component_id in forced_values[component_type] and varname in forced_values[component_type][component_id]:
        fv_entry = forced_values[component_type][component_id][varname]

        entry['value'] = fv_entry['value']
        if vardef['secure']:
            entry['value'] = encrypt_value(entry['value'])
        else:
            entry['value'] = parse_value_from_text(entry, entry['value'])

        entry['readonly'] = True
        entry['hidden'] = fv_entry.get('hidden', False)

    else:
        # Handle multiuser variables
        variable_user = current_user if vardef.get("multiuser", False) else workspace_creator
        if value is None or value["users"].get("%s" % variable_user.id, None) is None:
            value = parse_value_from_text(entry, vardef['default'])
        else:
            value = value["users"].get("%s" % variable_user.id, None)

        entry['value'] = value
        entry['readonly'] = False
        entry['hidden'] = False

    values_by_varname[component_type][component_id][varname] = entry


def _populate_variables_values_cache(workspace, user, key, forced_values=None):
    """ populates VariableValue cached values for that user """
    values_by_varname = {
        "ioperator": {},
        "iwidget": {},
    }
    if forced_values is None:
        context_values = get_context_values(workspace, user)
        preferences = get_workspace_preference_values(workspace)
        forced_values = process_forced_values(workspace, user, context_values, preferences)

    for iwidget in IWidget.objects.filter(tab__workspace=workspace):
        # forced_values uses string keys
        svariwidget = "%s" % iwidget.id
        values_by_varname["iwidget"][svariwidget] = {}

        if iwidget.widget is None:
            continue

        iwidget_info = iwidget.widget.resource.get_processed_info()

        for vardef in iwidget_info.get('preferences', {}):
            value = iwidget.variables.get(vardef['name'], None)
            _process_variable("iwidget", svariwidget, vardef, value, forced_values, values_by_varname, user, workspace.creator)

        for vardef in iwidget_info.get('properties', {}):
            value = iwidget.variables.get(vardef['name'], None)
            _process_variable("iwidget", svariwidget, vardef, value, forced_values, values_by_varname, user, workspace.creator)

    for operator_id, operator in workspace.wiringStatus.get('operators', {}).items():

        values_by_varname["ioperator"][operator_id] = {}
        vendor, name, version = operator['name'].split('/')
        try:
            operator_info = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version).get_processed_info()
        except CatalogueResource.DoesNotExist:
            continue
        for vardef in operator_info.get('preferences', {}):
            value = operator.get("preferences", {}).get(vardef['name'], {}).get("value")
            _process_variable("ioperator", operator_id, vardef, value, forced_values, values_by_varname, user, workspace.creator)

        for vardef in operator_info.get('properties', {}):
            value = operator.get("properties", {}).get(vardef['name'], {}).get("value")
            _process_variable("ioperator", operator_id, vardef, value, forced_values, values_by_varname, user, workspace.creator)

    cache.set(key, values_by_varname)

    return values_by_varname


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

        if entry['secure'] is True:
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

    def get_variable_value_from_varname(self, component_type, component_id, var_name):
        values = self.get_variable_values()
        entry = values[component_type]["%s" % component_id][var_name]
        return self._process_entry(entry)

    # Get variable data
    def get_variable_data(self, component_type, component_id, var_name):
        values = self.get_variable_values()
        entry = values[component_type]["%s" % component_id][var_name]

        # If secure and has value, censor it
        if entry['secure'] and entry["value"] != "":
            value = "********"
        else:
            value = entry["value"]

        return {
            'name': var_name,
            'secure': entry['secure'],
            'readonly': entry['readonly'],
            'hidden': entry['hidden'],
            'value': value,
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
        'id': "%s" % workspace.id,
        'name': workspace.name,
        'title': workspace.title,
        'public': workspace.public,
        'shared': workspace.is_shared(),
        'owner': workspace.creator.username,
        'removable': workspace.creator == user and (user_workspace is None or user_workspace.manager == ''),
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
        if param['name'] in preferences and (param['required'] is False or preferences[param['name']]['value'].strip() != ''):
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

    # Workspace preferences
    preferences = get_workspace_preference_values(workspaceDAO)
    data_ret['preferences'] = preferences

    data_ret['users'] = []

    for u in workspaceDAO.users.all():
        try:
            is_organization = u.organization is not None
        except Organization.DoesNotExist:
            is_organization = False

        data_ret['users'].append({
            "fullname": u.get_full_name(),
            "username": u.username,
            "organization": is_organization,
            "accesslevel": "owner" if workspaceDAO.creator == u else "read",
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

    data_ret['tabs'] = [get_tab_data(tab, workspace=workspaceDAO, cache_manager=cache_manager, user=user) for tab in tabs]
    data_ret['wiring'] = deepcopy(workspaceDAO.wiringStatus)
    for operator_id, operator in data_ret['wiring'].get('operators', {}).items():
        try:
            (vendor, name, version) = operator['name'].split('/')
        except ValueError:
            continue

        try:
            resource = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version)
            operator_info = resource.get_processed_info(process_variables=True)
            # Check if the resource is available, if not, variables should not be retrieved
            if not resource.is_available_for(workspaceDAO.creator):
                raise CatalogueResource.DoesNotExist
        except CatalogueResource.DoesNotExist:
            operator["preferences"] = {}
            operator["properties"] = {}
            continue

        operator_forced_values = forced_values['ioperator'].get(operator_id, {})
        # Build operator preference data
        for preference_name, preference in operator.get('preferences', {}).items():
            vardef = operator_info['variables']['preferences'].get(preference_name)
            value = preference.get('value', None)

            # Handle multiuser
            variable_user = user if vardef is not None and vardef["multiuser"] else workspaceDAO.creator

            if preference_name in operator_forced_values:
                preference['value'] = operator_forced_values[preference_name]['value']
            elif value is None or value["users"].get("%s" % variable_user.id, None) is None:
                # If not defined / not defined for the current user, take the default value
                preference['value'] = parse_value_from_text(vardef, vardef['default'])
            else:
                preference['value'] = value["users"].get("%s" % variable_user.id)

            # Secure censor
            if vardef is not None and vardef["secure"]:
                preference['value'] = "" if preference.get('value') is None or decrypt_value(preference.get('value')) == "" else "********"

        # Build operator property data
        for property_name, property in operator.get('properties', {}).items():
            vardef = operator_info['variables']['properties'].get(property_name)
            value = property.get('value', None)

            # Handle multiuser
            variable_user = user if vardef is not None and vardef["multiuser"] else workspaceDAO.creator

            if property_name in operator_forced_values:
                property['value'] = operator_forced_values[property_name]['value']
            elif value is None or value["users"].get("%s" % variable_user.id, None) is None:
                # If not defined / not defined for the current user, take the default value
                property['value'] = parse_value_from_text(vardef, vardef['default'])
            else:
                property['value'] = value["users"].get("%s" % variable_user.id)

            # Secure censor
            if vardef is not None and vardef["secure"]:
                property['value'] = "" if property.get('value') is None or decrypt_value(property.get('value')) == "" else "********"

    return json.dumps(data_ret, cls=LazyEncoder)


def get_global_workspace_data(workspace, user):
    key = _workspace_cache_key(workspace, user)
    data = cache.get(key)
    if data is None:
        data = CacheableData(_get_global_workspace_data(workspace, user), timestamp=workspace.last_modified)
        key = _workspace_cache_key(workspace, user)
        cache.set(key, data)

    return data


def get_tab_data(tab, workspace=None, cache_manager=None, user=None):

    if workspace is None:
        workspace = tab.workspace

    if cache_manager is None:
        cache_manager = VariableValueCacheManager(workspace, user)

    return {
        'id': "%s" % tab.id,
        'name': tab.name,
        'title': tab.title,
        'visible': tab.visible,
        'preferences': get_tab_preference_values(tab),
        'iwidgets': [get_iwidget_data(widget, workspace, cache_manager, user) for widget in tab.iwidget_set.order_by('id')]
    }


def get_iwidget_data(iwidget, workspace, cache_manager=None, user=None):

    data_ret = {
        'id': "%s" % iwidget.id,
        'title': iwidget.name,
        'tab': iwidget.tab.id,
        'layout': iwidget.layout,
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
        'titlevisible': iwidget.positions['widget'].get('titlevisible', True),
    }

    if iwidget.widget is None or not iwidget.widget.resource.is_available_for(workspace.creator):
        # The widget used by this iwidget is missing
        return data_ret

    if cache_manager is None:
        cache_manager = VariableValueCacheManager(workspace, user)

    iwidget_info = iwidget.widget.resource.get_processed_info()
    data_ret['preferences'] = {preference['name']: cache_manager.get_variable_data("iwidget", iwidget.id, preference['name']) for preference in iwidget_info['preferences']}
    data_ret['properties'] = {property['name']: cache_manager.get_variable_data("iwidget", iwidget.id, property['name']) for property in iwidget_info['properties']}

    return data_ret


def create_workspace(owner, f=None, mashup=None, new_name=None, new_title=None, preferences={}, searchable=True, public=False):

    from wirecloud.platform.workspace.mashupTemplateParser import buildWorkspaceFromTemplate

    if mashup is not None and f is not None:
        raise Exception

    if f is not None:

        wgt = f if isinstance(f, WgtFile) else WgtFile(f)
        template = TemplateParser(wgt.get_template())

        resource_info = template.get_resource_processed_info(process_urls=False)
        if resource_info["type"] != 'mashup':
            raise Exception

        for embedded_resource in resource_info['embedded']:
            if embedded_resource['src'].startswith('https://'):
                resource_file = download_http_content(embedded_resource['src'])
            else:
                resource_file = BytesIO(wgt.read(embedded_resource['src']))

            extra_resource_contents = WgtFile(resource_file)
            install_component(extra_resource_contents, executor_user=owner, users=[owner])
    else:
        values = mashup.split('/', 3)
        if len(values) != 3:
            raise TypeError(_('invalid mashup id'))

        (mashup_vendor, mashup_name, mashup_version) = values
        try:
            resource = CatalogueResource.objects.get(vendor=mashup_vendor, short_name=mashup_name, version=mashup_version)
            if not resource.is_available_for(owner) or resource.resource_type() != 'mashup':
                raise CatalogueResource.DoesNotExist
        except CatalogueResource.DoesNotExist:
            raise Exception(_('Mashup not found: %(mashup)s') % {'mashup': mashup})

        base_dir = catalogue.wgt_deployer.get_base_dir(mashup_vendor, mashup_name, mashup_version)
        wgt_file = WgtFile(os.path.join(base_dir, resource.template_uri))
        template = TemplateParser(wgt_file.get_template())

    workspace, _foo = buildWorkspaceFromTemplate(template, owner, new_name=new_name, new_title=new_title, searchable=searchable, public=public)

    if len(preferences) > 0:
        update_workspace_preferences(workspace, preferences, invalidate_cache=False)

    return workspace


def delete_workspace(workspace=None, user=None, name=None):
    if workspace is None:
        workspace = get_object_or_404(Workspace, creator__username=user, name=name)

    # Remove the workspace
    iwidgets = IWidget.objects.filter(tab__workspace=workspace)
    for iwidget in iwidgets:
        iwidget.delete()
    workspace.delete()
