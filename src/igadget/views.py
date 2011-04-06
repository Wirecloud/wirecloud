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

from django.db import transaction
from django.http import HttpResponse, HttpResponseBadRequest
from django.utils import simplejson
from django.utils.translation import ugettext as _
from django.shortcuts import get_object_or_404

from commons.authentication import get_user_authentication, Http403
from commons.get_data import get_igadget_data, get_variable_data
from commons.http_utils import PUT_parameter
from commons.logs_exception import TracedServerError
from commons.resource import Resource
from commons.utils import get_xml_error, json_encode
from gadget.models import Gadget
from gadget.utils import get_or_create_gadget_from_catalogue, get_and_add_gadget
from igadget.models import IGadget, Variable
from igadget.utils import SaveIGadget, UpdateIGadget, UpgradeIGadget, deleteIGadget
from workspace.models import Tab, WorkSpace, UserWorkSpace


class IGadgetCollection(Resource):

    def read(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)

        workspace = get_object_or_404(WorkSpace, id=workspace_id)

        data_list = {}
        igadgets = IGadget.objects.filter(tab__workspace__users__id=user.id, tab__workspace__pk=workspace_id, tab__pk=tab_id)
        data_list['iGadgets'] = [get_igadget_data(igadget, user, workspace) for igadget in igadgets]

        return HttpResponse(json_encode(data_list), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def create(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)

        if 'igadget' not in request.POST:
            return HttpResponseBadRequest(get_xml_error(_("iGadget JSON expected")), mimetype='application/xml; charset=UTF-8')

        # Data checking and parsing
        try:
            igadget = simplejson.loads(request.POST['igadget'])
        except:
            return HttpResponseBadRequest(get_xml_error(_('iGadget data is not valid JSON')))

        initial_variable_values = None
        if 'variable_values' in request.POST:
            try:
                initial_variable_values = simplejson.loads(request.POST['variable_values'])
            except:
                return HttpResponseBadRequest(get_xml_error(_('variables_values must be a valid JSON value')))

        # iGadget creation
        try:
            tab = Tab.objects.get(workspace__users__id=user.id, workspace__pk=workspace_id, pk=tab_id)
            igadget = SaveIGadget(igadget, user, tab, initial_variable_values)
            igadget_data = get_igadget_data(igadget, user, tab.workspace)

            return HttpResponse(json_encode(igadget_data), mimetype='application/json; charset=UTF-8')
        except Gadget.DoesNotExist, e:
            msg = _('referred gadget %(gadget_uri)s does not exist.') % {'gadget_uri': igadget['gadget']}

            raise TracedServerError(e, {'igadget': igadget, 'user': user, 'tab': tab}, request, msg)

        except WorkSpace.DoesNotExist, e:
            msg = _('referred workspace %(workspace_id)s does not exist.') % {'workspace_id': workspace_id}

            raise TracedServerError(e, {'workspace': workspace_id}, request, msg)
        except Exception, e:
            transaction.rollback()
            msg = _("iGadget cannot be created: ") + unicode(e)

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id}, request, msg)

    @transaction.commit_manually
    def update(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)

        received_json = PUT_parameter(request, 'igadgets')

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("iGadget JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            tab = Tab.objects.get(workspace__users__id=user.id, workspace__pk=workspace_id, pk=tab_id)
            received_data = simplejson.loads(received_json)
            igadgets = received_data.get('iGadgets')
            for igadget in igadgets:
                UpdateIGadget(igadget, user, tab)

            transaction.commit()

            return HttpResponse('ok')
        except Tab.DoesNotExist, e:
            msg = _('referred tab %(tab_id)s does not exist.') % {'tab_id': tab_id}

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id}, request, msg)
        except Exception, e:
            transaction.rollback()
            msg = _("iGadgets cannot be updated: ") + unicode(e)

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id}, request, msg)


class IGadgetEntry(Resource):

    def read(self, request, workspace_id, tab_id, igadget_id):
        user = get_user_authentication(request)

        workspace = get_object_or_404(WorkSpace, id=workspace_id)

        igadget = get_object_or_404(IGadget, tab__workspace__users__id=user.id, tab__workspace=workspace, tab__pk=tab_id, pk=igadget_id)
        igadget_data = get_igadget_data(igadget, user, workspace)

        return HttpResponse(json_encode(igadget_data), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def update(self, request, workspace_id, tab_id, igadget_id):
        user = get_user_authentication(request)

        received_json = PUT_parameter(request, 'igadget')

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("iGadget JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            igadget = simplejson.loads(received_json)
            tab = Tab.objects.get(workspace__users__id=user.id, workspace__pk=workspace_id, pk=tab_id)
            UpdateIGadget(igadget, user, tab)

            return HttpResponse('ok')
        except Tab.DoesNotExist, e:
            msg = _('referred tab %(tab_id)s does not exist.') % {'tab_id': tab_id}

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id}, request, msg)
        except Exception, e:
            transaction.rollback()
            msg = _("iGadgets cannot be updated: ") + unicode(e)

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id}, request, msg)

    @transaction.commit_on_success
    def delete(self, request, workspace_id, tab_id, igadget_id):
        user = get_user_authentication(request)

        # Gets Igadget, if it does not exist, a http 404 error is returned
        igadget = get_object_or_404(IGadget, tab__workspace__users__id=user.id, tab__workspace__pk=workspace_id, tab__pk=tab_id, pk=igadget_id)

        deleteIGadget(igadget, user)

        return HttpResponse('ok')


