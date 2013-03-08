# -*- coding: utf-8 -*-

# Copyright 2013 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

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


import os

from django.core.urlresolvers import reverse
from django.test import Client
from django.utils import simplejson

import wirecloud.commons.test
from wirecloud.commons.test import LocalDownloader, WirecloudTestCase
from wirecloud.commons.utils import downloader
from wirecloud.platform.models import Workspace


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


class ApplicationMashupAPI(WirecloudTestCase):

    fixtures = ('selenium_test_data',)
    tags = ('rest_api',)

    @classmethod
    def setUpClass(cls):
        super(ApplicationMashupAPI, cls).setUpClass()

        cls.client = Client()
        cls._original_download_function = staticmethod(downloader.download_http_content)
        downloader.download_http_content = LocalDownloader({
            'http': {
                'localhost:8001': os.path.join(os.path.dirname(wirecloud.commons.test.__file__), 'test-data', 'src'),
            },
        })

    @classmethod
    def tearDownClass(cls):

        downloader.download_http_content = cls._original_download_function

    def test_features(self):

        url = reverse('wirecloud.features')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_workspace_collection_read_requires_authentication(self):

        url = reverse('wirecloud.workspace_collection')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)

    def test_workspace_collection_read(self):

        url = reverse('wirecloud.workspace_collection')

        self.client.login(username='admin', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, list))
        self.assertTrue(isinstance(response_data[0], dict))

    def test_workspace_collection_post_requires_authentication(self):

        url = reverse('wirecloud.workspace_collection')

        data = {
            'name': 'test',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Error response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

        # Workspace should be not created
        self.assertFalse(Workspace.objects.filter(name='test').exists())

        # Check using Accept: text/html
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Content type of the response should be text/html
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    def test_workspace_collection_post(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        data = {
            'name': 'test',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        # Check basic response structure
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['name'], 'test')

        # Workspace should be created
        self.assertTrue(Workspace.objects.filter(creator=1, name='test').exists())

    def test_workspace_collection_post_conflict(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'name': 'ExistingWorkspace',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 409)

    def test_workspace_collection_post_creation_from_mashup(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup/1.0',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        # Check basic response structure
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['name'], 'Test Mashup')

        # Workspace should be created
        self.assertTrue(Workspace.objects.filter(creator=2, name='Test Mashup').exists())
