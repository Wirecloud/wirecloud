# -*- coding: utf-8 -*-

# Copyright 2012-2013 Universidad Politécnica de Madrid

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


import requests
from requests.auth import HTTPBasicAuth
from urllib2 import URLError, HTTPError
from urlparse import urljoin, urlparse
from lxml import etree

from django.core.cache import cache
from django.utils.http import urlquote, urlquote_plus

from wirecloud.commons.utils.http import parse_mime_type
from wirecloud.fiware.marketAdaptor.usdlParser import USDLParseException, USDLParser
from wirecloud.fiware.storeclient import StoreClient

RESOURCE_XPATH = '/collection/resource'
URL_XPATH = 'url'
DATE_XPATH = 'registrationDate'
SEARCH_RESULT_XPATH = '/searchresults/searchresult'
SEARCH_SERVICE_XPATH = 'service'
SEARCH_STORE_XPATH = 'store'


def parse_usdl_from_url(url):

    cache_key = '_usdl_info/' + url
    usdl_info = cache.get(cache_key)
    if usdl_info is not None:
        if isinstance(usdl_info, Exception):
            raise usdl_info
        else:
            return usdl_info

    headers = {"Accept": "text/plain; application/rdf+xml; text/turtle; text/n3"}

    try:

        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise HTTPError(response.url, response.status_code, response.reason, None, None)

        content_type = parse_mime_type(response.headers.get('content-type'))[0]
        parser = USDLParser(response.content, content_type)
        usdl_info = parser.parse()
    except (requests.ConnectionError, URLError, USDLParseException), e:
        cache.set(cache_key, e, 2 * 60 * 60)
        raise

    cache.set(cache_key, usdl_info)

    return usdl_info


def parse_resource_info(offering_resource):
    resource_info = {
        'content_type': offering_resource['content_type'],
        'name': offering_resource['name'],
        'description': offering_resource['description'],
    }
    if 'link' in offering_resource:
        resource_info['url'] = offering_resource['link']

    if offering_resource['content_type'] in ('application/x-widget+mashable-application-component', 'application/x-operator+mashable-application-component', 'application/x-mashup+mashable-application-component'):
        if 'link' in offering_resource:
            resource_info['id'] = offering_resource['link'].rsplit('__', 1)[1].rsplit('.', 1)[0].replace('_', '/')

    return resource_info


