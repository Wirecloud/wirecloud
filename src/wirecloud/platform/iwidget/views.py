# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.http import Http404, HttpResponse
from django.utils.translation import ugettext as _
from django.shortcuts import get_object_or_404

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.commons.utils.http import authentication_required, build_error_response, consumes, parse_json_request
from wirecloud.platform.iwidget.utils import SaveIWidget, UpdateIWidget
from wirecloud.platform.models import Widget, IWidget, Tab, Workspace
from wirecloud.platform.workspace.utils import VariableValueCacheManager, get_iwidget_data


class IWidgetCollection(Resource):

    @authentication_required
    def read(self, request, workspace_id, tab_id):

        tab = get_object_or_404(Tab.objects.select_related('workspace'), workspace__pk=workspace_id, pk=tab_id)
        if not tab.workspace.is_available_for(request.user):
            return build_error_response(request, 403, _("You don't have permission to access this workspace"))

        cache_manager = VariableValueCacheManager(tab.workspace, request.user)
        iwidgets = tab.iwidget_set.all()
        data = [get_iwidget_data(iwidget, tab.workspace, cache_manager) for iwidget in iwidgets]

        return HttpResponse(json.dumps(data, sort_keys=True), content_type='application/json; charset=UTF-8')

    @authentication_required
    @consumes(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id, tab_id):

        iwidget = parse_json_request(request)
        initial_variable_values = iwidget.get('variable_values', None)

        # iWidget creation
        tab = get_object_or_404(Tab.objects.select_related('workspace'), workspace__pk=workspace_id, pk=tab_id)
        if not request.user.is_superuser and tab.workspace.creator != request.user:
            msg = _('You have not enough permission for adding iwidgets to the workspace')
            return build_error_response(request, 403, msg)

        try:
            iwidget = SaveIWidget(iwidget, request.user, tab, initial_variable_values)
            iwidget_data = get_iwidget_data(iwidget, tab.workspace, user=request.user)

            return HttpResponse(json.dumps(iwidget_data), content_type='application/json; charset=UTF-8', status=201)
        except (CatalogueResource.DoesNotExist, Widget.DoesNotExist) as e:
            msg = _('refered widget %(widget_uri)s does not exist.') % {'widget_uri': iwidget['widget']}
            return build_error_response(request, 422, msg)
        except TypeError as e:
            return build_error_response(request, 400, e)
        except ValueError as e:
            return build_error_response(request, 422, e)

    @authentication_required
    @consumes(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id, tab_id):

        iwidgets = parse_json_request(request)

        tab = get_object_or_404(Tab, workspace__pk=workspace_id, pk=tab_id)
        if not request.user.is_superuser and tab.workspace.creator != request.user:
            msg = _('You have not enough permission for updating the iwidgets of this workspace')
            return build_error_response(request, 403, msg)

        for iwidget in iwidgets:
            try:
                UpdateIWidget(iwidget, request.user, tab, updatecache=False)
            except IWidget.DoesNotExist:
                return build_error_response(request, 422, _("Widget {id} does not exist").format(id=iwidget.get('id')))
            except TypeError as e:
                return build_error_response(request, 400, e)
            except ValueError as e:
                return build_error_response(request, 422, e)

        if len(iwidgets) > 0:
            # Invalidate workspace cache
            tab.workspace.save()

        return HttpResponse(status=204)


class IWidgetEntry(Resource):

    @authentication_required
    def read(self, request, workspace_id, tab_id, iwidget_id):

        workspace = get_object_or_404(Workspace, id=workspace_id)

        iwidget = get_object_or_404(IWidget, tab__workspace__users=request.user, tab__workspace=workspace, tab__pk=tab_id, pk=iwidget_id)
        iwidget_data = get_iwidget_data(iwidget, workspace, user=request.user)

        return HttpResponse(json.dumps(iwidget_data, sort_keys=True), content_type='application/json; charset=UTF-8')

    @authentication_required
    @consumes(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id, tab_id, iwidget_id):

        iwidget = parse_json_request(request)

        tab = get_object_or_404(Tab.objects.select_related('workspace'), workspace__pk=workspace_id, pk=tab_id)
        if not request.user.is_superuser and tab.workspace.creator != request.user:
            msg = _('You have not enough permission for updating the iwidget')
            return build_error_response(request, 403, msg)

        iwidget['id'] = iwidget_id
        try:
            UpdateIWidget(iwidget, request.user, tab)
        except Tab.DoesNotExist:
            return build_error_response(request, 422, _("Target tab {id} does not exist").format(id=iwidget['tab']))
        except (CatalogueResource.DoesNotExist, Widget.DoesNotExist) as e:
            msg = _('refered widget %(widget_uri)s does not exist.') % {'widget_uri': iwidget['widget']}
            return build_error_response(request, 422, msg)
        except TypeError as e:
            return build_error_response(request, 400, e)
        except ValueError as e:
            return build_error_response(request, 422, e)
        except IWidget.DoesNotExist:
            raise Http404

        return HttpResponse(status=204)

    @authentication_required
    @commit_on_http_success
    def delete(self, request, workspace_id, tab_id, iwidget_id):

        # Gets Iwidget, if it does not exist, a http 404 error is returned
        iwidget = get_object_or_404(IWidget.objects.select_related('tab__workspace'), tab__workspace__pk=workspace_id, tab__pk=tab_id, pk=iwidget_id)
        if not request.user.is_superuser and iwidget.tab.workspace.creator != request.user:
            msg = _('You have not enough permission for removing iwidgets from the workspace')
            return build_error_response(request, 403, msg)

        if iwidget.readOnly:
            msg = _('IWidget cannot be deleted')
            return build_error_response(request, 403, msg)

        iwidget.delete()

        return HttpResponse(status=204)


