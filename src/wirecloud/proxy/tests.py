# -*- coding: utf-8 -*-

# Copyright (c) 2011-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

from importlib import import_module
import json
import requests

from django.conf import settings
from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.test import Client, override_settings, TestCase
from django.contrib.auth.models import User

from wirecloud.commons.utils.testcases import DynamicWebServer, WirecloudTestCase
from wirecloud.platform.models import IWidget
from wirecloud.platform.plugins import clear_cache
from wirecloud.platform.workspace.utils import encrypt_value


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


@override_settings(WIRECLOUD_PLUGINS=(), FORCE_PROTO=None, FORCE_DOMAIN=None, FORCE_PORT=None)
class ProxyTestsBase(WirecloudTestCase, TestCase):

    fixtures = ('test_data.json',)
    tags = ('wirecloud-proxy', 'wirecloud-noselenium')
    populate = False
    use_search_indexes = False

    servers = {
        'http': {
            'example.com': DynamicWebServer(),
        },
    }

    @classmethod
    def setUpClass(cls):

        super(ProxyTestsBase, cls).setUpClass()
        cls.basic_url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/path'})
        cls.basic_referer = 'http://localhost/test/workspace'
        clear_cache()

    @classmethod
    def tearDownClass(cls):
        clear_cache()

        super(ProxyTestsBase, cls).tearDownClass()

    def setUp(self):
        self.network._servers['http']['example.com'].clear()
        cache.clear()
        self.client = Client()

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

        engine = import_module(settings.SESSION_ENGINE)
        cookie = engine.SessionStore()
        cookie.save()  # we need to make load() work, or the cookie is worthless
        self.client.cookies[str(settings.SESSION_COOKIE_NAME)] = cookie.session_key
        self.client.cookies[str(settings.CSRF_COOKIE_NAME)] = 'TODO'

        # Missing header
        response = self.client.get(self.basic_url, HTTP_HOST='localhost')
        self.assertEqual(response.status_code, 403)

        # Bad (syntactically) referer header value
        response = self.client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='@a')
        self.assertEqual(response.status_code, 403)

        # Invalid (but syntactically correct) header value
        response = self.client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://other.server.com')
        self.assertEqual(response.status_code, 403)

    def test_request_with_workspace_referer_requires_permission(self):

        self.client.login(username='test', password='test')
        response = self.client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost/test2/workspace')
        self.assertEqual(response.status_code, 403)

    def test_request_without_started_session_are_forbidden(self):

        # Basic GET request
        self.network._servers['http']['example.com'].add_response('GET', '/path', {'content': 'data'})
        response = self.client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost/test/workspace')
        self.assertEqual(response.status_code, 403)

    def test_basic_anonymous_proxy_requests(self):

        # Create an anonymous session
        engine = import_module(settings.SESSION_ENGINE)
        cookie = engine.SessionStore()
        cookie.save()  # we need to make load() work, or the cookie is worthless
        self.client.cookies[str(settings.SESSION_COOKIE_NAME)] = cookie.session_key
        self.client.cookies[str(settings.CSRF_COOKIE_NAME)] = 'TODO'

        self.check_basic_requests('http://localhost/test/publicworkspace')

    def test_basic_proxy_requests(self):

        self.client.login(username='test', password='test')

        self.check_basic_requests('http://localhost/test/publicworkspace')

    def test_basic_proxy_requests_from_widget(self):

        self.client.login(username='test', password='test')

        widget_url = reverse('wirecloud.showcase_media', kwargs={"vendor": "Wirecloud", "name": "Test", "version": "1.0", "file_path": "/index.html"})
        self.check_basic_requests('http://localhost' + widget_url)

    def test_basic_proxy_requests_from_widget_restricted_to_get_post(self):

        self.client.login(username='test', password='test')

        self.network._servers['http']['example.com'].add_response('PUT', '/path', {'content': 'data'})
        widget_url = reverse('wirecloud.showcase_media', kwargs={"vendor": "Wirecloud", "name": "Test", "version": "1.0", "file_path": "/index.html"})
        response = self.client.put(self.basic_url, "{}", content_type="application/json", HTTP_HOST='localhost', HTTP_REFERER='http://localhost' + widget_url)
        self.assertEqual(response.status_code, 403)

    def test_basic_proxy_requests_invalid_referer(self):

        self.client.login(username='test', password='test')

        self.network._servers['http']['example.com'].add_response('PUT', '/path', {'content': 'data'})
        response = self.client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost/')
        self.assertEqual(response.status_code, 403)

    def test_basic_proxy_requests_invalid_schema(self):

        self.client.login(username='test', password='test')

        url = reverse('wirecloud|proxy', kwargs={'protocol': 'invalid', 'domain': 'example.com', 'path': '/path'})
        response = self.client.get(url, HTTP_HOST='localhost', HTTP_REFERER=self.basic_referer)
        self.assertEqual(response.status_code, 422)

    def test_basic_proxy_requests_forbidden_schema(self):

        self.client.login(username='test', password='test')

        url = reverse('wirecloud|proxy', kwargs={'protocol': 'file', 'domain': 'dir', 'path': '/path'})
        response = self.client.get(url, HTTP_HOST='localhost', HTTP_REFERER=self.basic_referer)
        self.assertEqual(response.status_code, 422)

    def test_basic_proxy_requests_from_proxied_content(self):

        self.client.login(username='test', password='test')

        proxied_url = 'http://localhost' + reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/path'})
        self.check_basic_requests(proxied_url)

    def check_basic_requests(self, referer):
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
                'reason': 'CUSTOM REASON',
            }

        # Basic GET request
        expected_response_body = {
            'referer': referer,
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
        }

        expected_response_headers = {
            'Content-Type': 'application/json',
            'Content-Length': "%s" % len(json.dumps(expected_response_body)),
            'Via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
        }

        self.network._servers['http']['example.com'].add_response('GET', '/path', echo_headers_response)
        # Using "request" to work around https://code.djangoproject.com/ticket/20596
        response = self.client.request(PATH_INFO=self.basic_url, HTTP_HOST='localhost', HTTP_REFERER=referer)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.reason_phrase, 'CUSTOM REASON')
        self.assertEqual(self.get_response_headers(response), expected_response_headers)
        self.assertEqual(json.loads(self.read_response(response).decode('utf8')), expected_response_body)

        # Basic POST request
        expected_response_body = {
            'content-length': '2',
            'content-type': 'application/json',
            'referer': referer,
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
        }

        expected_response_headers = {
            'Content-Type': 'application/json',
            'Content-Length': "%s" % len(json.dumps(expected_response_body)),
            'Via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
        }

        self.network._servers['http']['example.com'].add_response('POST', '/path', echo_headers_response)
        response = self.client.post(self.basic_url, data='{}', content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER=referer)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.get_response_headers(response), expected_response_headers)
        self.assertEqual(json.loads(self.read_response(response).decode('utf8')), expected_response_body)

        # Http Error 404
        url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/non_existing_file.html'})
        response = self.client.get(url, HTTP_HOST='localhost', HTTP_REFERER=referer)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.read_response(response), b'')

    def test_connection_error(self):

        self.client.login(username='test', password='test')

        # Simulating an error connecting to the servers
        def refuse_connection(method, url, *args, **kwargs):
            raise requests.exceptions.ConnectionError()

        self.network._servers['http']['example.com'].add_response('GET', '/path', refuse_connection)
        response = self.client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost/test/workspace')
        self.assertEqual(response.status_code, 504)
        self.assertIn('Connection Error', self.read_response(response).decode('utf-8'))

    def test_connection_timeout(self):

        self.client.login(username='test', password='test')

        # Simulating an error connecting to the servers
        def refuse_connection(method, url, *args, **kwargs):
            raise requests.exceptions.ConnectTimeout()

        self.network._servers['http']['example.com'].add_response('GET', '/path', refuse_connection)
        response = self.client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost/test/workspace')
        self.assertEqual(response.status_code, 504)
        self.assertIn('Gateway Timeout', self.read_response(response).decode('utf-8'))

    def test_connection_badstatusline(self):

        self.client.login(username='test', password='test')

        # Simulating bad response from server
        def bad_response(method, url, *args, **kwargs):
            raise requests.exceptions.HTTPError()

        self.network._servers['http']['example.com'].add_response('GET', '/path', bad_response)
        response = self.client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost/test/workspace')
        self.assertEqual(response.status_code, 504)
        self.assertIn('Connection Error', self.read_response(response).decode('utf-8'))

    def test_connection_refused_ssl_error(self):

        self.client.login(username='test', password='test')

        # Simulating an error connecting to the servers
        def refuse_connection(method, url, *args, **kwargs):
            raise requests.exceptions.SSLError()

        self.network._servers['http']['example.com'].add_response('GET', '/path', refuse_connection)
        response = self.client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost/test/workspace')
        self.assertEqual(response.status_code, 502)
        self.assertIn('SSL Error', self.read_response(response).decode('utf-8'))

    def test_encoded_urls(self):

        self.client.login(username='test', password='test')

        self.network._servers['http']['example.com'].add_response('GET', '/ca%C3%B1on', {'content': 'data'})

        url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/ca%C3%B1on'})
        response = self.client.get(url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost/test/workspace')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.read_response(response), b'data')

        # We need to append the path because the reverse method encodes the url
        url = reverse('wirecloud|proxy', kwargs={'protocol': 'http', 'domain': 'example.com', 'path': '/'}) + 'cañon'
        response = self.client.get(url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost/test/workspace')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.read_response(response), b'data')

    def test_transfer_encoding(self):

        self.client.login(username='test', password='test')

        response = self.client.get(
            self.basic_url,
            HTTP_HOST='localhost',
            HTTP_REFERER='http://localhost/test/workspace',
            HTTP_TRANSFER_ENCODING='chunked',
        )
        self.assertEqual(response.status_code, 422)

    def test_cookies(self):

        self.client.login(username='test', password='test')
        self.client.cookies[str('test')] = 'test'

        def cookie_response(method, url, *args, **kwargs):
            if 'Cookie' in kwargs['headers']:
                return {'content': kwargs['headers']['Cookie'], 'headers': {'Set-Cookie': 'newcookie1=test; path=/, newcookie2=val1; path=/abc/d, newcookie3=c'}}
            else:
                return {'status_code': 404}

        self.network._servers['http']['example.com'].add_response('GET', '/path', cookie_response)
        response = self.client.get(self.basic_url, HTTP_HOST='localhost', HTTP_REFERER='http://localhost/test/workspace')
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

    def test_request_headers(self):

        self.client.login(username='test', password='test')

        def headers_response(method, url, *args, **kwargs):
            return {'content': json.dumps(kwargs['headers'])}

        self.network._servers['http']['example.com'].add_response('GET', '/path', headers_response)
        response = self.client.get(
            self.basic_url,
            HTTP_HOST='localhost',
            HTTP_REFERER='http://localhost/test/workspace',
            HTTP_FORWARDED='www.google.es',
            HTTP_X_FORWARDED_BY='127.0.0.1',
            HTTP_X_FORWARDED_HOST='www.google.es',
            HTTP_X_FORWARDED_PORT='8080',
            HTTP_X_FORWARDED_PROTO='http',
            HTTP_X_FORWARDED_SERVER='test',
            HTTP_MY_HEADER='test'
        )
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        # Check the proxy removed the blacklisted headers
        self.assertEqual(response_data, {
            "referer": "http://localhost/test/workspace",
            "my-header": "test",
            "via": "1.1 localhost (Wirecloud-python-Proxy/1.1)",
            "x-forwarded-for": "127.0.0.1"
        })

    def test_via_header(self):

        self.client.login(username='test', password='test')

        def headers_response(method, url, *args, **kwargs):
            return {'content': json.dumps(kwargs['headers'])}

        self.network._servers['http']['example.com'].add_response('GET', '/path', headers_response)
        response = self.client.get(
            self.basic_url,
            HTTP_HOST='localhost',
            HTTP_REFERER='http://localhost/test/workspace',
            HTTP_VIA='1.0 fred',
        )
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data, {
            "referer": "http://localhost/test/workspace",
            "via": "1.0 fred, 1.1 localhost (Wirecloud-python-Proxy/1.1)",
            "x-forwarded-for": "127.0.0.1"
        })

    def test_x_forwarded_for_header(self):

        self.client.login(username='test', password='test')

        def headers_response(method, url, *args, **kwargs):
            return {'content': json.dumps(kwargs['headers'])}

        self.network._servers['http']['example.com'].add_response('GET', '/path', headers_response)
        response = self.client.get(
            self.basic_url,
            HTTP_HOST='localhost',
            HTTP_REFERER='http://localhost/test/workspace',
            HTTP_X_FORWARDED_FOR='client',
        )
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data, {
            "referer": "http://localhost/test/workspace",
            "via": "1.1 localhost (Wirecloud-python-Proxy/1.1)",
            "x-forwarded-for": "client, 127.0.0.1"
        })


