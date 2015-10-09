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

from copy import deepcopy
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

    tags = ('wirecloud-fiware-social-auth',)

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
        self.social = MagicMock()
        modules = {
            'social': self.social,
            'social.backends': self.social.backends,
            'social.backends.oauth': self.social.backends.oauth,
            'social.apps': self.social.apps,
            'social.apps.django_app': self.social.apps.django_app,
            'social.apps.django_app.default': self.social.apps.django_app.default,
            'social.apps.django_app.default.models': self.social.apps.django_app.default.models,
        }
        self.social.backends.oauth.BaseOAuth2 = BasicClass

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
            response.content = '{"test": true}'
            requests_mock.get.return_value = response
            self.assertEqual(self.instance._request_user_info('token'), {"test": True})

    def test_api_authentication_using_idm(self):

        auth_user_mock = MagicMock()
        def get_social_auth(provider, uid):
            if provider == 'fiware' and uid == 'demo':
                return auth_user_mock
        self.social.apps.django_app.default.models.UserSocialAuth.objects.get.side_effect = get_social_auth

        with patch('wirecloud.fiware.plugins.FIWARE_SOCIAL_AUTH_BACKEND', create=True) as backend_mock:
            backend_mock._user_data.return_value = self.USER_DATA
            from wirecloud.fiware.plugins import auth_fiware_token
            self.assertEqual(auth_fiware_token('Bearer', 'token'), auth_user_mock.user)

    def test_organizations_are_created(self):
        backend = Mock()
        backend.name = "fiware"
        strategy = Mock()
        user = Mock()
        response = deepcopy(self.NEW_RESPONSE)

        UserSocialAuth = self.social.apps.django_app.default.models.UserSocialAuth
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
        UserSocialAuth = self.social.apps.django_app.default.models.UserSocialAuth
        UserSocialAuth.objects.select_related().get.return_value = org_social

        self.create_organizations(strategy, backend, user, response)

        self.assertEqual(UserSocialAuth.objects.create.call_count, 0)
        org_social.user.group.add.assert_called_with(user)
