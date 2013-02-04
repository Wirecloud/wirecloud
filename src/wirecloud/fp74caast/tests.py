from django.core.urlresolvers import reverse
from django.test import TestCase, Client
from django.utils import unittest


@unittest.skip('wip tests')
class ProxyTests(TestCase):

    def test_add_tenant(self):

        client = Client()

        url = reverse()
        response = client.get('/4caast-enabling/add_tenant?4caastID=', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)

        #Check user exists
        User.object.filter(username='').exists()

    def test_remove_tenant(self):

        client = Client()

        response = client.get('/4caast-enabling/remove_tenant?4caastID=', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)


    def test_ac_deployment(self):

        client = Client()

        # Mashups/Widgets/Operators ...
        response = client.get('/4caast-enabling/remove_tenant?4caastID=', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)

    # moritoring probe
    # accounting probe (proxy

    def test_saas_enabling(self):

        client = Client()
        response = client.get('/4caast-enabling/remove_tenant?4caastID=', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)

    def test_saas_disabling(self):

        client = Client()
        response = client.get('/4caast-enabling/remove_tenant?4caastID=', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)
