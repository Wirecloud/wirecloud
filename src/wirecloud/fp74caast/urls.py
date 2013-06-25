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

from django.conf.urls.defaults import patterns, url
from wirecloud.fp74caast.views import TenantCollection


urlpatterns = patterns('wirecloud.fp74caast.views',

    url(r'^api/4caast-enabling/add_tenant$',
        'add_tenant',
        name='wirecloud.4caast.add_tenant'),

    url(r'^api/4caast-enabling/remove_tenant$',
        'remove_tenant',
        name='wirecloud.4caast.remove_tenant'),

    url(r'^api/4caast-enabling/deploy_tenant_ac$',
        'deploy_tenant_ac',
        name='wirecloud.4caast.deploy_tenant_ac'),

    url(r'^api/4caast-enabling/start_tenant_ac$',
        'start_tenant_ac',
        name='wirecloud.4caast.start_tenant_ac'),

    url(r'^api/4caast-enabling/stop_tenant_ac$',
        'stop_tenant_ac',
        name='wirecloud.4caast.stop_tenant_ac'),

    url(r'^api/4caast-enabling/undeploy_tenant_ac$',
        'undeploy_tenant_ac',
        name='wirecloud.4caast.undeploy_tenant_ac'),

    url(r'^(?P<creator>[^/]+)/(?P<workspace>[^/]+)/4caast-enabling/add_saas_tenant$',
        TenantCollection(permitted_methods=('GET',)),
        name='wirecloud.4caast.add_saas_tenant'),

    url(r'^(?P<creator>[^/]+)/(?P<workspace>[^/]+)/4caast-enabling/remove_saas_tenant$',
        'remove_saas_tenant',
        name='wirecloud.4caast.remove_saas_tenant'),
)
