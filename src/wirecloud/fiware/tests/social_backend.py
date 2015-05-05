# -*- coding: utf-8 -*-

# Copyright (c) 2015 Conwet Lab., Universidad Politécnica de Madrid

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

from io import StringIO
import json
import sys

from django.test import TestCase
from mock import patch, MagicMock

from wirecloud.fiware.plugins import auth_fiware_token


class BasicClass(object):

    def __init__(self):
        pass

    @classmethod
    def get_key_and_secret(cls):
        return ('client', 'secret')


class TestSocialAuthBackend(TestCase):

    tags = ('wirecloud-fiware-social-auth',)

    OLD_RESPONSE = '{"schemas":["urn:scim:schemas:core:2.0:User"],"id":1,"actorId":1,"nickName":"demo","displayName":"Demo user","email":"demo@fiware.org","roles":[{"id":1,"name":"Manager"},{"id":7,"name":"Ticket manager"}],"organizations":[{"id":1,"actorId":2,"displayName":"Universidad Politecnica de Madrid","roles":[{"id":14,"name":"Admin"}]}]}'
    NEW_RESPONSE = '{"id":"demo","displayName":"Demo user","email":"demo@fiware.org","roles":[{"id":"1","name":"Manager"},{"id":"7","name":"Ticket manager"}],"organizations":[{"id":"00000000000000000000000000000001","displayName":"Universidad Politecnica de Madrid","roles":[{"id":14,"name":"Admin"}]}]}'
    RESPONSE_NO_LAST_NAME = '{"id":"demo","username":"demo","displayName":"Demo","email":"demo@fiware.org","roles":[{"id":"1","name":"Manager"},{"id":"7","name":"Ticket manager"}],"organizations":[{"id":"00000000000000000000000000000001","displayName":"Universidad Politecnica de Madrid","roles":[{"id":14,"name":"Admin"}]}]}'
    USER_DATA = {"username": "demo", "email": "demo@fiware.org", "fullname": "Demo user", "first_name": "Demo", "last_name": "user"}
    USER_DATA_NO_LAST_NAME = {"username": "demo", "email": "demo@fiware.org", "fullname": "Demo", "first_name": "Demo", "last_name": ""}

    def setUp(self):
        self.social_auth = MagicMock()
        modules = {
            'social_auth': self.social_auth,
            'social_auth.backends': self.social_auth.backends,
            'social_auth.models': self.social_auth.models,
            'social_auth.utils': self.social_auth.utils,
        }
        self.social_auth.backends.BaseOAuth2 = BasicClass
        self.social_auth.backends.OAuthBackend = BasicClass

        self.module_patcher = patch.dict('sys.modules', modules)
        self.module_patcher.start()
        if 'wirecloud.fiware.social_auth_backend' in sys.modules:
            del sys.modules['wirecloud.fiware.social_auth_backend']

        from wirecloud.fiware.social_auth_backend import FiwareAuth, FiwareBackend
        self.fiwareauth_module = FiwareAuth
        self.fiwarebackend_module = FiwareBackend

    def tearDown(self):

        self.module_patcher.stop()

    def test_get_user_data_old_version(self):

        self.social_auth.utils.dsa_urlopen.return_value = StringIO(self.OLD_RESPONSE)
        instance = self.fiwareauth_module()
        data = instance.user_data('token')

        self.assertIn('username', data)
        self.assertEqual(data['username'], 'demo')

    def test_get_user_data_new_version(self):

        self.social_auth.utils.dsa_urlopen.return_value = StringIO(self.NEW_RESPONSE)
        instance = self.fiwareauth_module()
        data = instance.user_data('token')

        self.assertIn('username', data)
        self.assertEqual(data['username'], 'demo')

    def test_get_user_data_invalid_response(self):

        self.social_auth.utils.dsa_urlopen.return_value = StringIO('bad response')
        instance = self.fiwareauth_module()
        data = instance.user_data('token')

        self.assertIsNone(data)

    def test_auth_headers(self):

        instance = self.fiwareauth_module()
        headers = instance.auth_headers()

        self.assertIn('Authorization', headers)
        self.assertIn('Basic ', headers['Authorization'])

    def test_get_user_details_old_version(self):

        instance = self.fiwarebackend_module()
        response = json.loads(self.OLD_RESPONSE)
        response['username'] = 'demo'
        data = instance.get_user_details(response)

        self.assertEqual(data, self.USER_DATA)

    def test_get_user_details_new_version(self):

        instance = self.fiwarebackend_module()
        response = json.loads(self.NEW_RESPONSE)
        response['username'] = 'demo'
        data = instance.get_user_details(response)

        self.assertEqual(data, self.USER_DATA)

    def test_get_user_details_no_last_name(self):

        instance = self.fiwarebackend_module()
        response = json.loads(self.RESPONSE_NO_LAST_NAME)
        data = instance.get_user_details(response)

        self.assertEqual(data, self.USER_DATA_NO_LAST_NAME)

    def test_api_authentication_using_idm(self):

        auth_user_mock = MagicMock()
        def get_social_auth(provider, uid):
            if provider == 'fiware' and uid == 'demo':
                return auth_user_mock
        self.social_auth.models.UserSocialAuth.objects.get.side_effect = get_social_auth

        with patch('wirecloud.fiware.plugins.FIWARE_SOCIAL_AUTH_BACKEND', create=True) as backend_mock:
            backend_mock._user_data.return_value = self.USER_DATA
            self.assertEqual(auth_fiware_token('Bearer', 'token'), auth_user_mock.user)
