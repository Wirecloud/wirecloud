# -*- coding: utf-8 -*-

# Copyright 2008-2013 Universidad Politécnica de Madrid

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

from django.core.cache import cache
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _

from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.cache import no_cache
from wirecloud.commons.utils.http import authentication_required, build_error_response, supported_request_mime_types
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.platform.models import PlatformPreference, WorkspacePreference, Tab, TabPreference, update_session_lang, Workspace


def update_preferences(user, preferences_json):
    _currentPreferences = PlatformPreference.objects.filter(user=user)
    currentPreferences = {}
    for currentPreference in _currentPreferences:
        currentPreferences[currentPreference.name] = currentPreference

    for name in preferences_json.keys():
        preference_data = preferences_json[name]

        if name in currentPreferences:
            preference = currentPreferences[name]
        else:
            preference = PlatformPreference(user=user, name=name)

        preference.value = unicode(preference_data['value'])
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


def get_tab_preference_values(tab):
    return parseInheritableValues(TabPreference.objects.filter(tab=tab.pk))


def update_tab_preferences(tab, preferences_json):
    _currentPreferences = TabPreference.objects.filter(tab=tab)
    currentPreferences = {}
    for currentPreference in _currentPreferences:
        currentPreferences[currentPreference.name] = currentPreference

    for name in preferences_json.keys():
        preference_data = preferences_json[name]

        if name in currentPreferences:
            preference = currentPreferences[name]
        else:
            preference = TabPreference(tab=tab, name=name)

        if 'value' in preference_data:
            preference.value = unicode(preference_data['value'])

        if 'inherit' in preference_data:
            preference.inherit = preference_data['inherit']

        preference.save()

    from wirecloud.platform.get_data import _invalidate_cached_variable_values
    _invalidate_cached_variable_values(tab.workspace)

def make_workspace_preferences_cache_key(workspace_id):
    return '_workspace_preferences_cache/' + str(workspace_id)


def get_workspace_preference_values(workspace):
    if isinstance(workspace, Workspace):
        workspace_id = workspace.id
    else:
        workspace_id = int(workspace)

    cache_key = make_workspace_preferences_cache_key(workspace_id)
    values = cache.get(cache_key)
    if values is None:
        values = parseInheritableValues(WorkspacePreference.objects.filter(workspace=workspace_id))
        cache.set(cache_key, values)

    return values


def update_workspace_preferences(workspace, preferences_json):
    _currentPreferences = WorkspacePreference.objects.filter(workspace=workspace)
    currentPreferences = {}
    for currentPreference in _currentPreferences:
        currentPreferences[currentPreference.name] = currentPreference

    for name in preferences_json.keys():
        preference_data = preferences_json[name]

        if name in currentPreferences:
            preference = currentPreferences[name]
        else:
            preference = WorkspacePreference(workspace=workspace, name=name)

        if 'value' in preference_data:
            preference.value = unicode(preference_data['value'])

        if 'inherit' in preference_data:
            preference.inherit = preference_data['inherit']

        preference.save()

    cache_key = make_workspace_preferences_cache_key(workspace.id)
    cache.delete(cache_key)

    from wirecloud.platform.get_data import _invalidate_cached_variable_values
    _invalidate_cached_variable_values(workspace)


class PlatformPreferencesCollection(Resource):

    @authentication_required
    @no_cache
    def read(self, request):
        result = parseValues(PlatformPreference.objects.filter(user=request.user))

        return HttpResponse(json.dumps(result), mimetype='application/json; charset=UTF-8')

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def create(self, request):
        try:
            preferences_json = json.loads(request.raw_post_data)
        except ValueError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        update_preferences(request.user, preferences_json)

        if 'language' in preferences_json:
            update_session_lang(request, request.user)

        return HttpResponse(status=204)


class WorkspacePreferencesCollection(Resource):

    @authentication_required
    @no_cache
    def read(self, request, workspace_id):

        # Check Workspace existance and owned by this user
        workspace = get_object_or_404(Workspace, pk=workspace_id)
        if not (request.user.is_superuser or workspace.users.filter(pk=request.user.pk).exists()):
            return HttpResponseForbidden()

        result = get_workspace_preference_values(workspace.id)

        return HttpResponse(json.dumps(result), mimetype='application/json; charset=UTF-8')

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id):

        # Check Workspace existance and owned by this user
        workspace = get_object_or_404(Workspace, pk=workspace_id)
        if not (request.user.is_superuser or workspace.users.filter(pk=request.user.pk).exists()):
            return HttpResponseForbidden()

        try:
            preferences_json = json.loads(request.raw_post_data)
        except ValueError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        update_workspace_preferences(workspace, preferences_json)
        return HttpResponse(status=204)


class TabPreferencesCollection(Resource):

    @authentication_required
    @no_cache
    def read(self, request, workspace_id, tab_id):

        # Check Tab existance and owned by this user
        tab = get_object_or_404(Tab.objects.select_related('workspace'), workspace__pk=workspace_id, pk=tab_id)
        if not (request.user.is_superuser or tab.workspace.users.filter(pk=request.user.pk).exists()):
            return HttpResponseForbidden()

        result = get_tab_preference_values(tab)

        return HttpResponse(json.dumps(result), mimetype='application/json; charset=UTF-8')

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id, tab_id):

        # Check Tab existance and owned by this user
        tab = get_object_or_404(Tab.objects.select_related('workspace'), workspace__pk=workspace_id, pk=tab_id)
        if not (request.user.is_superuser or tab.workspace.users.filter(pk=request.user.pk).exists()):
            return HttpResponseForbidden()

        try:
            preferences_json = json.loads(request.raw_post_data)
        except ValueError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        update_tab_preferences(tab, preferences_json)
        return HttpResponse(status=204)
