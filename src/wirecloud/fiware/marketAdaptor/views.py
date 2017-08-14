# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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
import time
from six.moves.urllib.error import HTTPError

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from requests.exceptions import ConnectionError, Timeout

from wirecloud.commons.baseviews import Resource, Service
from wirecloud.commons.utils.http import authentication_required, build_error_response, get_absolute_reverse_url, consumes, parse_json_request, produces
from wirecloud.fiware.marketAdaptor.marketadaptor import MarketAdaptor
from wirecloud.platform.models import Market, MarketUserData


market_adaptors = {}


def get_market_adaptor(market_user, market):

    if market_user is None or market_user == 'public':
        market_user = None
        username = ''
    else:
        username = market_user

    if market_user not in market_adaptors:
        market_adaptors[username] = {}

    if market not in market_adaptors[username]:
        m = get_object_or_404(Market, user__username=market_user, name=market)
        market_adaptors[username][market] = MarketAdaptor(m.options['url'])

    return market_adaptors[username][market]


def get_market_user_data(user, market_user, market_name):

    from wirecloud.fiware.proxy import STRATEGY

    if market_user == 'public':
        market_user = None

    user_data = {}
    for user_data_entry in MarketUserData.objects.filter(market__user__username=market_user, market__name=market_name, user=user):
        try:
            user_data[user_data_entry.name] = json.loads(user_data_entry.value)
        except:
            user_data[user_data_entry.name] = None

    try:
        oauth_info = user.social_auth.get(provider='fiware')
        if oauth_info.access_token is None:
            raise Exception

        # Refresh the token if the token has been expired or the token expires
        # in less than 30 seconds
        # Also refresh the token if expires_on information does not exist yet
        if time.time() > oauth_info.extra_data.get('expires_on', 0) - 30:
            oauth_info.refresh_token(STRATEGY)

        user_data['idm_token'] = oauth_info.access_token
    except:
        pass

    return user_data


class ServiceCollection(Resource):

    @authentication_required
    def read(self, request, market_user, market_name, store):

        adaptor = get_market_adaptor(market_user, market_name)
        user_data = get_market_user_data(request.user, market_user, market_name)

        try:
            result = adaptor.get_all_services_from_store(store, **user_data)
        except HTTPError as e:
            details = "%s" % e
            return build_error_response(request, 502, "Unexpected response", details=details)
        except (ConnectionError, Timeout):
            return build_error_response(request, 504, "Connection Error")

        return HttpResponse(json.dumps(result, sort_keys=True), content_type='application/json; charset=UTF-8')


class ServiceSearchCollection(Resource):

    @authentication_required
    def read(self, request, market_user, market_name, store='', search_string='widget'):

        adaptor = get_market_adaptor(market_user, market_name)
        user_data = get_market_user_data(request.user, market_user, market_name)

        try:
            result = adaptor.full_text_search(store, search_string, user_data)
        except HTTPError as e:
            details = "%s" % e
            return build_error_response(request, 502, "Unexpected response", details=details)
        except (ConnectionError, Timeout):
            return build_error_response(request, 504, "Connection Error")

        return HttpResponse(json.dumps(result, sort_keys=True), content_type='application/json; chaset=UTF-8')


class ServiceEntry(Resource):

    @authentication_required
    def read(self, request, market_user, market_name, store, offering_id):

        adaptor = get_market_adaptor(market_user, market_name)
        user_data = get_market_user_data(request.user, market_user, market_name)

        try:
            offering_info = adaptor.get_offering_info(store, offering_id, user_data)[0]
        except HTTPError as e:
            details = "%s" % e
            return build_error_response(request, 502, "Unexpected response", details=details)
        except (ConnectionError, Timeout):
            return build_error_response(request, 504, "Connection Error")

        return HttpResponse(json.dumps(offering_info, sort_keys=True), content_type='application/json; charset=UTF-8')


class AllStoresServiceCollection(Resource):

    @authentication_required
    def read(self, request, market_user, market_name):

        adaptor = get_market_adaptor(market_user, market_name)
        user_data = get_market_user_data(request.user, market_user, market_name)

        result = {'resources': []}
        try:
            stores = adaptor.get_all_stores()
            for store in stores:
                store_services = adaptor.get_all_services_from_store(store['name'], **user_data)
                result['resources'].extend(store_services['resources'])
        except HTTPError as e:
            details = "%s" % e
            return build_error_response(request, 502, "Unexpected response", details=details)
        except (ConnectionError, Timeout):
            return build_error_response(request, 504, "Connection Error")

        return HttpResponse(json.dumps(result, sort_keys=True), content_type='application/json; charset=UTF-8')


class StoreCollection(Resource):

    @authentication_required
    def read(self, request, market_user, market_name):

        adaptor = get_market_adaptor(market_user, market_name)

        try:
            result = adaptor.get_all_stores()
        except HTTPError as e:
            details = "%s" % e
            return build_error_response(request, 502, "Unexpected response", details=details)
        except (ConnectionError, Timeout):
            return build_error_response(request, 504, "Connection Error")

        return HttpResponse(json.dumps(result, sort_keys=True), content_type='application/json; chaset=UTF-8')


class StartPurchaseService(Service):

    @authentication_required
    @consumes(('application/json',))
    @produces(('application/json',))
    def process(self, request, market_user, market_name, store):

        adaptor = get_market_adaptor(market_user, market_name)
        user_data = get_market_user_data(request.user, market_user, market_name)

        data = parse_json_request(request)

        redirect_uri = get_absolute_reverse_url('wirecloud.fiware.store_redirect_uri', request)
        try:
            result = adaptor.start_purchase(store, data['offering_url'], redirect_uri, **user_data)
        except HTTPError as e:
            details = "%s" % e
            return build_error_response(request, 502, "Unexpected response", details=details)
        except (ConnectionError, Timeout):
            return build_error_response(request, 504, "Connection Error")

        return HttpResponse(json.dumps(result, sort_keys=True), content_type='application/json; chaset=UTF-8')
