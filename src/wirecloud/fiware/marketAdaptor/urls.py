# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecluod.

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
from django.views.generic.base import TemplateView
from wirecloud.fiware.marketAdaptor import views

urlpatterns = patterns('wirecloud.fiware.marketAdaptor.views',
    url(r'^marketplace/(?P<market_user>[\w -]+)/(?P<market_name>[\w -]+)/resources/?$',
        views.AllStoresServiceCollection(permitted_methods=('GET',)),
        name='wirecloud.fiware.market_resource_collection'),
    url(r'^marketplace/(?P<market_user>[\w -]+)/(?P<market_name>[\w -]+)/(?P<store>[\w -]+)/resources/?$',
        views.ServiceCollection(permitted_methods=('GET',)),
        name='wirecloud.fiware.store_resource_collection'),
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
