# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.conf import settings
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.http import require_GET

from wirecloud.commons.authentication import logout as wirecloud_logout
from wirecloud.commons.utils.http import build_error_response, get_absolute_reverse_url

ALLOWED_ORIGINS = [portal['url'] for portal in getattr(settings, 'FIWARE_PORTALS', ())]


@require_GET
def oauth_discovery(request):

    from social_django.utils import BACKENDS, get_backend
    fiware_auth_backend = get_backend(BACKENDS, 'fiware')

    endpoints = {
        'flows': ["Authorization Code Grant", "Resource Owner Password Credentials Grant"],
        'auth_endpoint': fiware_auth_backend.AUTHORIZATION_URL,
        'token_endpoint': fiware_auth_backend.ACCESS_TOKEN_URL,
        'default_redirect_uri': get_absolute_reverse_url('oauth.default_redirect_uri', request),
        'version': '2.0',
    }

    return HttpResponse(json.dumps(endpoints, sort_keys=True), content_type='application/json; charset=UTF-8')


@require_GET
def login(request):

    if request.user.is_authenticated():
        url = request.GET.get(REDIRECT_FIELD_NAME, '/')
    else:
        url = reverse('social:begin', kwargs={'backend': 'fiware'}) + '?' + request.GET.urlencode()

    return HttpResponseRedirect(url)


@require_GET
def logout(request):

    external_domain = 'HTTP_ORIGIN' in request.META

    # Check if the logout request is originated in a different domain
    if external_domain:
        origin = request.META['HTTP_ORIGIN']

        if origin not in ALLOWED_ORIGINS:
            return build_error_response(request, 403, '')

        # Force not redirect by using next_page=None
        response = wirecloud_logout(request, next_page=None)
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Credentials'] = 'true'
        return response
    else:
        return wirecloud_logout(request)
