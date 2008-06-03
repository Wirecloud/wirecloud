# -*- coding: utf-8 -*-

# MORFEO Project 
# http://morfeo-project.org 
# 
# Component: EzWeb
# 
# (C) Copyright 2004 Telefónica Investigación y Desarrollo 
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
from django.shortcuts import get_object_or_404, get_list_or_404
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseServerError
from django.core import serializers

from django.utils.translation import ugettext as _

from django_restapi.resource import Resource

from django.db import transaction

from commons.authentication import get_user_authentication
from commons.get_data import *
from commons.logs import log
from commons.utils import get_xml_error, json_encode

from connectable.models import Out
from igadget.models import Variable

from workspace.models import AbstractVariable, WorkSpaceVariable, Tab, WorkSpace
from commons.get_data import get_workspace_data, get_global_workspace_data, get_tab_data, get_workspace_variable_data
from igadget.models import IGadget
from igadget.views import deleteIGadget

def deleteTab (tab):
    
    #Deleting igadgets
    igadgets = IGadget.objects.filter(tab=tab)
    for igadget in igadgets:
        deleteIGadget(igadget)
        
    #Deleting OUT connectable (wTab)
    Out.objects.get(abstract_variable = tab.abstract_variable).delete();
    
    #Deleting workspace variable
    WorkSpaceVariable.objects.get(abstract_variable=tab.abstract_variable).delete();
    
    #Deleting abstract variable
    tab.abstract_variable.delete()
    
    #Deleting tab
    tab.delete()

def createTab (tab_name, user,  workspace):
    # Creating Entry in AbstractVariable table for polimorphic access from Connectable hierarchy
    abstractVariable =  AbstractVariable (name=tab_name, type='WORKSPACE')
    abstractVariable.save()
    
    # Creating implicit workspace variable    
    wsVariable = WorkSpaceVariable (workspace=workspace, aspect='TAB', abstract_variable=abstractVariable)
    wsVariable.save()
    
    #Creating implicit OUT Connectable element
    connectableName = 'tab_' + tab_name;
    connectable = Out(name=connectableName, abstract_variable=abstractVariable)
    connectable.save()
    
    # Creating tab
    tab = Tab (name=tab_name, visible=False, workspace=workspace, abstract_variable=abstractVariable)
    tab.save()
    
    setVisibleTab(user, workspace.pk, tab)
    
    # Returning created Ids
    ids = {}
    
    ids['id'] = tab.id
    ids['name'] = tab.name

    data = serializers.serialize('python', [wsVariable], ensure_ascii=False)
    ids['workspaceVariables'] = [get_workspace_variable_data(d) for d in data]
    
    return ids

def setVisibleTab(user, workspace_id, tab):
    visibleTabs = Tab.objects.filter(workspace__user=user, workspace__pk=workspace_id, visible=True).exclude(pk=tab.pk)
    for visibleTab in visibleTabs:
        visibleTab.visible = False
        visibleTab.save()
        
    tab.visible = True
    tab.save()
   
def createWorkSpace (workSpaceName, user):
    #Workspace creation
    workspace = WorkSpace(name=workSpaceName, active=False, user=user)
    workspace.save()
    
    setActiveWorkspace(user, workspace)
    
    #Tab creation
    tab_ids = createTab ('MyTab', user, workspace)
    
    # Returning created Ids
    ids = {}
    
    ids['workspace'] = {}
    
    ids['workspace']['id'] = workspace.id
    ids['workspace']['name'] = workspace.name
    
    ids['workspace']['tab'] = tab_ids

    return ids


def setActiveWorkspace(user, workspace):
    activeWorkSpaces = WorkSpace.objects.filter(user=user, active=True).exclude(pk=workspace.pk)
    for activeWorkSpace in activeWorkSpaces:
        activeWorkSpace.active = False
        activeWorkSpace.save()
        
    workspace.active = True
    
    workspace.save()

