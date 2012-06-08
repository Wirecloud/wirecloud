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

from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _

from commons.resource import Resource
from commons.utils import json_encode
from wirecloud.models.markets import Market


class MarketCollection(Resource):

    def read(self, request):
        result = {}

        for market in Market.objects.all():
            result[market.name] = market.options

            return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')

    def create(self, request):

        content_type = request.META.get('CONTENT_TYPE', '')
        if content_type == None:
            content_type = ''

        if not content_type.startswith('application/json'):
            return HttpResponseBadRequest(_("Invalid content type"), mimetype='text/plain; charset=UTF-8')

        try:
            received_data = json.loads(request.raw_post_data)
        except:
            return HttpResponseBadRequest(_("Request body is not valid JSON data"), mimetype='text/plain; charset=UTF-8')

        m = Market.objects.create(name=received_data['name'], options=json.dumps(received_data['options']))
        m.save()

        return HttpResponse(status=201)


class MarketEntry(Resource):

    def delete(self, request, market):

        m = get_object_or_404(Market, name=market)
        m.delete()
        return HttpResponse(status=204)

    def update(self, request, market):
        pass
