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
import time

from django.http import HttpResponse

from wirecloud.commons.utils.http import build_error_response
from wirecloud.oauth2provider import pyoauth2_utils as utils
from wirecloud.oauth2provider.models import Application, Code, Token


class WirecloudAuthorizationProvider(object):

    token_length = 40
    token_type = 'Bearer'
    token_expires_in = 3600

    def generate_authorization_code(self):
        """Generate a random authorization code.

        :rtype: str
        """
        return utils.random_ascii_string(self.token_length)

    def generate_access_token(self):
        """Generate a random access token.

        :rtype: str
        """
        return utils.random_ascii_string(self.token_length)

    def generate_refresh_token(self):
        """Generate a random refresh token.

        :rtype: str
        """
        return utils.random_ascii_string(self.token_length)

    def _make_response(self, body='', headers=None, status_code=200):

        response = HttpResponse(body, status=status_code)
        for k, v in headers.items():
            response[k] = v

        return response

    def _make_error_response(self, request, err, status_code=400):
        return build_error_response(request, status_code, err)

    def _make_redirect_error_response(self, redirect_uri, err):
        """Return a HTTP 302 redirect response object containing the error.

        :param redirect_uri: Client redirect URI.
        :type redirect_uri: str
        :param err: OAuth error message.
        :type err: str
        :rtype: requests.Response
        """
        redirect = utils.build_url(redirect_uri, {"error": err})
        return self._make_response(headers={'Location': redirect},
                                   status_code=302)

    def _make_json_response(self, data, headers=None, status_code=200):
        """Return a response object from the given JSON data.

        :param data: Data to JSON-encode.
        :type data: mixed
        :param headers: Dict of headers to include in the requests.
        :type headers: dict
        :param status_code: HTTP status code.
        :type status_code: int
        :rtype: requests.Response
        """
        response_headers = {}
        if headers is not None:
            response_headers.update(headers)
        response_headers['Content-Type'] = 'application/json;charset=UTF-8'
        response_headers['Cache-Control'] = 'no-store'
        response_headers['Pragma'] = 'no-cache'
        return self._make_response(json.dumps(data),
                                   response_headers,
                                   status_code)

    def get_client(self, client_id):
        """
        Returns a Client instance. Exception if not found
        """
        return Application.objects.get(client_id=client_id)

    def validate_client_secret(self, client, client_secret):
        """
        Returns True if the client secret is valid for the given client
        """
        return client.client_secret == client_secret

    def validate_redirect_uri(self, client, redirect_uri):
        """
        Returns True if the redirect uri is valid for the given client
        """
        return client.redirect_uri == redirect_uri.split('?', 1)[0]

    def validate_access(self):
        """
        Returns True or False
        """
        return True

    def validate_scope(self, client, scope):
        """
        Returns True if the scope is valid for the given client
        """
        return True

    def persist_authorization_code(self, user, client, code, scope):
        """
        Persist the authorization code
        """
        Code.objects.create(
            client=client,
            user=user,
            scope=scope,
            code=code,
            creation_timestamp=int(time.time())
        )

    def persist_token_information(self, client_id, scope, access_token, token_type, expires_in, refresh_token, data):
        """
        Persists token information
        """
        Token.objects.create(
            token=access_token,
            user_id=data['user_id'],
            token_type=token_type,
            client_id=client_id,
            scope=scope,
            creation_timestamp=int(time.time()),
            expires_in=expires_in,
            refresh_token=refresh_token
        )

    def from_authorization_code(self, client_id, code, scope):
        """
        Retrieve context information from an authorization code
        """
        try:
            code = Code.objects.get(client_id=client_id, scope=scope, code=code)
        except Code.DoesNotExist:
            return None

        return {
            'client_id': client_id,
            'scope': scope,
            'user_id': code.user.id
        }

    def from_refresh_token(self, client_id, refresh_token, scope):
        """
        Retrieve context information from a refresh_token
        """
        try:
            token = Token.objects.get(client_id=client_id, scope=scope, refresh_token=refresh_token)
        except Token.DoesNotExist:
            return None

        return {
            'client_id': client_id,
            'scope': scope,
            'user_id': token.user.id
        }

    def discard_authorization_code(self, client_id, code):
        """
        Discards an authorization Code
        """
        Code.objects.filter(client_id=client_id, code=code).delete()

    def discard_refresh_token(self, client_id, refresh_token):
        """
        Discards a refresh Token
        """
        Token.objects.filter(client_id=client_id, refresh_token=refresh_token).delete()

    def validate_authorization_code_request(self, request, user, response_type, client, redirect_uri, scope='', **params):
        """
        Validates an authorization code request (part of the Authorization Code Grant Flow)
        """

        # Check client
        if client is None:
            return self._make_error_response(request, 'unauthorized_client')

        # Check redirect URI
        if not self.validate_redirect_uri(client, redirect_uri):
            return self._make_error_response(request, 'invalid_request')

        # Ensure proper response_type
        if response_type != 'code':
            return self._make_redirect_error_response(redirect_uri, 'unsupported_response_type')

        # Check conditions
        # Return proper error responses on invalid conditions
        if not self.validate_access():
            return self._make_redirect_error_response(redirect_uri, 'access_denied')

        if not self.validate_scope(client, scope):
            return self._make_redirect_error_response(redirect_uri, 'invalid_scope')

    def get_authorization_code(self, request, user, response_type, client, redirect_uri, **params):
        """Generate authorization code HTTP response.

        :param response_type: Desired response type. Must be exactly "code".
        :type response_type: str
        :param client_id: Client ID.
        :type client_id: str
        :param redirect_uri: Client redirect URI.
        :type redirect_uri: str
        :rtype: requests.Response
        """

        scope = params.get('scope', '')

        # Generate authorization code
        code = self.generate_authorization_code()

        # Save information to be used to validate later requests
        self.persist_authorization_code(user=user, client=client, code=code, scope=scope)

        # Return redirection response
        params.update({
            'code': code,
            'response_type': None,
            'client_id': None,
            'redirect_uri': None
        })
        redirect = utils.build_url(redirect_uri, params)
        return self._make_response(headers={'Location': redirect}, status_code=302)

    def refresh_token(self, request, client_id, client_secret, refresh_token, **params):
        """Generate access token HTTP response from a refresh token.

        :param client_id: Client ID.
        :type client_id: str
        :param client_secret: Client secret.
        :type client_secret: str
        :param refresh_token: Refresh token.
        :type refresh_token: str
        :rtype: requests.Response
        """

        scope = params.get('scope', '')

        # Check conditions
        try:
            client = self.get_client(client_id)
        except:
            return self._make_error_response(request, 'invalid_client')

        # Validate grant info
        is_valid_client_secret = self.validate_client_secret(client, client_secret)
        data = self.from_refresh_token(client_id, refresh_token, scope)
        is_valid_grant = data is not None

        if not is_valid_client_secret or not is_valid_grant:
            return self._make_error_response(request, 'invalid_grant')

        # Validate scope
        if not self.validate_scope(client, scope):
            return self._make_error_response(request, 'invalid_scope')

        # Discard original refresh token
        self.discard_refresh_token(client_id, refresh_token)

        # Generate access tokens once all conditions have been met
        access_token = self.generate_access_token()
        token_type = self.token_type
        expires_in = self.token_expires_in
        refresh_token = self.generate_refresh_token()

        # Save information to be used to validate later requests
        self.persist_token_information(client_id=client_id,
                                       scope=scope,
                                       access_token=access_token,
                                       token_type=token_type,
                                       expires_in=expires_in,
                                       refresh_token=refresh_token,
                                       data=data)

        # Return json response
        return self._make_json_response({
            'access_token': access_token,
            'token_type': token_type,
            'expires_in': expires_in,
            'refresh_token': refresh_token
        })

    def get_token(self, request, client_id, client_secret, redirect_uri, code, **params):
        """Generate access token HTTP response.

        :param client_id: Client ID.
        :type client_id: str
        :param client_secret: Client secret.
        :type client_secret: str
        :param redirect_uri: Client redirect URI.
        :type redirect_uri: str
        :param code: Authorization code.
        :type code: str
        :rtype: requests.Response
        """

        scope = params.get('scope', '')

        # Check conditions
        try:
            client = self.get_client(client_id)
        except:
            return self._make_error_response(request, 'invalid_client')

        # Validate grant info
        is_valid_redirect_uri = self.validate_redirect_uri(client, redirect_uri)
        is_valid_client_secret = self.validate_client_secret(client, client_secret)
        data = self.from_authorization_code(client_id, code, scope)
        is_valid_grant = data is not None

        if not is_valid_client_secret or not is_valid_grant or not is_valid_redirect_uri:
            return self._make_error_response(request, 'invalid_grant')

        # Validate scope
        if not self.validate_scope(client, scope):
            return self._make_error_response(request, 'invalid_scope')

        # Discard original authorization code
        self.discard_authorization_code(client_id, code)

        # Generate access tokens once all conditions have been met
        access_token = self.generate_access_token()
        token_type = self.token_type
        expires_in = self.token_expires_in
        refresh_token = self.generate_refresh_token()

        # Save information to be used to validate later requests
        self.persist_token_information(client_id=client_id,
                                       scope=scope,
                                       access_token=access_token,
                                       token_type=token_type,
                                       expires_in=expires_in,
                                       refresh_token=refresh_token,
                                       data=data)

        # Return json response
        return self._make_json_response({
            'access_token': access_token,
            'token_type': token_type,
            'expires_in': expires_in,
            'refresh_token': refresh_token
        })

    def get_token_from_post_data(self, request, data):
        """Get a token response from POST data.

        :param data: POST data containing authorization information.
        :type data: dict
        :rtype: requests.Response
        """
        try:
            # Verify OAuth 2.0 Parameters
            for x in ['grant_type', 'client_id', 'client_secret']:
                if not data.get(x):
                    raise TypeError("Missing required OAuth 2.0 POST param: {}".format(x))

            # Handle get token from refresh_token
            if data['grant_type'] == 'refresh_token':
                if 'refresh_token' not in data:
                    raise TypeError("Missing required OAuth 2.0 POST param: refresh_token")
                return self.refresh_token(request, **data)
            elif data['grant_type'] == 'authorization_code':
                # Handle get token from authorization code
                for x in ['redirect_uri', 'code']:
                    if not data.get(x):
                        raise TypeError("Missing required OAuth 2.0 POST param: {}".format(x))
                return self.get_token(request, **data)
            else:
                return self._make_error_response(request, 'unsupported_grant_type')

        except TypeError:
            # Catch missing parameters in request
            return self._make_error_response(request, 'invalid_request')
        except Exception:
            # Catch all other server errors
            return self._make_error_response(request, 'server_error', status_code=500)
