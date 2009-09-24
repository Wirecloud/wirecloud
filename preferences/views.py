# -*- coding: utf-8 -*-

# MORFEO Project 
# http://morfeo-project.org 
# 
# Component: EzWeb
# 
# (C) Copyright 2008 Telef�nica Investigaci�n y Desarrollo 
#     S.A.Unipersonal (Telef�nica I+D) 
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

from django.shortcuts import get_object_or_404
from django.http import Http404, HttpResponse, HttpResponseBadRequest, HttpResponseServerError
from django.core import serializers
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from django.utils import simplejson
from commons.resource import Resource
from commons.authentication import get_user_authentication
from commons.utils import get_xml_error, json_encode
from commons.logs_exception import TracedServerError
from preferences.models import PlatformPreference, TabPreference
from commons.http_utils import PUT_parameter
from workspace.models import Tab


def update_preferences(user, preferences_json):
    _currentPreferences = PlatformPreference.objects.filter(user=user)
    currentPreferences = {}
    for currentPreference in _currentPreferences:
        currentPreferences[currentPreference.name] = currentPreference

    for name in preferences_json.keys():
        if name in currentPreferences:
            preference = currentPreferences[name]
        else:
            preference = PlatformPreference(user=user, name=name)

        preference.value = unicode(preferences_json[name])
        preference.save()


def parseValues(values):
    _values = {}

    for value in values:
        _values[value.name] = value.value

    return _values


def get_tab_preference_values(tab_id):
    return parseValues(TabPreference.objects.filter(tab=tab_id))

def update_tab_preferences(tab, preferences_json):
    _currentPreferences = TabPreference.objects.filter(tab=tab)
    currentPreferences = {}
    for currentPreference in _currentPreferences:
        currentPreferences[currentPreference.name] = currentPreference

    for name in preferences_json.keys():
        if name in currentPreferences:
            preference = currentPreferences[name]
        else:
            preference = TabPreference(tab=tab, name=name)

        preference.value = unicode(preferences_json[name])
        preference.save()



class PlatformPreferencesCollection(Resource):
    def read(self, request, user_name):
        user = get_user_authentication(request)

        result = parseValues(PlatformPreference.objects.filter(user=user))

        return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def update(self, request, user_name):
        user = get_user_authentication(request)
        received_json = PUT_parameter(request, 'preferences')

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("Platform Preferences JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            preferences_json = simplejson.loads(received_json)
            update_preferences(user, preferences_json)
            return HttpResponse('ok')
        except Exception, e:
            transaction.rollback()
            msg = _("Platform Preferences cannot be updated: ") + unicode(e)

            raise TracedServerError(e, {}, request, msg)

class TabPreferencesCollection(Resource):
    def read(self, request, user_name, workspace_id, tab_id):
        user = get_user_authentication(request)

        # Check Tab existance and owned by this user
        get_object_or_404(Tab, workspace__users__id=user.id, workspace__pk=workspace_id, pk=tab_id)

        result = get_tab_preference_values(tab_id)

        return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def update(self, request, user_name, workspace_id, tab_id):
        user = get_user_authentication(request)
        received_json = PUT_parameter(request, 'preferences')

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("Platform Preferences JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            preferences_json = simplejson.loads(received_json)

            # Check Tab existance and owned by this user
            tab = get_object_or_404(Tab, workspace__users__id=user.id, workspace__pk=workspace_id, pk=tab_id)

            update_tab_preferences(tab, preferences_json)
            return HttpResponse('ok')
        except Exception, e:
            transaction.rollback()
            msg = _("Tab Preferences could not be updated: ") + unicode(e)

            raise TracedServerError(e, {}, request, msg)
