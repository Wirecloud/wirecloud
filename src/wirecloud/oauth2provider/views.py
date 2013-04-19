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


from django.http import HttpResponse, HttpResponseNotAllowed

from wirecloud.oauth2provider.provider import WirecloudAuthorizationProvider


provider = WirecloudAuthorizationProvider()


def provide_authorization_code(request):

    pyoauth2_response = provider.get_authorization_code_from_uri(request.get_full_path())
    response = HttpResponse(pyoauth2_response.content, status=pyoauth2_response.status_code)
    for k, v in pyoauth2_response.headers.iteritems():
        response[k] = v

    return response

def provide_authorization_token(request):

    if request.method == 'POST':
        pyoauth2_response = provider.get_token_from_post_data(request.POST.dict())

    response = HttpResponse(pyoauth2_response.content, status=pyoauth2_response.status_code)
    for k, v in pyoauth2_response.headers.iteritems():
        response[k] = v

    return response
