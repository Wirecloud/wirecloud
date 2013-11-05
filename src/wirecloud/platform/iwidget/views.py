# -*- coding: utf-8 -*-

# Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.http import HttpResponse
from django.utils.translation import ugettext as _
from django.shortcuts import get_object_or_404

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.baseviews import Resource
from wirecloud.commons.exceptions import Http403
from wirecloud.commons.utils.cache import no_cache
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.commons.utils.http import authentication_required, build_error_response, supported_request_mime_types
from wirecloud.platform.get_data import VariableValueCacheManager, get_iwidget_data
from wirecloud.platform.iwidget.utils import SaveIWidget, UpdateIWidget, UpgradeIWidget
from wirecloud.platform.models import Widget, IWidget, Tab, UserWorkspace, VariableValue, Workspace
from wirecloud.platform.widget.utils import get_or_add_widget_from_catalogue


class IWidgetCollection(Resource):

    @authentication_required
    @no_cache
    def read(self, request, workspace_id, tab_id):

        workspace = get_object_or_404(Workspace, id=workspace_id)

        cache_manager = VariableValueCacheManager(workspace, request.user)
        iwidgets = IWidget.objects.filter(tab__workspace__users=request.user, tab__workspace__pk=workspace_id, tab__pk=tab_id)
        data = [get_iwidget_data(iwidget, request.user, workspace, cache_manager) for iwidget in iwidgets]

        return HttpResponse(json.dumps(data), mimetype='application/json; charset=UTF-8')

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id, tab_id):

        try:
            iwidget = json.loads(request.raw_post_data)
        except ValueError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        initial_variable_values = iwidget.get('variable_values', None)

        # iWidget creation
        tab = get_object_or_404(Tab.objects.select_related('workspace'), workspace__pk=workspace_id, pk=tab_id)
        if not request.user.is_superuser and tab.workspace.creator != request.user:
            msg = _('You have not enough permission for adding iwidgets to the workspace')
            return build_error_response(request, 403, msg)

        try:
            iwidget = SaveIWidget(iwidget, request.user, tab, initial_variable_values)
            iwidget_data = get_iwidget_data(iwidget, request.user, tab.workspace)

            return HttpResponse(json.dumps(iwidget_data), mimetype='application/json; charset=UTF-8')
        except (CatalogueResource.DoesNotExist, Widget.DoesNotExist), e:
            msg = _('referred widget %(widget_uri)s does not exist.') % {'widget_uri': iwidget['widget']}
            return build_error_response(request, 422, msg)

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id, tab_id):

        try:
            iwidgets = json.loads(request.raw_post_data)
        except ValueError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        tab = get_object_or_404(Tab, workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)
        if not request.user.is_superuser and tab.workspace.creator != request.user:
            msg = _('You have not enough permission for updating the iwidgets of this workspace')
            return build_error_response(request, 403, msg)

        for iwidget in iwidgets:
            UpdateIWidget(iwidget, request.user, tab)

        return HttpResponse(status=204)


class IWidgetEntry(Resource):

    @authentication_required
    @no_cache
    def read(self, request, workspace_id, tab_id, iwidget_id):

        workspace = get_object_or_404(Workspace, id=workspace_id)

        iwidget = get_object_or_404(IWidget, tab__workspace__users=request.user, tab__workspace=workspace, tab__pk=tab_id, pk=iwidget_id)
        iwidget_data = get_iwidget_data(iwidget, request.user, workspace)

        return HttpResponse(json.dumps(iwidget_data), mimetype='application/json; charset=UTF-8')

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id, tab_id, iwidget_id):

        try:
            iwidget = json.loads(request.raw_post_data)
        except ValueError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        tab = get_object_or_404(Tab.objects.select_related('workspace'), workspace__pk=workspace_id, pk=tab_id)
        if not request.user.is_superuser and tab.workspace.creator != request.user:
            msg = _('You have not enough permission for updating the iwidget')
            return build_error_response(request, 403, msg)

        iwidget['id'] = iwidget_id
        UpdateIWidget(iwidget, request.user, tab)

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
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def create(self, request, workspace_id, tab_id, iwidget_id):

        workspace = Workspace.objects.get(id=workspace_id)
        if not request.user.is_superuser and workspace.creator != request.user:
            msg = _('You have not enough permission for updating the preferences of the iwidget')
            return build_error_response(request, 403, msg)

        try:
            new_values = json.loads(request.raw_post_data)
        except ValueError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        for var_name in new_values:
            variable_value = VariableValue.objects.select_related('variable__vardef').get(
                user=request.user,
                variable__vardef__name=var_name,
                variable__vardef__aspect='PREF',
                variable__iwidget__id=iwidget_id
            )
            variable_value.set_variable_value(new_values[var_name])
            variable_value.save()

        return HttpResponse(status=204)


class IWidgetVersion(Resource):

    @authentication_required
    @supported_request_mime_types(('application/json',))
    @commit_on_http_success
    def update(self, request, workspace_id, tab_id, iwidget_id):

        workspace = Workspace.objects.get(id=workspace_id)
        if not request.user.is_superuser and workspace.creator != request.user:
            raise Http403()

        try:
            data = json.loads(request.raw_post_data)
        except ValueError, e:
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

        UpgradeIWidget(iwidget, request.user, widget)

        return HttpResponse(status=204)
