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


from urlparse import parse_qs, urlparse

from django.core.urlresolvers import reverse
from django.test import Client, TestCase
from django.utils import simplejson
from django.utils.http import urlencode


class Oauth2TestCase(TestCase):

    fixtures = ('selenium_test_data', 'oauth2_test_data')
    tags = ('oauth2',)

    @classmethod
    def setUpClass(cls):
        cls.client = Client()

    def test_authorization_code_grant_flow(self):

        # Authorization request
        query = {
            'response_type': 'code',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'redirect_uri': 'https://customapp.com/oauth/redirect',
        }
        url = reverse('oauth2provider.auth')
        response = self.client.get(url + '?' + urlencode(query))

        self.assertEqual(response.status_code, 302)
        response_data = parse_qs(urlparse(response['Location']).query)

        # Access token request
        url = reverse('oauth2provider.token')
        data = {
            'code': response_data['code'][0],
            'grant_type': 'authorization_code',
            'client_id': '3faf0fb4c2fe76c1c3bb7d09c21b97c2',
            'client_secret': '9643b7c3f59ef531931d39a3e19bcdd7',
            'redirect_uri': 'https://customapp.com/oauth/redirect',
        }
        response = self.client.post(url, data)

        self.assertEqual(response.status_code, 200)
        response_data = simplejson.loads(response.content)
        token = response_data['access_token']

        #
        import ipdb; ipdb.set_trace()
        url = reverse('wirecloud.workspace_collection')

        response = self.client.get(url, HTTP_ACCEPT='application/json', HTTP_AUTHORIZATION='Bearer '+token)
        self.assertEqual(response.status_code, 200)

        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, list))
        self.assertTrue(isinstance(response_data[0], dict))

    def test_implicit_grant_flow(self):

        self.client.get(url)
