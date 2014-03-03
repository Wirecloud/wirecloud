# -*- coding: utf-8 -*-

# Copyright (c) 2013-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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


from lxml import etree
from cStringIO import StringIO

from django.conf import settings
from django.core.urlresolvers import reverse
from django.test.client import RequestFactory
from django.test import Client
from django.utils import unittest

from wirecloud.commons.utils.http import get_absolute_reverse_url
from wirecloud.commons.utils.testcases import WirecloudTestCase


class BasicViewsAPI(WirecloudTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('base_views',)

    def setUp(self):
        super(BasicViewsAPI, self).setUp()

        self.client = Client()

    @classmethod
    def setUpClass(cls):
        super(BasicViewsAPI, cls).setUpClass()
        factory = RequestFactory()
        request = factory.get(reverse('login'))
        cls.login_url = get_absolute_reverse_url('login', request=request)

    def test_workspace_view_redirects_to_login(self):

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'ExistingWorkspace'})

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 302)
        self.assertIn('Location', response)
        self.assertTrue(response['Location'].startswith(self.login_url))

    def test_workspace_view_check_permissions(self):

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'ExistingWorkspace'})

        # Authenticate
        self.client.login(username='emptyuser', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/xhtml+xml')

        parser = etree.XMLParser(encoding='utf-8')
        etree.parse(StringIO(response.content), parser)

    def test_workspace_view_handles_not_found(self):

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'noexistent_user', 'name': 'NonexistingWorkspace'})

        # Authenticate
        self.client.login(username='emptyuser', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

        parser = etree.XMLParser(encoding='utf-8')
        etree.parse(StringIO(response.content), parser)

    def test_workspace_view_handles_bad_view_value(self):

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'ExistingWorkspace'}) + '?mode=noexistent&a=b'

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 302)
        self.assertIn('Location', response)
        self.assertTrue(response['Location'].endswith('?a=b'))

    @unittest.skipIf(settings.ALLOW_ANONYMOUS_ACCESS is False, 'Anonymous access disabled')
    def test_root_view_anonymous_allowed(self):

        url = reverse('wirecloud.root')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 200)

    @unittest.skipIf(settings.ALLOW_ANONYMOUS_ACCESS is True, 'Anonymous access enabled')
    def test_root_view_anonymous_not_allowed(self):

        url = reverse('wirecloud.root')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response['Location'].startswith(self.login_url))
