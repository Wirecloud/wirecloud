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

from django.contrib import admin

from wirecloud.catalogue.models import CatalogueResource, WidgetWiring
from wirecloud.catalogue.models import UserTag, UserVote, Tag, Category


class CategoyAdminView(admin.ModelAdmin):
    filter_horizontal = ('tags',)
    verbose_name_plural = 'Categories'


class CatalogueResourceAdmin(admin.ModelAdmin):

    search_fields = ['short_name', 'vendor', 'author']
    list_display = ['short_name', 'vendor', 'author', 'resource_type']
    verbose_name_plural = 'Resources'

admin.site.register(CatalogueResource, CatalogueResourceAdmin)
admin.site.register(WidgetWiring)
admin.site.register(UserTag)
admin.site.register(UserVote)
admin.site.register(Tag)
admin.site.register(Category, CategoyAdminView)
