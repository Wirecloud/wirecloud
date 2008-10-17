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
from igadget.models import Variable

from django.db import models, IntegrityError

class PackageLinker:
    def link_workspace(self, workspace, user):
        # Linking user to workspace
        self.add_user_to_workspace(workspace, user)
        
        # Getting all abstract variables of workspace
        ws_igadget_vars = Variable.objects.filter(igadget__tab__workspace=workspace)
        
        # Linking igadgets' gadget with user
        # For user personal showcase 
        for var in ws_igadget_vars:
            gadget = var.igadget.gadget
            gadget.users.add(user)
            
            gadget.save()
        
        ws_vars = WorkSpaceVariable.objects.filter(workspace=workspace)
        
        abstract_var_list = self.get_abstract_var_list(ws_igadget_vars, ws_vars)
        
        # Creating new VariableValue to each AbstractVariable
        # Linking each new VariableValue to the user argument
        self.add_user_to_abstract_variable_list(abstract_var_list, user)

    def add_user_to_workspace(self, workspace, user):
         #Checking if user is already linked to workspace
        if (len(workspace.users.filter(id=user.id))==0):
            workspace.users.add(user)
            workspace.save()

    def add_user_to_abstract_variable_list(self, abstract_var_list, user):
        for (abstract_var, variable) in abstract_var_list:
            if (len(VariableValue.objects.filter(user=user, abstract_variable=abstract_var))>0):
                #Can happen due to linking algorithm.
                #With a proper inheritance scheme for Variables database models, this can be avoided!
                # TO BE IMPROVED!
                continue
            
            variable_value = VariableValue(user=user, value='', abstract_variable=abstract_var)
            
            # variable is the child element of the Variable inheritance
            # variable == None => wk_variable
            # variable != None => igadget_variable associated to abstract_variable
            if variable and variable.vardef.default_value:
                variable_value.value = variable.vardef.default_value
            
            variable_value.save()
    
    def get_abstract_var_list(self, ws_igadget_vars, ws_vars):
        abstract_var_list = []
        
        for igadget_var in ws_igadget_vars:
            abstract_var_list.append((igadget_var.abstract_variable, igadget_var))
            
        for ws_var in ws_vars:
            abstract_var_list.append((ws_var.abstract_variable, None))
        
        return abstract_var_list
        
        
