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
import os

from django.db.models import Q
from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.catalogue import utils as catalogue
from wirecloud.commons.baseviews import Resource, Service
from wirecloud.commons.utils.http import authentication_required, build_error_response, supported_request_mime_types
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.markets.utils import get_market_managers
from wirecloud.platform.models import Market


class MarketCollection(Resource):

    @authentication_required
    def read(self, request):
        result = {}

        for market in Market.objects.filter(Q(user=None) | Q(user=request.user)):
            market_key = unicode(market)
            market_data = json.loads(market.options)

            market_data['name'] = market.name

            if market.user is not None:
                market_data['user'] = market.user.username
            else:
                market_data['user'] = None

            market_data['permissions'] = {
                'delete': request.user.is_superuser or market.user == request.user
            }

            result[market_key] = market_data

        return HttpResponse(json.dumps(result), mimetype='application/json; charset=UTF-8')

    @authentication_required
    @supported_request_mime_types(('application/json'))
    @commit_on_http_success
    def create(self, request):

        try:
            received_data = json.loads(request.raw_post_data)
        except ValueError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        user_entry = request.user
        if received_data['options'].get('share', '') is True:
            user_entry = None

        if user_entry is None and not request.user.is_superuser:
            return HttpResponseForbidden()

        Market.objects.create(user=user_entry, name=received_data['name'], options=json.dumps(received_data['options']))

        return HttpResponse(status=201)


class MarketEntry(Resource):

    @authentication_required
    def delete(self, request, market, user=None):

        if (user is None and not request.user.is_superuser) or (user is None and market == 'local'):
            return HttpResponseForbidden()

        if user != request.user.username and not request.user.is_superuser:
            return HttpResponseForbidden()

        get_object_or_404(Market, user__username=user, name=market).delete()

        return HttpResponse(status=204)

    def update(self, request, market):
        pass


class PublishService(Service):

    @authentication_required
    @supported_request_mime_types(('application/json'))
    def process(self, request):

        try:
            data = json.loads(request.raw_post_data)
        except ValueError, e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        (resource_vendor, resource_name, resource_version) = data['resource'].split('/')
        resource = get_object_or_404(CatalogueResource, vendor=resource_vendor, short_name=resource_name, version=resource_version)

        if not resource.fromWGT:
            msg = _('Only packaged resources can be published')
            return build_error_response(request, 400, msg)

        base_dir = catalogue.wgt_deployer.get_base_dir(resource_vendor, resource_name, resource_version)
        wgt_file = WgtFile(os.path.join(base_dir, resource.template_uri))

        market_managers = get_market_managers(request.user)
        errors = {}
        for market_endpoint in data['marketplaces']:

            try:
                market_managers[market_endpoint['market']].publish(market_endpoint, wgt_file, request.user, request=request)
            except Exception, e:
                errors[market_endpoint['market']] = unicode(e)

        if len(errors) == 0:
            return HttpResponse(status=204)
        elif len(errors) == len(data['marketplaces']):
            return HttpResponse(json.dumps(errors), status=502, mimetype='application/json; charset=UTF-8')
        else:
            return HttpResponse(json.dumps(errors), status=200, mimetype='application/json; charset=UTF-8')
