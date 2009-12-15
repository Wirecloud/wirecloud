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

from django.shortcuts import get_object_or_404, get_list_or_404
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseServerError
from django.core import serializers

from django.utils.translation import ugettext as _
from django.utils import simplejson

from commons.resource import Resource

from django.db import transaction

from commons.authentication import get_user_authentication
from commons.get_data import get_igadget_data, get_variable_data
from commons.logs import log
from commons.utils import get_xml_error, json_encode
from commons.http_utils import PUT_parameter

from gadget.models import Gadget, VariableDef
from workspace.models import Tab, WorkSpace, VariableValue, AbstractVariable
from connectable.models import In, Out
from igadget.models import Position, IGadget, Variable

from gadget.utils import get_or_create_gadget

from commons.logs_exception import TracedServerError

def createConnectable(var):
    #If var is and SLOT or and EVENT, a proper connectable object must be created!
    aspect = var.vardef.aspect
    name = var.vardef.name

    connectable = None

    if (aspect == 'SLOT'):
        connectable = Out(name=name, abstract_variable=var.abstract_variable)
    if (aspect == 'EVEN'):
        connectable = In(name=name, variable=var)

    if (connectable == None):
        return {}

    connectable.save()

    connectableId = {}

    connectableId['id'] = connectable.id
    connectableId['name'] = name

    return connectableId

def addIGadgetVariable(igadget, user, varDef):
    # Sets the default value of variable
    if varDef.default_value:
        var_value = varDef.default_value
    else:
        var_value = ''

     # Creating the Abstract Variable
    abstractVar = AbstractVariable(type="IGADGET", name=varDef.name)
    abstractVar.save()

    # Creating Value for Abstract Variable
    variableValue =  VariableValue (user=user, value=var_value, abstract_variable=abstractVar)
    variableValue.save()

    var = Variable(vardef=varDef, igadget=igadget, abstract_variable=abstractVar)
    var.save()

    #Wiring related vars (SLOT&EVENTS) have implicit connectables!
    connectableId = createConnectable(var)


def SaveIGadget(igadget, user, tab, request):
    gadget_uri = igadget.get('gadget')
    igadget_name = igadget.get('name')
    width = igadget.get('width')
    height = igadget.get('height')
    top = igadget.get('top')
    left = igadget.get('left')
    icon_top = igadget.get('icon_top')
    icon_left = igadget.get('icon_left')
    zIndex = igadget.get('zIndex')
    layout = igadget.get('layout')
    menu_color = igadget.get('menu_color')

    # Creates IGadget position
    position = Position(posX=left, posY=top, posZ=zIndex, height=height, width=width, minimized=False, fulldragboard=False)
    position.save()

    # Creates IGadget icon position
    icon_position = Position(posX=icon_left, posY=icon_top)
    icon_position.save()

    # Creates the new IGadget
    try:
        # Gadget uri does not contain the prefix "/user" yet
        if gadget_uri.startswith("/user") or gadget_uri.startswith("user"):
            gadget_uri_parts = gadget_uri.split("/")
            gadget_uri = "/" + "/".join(gadget_uri_parts[gadget_uri_parts.index("gadgets"):])

        gadget = Gadget.objects.get(uri=gadget_uri, users=user)

        new_igadget = IGadget(name=igadget_name, gadget=gadget, tab=tab, layout=layout, position=position, icon_position=icon_position, transparency=False, menu_color=menu_color)
        new_igadget.save()

        variableDefs = VariableDef.objects.filter(gadget=gadget)
        for varDef in variableDefs:
            addIGadgetVariable(new_igadget, user, varDef)
        
        transaction.commit()

        igadget_data =  serializers.serialize('python', [new_igadget], ensure_ascii=False)

        ids = get_igadget_data(igadget_data[0], user, tab.workspace)

        return ids

    except Gadget.DoesNotExist, e:
        msg = _('referred gadget %(gadget_uri)s does not exist.') % {'gadget_uri': gadget_uri}

        raise TracedServerError(e, {'igadget': igadget, 'user': user, 'tab': tab}, request, msg)

    except VariableDef.DoesNotExist, e:
        #iGadget has no variables. It's normal
        pass

