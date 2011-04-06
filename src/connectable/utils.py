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
from workspace.models import AbstractVariable, WorkSpaceVariable, VariableValue
from connectable.models import InOut, Filter
from commons.utils import json_encode


def createChannel(workspace, name, filter=None, filter_params={}, remote_subscription=None):

    # Creating abstract variable
    new_abstract_variable = AbstractVariable(type="WORKSPACE", name=name)
    new_abstract_variable.save()

    # Creating variable value
    new_variable_value = VariableValue(user=workspace.creator, value="", abstract_variable=new_abstract_variable)
    new_variable_value.save()

    new_ws_variable = WorkSpaceVariable(workspace=workspace, abstract_variable=new_abstract_variable, aspect="CHANNEL")
    new_ws_variable.save()

    fparam_values = ''
    if filter is not None:
        fparam_values = json_encode(filter_params)

    channel = InOut(name=name, remote_subscription=remote_subscription, workspace_variable=new_ws_variable, filter=filter, filter_param_values=fparam_values, friend_code="")
    channel.save()

    return channel


def deleteChannel(channel):
    abstract_variable = channel.workspace_variable.abstract_variable
    variable_values = VariableValue.objects.filter(abstract_variable=abstract_variable)

    variable_values.delete()
    abstract_variable.delete()
    channel.workspace_variable.delete()

    if channel.remote_subscription:
        channel.remote_subscription.delete()

    channel.delete()
