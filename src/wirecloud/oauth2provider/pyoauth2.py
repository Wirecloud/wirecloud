import json
from wirecloud.oauth2provider import pyoauth2_utils as utils


class Provider(object):
    """Base provider class for different types of OAuth 2.0 providers."""

    def _handle_exception(self, exc):
        """Handle an internal exception that was caught and suppressed.

        :param exc: Exception to process.
        :type exc: Exception
        """
        pass

    def _make_response(self, body='', headers=None, status_code=200):
        """Return a response object from the given parameters.

        :param body: Buffer/string containing the response body.
        :type body: str
        :param headers: Dict of headers to include in the requests.
        :type headers: dict
        :param status_code: HTTP status code.
        :type status_code: int
        :rtype: requests.Response
        """
        raise NotImplementedError('Subclasses must implement ' \
                                  '_make_response.')

    def _make_redirect_error_response(self, redirect_uri, err):
        """Return a HTTP 302 redirect response object containing the error.

        :param redirect_uri: Client redirect URI.
        :type redirect_uri: str
        :param err: OAuth error message.
        :type err: str
        :rtype: requests.Response
        """
        params = {
            'error': err,
            'response_type': None,
            'client_id': None,
            'redirect_uri': None
        }
        redirect = utils.build_url(redirect_uri, params)
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


class AuthorizationProvider(Provider):
    """OAuth 2.0 authorization provider. This class manages authorization
    codes and access tokens. Certain methods MUST be overridden in a
    subclass, thus this class cannot be directly used as a provider.

    These are the methods that must be implemented in a subclass:

        get_client(self, client_id)
            # Return a Client instance. Exception if not found

        validate_client_secret(self, client, client_secret)
            # Return True or False

        validate_scope(self, client, scope)
            # Return True or False

        validate_redirect_uri(self, client_id, redirect_uri)
            # Return True or False

        validate_access(self)  # Use this to validate your app session user
            # Return True or False

        from_authorization_code(self, client_id, code, scope)
            # Return mixed data or None on invalid

        from_refresh_token(self, client_id, refresh_token, scope)
            # Return mixed data or None on invalid

        persist_authorization_code(self, user, client, code, scope)
            # Return value ignored

        persist_token_information(self, client_id, scope, access_token,
                                  token_type, expires_in, refresh_token,
                                  data)
            # Return value ignored

        discard_authorization_code(self, client_id, code)
            # Return value ignored

        discard_refresh_token(self, client_id, refresh_token)
            # Return value ignored

    Optionally, the following may be overridden to acheive desired behavior:

        @property
        token_length(self)

        @property
        token_type(self)

        @property
        token_expires_in(self)

        generate_authorization_code(self)

        generate_access_token(self)

        generate_refresh_token(self)

    """

    @property
    def token_length(self):
        """Property method to get the length used to generate tokens.

        :rtype: int
        """
        return 40

    @property
    def token_type(self):
        """Property method to get the access token type.

        :rtype: str
        """
        return 'Bearer'

    @property
    def token_expires_in(self):
        """Property method to get the token expiration time in seconds.

        :rtype: int
        """
        return 3600

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

    def validate_authorization_code_request(self, request, user, response_type, client, redirect_uri, scope='', **params):

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
            err = 'access_denied'
            return self._make_redirect_error_response(redirect_uri, err)

        if not self.validate_scope(client, scope):
            err = 'invalid_scope'
            return self._make_redirect_error_response(redirect_uri, err)

    def get_authorization_code(self, request, user, response_type, client_id, redirect_uri, **params):
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

        client = self.get_client(client_id)

        error_response = self.validate_authorization_code_request(request, user, response_type, client, redirect_uri, scope)
        if error_response is not None:
            return error_response

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

        except TypeError as exc:
            self._handle_exception(exc)

            # Catch missing parameters in request
            return self._make_error_response(request, 'invalid_request')
        except StandardError as exc:
            self._handle_exception(exc)

            # Catch all other server errors
            return self._make_error_response(request, 'server_error')

    def get_client(self, client_id): # pragma: no cover
        raise NotImplementedError('Subclasses must implement get_client.')

    def validate_client_secret(self, client, client_secret): # pragma: no cover
        raise NotImplementedError('Subclasses must implement validate_client_secret.')

    def validate_redirect_uri(self, client, redirect_uri): # pragma: no cover
        raise NotImplementedError('Subclasses must implement validate_redirect_uri.')

    def validate_scope(self, client, scope): # pragma: no cover
        raise NotImplementedError('Subclasses must implement validate_scope.')

    def validate_access(self): # pragma: no cover
        raise NotImplementedError('Subclasses must implement validate_access.')

    def from_authorization_code(self, client_id, code, scope): # pragma: no cover
        raise NotImplementedError('Subclasses must implement from_authorization_code.')

    def from_refresh_token(self, client_id, refresh_token, scope): # pragma: no cover
        raise NotImplementedError('Subclasses must implement from_refresh_token.')

    def persist_authorization_code(self, client, code, scope): # pragma: no cover
        raise NotImplementedError('Subclasses must implement persist_authorization_code.')

    def persist_token_information(self, client_id, scope, access_token,
                                  token_type, expires_in, refresh_token,
                                  data): # pragma: no cover
        raise NotImplementedError('Subclasses must implement persist_token_information.')

    def discard_authorization_code(self, client_id, code): # pragma: no cover
        raise NotImplementedError('Subclasses must implement discard_authorization_code.')

    def discard_refresh_token(self, client_id, refresh_token): # pragma: no cover
        raise NotImplementedError('Subclasses must implement discard_refresh_token.')
