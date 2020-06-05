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

from wirecloud.commons import models


class TeamInline(admin.StackedInline):

    model = models.Team
    fields = ('name', 'users')
    ordering = ('name',)
    extra = 0


class OrganizationAdmin(admin.ModelAdmin):

    list_display = ('user',)
    list_display_links = ('user',)
    ordering = ('user',)
    inlines = (TeamInline,)


admin.site.register(models.Organization, OrganizationAdmin)
