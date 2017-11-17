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

import json
import unittest

from django.conf import settings
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.test import Client, TransactionTestCase

from wirecloud.commons.utils.testcases import WirecloudTestCase
from wirecloud.platform.context.utils import get_platform_context_current_values, get_workspace_context_current_values

if 'wirecloud.fp74caast' in settings.INSTALLED_APPS:
    # Only import 4caast models if the django app is installed
    from wirecloud.fp74caast.models import Profile4CaaSt


@unittest.skipIf('wirecloud.fp74caast' not in settings.INSTALLED_APPS, '4CaaSt support not enabled')
class FP74CaastTests(WirecloudTestCase, TransactionTestCase):

    fixtures = ('selenium_test_data', '4caast_test_data')
    tags = ('fp74CaaSt',)

    @classmethod
    def setUpClass(cls):

        super(FP74CaastTests, cls).setUpClass()

        cls.client = Client()

    def test_context(self):

        user = User.objects.get(username='4caast_customer')

        platform_context = get_platform_context_current_values(user)
        self.assertNotIn('tenant_4CaaSt_id', platform_context)
        self.assertNotIn('SaaS_tenant_4CaaSt_id', platform_context)

        workspace_context = get_workspace_context_current_values(user.userworkspace_set.get(workspace__name="Workspace"))
        self.assertDictContainsSubset(
            {
                'tenant_4CaaSt_id': '4caast.customers.4caast_developer.services.app1',
                'SaaS_tenant_4CaaSt_id': '4caast.customers.4caast_customer.services.app55365'
            },
            workspace_context
        )

        # Check the context variables are empty for normal users
        user = User.objects.get(username='user_with_workspaces')

        platform_context = get_platform_context_current_values(user)
        self.assertNotIn('tenant_4CaaSt_id', platform_context)
        self.assertNotIn('SaaS_tenant_4CaaSt_id', platform_context)

        workspace_context = get_workspace_context_current_values(user.userworkspace_set.get(workspace__name="ExistingWorkspace"))
        self.assertDictContainsSubset(
            {
                'tenant_4CaaSt_id': '',
                'SaaS_tenant_4CaaSt_id': ''
            },
            workspace_context
        )

    def test_add_tenant(self):

        url = reverse('wirecloud.4caast.add_tenant')
        response = self.client.post(url, json.dumps({'4CaaStID': '4caast.customers.developer2.services.app2'}), content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)

        # Check user exists
        self.assertTrue(User.objects.filter(username='developer2').exists())
        self.assertEqual(User.objects.get(username='developer2').tenantprofile_4CaaSt.id_4CaaSt, '4caast.customers.developer2.services.app2')

    def test_add_existing_tenant(self):

        url = reverse('wirecloud.4caast.add_tenant')
        response = self.client.post(url, json.dumps({'4CaaStID': '4caast.customers.4caast_developer.services.app1'}), content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.get(username='4caast_developer').tenantprofile_4CaaSt.id_4CaaSt, '4caast.customers.4caast_developer.services.app1')

    def test_remove_tenant(self):

        url = reverse('wirecloud.4caast.remove_tenant')
        response = self.client.post(url, json.dumps({'4CaaStID': '4caast.customers.4caast_developer.services.app1'}), content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 204)

        # Check user does not exist
        self.assertFalse(User.objects.filter(username='developer1').exists())

    def test_ac_deployment(self):

        url = reverse('wirecloud.4caast.deploy_tenant_ac')

        # Add a widget without overwritting preferences
        data = {
            '4CaaStID': '4caast.customers.4caast_developer.services.app1',
            'url': 'http://macs.example.com/Wirecloud_Test_1.0.wgt',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 204)

    def test_mashup_deployment_using_previously_deployed_resources(self):

        url = reverse('wirecloud.4caast.deploy_tenant_ac')

        # Add a widget
        data = {
            '4CaaStID': '4caast.customers.4caast_developer.services.app1',
            'url': 'http://macs.example.com/Wirecloud_Test_Selenium_1.0.wgt',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 204)

        # Deploy a mashup that uses a previously deployed widget
        data = {
            '4CaaStID': '4caast.customers.4caast_developer.services.app1',
            'url': 'http://macs.example.com/Wirecloud_4CaaStMashup_1.0.wgt',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 204)

    def test_ac_deployment_missing_parameter(self):

        url = reverse('wirecloud.4caast.deploy_tenant_ac')

        # Missing url parameter
        response = self.client.post(url, json.dumps({'4CaaStID': '4caast.customers.4caast_developer.services.app1'}), content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 400)

        # Missing 4CaaStID parameter
        response = self.client.post(url, json.dumps({'url': 'http://macs.example.com'}), content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 400)

    # moritoring probe
    # accounting probe (proxy

    def test_saas_enabling(self):

        url = reverse('wirecloud.4caast.add_saas_tenant', kwargs={'owner': '4caast_developer2', 'workspace': 'Workspace'})
        response = self.client.get(url + '?message=4caast.customers.tourist5.services.app55366', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 201)

        # Check user exists
        db_filter = {
            'user_workspace__user__username': 'tourist5',
            'user_workspace__workspace__creator__username': '4caast_developer2',
            'user_workspace__workspace__name': 'Workspace',
            'id_4CaaSt': '4caast.customers.tourist5.services.app55366',
        }
        self.assertTrue(Profile4CaaSt.objects.filter(**db_filter).exists())

    def test_saas_disabling(self):

        url = reverse('wirecloud.4caast.remove_saas_tenant', kwargs={'owner': '4caast_developer', 'workspace': 'Workspace'})
        response = self.client.get(url + '?message=4caast.customers.4caast_customer.services.app55365', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 204)

        # Check user does not exist
        db_filter = {
            'user_workspace__user__username': '4caast_customer',
            'user_workspace__workspace__creator__username': '4caast_developer',
            'user_workspace__workspace__name': 'Workspace',
            'id_4CaaSt': '4caast.customers.4caast_customer.services.app55365',
        }
        self.assertFalse(Profile4CaaSt.objects.filter(**db_filter).exists())
