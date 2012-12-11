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
import urlparse

from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden
from django.shortcuts import get_object_or_404
from django.utils import simplejson
from django.utils.translation import ugettext as _

from commons import http_utils
from commons.resource import Resource
from commons.service import Service
from commons.utils import json_encode
from wirecloud.commons.utils.http import supported_request_mime_types
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.platform.markets.utils import get_market_managers
from wirecloud.platform.models import Market, PublishedWorkspace
from wirecloud.platform.workspace.mashupTemplateGenerator import build_usdl_from_workspace


class MarketCollection(Resource):

    @method_decorator(login_required)
    def read(self, request):
        result = {}

        for market in Market.objects.filter(Q(user=None) | Q(user=request.user)):
            market_key = unicode(market)
            result[market_key] = simplejson.loads(market.options)
            result[market_key]['name'] = market.name
            if market.user is not None:
                result[market_key]['user'] = market.user.username
            else:
                result[market_key]['user'] = None

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


class PublishService(Service):

    @method_decorator(login_required)
    @supported_request_mime_types(('application/json'))
    def process(self, request):
        data = json.loads(request.raw_post_data)
        template_url = data['template_url']

        path = request.build_absolute_uri()
        login_scheme, login_netloc = urlparse.urlparse(template_url)[:2]
        current_scheme, current_netloc = urlparse.urlparse(path)[:2]
        if ((not login_scheme or login_scheme == current_scheme) and
            (not login_netloc or login_netloc == current_netloc)):
            pworkspace_id = template_url.split('/')[-2]
            published_workspace = PublishedWorkspace.objects.get(id=pworkspace_id)
            description = published_workspace.template
        else:
            description = http_utils.download_http_content(template_url, user=request.user)

        usdl_info = None
        if data.get('usdl', None) is not None:
            usdl_info = {
                'data': http_utils.download_http_content(data['usdl'], user=request.user),
                'content_type': 'application/rdf+xml'
            }

        market_managers = get_market_managers(request.user)
        errors = {}
        publish_options = json.loads(published_workspace.params)
        for market_endpoint in data['marketplaces']:

            try:
                name = publish_options.get('name').replace(' ', '')
                template_location = market_managers[market_endpoint['market']].build_repository_url(market_endpoint, name + 'Mdl')
                usdl = build_usdl_from_workspace(publish_options, published_workspace.workspace, request.user, template_location, usdl_info=usdl_info)
                market_managers[market_endpoint['market']].publish(market_endpoint, description, name, request.user, usdl=usdl, request=request)
            except Exception, e:
                errors[market_endpoint['market']] = unicode(e)

        if len(errors) == 0:
            return HttpResponse(status=204)
        elif len(errors) == len(data['marketplaces']):
            return HttpResponse(json_encode(errors), status=502, mimetype='application/json; charset=UTF-8')
        else:
            return HttpResponse(json_encode(errors), status=200, mimetype='application/json; charset=UTF-8')
