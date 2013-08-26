# -*- coding: utf-8 -*-

# Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecluod.

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

from django.http import HttpResponse
from django.shortcuts import get_object_or_404

from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.http import get_absolute_reverse_url
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
        options = json.loads(m.options)
        market_adaptors[username][market] = MarketAdaptor(options['url'])

    return market_adaptors[username][market]


def get_market_user_data(user, market_user, market_name):

    if market_user == 'public':
        market_user = None

    user_data = {}
    for user_data_entry in MarketUserData.objects.filter(market__user__username=market_user, market__name=market_name, user=user):
        try:
            user_data[user_data_entry.name] = json.loads(user_data_entry.value)
        except:
            user_data[user_data_entry.name] = None

    try:
        user_data['idm_token'] = user.social_auth.filter(provider='fiware').select_related('tokens').get().tokens['access_token']
    except:
        pass

    return user_data


class ServiceCollection(Resource):

    def read(self, request, market_user, market_name, store):

        adaptor = get_market_adaptor(market_user, market_name)
        user_data = get_market_user_data(request.user, market_user, market_name)

        try:
            result = adaptor.get_all_services_from_store(store, **user_data)
        except:
            return HttpResponse(status=502)

        return HttpResponse(json.dumps(result), mimetype='application/json; charset=UTF-8')


class ServiceSearchCollection(Resource):

    def read(self, request, market_user, market_name, store='', search_string='widget'):

        adaptor = get_market_adaptor(market_user, market_name)
        user_data = get_market_user_data(request.user, market_user, market_name)

        try:
            result = adaptor.full_text_search(store, search_string, user_data)
        except:
            return HttpResponse(status=502)

        return HttpResponse(json.dumps(result), mimetype='application/json; chaset=UTF-8')


class AllStoresServiceCollection(Resource):

    def read(self, request, market_user, market_name):

        adaptor = get_market_adaptor(market_user, market_name)
        user_data = get_market_user_data(request.user, market_user, market_name)

        result = {'resources': []}
        try:
            stores = adaptor.get_all_stores()
            for store in stores:
                #This if is necesary in order to avoid an Http error
                #caused by and store without name that cant be deleted
                if store['name'] != '':
                    store_services = adaptor.get_all_services_from_store(store['name'], **user_data)
                    result['resources'].extend(store_services['resources'])
        except:
            return HttpResponse(status=502)

        return HttpResponse(json.dumps(result), mimetype='application/json; charset=UTF-8')


class StoreCollection(Resource):

    def read(self, request, market_user, market_name):

        adaptor = get_market_adaptor(market_user, market_name)

        try:
            result = adaptor.get_all_stores()
        except:
            return HttpResponse(status=502)

        return HttpResponse(json.dumps(result), mimetype='application/json; chaset=UTF-8')


def start_purchase(request, market_user, market_name, store):

    adaptor = get_market_adaptor(market_user, market_name)
    user_data = get_market_user_data(request.user, market_user, market_name)

    data = json.loads(request.raw_post_data)

    redirect_uri = get_absolute_reverse_url('wirecloud.fiware.store_redirect_uri', request)
    try:
        result = adaptor.start_purchase(store, data['offering_url'], redirect_uri, **user_data)
    except:
        return HttpResponse(status=502)

    return HttpResponse(json.dumps(result), mimetype='application/json; chaset=UTF-8')
