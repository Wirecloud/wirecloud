# -*- coding: utf-8 -*-

# Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.conf.urls import url

from wirecloud.catalogue import views

urlpatterns = (

    # Resources
    url(r'^resource/(?P<vendor>[^/]+)/(?P<name>[^/]+)$',
        views.ResourceEntry(permitted_methods=('GET', 'DELETE')),
        name='wirecloud_catalogue.resource_entry'),
    url(r'^resource/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)$',
        views.ResourceEntry(permitted_methods=('GET', 'DELETE')),
        name='wirecloud_catalogue.resource_entry'),
    url(r'^resource/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/changelog$',
        views.ResourceChangelogEntry(permitted_methods=('GET',)),
        name='wirecloud_catalogue.resource_changelog_entry'),
    url(r'^resource/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/userguide$',
        views.ResourceDocumentationEntry(permitted_methods=('GET',)),
        name='wirecloud_catalogue.resource_userguide_entry'),
    url(r'^resource/(?P<vendor>[^/]+)/(?P<name>[^/]+)$',
        views.ResourceEntry(permitted_methods=('DELETE',)),
        name='wirecloud_catalogue.resource_versions_collection'),
    url(r'^resources$',
        views.ResourceCollection(permitted_methods=('GET', 'POST',)),
        name='wirecloud_catalogue.resource_collection'),

    # version check
    url(r'^versions',
        views.ResourceVersionCollection(permitted_methods=('POST',)),
        name='wirecloud_catalogue.resource_versions'),

    url(r'^media/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/(?P<file_path>.*)',
        views.serve_catalogue_media,
        name='wirecloud_catalogue.media'),

)
