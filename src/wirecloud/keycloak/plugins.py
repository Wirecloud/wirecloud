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

from wirecloud.platform.plugins import WirecloudPlugin

try:
    from social_django.utils import BACKENDS, get_backend, load_strategy
    KEYCLOAK_SOCIAL_AUTH_BACKEND = get_backend(BACKENDS, 'keycloak')(load_strategy())

    IDM_SUPPORT_ENABLED = 'wirecloud.keycloak' in settings.INSTALLED_APPS and 'social_django' in settings.INSTALLED_APPS
except:
    IDM_SUPPORT_ENABLED = False


def auth_keycloak_token(auth_type, token):

    from social_django.models import UserSocialAuth
    user_data = KEYCLOAK_SOCIAL_AUTH_BACKEND.user_data(token)
    return UserSocialAuth.objects.get(provider='keycloak', uid=user_data['username']).user


class KeycloakPlugin(WirecloudPlugin):
    def get_urls(self):

        if IDM_SUPPORT_ENABLED:
            from wirecloud.keycloak.views import oauth_discovery
            return (
                url('^.well-known/oauth$', cache_page(7 * 24 * 60 * 60, key_prefix='well-known-oauth-%s' % get_version_hash())(oauth_discovery), name='oauth.discovery'),
            )
        else:
            return ()

    def get_api_auth_backends(self):

        if IDM_SUPPORT_ENABLED:
            return {
                'Bearer': auth_keycloak_token,
            }
        else:
            return {}

    def get_constants(self):
        if IDM_SUPPORT_ENABLED:
            global KEYCLOAK_SOCIAL_AUTH_BACKEND
            import wirecloud.keycloak.social_auth_backend
            constants["FIWARE_IDM_SERVER"] = KEYCLOAK_SOCIAL_AUTH_BACKEND.IDM_SERVER

        return constants

    def get_proxy_processors(self):
        return ('wirecloud.keycloak.proxy.IDMTokenProcessor',)
