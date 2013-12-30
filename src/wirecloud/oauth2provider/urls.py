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

from django.conf.urls import patterns, include, url
from django.views.decorators.cache import cache_page
from django.views.generic import TemplateView

from wirecloud.oauth2provider.views import oauth_discovery

urlpatterns = patterns('wirecloud.oauth2provider.views',

    url('^.well-known/oauth$', cache_page(7 * 24 * 60 * 60)(oauth_discovery), name='oauth2provider.discovery'),
    url('^oauth2/auth$', 'provide_authorization_code', name='oauth2provider.auth'),
    url('^oauth2/token$', 'provide_authorization_token', name='oauth2provider.token'),
    url('^oauth2/default_redirect_uri$',
        TemplateView.as_view(template_name='wirecloud/oauth2provider/default_redirect_uri.html'),
        name='oauth2provider.default_redirect_uri'),

)
