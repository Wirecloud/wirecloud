# -*- coding: utf-8 -*-

# Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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
from django.views.decorators.cache import cache_page

from wirecloud.oauth2provider import views
from wirecloud.platform.core.plugins import get_version_hash

urlpatterns = (

    url('^.well-known/oauth$',
        cache_page(7 * 24 * 60 * 60, key_prefix='well-known-oauth-%s' % get_version_hash())(views.oauth_discovery),
        name='oauth.discovery'),
    url('^oauth2/auth$',
        views.provide_authorization_code,
        name='oauth2provider.auth'),
    url('^oauth2/token$',
        views.provide_authorization_token,
        name='oauth2provider.token'),

)
