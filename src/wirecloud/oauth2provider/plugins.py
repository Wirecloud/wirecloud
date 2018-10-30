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

import time

from django.utils.translation import ugettext as _

from wirecloud.commons.exceptions import HttpBadCredentials
from wirecloud.platform.plugins import WirecloudPlugin
from wirecloud.oauth2provider.models import Token
from wirecloud.oauth2provider.urls import urlpatterns


def auth_oauth2_token(auth_type, token):

    token = Token.objects.get(token=token)
    if (int(token.creation_timestamp) + int(token.expires_in)) <= time.time():
        raise HttpBadCredentials(_('Expired access token'), 'Bearer realm="WireCloud", error="invalid_token", error_description="expired access token"')

    return token.user


class OAuth2ProviderPlugin(WirecloudPlugin):

    features = {
        'OAuth2Provider': '0.5',
    }

    def get_urls(self):
        return urlpatterns

    def get_api_auth_backends(self):

        return {
            'Bearer': auth_oauth2_token,
        }
