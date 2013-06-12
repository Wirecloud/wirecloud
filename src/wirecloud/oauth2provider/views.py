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


from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods, require_POST
from django.shortcuts import render

from wirecloud.oauth2provider.provider import WirecloudAuthorizationProvider


provider = WirecloudAuthorizationProvider()


@require_http_methods(["GET", "POST"])
@login_required
def provide_authorization_code(request):

    params = request.GET.dict()

    if 'response_type' not in params:
        return build_error_response(request, 400, 'Missing parameter response_type in URL query')

    if 'client_id' not in params:
        return build_error_response(request, 400, 'Missing parameter client_id in URL query')

    if 'redirect_uri' not in params:
        return build_error_response(request, 400, 'Missing parameter redirect_uri in URL query')

    if request.method == 'GET':
        return render(request, 'wirecloud/oauth2provider/auth.html', {'app': provider.get_client(params['client_id'])})
    else:
        return provider.get_authorization_code(request.user, **params)


@require_POST
def provide_authorization_token(request):

    return provider.get_token_from_post_data(request.POST.dict())
