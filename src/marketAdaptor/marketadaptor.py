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
from urlparse import urlparse
from django.utils.translation import ugettext as _
from marketAdaptor.usdlParser import USDLParser
from commons.http_utils import download_http_content
from lxml import etree
import httplib

RESOURCE_XPATH = '/collection/resource'
URL_XPATH = 'url' 
DATE_XPATH = 'registrationDate'
SEARCH_RESULT_XPATH = '/searchresults/searchresult'
SEARCH_SERVICE_XPATH = 'service'
SEARCH_STORE_XPATH = 'store'

class MarketAdaptor(object):

    _marketplace_uri = None

    def __init__(self,marketplace_uri):
        self._marketplace_uri = marketplace_uri

    def get_all_stores(self):
        connection = httplib.HTTPConnection(self._marketplace_uri)
        connection.request("GET", "/FiwareMarketplace/v1/registration/stores/")
        response = connection.getresponse()

        if response.status != 200:
            msg =_("Connection error:Server response status %(res)s" % {"res":response.status})
            # TODO create a especific exeption
            raise Exception(msg)

        body = response.read()

        parsed_body = etree.fromstring(body)

        result = []

        for res in parsed_body.xpath(RESOURCE_XPATH):
            store={}
            store['name'] = res.get('name')
            url = res.xpath(URL_XPATH)[0].text
            store['url']=url
            result.append(store)

        return result

    def get_store_info(self,store):
        connection = httplib.HTTPConnection(self._marketplace_uri)
        connection.request("GET", "/FiwareMarketplace/v1/registration/store/" + store)
        response = connection.getresponse()

        if response.status != 200:
            msg =_("Connection error:Server response status %(res)s" % {"res":response.status})
            # TODO create a especific exeption
            raise Exception(msg)

        body = response.read()
        parsed_body = etree.fromstring(body)

        result = {}
        result['name']=store
        result['url'] = parsed_body.xpath(URL_XPATH)[0].text
        result['registrationDate'] = parsed_body.xpath(DATE_XPATH)[0].text

        return result
        

    def add_store(self,store_info):
        params='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><resource name="' + store_info['store_name'] +'" ><url>' + store_info['store_uri'] + '</url></resource>'
        headers = {'content-type': 'application/xml'}

        connection = httplib.HTTPConnection(self._marketplace_uri)
        connection.request("PUT", "http://localhost:8080/FiwareMarketplace/v1/registration/store/", params, headers)
        response = connection.getresponse()
        
        if response.status != 201:
            msg =_("Connection error:Server response status %(res)s" % {"res":response.status})
            # TODO create a especific exeption
            raise Exception(msg)

    def update_store(self,store_info):
        pass

    def delete_store(self,store):
        connection = httplib.HTTPConnection(self._marketplace_uri)
        connection.request("DELETE", "/FiwareMarketplace/v1/registration/store/" + store)
        response = connection.getresponse()

        if response.status != 200:
            msg =_("Connection error:Server response status %(res)s" % {"res":response.status})
            # TODO create a especific exeption
            raise Exception(msg)

        

    def get_all_services_from_store(self,store):
        connection = httplib.HTTPConnection(self._marketplace_uri)
        connection.request("GET", "/FiwareMarketplace/v1/registration/store/" + store + "/services")
        response = connection.getresponse()

        if response.status != 200:
            msg =_("Connection error:Server response status %(res)s" % {"res":response.status})
            # TODO create a especific exeption
            raise Exception(msg)

        body = response.read()
        parsed_body = etree.fromstring(body)

        result = {'resources' : []}

        for res in parsed_body.xpath(RESOURCE_XPATH):
            url =  res.xpath(URL_XPATH)[0].text
            try:
                url_elements = urlparse(url)
                connection = httplib.HTTPConnection(url_elements[1])
                headers = {"Accept": "text/plain; application/rdf+xml; text/turtle; text/n3"} 
                connection.request("GET", url_elements[2], "",  headers)
                response = connection.getresponse()
                usdl_document=response.read()
                parser = USDLParser(usdl_document)
            except:
	        continue
            
            parsed_usdl=parser.parse()
            parsed_usdl['store']=store
            parsed_usdl['marketName']=res.get('name')
            result['resources'].append(parsed_usdl)

        return result

    def get_service_info(self,store,service):
        pass

    def add_service(self,store,service_info):
       
        params='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><resource name="' + service_info['name'] +'" ><url>' + service_info['url'] + '</url></resource>'
        headers = {'content-type': 'application/xml'}

        connection = httplib.HTTPConnection(self._marketplace_uri)
        connection.request("PUT", "http://localhost:8080/FiwareMarketplace/v1/registration/store/"+ store +"/service", params, headers)
        response = connection.getresponse()
        
        if response.status != 201:
            msg =_("Connection error:Server response status %(res)s" % {"res":response.status})
            # TODO create a especific exeption
            raise Exception(msg)

    def update_service(self,store,service_info):
        pass

    def delete_service(self,store,service):
        
        connection = httplib.HTTPConnection(self._marketplace_uri)
        connection.request("DELETE", "/FiwareMarketplace/v1/registration/store/" + store + "/service/" + service)
        response = connection.getresponse()

        if response.status != 200:
            msg =_("Connection error:Server response status %(res)s" % {"res":response.status})
            # TODO create a especific exeption
            raise Exception(msg)

    def full_text_search(self,store,search_string):
        
        connection = httplib.HTTPConnection(self._marketplace_uri)
        connection.request("GET", "/FiwareMarketplace/v1/search/fulltext/" + search_string)
        response = connection.getresponse()

        if response.status != 200:
            msg =_("Connection error:Server response status %(res)s" % {"res":response.status})
            # TODO create a especific exception
            raise Exception(msg)

        body = response.read()
        parsed_body = etree.fromstring(body)

        result = {'resources': []}
        for res in parsed_body.xpath(SEARCH_RESULT_XPATH):
            service = res.xpath(SEARCH_SERVICE_XPATH)[0]
            url = service.xpath(URL_XPATH)[0].text
            service_store = res.xpath(SEARCH_STORE_XPATH)[0].get('name')
            try:
                if store != '':
                    if store == service_store:
                        url_elements = urlparse(url)
                        connection = httplib.HTTPConnection(url_elements[1])
                        headers = {"Accept": "text/plain; application/rdf+xml; text/turtle; text/n3"} 
                        connection.request("GET", url_elements[2], "",  headers)
                        response = connection.getresponse()
                        usdl_document=response.read()
                        parser = USDLParser(usdl_document)
                    else:
                        continue
                else:
                    url_elements = urlparse(url)
                    connection = httplib.HTTPConnection(url_elements[1])
                    headers = {"Accept": "text/plain; application/rdf+xml; text/turtle; text/n3"} 
                    connection.request("GET", url_elements[2], "",  headers)
                    response = connection.getresponse()
                    usdl_document=response.read()
                    parser = USDLParser(usdl_document)
            except:
                continue

            parsed_usdl=parser.parse()
            parsed_usdl['store']=service_store
            parsed_usdl['marketName']=service.get('name')
            result['resources'].append(parsed_usdl)

        return result
