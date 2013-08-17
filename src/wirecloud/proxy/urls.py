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


try:
    from django.conf.urls import patterns, url
except ImportError:  # pragma: no cover
    # for Django version less than 1.4
    from django.conf.urls.defaults import patterns, url
from wirecloud.proxy.views import proxy_request


urlpatterns = patterns('wirecloud.proxy.views',
    url(r'^/(?P<protocol>[^/]+)/(?P<domain>[^/]+)(?P<path>|/.*)$',
        proxy_request,
        name="wirecloud.proxy"
    ),
)
