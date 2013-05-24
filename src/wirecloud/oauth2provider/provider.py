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


from django.http import HttpResponse

from wirecloud.oauth2provider.pyoauth2 import AuthorizationProvider
from wirecloud.oauth2provider.models import Application, Code, Token


class WirecloudAuthorizationProvider(AuthorizationProvider):

    def _make_response(self, body='', headers=None, status_code=200):

        response = HttpResponse(body, status=status_code)
        for k, v in headers.iteritems():
            response[k] = v

        return response

    def get_client(self, client_id):
        return Application.objects.get(client_id=client_id)

    def validate_client_secret(self, client_id, client_secret):
        return Application.objects.filter(client_id=client_id, client_secret=client_secret).exists()

    def validate_redirect_uri(self, client_id, redirect_uri):
        try:
            app = Application.objects.get(client_id=client_id)
        except:
            return False

        return app.redirect_uri == redirect_uri.split('?', 1)[0]

    def validate_access(self):
        return True

    def validate_scope(self, client_id, scope):
        return True

    def persist_authorization_code(self, user, client, code, scope):
        Code.objects.create(client=client, user=user, scope=scope, code=code)

    def persist_token_information(self, client_id, scope, access_token, token_type, expires_in, refresh_token, data):
        Token.objects.create(
            token=access_token,
            user_id=data['user_id'],
            token_type=token_type,
            client_id=client_id,
            scope=scope,
            expires_in=expires_in,
            refresh_token=refresh_token
        )

    def from_authorization_code(self, client_id, code, scope):
        try:
            code = Code.objects.get(client_id=client_id, scope=scope, code=code)
        except:
            return None

        return {
            'client_id': client_id,
            'scope': scope,
            'user_id': code.user.id
        }

    def discard_authorization_code(self, client_id, code):
        Code.objects.filter(client_id=client_id, code=code).delete()

    def from_refresh_token(self, client_id, refresh_token, scope):
        pass
