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

from workspace.models import WorkSpaceVariable, AbstractVariable, VariableValue
from igadget.models import Variable, IGadget

from django.db import models, IntegrityError

class PackageLinker:
    def link_workspace(self, workspace, user, link_variable_values=True):
        # Linking user to workspace
        self.add_user_to_workspace(workspace, user)
        
        #Linking gadgets to user (allways needed)
        ws_igadget_vars = self.link_gadgets(workspace, user)
        
        if (link_variable_values):
            ws_vars = WorkSpaceVariable.objects.filter(workspace=workspace)
            
            abstract_var_list = self.get_abstract_var_list(ws_igadget_vars, ws_vars)
            
            # Creating new VariableValue to each AbstractVariable
            # Linking each new VariableValue to the user argument
            self.add_user_to_abstract_variable_list(abstract_var_list, user, workspace.get_creator())
    
    def link_gadgets(self, workspace, user):
        # Getting all abstract variables of workspace
        ws_igadget_vars = Variable.objects.filter(igadget__tab__workspace=workspace)
        
        ws_igadgets = IGadget.objects.filter(tab__workspace=workspace)
        
        # Linking igadgets' gadget with user
        # For user personal showcase 
        for igadget in ws_igadgets:
            gadget = igadget.gadget
            gadget.users.add(user)
            
            gadget.save()
        
        return ws_igadget_vars

    def add_user_to_workspace(self, workspace, user):
         #Checking if user is already linked to workspace
        if (len(workspace.users.filter(id=user.id))==0):
            workspace.users.add(user)
            workspace.save()

    def add_user_to_abstract_variable_list(self, abstract_var_list, user, creator):
        for (abstract_var, variable) in abstract_var_list:
            variable_values = VariableValue.objects.filter(user=user, abstract_variable=abstract_var)
            original_variable_value = VariableValue.objects.get(user=creator, abstract_variable=abstract_var)
            
            if (len(variable_values)>0):
                #The VariableValue of this abstract_variable exists!
                #It's time to update the variable value with creator's variable value!
                linked_user_variable_value = variable_values[0]
            else:
                #Creating VariableValue with creators value!
                linked_user_variable_value = VariableValue(user=user, value='', abstract_variable=abstract_var)
            
            linked_user_variable_value.value = original_variable_value.get_variable_value()
            linked_user_variable_value.save()
                
    def get_abstract_var_list(self, ws_igadget_vars, ws_vars):
        abstract_var_list = []
        
        for igadget_var in ws_igadget_vars:
            abstract_var_list.append((igadget_var.abstract_variable, igadget_var))
            
        for ws_var in ws_vars:
            abstract_var_list.append((ws_var.abstract_variable, None))
        
        return abstract_var_list
        
        
