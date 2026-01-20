import logging
import requests
from django.conf import settings
from jose import jwt, exceptions
from .exceptions import AccessTokenError, TokenVerificationError
from .vc_payload import VCPayload

class VCLogin:
    """
    Utility class for the Verifiable Credential (VC) login flow.
    Reads configuration directly from django.conf.settings.
    """

    # --- Internal Utility Function to get Configuration ---
    @staticmethod
    def _get_config():
        """Reads and returns the VC login settings dictionary from Django settings."""
        return settings.VC_LOGIN_CONFIG

    # --- Auxiliary Static Methods ---

    @staticmethod
    def _verify_jwk(token, jwks_data):
        """
        Verifies the signature and validity of a JWT token using a JWKS dictionary.
        Raises TokenVerificationError on failure.
        """
        try:
            payload = jwt.decode(
                token,
                key=jwks_data,
                options={
                    "verify_aud": False
                }
            )
            return payload

        except exceptions.ExpiredSignatureError:
            logging.error("Token expired")
            raise TokenVerificationError("Token expired")
        except exceptions.JWTError as e:
            logging.error(f"Invalid token: {e}")
            raise TokenVerificationError("Invalid token")

    @staticmethod
    def _make_token_request(params):
        """Performs the POST request to exchange the authorization code for tokens."""
        logging.info('Making token request to verifier')
        config = VCLogin._get_config()

        try:
            # Construct the token endpoint URL
            url = f"{config['verifier_host']}{config['verifier_token_path']}"
            logging.info(f"Getting token from {url}")
            response = requests.post(url, data=params)

            # Raises an exception for 4xx or 5xx status codes
            response.raise_for_status()

            logging.info(f"Token response: {response.status_code}")
            data = response.json()

            access_token = data.get('access_token')
            # Fallback to access_token if refresh_token is missing
            refresh_token = data.get('refresh_token') or access_token

            logging.info('Token info successfully parsed')
            return {
                "access_token": access_token,
                "refresh_token": refresh_token
            }

        except requests.exceptions.HTTPError as err:
            # Catch HTTP errors (4xx, 5xx)
            status_code = err.response.status_code
            reason = err.response.json()
            print(f"Error getting access token from the verifier (Status: {status_code}\n Message: {reason})")
            raise AccessTokenError('Failed to obtain access token', status_code)

        except requests.exceptions.RequestException as err:
            # Catch connection errors (DNS, timeouts, etc.)
            print(err)
            raise AccessTokenError('Failed to obtain access token (Connection Error)', 500)


    # --- Public Static Methods ---

    @staticmethod
    def _verify_token(access_token):
        """Verifies the JWT signature and returns the payload if valid."""
        config = VCLogin._get_config()

        logging.info(f"Verify access token: {access_token[:10]}...")
        try:
            # 1. Get JWKS endpoint URL and fetch keys
            url = f"{config['verifier_host']}{config['verifier_jwks_path']}"
            logging.debug(f"Requesting JWKS from '{url}'")
            response = requests.get(url)
            response.raise_for_status()

            jwks = response.json()

            try:
                # 2. Verify token using JWKS
                payload = VCLogin._verify_jwk(access_token, jwks)

                logging.info('Token verified')
                return payload

            except TokenVerificationError as err:
                # Catch specific JOSE errors handled by _verify_jwk
                logging.error(f'Token verification failed: {err}')
                return None

        except requests.exceptions.HTTPError as err:
            status_code = err.response.status_code
            print(f'Error Accessing JWSK endpoint (Status: {status_code})')
            return None

        except requests.exceptions.RequestException as err:
            print('Exception Accessing JWSK endpoint')
            print(err)
            return None

        except Exception as err:
            print('General exception during verification')
            print(err)
            return None


    @staticmethod

    def login(code, redirect_uri) -> VCPayload:
        logging.info("Requesting a new token using provided code")
        params = {
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': redirect_uri
        }
        token_info = VCLogin._make_token_request(params)

        return VCLogin._load_user_profile(token_info['access_token'], token_info['refresh_token'])

    @staticmethod
    def _load_user_profile(access_token, refresh_token) -> VCPayload:
        """Loads the user profile data from the verified Verifiable Credential payload."""

        credential_Type = settings.VC_LOGIN_CONFIG['credential_type']
        # Call static method to verify and get payload
        payload = VCLogin._verify_token(access_token)

        if payload is None:
            logging.error("Payload is empty or verification failed")
            return VCPayload(None, refresh_token=refresh_token)

        vc = payload.get('verifiableCredential')
        if not vc:
            logging.warning("Payload is not a verifiableCredential type")
            return VCPayload(None, refresh_token=refresh_token)

        # Check for specific credential type and extract fields
        if vc['type'] == credential_Type:
            logging.info(f"VC is type {credential_Type}. Extracting subject claims.")
            subject = vc['credentialSubject']
            return VCPayload(
                subject.get('email'),
                first_name=subject.get('firstName', ''),
                last_name=subject.get('lastName', ''),
                type=vc['type'],
                roles=subject.get('roles'))
        else:
            logging.warning(f"Not supported VC type: {vc['type']}")
            return VCPayload(None, refresh_token=refresh_token)