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

from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseServerError
from django.utils.translation import ugettext as _

from commons.resource import Resource
from commons.utils import json_encode

from django.db import transaction

from gadget.views import parseAndCreateGadget
from gadget.models import Gadget
from workspace.models import UserWorkSpace, Tab
from igadget.views import SaveIGadget, deleteIGadget
from igadget.models import IGadget

from commons.custom_decorators import basicauth_or_logged_in


# gets the user who is object of the action and checks that the request's user
# has perms to do the action
def getTargetUser(request_user, user_param):
    if not user_param:
        return request_user
    
    if request_user.is_superuser:
        from django.contrib.auth.models import User
        try:
            return User.objects.get(username=user_param)
        except User.DoesNotExist:
            raise Exception(_("The user %(user_name)s does not exist") % {'user_name' : user_param})

    raise Exception(_("You are not allowed to add gadgets to %(user_name)s's workspace") % {'user_name' : user_param})


class IGadgetCollection(Resource):

    @basicauth_or_logged_in()
    @transaction.commit_on_success
    def create(self, request, user_name=None):
        if not request.POST.has_key('template_uri'):
            msg = _("Missing template URL parameter")
            json = json_encode({"message":msg, "result":"error"})
            return HttpResponseBadRequest(json, mimetype='application/json; charset=UTF-8')
        
        #
        #Get or Create the Gadget in the Showcase
        #
        
        # Get the user whose active workspace will have a new gadget
        # either the user stored in the request or the parameter of the URL 
        try:
            user = getTargetUser(request.user, user_name)
        except Exception, e:
            json = json_encode({"message":str(e), "result":"error"})
            return HttpResponseServerError(json, mimetype='application/json; charset=UTF-8')
                    
        #
        #Instance the iGadget
        #
        
        #get the active Tab and Workspace
        try:
            wsList = UserWorkSpace.objects.filter(user=user, active=True)
            activeWS = wsList[0]
        except:
            wsList = UserWorkSpace.objects.filter(user=user)
            activeWS = wsList[0]
            
        try:
            tabList = Tab.objects.filter(workspace=activeWS, visible=True)
            activeTab = tabList[0]
        except:
            tabList = Tab.objects.filter(workspace=activeWS)
            activeTab = tabList[0]

        result = parseAndCreateGadget(request, user, activeWS.id)
        gadget = result["gadget"]
            
        # Get the iGadget name
        igadget_name = gadget.name
        if request.POST.has_key('igadget_name'):
            igadget_name = request.POST['igadget_name']
        
        #instance the Gadget            
        #currentIGadgetsTabURI = "/workspace/" + activeWS.id + "/tab/" + activeTab.id + "/igadgets"
        data = {"left": 0, "top": 0, "icon_left": 0, "icon_top": 0, "zIndex": 0, 
                "width": gadget.width, "height": gadget.height, "name": igadget_name, 
                "menu_color": "FFFFFF", "layout": 0, "gadget": gadget.uri}
        resp = SaveIGadget(data, user, activeTab, request)
        
        return HttpResponse(json_encode({"igadget_id":resp["id"], "gadget_id":gadget.id}), mimetype='application/json; charset=UTF-8')

    @basicauth_or_logged_in()
    @transaction.commit_on_success
    def delete(self, request, gadget_id, user_name=None):
        
        # Get the target user, either the user stored in the request or the parameter of the URL 
        try:
            user = getTargetUser(request.user, user_name)
        except Exception, e:
            json = json_encode({"message":str(e), "result":"error"})
            return HttpResponseServerError(json, mimetype='application/json; charset=UTF-8')
        
        gadget = Gadget.objects.get(id=gadget_id)
        
        #userWorkspaces =  UserWorkSpace.objects.filter(user=request.user)
        #userTabs = Tab.objects.filter(workspace__in=userWorkspaces)
        #igadgets = IGadget.objects.filter(gadget=gadget, tab__in=userTabs)
        igadgets = IGadget.objects.filter(gadget=gadget, tab__workspace__users__id=user.id)     
        values = []           
        for ig in igadgets:
            values.append(ig.id)
            deleteIGadget(ig, user)
        
        return HttpResponse(json_encode({"result":"ok", "deleted_igadgets":values}), mimetype='application/json; charset=UTF-8')
        

class IGadgetEntry(Resource):
    
    @basicauth_or_logged_in()
    @transaction.commit_on_success
    def delete(self, request, igadget_id, user_name=None):
        
        # Get the target user, either the user stored in the request or the parameter of the URL 
        try:
            user = getTargetUser(request.user, user_name)
        except Exception, e:
            json = json_encode({"message":str(e), "result":"error"})
            return HttpResponseServerError(json, mimetype='application/json; charset=UTF-8')       
        
        ig = IGadget.objects.get(id=igadget_id, tab__workspace__users__id=user.id)
        deleteIGadget(ig, user)
        return HttpResponse(json_encode({"result":"ok"}), mimetype='application/json; charset=UTF-8')
    