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

from wirecloud.models import Variable, IGadget
from workspace.models import VariableValue, UserWorkSpace


class PackageLinker:

    def link_workspace(self, workspace, user, creator, update_variable_values=True):

        # Linking user to workspace
        user_workspace, created = UserWorkSpace.objects.get_or_create(user=user, workspace=workspace, defaults={'active': False})

        if not created:
            # The workspace is already linked to the user
            return user_workspace

        # Linking gadgets to user!
        variables = self.link_gadgets(workspace, user)

        if update_variable_values:

            # Create a new VariableValue for each Variable
            self.update_user_variable_values(variables, user, creator)

        return user_workspace

    def unlink_workspace(self, workspace, user):
        user_workspace = UserWorkSpace.objects.filter(workspace=workspace, user=user)
        user_workspace.delete()

    def link_gadgets(self, workspace, user):

        # Getting all abstract variables of workspace
        variables = Variable.objects.filter(igadget__tab__workspace=workspace).select_related('vardef')

        ws_igadgets = IGadget.objects.filter(tab__workspace=workspace)

        # Linking igadgets' gadget with user
        # For user personal showcase
        for igadget in ws_igadgets:
            gadget = igadget.gadget
            gadget.users.add(user)

            gadget.save()

        return variables

    def add_user_to_workspace(self, workspace, user):
         #Checking if user is already linked to workspace
        if (len(workspace.users.filter(id=user.id)) == 0):
            user_workspace = UserWorkSpace(user=user, workspace=workspace, active=False)
            user_workspace.save()

    def update_variable_value(self, user_variable_value, creator_value_available, variable, created):
        if creator_value_available:

            user_variable_value.value = creator_value_available.get_variable_value()
        elif created:
            #Creator VariableValue not available (workspace published with old cloning algorithm)
            #Using AbstractVariable default value
            user_variable_value.value = variable.get_default_value()

        return user_variable_value

    def update_user_variable_values(self, variables, user, creator):

        for variable in variables:

            # Only properties and preferences have value
            if variable.vardef.aspect not in ('PROP', 'PREF'):
                continue

            #Does user have his own VariableValue?
            try:
                user_variable_value = VariableValue.objects.get(user=user, variable=variable)
            except VariableValue.DoesNotExist:
                user_variable_value = None

            #Does creator have his own VariableValue?
            try:
                creator_variable_value = VariableValue.objects.get(user=creator, variable=variable)
            except VariableValue.DoesNotExist:
                creator_variable_value = None

            created = False

            if not user_variable_value:
                # User VariableValue does not exist! Creating one!

                user_variable_value = VariableValue(user=user, value='', variable=variable)
                created = True

            #Updating User VariableValue value!
            user_variable_value = self.update_variable_value(user_variable_value, creator_variable_value, variable, created)

            if user_variable_value.value is not None:
                user_variable_value.save()
