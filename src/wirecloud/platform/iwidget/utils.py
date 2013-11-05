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
from django.utils.translation import ugettext as _

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.exceptions import Http403
from wirecloud.platform.models import IWidget, Position, Tab, Variable, VariableDef, VariableValue


def addIWidgetVariable(iwidget, varDef, initial_value=None):

    # Sets the default value of variable
    if varDef.readonly == False and initial_value:
        var_value = initial_value
    elif varDef.value:
        var_value = varDef.value
    elif varDef.default_value:
        var_value = varDef.default_value
    else:
        var_value = ''

    # Create Variable
    variable = Variable.objects.create(iwidget=iwidget, vardef=varDef)

    if varDef.aspect == 'PREF' or varDef.aspect == 'PROP':

        # Creating Variable Values for this variable
        for user in iwidget.tab.workspace.users.all():
            VariableValue.objects.create(user=user, variable=variable, value=var_value)


def UpgradeIWidget(iwidget, user, new_widget):
    currentWidget = iwidget.widget

    # get the workspace in which the iwidget is being added in order to
    # check if it is shared
    # workspaceId = iwidget.tab.workspace.id

    #check equivalency and add the variables needed
    newVariableDefs = VariableDef.objects.filter(widget=new_widget)
    equivalentVarDefs = []
    for varDef in newVariableDefs:
        # search for an equivalent variableDef
        equivalentVarDef = VariableDef.objects.filter(name=varDef.name, type=varDef.type, aspect=varDef.aspect, widget=currentWidget)
        if equivalentVarDef:
            equivalentVarDefs.append(varDef)
            #reassign the variableDef of the Variable
            var = Variable.objects.get(iwidget=iwidget, vardef=equivalentVarDef[0])
            var.vardef = varDef
            var.save()
        else:
            addIWidgetVariable(iwidget, varDef)

    # check if the last version widget hasn't a super-set of the current version widget variableDefs
    currentWidgetVarDefs = VariableDef.objects.filter(widget=currentWidget)
    if len(currentWidgetVarDefs) > len(equivalentVarDefs):
        #some of the current version widget variableDefs aren't in the last version widget
        raise Exception(_("The widget cannot be automatically updated because it is incompatible with the last version."))

    iwidget.widget = new_widget
    iwidget.save()


def SaveIWidget(iwidget, user, tab, initial_variable_values):

    widget_uri = iwidget.get('widget')

    (widget_vendor, widget_name, widget_version) = widget_uri.split('/')
    resource = CatalogueResource.objects.select_related('widget').get(vendor=widget_vendor, short_name=widget_name, version=widget_version)
    if not resource.is_available_for(user):
        raise CatalogueResource.DoesNotExist

    iwidget_name = iwidget.get('name', resource.display_name)
    width = iwidget.get('width', 0)
    height = iwidget.get('height', 0)
    top = iwidget.get('top', 0)
    left = iwidget.get('left', 0)
    icon_top = iwidget.get('icon_top', 0)
    icon_left = iwidget.get('icon_left', 0)
    zIndex = iwidget.get('zIndex', 0)
    layout = iwidget.get('layout', 0)

    # Creates IWidget position
    position = Position(posX=left, posY=top, posZ=zIndex, height=height, width=width, minimized=False, fulldragboard=False)
    position.save()

    # Creates IWidget icon position
    icon_position = Position(posX=icon_left, posY=icon_top)
    icon_position.save()

    new_iwidget = IWidget(name=iwidget_name, widget=resource.widget, tab=tab, layout=layout, position=position, icon_position=icon_position)
    new_iwidget.save()

    variableDefs = VariableDef.objects.filter(widget=resource.widget)
    for varDef in variableDefs:
        if initial_variable_values and varDef.name in initial_variable_values:
            initial_value = initial_variable_values[varDef.name]
        else:
            initial_value = None
        addIWidgetVariable(new_iwidget, varDef, initial_value)

    from wirecloud.platform.get_data import _invalidate_cached_variable_values
    _invalidate_cached_variable_values(new_iwidget.tab.workspace)

    return new_iwidget


def UpdateIWidget(iwidget, user, tab):

    iwidget_pk = iwidget.get('id')

    # Checks
    ig = get_object_or_404(IWidget, tab=tab, pk=iwidget_pk)

    if 'name' in iwidget:
        name = iwidget['name']
        ig.name = name

    if 'tab' in iwidget:
        newtab_id = iwidget['tab']
        if newtab_id < 0:
            raise Exception(_('Malformed iWidget JSON'))

        if newtab_id != tab.id:
            newtab = Tab.objects.get(workspace__users__id=user.id, workspace__pk=tab.workspace_id, pk=newtab_id)
            ig.tab = newtab

    if 'layout' in iwidget:
        layout = iwidget['layout']
        ig.layout = layout

    if 'icon_top' in iwidget and 'icon_left' in iwidget:
        icon_position = ig.icon_position
        if icon_position:
            icon_position.posX = iwidget["icon_left"]
            icon_position.posY = iwidget["icon_top"]
        else:  # backward compatibility (old widgets without icon position)
            icon_position = Position(posX=iwidget["icon_left"], posY=iwidget["icon_top"])
        icon_position.save()
        ig.icon_position = icon_position

    if 'refused_version' in iwidget:
        refused_version = iwidget['refused_version']
        ig.refused_version = refused_version

    ig.save()

    # get IWidget's position
    position = ig.position

    # update the requested attributes
    if 'width' in iwidget:
        width = iwidget['width']
        if width <= 0:
            raise Exception(_('Malformed iWidget JSON'))
        position.width = width

    if 'height' in iwidget:
        height = iwidget['height']
        if height <= 0:
            raise Exception(_('Malformed iWidget JSON'))
        position.height = height

    if 'top' in iwidget:
        top = iwidget['top']
        if top < 0:
            raise Exception(_('Malformed iWidget JSON'))
        position.posY = top

    if 'left' in iwidget:
        left = iwidget['left']
        if left < 0:
            raise Exception(_('Malformed iWidget JSON'))
        position.posX = left

    if 'zIndex' in iwidget:
        zIndex = iwidget['zIndex']
        if not isinstance(zIndex, int):
            raise Exception(_('Malformed iWidget JSON'))
        position.posZ = zIndex

    if 'minimized' in iwidget:
        minimized = iwidget['minimized']
        if not isinstance(minimized, bool) and not isinstance(minimized, int):
            raise Exception(_('Malformed iWidget JSON'))
        position.minimized = minimized

    if 'fulldragboard' in iwidget:
        fulldragboard = iwidget['fulldragboard']
        if not isinstance(fulldragboard, bool) and not isinstance(fulldragboard, int):
            raise Exception(_('Malformed iWidget JSON'))
        position.fulldragboard = fulldragboard

    # save the changes
    position.save()

    from wirecloud.platform.get_data import _invalidate_cached_variable_values
    _invalidate_cached_variable_values(ig.tab.workspace)


def deleteIWidget(iwidget, user):

    if not user.is_superuser:
        workspace = iwidget.tab.workspace
        if workspace.creator != user:
            raise Http403

    iwidget.delete()
