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

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_http_methods, require_POST
from django.shortcuts import render

from wirecloud.commons.utils.http import get_absolute_reverse_url, build_error_response
from wirecloud.oauth2provider.provider import WirecloudAuthorizationProvider
from wirecloud.platform.core.plugins import get_version_hash


provider = WirecloudAuthorizationProvider()


@cache_page(60 * 60 * 24, key_prefix='oauth2provider-info-%s' % get_version_hash())
@require_GET
def oauth_discovery(request):

    endpoints = {
        'flows': ["Authorization Code Grant"],
        'auth_endpoint': get_absolute_reverse_url('oauth2provider.auth', request),
        'token_endpoint': get_absolute_reverse_url('oauth2provider.token', request),
        'default_redirect_uri': get_absolute_reverse_url('oauth.default_redirect_uri', request),
        'version': '2.0',
    }

    return HttpResponse(json.dumps(endpoints, sort_keys=True), content_type='application/json; charset=UTF-8')


@require_http_methods(["GET", "POST"])
@login_required
@csrf_protect
def provide_authorization_code(request):

    params = request.GET.dict()

    if 'redirect_uri' not in params:
        return build_error_response(request, 400, 'Missing redirect_uri parameter')

    if 'response_type' not in params or 'client_id' not in params:
        return provider._make_redirect_error_response(params['redirect_uri'], 'invalid_request')

    try:
        client = provider.get_client(params['client_id'])
    except:
        client = None
    error_response = provider.validate_authorization_code_request(request, request.user, client=client, **params)
    if error_response is not None:
        return error_response

    if request.method == 'GET':
        return render(request, 'wirecloud/oauth2provider/auth.html', {'app': client})
    elif request.POST.get('action') == 'auth':
        return provider.get_authorization_code(request, request.user, client=client, **params)
    else:
        return provider._make_redirect_error_response(params['redirect_uri'], 'access_denied')


@require_POST
def provide_authorization_token(request):

    return provider.get_token_from_post_data(request, request.POST.dict())