class MarketAdaptor(object):

    _marketplace_uri = None
    _stores = {}

    def __init__(self, marketplace_uri, user='demo1234', passwd='demo1234'):
        self._marketplace_uri = marketplace_uri
        self._user = user
        self._passwd = passwd

    def _parse_offering(self, name, url, parsed_usdl, store, options):

        offerings = []

        if isinstance(parsed_usdl, dict):
            parsed_usdl = [parsed_usdl]

        for ser in parsed_usdl:

            ser['store'] = store
            ser['marketName'] = name

            if ser['uriTemplate'] == '':
                ser['uriTemplate'] = url

            ser['usdl_url'] = url
            ser['type'] = 'unknown'
            ser['resources'] = []

            try:

                offering_parsed_url = urlparse(url)
                offering_id = offering_parsed_url.path.rsplit('/', 1)[1].replace('__', '/')

                store_client = self._stores[store]
                store_token_key = store + '/token'
                if store_token_key in options:
                    token = options[store_token_key]
                else:
                    token = options['idm_token']

                offering_info = store_client.get_offering_info(offering_id, token)
                offering_type = 'other'
                if len(offering_info['resources']) == 1:

                    offering_resource = offering_info['resources'][0]

                    if offering_resource['content_type'] == 'application/x-widget+mashable-application-component':
                        offering_type = 'widget'
                    elif offering_resource['content_type'] == 'application/x-operator+mashable-application-component':
                        offering_type = 'operator'
                    elif offering_resource['content_type'] == 'application/x-mashup+mashable-application-component':
                        offering_type = 'mashup'

                    ser['resources'] = [parse_resource_info(offering_resource)]
                else:

                    info_offering_resources = []
                    for offering_resource in offering_info['resources']:
                        resource_info = parse_resource_info(offering_resource)

                        if resource_info['content_type'] in ('application/x-widget+mashable-application-component', 'application/x-operator+mashable-application-component', 'application/x-mashup+mashable-application-component'):
                            offering_type = 'pack'

                        info_offering_resources.append(resource_info)

                    ser['resources'] = info_offering_resources

                ser['type'] = offering_type
                ser['uriImage'] = urljoin(store_client._url, offering_info['image_url'])
                ser['publicationdate'] = offering_info['publication_date']
                ser['state'] = offering_info['state']
                ser['rating'] = offering_info['rating']

            except:
                pass

            offerings.append(ser)

        return offerings

    def get_all_stores(self):

        url = urljoin(self._marketplace_uri, "registration/stores/")
        try:
            response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd))
        except HTTPError, e:
            if e.code == 404:
                return []

        if response.status_code != 200:
            raise HTTPError(response.url, response.status_code, response.reason, None, None)

        parsed_body = etree.fromstring(response.content)

        result = []

        for res in parsed_body.xpath(RESOURCE_XPATH):
            store = {}
            store['name'] = res.get('name')
            url = res.xpath(URL_XPATH)[0].text
            store['url'] = url
            result.append(store)

            if store['name'] not in self._stores:
                self._stores[store['name']] = StoreClient(store['url'])

        return result

    def get_store_info(self, store):

        url = urljoin(self._marketplace_uri, "registration/store/" + urlquote(store))
        try:
            response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd))
        except HTTPError, e:
            raise HTTPError(e.url, e.code, e.msg, None, None)

        if response.status_code != 200:
            raise HTTPError(response.url, response.status_code, response.reason, None, None)

        parsed_body = etree.fromstring(response.content)

        result = {}
        result['name'] = store
        result['url'] = parsed_body.xpath(URL_XPATH)[0].text
        result['registrationDate'] = parsed_body.xpath(DATE_XPATH)[0].text

        if result['name'] not in self._stores:
            self._stores[result['name']] = StoreClient(result['url'])

        return result

    def get_all_services_from_store(self, store, **options):

        url = urljoin(self._marketplace_uri, "offering/store/" + urlquote(store) + "/offerings")
        try:
            response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd))
        except HTTPError, e:
            raise HTTPError(e.url, e.code, e.msg, None, None)

        if response.status_code != 200:
            raise HTTPError(response.url, response.status_code, response.reason, None, None)

        parsed_body = etree.fromstring(response.content)

        result = {'resources': []}

        for res in parsed_body.xpath(RESOURCE_XPATH):

            url = res.xpath(URL_XPATH)[0].text

            try:
                parsed_usdl = parse_usdl_from_url(url)
            except:
                continue

            result['resources'] += self._parse_offering(res.get('name'), url, parsed_usdl, store, options)

        return result

    def get_store(self, name):
        if name not in self._stores:
            self.get_store_info(name)

        return self._stores[name]

    def start_purchase(self, store, offering_url, redirect_uri, **options):
        store_client = self.get_store(store)
        store_token_key = store + '/token'
        if store_token_key in options:
            token = options[store_token_key]
        else:
            token = options['idm_token']
        return store_client.start_purchase(offering_url, redirect_uri, token)

    def full_text_search(self, store, search_string, options):

        url = urljoin(self._marketplace_uri, "search/offerings/fulltext/" + urlquote_plus(search_string))
        try:
            response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd))
        except HTTPError, e:
            raise HTTPError(e.url, e.code, e.msg, None, None)

        if response.status_code != 200:
            raise HTTPError(response.url, response.status_code, response.reason, None, None)

        parsed_body = etree.fromstring(response.content)

        result = {'resources': []}
        for res in parsed_body.xpath(SEARCH_RESULT_XPATH):
            service = res.xpath(SEARCH_SERVICE_XPATH)[0]
            url = service.xpath(URL_XPATH)[0].text
            service_store = res.xpath(SEARCH_STORE_XPATH)[0].get('name')

            if store != '' and store != service_store:
                continue

            try:
                parsed_usdl = parse_usdl_from_url(url)
            except:
                continue

            result['resources'] += self._parse_offering(res.get('name'), url, parsed_usdl, service_store, options)

        return result
