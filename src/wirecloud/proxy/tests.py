# -*- coding: utf-8 -*-

import errno
import socket
from httplib import BadStatusLine, HTTPMessage
from StringIO import StringIO
import urllib2

from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TransactionTestCase, Client
from django.utils import unittest

from wirecloud.platform.models import VariableValue
from wirecloud.proxy.views import WIRECLOUD_PROXY
from wirecloud.platform.workspace.utils import HAS_AES, set_variable_value


# Avoid nose to repeat these tests (they are run through ezweb/tests/__init__.py)
__test__ = False


class FakeDownloader(object):

    def __init__(self):
        self.reset()

    def reset(self):
        self._responses = {}
        self._cookie_responses = {}
        self._echo_responses = {}
        self._exceptions = {}

    def set_response(self, url, response):
        self._responses[url] = (url, 200, response, 'OK')

    def set_cookie_response(self, url, headers):
        self._cookie_responses[url] = headers

    def set_echo_response(self, url):
        self._echo_responses[url] = 1

    def set_exception(self, url, exception):
        self._exceptions[url] = exception

    def set_http_error(self, url, error_code=404, msg='Not Found', data=''):
        self._responses[url] = (url, error_code, data, msg)

    def set_url_error(self, url):
        self.set_exception(url, urllib2.URLError(socket.error(errno.ECONNREFUSED,)))

    def build_response(self, url, code, data, msg, headers={}):
        response = urllib2.addinfourl(StringIO(data), headers, url)
        response.code = code
        response.msg = msg

        return response

    def __call__(self, opener, method, url, data, headers):

        if url in self._exceptions:
            raise self._exceptions[url]

        if url in self._cookie_responses:
            plain_headers = self._cookie_responses[url]
            headers_text = '\n'.join([header_name + ': ' + plain_headers[header_name] for header_name in plain_headers])
            response_headers = HTTPMessage(StringIO(headers_text))
            return self.build_response(url, 200, headers['Cookie'], 'OK', response_headers)

        elif url in self._echo_responses:
            return self.build_response(url, 200, data, 'OK')

        elif url in self._responses:
            return self.build_response(*self._responses[url])
        else:
            return self.build_response(url, 404, '', 'Not Found')


class ProxyTestsBase(TransactionTestCase):

    fixtures = ('test_data.json',)
    tags = ('proxy',)

    def setUp(self):
        self.user = User.objects.get(username='test')
        self._original_function = WIRECLOUD_PROXY._do_request
        WIRECLOUD_PROXY._do_request = FakeDownloader()

        super(ProxyTestsBase, self).setUp()

    def tearDown(self):
        WIRECLOUD_PROXY._do_request = self._original_function

        super(ProxyTestsBase, self).tearDown()


class ProxyTests(ProxyTestsBase):

    def test_basic_proxy_requests(self):
        WIRECLOUD_PROXY._do_request.set_response('http://example.com/path', 'data')

        client = Client()

        # Check authentication
        response = client.get('/proxy/http/example.com/path', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 403)

        client.login(username='test', password='test')

        # Basic GET request
        response = client.get('/proxy/http/example.com/path', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, 'data')

        # Basic POST request
        response = client.post('/proxy/http/example.com/path', {}, HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, 'data')

        # Http Error 404
        response = client.get('/proxy/http/example.com/non_existing_file.html', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.content, '')

    def test_connection_refused(self):

        client = Client()
        client.login(username='test', password='test')

        # Simulating an error connecting to the server
        WIRECLOUD_PROXY._do_request.set_url_error('http://example.com/path')
        response = client.get('/proxy/http/example.com/path', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.content, '')

    def test_connection_timeout(self):

        client = Client()
        client.login(username='test', password='test')

        WIRECLOUD_PROXY._do_request.set_exception('http://example.com/path', urllib2.URLError(socket.error(errno.ETIMEDOUT,)))
        response = client.get('/proxy/http/example.com/path', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 504)
        self.assertEqual(response.content, '')

        WIRECLOUD_PROXY._do_request.set_exception('http://example.com/path', urllib2.URLError(socket.timeout()))
        response = client.get('/proxy/http/example.com/path', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 504)
        self.assertEqual(response.content, '')

    def test_connection_badstatusline(self):

        client = Client()
        client.login(username='test', password='test')

        WIRECLOUD_PROXY._do_request.set_exception('http://example.com/path', BadStatusLine('HTTP/1.1 0 Unknown'))
        response = client.get('/proxy/http/example.com/path', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 504)
        self.assertEqual(response.content, '')

    def test_encoded_urls(self):

        client = Client()
        client.login(username='test', password='test')

        WIRECLOUD_PROXY._do_request.reset()
        WIRECLOUD_PROXY._do_request.set_response('http://example.com/ca%C3%B1on', 'data')

        response = client.get('/proxy/http/example.com/ca%C3%B1on', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, 'data')

        response = client.get('/proxy/http/example.com/cañon', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, 'data')

    def test_cookies(self):

        client = Client()
        client.login(username='test', password='test')
        client.cookies['test'] = 'test'

        WIRECLOUD_PROXY._do_request.reset()
        WIRECLOUD_PROXY._do_request.set_cookie_response('http://example.com/path', {'Set-Cookie': 'newcookie=test; path=/'})
        response = client.get('/proxy/http/example.com/path', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, 'test=test')
        self.assertTrue('newcookie' in response.cookies)
        self.assertEqual(response.cookies['newcookie'].value, 'test')
        self.assertEqual(response.cookies['newcookie']['path'], '/proxy/http/example.com/')