def UpdateIGadget(igadget, user, tab):

    igadget_pk = igadget.get('id')

    # Checks
    ig = get_object_or_404(IGadget, tab=tab, pk=igadget_pk)

    if igadget.has_key('name'):
        name = igadget.get('name')
        ig.name = name

    if igadget.has_key('tab'):
        newtab_id = igadget.get('tab');
        if newtab_id < 0:
            raise Exception(_('Malformed iGadget JSON'))

        if newtab_id != tab.id:
            newtab = Tab.objects.get(workspace__users__id=user.id, workspace__pk=tab.workspace_id, pk=newtab_id)
            ig.tab = newtab

    if igadget.has_key('menu_color'):
        menu_color = igadget.get('menu_color')
        ig.menu_color = menu_color

    if igadget.has_key('layout'):
        layout = igadget.get('layout')
        ig.layout = layout

    if igadget.has_key('transparency'):
        ig.transparency = igadget.get('transparency')

    if igadget.has_key("icon_top") and igadget.has_key("icon_left"):
        icon_position = ig.icon_position
        if icon_position:
            icon_position.posX = igadget.get("icon_left")
            icon_position.posY = igadget.get("icon_top")
        else: #backward compatibility (old gadgets without icon position)
            icon_position = Position(posX=igadget.get("icon_left"), posY=igadget.get("icon_top"))
        icon_position.save()
        ig.icon_position = icon_position

    if igadget.has_key('refused_version'):
        refused_version = igadget.get('refused_version')
        ig.refused_version = refused_version

    ig.save()

    # get IGadget's position
    position = ig.position

    # update the requested attributes
    if igadget.has_key('width'):
        width = igadget.get('width')
        if width <= 0:
            raise Exception(_('Malformed iGadget JSON'))
        position.width = width

    if igadget.has_key('height'):
        height = igadget.get('height')
        if height <= 0:
            raise Exception(_('Malformed iGadget JSON'))
        position.height = height

    if igadget.has_key('top'):
        top = igadget.get('top')
        if top < 0:
            raise Exception(_('Malformed iGadget JSON'))
        position.posY = top

    if igadget.has_key('left'):
        left = igadget.get('left')
        if left < 0:
            raise Exception(_('Malformed iGadget JSON'))
        position.posX = left

    if igadget.has_key('zIndex'):
        zIndex = igadget.get('zIndex')
        if not isinstance(zIndex, int):
            raise Exception(_('Malformed iGadget JSON'))
        position.posZ = zIndex

    if igadget.has_key('minimized'):
        minimized = igadget.get('minimized')
        if not isinstance(minimized, bool) and not isinstance(minimized, int):
            raise Exception(_('Malformed iGadget JSON'))
        position.minimized = minimized

    if igadget.has_key('fulldragboard'):
        fulldragboard = igadget.get('fulldragboard')
        if not isinstance(fulldragboard, bool) and not isinstance(fulldragboard, int):
            raise Exception(_('Malformed iGadget JSON'))
        position.fulldragboard = fulldragboard

    # save the changes
    position.save()

def UpgradeIGadget(igadget, user):
    igadget_pk = igadget.get('id')
    url = igadget.get('newResourceURL')

    # get the iGadget object
    ig = get_object_or_404(IGadget, pk=igadget_pk)
    currentGadget = ig.gadget

    result = get_or_create_gadget(url, user)
    lastGadget = result["gadget"]

    #check equivalency and add the variables needed
    newVariableDefs = VariableDef.objects.filter(gadget=lastGadget)
    equivalentVarDefs = []
    for varDef in newVariableDefs:
        # search for an equivalent variableDef
        equivalentVarDef = VariableDef.objects.filter(name=varDef.name, type=varDef.type, aspect=varDef.aspect, gadget=currentGadget)
        if equivalentVarDef:
            equivalentVarDefs.append(varDef)
            #reassign the variableDef of the Variable
            var = Variable.objects.get(igadget=ig, vardef=equivalentVarDef[0])
            var.vardef = varDef
            var.save()
        else:
            addIGadgetVariable(ig, user, varDef)

    # check if the last version gadget hasn't a super-set of the current version gadget variableDefs
    currentGadgetVarDefs = VariableDef.objects.filter(gadget=currentGadget)
    if len(currentGadgetVarDefs) > len(equivalentVarDefs):
        #some of the current version gadget variableDefs aren't in the last version gadget
        raise Exception("The gadget cannot be automatically updated because it is incompatible with the last version.")     

    ig.gadget = lastGadget
    ig.save()

def deleteIGadget(igadget, user):

    # Delete all IGadget's variables
    variables = Variable.objects.filter(igadget=igadget)
    for var in variables:
        if (var.vardef.aspect == "SLOT"):
            Out.objects.get(abstract_variable=var.abstract_variable).delete()

        if (var.vardef.aspect == "EVEN"):
            In.objects.get(variable=var).delete()

        #Deleting variable value
        VariableValue.objects.get(abstract_variable=var.abstract_variable, user=user).delete()

        var.abstract_variable.delete()
        var.delete()

    # Delete IGadget and its position
    position = igadget.position
    position.delete()
    igadget.delete()

class IGadgetCollection(Resource):
    def read(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)

        workspace = get_object_or_404(WorkSpace, id=workspace_id)

        data_list = {}
        igadget = IGadget.objects.filter(tab__workspace__users__id=user.id, tab__workspace__pk=workspace_id, tab__pk=tab_id)
        data = serializers.serialize('python', igadget, ensure_ascii=False)
        data_list['iGadgets'] = [get_igadget_data(d, user, workspace) for d in  data]

        return HttpResponse(json_encode(data_list), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def create(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)

        if not request.POST.has_key('igadget'):
            return HttpResponseBadRequest(get_xml_error(_("iGadget JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            received_json = request.POST['igadget']
            igadget = simplejson.loads(received_json)
            tab = Tab.objects.get(workspace__users__id=user.id, workspace__pk=workspace_id, pk=tab_id) 
            ids = SaveIGadget(igadget, user, tab, request)

            return HttpResponse(json_encode(ids), mimetype='application/json; charset=UTF-8')
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

        igadget = get_list_or_404(IGadget, tab__workspace__users__id=user.id, tab__workspace__pk=workspace_id, tab__pk=tab_id, pk=igadget_id)
        data = serializers.serialize('python', igadget, ensure_ascii=False)
        igadget_data = get_igadget_data(data[0], user, workspace)

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

        received_json = PUT_parameter(request, 'igadget')

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("iGadget JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            igadget = simplejson.loads(received_json) 
            UpgradeIGadget(igadget, user)

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
        data = serializers.serialize('python', variables, ensure_ascii=False)
        vars_data = [get_variable_data(d) for d in data]

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
        variable = get_list_or_404(Variable, igadget__tab=tab, igadget__pk=igadget_id, vardef__pk=var_id)
        data = serializers.serialize('python', variable, ensure_ascii=False)
        var_data = get_variable_data(data[0])

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
