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

from django.http import HttpResponse, HttpResponseServerError
from django.core import serializers

from commons.resource import Resource
from commons.logs_exception import TracedServerError
from commons.utils import json_encode

from django.db import transaction

from gadget.views import parseAndCreateGadget
from gadget.models import Gadget
from workspace.models import UserWorkSpace, Tab
from igadget.views import SaveIGadget, deleteIGadget
from igadget.models import IGadget

from commons.custom_decorators import basicauth

class IGadgetCollection(Resource):

    @basicauth()
    @transaction.commit_on_success
    def create(self, request):
        #
        #Get or Create the Gadget in the Showcase
        #
        user_name = request.user.username
        result = parseAndCreateGadget(request, user_name)
        gadget = result["gadget"]
        
        #
        #Instance the iGadget
        #
        
        #get the active Tab and Workspace
        try:
            wsList = UserWorkSpace.objects.filter(user=request.user, active=True)
            activeWS = wsList[0]
        except:
            wsList = UserWorkSpace.objects.filter(user=request.user)
            activeWS = ws[0]
            
        try:
            tabList = Tab.objects.filter(workspace=activeWS, visible=True)
            activeTab = tabList[0]
        except:
            tabList = Tab.objects.filter(workspace=activeWS)
            activeTab = tabList[0]
        
        #instance the Gadget            
        #currentIGadgetsTabURI = "/workspace/" + activeWS.id + "/tab/" + activeTab.id + "/igadgets"
        data = {"left": 0, "top": 0, "icon_left": 0, "icon_top": 0, "zIndex": 0, 
                "width": gadget.width, "height": gadget.height, "name": gadget.name, 
                "menu_color": "FFFFFF", "layout": 0, "gadget": gadget.uri}
        resp = SaveIGadget(data, request.user, activeTab, request)
        
        return HttpResponse(json_encode({"igadget_id":resp["id"], "gadget_id":gadget.id}), mimetype='application/json; charset=UTF-8')

    @basicauth()
    @transaction.commit_on_success
    def delete(self, request, gadget_id):
        gadget = Gadget.objects.get(id=gadget_id)
        
        #userWorkspaces =  UserWorkSpace.objects.filter(user=request.user)
        #userTabs = Tab.objects.filter(workspace__in=userWorkspaces)
        #igadgets = IGadget.objects.filter(gadget=gadget, tab__in=userTabs)
        igadgets = IGadget.objects.filter(gadget=gadget, tab__workspace__users__id=request.user.id)     
        values = []           
        for ig in igadgets:
            values.append(ig.id)
            deleteIGadget(ig, request.user)
        
        return HttpResponse(json_encode({"result":"ok", "deleted_igadgets":values}), mimetype='application/json; charset=UTF-8')
        

class IGadgetEntry(Resource):
    
    @basicauth()
    @transaction.commit_on_success
    def delete(self, request, igadget_id):
        ig = IGadget.objects.get(id=igadget_id, tab__workspace__users__id=request.user.id)
        deleteIGadget(ig, request.user)
        return HttpResponse(json_encode({"result":"ok"}), mimetype='application/json; charset=UTF-8')
    