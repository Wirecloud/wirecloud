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

import time

from django.http import HttpResponse
import six

from wirecloud.commons.utils.http import build_error_response
from wirecloud.oauth2provider.pyoauth2 import AuthorizationProvider
from wirecloud.oauth2provider.models import Application, Code, Token


class WirecloudAuthorizationProvider(AuthorizationProvider):

    def _make_response(self, body='', headers=None, status_code=200):

        response = HttpResponse(body, status=status_code)
        for k, v in six.iteritems(headers):
            response[k] = v

        return response

    def _make_error_response(self, request, err):
        return build_error_response(request, 400, err)

    def get_client(self, client_id):
        return Application.objects.get(client_id=client_id)

    def validate_client_secret(self, client, client_secret):
        return client.client_secret == client_secret

    def validate_redirect_uri(self, client, redirect_uri):
        return client.redirect_uri == redirect_uri.split('?', 1)[0]

    def validate_access(self):
        return True

    def validate_scope(self, client, scope):
        return True

    def persist_authorization_code(self, user, client, code, scope):
        Code.objects.create(
            client=client,
            user=user,
            scope=scope,
            code=code,
            creation_timestamp=int(time.time())
        )

    def persist_token_information(self, client_id, scope, access_token, token_type, expires_in, refresh_token, data):
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
        try:
            code = Code.objects.get(client_id=client_id, scope=scope, code=code)
        except Code.DoesNotExist:
            return None

        return {
            'client_id': client_id,
            'scope': scope,
            'user_id': code.user.id
        }

    def discard_authorization_code(self, client_id, code):
        Code.objects.filter(client_id=client_id, code=code).delete()

    def from_refresh_token(self, client_id, refresh_token, scope):
        try:
            token = Token.objects.get(client_id=client_id, scope=scope, refresh_token=refresh_token)
        except Token.DoesNotExist:
            return None

        return {
            'client_id': client_id,
            'scope': scope,
            'user_id': token.user.id
        }

    def discard_refresh_token(self, client_id, refresh_token):
        Token.objects.filter(client_id=client_id, refresh_token=refresh_token).delete()
