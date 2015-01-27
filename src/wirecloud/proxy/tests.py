# -*- coding: utf-8 -*-

# Copyright (c) 2011-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import unicode_literals

import json
import requests

from django.conf import settings
from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.test import Client
from django.utils import unittest
from django.utils.importlib import import_module

from wirecloud.commons.utils.testcases import DynamicWebServer, WirecloudTestCase
from wirecloud.platform.models import Variable
from wirecloud.platform.plugins import clear_cache
from wirecloud.platform.workspace.utils import set_variable_value


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


class ProxyTestsBase(WirecloudTestCase):

    fixtures = ('test_data.json',)
    tags = ('proxy',)

    servers = {
        'http': {
            'example.com': DynamicWebServer(),
        },
    }

    @classmethod
    def setUpClass(cls):

        super(ProxyTestsBase, cls).setUpClass()
        cls.basic_url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/path'})
        cls.OLD_WIRECLOUD_PLUGINS = getattr(settings, 'WIRECLOUD_PLUGINS', None)
        clear_cache()
        settings.WIRECLOUD_PLUGINS = ()

    @classmethod
    def tearDownClass(cls):
        settings.WIRECLOUD_PLUGINS = cls.OLD_WIRECLOUD_PLUGINS
        clear_cache()

        super(ProxyTestsBase, cls).tearDownClass()

    def setUp(self):
        self.network._servers['http']['example.com'].clear()
        cache.clear()

        super(ProxyTestsBase, self).setUp()

    def read_response(self, response):

        if getattr(response, 'streaming', False) is True:
            return b"".join(response.streaming_content)
        else:
            return response.content

    def get_response_headers(self, response):
        headers = {}
        for header_name, header_value in response._headers.values():
            headers[header_name] = header_value
        return headers


