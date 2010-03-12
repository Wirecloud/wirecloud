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

from django.db import transaction, IntegrityError

from django.contrib.auth.models import Group, User
from commons.authentication import get_user_authentication, get_public_user, logout_request, relogin_after_public
from commons.get_data import *
from commons.logs import log
from commons.utils import get_xml_error, json_encode
from commons.http_utils import PUT_parameter, download_http_content
from connectable.models import Out
from igadget.models import Variable

from commons.get_data import get_workspace_data, get_global_workspace_data, get_tab_data, get_workspace_variable_data

from workspace.models import AbstractVariable, WorkSpaceVariable, Tab, WorkSpace, UserWorkSpace, VariableValue, PublishedWorkSpace, Category
from gadget.models import Gadget, VariableDef
from igadget.models import IGadget, Position

from igadget.views import deleteIGadget

from packageCloner import PackageCloner
from packageLinker import PackageLinker
from mashupTemplateGenerator import TemplateGenerator

from os import path

from django.conf import settings

from commons.logs_exception import TracedServerError

def get_user_gadgets(user):
    workspaces = WorkSpace.objects.filter(users=user)
    
    gadgets = []
    for workspace in workspaces:
        ws_gadgets = get_workspace_gadgets(workspace)
        
        for gadget in ws_gadgets:
            gadgets.append(gadget)
    
    return gadgets

def get_workspace_gadgets(workspace):
    ws_igadgets = IGadget.objects.filter(tab__workspace=workspace)
    
    ws_gadgets = []
    for igadget in ws_igadgets:
        ws_gadgets.append(igadget.gadget)
        
    return ws_gadgets
    

def get_mashup_gadgets(mashup_id):
    
    published_workspace = get_object_or_404(PublishedWorkSpace, id=mashup_id)
        
    return [i.gadget for i in IGadget.objects.filter(tab__workspace=published_workspace.workspace)]

def clone_original_variable_value(abstract_variable, creator, new_user):
    try:
        original_var_value = VariableValue.objects.get(abstract_variable=abstract_variable, user=creator)
        
        #Cloned using new way (even cloning Variablevalues)
        new_var_value = original_var_value.clone_variable_value(new_user)
    except VariableValue.DoesNotExist:
        #This VariableValue should exist. 
        #However, published workspaces cloned in the old-fashioned way don't have the VariableValue of the creator variable!
        #Managing everything with AbstractVariable's default value, VariableValue it's unavailable!
        new_var_value = abstract_variable.get_default_value() 
    
    return new_var_value

def get_workspace_description(workspace):    
    included_igadgets = IGadget.objects.filter(tab__workspace=workspace)
    
    return get_igadgets_description(included_igadgets)

def get_igadgets_description(included_igadgets):
    description = "EzWeb Mashup composed of: "
        
    for igadget in included_igadgets:    
        description += igadget.gadget.name + ' , '
    
    return description[:-2]

def deleteTab (tab, user):
    #Deleting igadgets
    igadgets = IGadget.objects.filter(tab=tab)
    for igadget in igadgets:
        deleteIGadget(igadget, user)
        
    #Deleting OUT connectable (wTab)
    Out.objects.get(abstract_variable = tab.abstract_variable).delete();
    
    #Deleting workspace variable
    WorkSpaceVariable.objects.get(abstract_variable=tab.abstract_variable).delete();
    
    #Deleting abstract variable
    VariableValue.objects.get(abstract_variable=tab.abstract_variable, user=user).delete();
    tab.abstract_variable.delete()
    
    #Deleting tab
    tab.delete()

