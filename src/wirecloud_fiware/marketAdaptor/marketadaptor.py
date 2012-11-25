# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

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


import urllib2
from urllib2 import HTTPError
from urllib import urlencode
from urlparse import urljoin, urlparse

from wirecloud_fiware.marketAdaptor.usdlParser import USDLParser
from lxml import etree

from django.utils.http import urlquote, urlquote_plus

from wirecloud.proxy.views import MethodRequest

RESOURCE_XPATH = '/collection/resource'
URL_XPATH = 'url'
DATE_XPATH = 'registrationDate'
SEARCH_RESULT_XPATH = '/searchresults/searchresult'
SEARCH_SERVICE_XPATH = 'service'
SEARCH_STORE_XPATH = 'store'


class MarketAdaptor(object):

    _marketplace_uri = None
    _session_id = None

    def __init__(self, marketplace_uri, user='demo1234', passwd='demo1234'):
        self._marketplace_uri = marketplace_uri
        self._user = user
        self._passwd = passwd

    def authenticate(self):

        opener = urllib2.build_opener()

        # submit field is required
        credentials = urlencode({'j_username': self._user, 'j_password': self._passwd, 'submit': 'Submit'})
        headers = {'content-type': 'application/x-www-form-urlencoded'}
        request = MethodRequest("POST", urljoin(self._marketplace_uri, "/FiwareMarketplace/j_spring_security_check"), credentials, headers)

        parsed_url = None
        try:
            response = opener.open(request)
            parsed_url = urlparse(response.url)

        except HTTPError, e:
            # Marketplace can return an error code but authenticate
            parsed_url = urlparse(e.url)

        if parsed_url[4] != 'login_error' and parsed_url[3][:10] == 'jsessionid':
            # parsed_url[3] params field, contains jsessionid
            self._session_id = parsed_url[3][11:]
        else:
            raise Exception('Marketplace login error')

    def get_all_stores(self):

        if self._session_id is None:
            self.authenticate()

        opener = urllib2.build_opener()
        session_cookie = 'JSESSIONID=' + self._session_id + ';' + ' Path=/FiwareMarketplace'
        headers = {'Cookie': session_cookie}

        request = MethodRequest("GET", urljoin(self._marketplace_uri, "/FiwareMarketplace/v1/registration/stores/"), '', headers)
        try:
            response = opener.open(request)
        except HTTPError, e:
            if (e.code == 404):
                return []

        # Marketplace redirects to a login page (sprint_security_login) if
        # the session expires
        parsed_url = urlparse(response.url)
        path = parsed_url[2].split('/')

        if len(path) > 2 and path[2] == 'spring_security_login':
            # Session has expired
            self._session_id = None
            return self.get_all_stores()

        if response.code != 200:
            raise HTTPError(response.url, response.code, response.msg, None, None)

        body = response.read()

        parsed_body = etree.fromstring(body)

        result = []

        for res in parsed_body.xpath(RESOURCE_XPATH):
            store = {}
            store['name'] = res.get('name')
            url = res.xpath(URL_XPATH)[0].text
            store['url'] = url
            result.append(store)

        return result

    def get_store_info(self, store):

        if self._session_id is None:
            self.authenticate()

        opener = urllib2.build_opener()
        session_cookie = 'JSESSIONID=' + self._session_id + ';' + ' Path=/FiwareMarketplace'
        headers = {'Cookie': session_cookie}

        request = MethodRequest("GET", urljoin(self._marketplace_uri, "/FiwareMarketplace/v1/offering/store/" + urlquote(store)), '', headers)
        try:
            response = opener.open(request)
        except HTTPError, e:
            raise HTTPError(e.url, e.code, e.msg, None, None)

        if response.code != 200:
            raise HTTPError(response.url, response.code, response.msg, None, None)

        # Marketplace redirects to a login page (sprint_security_login) if
        # the session expires
        parsed_url = urlparse(response.url)
        path = parsed_url[2].split('/')

        if len(path) > 2 and path[2] == 'spring_security_login':
            # Session has expired
            self._session_id = None
            return self.get_store_info()

        body = response.read()
        parsed_body = etree.fromstring(body)

        result = {}
        result['name'] = store
        result['url'] = parsed_body.xpath(URL_XPATH)[0].text
        result['registrationDate'] = parsed_body.xpath(DATE_XPATH)[0].text

        return result

    def add_store(self, store_info):

        if self._session_id is None:
            self.authenticate()

        params = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><resource name="' + store_info['store_name'] + '" ><url>' + store_info['store_uri'] + '</url></resource>'
        session_cookie = 'JSESSIONID=' + self._session_id + ';' + ' Path=/FiwareMarketplace'
        headers = {'content-type': 'application/xml', 'Cookie': session_cookie}

        opener = urllib2.build_opener()
        request = MethodRequest("PUT", urljoin(self._marketplace_uri, "/FiwareMarketplace/v1/registration/store/"), params, headers)
        try:
            response = opener.open(request)
        except HTTPError, e:
            # Marketplace redirects to a login page (sprint_security_login) if
            # the session expires. In addition, python don't follow
            # redirections when issuing DELETE requests, so we have to check for
            # a 302 startus code
            if e.code == 302:
                self._session_id = None
                self.add_store(store_info)
                return
            else:
                raise HTTPError(e.url, e.code, e.msg, None, None)

        if response.code != 201:
            raise HTTPError(response.url, response.code, response.msg, None, None)

    def update_store(self, store_info):
        pass

    def delete_store(self, store):

        if self._session_id is None:
            self.authenticate()

        opener = urllib2.build_opener()
        session_cookie = 'JSESSIONID=' + self._session_id + ';' + ' Path=/FiwareMarketplace'
        headers = {'content-type': 'application/xml', 'Cookie': session_cookie}

        request = MethodRequest("DELETE", urljoin(self._marketplace_uri, "/FiwareMarketplace/v1/registration/store/" + urlquote(store)), '', headers)

        try:
            response = opener.open(request)
        except HTTPError, e:
            # Marketplace redirects to a login page (sprint_security_login) if
            # the session expires. In addition, python don't follow
            # redirections when issuing DELETE requests, so we have to check for
            # a 302 startus code
            if e.code == 302:
                self._session_id = None
                self.delete_store(store)
                return
            else:
                raise HTTPError(e.url, e.code, e.msg, None, None)

        if response.code != 200:
            raise HTTPError(response.url, response.code, response.msg, None, None)

    def get_all_services_from_store(self, store):

        if self._session_id is None:
            self.authenticate()

        opener = urllib2.build_opener()
        session_cookie = 'JSESSIONID=' + self._session_id + ';' + ' Path=/FiwareMarketplace'
        headers = {'Cookie': session_cookie}

        request = MethodRequest("GET", urljoin(self._marketplace_uri, "/FiwareMarketplace/v1/offering/store/" + urlquote(store) + "/offerings"), '', headers)

        try:
            response = opener.open(request)
        except HTTPError, e:
            raise HTTPError(e.url, e.code, e.msg, None, None)

        # Marketplace redirects to a login page (sprint_security_login) if
        # the session expires
        parsed_url = urlparse(response.url)
        path = parsed_url[2].split('/')

        if len(path) > 2 and path[2] == 'spring_security_login':
            # Session has expired
            self._session_id = None
            return self.get_all_services_from_store(store)

        if response.code != 200:
            raise HTTPError(response.url, response.code, response.msg, None, None)

        body = response.read()
        parsed_body = etree.fromstring(body)

        result = {'resources': []}

        for res in parsed_body.xpath(RESOURCE_XPATH):
            url = res.xpath(URL_XPATH)[0].text
            try:
                headers = {"Accept": "text/plain; application/rdf+xml; text/turtle; text/n3"}
                request = MethodRequest("GET", url, '', headers)
                response = opener.open(request)
                usdl_document = response.read()
                content_type = response.headers.get('content-type')

                # Remove the charset
                pos = content_type.find(';')
                if pos > -1:
                    content_type = content_type[:pos]

                parser = USDLParser(usdl_document, content_type)
            except:
                continue

            parsed_usdl = parser.parse()

            if isinstance(parsed_usdl, dict):
                parsed_usdl['store'] = store
                parsed_usdl['marketName'] = res.get('name')

                if parsed_usdl['versions'][0]['uriTemplate'] == '':
                    parsed_usdl['versions'][0]['uriTemplate'] = url

                result['resources'].append(parsed_usdl)
            else:
                for ser in parsed_usdl:
                    ser['store'] = store
                    ser['marketName'] = res.get('name')
                    result['resources'].append(ser)

        return result

    def get_service_info(self, store, service):
        pass

    def add_service(self, store, service_info):

        if self._session_id is None:
            self.authenticate()

        params = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><resource name="' + service_info['name'] + '" ><url>' + service_info['url'] + '</url></resource>'
        session_cookie = 'JSESSIONID=' + self._session_id + ';' + ' Path=/FiwareMarketplace'
        headers = {
            'Accept': 'application/xml, application/json, text/plain',
            'Content-Type': 'application/xml',
            'Cookie': session_cookie
        }

        opener = urllib2.build_opener()
        request = MethodRequest("PUT", urljoin(self._marketplace_uri, "/FiwareMarketplace/v1/offering/store/" + urlquote(store) + "/offering"), params, headers)
        try:
            response = opener.open(request)
        except HTTPError, e:
            # Marketplace redirects to a login page (sprint_security_login) if
            # the session expires. In addition, python don't follow
            # redirections when issuing PUT requests, so we have to check for
            # a 302 startus code
            if e.code == 302:
                self._session_id = None
                self.add_service(store, service_info)
                return
            else:
                raise HTTPError(e.url, e.code, e.msg, None, None)

        if response.code != 201:
            raise HTTPError(response.url, response.code, response.msg, None, None)

    def update_service(self, store, service_info):
        pass

    def delete_service(self, store, service):

        if self._session_id is None:
            self.authenticate()

        opener = urllib2.build_opener()
        session_cookie = 'JSESSIONID=' + self._session_id + ';' + ' Path=/FiwareMarketplace'
        headers = {'Cookie': session_cookie}

        request = MethodRequest("DELETE", urljoin(self._marketplace_uri, "/FiwareMarketplace/v1/offering/store/" + urlquote(store) + "/offering/" + urlquote(service)), '', headers)

        try:
            response = opener.open(request)
        except HTTPError, e:
            # Marketplace redirects to a login page (sprint_security_login) if
            # the session expires. In addition, python don't follow
            # redirections when issuing DELETE requests, so we have to check for
            # a 302 startus code
            if e.code == 302:
                self._session_id = None
                self.delete_service(store, service)
                return
            else:
                raise HTTPError(e.url, e.code, e.msg, None, None)

        if response.code != 200:
            raise HTTPError(response.url, response.code, response.msg, None, None)

    def full_text_search(self, store, search_string):

        if self._session_id is None:
            self.authenticate()

        opener = urllib2.build_opener()
        session_cookie = 'JSESSIONID=' + self._session_id + ';' + ' Path=/FiwareMarketplace'
        headers = {'Cookie': session_cookie}

        request = MethodRequest("GET", urljoin(self._marketplace_uri, "/FiwareMarketplace/v1/search/offerings/fulltext/" + urlquote_plus(search_string)), '', headers)

        try:
            response = opener.open(request)
        except HTTPError, e:
            raise HTTPError(e.url, e.code, e.msg, None, None)

        # Marketplace redirects to a login page (sprint_security_login) if
        # the session expires
        parsed_url = urlparse(response.url)
        path = parsed_url[2].split('/')

        if len(path) > 2 and path[2] == 'spring_security_login':
            # Session has expired
            self._session_id = None
            return self.full_text_search(store, search_string)

        if response.code != 200:
            raise HTTPError(response.url, response.code, response.msg, None, None)

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
                        headers = {"Accept": "text/plain; application/rdf+xml; text/turtle; text/n3"}
                        request = MethodRequest("GET", url, '', headers)
                        response = opener.open(request)
                        content_type = response.headers.get('content-type')

                        # Remove the charset
                        pos = content_type.find(';')
                        if pos > -1:
                            content_type = content_type[:pos]

                        usdl_document = response.read()
                        parser = USDLParser(usdl_document, content_type)
                    else:
                        continue
                else:
                    headers = {"Accept": "text/plain; application/rdf+xml; text/turtle; text/n3"}
                    request = MethodRequest("GET", url, '', headers)
                    response = opener.open(request)
                    content_type = response.headers.get('content-type')

                    # Remove the charset
                    pos = content_type.find(';')
                    if pos > -1:
                        content_type = content_type[:pos]

                    usdl_document = response.read()
                    parser = USDLParser(usdl_document, content_type)
            except:
                continue

            parsed_usdl = parser.parse()

            if isinstance(parsed_usdl, dict):
                parsed_usdl['store'] = service_store
                parsed_usdl['marketName'] = service.get('name')
                result['resources'].append(parsed_usdl)
            else:
                for ser in parsed_usdl:
                    ser['store'] = service_store
                    ser['marketName'] = service.get('name')
                    result['resources'].append(ser)

        return result
