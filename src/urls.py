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

from django.conf.urls.defaults import patterns, include, url
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.views.decorators.cache import cache_page
from django.views.i18n import javascript_catalog

import wirecloud.platform.urls

admin.autodiscover()

#JavaScript translation
js_info_dict = {
    'packages': ('wirecloud.platform.', )
}

urlpatterns = patterns('',

    # Showcase
    (r'^showcase/', include('wirecloud.platform.widget.showcase_urls')),

    # Catalogue
    (r'^catalogue', include('wirecloud.catalogue.urls')),

    # Proxy
    (r'^proxy', include('wirecloud.proxy.urls')),

    # Login/logout
    url(r'^login/?$', 'django.contrib.auth.views.login', name="login"),
    url(r'^logout/?$', 'wirecloud.commons.authentication.logout', name="logout"),
    url(r'^admin/logout/?$', 'wirecloud.commons.authentication.logout'),

    # Admin interface
    (r'^admin/', include(admin.site.urls)),

    # Django "set language" (internacionalitation)
    (r'^i18n/', include('django.conf.urls.i18n')),

    # Django JavaScript Internacionalitation
    (r'^jsi18n/$', cache_page(60 * 60 * 24)(javascript_catalog), js_info_dict),

    (r'^api/marketAdaptor/', include('wirecloud_fiware.marketAdaptor.urls')),
)

urlpatterns += wirecloud.platform.urls.urlpatterns
urlpatterns += staticfiles_urlpatterns()

handler404 = "django.views.defaults.page_not_found"
handler500 = "wirecloud.commons.views.server_error"