def createTab (tab_name, user,  workspace):
    # Creating Entry in AbstractVariable table for polimorphic access from Connectable hierarchy
    abstractVariable =  AbstractVariable (name=tab_name, type='WORKSPACE')
    abstractVariable.save()
    
    # Creating Value for Abstract Variable
    variableValue =  VariableValue (user=user, value="", abstract_variable=abstractVariable)
    variableValue.save()
    
    # Creating implicit workspace variable    
    wsVariable = WorkSpaceVariable (workspace=workspace, aspect='TAB', abstract_variable=abstractVariable)
    wsVariable.save()
    
    #Creating implicit OUT Connectable element
    connectableName = 'tab_' + tab_name;
    connectable = Out(name=connectableName, abstract_variable=abstractVariable)
    connectable.save()
    
    visible = False
    tabs = Tab.objects.filter(workspace=workspace, visible=True)
    if tabs.count()==0:
        visible = True
    
    #it's always the last tab
    position = Tab.objects.filter(workspace=workspace).count()
    
    # Creating tab
    tab = Tab (name=tab_name, visible=visible, position=position, workspace=workspace, abstract_variable=abstractVariable)
    tab.save()
    
    # Returning created Ids
    ids = {}
    
    ids['id'] = tab.id
    ids['name'] = tab.name

    data = serializers.serialize('python', [wsVariable], ensure_ascii=False)
    ids['workspaceVariables'] = [get_workspace_variable_data(d, user, workspace) for d in data]
    
    return ids

def setVisibleTab(user, workspace_id, tab):
    visibleTabs = Tab.objects.filter(workspace__users__id=user.id, workspace__pk=workspace_id, visible=True).exclude(pk=tab.pk)
    for visibleTab in visibleTabs:
        visibleTab.visible = False
        visibleTab.save()
        
    tab.visible = True
    tab.save()
   
def createWorkSpace (workSpaceName, user):
    active = False
    workspaces = UserWorkSpace.objects.filter(user__id=user.id, active=True)
    if workspaces.count()==0:
        # there isn't yet an active workspace
        active = True
        
    #Workspace creation
    workspace = WorkSpace(name=workSpaceName, creator=user)
    workspace.save()
    
    #Adding user reference to workspace in the many to many relationship
    user_workspace = UserWorkSpace(user=user, workspace=workspace, active=active)
    user_workspace.save()
   
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
    activeUserWorkSpaces = UserWorkSpace.objects.filter(user__id=user.id, active=True).exclude(workspace__pk=workspace.pk)
    for activeUserWorkSpace in activeUserWorkSpaces:
        activeUserWorkSpace.active = False
        activeUserWorkSpace.save()
    
    currentUserWorkspace = UserWorkSpace.objects.get(workspace=workspace, user=user)    
    currentUserWorkspace.active = True
    
    currentUserWorkspace.save()
    
def cloneWorkspace(workspace_id, user):

    published_workspace = get_object_or_404(PublishedWorkSpace, id=workspace_id)
    
    workspace = published_workspace.workspace
    
    packageCloner = PackageCloner()
    
    cloned_workspace = packageCloner.clone_tuple(workspace)
    
    cloned_workspace.creator = user
    
    cloned_workspace.save()
    
    return cloned_workspace

def linkWorkspaceObject(user, workspace, creator, link_variable_values=True):               
    packageLinker = PackageLinker()
    
    packageLinker.link_workspace(workspace, user, creator, link_variable_values)
    
def linkWorkspace(user, workspace_id, creator, link_variable_values=True):         
    workspace = get_object_or_404(WorkSpace, id=workspace_id)
            
    linkWorkspaceObject(user, workspace, creator, link_variable_values)

        