class ProxyTests(ProxyTestsBase):

    def test_request_with_bad_referer_header(self):

        client = Client()

        engine = import_module(settings.SESSION_ENGINE)
        cookie = engine.SessionStore()
        cookie.save()  # we need to make load() work, or the cookie is worthless
        client.cookies[str(settings.SESSION_COOKIE_NAME)] = cookie.session_key
        client.cookies[str(settings.CSRF_COOKIE_NAME)] = 'TODO'

        # Missing header
        response = client.get(self.basic_url, HTTP_HOST='localhost')
        self.assertEqual(response.status_code, 403)

        # Bad (syntactically) referer header value
        response = client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='@a')
        self.assertEqual(response.status_code, 403)

        # Invalid (but syntactically correct) header value
        response = client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://other.server.com')
        self.assertEqual(response.status_code, 403)

    def test_request_without_started_session_are_forbidden(self):

        client = Client()

        # Basic GET request
        self.network._servers['http']['example.com'].add_response('GET', '/path', {'content': 'data'})
        response = client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 403)

    def test_basic_anonymous_proxy_requests(self):

        client = Client()

        # Create an anonymous session
        engine = import_module(settings.SESSION_ENGINE)
        cookie = engine.SessionStore()
        cookie.save()  # we need to make load() work, or the cookie is worthless
        client.cookies[str(settings.SESSION_COOKIE_NAME)] = cookie.session_key
        client.cookies[str(settings.CSRF_COOKIE_NAME)] = 'TODO'

        self.check_basic_requests(client)

    def test_basic_proxy_requests(self):

        client = Client()
        client.login(username='test', password='test')

        self.check_basic_requests(client)

    def check_basic_requests(self, client):
        def echo_headers_response(method, url, *args, **kwargs):
            data = kwargs['data'].read()
            if method == 'GET':
                valid = data == b''
            elif method == 'POST':
                valid = data == b'{}'
            else:
                valid = False

            if not valid:
                return {'status_code': 400}

            body = json.dumps(kwargs['headers'])
            return {
                'headers': {
                    'Content-Type': 'application/json',
                    'Content-Length': len(body),
                },
                'content': body,
                'reason_phrase': 'CUSTOM REASON',
            }

        # Basic GET request
        expected_response_headers = {
            'Content-Type': 'application/json',
            'Content-Length': '151',
            'Via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
        }

        expected_response_body = {
            'referer': 'http://localhost',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'x-forwarded-host': 'example.com'
        }

        self.network._servers['http']['example.com'].add_response('GET', '/path', echo_headers_response)
        # Using "request" to work around https://code.djangoproject.com/ticket/20596
        response = client.request(PATH_INFO=self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)
        if 'reason_phrase' in response:
            self.assertEqual(response.reason_phrase, 'CUSTOM REASON')
        self.assertEqual(self.get_response_headers(response), expected_response_headers)
        self.assertEqual(json.loads(self.read_response(response).decode('utf8')), expected_response_body)

        # Basic POST request
        expected_response_headers = {
            'Content-Type': 'application/json',
            'Content-Length': '208',
            'Via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
        }

        expected_response_body = {
            'content-length': 2,
            'content-type': 'application/json',
            'referer': 'http://localhost',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'x-forwarded-host': 'example.com'
        }

        self.network._servers['http']['example.com'].add_response('POST', '/path', echo_headers_response)
        response = client.post(self.basic_url, data='{}', content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.get_response_headers(response), expected_response_headers)
        self.assertEqual(json.loads(self.read_response(response).decode('utf8')), expected_response_body)

        # Http Error 404
        url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/non_existing_file.html'})
        response = client.get(url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.read_response(response), b'')

    def test_connection_refused(self):

        client = Client()
        client.login(username='test', password='test')

        # Simulating an error connecting to the servers
        def refuse_connection(method, url, *args, **kwargs):
            raise requests.exceptions.ConnectionError()

        self.network._servers['http']['example.com'].add_response('GET', '/path', refuse_connection)
        response = client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 502)
        self.assertEqual(self.read_response(response), b'')

    def test_connection_badstatusline(self):

        client = Client()
        client.login(username='test', password='test')

        # Simulating bad response from server
        def bad_response(method, url, *args, **kwargs):
            raise requests.exceptions.HTTPError()

        self.network._servers['http']['example.com'].add_response('GET', '/path', bad_response)
        response = client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 504)
        self.assertEqual(self.read_response(response), b'')

    def test_encoded_urls(self):

        client = Client()
        client.login(username='test', password='test')

        self.network._servers['http']['example.com'].add_response('GET', '/ca%C3%B1on', {'content': 'data'})

        url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/ca%C3%B1on'})
        response = client.get(url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.read_response(response), b'data')

        # We need to append the path because the reverse method encodes the url
        url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/'}) + 'cañon'
        response = client.get(url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.read_response(response), b'data')

    def test_cookies(self):

        client = Client()
        client.login(username='test', password='test')
        client.cookies[str('test')] = 'test'

        def cookie_response(method, url, *args, **kwargs):
            if 'Cookie' in kwargs['headers']:
                return {'content': kwargs['headers']['Cookie'], 'headers': {'Set-Cookie': 'newcookie1=test; path=/, newcookie2=val1; path=/abc/d, newcookie3=c'}}
            else:
                return {'status_code': 404}

        self.network._servers['http']['example.com'].add_response('GET', '/path', cookie_response)
        response = client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.read_response(response), b'test=test')

        self.assertTrue('newcookie1' in response.cookies)
        self.assertEqual(response.cookies[str('newcookie1')].value, 'test')
        cookie_path = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/'})
        self.assertEqual(response.cookies[str('newcookie1')]['path'], cookie_path)

        self.assertTrue('newcookie2' in response.cookies)
        self.assertEqual(response.cookies[str('newcookie2')].value, 'val1')
        cookie_path = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/abc/d'})
        self.assertEqual(response.cookies[str('newcookie2')]['path'], cookie_path)

        self.assertTrue('newcookie3' in response.cookies)
        self.assertEqual(response.cookies[str('newcookie3')].value, 'c')
        cookie_path = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/path'})
        self.assertEqual(response.cookies[str('newcookie3')]['path'], cookie_path)


