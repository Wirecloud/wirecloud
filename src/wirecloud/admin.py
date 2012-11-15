# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.


from django.contrib import admin
from wirecloud import models


admin.site.register(models.Concept)
admin.site.register(models.ConceptName)
admin.site.register(models.Constant)

admin.site.register(models.Position)
admin.site.register(models.IWidget)
admin.site.register(models.Variable)


class MarketAdmin(admin.ModelAdmin):
    list_display = ('user', 'name')
    ordering = ('user', 'name')

admin.site.register(models.Market, MarketAdmin)

admin.site.register(models.Widget)
admin.site.register(models.XHTML)
admin.site.register(models.VariableDef)
admin.site.register(models.UserPrefOption)
admin.site.register(models.VariableDefAttr)
admin.site.register(models.ContextOption)
admin.site.register(models.Capability)

admin.site.register(models.PlatformPreference)
admin.site.register(models.WorkspacePreference)
admin.site.register(models.TabPreference)


class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ('creator', 'name')
    ordering = ('creator', 'name')

admin.site.register(models.Workspace, WorkspaceAdmin)
admin.site.register(models.UserWorkspace)
admin.site.register(models.PublishedWorkspace)
admin.site.register(models.VariableValue)
admin.site.register(models.Tab)
admin.site.register(models.GroupPublishedWorkspace)
admin.site.register(models.Category)
