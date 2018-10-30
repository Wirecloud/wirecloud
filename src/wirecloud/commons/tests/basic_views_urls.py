# -*- coding: utf-8 -*-

# Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.conf.urls import include, url
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse

import wirecloud.platform.urls
from wirecloud.commons import authentication as wc_auth


def valid(request):
    return HttpResponse


def forbidden(request):
    raise PermissionDenied


def server_error(request):
    raise Exception


admin.autodiscover()

urlpatterns = (

    # Catalogue
    url(r'^catalogue', include('wirecloud.catalogue.urls')),

    # Proxy
    url(r'^cdp', include('wirecloud.proxy.urls')),

    # Login/logout
    url(r'^login/?$', auth_views.login, name="login"),
    url(r'^logout/?$', wc_auth.logout, name="logout"),

    # Admin interface
    url(r'^admin/', include(admin.site.urls)),

    # Test views
    url('valid_path', valid, name="valid_path"),
    url('forbidden_path', forbidden, name="forbidden_path"),
    url('server_error_path', server_error, name="server_error_path"),
)
urlpatterns += wirecloud.platform.urls.urlpatterns
urlpatterns += tuple(staticfiles_urlpatterns())

handler400 = "wirecloud.commons.views.bad_request"
handler403 = "wirecloud.commons.views.permission_denied"
handler404 = "wirecloud.commons.views.page_not_found"
handler500 = "wirecloud.commons.views.server_error"