class WorkSpaceCollection(Resource):
    @transaction.commit_on_success
    def read(self, request):
        user = get_user_authentication(request)
        
        data_list = {}
        #boolean for js
        data_list['isDefault']="false"
        try:
        	#user workspaces
            workspaces = WorkSpace.objects.filter(users__id=user.id)
            
            #workspaces assigned to the user's organizations
            organizations = user.groups.all()
            wsGivenByUserOrgs = []
            for org in organizations:
                wsGivenByUserOrgs += list(WorkSpace.objects.filter(targetOrganizations = org))
            
            for ws in wsGivenByUserOrgs:
                try:
                    workspaces.get(id=ws.id)
                except WorkSpace.DoesNotExist:
                    #the user doesn't have this workspace (which is assigned to his organizations)
                    #duplicate the workspace for the user
                    linkWorkspace(user, ws.id, ws.get_creator())
                    
                    #set that the showcase will have to be reloaded
                    #because this workspace is new for the user
                    data_list['isDefault']="true"                    
            
            if data_list['isDefault'] == "false" and workspaces.count() == 0:   #There is no workspace for the user
                cloned_workspace = None
                #it's the first time the user has logged in.
                #try to assign a default workspace according to user category
                if hasattr(settings, 'AUTHENTICATION_SERVER_URL'):
                    #ask PBUMS for the category
                    try:
                        url = settings.AUTHENTICATION_SERVER_URL + '/api/user/' + user.username + '/categories.json'
                        params = None
                        if request.user:
                            params = {'username': request.user.username}
                        received_json = download_http_content(url, params=params)
                        categories = simplejson.loads(received_json)['category_list']
                        if len(categories) > 0:
                            #take the first one which has a default workspace
                            for category in categories:
                                try:
                                    default_workspace = Category.objects.get(category_id=category['id']).default_workspace
                                    #duplicate the workspace for the user
                                    cloned_workspace = cloneWorkspace(default_workspace.id, user)
                                    linkWorkspace(user, cloned_workspace.id, default_workspace.workspace.get_creator())
                                    setActiveWorkspace(user, cloned_workspace)
                                    data_list['isDefault']="true"
                                    break
                                except Category.DoesNotExist:
                                    #the user category doesn't have a default workspace
                                    #try with other categories
                                    continue
                    except Exception, e:
                        pass
                if not cloned_workspace:
                    #create an empty workspace
                    createWorkSpace('MyWorkSpace', user)
            #Now we can fetch all the workspaces of an user
            workspaces = WorkSpace.objects.filter(users__id=user.id)
            
            if UserWorkSpace.objects.filter(user__id=user.id, active=True).count() == 0: #if there is no active workspace
                #set the first workspace as active
                setActiveWorkspace(user, workspaces.all()[0])
                    
        except Exception, e:
            msg = _("error reading workspace: ") + unicode(e)
            
            raise TracedServerError(e, "bad creation of default workspaces", request, msg)
        
        data = serializers.serialize('python', workspaces, ensure_ascii=False)
        workspace_list = []
        
        for i in range(len(workspaces)):
            workspace_list.append(get_workspace_data(data[i], user, workspaces[i]))
            
        data_list['workspaces'] = workspace_list

        return HttpResponse(json_encode(data_list), mimetype='application/json; charset=UTF-8')
    
    @transaction.commit_on_success
    def create(self, request):
        user = get_user_authentication(request)

        if not request.POST.has_key('workspace'):
            return HttpResponseBadRequest(get_xml_error(_("workspace JSON expected")), mimetype='application/xml; charset=UTF-8')

        #TODO we can make this with deserializers (simplejson)
        received_json = request.POST['workspace']

        try:
            ts = simplejson.loads(received_json)
            
            if not ts.has_key('name'):
                raise Exception(_('Malformed workspace JSON: expecting workspace uri.'))
            
            workspace_name = ts.get('name')

            ids = createWorkSpace (workspace_name, user)          
            
            workspaces = get_list_or_404(WorkSpace, users__id=user.id, pk=ids['workspace']['id'])
            data = serializers.serialize('python', workspaces, ensure_ascii=False)
            
            
            concept_data = {}
            concept_data['user'] = user
            workspace_data = get_global_workspace_data(data[0], workspaces[0], concept_data, user)
            
            return HttpResponse(json_encode(workspace_data), mimetype='application/json; charset=UTF-8')
            
        except Exception, e:
            transaction.rollback()
            msg = _("workspace cannot be created: ") + unicode(e)
            
            raise TracedServerError(e, ts, request, msg)