class WorkSpaceCollection(Resource):
    def read(self, request):
        user = get_user_authentication(request)
        
        data_list = {}
        try:
            workspaces = WorkSpace.objects.filter(user=user)
            if workspaces.count()==0:
                createWorkSpace('MyWorkSpace', user)
                
                workspaces = WorkSpace.objects.filter(user=user)
        except Exception, e:
            return HttpResponseBadRequest(get_xml_error(unicode(e)), mimetype='application/xml; charset=UTF-8')
            
        data = serializers.serialize('python', workspaces, ensure_ascii=False)
        data_list['workspaces'] = [get_workspace_data(d) for d in  data]

        return HttpResponse(json_encode(data_list), mimetype='application/json; charset=UTF-8')
    
    @transaction.commit_on_success
    def create(self, request):
        user = get_user_authentication(request)

        if not request.has_key('workspace'):
            return HttpResponseBadRequest(get_xml_error(_("workspace JSON expected")), mimetype='application/xml; charset=UTF-8')

        #TODO we can make this with deserializers (simplejson)
        received_json = request.POST['workspace']

        try:
            ts = eval(received_json)
            
            if not ts.has_key('name'):
                raise Exception(_('Malformed workspace JSON: expecting workspace uri.'))
            
            workspace_name = ts.get('name')

            ids = createWorkSpace (workspace_name, user)          
            
            workspaces = get_list_or_404(WorkSpace, user=user, pk=ids['workspace']['id'])
            data = serializers.serialize('python', workspaces, ensure_ascii=False)
            
            
            concept_data = {}
            concept_data['user'] = user
            workspace_data = get_global_workspace_data(data[0], workspaces[0], concept_data)
            
            return HttpResponse(json_encode(workspace_data), mimetype='application/json; charset=UTF-8')
            
        except Exception, e:
            transaction.rollback()
            msg = _("workspace cannot be created: ") + unicode(e)
            log(msg, request)
            return HttpResponseServerError(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')


class WorkSpaceEntry(Resource):
    def read(self, request, workspace_id):
        user = get_user_authentication(request)
        
        workspaces = get_list_or_404(WorkSpace, user=user, pk=workspace_id)
        data = serializers.serialize('python', workspaces, ensure_ascii=False)
        concept_data = {}
        concept_data['user'] = user
        workspace_data = get_global_workspace_data(data[0], workspaces[0], concept_data)
        
        return HttpResponse(json_encode(workspace_data), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def update(self, request, workspace_id):
        user = get_user_authentication(request)

        if not request.PUT.has_key('workspace'):
            return HttpResponseBadRequest(get_xml_error(_("workspace JSON expected")), mimetype='application/xml; charset=UTF-8')

        #TODO we can make this with deserializers (simplejson)
        received_json = request.PUT['workspace']

        try:
            ts = eval(received_json)
            workspace = WorkSpace.objects.get(user=user, pk=workspace_id)
            
            if ts.has_key('active'):
                active = ts.get('active')
                if (active == 'true'):
                    #Only one active workspace
                    setActiveWorkspace(user, workspace)
                else:
                    workspace.active = False
                    
            if ts.has_key('name'):
                workspace.name = ts.get('name')
                
            workspace.save()
            
            return HttpResponse('ok')
        except Exception, e:
            transaction.rollback()
            msg = _("workspace cannot be updated: ") + unicode(e)
            log(msg, request)
            return HttpResponseServerError(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')


    @transaction.commit_on_success
    def delete(self, request, workspace_id):
        user = get_user_authentication(request)
        
        workspaces = WorkSpace.objects.filter(user=user).exclude(pk=workspace_id)
        
        if workspaces.count()==0:
            msg = _("workspace cannot be deleted")
            log(msg, request)
            return HttpResponseServerError(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')
            
        # Gets Igadget, if it does not exist, a http 404 error is returned
        workspace = get_object_or_404(WorkSpace, user=user, pk=workspace_id)
        
        workspace.delete()
        #set a new active workspace (first workspace by default)
        activeWorkspace=workspaces[0]
        setActiveWorkspace(user, activeWorkspace)
        return HttpResponse('ok')
    
    
class TabCollection(Resource):
    @transaction.commit_on_success
    def create(self, request, workspace_id):
        user = get_user_authentication(request)

        if not request.has_key('tab'):
            return HttpResponseBadRequest(get_xml_error(_("tab JSON expected")), mimetype='application/xml; charset=UTF-8')

        #TODO we can make this with deserializers (simplejson)
        received_json = request.POST['tab']    

        try:
            t = eval(received_json)
            
            if not t.has_key('name'):
                raise Exception(_('Malformed tab JSON: expecting tab name.'))
            
            tab_name = t.get('name')
            workspace = WorkSpace.objects.get(user=user, pk=workspace_id)   
            
            ids = createTab(tab_name, user, workspace)
            
            return HttpResponse(json_encode(ids), mimetype='application/json; charset=UTF-8')

        except Exception, e:
            transaction.rollback()
            msg = _("tab cannot be created: ") + unicode(e)
            log(msg, request)
            return HttpResponseServerError(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')

    

class TabEntry(Resource):
    def read(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)
        
        tab = get_list_or_404(Tab, workspace__user=user, workspace__pk=workspace_id, pk=tab_id)
        data = serializers.serialize('python', tab, ensure_ascii=False)
        tab_data = get_tab_data(data[0])
        
        return HttpResponse(json_encode(tab_data), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def update(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)

        if not request.PUT.has_key('tab'):
            return HttpResponseBadRequest(get_xml_error(_("tab JSON expected")), mimetype='application/xml; charset=UTF-8')

        #TODO we can make this with deserializers (simplejson)
        received_json = request.PUT['tab']

        try:
            t = eval(received_json)
            tab = Tab.objects.get(workspace__user=user, workspace__pk=workspace_id, pk=tab_id)
            
            if t.has_key('visible'):
                visible = t.get('visible')
                if (visible == 'true'):
                    #Only one visible tab
                    setVisibleTab(user, workspace_id, tab)
                else:
                    tab.visible = False
            
            if t.has_key('name'):
                tab.name = t.get('name')
      
            tab.save()
            
            return HttpResponse('ok')
        except Exception, e:
            transaction.rollback()
            msg = _("tab cannot be updated: ") + unicode(e)
            log(msg, request)
            return HttpResponseServerError(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')

    @transaction.commit_on_success
    def delete(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)
        
        tabs = Tab.objects.filter(workspace__pk=workspace_id).exclude(pk=tab_id)
        
        if tabs.count()==0:
            msg = _("tab cannot be deleted")
            log(msg, request)
            return HttpResponseServerError(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')

        # Gets Igadget, if it does not exist, a http 404 error is returned
        tab = get_object_or_404(Tab, workspace__pk=workspace_id, pk=tab_id)
        
        #Delete WorkSpace variables too!
        deleteTab(tab)
        
        #set a new visible tab (first tab by default)
        activeTab=tabs[0]
        setVisibleTab(user, workspace_id, activeTab)

        return HttpResponse('ok')


class WorkSpaceVariableCollection(Resource):
    
    @transaction.commit_on_success
    def update(self, request, workspace_id):  
        user = get_user_authentication(request)

        if not request.PUT.has_key('variables'):
            return HttpResponseBadRequest(get_xml_error(_("variables JSON expected")), mimetype='application/xml; charset=UTF-8')

        #TODO we can make this with deserializers (simplejson)
        received_json = request.PUT['variables']

        try:
            variables = eval(received_json)
                    
            igadgetVariables = variables['igadgetVars']
            workSpaceVariables = variables['workspaceVars']
            
            for wsVar in workSpaceVariables:
                wsVarDAO = WorkSpaceVariable.objects.get(pk=wsVar['id'])
                   
                wsVarDAO.abstract_variable.value=wsVar['value'];
                wsVarDAO.abstract_variable.save();   
               
            for igVar in igadgetVariables:
                igVarDAO = Variable.objects.get(pk=igVar['id'])
   
                igVarDAO.abstract_variable.value=igVar['value'];
                igVarDAO.abstract_variable.save(); 
            
            return HttpResponse(str('OK'))
        except Exception, e:
            transaction.rollback()
            msg = _("cannot update variables: ") + unicode(e)
            log(msg, request)
            return HttpResponseServerError(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')

class WorkSpaceChannelCollection(Resource):
    def read(self, request, workspace_id):
        user = get_user_authentication(request)
        
        workspaces = get_list_or_404(WorkSpace, user=user, pk=workspace_id)
        data = serializers.serialize('python', workspaces, ensure_ascii=False)
        variable_data = get_workspace_channels_data(workspaces[0])
        
        return HttpResponse(json_encode(variable_data), mimetype='application/json; charset=UTF-8')
