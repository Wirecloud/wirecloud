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
import os

from django.contrib.auth.models import User
from django.db import IntegrityError
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.catalogue import utils as catalogue
from wirecloud.commons.baseviews import Resource, Service
from wirecloud.commons.utils.http import authentication_required, build_error_response, consumes, parse_json_request, validate_url_param
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.markets.utils import get_market_managers
from wirecloud.platform.models import Market


class MarketCollection(Resource):

    @authentication_required
    def read(self, request):
        result = []

        for market in Market.objects.filter(Q(public=True) | Q(user=request.user)).order_by('user'):
            market_data = market.options
            market_data['name'] = market.name
            market_data['user'] = market.user.username
            market_data['public'] = market.public

            market_data['permissions'] = {
                'delete': request.user.is_superuser or market.user == request.user
            }

            result.append(market_data)

        return HttpResponse(json.dumps(result, sort_keys=True), content_type='application/json; charset=UTF-8')

    @authentication_required
    @consumes(('application/json'))
    @commit_on_http_success
    def create(self, request):

        received_data = parse_json_request(request)
        received_data.setdefault("public", False)

        validate_url_param(request, 'url', received_data['url'])

        if 'user' not in received_data or received_data['user'] == request.user.username:
            target_user = request.user
        else:
            try:
                target_user = User.objects.get(username=received_data['user'])
            except:
                return build_error_response(request, 422, _("invalid user option"))

        if target_user != request.user and not request.user.is_superuser:
            return build_error_response(request, 403, _("You don't have permissions for adding marketplaces in name of other user"))

        received_data['user'] = target_user.username

        try:
            Market.objects.create(user=target_user, name=received_data['name'], public=received_data['public'], options=received_data)
        except IntegrityError:
            return build_error_response(request, 409, 'Market name already in use')

        market_managers = get_market_managers(target_user)
        market_managers[target_user.username + '/' + received_data['name']].create(target_user)

        return HttpResponse(status=201)


class MarketEntry(Resource):

    @authentication_required
    @commit_on_http_success
    def delete(self, request, user, market):

        if user is None and (not request.user.is_superuser or market == 'local'):
            return build_error_response(request, 403, _('You are not allowed to delete this market'))

        if user != request.user.username and not request.user.is_superuser:
            return build_error_response(request, 403, _('You are not allowed to delete this market'))

        if user == request.user.username:
            target_user = request.user
        else:
            target_user = get_object_or_404(User, username=user)

        market_managers = get_market_managers(target_user)

        get_object_or_404(Market, user__username=user, name=market).delete()
        market_managers[user + '/' + market].delete()

        return HttpResponse(status=204)


class PublishService(Service):

    @authentication_required
    @consumes(('application/json'))
    def process(self, request):

        data = parse_json_request(request)

        (resource_vendor, resource_name, resource_version) = data['resource'].split('/')
        resource = get_object_or_404(CatalogueResource, vendor=resource_vendor, short_name=resource_name, version=resource_version)

        if not resource.is_available_for(request.user):
            return build_error_response(request, 403, _('You are not allowed to delete this market'))

        base_dir = catalogue.wgt_deployer.get_base_dir(resource_vendor, resource_name, resource_version)
        wgt_file = WgtFile(os.path.join(base_dir, resource.template_uri))

        market_managers = get_market_managers(request.user)
        errors = {}
        for market_endpoint in data['marketplaces']:

            try:
                market_managers[market_endpoint['market']].publish(market_endpoint, wgt_file, request.user, request=request)
            except Exception as e:
                errors[market_endpoint['market']] = str(e)

        if len(errors) == 0:
            return HttpResponse(status=204)
        elif len(errors) == len(data['marketplaces']):
            return build_error_response(request, 502, _('Something went wrong (see details for more info)'), details=errors)
        else:
            return build_error_response(request, 200, _('Something went wrong (see details for more info)'), details=errors)
