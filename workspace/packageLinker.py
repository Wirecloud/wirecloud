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

from workspace.models import WorkSpaceVariable, VariableValue, UserWorkSpace, SharedVariableValue
from igadget.models import Variable, IGadget


class PackageLinker:

    def link_workspace(self, workspace, user, creator, update_variable_values=True):
        # Linking user to workspace

        #Linking gadgets to user!
        ws_igadget_vars = self.link_gadgets(workspace, user)

        #Linking workspace with user!
        user_workspace, created = UserWorkSpace.objects.get_or_create(user=user, workspace=workspace, defaults={'active': False})

        if (update_variable_values):
            ws_vars = WorkSpaceVariable.objects.filter(workspace=workspace)

            abstract_var_list = self.get_abstract_var_list(ws_igadget_vars, ws_vars)

            # Creating new VariableValue to each AbstractVariable
            # Linking each new VariableValue to the user argument
            self.update_user_variable_values(abstract_var_list, user, creator)

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
        if (len(workspace.users.filter(id=user.id)) == 0):
            user_workspace = UserWorkSpace(user=user, workspace=workspace, active=False)
            user_workspace.save()

    def update_variable_value(self, user_variable_value, creator_value_available, abstract_variable, created):
        if (creator_value_available):

            user_variable_value.value = creator_value_available.get_variable_value()
        else:
            #Creator VariableValue not available (workspace published with old cloning algorithm)
            #Using AbstractVariable default value
            if (created):
                user_variable_value.value = abstract_variable.get_default_value()

        return user_variable_value

    def update_user_variable_values(self, abstract_var_list, user, creator):
        for (abstract_var, variable) in abstract_var_list:
            #Does user have his own VariableValue?
            try:
                user_variable_value = VariableValue.objects.get(user=user, abstract_variable=abstract_var)
            except VariableValue.DoesNotExist:
                user_variable_value = None

            #Does creator have his own VariableValue?
            try:
                creator_variable_value = VariableValue.objects.get(user=creator, abstract_variable=abstract_var)
            except VariableValue.DoesNotExist:
                creator_variable_value = None

            created = False

            if (not user_variable_value):
                #User VariableValue does not exist! Creating one!

                user_variable_value = VariableValue(user=user, value='', abstract_variable=abstract_var)
                created = True

            #Updating User VariableValue value!
            user_variable_value = self.update_variable_value(user_variable_value, creator_variable_value, abstract_var, created)

            if created:
                if creator_variable_value:

                    #check if it's shared (only for igadget variables)
                    if variable and variable.vardef.shared_var_def:
                        shared_concept = variable.vardef.shared_var_def
                        shared_var_value, is_new = SharedVariableValue.objects.get_or_create(user=user,
                                                                                              shared_var_def=shared_concept)
                        if is_new:
                            if variable.has_public_value():
                                #clone the value the creator has set
                                shared_var_value.value = SharedVariableValue.objects.get(user=creator,
                                                                                         shared_var_def=shared_concept).value
                            else:
                                #set the default value
                                shared_var_value.value = variable.get_default_value()

                            shared_var_value.save()

                        if creator_variable_value.shared_var_value:
                            user_variable_value.shared_var_value = shared_var_value

                    #remove the cloned variable value
                    #creator_variable_value.delete() -> problems sharing workspaces. it cannot be done

            user_variable_value.save()

    def get_abstract_var_list(self, ws_igadget_vars, ws_vars):
        abstract_var_list = []

        for igadget_var in ws_igadget_vars:
            abstract_var_list.append((igadget_var.abstract_variable, igadget_var))

        for ws_var in ws_vars:
            abstract_var_list.append((ws_var.abstract_variable, None))

        return abstract_var_list
