from django.conf import settings
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.test import TestCase, Client
from django.utils import unittest

from wirecloud.platform.context.utils import get_platform_context_current_values, get_workspace_context_current_values

if 'wirecloud.fp74caast' in settings.INSTALLED_APPS:
    # Only import 4caast models if the django app is installed
    from wirecloud.fp74caast.models import Profile4CaaSt


@unittest.skipIf(not 'wirecloud.fp74caast' in settings.INSTALLED_APPS, '4CaaSt support not enabled')
class FP74CaastTests(TestCase):

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
        self.assertDictContainsSubset({
                'tenant_4CaaSt_id': 'org.4caast.customers.4caast_developer.services.app1',
                'SaaS_tenant_4CaaSt_id': 'org.4caast.customers.4caast_customer.services.app55365'
            }, workspace_context)

        # Check the context variables are empty for normal users
        user = User.objects.get(username='user_with_workspaces')

        platform_context = get_platform_context_current_values(user)
        self.assertNotIn('tenant_4CaaSt_id', platform_context)
        self.assertNotIn('SaaS_tenant_4CaaSt_id', platform_context)

        workspace_context = get_workspace_context_current_values(user.userworkspace_set.get(workspace__name="ExistingWorkspace"))
        self.assertDictContainsSubset({
                'tenant_4CaaSt_id': '',
                'SaaS_tenant_4CaaSt_id': ''
            }, workspace_context)

    def test_add_tenant(self):

        url = reverse('wirecloud.4caast.add_tenant')
        response = self.client.get(url + '?message=org.4caast.customers.developer2.services.app2', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)

        # Check user exists
        self.assertTrue(User.objects.filter(username='developer2').exists())

    def test_remove_tenant(self):

        url = reverse('wirecloud.4caast.remove_tenant')
        response = self.client.get(url + '?message=org.4caast.customers.4caast_developer.services.app1', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 204)

        # Check user does not exist
        self.assertFalse(User.objects.filter(username='developer1').exists())

    @unittest.skip('wip tests')
    def test_ac_deployment(self):

        # Mashups/Widgets/Operators ...
        response = self.client.get('/4caast-enabling/remove_tenant?4caastID=', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)

    # moritoring probe
    # accounting probe (proxy

    def test_saas_enabling(self):

        url = reverse('wirecloud.4caast.add_saas_tenant', kwargs={'creator': '4caast_developer2', 'workspace': 'Workspace'})
        response = self.client.get(url + '?message=org.4caast.customers.tourist5.services.app55366', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 201)

        # Check user exists
        db_filter = {
            'user_workspace__user__username': 'tourist5',
            'user_workspace__workspace__creator__username': '4caast_developer2',
            'user_workspace__workspace__name': 'Workspace',
            'id_4CaaSt': 'org.4caast.customers.tourist5.services.app55366',
        }
        self.assertTrue(Profile4CaaSt.objects.filter(**db_filter).exists())

    def test_saas_disabling(self):

        url = reverse('wirecloud.4caast.remove_saas_tenant', kwargs={'creator': '4caast_developer', 'workspace': 'Workspace'})
        response = self.client.get(url + '?message=org.4caast.customers.4caast_customer.services.app55365', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 204)

        # Check user does not exist
        db_filter = {
            'user_workspace__user__username': '4caast_customer',
            'user_workspace__workspace__creator__username': '4caast_developer',
            'user_workspace__workspace__name': 'Workspace',
            'id_4CaaSt': 'org.4caast.customers.4caast_customer.services.app55365',
        }
        self.assertFalse(Profile4CaaSt.objects.filter(**db_filter).exists())
