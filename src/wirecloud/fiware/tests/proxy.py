# -*- coding: utf-8 -*-

# Copyright (c) 2014-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.conf import settings
from django.core.urlresolvers import reverse
from django.test import Client
from django.utils import unittest
from django.utils.importlib import import_module

from wirecloud.commons.utils.testcases import WirecloudTestCase
from wirecloud.fiware.plugins import IDM_SUPPORT_ENABLED


TEST_TOKEN = 'yLCdDImTd6V5xegxyaQjBvC8ENRziFchYKXN0ur1y__uQ2ig3uIEaP6nJ0WxiRWGyCKquPQQmTIlhhYCMQWPXg'
TEST_WORKSPACE_TOKEN = 'rtHdDImTd6V5xegxyaQjBvC8ENRziFchYKXN0ur1y..uQ2ig3uIEaP6nJ0WxiRWGyCKquPQQmTIlhhYCMQWPx6'


@unittest.skipIf(not IDM_SUPPORT_ENABLED, 'FIWARE IdM support not available')
class ProxyTestCase(WirecloudTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces', 'fiware_proxy_test_data')
    tags = ('fiware-proxy', 'proxy')

    @classmethod
    def setUpClass(cls):

        super(ProxyTestCase, cls).setUpClass()

        def echo_headers_response(method, url, *args, **kwargs):
            body = json.dumps(kwargs['headers'])
            return {
                'headers': {
                    'Content-Type': 'application/json',
                    'Content-Length': len(body),
                },
                'content': body,
            }

        cls.echo_headers_response = echo_headers_response

    def read_response(self, response):

        if getattr(response, 'streaming', False) is True:
            return "".join(response.streaming_content)
        else:
            return response.content

    def test_fiware_idm_processor_header(self):

        self.network._servers['http']['example.com'].add_response('POST', '/path', self.echo_headers_response)
        url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/path'})

        client = Client()
        client.login(username='admin', password='admin')
        response = client.post(url, data='{}', content_type='application/json',
                HTTP_HOST='localhost',
                HTTP_REFERER='http://localhost/user_with_workspaces/Public Workspace',
                HTTP_X_FI_WARE_OAUTH_TOKEN='true',
                HTTP_X_FI_WARE_OAUTH_HEADER_NAME='X-Auth-Token')
        self.assertEqual(response.status_code, 200)
        headers = json.loads(self.read_response(response))
        self.assertIn('X-Auth-Token', headers)
        self.assertEqual(headers['X-Auth-Token'], TEST_TOKEN)

    def test_fiware_idm_processor_body(self):

        def echo_response(method, url, *args, **kwargs):
            self.assertEqual(int(kwargs['headers']['content-length']), 99) # Content Length after token injection
            return {'content': kwargs['data'].read()}

        self.network._servers['http']['example.com'].add_response('POST', '/path', echo_response)
        url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/path'})

        client = Client()
        client.login(username='admin', password='admin')
        response = client.post(url, data='{"token": "%token%"}', content_type='application/json',
                HTTP_HOST='localhost',
                HTTP_REFERER='http://localhost/user_with_workspaces/Public Workspace',
                HTTP_X_FI_WARE_OAUTH_TOKEN='true',
                HTTP_X_FI_WARE_OAUTH_TOKEN_BODY_PATTERN='%token%')
        self.assertEqual(response.status_code, 200)
        data = json.loads(self.read_response(response))
        self.assertEqual(data['token'], TEST_TOKEN)

    def test_fiware_idm_anonymous_user(self):

        self.network._servers['http']['example.com'].add_response('POST', '/path', self.echo_headers_response)
        url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/path'})

        client = Client()

        # Create an anonymous session
        engine = import_module(settings.SESSION_ENGINE)
        cookie = engine.SessionStore()
        cookie.save()  # we need to make load() work, or the cookie is worthless
        client.cookies[str(settings.SESSION_COOKIE_NAME)] = cookie.session_key
        client.cookies[str(settings.CSRF_COOKIE_NAME)] = 'TODO'

        # Make the request
        response = client.post(url, data='{}', content_type='application/json',
                HTTP_ACCEPT='application/json',
                HTTP_HOST='localhost',
                HTTP_REFERER='http://localhost/user_with_workspaces/Public Workspace',
                HTTP_X_FI_WARE_OAUTH_TOKEN='true',
                HTTP_X_FI_WARE_OAUTH_HEADER_NAME='X-Auth-Token')
        self.assertEqual(response.status_code, 422)
        json.loads(self.read_response(response))

    def test_fiware_idm_processor_requires_valid_referer(self):

        self.network._servers['http']['example.com'].add_response('POST', '/path', self.echo_headers_response)
        proxied_url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/path'})

        client = Client()
        client.login(username='admin', password='admin')
        response = client.post(proxied_url, data='{}', content_type='application/json',
                HTTP_ACCEPT='application/json',
                HTTP_HOST='localhost',
                HTTP_REFERER='http://localhost' + proxied_url,
                HTTP_X_FI_WARE_OAUTH_TOKEN='true',
                HTTP_X_FI_WARE_OAUTH_HEADER_NAME='X-Auth-Token')
        self.assertEqual(response.status_code, 422)
        json.loads(self.read_response(response))

    def test_fiware_idm_no_token_available(self):

        self.network._servers['http']['example.com'].add_response('POST', '/path', self.echo_headers_response)
        url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/path'})

        client = Client()
        client.login(username='normuser', password='admin')

        # Make the request
        response = client.post(url, data='{}', content_type='application/json',
                HTTP_ACCEPT='application/json',
                HTTP_HOST='localhost',
                HTTP_REFERER='http://localhost/user_with_workspaces/Public Workspace',
                HTTP_X_FI_WARE_OAUTH_TOKEN='true',
                HTTP_X_FI_WARE_OAUTH_HEADER_NAME='X-Auth-Token')
        self.assertEqual(response.status_code, 422)
        json.loads(self.read_response(response))

    def test_fiware_idm_token_from_workspace_owner_header(self):

        self.network._servers['http']['example.com'].add_response('POST', '/path', self.echo_headers_response)
        url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/path'})

        client = Client()
        client.login(username='normuser', password='admin')

        # Make the request
        response = client.post(url, data='{}', content_type='application/json',
                HTTP_ACCEPT='application/json',
                HTTP_HOST='localhost',
                HTTP_REFERER='http://localhost/user_with_workspaces/Public Workspace',
                HTTP_X_FI_WARE_OAUTH_TOKEN='true',
                HTTP_X_FI_WARE_OAUTH_SOURCE='workspaceowner',
                HTTP_X_FI_WARE_OAUTH_HEADER_NAME='X-Auth-Token')
        self.assertEqual(response.status_code, 200)
        request_headers = json.loads(self.read_response(response))
        self.assertIn('X-Auth-Token', request_headers)
        self.assertEqual(request_headers['X-Auth-Token'], TEST_WORKSPACE_TOKEN)

    def test_fiware_idm_token_from_workspace_owner_no_token(self):

        # Remove user_with_workspaces Token
        from django.contrib.auth.models import User
        User.objects.get(username="user_with_workspaces").social_auth.all().delete()

        self.network._servers['http']['example.com'].add_response('POST', '/path', self.echo_headers_response)
        url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/path'})

        client = Client()
        client.login(username='normuser', password='admin')

        # Make the request
        response = client.post(url, data='{}', content_type='application/json',
                HTTP_ACCEPT='application/json',
                HTTP_HOST='localhost',
                HTTP_REFERER='http://localhost/user_with_workspaces/Public Workspace',
                HTTP_X_FI_WARE_OAUTH_TOKEN='true',
                HTTP_X_FI_WARE_OAUTH_SOURCE='workspaceowner',
                HTTP_X_FI_WARE_OAUTH_HEADER_NAME='X-Auth-Token')
        self.assertEqual(response.status_code, 422)
        json.loads(self.read_response(response))

    def test_fiware_idm_token_invalid_source(self):

        url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/path'})

        client = Client()
        client.login(username='normuser', password='admin')

        # Make the request
        response = client.post(url, data='{}', content_type='application/json',
                HTTP_ACCEPT='application/json',
                HTTP_HOST='localhost',
                HTTP_REFERER='http://localhost/user_with_workspaces/Public Workspace',
                HTTP_X_FI_WARE_OAUTH_TOKEN='true',
                HTTP_X_FI_WARE_OAUTH_SOURCE='invalidsource',
                HTTP_X_FI_WARE_OAUTH_HEADER_NAME='X-Auth-Token')
        self.assertEqual(response.status_code, 422)
        json.loads(self.read_response(response))
