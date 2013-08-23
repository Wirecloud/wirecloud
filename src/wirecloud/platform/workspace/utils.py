# -*- coding: utf-8 -*-

# Copyright (c) 2008-2013 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

try:
    from Crypto.Cipher import AES
    HAS_AES = True
except ImportError:
    HAS_AES = False
import json

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _

from wirecloud.commons.utils.db import save_alternative
from wirecloud.commons.utils.template import TemplateParser
from wirecloud.platform.iwidget.utils import deleteIWidget
from wirecloud.platform.models import IWidget, PublishedWorkspace, Tab, UserWorkspace, VariableValue, Workspace
from wirecloud.platform.workspace.managers import get_workspace_managers
from wirecloud.platform.workspace.packageLinker import PackageLinker


def deleteTab(tab, user):
    #Deleting iwidgets
    iwidgets = IWidget.objects.filter(tab=tab)
    for iwidget in iwidgets:
        deleteIWidget(iwidget, user)

    # Deleting tab
    tab.delete()


def createTab(tab_name, workspace, allow_renaming=False):

    visible = False
    tabs = Tab.objects.filter(workspace=workspace, visible=True)
    if tabs.count() == 0:
        visible = True

    # It's always the last tab
    position = Tab.objects.filter(workspace=workspace).count()

    # Creating tab
    tab = Tab(name=tab_name, visible=visible, position=position, workspace=workspace)
    if allow_renaming:
        save_alternative(Tab, 'name', tab)
    else:
        tab.save()

    return tab


def setVisibleTab(user, workspace_id, tab):
    visibleTabs = Tab.objects.filter(workspace__users__id=user.id, workspace__pk=workspace_id, visible=True).exclude(pk=tab.pk)
    for visibleTab in visibleTabs:
        visibleTab.visible = False
        visibleTab.save()
    tab.visible = True
    tab.save()


def encrypt_value(value):
    if not HAS_AES:
        return value

    cipher = AES.new(settings.SECRET_KEY[:32])
    json_value = json.dumps(value, ensure_ascii=False)
    padded_value = json_value + (cipher.block_size - len(json_value) % cipher.block_size) * ' '
    return cipher.encrypt(padded_value).encode('base64')


def decrypt_value(value):
    if not HAS_AES:
        return value

    cipher = AES.new(settings.SECRET_KEY[:32])
    try:
        value = cipher.decrypt(value.decode('base64'))
        return json.loads(value)
    except:
        return ''


def set_variable_value(var_id, user, value):

    variable_value = VariableValue.objects.select_related('variable__vardef').get(user=user, variable__id=var_id)
    variable_value.set_variable_value(value)
    variable_value.save()


def sync_base_workspaces(user):

    from wirecloud.platform.workspace.mashupTemplateParser import buildWorkspaceFromTemplate

    packageLinker = PackageLinker()
    reload_showcase = False
    managers = get_workspace_managers()

    workspaces_by_manager = {}
    workspaces_by_ref = {}
    for manager in managers:
        workspaces_by_manager[manager.get_id()] = []
        workspaces_by_ref[manager.get_id()] = {}

    workspaces = UserWorkspace.objects.filter(user=user)
    for workspace in workspaces:
        if workspace.manager != '':
            workspaces_by_manager[workspace.manager].append(workspace.reason_ref)
            workspaces_by_ref[workspace.manager][workspace.reason_ref] = workspace

    for manager in managers:
        current_workspaces = workspaces_by_manager[manager.get_id()]
        result = manager.update_base_workspaces(user, current_workspaces)

        for workspace_to_remove in result[0]:
            user_workspace = workspaces_by_ref[manager.get_id()][workspace_to_remove]
            workspace = user_workspace.workspace
            user_workspace.delete()

            if workspace.userworkspace_set.count() == 0:
                workspace.delete()

        for workspace_to_add in result[1]:
            from_workspace = workspace_to_add[1]

            if isinstance(from_workspace, Workspace):
                user_workspace = packageLinker.link_workspace(from_workspace, user, from_workspace.creator)
            elif isinstance(from_workspace, PublishedWorkspace):
                _junk, user_workspace = buildWorkspaceFromTemplate(from_workspace.template, user)
            else:
                # TODO warning
                continue

            user_workspace.manager = manager.get_id()
            user_workspace.reason_ref = workspace_to_add[0]
            user_workspace.save()
            reload_showcase = True

    return reload_showcase


def get_workspace_list(user):

    from wirecloud.platform.workspace.views import createEmptyWorkspace, setActiveWorkspace

    reload_showcase = sync_base_workspaces(user)

    if Workspace.objects.filter(users=user).count() == 0:
        # create an empty workspace
        createEmptyWorkspace(_('Workspace'), user)

    # Now we can fetch all the workspaces of an user
    workspaces = Workspace.objects.filter(users__id=user.id)

    # if there is no active workspace
    active_workspaces = UserWorkspace.objects.filter(user=user, active=True)
    if len(active_workspaces) == 0:

        # set the first workspace as active
        active_workspace = UserWorkspace.objects.filter(user=user)[0]
        setActiveWorkspace(user, active_workspace.workspace)

    elif len(active_workspaces) > 1:

        active_workspaces[1:].update(active=False)
        active_workspace = active_workspaces[0]

    else:
        active_workspace = active_workspaces[0]

    return workspaces, active_workspace, reload_showcase
