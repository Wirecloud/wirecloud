# -*- coding: utf-8 -*-

# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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

import base64
import jwt
from urllib.parse import urljoin

from django.conf import settings
from social_core.backends.oauth import BaseOAuth2


KEYCLOAK_AUTHORIZATION_ENDPOINT = 'auth/realms/{}/protocol/openid-connect/auth'
KEYCLOAK_ACCESS_TOKEN_ENDPOINT = 'auth/realms/{}/protocol/openid-connect/token'


class KeycloakOAuth2(BaseOAuth2):
    """Keycloak IDM OAuth authentication endpoint"""

    name = 'keycloak'
    ID_KEY = 'preferred_username'

    IDM_SERVER = getattr(settings, 'KEYCLOAK_IDM_SERVER', '')
    REALM = getattr(settings, 'KEYCLOAK_REALM', '')
    KEY = getattr(settings, 'KEYCLOAK_KEY', '')

    CLIENT_ID = getattr(settings, 'KEYCLOAK_CLIENT_ID', '')

    ACCESS_TOKEN_URL = urljoin(IDM_SERVER, KEYCLOAK_ACCESS_TOKEN_ENDPOINT.format(REALM))
    AUTHORIZATION_URL = urljoin(IDM_SERVER, KEYCLOAK_AUTHORIZATION_ENDPOINT.format(REALM))

    REDIRECT_STATE = False
    ACCESS_TOKEN_METHOD = 'POST'
    SCOPE_VAR_NAME = 'FIWARE_EXTENDED_PERMISSIONS'
    EXTRA_DATA = [
        ('username', 'username'),
        ('refresh_token', 'refresh_token'),
        ('expires_in', 'expires'),
    ]

    def __init__(self, *args, **kwargs):
        super(KeycloakOAuth2, self).__init__(*args, **kwargs)

    def auth_headers(self):
        token = base64.urlsafe_b64encode(('{0}:{1}'.format(*self.get_key_and_secret()).encode())).decode()
        return {
            'Authorization': 'Basic {0}'.format(token)
        }

    def get_user_details(self, response):
        """Return user details from JWT token info"""

        roles = []
        if 'resource_access' in response and CLIENT_ID in response['resource_access'] and 'roles' in response['resource_access'][CLIENT_ID]:
            roles = response['resource_access'][CLIENT_ID]['roles']

        superuser = any(role.strip().lower() == "admin" for role in roles)
        return {
            'username': response.get('preferred_username'),
            'email': response.get('email') or '',
            'fullname': response.get('name') or '',
            'first_name': response.get('given_name') or '',
            'last_name': response.get('family_name') or '',
            'is_superuser': superuser,
            'is_staff': superuser,
        }

    def request_user_info(self, access_token):
        # Parse JWT to get user info
        public_key = "-----BEGIN PUBLIC KEY-----\n" + self.KEY + "\n-----END PUBLIC KEY-----"
        user_info = jwt.decode(token, public_key, algorithms='RS256', audience='account')
        return user_info

    def user_data(self, access_token, *args, **kwargs):
        return self.request_user_info(access_token)
