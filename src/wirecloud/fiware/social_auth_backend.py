# -*- coding: utf-8 -*-

# Copyright (c) 2013 Conwet Lab., Universidad Politécnica de Madrid

# This file is part of Wirecluod.

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

"""
FI-WARE IdM OAuth2 support.

This contribution adds support for FI-WARE IdM OAuth2 service. The settings
FIWARE_APP_ID and FIWARE_API_SECRET must be defined with the values
given by FI-WARE IdM application registration process.

Extended permissions are supported by defining FIWARE_EXTENDED_PERMISSIONS
setting, it must be a list of values to request.

By default account id and token expiration time are stored in extra_data
field, check OAuthBackend class for details on how to extend it.
"""

import json
from urllib import urlencode
from urlparse import urljoin

from django.conf import settings

from social_auth.utils import dsa_urlopen
from social_auth.backends import BaseOAuth2, OAuthBackend


FILAB_IDM_SERVER = 'https://account.lab.fi-ware.eu'

FIWARE_AUTHORIZATION_ENDPOINT = 'authorize'
FIWARE_ACCESS_TOKEN_ENDPOINT = 'token'
FIWARE_USER_DATA_ENDPOINT = 'user'


class FiwareBackend(OAuthBackend):
    """FI-WARE IdM OAuth authentication backend"""
    name = 'fiware'
    # Default extra data to store
    EXTRA_DATA = [
        ('nickName', 'username'),
    ]

    def get_user_id(self, details, response):
        """Return the user id, FI-WARE IdM only provides username as a unique
        identifier"""
        return response['nickName']

    def get_user_details(self, response):
        """Return user details from FI-WARE account"""
        name = response.get('displayName') or ''
        first_name = ''
        last_name = ''
        if ' ' in name:
            first_name, last_name = name.split(' ', 1)
        else:
            first_name = name
        return {'username': response.get('nickName'),
                'email': response.get('email') or '',
                'fullname': name,
                'first_name': first_name,
                'last_name': last_name}


class FiwareAuth(BaseOAuth2):
    """FI-WARE OAuth2 mechanism"""
    AUTHORIZATION_URL = urljoin(getattr(settings, 'FIWARE_IDM_SERVER', FILAB_IDM_SERVER), FIWARE_AUTHORIZATION_ENDPOINT)
    ACCESS_TOKEN_URL = urljoin(getattr(settings, 'FIWARE_IDM_SERVER', FILAB_IDM_SERVER), FIWARE_ACCESS_TOKEN_ENDPOINT)
    USER_DATA_URL = urljoin(getattr(settings, 'FIWARE_IDM_SERVER', FILAB_IDM_SERVER), FIWARE_USER_DATA_ENDPOINT)
    AUTH_BACKEND = FiwareBackend
    REDIRECT_STATE = False
    STATE_PARAMETER = False
    SETTINGS_KEY_NAME = 'FIWARE_APP_ID'
    SETTINGS_SECRET_NAME = 'FIWARE_API_SECRET'
    SCOPE_SEPARATOR = ','
    SCOPE_VAR_NAME = 'FIWARE_EXTENDED_PERMISSIONS'

    FIWARE_ORGANIZATION = getattr(settings, 'FIWARE_ORGANIZATION', None)

    def user_data(self, access_token, *args, **kwargs):
        """Loads user data from service"""
        url = self.USER_DATA_URL + '?' + urlencode({
            'access_token': access_token
        })

        try:
            data = json.load(dsa_urlopen(url))
        except ValueError:
            data = None

        return data

# Backend definition
BACKENDS = {
    'fiware': FiwareAuth,
}
