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
from django.shortcuts import get_object_or_404

from workspace.models import AbstractVariable, VariableValue, WorkSpaceVariable, Tab, PublishedWorkSpace
from connectable.models import Out
from igadget.models import IGadget
from igadget.views import deleteIGadget


def deleteTab(tab, user):
    #Deleting igadgets
    igadgets = IGadget.objects.filter(tab=tab)
    for igadget in igadgets:
        deleteIGadget(igadget, user)

    # Deleting OUT connectable (wTab)
    Out.objects.get(abstract_variable=tab.abstract_variable).delete()

    # Deleting workspace variable
    WorkSpaceVariable.objects.get(abstract_variable=tab.abstract_variable).delete()

    # Deleting abstract variable
    VariableValue.objects.get(abstract_variable=tab.abstract_variable, user=user).delete()
    tab.abstract_variable.delete()

    # Deleting tab
    tab.delete()


def createTab(tab_name, user, workspace):
    # Creating Entry in AbstractVariable table for polimorphic access from Connectable hierarchy
    abstractVariable = AbstractVariable(name=tab_name, type='WORKSPACE')
    abstractVariable.save()

    # Creating Value for Abstract Variable
    variableValue = VariableValue(user=user, value="", abstract_variable=abstractVariable)
    variableValue.save()

    # Creating implicit workspace variable
    wsVariable = WorkSpaceVariable(workspace=workspace, aspect='TAB', abstract_variable=abstractVariable)
    wsVariable.save()

    # Creating implicit OUT Connectable element
    connectableName = 'tab_' + tab_name
    connectable = Out(name=connectableName, abstract_variable=abstractVariable)
    connectable.save()

    visible = False
    tabs = Tab.objects.filter(workspace=workspace, visible=True)
    if tabs.count() == 0:
        visible = True

    #it's always the last tab
    position = Tab.objects.filter(workspace=workspace).count()

    # Creating tab
    tab = Tab(name=tab_name, visible=visible, position=position, workspace=workspace, abstract_variable=abstractVariable)
    tab.save()

    return (tab, wsVariable)


def setVisibleTab(user, workspace_id, tab):
    visibleTabs = Tab.objects.filter(workspace__users__id=user.id, workspace__pk=workspace_id, visible=True).exclude(pk=tab.pk)
    for visibleTab in visibleTabs:
        visibleTab.visible = False
        visibleTab.save()
    tab.visible = True
    tab.save()


def get_mashup_gadgets(mashup_id):
    published_workspace = get_object_or_404(PublishedWorkSpace, id=mashup_id)

    return [i.gadget for i in IGadget.objects.filter(tab__workspace=published_workspace.workspace)]
