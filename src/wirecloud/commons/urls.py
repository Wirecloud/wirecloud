# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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
from django.views.generic import TemplateView

from wirecloud.commons import views


urlpatterns = (

    # i18n
    url(r'^api/i18n/', include('django.conf.urls.i18n')),
    url(r'^api/i18n/js_catalogue$',
        views.cached_javascript_catalog,
        name="wirecloud.javascript_translation_catalogue"),

    # OAuth2
    url('^oauth2/default_redirect_uri$',
        TemplateView.as_view(template_name='wirecloud/oauth2/default_redirect_uri.html'),
        name='oauth.default_redirect_uri'),

)
