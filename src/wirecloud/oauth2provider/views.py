# -*- coding: utf-8 -*-

# Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid

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
from django.views.decorators.http import require_GET, require_http_methods, require_POST
from django.shortcuts import render

from wirecloud.commons.utils.http import get_absolute_reverse_url, build_error_response
from wirecloud.oauth2provider.provider import WirecloudAuthorizationProvider


provider = WirecloudAuthorizationProvider()

@require_GET
def oauth_discovery(request):

    endpoints = {
        'auth_endpoint': get_absolute_reverse_url('oauth2provider.auth', request),
        'token_endpoint': get_absolute_reverse_url('oauth2provider.token', request),
        'default_redirect_uri': get_absolute_reverse_url('oauth.default_redirect_uri', request),
        'version': '2.0',
    }

    return HttpResponse(json.dumps(endpoints), content_type='application/json; charset=UTF-8')

@require_http_methods(["GET", "POST"])
@login_required
def provide_authorization_code(request):

    params = request.GET.dict()

    if 'redirect_uri' not in params:
        return build_error_response(request, 400, 'Missing redirect_uri parameter')

    if 'response_type' not in params or 'client_id' not in params:
        return provider._make_redirect_error_response(params['redirect_uri'], 'invalid_request')

    if request.method == 'GET':
        try:
            client = provider.get_client(params['client_id'])
        except:
            client = None
        error_response = provider.validate_authorization_code_request(request, request.user, client=client, **params)
        if error_response is None:
            return render(request, 'wirecloud/oauth2provider/auth.html', {'app': client})
        else:
            return error_response
    else:
        return provider.get_authorization_code(request, request.user, **params)


@require_POST
def provide_authorization_token(request):

    return provider.get_token_from_post_data(request, request.POST.dict())