class ProxySecureDataTests(ProxyTestsBase):

    tags = ('wirecloud-proxy', 'wirecloud-proxy-secure-data', 'wirecloud-noselenium')

    pass_ref = 'password'
    pref_secure_ref = 'pref_secure'
    user_ref = 'username'

    def setUp(self):

        super(ProxySecureDataTests, self).setUp()

        user = User.objects.get(username='test')
        iwidget = IWidget.objects.get(pk=3)
        iwidget.set_variable_value('password', 'test_password', user)
        iwidget.save()
        self.assertNotEqual(iwidget.variables['password'], 'test_password')

        iwidget.tab.workspace.wiringStatus['operators']["2"]['preferences']['pref_secure']['value']['users']['2'] = encrypt_value("test_password")
        iwidget.tab.workspace.save()
        self.client.login(username='test', password='test')

        self.network._servers['http']['example.com'].add_response('POST', '/path', self.echo_response)

    def echo_response(method, url, *args, **kwargs):
        return {
            'status_code': 200,
            'content': json.dumps({
                'body': kwargs['data'].read().decode('utf-8'),
                'headers': kwargs['headers']
            })
        }

    def test_secure_data_operator(self):
        secure_data_header = 'action=basic_auth, user_ref=' + self.user_ref + ', pass_ref=' + self.pref_secure_ref

        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="operator",
                                    HTTP_WIRECLOUD_COMPONENT_ID="2")

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data['body'], 'username=|username|&password=|password|')
        self.assertEqual(response_data['headers'], {
            'content-length': '39',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'referer': 'http://localhost/test/workspaceSecure',
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': u'Basic dGVzdF91c2VybmFtZTp0ZXN0X3Bhc3N3b3Jk'
        })

    def test_secure_data_widget(self):
        secure_data_header = 'action=data, substr=|password|, var_ref=' + self.pass_ref
        secure_data_header += '&action=data, substr=|username|, var_ref=' + self.user_ref

        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="widget",
                                    HTTP_WIRECLOUD_COMPONENT_ID="3")

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data['body'], 'username=test_username&password=test_password')
        self.assertEqual(response_data['headers'], {
            'content-length': '45',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'referer': 'http://localhost/test/workspaceSecure',
            'content-type': 'application/x-www-form-urlencoded'
        })

    def test_secure_data_widget_basic_auth(self):
        secure_data_header = 'action=basic_auth, user_ref=' + self.user_ref + ', pass_ref=' + self.pass_ref
        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="widget",
                                    HTTP_WIRECLOUD_COMPONENT_ID="3")

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data['body'], 'username=|username|&password=|password|')
        self.assertEqual(response_data['headers'], {
            'content-length': '39',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'referer': 'http://localhost/test/workspaceSecure',
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': u'Basic dGVzdF91c2VybmFtZTp0ZXN0X3Bhc3N3b3Jk'
        })

    def test_secure_data_using_constants(self):

        secure_data_header = 'action=data, substr=|password|, var_ref=c/test_password'
        secure_data_header += '&action=data, substr=|username|, var_ref=c/test_username'
        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspace',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="widget",
                                    HTTP_WIRECLOUD_COMPONENT_ID="1")

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data['body'], 'username=test_username&password=test_password')
        self.assertEqual(response_data['headers'], {
            'content-length': '45',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'referer': 'http://localhost/test/workspace',
            'content-type': 'application/x-www-form-urlencoded',
        })

    def test_secure_data_encoding_url(self):

        secure_data_header = 'action=data, substr=|password|, var_ref=c%2Fa%3D%2C%20z , encoding=url'
        secure_data_header += '&action=data, substr=|username|, var_ref=c%2Fa%3D%2C%20z'
        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspace',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="widget",
                                    HTTP_WIRECLOUD_COMPONENT_ID="1")

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data['body'], 'username=a=, z&password=a%3D%2C%20z')
        self.assertEqual(response_data['headers'], {
            'content-length': '35',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'referer': 'http://localhost/test/workspace',
            'content-type': 'application/x-www-form-urlencoded',
        })

    def test_secure_data_encoding_base64(self):

        secure_data_header = 'action=data, substr=|password|, var_ref=password, encoding=base64'
        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="widget",
                                    HTTP_WIRECLOUD_COMPONENT_ID="3")

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data['body'], 'username=|username|&password=dGVzdF9wYXNzd29yZA==')
        self.assertEqual(response_data['headers'], {
            'content-length': '49',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'referer': 'http://localhost/test/workspaceSecure',
            'content-type': 'application/x-www-form-urlencoded'
        })

    def test_secure_data_default_substr(self):

        secure_data_header = 'action=data, var_ref=' + self.pass_ref
        secure_data_header += '&action=data, var_ref=' + self.user_ref
        response = self.client.post(self.basic_url,
                                    'username={username}&password={password}',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="widget",
                                    HTTP_WIRECLOUD_COMPONENT_ID="3")

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data['body'], 'username=test_username&password=test_password')
        self.assertEqual(response_data['headers'], {
            'content-length': '45',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'referer': 'http://localhost/test/workspaceSecure',
            'content-type': 'application/x-www-form-urlencoded'
        })

    def check_invalid_ref(self, invalid_ref):

        secure_data_header = 'action=data, substr=|password|, var_ref=' + invalid_ref
        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_ACCEPT='application/json',
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="widget",
                                    HTTP_WIRECLOUD_COMPONENT_ID="1")

        self.assertEqual(response.status_code, 422)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertNotEqual(response_data['description'], '')

    def test_secure_data_invalid_var_ref(self):

        for ref in ('666/inexitent', 'adfasdf', 'a/b/c'):
            self.check_invalid_ref(ref)

    def test_secure_data_ignore_empty_definitions(self):

        # Secure data header using constants and empty actions
        secure_data_header = 'action=data, substr=|password|, var_ref=c/test_password'
        secure_data_header += '&&  &action=data, substr=|username|, var_ref=c/test_username'
        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="widget",
                                    HTTP_WIRECLOUD_COMPONENT_ID="1")

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data['body'], 'username=test_username&password=test_password')
        self.assertEqual(response_data['headers'], {
            'content-length': '45',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'referer': 'http://localhost/test/workspaceSecure',
            'content-type': 'application/x-www-form-urlencoded'
        })

    def test_secure_data_invalid_action(self):

        # Secure data header with empty parameters
        secure_data_header = 'action=invalidaction, user_ref=asdf'
        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspace',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="widget",
                                    HTTP_WIRECLOUD_COMPONENT_ID="1")

        self.assertEqual(response.status_code, 422)

    def test_secure_data_missing_parameters(self):

        # Secure data header with empty parameters
        secure_data_header = 'action=basic_auth, user_ref=, pass_ref='
        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspace',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="widget",
                                    HTTP_WIRECLOUD_COMPONENT_ID="1")

        self.assertEqual(response.status_code, 422)

        # Secure data header missing parameters
        secure_data_header = 'action=basic_auth'
        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspace',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="operator",
                                    HTTP_WIRECLOUD_COMPONENT_ID="2")

        self.assertEqual(response.status_code, 422)

    def test_secure_data_header(self):
        replaceHeader = "words {password}"
        secure_data_header = 'action=header, header=headername, substr={password}, var_ref=pref_secure'

        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HEADERNAME=replaceHeader,
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="operator",
                                    HTTP_WIRECLOUD_COMPONENT_ID="2")

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data['body'], 'username=|username|&password=|password|')
        self.assertEqual(response_data['headers'], {
            'content-length': '39',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'referer': 'http://localhost/test/workspaceSecure',
            'content-type': 'application/x-www-form-urlencoded',
            'headername': 'words test_password'
        })

    def test_secure_data_header_concatenated(self):
        replaceHeader = "words {username}:{password}"
        secure_data_header = 'action=header, header=headername, substr={password}, var_ref=' + self.pref_secure_ref + '&action=header, header=headername, substr={username}, var_ref=' + self.user_ref

        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HEADERNAME=replaceHeader,
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="operator",
                                    HTTP_WIRECLOUD_COMPONENT_ID="2")

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data['body'], 'username=|username|&password=|password|')
        self.assertEqual(response_data['headers'], {
            'content-length': '39',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'referer': 'http://localhost/test/workspaceSecure',
            'content-type': 'application/x-www-form-urlencoded',
            'headername': 'words test_username:test_password'
        })

    def test_secure_data_header_default_substr(self):
        replaceHeader = "words {pref_secure}"
        secure_data_header = 'action=header, header=Headername, var_ref=' + self.pref_secure_ref

        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HEADERNAME=replaceHeader,
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="operator",
                                    HTTP_WIRECLOUD_COMPONENT_ID="2")

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data['body'], 'username=|username|&password=|password|')
        self.assertEqual(response_data['headers'], {
            'content-length': '39',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'referer': 'http://localhost/test/workspaceSecure',
            'content-type': 'application/x-www-form-urlencoded',
            'headername': 'words test_password'
        })

    def test_secure_data_header_encoding_url(self):
        replaceHeader = "username=|username|&password=|password|"
        secure_data_header = 'action=header, header=Headername, substr=|password|, var_ref=c%2Fa%3D%2C%20z, encoding=url'
        secure_data_header += '&action=header, header=headername, substr=|username|, var_ref=c%2Fa%3D%2C%20z'

        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HEADERNAME=replaceHeader,
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="operator",
                                    HTTP_WIRECLOUD_COMPONENT_ID="2")

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data['body'], 'username=|username|&password=|password|')
        self.assertEqual(response_data['headers'], {
            'content-length': '39',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'referer': 'http://localhost/test/workspaceSecure',
            'content-type': 'application/x-www-form-urlencoded',
            'headername': 'username=a=, z&password=a%3D%2C%20z'
        })

    def test_secure_data_header_encoding_base64(self):
        replaceHeader = "username=|username|&password=|password|"
        secure_data_header = 'action=header, header=Headername, substr=|password|, var_ref=pref_secure, encoding=base64'

        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HEADERNAME=replaceHeader,
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="operator",
                                    HTTP_WIRECLOUD_COMPONENT_ID="2")

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(self.read_response(response).decode('utf-8'))
        self.assertEqual(response_data['body'], 'username=|username|&password=|password|')
        self.assertEqual(response_data['headers'], {
            'content-length': '39',
            'via': '1.1 localhost (Wirecloud-python-Proxy/1.1)',
            'x-forwarded-for': '127.0.0.1',
            'referer': 'http://localhost/test/workspaceSecure',
            'content-type': 'application/x-www-form-urlencoded',
            'headername': 'username=|username|&password=dGVzdF9wYXNzd29yZA=='
        })

    def test_secure_data_header_missing_parameters(self):
        replaceHeader = "words {pass_ref}"
        secure_data_header = 'action=header, var_ref=' + self.pref_secure_ref

        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HEADERNAME=replaceHeader,
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="operator",
                                    HTTP_WIRECLOUD_COMPONENT_ID="2")

        self.assertEqual(response.status_code, 422)

    def test_secure_data_header_empty_parameters(self):
        replaceHeader = "words {pass_ref}"
        secure_data_header = 'action=header, header='', var_ref=' + self.pref_secure_ref

        response = self.client.post(self.basic_url,
                                    'username=|username|&password=|password|',
                                    content_type='application/x-www-form-urlencoded',
                                    HTTP_HEADERNAME=replaceHeader,
                                    HTTP_HOST='localhost',
                                    HTTP_REFERER='http://localhost/test/workspaceSecure',
                                    HTTP_X_WIRECLOUD_SECURE_DATA=secure_data_header,
                                    HTTP_WIRECLOUD_COMPONENT_TYPE="operator",
                                    HTTP_WIRECLOUD_COMPONENT_ID="2")

        self.assertEqual(response.status_code, 422)
