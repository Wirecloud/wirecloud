# -*- coding: utf-8 -*-

# Copyright (c) 2013-2017 Conwet Lab., Universidad Politécnica de Madrid
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

"""
FIWARE IdM OAuth2 support.

This contribution adds support for FIWARE IdM OAuth2 service. The settings
FIWARE_APP_ID and FIWARE_APP_SECRET must be defined with the values
given by FIWARE IdM application registration process.

Extended permissions are supported by defining FIWARE_EXTENDED_PERMISSIONS
setting, it must be a list of values to request.

By default account id and token expiration time are stored in extra_data
field, check OAuthBackend class for details on how to extend it.
"""

import base64
from urllib.parse import urljoin

from django.conf import settings
from social_core.backends.oauth import BaseOAuth2
from social_django.models import UserSocialAuth

from wirecloud.commons.models import Organization
from wirecloud.fiware import FIWARE_LAB_IDM_SERVER


FIWARE_AUTHORIZATION_ENDPOINT = 'oauth2/authorize'
FIWARE_ACCESS_TOKEN_ENDPOINT = 'oauth2/token'
FIWARE_USER_DATA_ENDPOINT = 'user'


def create_organizations(strategy, backend, user, response, *args, **kwargs):

    if backend.name != 'fiware':
        return

    for organization in response.get('organizations', []):
        try:
            social = UserSocialAuth.objects.select_related('user').get(provider='fiware', uid=organization['id'])
        except UserSocialAuth.DoesNotExist:
            social = None

        if social is None:
            # KeyRock v6 uses displayName instead of name
            organization_name = organization["name"] if "name" in organization else organization['displayName']
            org_name = Organization.objects.search_available_name(organization_name)
            org = Organization.objects.create_organization(org_name)
            social = UserSocialAuth.objects.create(user=org, uid=organization['id'])

        social.user.group.add(user)


class FIWAREOAuth2(BaseOAuth2):
    """FIWARE IdM OAuth authentication backend"""
    name = 'fiware'
    ID_KEY = 'username'

    ACCESS_TOKEN_URL = urljoin(getattr(settings, 'FIWARE_IDM_SERVER', FIWARE_LAB_IDM_SERVER), FIWARE_ACCESS_TOKEN_ENDPOINT)
    USER_DATA_URL = urljoin(getattr(settings, 'FIWARE_IDM_SERVER', FIWARE_LAB_IDM_SERVER), FIWARE_USER_DATA_ENDPOINT)
    REDIRECT_STATE = False
    ACCESS_TOKEN_METHOD = 'POST'
    SCOPE_VAR_NAME = 'FIWARE_EXTENDED_PERMISSIONS'
    EXTRA_DATA = [
        ('username', 'username'),
        ('refresh_token', 'refresh_token'),
        ('expires_in', 'expires'),
    ]

    def __init__(self, *args, **kwargs):
        internal_url = getattr(settings, 'FIWARE_IDM_SERVER', FIWARE_LAB_IDM_SERVER)
        public_url = getattr(settings, 'FIWARE_IDM_PUBLIC_URL', internal_url)
        if public_url is None or str(public_url).strip() == "":
            public_url = internal_url

        self.FIWARE_IDM_SERVER = public_url
        self.AUTHORIZATION_URL = urljoin(public_url, FIWARE_AUTHORIZATION_ENDPOINT)
        super(FIWAREOAuth2, self).__init__(*args, **kwargs)

    def auth_headers(self):
        token = base64.urlsafe_b64encode(('{0}:{1}'.format(*self.get_key_and_secret()).encode())).decode()
        return {
            'Authorization': 'Basic {0}'.format(token)
        }

    def refresh_token(self, token, *args, **kwargs):
        data = super(FIWAREOAuth2, self).refresh_token(token, *args, **kwargs)
        data['openstack_token'] = None
        return data

    def get_user_details(self, response):
        """Return user details from FIWARE account"""
        name = response.get('displayName') or ''
        first_name = ''
        last_name = ''
        if ' ' in name:
            first_name, last_name = name.split(' ', 1)
        else:
            first_name = name

        superuser = any(rol['name'].strip().lower() == "admin" for rol in response.get("roles", []))
        return {
            'username': response.get('username'),
            'email': response.get('email') or '',
            'fullname': name,
            'first_name': first_name,
            'last_name': last_name,
            'is_superuser': superuser,
            'is_staff': superuser,
        }

    def request_user_info(self, access_token):
        response = self.request(url=self.USER_DATA_URL, params={'access_token': access_token})
        response.raise_for_status()
        return response.json()

    def user_data(self, access_token, *args, **kwargs):
        data = self.request_user_info(access_token)
        data['username'] = data.get('username') if "username" in data else data.get('id')

        return data
