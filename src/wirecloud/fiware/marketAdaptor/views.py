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
from django.utils import simplejson

from wirecloud.commons.baseviews import Resource
from wirecloud.fiware.marketAdaptor.marketadaptor import MarketAdaptor
from wirecloud.platform.models import Market


market_adaptors = {}


def get_market_adaptor(user, market):

    if user is None:
        username = ''

    if user not in market_adaptors:
        market_adaptors[username] = {}

    if market not in market_adaptors[username]:
        m = get_object_or_404(Market, user=user, name=market)
        options = json.loads(m.options)
        market_adaptors[username][market] = MarketAdaptor(options['url'])

    return market_adaptors[username][market]


class ServiceCollection(Resource):

    def read(self, request, marketplace, store):

        adaptor = get_market_adaptor(None, marketplace)

        try:
            result = adaptor.get_all_services_from_store(store)
        except:
            return HttpResponse(status=502)

        return HttpResponse(simplejson.dumps(result), mimetype='application/json; charset=UTF-8')

    def create(self, request, marketplace, store):

        service_info = {}
        service_info['name'] = request.POST['name']
        service_info['url'] = request.POST['url']

        adaptor = get_market_adaptor(None, marketplace)

        try:
            adaptor.add_service(store, service_info)
        except:
            return HttpResponse(status=502)

        return HttpResponse(status=201)


class ServiceEntry(Resource):

    def delete(self, request, marketplace, store, service_name):

        adaptor = get_market_adaptor(None, marketplace)

        try:
            adaptor.delete_service(store, service_name)
        except:
            return HttpResponse(status=502)

        return HttpResponse(status=204)


class ServiceSearchCollection(Resource):

    def read(self, request, marketplace, store='', keyword='widget'):

        adaptor = get_market_adaptor(None, marketplace)

        try:
            result = adaptor.full_text_search(store, keyword)
        except:
            return HttpResponse(status=502)

        return HttpResponse(simplejson.dumps(result), mimetype='application/json; chaset=UTF-8')


class AllStoresServiceCollection(Resource):

    def read(self, request, marketplace):

        adaptor = get_market_adaptor(None, marketplace)

        result = {'resources': []}
        try:
            stores = adaptor.get_all_stores()
            for store in stores:
                #This if is necesary in order to avoid an Http error
                #caused by and store without name that cant be deleted
                if store['name'] != '':
                    store_services = adaptor.get_all_services_from_store(store['name'])
                    result['resources'].extend(store_services['resources'])
        except:
            return HttpResponse(status=502)

        return HttpResponse(simplejson.dumps(result), mimetype='application/json; charset=UTF-8')


class StoreCollection(Resource):

    def read(self, request, marketplace):

        adaptor = get_market_adaptor(None, marketplace)

        try:
            result = adaptor.get_all_stores()
        except:
            return HttpResponse(status=502)

        return HttpResponse(simplejson.dumps(result), mimetype='application/json; chaset=UTF-8')
