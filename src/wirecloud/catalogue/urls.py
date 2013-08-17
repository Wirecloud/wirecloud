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

try:
    from django.conf.urls import patterns, url
except ImportError:  # pragma: no cover
    # for Django version less than 1.4
    from django.conf.urls.defaults import patterns, url

from wirecloud.catalogue.views import ResourceCollection, ResourceCollectionByGlobalSearch
from wirecloud.catalogue.views import ResourceCollectionBySimpleSearch, ResourceTagCollection
from wirecloud.catalogue.views import ResourceVoteCollection, ResourceVersionCollection
from wirecloud.catalogue.views import ResourceEntry

urlpatterns = patterns('wirecloud.catalogue.views',
    # Resources
    url(r'^/resource/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)$',
        ResourceEntry(permitted_methods=('GET', 'DELETE')),
        name='wirecloud_catalogue.resource_entry'),
    url(r'^/resource/(?P<vendor>[^/]+)/(?P<name>[^/]+)$', ResourceCollection(permitted_methods=('DELETE',))),
    url(r'^/resources$',
        ResourceCollection(permitted_methods=('GET', 'POST',)),
        name='wirecloud_catalogue.resource_collection'),
    url(r'^/voting/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)$',
        ResourceVoteCollection(permitted_methods=('GET', 'POST', 'PUT',)),
        name='wirecloud_catalogue.resource_vote'),


    # Search Resources
    url(r'^/resources/(?P<pag>\d+)/(?P<offset>\d+)$',
        ResourceCollection(permitted_methods=('GET',)),
        name="wirecloud_catalogue.resource_list"),
    url(r'^/search/(?P<criteria>\w+)/(?P<pag>\d+)/(?P<offset>\d+)$',
        ResourceCollectionBySimpleSearch(permitted_methods=('GET',)),
        name="wirecloud_catalogue.simple_search"),
    url(r'^/globalsearch/(?P<pag>\d+)/(?P<offset>\d+)$',
        ResourceCollectionByGlobalSearch(permitted_methods=('GET',)),
        name="wirecloud_catalogue.global_search"),

    # Tags
    (r'^/tag(s)?/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/(?P<tag>\d+)$',
        ResourceTagCollection(permitted_methods=('DELETE',))),
    (r'^/tag(s)?/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)$',
        ResourceTagCollection(permitted_methods=('GET', 'POST',))),

    #version check
    url(r'^/versions',
        ResourceVersionCollection(permitted_methods=('POST',)),
        name='wirecloud_catalogue.resource_versions'),

    url(r'^/error', 'error', name='iframe_error'),
    url(r'^/media/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/(?P<file_path>.+)', 'serve_catalogue_media', name='wirecloud_catalogue.media'),
)