class ProxySecureDataTests(ProxyTestsBase):

    tags = ('proxy', 'proxy-secure-data')

    def setUp(self):
        super(ProxySecureDataTests, self).setUp()

        self.client = Client()

    def test_secure_data(self):

        set_variable_value(1, 'test_password')
        self.assertTrue(Variable.objects.get(pk=1).value != 'test_password')

        self.client.login(username='test', password='test')

        def echo_response(method, url, *args, **kwargs):
            return {'status_code': 200, 'content': kwargs['data'].read()}

        self.network._servers['http']['example.com'].add_response('POST', '/path', echo_response)
        pass_ref = '1/password'
        user_ref = '1/username'
        secure_data_header = 'action=data, substr=|password|, var_ref=' + pass_ref
        secure_data_header += '&action=data, substr=|username|, var_ref=' + user_ref
        response = self.client.post(self.basic_url,
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost',
                            HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.read_response(response), b'username=test_username&password=test_password')

        secure_data_header = 'action=basic_auth, user_ref=' + user_ref + ', pass_ref=' + pass_ref
        response = self.client.post(self.basic_url,
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost',
                            HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.read_response(response), b'username=|username|&password=|password|')

        # Secure data header using constants
        secure_data_header = 'action=data, substr=|password|, var_ref=c/test_password'
        secure_data_header += '&action=data, substr=|username|, var_ref=c/test_username'
        response = self.client.post(self.basic_url,
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost',
                            HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.read_response(response), b'username=test_username&password=test_password')

        # Secure data header using encoding=url
        secure_data_header = 'action=data, substr=|password|, var_ref=c%2Fa%3D%2C%20z , encoding=url'
        secure_data_header += '&action=data, substr=|username|, var_ref=c%2Fa%3D%2C%20z'
        response = self.client.post(self.basic_url,
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost',
                            HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.read_response(response), b'username=a=, z&password=a%3D%2C%20z')

        # Secure data header using encoding=base64
        secure_data_header = 'action=data, substr=|password|, var_ref=1/password, encoding=base64'
        response = self.client.post(self.basic_url,
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost',
                            HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.read_response(response), b'username=|username|&password=dGVzdF9wYXNzd29yZA=')

    def check_invalid_ref(self, invalid_ref):

        secure_data_header = 'action=data, substr=|password|, var_ref=' + invalid_ref
        response = self.client.post(self.basic_url,
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_ACCEPT='application/json',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost',
                            HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header)

        self.assertEqual(response.status_code, 422)
        response_data = json.loads(response.content)
        self.assertNotEqual(response_data['description'], '')

    def test_secure_data_invalid_var_ref(self):

        self.client.login(username='test', password='test')

        def echo_response(method, url, *args, **kwargs):
            return {'status_code': 200, 'content': kwargs['data'].read()}

        self.network._servers['http']['example.com'].add_response('POST', '/path', echo_response)
        for ref in ('666/inexitent', 'adfasdf', 'a/b/c'):
            self.check_invalid_ref(ref)

    def test_secure_data_missing_parameters(self):

        self.client.login(username='test', password='test')

        def echo_response(method, url, *args, **kwargs):
            return {'status_code': 200, 'content': kwargs['data'].read()}

        self.network._servers['http']['example.com'].add_response('POST', '/path', echo_response)
        # Secure data header with empty parameters
        secure_data_header = 'action=basic_auth, user_ref=, pass_ref='
        response = self.client.post(self.basic_url,
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost',
                            HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header)

        self.assertEqual(response.status_code, 422)

        # Secure data header missing parameters
        secure_data_header = 'action=basic_auth'
        response = self.client.post(self.basic_url,
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost',
                            HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header)

        self.assertEqual(response.status_code, 422)

    def test_secure_data_using_cookies(self):

        set_variable_value(1, 'test_password')
        self.assertTrue(Variable.objects.get(pk=1).value != 'test_password')

        self.client.login(username='test', password='test')

        def echo_response(method, url, *args, **kwargs):
            return {'status_code': 200, 'content': kwargs['data'].read()}

        self.network._servers['http']['example.com'].add_response('POST', '/path', echo_response)
        pass_ref = '1/password'
        user_ref = '1/username'
        secure_data_header = 'action=data, substr=|password|, var_ref=' + pass_ref
        secure_data_header += '&action=data, substr=|username|, var_ref=' + user_ref
        self.client.cookies[str('X-WireCloud-Secure-Data')] = secure_data_header
        response = self.client.post(self.basic_url,
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.read_response(response), b'username=test_username&password=test_password')

        secure_data_header = 'action=basic_auth, user_ref=' + user_ref + ', pass_ref=' + pass_ref
        self.client.cookies[str('X-WireCloud-Secure-Data')] = secure_data_header
        response = self.client.post(self.basic_url,
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.read_response(response), b'username=|username|&password=|password|')

        # Secure data header with empty parameters
        secure_data_header = 'action=basic_auth, user_ref=, pass_ref='
        self.client.cookies[str('X-WireCloud-Secure-Data')] = secure_data_header
        response = self.client.post(self.basic_url,
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost')

        self.assertEqual(response.status_code, 200)