@unittest.skipIf(not HAS_AES, 'python-crypto not found')
class ProxySecureDataTests(ProxyTestsBase):

    def setUp(self):
        self.OLD_PROXY_PROCESSORS = settings.PROXY_PROCESSORS
        settings.PROXY_PROCESSORS = (
            'wirecloud.proxy.processors.SecureDataProcessor',
        )
        cache.clear()
        super(ProxySecureDataTests, self).setUp()

    def tearDown(self):
        settings.PROXY_PROCESSORS = self.OLD_PROXY_PROCESSORS
        super(ProxySecureDataTests, self).tearDown()

    def test_secure_data(self):

        set_variable_value(1, self.user, 'test_password')
        self.assertTrue(VariableValue.objects.get(pk=1).value != 'test_password')

        client = Client()
        client.login(username='test', password='test')

        WIRECLOUD_PROXY._do_request.reset()
        WIRECLOUD_PROXY._do_request.set_echo_response('http://example.com/path')
        pass_ref = '1/password'
        user_ref = '1/username'
        secure_data_header = 'action=data, substr=|password|, var_ref=' + pass_ref
        secure_data_header += '&action=data, substr=|username|, var_ref=' + user_ref
        response = client.post('/proxy/http/example.com/path',
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost',
                            HTTP_X_EZWEB_SECURE_DATA=secure_data_header)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, 'username=test_username&password=test_password')

        secure_data_header = 'action=basic_auth, user_ref=' + user_ref + ', pass_ref=' + pass_ref
        response = client.post('/proxy/http/example.com/path',
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost',
                            HTTP_X_EZWEB_SECURE_DATA=secure_data_header)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, 'username=|username|&password=|password|')

        # Secure data header using constants
        WIRECLOUD_PROXY._do_request.reset()
        WIRECLOUD_PROXY._do_request.set_echo_response('http://example.com/path')
        secure_data_header = 'action=data, substr=|password|, var_ref=c/test_password'
        secure_data_header += '&action=data, substr=|username|, var_ref=c/test_username'
        response = client.post('/proxy/http/example.com/path',
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost',
                            HTTP_X_EZWEB_SECURE_DATA=secure_data_header)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, 'username=test_username&password=test_password')

        # Secure data header using encoding=url
        WIRECLOUD_PROXY._do_request.reset()
        WIRECLOUD_PROXY._do_request.set_echo_response('http://example.com/path')
        secure_data_header = 'action=data, substr=|password|, var_ref=c%2Fa%3D%2C%20z , encoding=url'
        secure_data_header += '&action=data, substr=|username|, var_ref=c%2Fa%3D%2C%20z'
        response = client.post('/proxy/http/example.com/path',
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost',
                            HTTP_X_EZWEB_SECURE_DATA=secure_data_header)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, 'username=a=, z&password=a%3D%2C%20z')

        # Secure data header with empty parameters
        secure_data_header = 'action=basic_auth, user_ref=, pass_ref='
        response = client.post('/proxy/http/example.com/path',
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost',
                            HTTP_X_EZWEB_SECURE_DATA=secure_data_header)

        self.assertEqual(response.status_code, 422)

    def test_secure_data_using_cookies(self):

        set_variable_value(1, self.user, 'test_password')
        self.assertTrue(VariableValue.objects.get(pk=1).value != 'test_password')

        client = Client()
        client.login(username='test', password='test')

        WIRECLOUD_PROXY._do_request.reset()
        WIRECLOUD_PROXY._do_request.set_echo_response('http://example.com/path')
        pass_ref = '1/password'
        user_ref = '1/username'
        secure_data_header = 'action=data, substr=|password|, var_ref=' + pass_ref
        secure_data_header += '&action=data, substr=|username|, var_ref=' + user_ref
        client.cookies['X-EzWeb-Secure-Data'] = secure_data_header
        response = client.post('/proxy/http/example.com/path',
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, 'username=test_username&password=test_password')

        secure_data_header = 'action=basic_auth, user_ref=' + user_ref + ', pass_ref=' + pass_ref
        client.cookies['X-EzWeb-Secure-Data'] = secure_data_header
        response = client.post('/proxy/http/example.com/path',
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, 'username=|username|&password=|password|')

        # Secure data header with empty parameters
        secure_data_header = 'action=basic_auth, user_ref=, pass_ref='
        client.cookies['X-EzWeb-Secure-Data'] = secure_data_header
        response = client.post('/proxy/http/example.com/path',
                            'username=|username|&password=|password|',
                            content_type='application/x-www-form-urlencoded',
                            HTTP_HOST='localhost',
                            HTTP_REFERER='http://localhost')

        self.assertEqual(response.status_code, 200)
