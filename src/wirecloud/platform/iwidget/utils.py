# -*- coding: utf-8 -*-

from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.platform.models import IWidget, Position, Tab, VariableDef


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

    iwidget.variable_set.create(vardef=varDef, value=var_value)


def SaveIWidget(iwidget, user, tab, initial_variable_values):

    widget_uri = iwidget.get('widget')

    (widget_vendor, widget_name, widget_version) = widget_uri.split('/')
    resource = CatalogueResource.objects.select_related('widget').get(vendor=widget_vendor, short_name=widget_name, version=widget_version)
    if not resource.is_available_for(user):
        raise CatalogueResource.DoesNotExist

    iwidget_name = iwidget.get('name', None)
    if iwidget_name is None:
        iwidget_name = resource.get_processed_info()['title']

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

    ig.tab.workspace.save() # Invalidate workspace cache
