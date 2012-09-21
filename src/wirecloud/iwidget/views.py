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

from django.http import HttpResponse, HttpResponseBadRequest
from django.utils import simplejson
from django.utils.translation import ugettext as _
from django.shortcuts import get_object_or_404

from commons.authentication import Http403
from commons.cache import no_cache
from commons.get_data import VariableValueCacheManager, get_iwidget_data, get_variable_data
from commons.http_utils import PUT_parameter
from commons.logs_exception import TracedServerError
from commons.resource import Resource
from commons.utils import get_xml_error, json_encode
from wirecloud.iwidget.utils import SaveIWidget, UpdateIWidget, UpgradeIWidget, deleteIWidget
from wirecloud.models import Widget, IWidget, Tab, UserWorkspace, Variable, Workspace
from wirecloud.widget.utils import get_or_add_widget_from_catalogue, get_and_add_widget
from wirecloudcommons.utils.transaction import commit_on_http_success


class IWidgetCollection(Resource):

    @no_cache
    def read(self, request, workspace_id, tab_id):

        workspace = get_object_or_404(Workspace, id=workspace_id)

        data_list = {}
        cache_manager = VariableValueCacheManager(workspace, request.user)
        iwidgets = IWidget.objects.filter(tab__workspace__users=request.user, tab__workspace__pk=workspace_id, tab__pk=tab_id)
        data_list['iWidgets'] = [get_iwidget_data(iwidget, request.user, workspace, cache_manager) for iwidget in iwidgets]

        return HttpResponse(json_encode(data_list), mimetype='application/json; charset=UTF-8')

    @commit_on_http_success
    def create(self, request, workspace_id, tab_id):

        if 'iwidget' not in request.POST:
            return HttpResponseBadRequest(get_xml_error(_("iWidget JSON expected")), mimetype='application/xml; charset=UTF-8')

        # Data checking and parsing
        try:
            iwidget = simplejson.loads(request.POST['iwidget'])
        except:
            return HttpResponseBadRequest(get_xml_error(_('iWidget data is not valid JSON')))

        initial_variable_values = None
        if 'variable_values' in request.POST:
            try:
                initial_variable_values = simplejson.loads(request.POST['variable_values'])
            except:
                return HttpResponseBadRequest(get_xml_error(_('variables_values must be a valid JSON value')))

        # iWidget creation
        try:
            tab = Tab.objects.get(workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)
            iwidget = SaveIWidget(iwidget, request.user, tab, initial_variable_values)
            iwidget_data = get_iwidget_data(iwidget, request.user, tab.workspace)

            return HttpResponse(json_encode(iwidget_data), mimetype='application/json; charset=UTF-8')
        except Widget.DoesNotExist, e:
            msg = _('referred widget %(widget_uri)s does not exist.') % {'widget_uri': iwidget['widget']}

            raise TracedServerError(e, {'iwidget': iwidget, 'user': request.user, 'tab': tab}, request, msg)

        except Workspace.DoesNotExist, e:
            msg = _('referred workspace %(workspace_id)s does not exist.') % {'workspace_id': workspace_id}

            raise TracedServerError(e, {'workspace': workspace_id}, request, msg)
        except Exception, e:
            msg = _("iWidget cannot be created: ") + unicode(e)

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id}, request, msg)

    @commit_on_http_success
    def update(self, request, workspace_id, tab_id):

        content_type = request.META.get('CONTENT_TYPE', '')
        if content_type == None:
            content_type = ''

        if not content_type.startswith('application/json'):
            return HttpResponseBadRequest(get_xml_error(_("Invalid content type")), mimetype='application/xml; charset=UTF-8')

        try:
            received_data = simplejson.loads(request.raw_post_data)
        except:
            return HttpResponseBadRequest(get_xml_error(_("Request body is not valid JSON data")), mimetype='application/xml; charset=UTF-8')

        try:
            tab = Tab.objects.get(workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)
            iwidgets = received_data
            for iwidget in iwidgets:
                UpdateIWidget(iwidget, request.user, tab)

            return HttpResponse('ok')
        except Tab.DoesNotExist, e:
            msg = _('referred tab %(tab_id)s does not exist.') % {'tab_id': tab_id}

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id}, request, msg)
        except Exception, e:
            msg = _("iWidgets cannot be updated: ") + unicode(e)

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id}, request, msg)


