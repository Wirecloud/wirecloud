# -*- coding: utf-8 -*-

# Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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

import json

from django.contrib.auth.models import User
from django.core.cache import cache
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _

from wirecloud.commons.baseviews import Resource
from wirecloud.commons.models import Organization
from wirecloud.commons.utils.http import authentication_required, build_error_response, consumes, parse_json_request
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.platform.plugins import get_tab_preferences, get_workspace_preferences
from wirecloud.platform.models import PlatformPreference, WorkspacePreference, Tab, TabPreference, update_session_lang, Workspace


def update_preferences(user, preferences_json):
    currentPreferences = {pref.name: pref for pref in PlatformPreference.objects.filter(user=user)}

    for name in preferences_json.keys():
        preference_data = preferences_json[name]

        if name in currentPreferences:
            preference = currentPreferences[name]
        else:
            preference = PlatformPreference(user=user, name=name)

        new_value = preference_data if type(preference_data) == str else preference_data.get('value')
        if new_value is not None and preference.value != new_value:
            preference.value = new_value
            preference.save()


def parseValues(values):
    _values = {}

    for value in values:
        _values[value.name] = {'inherit': False, 'value': value.value}

    return _values


def parseInheritableValues(values):
    _values = {}

    for value in values:
        _values[value.name] = {'inherit': value.inherit, 'value': value.value}

    return _values


def make_tab_preferences_cache_key(tab):
    return '_tab_preferences_cache/%s/%s' % (tab.id, tab.workspace.last_modified)


def serialize_default_value(value):

    if isinstance(value, str):
        return value
    else:
        return json.dumps(value, ensure_ascii=False)


def get_tab_preference_values(tab):
    cache_key = make_tab_preferences_cache_key(tab)
    values = cache.get(cache_key)
    if values is None:
        values = parseInheritableValues(tab.tabpreference_set.all())
        for preference in get_tab_preferences():
            if preference['name'] not in values:
                values[preference['name']] = {'inherit': bool(preference.get('inheritByDefault', False)), 'value': serialize_default_value(preference['defaultValue'])}

        cache.set(cache_key, values)

    return values


def update_tab_preferences(tab, preferences_json):

    changes = False

    # Create a preference instance dict
    currentPreferences = {}
    for currentPreference in TabPreference.objects.filter(tab=tab):
        currentPreferences[currentPreference.name] = currentPreference

    # Update preference values
    for name in preferences_json.keys():
        preference_data = preferences_json[name]
        pref_changes = False

        if name in currentPreferences:
            preference = currentPreferences[name]
        else:
            preference = TabPreference(tab=tab, name=name)
            changes = pref_changes = True

        if isinstance(preference_data, dict):
            if 'value' in preference_data and preference.value != preference_data['value']:
                preference.value = preference_data['value']
                changes = pref_changes = True

            if 'inherit' in preference_data and preference.inherit != preference_data['inherit']:
                preference.inherit = preference_data['inherit']
                changes = pref_changes = True
        else:
            if preference.value != preference_data:
                preference.value = preference_data
                changes = pref_changes = True

            if preference.inherit is not False:
                preference.inherit = False
                changes = pref_changes = True

        if pref_changes:
            preference.save()

    if changes:
        cache_key = make_tab_preferences_cache_key(tab)
        cache.delete(cache_key)
        tab.workspace.save()  # Invalidate workspace cache


def make_workspace_preferences_cache_key(workspace):
    return '_workspace_preferences_cache/%s/%s' % (workspace.id, workspace.last_modified)


def get_workspace_preference_values(workspace):

    cache_key = make_workspace_preferences_cache_key(workspace)
    values = cache.get(cache_key)
    if values is None:
        values = parseInheritableValues(workspace.workspacepreference_set.all())
        for preference in get_workspace_preferences():
            if preference['name'] not in values:
                values[preference['name']] = {'inherit': bool(preference.get('inheritByDefault', False)), 'value': serialize_default_value(preference['defaultValue'])}

        cache.set(cache_key, values)

    return values


def update_workspace_preferences(workspace, preferences_json, invalidate_cache=True):

    changes = False

    # Create a preference instance dict
    currentPreferences = {}
    for currentPreference in workspace.workspacepreference_set.all():
        currentPreferences[currentPreference.name] = currentPreference

    # Update preference values
    for name in preferences_json.keys():
        preference_data = preferences_json[name]
        pref_changes = False

        if name in currentPreferences:
            preference = currentPreferences[name]
        else:
            preference = WorkspacePreference(workspace=workspace, name=name)
            changes = pref_changes = True

        if isinstance(preference_data, dict):
            if 'value' in preference_data and preference.value != preference_data['value']:
                preference.value = preference_data['value']
                changes = pref_changes = True

            if 'inherit' in preference_data and preference.inherit != preference_data['inherit']:
                preference.inherit = preference_data['inherit']
                changes = pref_changes = True
        else:
            if preference.value != preference_data:
                preference.value = preference_data
                changes = pref_changes = True

            if preference.inherit is not False:
                preference.inherit = False
                changes = pref_changes = True

        if pref_changes:
            preference.save()

    if invalidate_cache and changes:
        cache_key = make_workspace_preferences_cache_key(workspace)
        cache.delete(cache_key)
        workspace.save()  # Invalidate workspace cache


