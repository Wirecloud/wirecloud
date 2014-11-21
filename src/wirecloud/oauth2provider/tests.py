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

import json
from six.moves.urllib.parse import parse_qs, urlparse

from django.conf import settings
from django.core.urlresolvers import reverse
from django.test import Client, TestCase
from django.utils import unittest
from django.utils.http import urlencode

from wirecloud.commons.utils.testcases import WirecloudTestCase


@unittest.skipIf(not 'wirecloud.oauth2provider' in settings.INSTALLED_APPS, 'OAuth2 provider not enabled')
class Oauth2TestCase(WirecloudTestCase):

    fixtures = ('selenium_test_data', 'oauth2_test_data')
    tags = ('wirecloud-oauth2provider',)

    @classmethod
    def setUpClass(cls):

        WirecloudTestCase.setUpClass.im_func(cls)

        cls.client = Client()
        cls.user_client = Client()

    def setUp(self):
        self.user_client.login(username='normuser', password='admin')

    def _check_token(self, token):

        # Make an authenticated request
        url = reverse('wirecloud.resource_collection')

        return  self.client.get(url, HTTP_ACCEPT='application/json', HTTP_AUTHORIZATION='Bearer ' + token)

    def check_token_is_valid(self, token):

        response = self._check_token(token)
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

        return response

    def check_token_is_invalid(self, token):

        response = self._check_token(token)
        self.assertEqual(response.status_code, 401)

        response_data = json.loads(response.content)
        self.assertIn('WWW-Authenticate', response)
        self.assertTrue(isinstance(response_data, dict))

        return response

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
        response = self.user_client.post(auth_req_url, {}, HTTP_ACCEPT='text/html, application/xhtml+xml')

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
        response_data = json.loads(response.content)
        token = response_data['access_token']
        token_type = response_data['token_type']
        self.assertEqual(token_type, 'Bearer')

        # Make an authenticated request
        self.check_token_is_valid(token)

    test_authorization_code_grant_flow.tags = ('wirecloud-oauth2provider', 'fiware-ut-9')

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
        response_data = json.loads(response.content)
        token = response_data['access_token']
        token_type = response_data['token_type']
        self.assertEqual(token_type, 'Bearer')

        # Make an authenticated request
        self.check_token_is_valid(token)

        # Using again the initial refresh token should fail
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, 400)

    def test_authorization_bad_token(self):
        self.check_token_is_invalid('invalid_token')

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

    @unittest.skip('wip test')
    def test_implicit_grant_flow(self):

        # Authorization request
        query = {
            'response_type': 'token',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'redirect_uri': 'https://customapp.com/oauth/redirect',
        }
        auth_req_url = reverse('oauth2provider.auth') + '?' + urlencode(query)
        response = self.user_client.get(auth_req_url)

        # Parse returned code
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response['Location'].startswith('https://customapp.com/oauth/redirect'))
        response_data = parse_qs(urlparse(response['Location']).query)
        token = response_data['access_token'][0]
        token_type = response_data['token_type'][0]
        self.assertEqual(token_type, 'Bearer')

        # Make an authenticated request
        url = reverse('wirecloud.workspace_collection')

        response = self.client.get(url, HTTP_ACCEPT='application/json', HTTP_AUTHORIZATION='Bearer ' + token)
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, list))
        self.assertTrue(isinstance(response_data[0], dict))