class WorkSpaceEntry(Resource):
    @transaction.commit_on_success
    def read(self, request, workspace_id, last_user=''):
        #last_user : last_user_after_public autologin
        user = get_user_authentication(request)
        
        workspaces = get_list_or_404(WorkSpace, users__id=user.id, pk=workspace_id)
        data = serializers.serialize('python', workspaces, ensure_ascii=False)
        concept_data = {}
        concept_data['user'] = user
        workspace_data = get_global_workspace_data(data[0], workspaces[0], concept_data, user)
        
        #Closing session after downloading public user workspace        
        if (user.username == 'public' and last_user and last_user != 'public' and last_user != ''):
            logout_request(request)
            request.user = relogin_after_public(request, last_user, None)
        
        return HttpResponse(json_encode(workspace_data), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def update(self, request, workspace_id, last_user=''):
        user = get_user_authentication(request)

        received_json = PUT_parameter(request, 'workspace')

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("workspace JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            ts = simplejson.loads(received_json)
            workspace = WorkSpace.objects.get(users__id=user.id, pk=workspace_id)
            
            if ts.has_key('active'):
                active = ts.get('active')
                if (active == 'true'):
                    #Only one active workspace
                    setActiveWorkspace(user, workspace)
                else:
                    currentUserWorkspace = UserWorkSpace.objects.get(workspace=workspace, user=user)    
                    currentUserWorkspace.active = True
                    currentUserWorkspace.save()
            
            if ts.has_key('name'):
                workspace.name = ts.get('name')
            
            workspace.save()
            
            return HttpResponse('ok')
        except Exception, e:
            transaction.rollback()
            msg = _("workspace cannot be updated: ") + unicode(e)

            raise TracedServerError(e, ts, request, msg)


    @transaction.commit_on_success
    def delete(self, request, workspace_id, last_user=''):
        user = get_user_authentication(request)
        
        workspaces = WorkSpace.objects.filter(users__id=user.id).exclude(pk=workspace_id)
        
        if workspaces.count()==0:
            msg = _("workspace cannot be deleted")
            
            raise TracedServerError(e, {'workspace': workspace_id}, request, msg)
            
        # Gets Igadget, if it does not exist, a http 404 error is returned
        workspace = get_object_or_404(WorkSpace, users__id=user.id, pk=workspace_id)
        
        workspace.delete()
        #set a new active workspace (first workspace by default)
        activeWorkspace=workspaces[0]
        setActiveWorkspace(user, activeWorkspace)
        
        return HttpResponse('ok')


class TabCollection(Resource):
    @transaction.commit_on_success
    def create(self, request, workspace_id):
        user = get_user_authentication(request)

        if not request.POST.has_key('tab'):
            return HttpResponseBadRequest(get_xml_error(_("tab JSON expected")), mimetype='application/xml; charset=UTF-8')

        #TODO we can make this with deserializers (simplejson)
        received_json = request.POST['tab']

        try:
            t = simplejson.loads(received_json)
            
            if not t.has_key('name'):
                raise Exception(_('Malformed tab JSON: expecting tab name.'))
            
            tab_name = t.get('name')
            workspace = WorkSpace.objects.get(users__id=user.id, pk=workspace_id)   
            
            ids = createTab(tab_name, user, workspace)
            
            return HttpResponse(json_encode(ids), mimetype='application/json; charset=UTF-8')

        except Exception, e:
            transaction.rollback()
            msg = _("tab cannot be created: ") + unicode(e)
            
            raise TracedServerError(e, t, request, msg)
        
    @transaction.commit_on_success
    def update(self, request, workspace_id):
        user = get_user_authentication(request)

        received_json = PUT_parameter(request, 'order')
        try:
            order = simplejson.loads(received_json)
            
            tabs = Tab.objects.filter(id__in=order)
            
            for tab in tabs:
                tab.position = order.index(tab.id)
                tab.save()
        
            return HttpResponse('ok')
    
        except Exception, e:
            transaction.rollback()
            msg = _("tab order cannot be updated: ") + unicode(e)
            
            raise TracedServerError(e, t, request, msg)
                
        


class TabEntry(Resource):
    def read(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)
        
        tab = get_list_or_404(Tab, workspace__users__id=user.id, workspace__pk=workspace_id, pk=tab_id)
        data = serializers.serialize('python', tab, ensure_ascii=False)
        tab_data = get_tab_data(data[0])
        
        return HttpResponse(json_encode(tab_data), mimetype='application/json; charset=UTF-8')

    @transaction.commit_on_success
    def update(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)
        
        received_json = PUT_parameter(request, 'tab')

        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("tab JSON expected")), mimetype='application/xml; charset=UTF-8')

        try:
            t = simplejson.loads(received_json)
            tab = Tab.objects.get(workspace__users__id=user.id, workspace__pk=workspace_id, pk=tab_id)
            
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
            
            raise TracedServerError(e, t, request, msg)

    @transaction.commit_on_success
    def delete(self, request, workspace_id, tab_id):
        user = get_user_authentication(request)
        
        #set new order
        tabs = Tab.objects.filter(workspace__pk=workspace_id).order_by('position')

        # Get tab, if it does not exist, an http 404 error is returned
        tab = get_object_or_404(Tab, workspace__pk=workspace_id, pk=tab_id)
        
        #decrease the position of the following tabs
        for t in range(tab.position, tabs.count()):
            tabs[t].position = tabs[t].position - 1
        
        tabs = tabs.exclude(pk=tab_id)
        
        if tabs.count()==0:
            msg = _("tab cannot be deleted")
            log(msg, request)
            return HttpResponseServerError(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')

        #Delete WorkSpace variables too!
        deleteTab(tab, user) 
        
        #set a new visible tab (first tab by default)
        activeTab=tabs[0]
        setVisibleTab(user, workspace_id, activeTab)

        return HttpResponse('ok')


class WorkSpaceVariableCollection(Resource):
    
    @transaction.commit_on_success
    def update(self, request, workspace_id):
        user = get_user_authentication(request)
        
        received_json = PUT_parameter(request, 'variables')
        
        if not received_json:
            return HttpResponseBadRequest(get_xml_error(_("variables JSON expected")), mimetype='application/xml; charset=UTF-8')
        
        try:
            variables = simplejson.loads(received_json)
            
            igadgetVariables = variables['igadgetVars']
            workSpaceVariables = variables['workspaceVars']
            
            for wsVar in workSpaceVariables:
                wsVarDAO = WorkSpaceVariable.objects.get(pk=wsVar['id'])
                
                variable_value = VariableValue.objects.get(user=user, abstract_variable=wsVarDAO.abstract_variable)
                   
                variable_value.value=unicode(wsVar['value'])
                variable_value.save()
               
            for igVar in igadgetVariables:
                igVarDAO = Variable.objects.get(pk=igVar['id'])
                
                variable_value = VariableValue.objects.get(user=user, abstract_variable=igVarDAO.abstract_variable)
   
                variable_value.value=unicode(igVar['value'])
                variable_value.save()
            
            return HttpResponse(str('OK'))
        except Exception, e:
            transaction.rollback()
            msg = _("cannot update variables: ") + unicode(e)
            
            raise TracedServerError(e, variables, request, msg)

class WorkSpaceChannelCollection(Resource):
    def read(self, request, workspace_id):
        user = get_user_authentication(request)
        
        workspaces = get_list_or_404(WorkSpace, users__id=user.id, pk=workspace_id)
        data = serializers.serialize('python', workspaces, ensure_ascii=False)
        variable_data = get_workspace_channels_data(workspaces[0])
        
        return HttpResponse(json_encode(variable_data), mimetype='application/json; charset=UTF-8')

class  WorkSpaceMergerEntry(Resource):
    @transaction.commit_on_success
    def read(self, request, from_ws_id, to_ws_id):
        from_ws = get_object_or_404(WorkSpace, id=from_ws_id)
        to_ws = get_object_or_404(WorkSpace, id=to_ws_id)

        user = get_user_authentication(request)

        packageCloner = PackageCloner()

        to_workspace = packageCloner.merge_workspaces(from_ws, to_ws, user)

        result = {'result': 'ok', 'merged_workspace_id': to_workspace.id}
        return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')


class  WorkSpaceSharerEntry(Resource):
    @transaction.commit_on_success
    def update(self, request, workspace_id, share_boolean):
        user = get_user_authentication(request)
        
        try:
            workspace = WorkSpace.objects.get(id=workspace_id)
        except WorkSpace.DoesNotExist:
            msg = 'The workspace does not exist!'
            result = {'result': 'error', 'description': msg}
            HttpResponseServerError(json_encode(result), mimetype='application/json; charset=UTF-8')
        
        owner = workspace.get_creator()
        
        if (owner != user):
            msg = 'You are not the owner of the workspace, so you can not share it!'
            result = {'result': 'error', 'description': msg}
            return HttpResponseServerError(json_encode(result), mimetype='application/json; charset=UTF-8')
        
        #Everything right!
        if not request.REQUEST.has_key('groups'):
            #Share with everybody
            #Linking with public user!
            public_user = get_public_user(request)
            
            linkWorkspaceObject(public_user, workspace, owner, link_variable_values=True)
            
            url = request.META['HTTP_REFERER'] + 'viewer/workspace/' + workspace_id
            
            result = {"result": "ok", "url": url}
            return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')        
        else:
            #Share only with the scpecified groups
            try:
                groups = simplejson.loads(PUT_parameter(request, 'groups'))
                queryGroups = Group.objects.filter(id__in=groups)
                for g in queryGroups:
                    workspace.targetOrganizations.add(g)
                
                users = User.objects.filter(groups__in=groups).distinct()
                for user in users:
                    #link the workspace with each user
                    linkWorkspaceObject(user, workspace, owner, link_variable_values=True)
               
            except Exception, e:
                transaction.rollback()
                msg = _("workspace cannot be shared: ") + unicode(e)
            
                raise TracedServerError(e, groups, request, msg)                 
            result = {"result": "ok"}
            return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')

    def read(self, request, workspace_id):
        user = get_user_authentication(request)
        
        groups = []
        #read the groups that can be related to a workspace
        queryGroups = Group.objects.exclude(name__startswith="cert__").order_by('name')
        for group in queryGroups:
            data = {'name': group.name, 'id':group.id}
            try:
                group.workspace_set.get(id=workspace_id)
                #boolean for js
                data['sharing'] = 'true'
            except WorkSpace.DoesNotExist:
                data['sharing'] = 'false'
                
            groups.append(data)
        
        return HttpResponse(json_encode(groups), mimetype='application/json; charset=UTF-8')
        

class  WorkSpaceLinkerEntry(Resource):
    @transaction.commit_on_success
    def read(self, request, workspace_id):
        user = get_user_authentication(request)

        linkWorkspace(user, workspace_id) 

        result = {"result": "ok"}
        return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')

class  WorkSpaceClonerEntry(Resource):
    @transaction.commit_on_success
    def read(self, request, workspace_id):
        user = get_user_authentication(request)

        cloned_workspace = cloneWorkspace(workspace_id, user)
        result = {'result': 'ok', 'new_workspace_id': cloned_workspace.id}
        return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')


class  PublishedWorkSpaceMergerEntry(Resource):        
    @transaction.commit_on_success
    def read(self, request, published_ws_id, to_ws_id):
        user = get_user_authentication(request)

        published_workspace = get_object_or_404(PublishedWorkSpace, id=published_ws_id)

        from_ws = published_workspace.workspace
        to_ws = get_object_or_404(WorkSpace, id=to_ws_id)

        packageCloner = PackageCloner()

        to_workspace = packageCloner.merge_workspaces(from_ws, to_ws, user)

        result = {'result': 'ok', 'workspace_id': to_workspace.id}
        return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')

class  WorkSpaceAdderEntry(Resource):
    @transaction.commit_on_success
    def read(self, request, workspace_id):
        user = get_user_authentication(request)
        
        published_workspace = get_object_or_404(PublishedWorkSpace, id=workspace_id)
        
        original_workspace = published_workspace.workspace
        
        cloned_workspace = cloneWorkspace(workspace_id, user)
        
        linkWorkspace(user, cloned_workspace.id, original_workspace.get_creator())
        
        data = serializers.serialize('python', [cloned_workspace], ensure_ascii=False)
        concept_data = {}
        concept_data['user'] = user
        workspace_data = get_global_workspace_data(data[0], cloned_workspace, concept_data, user)
        
        return HttpResponse(json_encode(workspace_data), mimetype='application/json; charset=UTF-8')

class  WorkSpacePublisherEntry(Resource):
    @transaction.commit_on_success
    def read(self, request, workspace_id):
        return self.create(request, workspace_id)
        
    @transaction.commit_on_success
    def create(self, request, workspace_id):
        if not request.REQUEST.has_key('data'):
            return HttpResponseBadRequest(get_xml_error(_("mashup data expected")), mimetype='application/xml; charset=UTF-8')
            
        received_json = request.REQUEST['data']
        try:
            mashup = simplejson.loads(received_json) 
            if not mashup.has_key('name'):
            	raise Exception(_('Malformed mashup JSON: expecting mashup name.'))
            if not mashup.has_key('vendor'):
                raise Exception(_('Malformed mashup JSON: expecting mashup vendor.'))
            if not mashup.has_key('version'):
                raise Exception(_('Malformed mashup JSON: expecting mashup version.'))

        except Exception, e:
            transaction.rollback()
            msg = _("mashup cannot be published: ") + unicode(e)
            
            raise TracedServerError(e, mashup, request, msg)
        
        workspace = get_object_or_404(WorkSpace, id=workspace_id)
        
        user = get_user_authentication(request)
        
        #Cloning original workspace!
        packageCloner = PackageCloner()
        
        cloned_workspace = packageCloner.clone_tuple(workspace)
        
        #Generating info of new workspace
        vendor = mashup.get('vendor')
        name = mashup.get('name')
        version = mashup.get('version')
        email = mashup.get('email')
        
        description = mashup.get('description')
        if (description):
            description = description + " \n " + get_workspace_description(workspace)
        else:
            description = get_workspace_description(workspace)
        
        author = mashup.get('author')
        if (not author):
            author = user.username
            
        imageURI = mashup.get('imageURI')
        if (not imageURI):
            imageURI = 'http://share.skype.com/sites/devzone/headshot_mashup.jpg'
            
        wikiURI = mashup.get('wikiURI')
        if (not wikiURI):
            wikiURI = 'http://trac.morfeo-project.org/trac/ezwebplatform/wiki/Mashup'
        
        organization = mashup.get('organization')
        if (not organization):
            organization = ''
        
        readOnly = mashup.get('readOnly')
        if (not readOnly):
            readOnly = False
        
        contratable = mashup.get('contratable')
        if (not contratable):
            contratable = False
            
        try:
            cloned_workspace.name = name
            cloned_workspace.creator = user
            cloned_workspace.setReadOnlyFields(readOnly)
            cloned_workspace.save()
            published_workspace = PublishedWorkSpace(type='CLONED', workspace=cloned_workspace, author=author, 
                                                     mail=email, vendor=vendor, 
                                                     name=name, version=version, description=description,
                                                     imageURI=imageURI, wikiURI=wikiURI, organization = organization,
                                                     contratable=contratable)
            
            published_workspace.save()
        except IntegrityError, e:
            transaction.rollback()
            msg = _("mashup cannot be published: duplicated mashup")
            
            raise TracedServerError(e, workspace_id, request, msg)
        
        #ask the template Generator for the template of the new mashup
        baseURL = "http://" + request.get_host()
        if hasattr(settings,'TEMPLATE_GENERATOR_URL'):
            baseURL = settings.TEMPLATE_GENERATOR_URL
        
        url= baseURL+"/workspace/templateGenerator/" + str(published_workspace.id)

        response = {'result': 'ok', 'published_workspace_id': published_workspace.id, 'url': url}
        return HttpResponse(json_encode(response), mimetype='application/json; charset=UTF-8')

class  GeneratorURL(Resource):
    def read(self, request, workspace_id):
        templateGen = TemplateGenerator()
        template=templateGen.getTemplate(workspace_id)
        
        return HttpResponse(template,mimetype='application/xml; charset=UTF-8' )
        
