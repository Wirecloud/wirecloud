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
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from django.core.urlresolvers import reverse
from django.test import Client, TransactionTestCase
from django.test.utils import override_settings
from django.utils.http import urlencode

from wirecloud.commons.utils.conf import BASE_APPS
from wirecloud.commons.utils.testcases import WirecloudTestCase
from wirecloud.platform.plugins import clear_cache


@override_settings(INSTALLED_APPS=BASE_APPS + ('wirecloud.catalogue', 'wirecloud.platform', 'wirecloud.oauth2provider', 'haystack'))
class Oauth2TestCase(WirecloudTestCase, TransactionTestCase):

    fixtures = ('selenium_test_data', 'oauth2_test_data')
    tags = ('wirecloud-oauth2provider', 'wirecloud-noselenium')
    populate = False
    use_search_indexes = False

    @classmethod
    def setUpClass(cls):

        super(Oauth2TestCase, cls).setUpClass()

        cls.client = Client()
        cls.user_client = Client()

        # Clear WireCloud plugins cache
        clear_cache()

    @classmethod
    def tearDownClass(cls):
        super(Oauth2TestCase, cls).tearDownClass()

        # Clear WireCloud plugins cache
        clear_cache()

    def setUp(self):
        super(Oauth2TestCase, self).setUp()

        self.user_client.login(username='normuser', password='admin')

    def _check_token(self, token, endpoint='wirecloud.resource_collection'):

        # Make an authenticated request
        url = reverse(endpoint)

        return self.client.get(url, HTTP_ACCEPT='application/json', HTTP_AUTHORIZATION='Bearer ' + token)

    def check_token_is_valid(self, token):

        response = self._check_token(token)
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

        return response

    def check_token_is_invalid(self, token, endpoint='wirecloud.resource_collection'):

        response = self._check_token(token, endpoint)
        self.assertEqual(response.status_code, 401)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertIn('WWW-Authenticate', response)
        self.assertTrue(isinstance(response_data, dict))

        return response

    def check_access_denied_redirection(self, response):
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response['Location'].startswith('https://customapp.com/oauth/redirect'))
        response_data = parse_qs(urlparse(response['Location']).query)
        self.assertNotIn('code', response_data)
        self.assertNotIn('access_token', response_data)
        self.assertEqual(len(response_data["error"]), 1)
        self.assertEqual(response_data["error"][0], "access_denied")

    def test_published_oauth2_info(self):

        url = reverse('oauth.discovery')

        response = self.user_client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(response_data['flows'], ["Authorization Code Grant"])
        self.assertIn('auth_endpoint', response_data)
        self.assertIn('token_endpoint', response_data)
        self.assertIn('default_redirect_uri', response_data)
        self.assertEqual(response_data['version'], '2.0')

    def test_authorization_missing_response_type(self):

        query = {'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2', 'redirect_uri': 'https://customapp.com/oauth/redirect'}
        auth_req_url = reverse('oauth2provider.auth') + '?' + urlencode(query)

        response = self.user_client.get(auth_req_url, HTTP_ACCEPT='text/html, application/xhtml+xml')
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response['Location'].startswith('https://customapp.com/oauth/redirect'))
        response_data = parse_qs(urlparse(response['Location']).query)
        self.assertEqual(response_data['error'][0], 'invalid_request')

    def test_authorization_missing_client_id(self):

        query = {'response_type': 'code', 'redirect_uri': 'https://customapp.com/oauth/redirect'}
        auth_req_url = reverse('oauth2provider.auth') + '?' + urlencode(query)

        response = self.user_client.get(auth_req_url, HTTP_ACCEPT='text/html, application/xhtml+xml')
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response['Location'].startswith('https://customapp.com/oauth/redirect'))
        response_data = parse_qs(urlparse(response['Location']).query)
        self.assertEqual(response_data['error'][0], 'invalid_request')

    def test_authorization_missing_redirect_uri(self):

        query = {'response_type': 'code', 'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2'}
        auth_req_url = reverse('oauth2provider.auth') + '?' + urlencode(query)

        response = self.user_client.get(auth_req_url, HTTP_ACCEPT='text/html, application/xhtml+xml')
        self.assertEqual(response.status_code, 400)

    def test_authorization_invalid_response_type(self):

        query = {'response_type': 'invalid_type', 'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2', 'redirect_uri': 'https://customapp.com/oauth/redirect'}
        auth_req_url = reverse('oauth2provider.auth') + '?' + urlencode(query)

        response = self.user_client.get(auth_req_url, HTTP_ACCEPT='text/html, application/xhtml+xml')
        self.assertEqual(response.status_code, 302)
        response_data = parse_qs(urlparse(response['Location']).query)
        self.assertEqual(response_data['error'][0], 'unsupported_response_type')

    def test_authorization_invalid_redirect_uri(self):

        query = {'response_type': 'code', 'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2', 'redirect_uri': 'https://customapp2.com/oauth/redirect'}
        auth_req_url = reverse('oauth2provider.auth') + '?' + urlencode(query)

        response = self.user_client.get(auth_req_url, HTTP_ACCEPT='text/html, application/xhtml+xml')
        self.assertEqual(response.status_code, 400)

    def test_authorization_invalid_client_id(self):

        query = {'response_type': 'code', 'client_id': 'invalid_client_id', 'redirect_uri': 'https://customapp.com/oauth/redirect'}
        auth_req_url = reverse('oauth2provider.auth') + '?' + urlencode(query)

        response = self.user_client.get(auth_req_url, HTTP_ACCEPT='text/html, application/xhtml+xml')
        self.assertEqual(response.status_code, 400)

    def test_access_token_missing_grant_type(self):

        url = reverse('oauth2provider.token')
        data = {
            'code': 'test_code',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'client_secret': '9643b7c3f59ef531931d39a3e19bcdd7',
            'redirect_uri': 'https://customapp.com/oauth/redirect',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_access_token_missing_client_id(self):

        url = reverse('oauth2provider.token')
        data = {
            'code': 'test_code',
            'grant_type': 'authorization_code',
            'client_secret': '9643b7c3f59ef531931d39a3e19bcdd7',
            'redirect_uri': 'https://customapp.com/oauth/redirect',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_access_token_missing_client_secret(self):

        url = reverse('oauth2provider.token')
        data = {
            'code': 'test_code',
            'grant_type': 'authorization_code',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'redirect_uri': 'https://customapp.com/oauth/redirect',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_access_token_missing_redirect_uri(self):

        url = reverse('oauth2provider.token')
        data = {
            'code': 'test_code',
            'grant_type': 'authorization_code',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'client_secret': '9643b7c3f59ef531931d39a3e19bcdd7',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_access_token_invalid_grant_type(self):

        url = reverse('oauth2provider.token')
        data = {
            'code': 'test_code',
            'grant_type': 'invalid_grant_type',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'client_secret': '9643b7c3f59ef531931d39a3e19bcdd7',
            'redirect_uri': 'https://customapp.com/oauth/redirect',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_access_token_invalid_client_id(self):

        url = reverse('oauth2provider.token')
        data = {
            'code': 'test_code',
            'grant_type': 'authorization_code',
            'client_id': 'invalid_client_id',
            'client_secret': '9643b7c3f59ef531931d39a3e19bcdd7',
            'redirect_uri': 'https://customapp.com/oauth/redirect',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_access_token_invalid_code(self):

        url = reverse('oauth2provider.token')
        data = {
            'code': 'invalid_code',
            'grant_type': 'authorization_code',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'client_secret': '9643b7c3f59ef531931d39a3e19bcdd7',
            'redirect_uri': 'https://customapp.com/oauth/redirect',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_access_token_invalid_client_secret(self):

        url = reverse('oauth2provider.token')
        data = {
            'code': 'test_code',
            'grant_type': 'authorization_code',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'client_secret': 'invalid_client_secret',
            'redirect_uri': 'https://customapp.com/oauth/redirect',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_authorization_code_grant_flow(self):

        # Authorization request
        query = {
            'response_type': 'code',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'redirect_uri': 'https://customapp.com/oauth/redirect',
        }
        auth_req_url = reverse('oauth2provider.auth') + '?' + urlencode(query)

        response = self.user_client.get(auth_req_url, HTTP_ACCEPT='text/html, application/xhtml+xml')
        self.assertEqual(response.status_code, 200)
        self.assertIn(response['Content-Type'].split(';', 1)[0], ('text/html, application/xhtml+xml'))

        # Client Authorization
        response = self.user_client.post(auth_req_url, {"action": "auth"}, HTTP_ACCEPT='text/html, application/xhtml+xml')

        # Parse returned code
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response['Location'].startswith('https://customapp.com/oauth/redirect'))
        response_data = parse_qs(urlparse(response['Location']).query)
        code = response_data['code'][0]

        # Access token request
        url = reverse('oauth2provider.token')
        data = {
            'code': code,
            'grant_type': 'authorization_code',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'client_secret': '9643b7c3f59ef531931d39a3e19bcdd7',
            'redirect_uri': 'https://customapp.com/oauth/redirect',
        }
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        token = response_data['access_token']
        token_type = response_data['token_type']
        self.assertEqual(token_type, 'Bearer')

        # Make an authenticated request
        self.check_token_is_valid(token)

    def test_authorization_code_grant_flow_deny_access(self):

        # Authorization request
        query = {
            'response_type': 'code',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'redirect_uri': 'https://customapp.com/oauth/redirect',
        }
        auth_req_url = reverse('oauth2provider.auth') + '?' + urlencode(query)

        # Deny authorization
        response = self.user_client.post(auth_req_url, {}, HTTP_ACCEPT='text/html, application/xhtml+xml')

        self.check_access_denied_redirection(response)

    def test_refresh_token_invalid_client_id(self):

        url = reverse('oauth2provider.token')
        data = {
            'refresh_token': 'expired_token_refresh_token',
            'grant_type': 'refresh_token',
            'client_id': 'invalid_client_id',
            'client_secret': '9643b7c3f59ef531931d39a3e19bcdd7',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_refresh_token_invalid_client_secret(self):

        url = reverse('oauth2provider.token')
        data = {
            'refresh_token': 'expired_token_refresh_token',
            'grant_type': 'refresh_token',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'client_secret': 'invalid_client_secret',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_refresh_token_invalid_refresh_token(self):

        url = reverse('oauth2provider.token')
        data = {
            'refresh_token': 'invalid_refresh_token',
            'grant_type': 'refresh_token',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'client_secret': 'invalid_client_secret',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    def test_refresh_token_missing_refresh_token(self):

        url = reverse('oauth2provider.token')
        data = {
            'grant_type': 'refresh_token',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'client_secret': 'invalid_client_secret',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 400)

    @patch('wirecloud.oauth2provider.views.provider.refresh_token', side_effect=Exception)
    def test_refresh_token_server_error(self, refresh_token_mock):

        url = reverse('oauth2provider.token')
        data = {
            'refresh_token': 'expired_token_refresh_token',
            'grant_type': 'refresh_token',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'client_secret': '9643b7c3f59ef531931d39a3e19bcdd7',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 500)

    def test_refresh_token(self):
        url = reverse('oauth2provider.token')
        data = {
            'refresh_token': 'expired_token_refresh_token',
            'grant_type': 'refresh_token',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'client_secret': '9643b7c3f59ef531931d39a3e19bcdd7',
        }
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        token = response_data['access_token']
        token_type = response_data['token_type']
        self.assertEqual(token_type, 'Bearer')

        # Make an authenticated request
        self.check_token_is_valid(token)

        # Using again the initial refresh token should fail
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, 400)

    def test_authorization_bad_token(self):
        # Check an error response is returned when using an invalid token for endpoints requiring authentication.

        self.check_token_is_invalid('invalid_token')

    def test_authorization_bad_token_no_auth_required(self):
        # Check an error response is returned when using an invalid token for endpoints not requiring authentication.

        self.check_token_is_invalid('invalid_token', 'wirecloud.workspace_collection')

    def test_authorization_expired_token(self):
        self.check_token_is_invalid('expired_token')

    def test_client_secret_invalidates_authorization_tokens(self):

        from wirecloud.oauth2provider.models import Application

        application = Application.objects.get(pk="3faf0fb4c2fe76c1c3bb7d09c21b97c2")

        self.check_token_is_valid('eternal_token1')
        self.check_token_is_valid('eternal_token2')
        self.check_token_is_valid('eternal_token3')

        application.secret = 'new_secret'
        application.save()

        self.check_token_is_invalid('eternal_token1')
        self.check_token_is_invalid('eternal_token2')
        # eternal_token3 is not owned by app 3faf0fb4c2fe76c1c3bb7d09c21b97c2
        self.check_token_is_valid('eternal_token3')
