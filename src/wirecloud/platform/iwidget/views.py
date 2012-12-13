# -*- coding: utf-8 -*-

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

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.utils import simplejson
from django.utils.decorators import method_decorator
from django.utils.translation import ugettext as _
from django.shortcuts import get_object_or_404

from commons.authentication import Http403
from commons.cache import no_cache
from commons.get_data import VariableValueCacheManager, get_iwidget_data, get_variable_data
from commons.resource import Resource
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.commons.utils.http import build_error_response, supported_request_mime_types
from wirecloud.platform.iwidget.utils import SaveIWidget, UpdateIWidget, UpgradeIWidget, deleteIWidget
from wirecloud.platform.models import Widget, IWidget, Tab, UserWorkspace, Variable, Workspace
from wirecloud.platform.widget.utils import get_or_add_widget_from_catalogue, get_and_add_widget


class IWidgetCollection(Resource):

    @method_decorator(login_required)
    @no_cache
    def read(self, request, workspace_id, tab_id):

        workspace = get_object_or_404(Workspace, id=workspace_id)

        data_list = {}
        cache_manager = VariableValueCacheManager(workspace, request.user)
        iwidgets = IWidget.objects.filter(tab__workspace__users=request.user, tab__workspace__pk=workspace_id, tab__pk=tab_id)
        data_list['iWidgets'] = [get_iwidget_data(iwidget, request.user, workspace, cache_manager) for iwidget in iwidgets]

        return HttpResponse(simplejson.dumps(data_list), mimetype='application/json; charset=UTF-8')

    @method_decorator(login_required)
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id, tab_id):

        try:
            data = simplejson.loads(request.raw_post_data)
        except simplejson.JSONDecodeError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        iwidget = data['iwidget']
        initial_variable_values = data.get('variable_values', None)

        # iWidget creation
        tab = get_object_or_404(Tab, workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)
        try:
            iwidget = SaveIWidget(iwidget, request.user, tab, initial_variable_values)
            iwidget_data = get_iwidget_data(iwidget, request.user, tab.workspace)

            return HttpResponse(simplejson.dumps(iwidget_data), mimetype='application/json; charset=UTF-8')
        except Widget.DoesNotExist, e:
            msg = _('referred widget %(widget_uri)s does not exist.') % {'widget_uri': iwidget['widget']}

            raise build_error_response(request, 400, msg)

    @method_decorator(login_required)
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id, tab_id):

        try:
            iwidgets = simplejson.loads(request.raw_post_data)
        except simplejson.JSONDecodeError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        tab = get_object_or_404(Tab, workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)
        for iwidget in iwidgets:
            UpdateIWidget(iwidget, request.user, tab)

        return HttpResponse(status=204)


class IWidgetEntry(Resource):

    @method_decorator(login_required)
    @no_cache
    def read(self, request, workspace_id, tab_id, iwidget_id):

        workspace = get_object_or_404(Workspace, id=workspace_id)

        iwidget = get_object_or_404(IWidget, tab__workspace__users=request.user, tab__workspace=workspace, tab__pk=tab_id, pk=iwidget_id)
        iwidget_data = get_iwidget_data(iwidget, request.user, workspace)

        return HttpResponse(simplejson.dumps(iwidget_data), mimetype='application/json; charset=UTF-8')

    @method_decorator(login_required)
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id, tab_id, iwidget_id):

        try:
            iwidget = simplejson.loads(request.raw_post_data)
        except simplejson.JSONDecodeError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        tab = get_object_or_404(Tab, workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)
        UpdateIWidget(iwidget, request.user, tab)

        return HttpResponse(status=204)

    @method_decorator(login_required)
    @commit_on_http_success
    def delete(self, request, workspace_id, tab_id, iwidget_id):

        # Gets Iwidget, if it does not exist, a http 404 error is returned
        iwidget = get_object_or_404(IWidget, tab__workspace__users=request.user, tab__workspace__pk=workspace_id, tab__pk=tab_id, pk=iwidget_id)

        deleteIWidget(iwidget, request.user)

        return HttpResponse(status=204)


class IWidgetVersion(Resource):

    @method_decorator(login_required)
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id, tab_id, iwidget_id):

        workspace = Workspace.objects.get(id=workspace_id)
        if workspace.creator != request.user:
            raise Http403()

        try:
            data = simplejson.loads(request.raw_post_data)
        except simplejson.JSONDecodeError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        iwidget_pk = data.get('id')

        # get the iWidget object
        iwidget = get_object_or_404(IWidget, pk=iwidget_pk)

        new_version = data.get('newVersion')
        if workspace.is_shared():
            users = UserWorkspace.objects.filter(workspace=workspace).values_list('user', flat=True)
        else:
            users = [request.user]

        if not 'source' in data or data.get('source') == 'catalogue':
            widget = get_or_add_widget_from_catalogue(iwidget.widget.vendor, iwidget.widget.name, new_version, request.user, request, assign_to_users=users)
        elif data.get('source') == 'showcase':
            widget = get_and_add_widget(iwidget.widget.vendor, iwidget.widget.name, new_version, users)

        UpgradeIWidget(iwidget, request.user, widget)

        return HttpResponse(status=204)


class IWidgetVariableCollection(Resource):

    @method_decorator(login_required)
    @no_cache
    def read(self, request, workspace_id, tab_id, iwidget_id):

        tab = Tab.objects.get(workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)
        variables = Variable.objects.filter(iwidget__tab=tab, iwidget__id=iwidget_id)
        vars_data = [get_variable_data(variable) for variable in variables]

        return HttpResponse(simplejson.dumps(vars_data), mimetype='application/json; charset=UTF-8')

    @method_decorator(login_required)
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id, tab_id, iwidget_id):

        try:
            received_variables = simplejson.loads(request.raw_post_data)
        except simplejson.JSONDecodeError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        tab = get_object_or_404(Tab, workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)
        server_variables = Variable.objects.filter(iwidget__tab=tab)

        # Widget variables collection update
        for varServer in server_variables:
            for varJSON in received_variables:
                if (varServer.vardef.pk == varJSON['pk'] and varServer.iwidget.pk == varJSON['iWidget']):
                    varServer.value = varJSON['value']
                    varServer.save()

        return HttpResponse(status=204)


class IWidgetVariable(Resource):

    @method_decorator(login_required)
    @no_cache
    def read(self, request, workspace_id, tab_id, iwidget_id, var_id):

        tab = Tab.objects.get(workspace__user=request.user, workspace__pk=workspace_id, pk=tab_id)
        variable = get_object_or_404(Variable, iwidget__tab=tab, iwidget__pk=iwidget_id, vardef__pk=var_id)
        var_data = get_variable_data(variable)

        return HttpResponse(simplejson.dumps(var_data), mimetype='application/json; charset=UTF-8')

    def create(self, request, workspace_id, tab_id, iwidget_id, var_id):
        return self.update(request, workspace_id, tab_id, iwidget_id, var_id)

    @method_decorator(login_required)
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id, tab_id, iwidget_id, var_id):

        try:
            new_value = simplejson.loads(request.raw_post_data)
        except simplejson.JSONDecodeError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        tab = get_object_or_404(Tab, workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)
        variable = get_object_or_404(Variable, iwidget__tab=tab, iwidget__pk=iwidget_id, vardef__pk=var_id)
        variable.value = new_value
        variable.save()

        return HttpResponse(status=204)
