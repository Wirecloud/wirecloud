# -*- coding: utf-8 -*-

#...............................licence...........................................
#
#     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
#     S.A.Unipersonal (Telefonica I+D)
#
#     This file is part of Morfeo EzWeb Platform.
#
#     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
#
#     You should have received a copy of the GNU Affero General Public License
#     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
#
#     Info about members and contributors of the MORFEO project
#     is available at
#
#     http://morfeo-project.org
#
#...............................licence...........................................#


#
import json
from django.utils.translation import ugettext as _
from django.http import HttpResponse, HttpResponseServerError, HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from commons.http_utils import download_http_content
from marketAdaptor.marketadaptor import MarketAdaptor
from commons.resource import Resource
from commons.utils import json_encode
from wirecloud.models.markets import Market


class ServiceCollection(Resource):

    def read(self, request, marketplace, store):
        #import ipdb;ipdb.set_trace()
        m = get_object_or_404(Market, name=marketplace)
        options = json.loads(m.options)
        url = options['url']

        adaptor = MarketAdaptor(url)
        try:
            result = adaptor.get_all_services_from_store(store)
        except:
            return HttpResponse(status=502)

        return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')

    def create(self, request, marketplace, store):

        service_info = {}
        service_info['name'] = request.POST['name']
        service_info['url'] = request.POST['url']

        m = get_object_or_404(Market, name=marketplace)
        options = json.loads(m.options)
        url = options['url']

        adaptor = MarketAdaptor(url)

        try:
            adaptor.add_service(store, service_info)
        except:
            return HttpResponse(status=502)

        return HttpResponse(status=201)


class ServiceEntry(Resource):

    def delete(self, request, marketplace, store, service_name):
        m = get_object_or_404(Market, name=marketplace)
        options = json.loads(m.options)
        url = options['url']

        adaptor = MarketAdaptor(url)

        try:
            adaptor.delete_service(store, service_name)
        except:
            return HttpResponse(status=502)

        return HttpResponse(status=204)


class ServiceSearchCollection(Resource):

    def read(self, request, marketplace, store='', keyword='widget'):
        m = get_object_or_404(Market, name=marketplace)
        options = json.loads(m.options)
        url = options['url']

        adaptor = MarketAdaptor(url)

        try:
            result = adaptor.full_text_search(store, keyword)
        except:
            return HttpResponse(status=502)

        return HttpResponse(json_encode(result), mimetype='application/json; chaset=UTF-8')


class AllStoresServiceCollection(Resource):

    def read(self, request, marketplace):

        m = get_object_or_404(Market, name=marketplace)
        options = json.loads(m.options)
        url = options['url']

        adaptor = MarketAdaptor(url)
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

        return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')


class StoreCollection(Resource):

    def read(self, request, marketplace):

        m = get_object_or_404(Market, name=marketplace)
        options = json.loads(m.options)
        url = options['url']

        adaptor = MarketAdaptor(url)

        try:
            result = adaptor.get_all_stores()
        except:
            return HttpResponse(status=502)

        return HttpResponse(json_encode(result), mimetype='application/json; chaset=UTF-8')

    def create(self, request, marketplace):

        m = get_object_or_404(Market, name=marketplace)
        options = json.loads(m.options)
        url = options['url']

        adaptor = MarketAdaptor(url)

        store_info = {}
        store_info['store_name'] = request.POST['store']
        store_info['store_uri'] = request.POST['uri']

        try:
            result = adaptor.add_store(store_info)
        except:
            return HttpResponse(status=502)

        return HttpResponse(status=201)


class StoreEntry(Resource):

    def delete(self, request, marketplace, store):
        m = get_object_or_404(Market, name=marketplace)
        options = json.loads(m.options)
        url = options['url']

        adaptor = MarketAdaptor(url)

        try:
            result = adaptor.delete_store(store)
        except:
            return HttpResponse(status=502)

        return HttpResponse(status=204)
