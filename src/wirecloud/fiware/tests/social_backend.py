# -*- coding: utf-8 -*-

# Copyright (c) 2015-2017 Conwet Lab., Universidad Politécnica de Madrid
# Copyright (c) 2018-2019 Future Internet Consulting and Development Solutions S.L.

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

from copy import deepcopy
import json
import sys
from unittest.mock import patch, MagicMock, Mock

from django.test import TestCase, override_settings

from wirecloud.commons.utils.testcases import WirecloudTestCase


class BasicClass(object):

    def __init__(self):
        pass

    def extra_data(self, user, uid, response, details=None, *args, **kwargs):
        return {
            "access_token": "access_token",
            "refresh_token": "refresh_token",
            "expires": 3600
        }

    def refresh_token(self, token, *args, **kwargs):
        return {
            "access_token": "new_access_token",
            "refresh_token": "new_refresh_token",
            "expires": 3600
        }

    @classmethod
    def get_key_and_secret(cls):
        return ('client', 'secret')


class TestSocialAuthBackend(WirecloudTestCase, TestCase):

    tags = ('wirecloud-fiware-social-auth', 'wirecloud-noselenium')
    populate = False
    use_search_indexes = False

    # KeyRock v6
    OLD_RESPONSE = {
        "id": "demo",
        "username": "demo",
        "displayName": "Demo user",
        "email": "demo@fiware.org",
        "roles": [{"id": "1", "name": "Manager"}, {"id": "7", "name": "Ticket manager"}],
        "organizations": [{
            "id": "00000000000000000000000000000001",
            "displayName": "Universidad Politecnica de Madrid",
            "roles": [{"id": 14, "name": "Admin"}]
        }]
    }

    OLD_RESPONSE_NO_LAST_NAME = {
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

    # KeyRock v7
    NEW_RESPONSE = {
        "id": "8b0127d8-38f7-4428-b22d-31bd80bba510",
        "displayName": "",
        "username": "demo",
        "email": "demo@fiware.org",
        "roles": [{"id": "4a923351-b767-4fef-bc92-4a4fa996e88e", "name": "Manager"}, {"id": "4a92as51-b54d-4fef-bc92-4a4fa996e88e", "name": "Ticket manager"}],
        "organizations": [{
            "id": "04ac28b2-54c7-46a7-a606-c62fdc4f1513",
            "name": "Mi organization",
            "description": "dafsdf",
            "website": None,
            "roles": [{"id": "4a923351-b767-4fef-bc92-4a4fa996e88e", "name": "one_role"}]
        }]
    }

    USER_DATA = {"username": "demo", "email": "demo@fiware.org", "fullname": "Demo user", "first_name": "Demo", "last_name": "user", "is_superuser": False, "is_staff": False}
    NEW_USER_DATA = {"username": "demo", "email": "demo@fiware.org", "fullname": "", "first_name": "", "last_name": "", "is_superuser": False, "is_staff": False}
    USER_DATA_ADMIN = {"username": "demo", "email": "demo@fiware.org", "fullname": "Demo user", "first_name": "Demo", "last_name": "user", "is_superuser": True, "is_staff": True}
    NEW_USER_DATA_ADMIN = {"username": "demo", "email": "demo@fiware.org", "fullname": "", "first_name": "", "last_name": "", "is_superuser": True, "is_staff": True}
    USER_DATA_NO_LAST_NAME = {"username": "demo", "email": "demo@fiware.org", "fullname": "Demo", "first_name": "Demo", "last_name": "", "is_superuser": False, "is_staff": False}

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

    @override_settings(
        FIWARE_IDM_SERVER="http://idm:3000",
        FIWARE_IDM_PUBLIC_URL="http://localhost:3000"
    )
    def test_authorization_url_internal(self):
        self.instance = self.fiwareauth_module()
        self.assertEqual(self.instance.FIWARE_IDM_SERVER, "http://localhost:3000")

    @override_settings(
        FIWARE_IDM_SERVER="https://accounts.example.org",
        FIWARE_IDM_PUBLIC_URL=None
    )
    def test_authorization_url_public(self):
        self.instance = self.fiwareauth_module()
        self.assertEqual(self.instance.FIWARE_IDM_SERVER, "https://accounts.example.org")

    @override_settings(
        FIWARE_IDM_SERVER="https://accounts.example.org",
        FIWARE_IDM_PUBLIC_URL="    "
    )
    def test_authorization_url_public_empty_string(self):
        self.instance = self.fiwareauth_module()
        self.assertEqual(self.instance.FIWARE_IDM_SERVER, "https://accounts.example.org")

    def test_get_user_data_old_version(self):

        self.instance.request_user_info.return_value = self.OLD_RESPONSE
        data = self.instance.user_data('token')

        self.assertIn('username', data)
        self.assertEqual(data['username'], 'demo')
        self.assertIn('id', data['organizations'][0])
        self.assertEqual(data['organizations'][0]['id'], "00000000000000000000000000000001")

    def test_get_user_data_new_version(self):

        self.instance.request_user_info.return_value = self.NEW_RESPONSE
        data = self.instance.user_data('token')

        self.assertIn('username', data)
        self.assertEqual(data['username'], 'demo')
        self.assertIn('id', data['organizations'][0])
        self.assertEqual(data['organizations'][0]['id'], "04ac28b2-54c7-46a7-a606-c62fdc4f1513")

    def test_get_user_data_invalid_response(self):

        self.instance.request_user_info.side_effect = Exception
        self.assertRaises(Exception, self.instance.user_data, 'token')

    def test_auth_headers(self):

        headers = self.instance.auth_headers()

        self.assertIn('Authorization', headers)
        self.assertIn('Basic ', headers['Authorization'])
        self.assertEqual(headers['Authorization'], 'Basic Y2xpZW50OnNlY3JldA==')

    def test_extra_data(self):
        data = self.instance.extra_data("user", "uid", "response")

        self.assertEqual(data, {
            "access_token": "access_token",
            "refresh_token": "refresh_token",
            "expires": 3600,
        })

    def test_get_user_details_old_version(self):

        response = deepcopy(self.OLD_RESPONSE)
        response['username'] = 'demo'
        data = self.instance.get_user_details(response)

        self.assertEqual(data, self.USER_DATA)

    def test_get_user_details_old_version_admin(self):

        response = deepcopy(self.OLD_RESPONSE)
        response['roles'][0]['name'] = 'Admin'
        data = self.instance.get_user_details(response)

        self.assertEqual(data, self.USER_DATA_ADMIN)

    def test_get_user_details_old_version_no_last_name(self):

        response = deepcopy(self.OLD_RESPONSE_NO_LAST_NAME)
        data = self.instance.get_user_details(response)

        self.assertEqual(data, self.USER_DATA_NO_LAST_NAME)

    def test_get_user_details_new_version(self):

        response = deepcopy(self.NEW_RESPONSE)
        response['username'] = 'demo'
        data = self.instance.get_user_details(response)

        self.assertEqual(data, self.NEW_USER_DATA)

    def test_get_user_details_new_version_admin(self):

        response = deepcopy(self.NEW_RESPONSE)
        response['roles'][0]['name'] = 'Admin'
        data = self.instance.get_user_details(response)

        self.assertEqual(data, self.NEW_USER_DATA_ADMIN)

    def test_refresh_token(self):
        data = self.instance.refresh_token("old_access_token")

        self.assertEqual(data, {
            "access_token": "new_access_token",
            "refresh_token": "new_refresh_token",
            "expires": 3600,
            "openstack_token": None
        })

    def test_request_user_info(self):

        self.instance.request = Mock()
        response = MagicMock()
        response.json.return_value = {"test": True}
        self.instance.request.return_value = response
        self.assertEqual(self.instance._request_user_info('token'), {"test": True})

    def test_api_authentication_using_idm(self):

        auth_user_mock = MagicMock()

        def get_social_auth(provider, uid):
            if provider == 'fiware' and uid == 'demo':
                return auth_user_mock
        self.social_django.models.UserSocialAuth.objects.get.side_effect = get_social_auth

        with patch('wirecloud.fiware.plugins.FIWARE_SOCIAL_AUTH_BACKEND', create=True) as backend_mock:
            backend_mock.user_data.return_value = self.USER_DATA
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
    @patch('wirecloud.fiware.plugins.FIWARE_SOCIAL_AUTH_BACKEND', create=True)
    def test_plugin_idm_enabled(self, social_backend):

        from wirecloud.fiware.plugins import FiWarePlugin

        plugin = FiWarePlugin()

        urls = plugin.get_urls()
        self.assertEqual(len(urls), 1)

        constants = plugin.get_constants()
        self.assertIn('FIWARE_HOME', constants)
        self.assertIn('FIWARE_PORTALS', constants)
        self.assertIn('FIWARE_OFFICIAL_PORTAL', constants)
        self.assertIn('FIWARE_IDM_SERVER', constants)
        self.assertNotIn('FIWARE_IDM_PUBLIC_URL', constants)

    @patch('wirecloud.fiware.plugins.IDM_SUPPORT_ENABLED', new=False)
    def test_plugin_idm_disabled(self):

        from wirecloud.fiware.plugins import FiWarePlugin

        plugin = FiWarePlugin()

        urls = plugin.get_urls()
        self.assertEqual(len(urls), 0)

        constants = plugin.get_constants()
        self.assertIn('FIWARE_HOME', constants)
        self.assertIn('FIWARE_PORTALS', constants)
        self.assertNotIn('FIWARE_OFFICIAL_PORTAL', constants)
        self.assertNotIn('FIWARE_IDM_SERVER', constants)
        self.assertNotIn('FIWARE_IDM_PUBLIC_URL', constants)

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
