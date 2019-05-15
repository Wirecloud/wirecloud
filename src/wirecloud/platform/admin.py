# -*- coding: utf-8 -*-

# Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.contrib import admin
from django.utils.translation import ugettext_lazy as _
from relatives.utils import object_edit_link

from wirecloud.platform import models


def get_workspace(iwidget):
    return iwidget.tab.workspace


get_workspace.short_description = 'Workspace'


class IWidgetAdmin(admin.ModelAdmin):

    list_display = ('id', get_workspace, 'tab', 'widget', 'name')


class MarketAdmin(admin.ModelAdmin):
    list_display = ('user', 'name')
    ordering = ('user', 'name')


class MarketUserDataAdmin(admin.ModelAdmin):
    list_display = ('market', 'user', 'name', 'value')
    ordering = ('market', 'user', 'name')


class WorkspacePreferenceInline(admin.TabularInline):

    model = models.WorkspacePreference
    extra = 1


class TabPreferenceInline(admin.TabularInline):

    model = models.TabPreference
    extra = 1


class TabInline(admin.TabularInline):

    model = models.Tab
    edit_link = object_edit_link(_("Edit"))
    fields = ('name', 'position', edit_link)
    readonly_fields = (edit_link,)
    ordering = ('position',)
    extra = 1


class TabAdmin(admin.ModelAdmin):

    list_display = ('workspace', 'name', 'position')
    list_display_links = ('name',)
    ordering = ('workspace', 'position')
    inlines = (TabPreferenceInline,)


class WorkspaceAdmin(admin.ModelAdmin):

    search_fields = ('creator__username', 'name', 'description')
    list_display = ('creator', 'name', 'description')
    ordering = ('creator', 'name')
    inlines = (WorkspacePreferenceInline, TabInline,)


admin.site.register(models.Constant)
admin.site.register(models.IWidget, IWidgetAdmin)
admin.site.register(models.Market, MarketAdmin)
admin.site.register(models.MarketUserData, MarketUserDataAdmin)
admin.site.register(models.Widget)
admin.site.register(models.XHTML)
admin.site.register(models.PlatformPreference)
admin.site.register(models.Workspace, WorkspaceAdmin)
admin.site.register(models.Tab, TabAdmin)
admin.site.register(models.UserWorkspace)
