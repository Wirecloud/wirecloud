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


from django.conf.urls.defaults import patterns, url
from marketAdaptor import views

urlpatterns = patterns('marketAdaptor.views',
    url(r'^marketplace/(?P<marketplace>[\w -]+)/resources/?$', views.AllStoresServiceCollection(permitted_methods=('GET',))),
    url(r'^marketplace/(?P<marketplace>[\w -]+)/(?P<store>[\w -]+)/resources/?$', views.ServiceCollection(permitted_methods=('GET', 'POST'))),
    url(r'^marketplace/(?P<marketplace>[\w -]+)/search/(?P<keyword>[\w -]+)/?$', views.ServiceSearchCollection(permitted_methods=('GET',))),
    url(r'^marketplace/(?P<marketplace>[\w -]+)/search/(?P<store>[\w -]+)/(?P<keyword>[\w -]+)/?$', views.ServiceSearchCollection(permitted_methods=('GET',))),
    url(r'^marketplace/(?P<marketplace>[\w -]+)/stores/?$', views.StoreCollection(permitted_methods=('GET', 'POST'))),
    url(r'^marketplace/(?P<marketplace>[\w -]+)/stores/(?P<store>[\w -]+)/?$', views.StoreEntry(permitted_methods=('DELETE',))),
    url(r'^marketplace/(?P<marketplace>[\w -]+)/(?P<store>[\w -]+)/(?P<service_name>[\w -]+)/?$', views.ServiceEntry(permitted_methods=('DELETE',)))
)
