# -*- coding: utf-8 -*-

# MORFEO Project
# http://morfeo-project.org
#
# Component: EzWeb
#
# (C) Copyright 2008 Telefónica Investigación y Desarrollo
#     S.A.Unipersonal (Telefónica I+D)
#
# Info about members and contributors of the MORFEO project
# is available at:
#
#   http://morfeo-project.org/
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
#
# If you want to use this software an plan to distribute a
# proprietary application in any way, and you are not licensing and
# distributing your source code under GPL, you probably need to
# purchase a commercial license of the product.  More info about
# licensing options is available at:
#
#   http://morfeo-project.org/
#

# @author jmostazo-upm

from django.core.cache import cache
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from django.utils import simplejson

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


class PlatformPreferencesCollection(Resource):

    @authentication_required
    @no_cache
    def read(self, request):
        result = parseValues(PlatformPreference.objects.filter(user=request.user))

        return HttpResponse(simplejson.dumps(result), mimetype='application/json; charset=UTF-8')

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request):
        try:
            preferences_json = simplejson.loads(request.raw_post_data)
        except Exception, e:
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
        workspace = get_object_or_404(Workspace, users=request.user, pk=workspace_id)

        result = get_workspace_preference_values(workspace.id)

        return HttpResponse(simplejson.dumps(result), mimetype='application/json; charset=UTF-8')

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id):

        # Check Workspace existance and owned by this user
        workspace = get_object_or_404(Workspace, users=request.user, pk=workspace_id)

        try:
            preferences_json = simplejson.loads(request.raw_post_data)
        except Exception, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        update_workspace_preferences(workspace, preferences_json)
        return HttpResponse(status=204)


class TabPreferencesCollection(Resource):

    @authentication_required
    @no_cache
    def read(self, request, workspace_id, tab_id):

        # Check Tab existance and owned by this user
        tab = get_object_or_404(Tab, workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)

        result = get_tab_preference_values(tab)

        return HttpResponse(simplejson.dumps(result), mimetype='application/json; charset=UTF-8')

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id, tab_id):

        # Check Tab existance and owned by this user
        tab = get_object_or_404(Tab, workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)

        try:
            preferences_json = simplejson.loads(request.raw_post_data)
        except Exception, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        update_tab_preferences(tab, preferences_json)
        return HttpResponse(status=204)