class IGadgetVersion(Resource):

    @transaction.commit_on_success
    def update(self, request, workspace_id, tab_id, igadget_id):
        user = get_user_authentication(request)

        workspace = WorkSpace.objects.get(id=workspace_id)
        if workspace.creator != user:
            raise Http403()

        content_type = request.META.get('CONTENT_TYPE', '')
        if content_type == None:
            content_type = ''

        if content_type.startswith('application/json'):
            received_json = request.raw_post_data
        else:
            received_json = PUT_parameter(request, 'igadget')

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("iGadget JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            data = simplejson.loads(received_json)
            igadget_pk = data.get('id')

            # get the iGadget object
            igadget = get_object_or_404(IGadget, pk=igadget_pk)

            new_version = data.get('newVersion')
            if workspace.is_shared():
                users = UserWorkSpace.objects.filter(workspace=workspace).values_list('user', flat=True)
            else:
                users = [user]

            if not 'source' in data or data.get('source') == 'catalogue':
                gadget = get_or_create_gadget_from_catalogue(igadget.gadget.vendor, igadget.gadget.name, new_version, user, users, request)
            elif data.get('source') == 'showcase':
                gadget = get_and_add_gadget(igadget.gadget.vendor, igadget.gadget.name, new_version, users)

            UpgradeIGadget(igadget, user, gadget)

            return HttpResponse('ok')
        except Exception, e:
            transaction.rollback()
            msg = unicode(e)

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id}, request, msg)

        return


class IGadgetVariableCollection(Resource):

    def read(self, request, workspace_id, tab_id, igadget_id):
        user = get_user_authentication(request)

        tab = Tab.objects.get(workspace__users__id=user.id, workspace__pk=workspace_id, pk=tab_id)
        variables = Variable.objects.filter(igadget__tab=tab, igadget__id=igadget_id)
        vars_data = [get_variable_data(variable) for variable in variables]

        return HttpResponse(json_encode(vars_data), mimetype='application/json; charset=UTF-8')

    @transaction.commit_manually
    def update(self, request, workspace_id, tab_id, igadget_id):
        user = get_user_authentication(request)

        received_json = PUT_parameter(request, 'variables')

        # Gets JSON parameter from request
        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("iGadget variables JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            received_variables = simplejson.loads(received_json)

            tab = Tab.objects.get(workspace__users__id=user.id, workspace__pk=workspace_id, pk=tab_id)
            server_variables = Variable.objects.filter(igadget__tab=tab)

            # Gadget variables collection update
            for varServer in server_variables:
                for varJSON in received_variables:
                    if (varServer.vardef.pk == varJSON['pk'] and varServer.igadget.pk == varJSON['iGadget']):
                        varServer.value = varJSON['value']
                        varServer.save()

            transaction.commit()
        except Tab.DoesNotExist, e:
            msg = _('referred tab %(tab_id)s does not exist.') % {'tab_id': tab_id}

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id, 'igadget': igadget_id}, request, msg)
        except Exception, e:
            transaction.rollback()
            msg = _("igadget varaible cannot be updated: ") + unicode(e)

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id, 'igadget': igadget_id}, request, msg)

        return HttpResponse("<ok>", mimetype='text/xml; charset=UTF-8')


class IGadgetVariable(Resource):

    def read(self, request, workspace_id, tab_id, igadget_id, var_id):
        user = get_user_authentication(request)

        tab = Tab.objects.get(workspace__user__id=user.id, workspace__pk=workspace_id, pk=tab_id)
        variable = get_object_or_404(Variable, igadget__tab=tab, igadget__pk=igadget_id, vardef__pk=var_id)
        var_data = get_variable_data(variable)

        return HttpResponse(json_encode(var_data), mimetype='application/json; charset=UTF-8')

    def create(self, request, workspace_id, tab_id, igadget_id, var_id):
        return self.update(request, workspace_id, tab_id, igadget_id, var_id)

    def update(self, request, workspace_id, tab_id, igadget_id, var_id):
        user = get_user_authentication(request)

        received_json = PUT_parameter(request, 'value')

        # Gets value parameter from request
        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("iGadget JSON expected")), mimetype='application/xml; charset=UTF-8')

        new_value = received_json

        tab = Tab.objects.get(workspace__users__id=user.id, workspace__pk=workspace_id, pk=tab_id)
        variable = get_object_or_404(Variable, igadget__tab=tab, igadget__pk=igadget_id, vardef__pk=var_id)
        try:
            variable.value = new_value
            variable.save()
        except Exception, e:
            transaction.rollback()
            msg = _("igadget varaible cannot be updated: ") + unicode(e)

            raise TracedServerError(e, {'workspace': workspace_id, 'tab': tab_id, 'igadget': igadget_id, 'variable': var_id}, request, msg)

        return HttpResponse('ok')
