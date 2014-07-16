# -*- coding: utf-8 -*-

# Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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
from django.contrib.auth import REDIRECT_FIELD_NAME, logout as django_logout
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.http import require_GET

from wirecloud.commons.authentication import logout as wirecloud_logout
from wirecloud.commons.utils.http import build_error_response, get_absolute_reverse_url
from wirecloud.fiware import DEFAULT_FIWARE_PORTALS

ALLOWED_ORIGINS = [portal['url'] for portal in getattr(settings, 'FIWARE_PORTALS', DEFAULT_FIWARE_PORTALS)]


@require_GET
def oauth_discovery(request):

    from social_auth.backends import get_backends

    fiware_auth_backend = get_backends()['fiware']
    endpoints = {
        'auth_endpoint': fiware_auth_backend.AUTHORIZATION_URL,
        'token_endpoint': fiware_auth_backend.ACCESS_TOKEN_URL,
        'default_redirect_uri': get_absolute_reverse_url('oauth.default_redirect_uri', request),
        'version': '2.0',
    }

    return HttpResponse(json.dumps(endpoints), content_type='application/json; charset=UTF-8')

def login(request):

    if request.user.is_authenticated():
        url = request.GET.get(REDIRECT_FIELD_NAME, '/')
    else:
        url = reverse('socialauth_begin', kwargs={'backend': 'fiware'}) + '?' + request.GET.urlencode() 

    return HttpResponseRedirect(url)


def logout(request):

    response = HttpResponse(status=204)

    # Check if the logout request is originated in a different domain
    if 'HTTP_ORIGIN' in request.META:
        origin = request.META['HTTP_ORIGIN']

        if origin in ALLOWED_ORIGINS:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] =  'true'
        else:
            response = build_error_response(request, 403, '')

    if request.method == 'GET' and response.status_code == 204:
        return wirecloud_logout(request)

    return response
