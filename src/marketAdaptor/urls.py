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
from django.conf.urls.defaults import patterns, url

urlpatterns = patterns('marketAdaptor.views',

    #Next url search all gadgets in every store using the keyword gadget
    url(r'^resources$', 'get_resource_list_from_keyword'),
    url(r'^resources/(?P<store>\w+)$','get_resource_list_from_store'),
    url(r'^search/(?P<keyword>\w+)$','get_resource_list_from_keyword'),
    url(r'^search/(?P<store>\w+)/(?P<keyword>\w+)$','get_resource_list_from_keyword'),
    url(r'^stores$','get_store_list'),
    url(r'^stores/(?P<store>\w+)$','manage_store_in_marketplace'),
    url(r'^(?P<store>\w+)$','add_service_to_marketplace'),
    url(r'^(?P<store>\w+)/(?P<service_name>\w+)$','delete_service_from_marketplace')
)
