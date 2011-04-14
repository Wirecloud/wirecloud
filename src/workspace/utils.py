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
from django.contrib.auth.models import Group

from workspace.models import Tab, PublishedWorkSpace, WorkSpace
from workspace.packageLinker import PackageLinker
from igadget.models import IGadget
from igadget.utils import deleteIGadget


def deleteTab(tab, user):
    #Deleting igadgets
    igadgets = IGadget.objects.filter(tab=tab)
    for igadget in igadgets:
        deleteIGadget(igadget, user)

    # Deleting tab
    tab.delete()


def createTab(tab_name, user, workspace):

    visible = False
    tabs = Tab.objects.filter(workspace=workspace, visible=True)
    if tabs.count() == 0:
        visible = True

    #it's always the last tab
    position = Tab.objects.filter(workspace=workspace).count()

    # Creating tab
    tab = Tab(name=tab_name, visible=visible, position=position, workspace=workspace)
    tab.save()

    return tab


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


def create_published_workspace_from_template(template, resource, contratable, user):
    published_workspace = PublishedWorkSpace(name=resource.short_name,
        vendor=resource.vendor, version=resource.version,
        author=resource.author, mail=resource.mail,
        description=resource.description, imageURI=resource.image_uri,
        wikiURI=resource.wiki_page_uri, contratable=contratable, params='',
        creator=user, template=template)

    published_workspace.save()

    return published_workspace


def sync_group_workspaces(user):
    from workspace.views import linkWorkspace
    # user workspaces
    workspaces = WorkSpace.objects.filter(users=user)

    # all group workspaces
    # the compression list outside the inside compression list is for flatten
    # the inside list
    group_workspaces = [workspace for sublist in
                        [WorkSpace.objects.filter(targetOrganizations=org)
                         for org in Group.objects.all()]
                        for workspace in sublist]

    # workspaces assigned to the user's groups
    # the compression list outside the inside compression list is for flatten
    # the inside list
    workspaces_by_group = [workspace for sublist in
                           [WorkSpace.objects.filter(targetOrganizations=org)
                            for org in user.groups.all()]
                           for workspace in sublist]

    reload_showcase = False
    packageLinker = PackageLinker()

    for ws in group_workspaces:
        if ws in workspaces:
            if not ws in workspaces_by_group:
                # the user already has this workspace, but he shouldn't
                packageLinker.unlink_workspace(ws, user)
        elif ws in workspaces_by_group:
            # the user doesn't have this workspace yet, but he should
            linkWorkspace(user, ws.id, ws.creator)
            reload_showcase = True  # because this workspace is new for the user
        # else: the user doesn't have this workspace yet, and he shouldn't

    return reload_showcase