class IWidgetPreferences(Resource):

    @authentication_required
    @consumes(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id, tab_id, iwidget_id):

        workspace = get_object_or_404(Workspace, pk=workspace_id)

        iwidget = get_object_or_404(IWidget.objects.select_related('widget__resource'), pk=iwidget_id)
        if iwidget.tab_id != int(tab_id):
            raise Http404

        try:
            iwidget_info = iwidget.widget.resource.get_processed_info(translate=True, process_variables=True)
        except:
            return build_error_response(request, 403, _('Missing widget variables cannot be updated'))

        new_values = parse_json_request(request)

        for var_name in new_values:
            try:
                vardef = iwidget_info['variables']['preferences'][var_name]
            except KeyError:
                msg = _('Invalid preference: "%s"') % var_name
                return build_error_response(request, 422, msg)

            if vardef['readonly'] is True:
                msg = _('"%s" preference is read only.') % var_name
                return build_error_response(request, 403, msg)

            # Check if its multiuser
            if not vardef.get("multiuser", False):
                # No multiuser -> Check permisisons
                if not request.user.is_superuser and workspace.creator != request.user:
                    msg = _('You have not enough permission for updating the preferences of the iwidget')
                    return build_error_response(request, 403, msg)

            iwidget.set_variable_value(var_name, new_values[var_name], request.user)

        iwidget.save()
        return HttpResponse(status=204)

    @authentication_required
    def read(self, request, workspace_id, tab_id, iwidget_id):
        workspace = get_object_or_404(Workspace, pk=workspace_id)

        if not workspace.is_available_for(request.user):
            msg = _("You don't have permission to access this workspace")
            return build_error_response(request, 403, msg)

        iwidget = get_object_or_404(IWidget, pk=iwidget_id)
        if iwidget.tab_id != int(tab_id):
            raise Http404

        if iwidget.widget is None:
            return HttpResponse(json.dumps({}), content_type='application/json; charset=UTF-8')

        try:
            iwidget_info = iwidget.widget.resource.get_processed_info(translate=True, process_variables=True)
        except:
            return build_error_response(request, 403, _('Missing widget variables cannot be updated'))

        cache_manager = VariableValueCacheManager(workspace, request.user)
        prefs = iwidget_info['variables']['preferences']

        data = {}
        data = {var: cache_manager.get_variable_data("iwidget", iwidget_id, var) for var in prefs}

        return HttpResponse(json.dumps(data, sort_keys=True), content_type='application/json; charset=UTF-8')


class IWidgetProperties(Resource):

    @authentication_required
    @consumes(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id, tab_id, iwidget_id):

        workspace = get_object_or_404(Workspace, pk=workspace_id)

        iwidget = get_object_or_404(IWidget, pk=iwidget_id)
        if iwidget.tab_id != int(tab_id):
            raise Http404

        iwidget_info = iwidget.widget.resource.get_processed_info(translate=True, process_variables=True)

        new_values = parse_json_request(request)

        for var_name in new_values:
            if var_name not in iwidget_info['variables']['properties']:
                msg = _('Invalid persistent variable: "%s"') % var_name
                return build_error_response(request, 422, msg)

            # Check if its multiuser
            if not iwidget_info['variables']['properties'][var_name].get("multiuser", False):
                # No multiuser -> Check permissions
                if workspace.creator != request.user:
                    msg = _('You have not enough permission for updating the persistent variables of this widget')
                    return build_error_response(request, 403, msg)
            else:
                # Multiuser -> Check permissions
                if not workspace.is_available_for(request.user):
                    msg = _('You have not enough permission for updating the persistent variables of this widget')
                    return build_error_response(request, 403, msg)

            iwidget.set_variable_value(var_name, new_values[var_name], request.user)

        iwidget.save()
        return HttpResponse(status=204)

    @authentication_required
    def read(self, request, workspace_id, tab_id, iwidget_id):
        workspace = get_object_or_404(Workspace, pk=workspace_id)

        if not workspace.is_available_for(request.user):
            msg = _("You don't have permission to access this workspace")
            return build_error_response(request, 403, msg)

        iwidget = get_object_or_404(IWidget, pk=iwidget_id)
        if iwidget.tab_id != int(tab_id):
            raise Http404

        if iwidget.widget is None:
            return HttpResponse(json.dumps({}), content_type='application/json; charset=UTF-8')

        iwidget_info = iwidget.widget.resource.get_processed_info(translate=True, process_variables=True)

        cache_manager = VariableValueCacheManager(workspace, request.user)
        props = iwidget_info['variables']['properties']

        data = {}
        data = {var: cache_manager.get_variable_data("iwidget", iwidget_id, var) for var in props}

        return HttpResponse(json.dumps(data, sort_keys=True), content_type='application/json; charset=UTF-8')