class IWidgetEntry(Resource):

    @no_cache
    def read(self, request, workspace_id, tab_id, iwidget_id):

        workspace = get_object_or_404(Workspace, id=workspace_id)

        iwidget = get_object_or_404(IWidget, tab__workspace__users=request.user, tab__workspace=workspace, tab__pk=tab_id, pk=iwidget_id)
        iwidget_data = get_iwidget_data(iwidget, request.user, workspace)

        return HttpResponse(json_encode(iwidget_data), mimetype='application/json; charset=UTF-8')

    @commit_on_http_success
    def update(self, request, workspace_id, tab_id, iwidget_id):

        received_json = PUT_parameter(request, 'iwidget')

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("iWidget JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            iwidget = simplejson.loads(received_json)
            tab = Tab.objects.get(workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)
            UpdateIWidget(iwidget, request.user, tab)

            return HttpResponse('ok')
        except Tab.DoesNotExist, e:
            msg = _('referred tab %(tab_id)s does not exist.') % {'tab_id': tab_id}

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id}, request, msg)
        except Exception, e:
            msg = _("iWidgets cannot be updated: ") + unicode(e)

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id}, request, msg)

    @commit_on_http_success
    def delete(self, request, workspace_id, tab_id, iwidget_id):

        # Gets Iwidget, if it does not exist, a http 404 error is returned
        iwidget = get_object_or_404(IWidget, tab__workspace__users=request.user, tab__workspace__pk=workspace_id, tab__pk=tab_id, pk=iwidget_id)

        deleteIWidget(iwidget, request.user)

        return HttpResponse('ok')


class IWidgetVersion(Resource):

    @commit_on_http_success
    def update(self, request, workspace_id, tab_id, iwidget_id):

        workspace = Workspace.objects.get(id=workspace_id)
        if workspace.creator != request.user:
            raise Http403()

        content_type = request.META.get('CONTENT_TYPE', '')
        if content_type == None:
            content_type = ''

        if content_type.startswith('application/json'):
            received_json = request.raw_post_data
        else:
            received_json = PUT_parameter(request, 'iwidget')

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("iWidget JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            data = simplejson.loads(received_json)
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

            return HttpResponse('ok')
        except Exception, e:
            msg = unicode(e)

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id}, request, msg)

        return


class IWidgetVariableCollection(Resource):

    @no_cache
    def read(self, request, workspace_id, tab_id, iwidget_id):

        tab = Tab.objects.get(workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)
        variables = Variable.objects.filter(iwidget__tab=tab, iwidget__id=iwidget_id)
        vars_data = [get_variable_data(variable) for variable in variables]

        return HttpResponse(json_encode(vars_data), mimetype='application/json; charset=UTF-8')

    @commit_on_http_success
    def update(self, request, workspace_id, tab_id, iwidget_id):

        received_json = PUT_parameter(request, 'variables')

        # Gets JSON parameter from request
        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("iWidget variables JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            received_variables = simplejson.loads(received_json)

            tab = Tab.objects.get(workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)
            server_variables = Variable.objects.filter(iwidget__tab=tab)

            # Widget variables collection update
            for varServer in server_variables:
                for varJSON in received_variables:
                    if (varServer.vardef.pk == varJSON['pk'] and varServer.iwidget.pk == varJSON['iWidget']):
                        varServer.value = varJSON['value']
                        varServer.save()

        except Tab.DoesNotExist, e:
            msg = _('referred tab %(tab_id)s does not exist.') % {'tab_id': tab_id}

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id, 'iwidget': iwidget_id}, request, msg)
        except Exception, e:
            msg = _("iwidget varaible cannot be updated: ") + unicode(e)

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id, 'iwidget': iwidget_id}, request, msg)

        return HttpResponse("<ok>", mimetype='text/xml; charset=UTF-8')


class IWidgetVariable(Resource):

    @no_cache
    def read(self, request, workspace_id, tab_id, iwidget_id, var_id):

        tab = Tab.objects.get(workspace__user=request.user, workspace__pk=workspace_id, pk=tab_id)
        variable = get_object_or_404(Variable, iwidget__tab=tab, iwidget__pk=iwidget_id, vardef__pk=var_id)
        var_data = get_variable_data(variable)

        return HttpResponse(json_encode(var_data), mimetype='application/json; charset=UTF-8')

    def create(self, request, workspace_id, tab_id, iwidget_id, var_id):
        return self.update(request, workspace_id, tab_id, iwidget_id, var_id)

    @commit_on_http_success
    def update(self, request, workspace_id, tab_id, iwidget_id, var_id):

        received_json = PUT_parameter(request, 'value')

        # Gets value parameter from request
        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("iWidget JSON expected")), mimetype='application/xml; charset=UTF-8')

        new_value = received_json

        tab = Tab.objects.get(workspace__users=request.user, workspace__pk=workspace_id, pk=tab_id)
        variable = get_object_or_404(Variable, iwidget__tab=tab, iwidget__pk=iwidget_id, vardef__pk=var_id)
        try:
            variable.value = new_value
            variable.save()
        except Exception, e:
            msg = _("iwidget varaible cannot be updated: ") + unicode(e)

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id, 'iwidget': iwidget_id, 'variable': var_id}, request, msg)

        return HttpResponse('ok')
