# -*- coding: utf-8 -*-

# Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.conf.urls import patterns, url
from django.views.generic.base import TemplateView

from wirecloud.fiware.marketAdaptor import views


urlpatterns = patterns('wirecloud.fiware.marketAdaptor.views',
    url(r'^marketplace/(?P<market_user>[\w -]+)/(?P<market_name>[\w -]+)/resources/?$',
        views.AllStoresServiceCollection(permitted_methods=('GET',)),
        name='wirecloud.fiware.market_resource_collection'),
    url(r'^marketplace/(?P<market_user>[\w -]+)/(?P<market_name>[\w -]+)/(?P<store>[\w -]+)/resources/?$',
        views.ServiceCollection(permitted_methods=('GET',)),
        name='wirecloud.fiware.store_resource_collection'),
    url(r'^marketplace/(?P<market_user>[\w -]+)/(?P<market_name>[\w -]+)/(?P<store>[\w -]+)/offering/(?P<offering_id>[^/]+)$',
        views.ServiceEntry(permitted_methods=('GET',)),
        name='wirecloud.fiware.market_offering_entry'),
    url(r'^marketplace/(?P<market_user>[\w -]+)/(?P<market_name>[\w -]+)/search/(?P<search_string>[\w -]+)/?$',
        views.ServiceSearchCollection(permitted_methods=('GET',)),
        name='wirecloud.fiware.market_full_search'),
    url(r'^marketplace/(?P<market_user>[\w -]+)/(?P<market_name>[\w -]+)/search/(?P<store>[\w -]+)/(?P<search_string>[\w -]+)/?$',
        views.ServiceSearchCollection(permitted_methods=('GET',)),
        name='wirecloud.fiware.store_search'),
    url(r'^marketplace/(?P<market_user>[\w -]+)/(?P<market_name>[\w -]+)/stores/?$',
        views.StoreCollection(permitted_methods=('GET',)),
        name='wirecloud.fiware.store_collection'),
    url(r'^marketplace/(?P<market_user>[\w -]+)/(?P<market_name>[\w -]+)/store/(?P<store>[\w -]+)/start_purchase/?$',
        'start_purchase',
        name='wirecloud.fiware.store_start_purchase'),
    url(r'^fiware/redirect_uri$',
        TemplateView.as_view(template_name='wirecloud/fiware/store/buy_success.html'),
        name='wirecloud.fiware.store_redirect_uri'),
)
