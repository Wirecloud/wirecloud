# -*- coding: utf-8 -*-

# Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

from wirecloud.catalogue.models import CatalogueResource, WidgetWiring


class ResourceEndpointsInline(admin.TabularInline):

    model = WidgetWiring
    extra = 0


class CatalogueResourceAdmin(admin.ModelAdmin):

    search_fields = ('vendor', 'short_name', 'version', 'author')
    list_display = ('vendor', 'short_name', 'version', 'resource_type')
    inlines = (ResourceEndpointsInline,)
    verbose_name_plural = 'Resources'

admin.site.register(CatalogueResource, CatalogueResourceAdmin)