class PlatformPreferencesCollection(Resource):

    def read(self, request):
        if request.user.is_authenticated:
            result = parseValues(PlatformPreference.objects.filter(user=request.user))
        else:
            result = {}

        return HttpResponse(json.dumps(result, sort_keys=True), content_type='application/json; charset=UTF-8')

    @authentication_required
    @consumes(('application/json',))
    @commit_on_http_success
    def create(self, request):

        preferences_json = parse_json_request(request)
        if not type(preferences_json) == dict:
            return build_error_response(request, 422, _('Invalid payload: root type must be object'))

        for pref_name, pref in preferences_json.items():
            if type(pref) not in (str, dict):
                return build_error_response(request, 422, _('Invalid type for pref value: {}'.format(pref_name)))
            if type(pref) == dict and len(set(pref.keys()) - set(("value",))) != 0:
                return build_error_response(request, 422, _('Invalid structure for pref: {}'.format(pref_name)))

            if type(pref) == dict and "value" in pref and type(pref['value']) != str:
                return build_error_response(request, 422, _('Invalid value for pref: {}'.format(pref_name)))
        update_preferences(request.user, preferences_json)

        if 'language' in preferences_json:
            update_session_lang(request, request.user)

        return HttpResponse(status=204)


class WorkspacePreferencesCollection(Resource):

    @authentication_required
    def read(self, request, workspace_id):

        # Check Workspace existance and owned by this user
        workspace = get_object_or_404(Workspace, pk=workspace_id)
        if not workspace.is_accessible_by(request.user):
            return build_error_response(request, 403, _('You are not allowed to read this workspace'))

        result = get_workspace_preference_values(workspace)

        return HttpResponse(json.dumps(result, sort_keys=True), content_type='application/json; charset=UTF-8')

    @authentication_required
    @consumes(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id):

        # Check Workspace existance and owned by this user
        workspace = get_object_or_404(Workspace, pk=workspace_id)
        if not workspace.is_editable_by(request.user):
            return build_error_response(request, 403, _('You are not allowed to update this workspace'))

        preferences_json = parse_json_request(request)
        if not type(preferences_json) == dict:
            return build_error_response(request, 422, _('Invalid payload: root type must be object'))

        for pref_name, pref in preferences_json.items():
            if type(pref) not in (str, dict):
                return build_error_response(request, 422, _('Invalid type for pref value: {}'.format(pref_name)))
            if type(pref) == dict and len(set(pref.keys()) - set(("inherit", "value"))) != 0:
                return build_error_response(request, 422, _('Invalid structure for pref: {}'.format(pref_name)))

            if type(pref) == dict and "value" in pref and type(pref['value']) != str:
                return build_error_response(request, 422, _('Invalid value for pref: {}'.format(pref_name)))

        save_workspace = False
        if 'sharelist' in preferences_json:
            workspace.users.clear()
            workspace.groups.clear()
            if type(preferences_json['sharelist']) == dict:
                sharelist = json.loads(preferences_json['sharelist']['value'])
            else:
                sharelist = json.loads(preferences_json['sharelist'])

            for item in sharelist:
                try:
                    user = User.objects.get(username=item['username'])
                except (KeyError, User.DoesNotExist):
                    continue

                workspace.userworkspace_set.create(user=user)
                try:
                    workspace.groups.add(user.organization.group)
                except Organization.DoesNotExist:
                    pass
            del preferences_json['sharelist']

        if 'public' in preferences_json and (type(preferences_json['public']) or "value" in preferences_json['public']):
            save_workspace = True
            if type(preferences_json['public']) == str:
                workspace.public = preferences_json['public'].strip().lower() == 'true'
            else:
                workspace.public = preferences_json['public']['value'].strip().lower() == 'true'
            del preferences_json['public']

        if 'requireauth' in preferences_json and (type(preferences_json['requireauth']) or "value" in preferences_json['requireauth']):
            save_workspace = True
            if type(preferences_json['requireauth']) == str:
                workspace.requireauth = preferences_json['requireauth'].strip().lower() == 'true'
            else:
                workspace.requireauth = preferences_json['requireauth']['value'].strip().lower() == 'true'
            del preferences_json['requireauth']

        if save_workspace:
            workspace.save()

        update_workspace_preferences(workspace, preferences_json)

        return HttpResponse(status=204)


class TabPreferencesCollection(Resource):

    @authentication_required
    def read(self, request, workspace_id, tab_id):

        # Check Tab existance and owned by this user
        tab = get_object_or_404(Tab.objects.select_related('workspace'), workspace__pk=workspace_id, pk=tab_id)
        if not tab.workspace.is_accessible_by(request.user):
            return build_error_response(request, 403, _('You are not allowed to read this workspace'))

        result = get_tab_preference_values(tab)

        return HttpResponse(json.dumps(result, sort_keys=True), content_type='application/json; charset=UTF-8')

    @authentication_required
    @consumes(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id, tab_id):

        # Check Tab existance and owned by this user
        tab = get_object_or_404(Tab.objects.select_related('workspace'), workspace__pk=workspace_id, pk=tab_id)
        if not tab.workspace.is_editable_by(request.user):
            return build_error_response(request, 403, _('You are not allowed to update this workspace'))

        preferences_json = parse_json_request(request)
        if not type(preferences_json) == dict:
            return build_error_response(request, 422, _('Invalid payload: root type must be object'))

        for pref_name, pref in preferences_json.items():
            if type(pref) not in (str, dict):
                return build_error_response(request, 422, _('Invalid type for pref value: {}'.format(pref_name)))
            if type(pref) == dict and len(set(pref.keys()) - set(("inherit", "value"))) != 0:
                return build_error_response(request, 422, _('Invalid structure for pref: {}'.format(pref_name)))

            if type(pref) == dict and "value" in pref and type(pref['value']) != str:
                return build_error_response(request, 422, _('Invalid value for pref: {}'.format(pref_name)))

        update_tab_preferences(tab, preferences_json)
        return HttpResponse(status=204)
