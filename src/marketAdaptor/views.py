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
from django.utils.translation import ugettext as _
from django.http import HttpResponse, HttpResponseServerError, HttpResponseBadRequest
from commons.http_utils import download_http_content
from marketAdaptor.marketadaptor import MarketAdaptor
from commons.utils import json_encode



def get_resource_list_from_store(request, marketplace='localhost:8080',store='testStore'):

    adaptor = MarketAdaptor(marketplace)

    result = adaptor.get_all_services_from_store(store)

    return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')

def get_resource_list_from_keyword(request, keyword="widget", marketplace='localhost:8080'):

    adaptor = MarketAdaptor(marketplace)
    result = adaptor.full_text_search(keyword)

    return HttpResponse(json_encode(result),mimetype='application/json; chaset=UTF-8')

def add_service_to_marketplace(request, store, marketplace='localhost:8080'):
    #import ipdb; ipdb.set_trace()
    service_info={}
    service_info['name']=request.POST['name']
    service_info['url']=request.POST['url']

    adaptor = MarketAdaptor(marketplace)
    adaptor.add_service(store,service_info)

    return HttpResponse()

def delete_service_from_marketplace(request, store, service_name, marketplace='localhost:8080'):

    adaptor = MarketAdaptor(marketplace)
    adaptor.delete_service(store,service_name)

    return HttpResponse()











