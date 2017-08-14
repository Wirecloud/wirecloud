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

from django.conf.urls import patterns, url


urlpatterns = patterns(

    'wirecloud.fp74caast.views',

    url(r'^api/4caast-enabling/add_tenant$',
        'add_tenant',
        name='wirecloud.4caast.add_tenant'),

    url(r'^api/4caast-enabling/remove_tenant$',
        'remove_tenant',
        name='wirecloud.4caast.remove_tenant'),

    url(r'^api/4caast-enabling/deploy_tenant_ac$',
        'deploy_tenant_ac',
        name='wirecloud.4caast.deploy_tenant_ac'),

    url(r'^api/4caast-enabling/undeploy_tenant_ac$',
        'undeploy_tenant_ac',
        name='wirecloud.4caast.undeploy_tenant_ac'),

    url(r'^(?P<owner>[^/]+)/(?P<workspace>[^/]+)/4caast-enabling/add_saas_tenant$',
        'add_saas_tenant',
        name='wirecloud.4caast.add_saas_tenant'),

    url(r'^(?P<owner>[^/]+)/(?P<workspace>[^/]+)/4caast-enabling/remove_saas_tenant$',
        'remove_saas_tenant',
        name='wirecloud.4caast.remove_saas_tenant'),
)
