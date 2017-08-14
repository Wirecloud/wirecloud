# -*- coding: utf-8 -*-

# Copyright (c) 2015-2017 Conwet Lab., Universidad Politécnica de Madrid

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

from copy import deepcopy
import json
import sys

from mock import patch, MagicMock, Mock

from wirecloud.commons.utils.testcases import WirecloudTestCase


class BasicClass(object):

    def __init__(self):
        pass

    @classmethod
    def get_key_and_secret(cls):
        return ('client', 'secret')


class TestSocialAuthBackend(WirecloudTestCase):

    tags = ('wirecloud-fiware-social-auth', 'wirecloud-noselenium')

    OLD_RESPONSE = {
        "schemas": ["urn:scim:schemas:core:2.0:User"],
        "id": 1,
        "actorId": 1,
        "nickName": "demo",
        "displayName": "Demo user",
        "email": "demo@fiware.org",
        "roles": [{"id": 1, "name": "Manager"}, {"id": 7, "name": "Ticket manager"}],
        "organizations": [{
            "id": 1,
            "actorId": 2,
            "displayName": "Universidad Politecnica de Madrid",
            "roles": [{"id": 14, "name": "Admin"}]
        }]
    }

    NEW_RESPONSE = {
        "id": "demo",
        "displayName": "Demo user",
        "email": "demo@fiware.org",
        "roles": [{"id": "1", "name": "Manager"}, {"id": "7", "name": "Ticket manager"}],
        "organizations": [{
            "id": "00000000000000000000000000000001",
            "displayName": "Universidad Politecnica de Madrid",
            "roles": [{"id": 14, "name": "Admin"}]
        }]
    }

    RESPONSE_NO_LAST_NAME = {
        "id": "demo",
        "username": "demo",
        "displayName": "Demo",
        "email": "demo@fiware.org",
        "roles": [{"id": "1", "name": "Manager"}, {"id": "7", "name": "Ticket manager"}],
        "organizations": [{
            "id": "00000000000000000000000000000001",
            "displayName": "Universidad Politecnica de Madrid",
            "roles": [{"id": 14, "name": "Admin"}]
        }]
    }

    USER_DATA = {"username": "demo", "email": "demo@fiware.org", "fullname": "Demo user", "first_name": "Demo", "last_name": "user"}
    USER_DATA_NO_LAST_NAME = {"username": "demo", "email": "demo@fiware.org", "fullname": "Demo", "first_name": "Demo", "last_name": ""}

    def setUp(self):
        self.social_core = MagicMock()
        self.social_django = MagicMock()
        modules = {
            'social_core': self.social_core,
            'social_core.backends': self.social_core.backends,
            'social_core.backends.oauth': self.social_core.backends.oauth,
            'social_django': self.social_django,
            'social_django.utils': self.social_django.utils,
            'social_django.models': self.social_django.models,
        }
        self.social_core.backends.oauth.BaseOAuth2 = BasicClass

        self.module_patcher = patch.dict('sys.modules', modules)
        self.module_patcher.start()
        if 'wirecloud.fiware.social_auth_backend' in sys.modules:
            del sys.modules['wirecloud.fiware.social_auth_backend']

        from wirecloud.fiware.social_auth_backend import FIWAREOAuth2, create_organizations
        self.fiwareauth_module = FIWAREOAuth2
        self.fiwareauth_module._request_user_info = self.fiwareauth_module.request_user_info
        self.fiwareauth_module.request_user_info = MagicMock()
        self.instance = self.fiwareauth_module()
        self.create_organizations = create_organizations

    def tearDown(self):

        self.module_patcher.stop()
        super(TestSocialAuthBackend, self).tearDown()

    def test_get_user_data_old_version(self):

        self.instance.request_user_info.return_value = self.OLD_RESPONSE
        data = self.instance.user_data('token')

        self.assertIn('username', data)
        self.assertEqual(data['username'], 'demo')
        self.assertIn('id', data['organizations'][0])
        self.assertEqual(data['organizations'][0]['id'], 2)

    def test_get_user_data_new_version(self):

        self.instance.request_user_info.return_value = self.NEW_RESPONSE
        data = self.instance.user_data('token')

        self.assertIn('username', data)
        self.assertEqual(data['username'], 'demo')
        self.assertIn('id', data['organizations'][0])
        self.assertEqual(data['organizations'][0]['id'], "00000000000000000000000000000001")

    def test_get_user_data_invalid_response(self):

        self.instance.request_user_info.side_effect = Exception
        self.assertRaises(Exception, self.instance.user_data, 'token')

    def test_auth_headers(self):

        headers = self.instance.auth_headers()

        self.assertIn('Authorization', headers)
        self.assertIn('Basic ', headers['Authorization'])
        self.assertEqual(headers['Authorization'], 'Basic Y2xpZW50OnNlY3JldA==')

    def test_get_user_details_old_version(self):

        response = deepcopy(self.OLD_RESPONSE)
        response['username'] = 'demo'
        data = self.instance.get_user_details(response)

        self.assertEqual(data, self.USER_DATA)

    def test_get_user_details_new_version(self):

        response = deepcopy(self.NEW_RESPONSE)
        response['username'] = 'demo'
        data = self.instance.get_user_details(response)

        self.assertEqual(data, self.USER_DATA)

    def test_get_user_details_no_last_name(self):

        response = deepcopy(self.RESPONSE_NO_LAST_NAME)
        data = self.instance.get_user_details(response)

        self.assertEqual(data, self.USER_DATA_NO_LAST_NAME)

    def test_request_user_info(self):

        with patch('wirecloud.fiware.social_auth_backend.requests') as requests_mock:
            response = MagicMock()
            response.json.return_value = {"test": True}
            requests_mock.get.return_value = response
            self.assertEqual(self.instance._request_user_info('token'), {"test": True})

    def test_api_authentication_using_idm(self):

        auth_user_mock = MagicMock()

        def get_social_auth(provider, uid):
            if provider == 'fiware' and uid == 'demo':
                return auth_user_mock
        self.social_django.models.UserSocialAuth.objects.get.side_effect = get_social_auth

        with patch('wirecloud.fiware.plugins.FIWARE_SOCIAL_AUTH_BACKEND', create=True) as backend_mock:
            backend_mock._user_data.return_value = self.USER_DATA
            from wirecloud.fiware.plugins import auth_fiware_token
            self.assertEqual(auth_fiware_token('Bearer', 'token'), auth_user_mock.user)

    def test_create_organizations_ignores_other_backends(self):
        backend = Mock()
        backend.name = "other"
        strategy = Mock()
        user = Mock()
        response = None

        UserSocialAuth = self.social_django.models.UserSocialAuth

        self.create_organizations(strategy, backend, user, response)

        self.assertEqual(UserSocialAuth.objects.select_related.call_count, 0)
        self.assertEqual(UserSocialAuth.objects.create.call_count, 0)

    def test_oauth_discovery(self):

        from wirecloud.fiware.views import oauth_discovery

        backend = self.social_django.utils.get_backend()
        backend.AUTHORIZATION_URL = "https://auth.example.com"
        backend.ACCESS_TOKEN_URL = "https://token.example.com"

        with patch("wirecloud.fiware.views.get_absolute_reverse_url", return_value="https://default_redirect.example.com"):
            response = oauth_discovery(Mock(method="GET"))

        info = json.loads(response.content.decode('utf-8'))
        self.assertEqual(info, {
            "flows": ["Authorization Code Grant", "Resource Owner Password Credentials Grant"],
            "auth_endpoint": "https://auth.example.com",
            "token_endpoint": "https://token.example.com",
            "default_redirect_uri": "https://default_redirect.example.com",
            "version": "2.0",
        })

    @patch('wirecloud.fiware.plugins.IDM_SUPPORT_ENABLED', new=True)
    def test_plugin_idm_enabled(self):

        from wirecloud.fiware.plugins import FiWarePlugin

        plugin = FiWarePlugin()

        urls = plugin.get_urls()
        self.assertEqual(len(urls), 2)

        constants = plugin.get_constants()
        self.assertIn('FIWARE_HOME', constants)
        self.assertIn('FIWARE_PORTALS', constants)
        self.assertIn('FIWARE_OFFICIAL_PORTAL', constants)
        self.assertIn('FIWARE_IDM_SERVER', constants)

    @patch('wirecloud.fiware.plugins.IDM_SUPPORT_ENABLED', new=False)
    def test_plugin_idm_disabled(self):

        from wirecloud.fiware.plugins import FiWarePlugin

        plugin = FiWarePlugin()

        urls = plugin.get_urls()
        self.assertEqual(len(urls), 1)

        constants = plugin.get_constants()
        self.assertIn('FIWARE_HOME', constants)
        self.assertIn('FIWARE_PORTALS', constants)
        self.assertNotIn('FIWARE_OFFICIAL_PORTAL', constants)
        self.assertNotIn('FIWARE_IDM_SERVER', constants)

    def test_organizations_are_created(self):
        backend = Mock()
        backend.name = "fiware"
        strategy = Mock()
        user = Mock()
        response = deepcopy(self.NEW_RESPONSE)

        UserSocialAuth = self.social_django.models.UserSocialAuth
        UserSocialAuth.DoesNotExist = Exception
        select_related_mock = Mock()
        select_related_mock.get.side_effect = UserSocialAuth.DoesNotExist
        UserSocialAuth.objects.select_related.return_value = select_related_mock

        self.create_organizations(strategy, backend, user, response)

        self.assertEqual(UserSocialAuth.objects.create.call_count, 1)

    def test_existing_organization(self):
        backend = Mock()
        backend.name = "fiware"
        strategy = Mock()
        user = Mock()
        response = deepcopy(self.NEW_RESPONSE)

        org_social = Mock()
        UserSocialAuth = self.social_django.models.UserSocialAuth
        UserSocialAuth.objects.select_related().get.return_value = org_social

        self.create_organizations(strategy, backend, user, response)

        self.assertEqual(UserSocialAuth.objects.create.call_count, 0)
        org_social.user.group.add.assert_called_with(user)
