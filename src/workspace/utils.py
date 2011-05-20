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
from Crypto.Cipher import AES
from django.conf import settings
from django.shortcuts import get_object_or_404
#from django.contrib.auth.models import Group
from django.utils import simplejson

from workspace.managers import get_workspace_managers
from workspace.models import Tab, PublishedWorkSpace, UserWorkSpace, SharedVariableValue, VariableValue, WorkSpace
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


def encrypt_value(value):
    cipher = AES.new(settings.SECRET_KEY[:32])
    json_value = simplejson.dumps(value, ensure_ascii=False)
    padded_value = json_value + (cipher.block_size - len(json_value) % cipher.block_size) * ' '
    return cipher.encrypt(padded_value).encode('base64')


def decrypt_value(value):
    cipher = AES.new(settings.SECRET_KEY[:32])
    try:
        value = cipher.decrypt(value.decode('base64'))
        return simplejson.loads(value)
    except:
        return ''


def set_variable_value(var_id, user, value, shared=None):

    variables_to_notify = []
    variable_value = VariableValue.objects.filter(user=user, variable__id=var_id).select_related('variable__vardef')[0]

    new_value = unicode(value)
    if variable_value.variable.vardef.secure:
        new_value = encrypt_value(new_value)

    if shared != None:
        if shared:
            #do not share the value: remove the relationship
            variable_value.shared_var_value = None
        else:
            shared_variable_def = variable_value.variable.vardef.shared_var_def
            variable_value.shared_var_value = SharedVariableValue.objects.get(user=user,
                                                                              shared_var_def=shared_variable_def)
            #share the specified value
            variable_value.shared_var_value.value = new_value
            variable_value.shared_var_value.save()

            #notify the rest of variables that are sharing the value
            #VariableValues whose value is shared (they have a relationship with a SharedVariableValue)
            variable_values = VariableValue.objects.filter(shared_var_value=variable_value.shared_var_value).exclude(id=variable_value.id)
            #Variables that correspond with these values
            for value in variable_values:
                variable = value.variable
                exists = False
                for var in variables_to_notify:
                    if var['id'] == variable.id:
                        var['value'] = value.shared_var_value.value
                        exists = True
                        break
                if not exists:
                    variables_to_notify.append({'id': variable.id, 'value': value.shared_var_value.value})

    variable_value.value = new_value
    variable_value.save()

    from commons.get_data import _invalidate_cached_variable_values
    _invalidate_cached_variable_values(variable_value.variable.igadget.tab.workspace, user)

    return variables_to_notify


def sync_group_workspaces(user):

    packageLinker = PackageLinker()
    reload_showcase = False
    managers = get_workspace_managers()

    workspaces_by_manager = {}
    workspaces_by_ref = {}
    for manager in managers:
        workspaces_by_manager[manager.get_id()] = []
        workspaces_by_ref[manager.get_id()] = {}

    workspaces = UserWorkSpace.objects.filter(user=user)
    for workspace in workspaces:
        if workspace.manager != '':
            workspaces_by_manager[workspace.manager].append(workspace.reason_ref)
            workspaces_by_ref[workspace.manager][workspace.reason_ref] = workspace

    for manager in managers:
        current_workspaces = workspaces_by_manager[manager.get_id()]
        result = manager.update_base_workspaces(user, current_workspaces)

        for workspace_to_remove in result[0]:
            workspace = workspaces_by_ref[manager.get_id()][workspace_to_remove]
            packageLinker.unlink_workspace(workspace, user)

        for workspace_to_add in result[1]:
            from_workspace = workspace_to_add[1]

            if isinstance(from_workspace, WorkSpace):
                workspace = packageLinker.link_workspace(from_workspace, user, from_workspace.creator)
            else:
                # TODO warning
                continue

            workspace.manager = manager.get_id()
            workspace.reason_ref = workspace_to_add[0]
            workspace.save()
            reload_showcase = True

    return reload_showcase

'''
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
'''
