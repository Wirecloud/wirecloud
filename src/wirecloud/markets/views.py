# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

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

import json

from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden
from django.shortcuts import get_object_or_404
from django.utils import simplejson
from django.utils.translation import ugettext as _

from commons.resource import Resource
from commons.utils import json_encode
from wirecloud.models import Market
from wirecloudcommons.utils.http import supported_request_mime_types
from wirecloudcommons.utils.transaction import commit_on_http_success


class MarketCollection(Resource):

    @method_decorator(login_required)
    def read(self, request):
        result = {}

        for market in Market.objects.filter(Q(user=None) | Q(user=request.user)):
            result[market.name] = simplejson.loads(market.options)
            if market.user is not None:
                result[market.name]['user'] = market.user.username
            else:
                result[market.name]['user'] = None

        return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')

    @method_decorator(login_required)
    @supported_request_mime_types(('application/json'))
    @commit_on_http_success
    def create(self, request):

        try:
            received_data = json.loads(request.raw_post_data)
        except:
            return HttpResponseBadRequest(_("Request body is not valid JSON data"), mimetype='text/plain; charset=UTF-8')

        user_entry = request.user
        if received_data['options'].get('share', '') is True:
            user_entry = None

        if user_entry is None and not request.user.is_superuser:
            return HttpResponseForbidden()

        Market.objects.create(user=user_entry, name=received_data['name'], options=json.dumps(received_data['options']))

        return HttpResponse(status=201)


class MarketEntry(Resource):

    @method_decorator(login_required)
    def delete(self, request, market, user=None):

        if (user is None and not request.user.is_superuser) or (user is None and market == 'local'):
            return HttpResponseForbidden()

        if user != request.user.username and not request.user.is_superuser:
            return HttpResponseForbidden()

        if user != request.user.username:
            get_object_or_404(Market, user=request.user, name=market).delete()
        else:
            get_object_or_404(Market, user__username=user, name=market).delete()

        return HttpResponse(status=204)

    def update(self, request, market):
        pass
