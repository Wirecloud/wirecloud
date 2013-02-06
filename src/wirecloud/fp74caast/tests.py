from django.conf import settings
from django.core.urlresolvers import reverse
from django.test import TestCase, Client
from django.utils import unittest


if 'wirecloud.fp74caast' in settings.INSTALLED_APPS:
    # Only import 4caast models if the django app is installed
    from wirecloud.fp74caast.models import Profile4CaaSt


@unittest.skipIf(not 'wirecloud.fp74caast' in settings.INSTALLED_APPS, '4CaaSt support not enabled')
class FP74CaastTests(TestCase):

    fixtures = ('4caast_test_data',)

    @unittest.skip('wip tests')
    def test_add_tenant(self):

        client = Client()

        url = reverse('')
        response = client.get('/4caast-enabling/add_tenant?4caastID=', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)

        # Check user exists
        User.object.filter(username='').exists()

    @unittest.skip('wip tests')
    def test_remove_tenant(self):

        client = Client()

        response = client.get('/4caast-enabling/remove_tenant?4caastID=', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)

    @unittest.skip('wip tests')
    def test_ac_deployment(self):

        client = Client()

        # Mashups/Widgets/Operators ...
        response = client.get('/4caast-enabling/remove_tenant?4caastID=', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)

    # moritoring probe
    # accounting probe (proxy

    def test_saas_enabling(self):

        client = Client()

        url = reverse('wirecloud.4caast.add_saas_tenant', kwargs={'creator': '4caast_developer2', 'workspace': 'Workspace'})
        response = client.get(url + '?message=org.4caast.customers.tourist5.services.app55366', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
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

        client = Client()

        url = reverse('wirecloud.4caast.remove_saas_tenant', kwargs={'creator': '4caast_developer', 'workspace': 'Workspace'})
        response = client.get(url + '?message=org.4caast.customers.4caast_customer.services.app55365', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 204)

        # Check user does not exist
        db_filter = {
            'user_workspace__user__username': '4caast_customer',
            'user_workspace__workspace__creator__username': '4caast_developer',
            'user_workspace__workspace__name': 'Workspace',
            'id_4CaaSt': 'org.4caast.customers.4caast_customer.services.app55365',
        }
        self.assertFalse(Profile4CaaSt.objects.filter(**db_filter).exists())
