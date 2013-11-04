# -*- coding: utf-8 -*-

# Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.contrib.auth import REDIRECT_FIELD_NAME, logout as django_logout
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect

from wirecloud.commons.utils.http import build_error_response


ALLOWED_ORIGINS = (
    'https://account.lab.fi-ware.eu',
    'https://cloud.lab.fi-ware.eu',
    'https://store.lab.fi-ware.eu',
)

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
        django_logout(request)

    return response
