# -*- coding: utf-8 -*-

# Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

import concurrent.futures

from django.core.cache import cache
from django.utils.http import urlquote, urlquote_plus
import requests
from requests.auth import HTTPBasicAuth
from six.moves.urllib.error import URLError, HTTPError
from six.moves.urllib.parse import urljoin, urlparse, urlunparse
from lxml import etree

from wirecloud.commons.utils.mimeparser import parse_mime_type
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
    except (requests.ConnectionError, URLError, USDLParseException) as e:
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

    if 'metadata' in offering_resource and len(offering_resource['metadata']) > 0:
        resource_info['metadata'] = offering_resource['metadata']

    if 'link' in offering_resource:
        resource_info['url'] = offering_resource['link']

    if offering_resource['content_type'] in ('application/x-widget+mashable-application-component', 'application/x-operator+mashable-application-component', 'application/x-mashup+mashable-application-component'):
        if 'metadata' in resource_info:
            resource_info['id'] = '/'.join((resource_info['metadata']['vendor'], resource_info['metadata']['name'], resource_info['metadata']['version']))
        elif 'link' in offering_resource:
            resource_info['id'] = offering_resource['link'].rsplit('__', 1)[1].rsplit('.', 1)[0].replace('_', '/')

    return resource_info


def _parse_offering_store_info(ser, store_client, offering_id, token):
    try:
        offering_info = store_client.get_offering_info(offering_id, token)
    except:
        return

    offering_type = 'other'

    if 'resources' not in offering_info:
        offering_info['resources'] = []

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
    ser['open'] = offering_info['open']
    ser['state'] = offering_info['state']
    ser['rating'] = offering_info['rating']
    ser['vendor'] = offering_info['owner_organization']
    ser['version'] = offering_info['version']


def update_offering_info(ser, adaptor, store, name, url, options):

    ser['store'] = store
    ser['id'] = name

    if ser['uriTemplate'] == '':
        ser['uriTemplate'] = url

    ser['usdl_url'] = url
    ser['type'] = 'unknown'
    ser['resources'] = []

    try:

        offering_parsed_url = urlparse(url)
        offering_id = offering_parsed_url.path.rsplit('/', 1)[1].replace('__', '/')

        store_client = adaptor.get_store(store)
        store_token_key = store + '/token'
        if store_token_key in options:
            token = options[store_token_key]
        else:
            token = options['idm_token']

        _parse_offering_store_info(ser, store_client, offering_id, token)

    except:
        pass

    return ser


class MarketAdaptor(object):

    _marketplace_uri = None
    _stores = {}

    def __init__(self, marketplace_uri, user='demo1234', passwd='demo1234'):
        url = urlparse(marketplace_uri)
        if not bool(url.netloc and url.scheme):
            raise ValueError("Your must provide an absolute Marketplace URL")

        self._marketplace_uri = urlunparse((url.scheme, url.netloc, url.path.rstrip('/') + '/', '', '', ''))
        self._user = user
        self._passwd = passwd

    def _process_store_info(self, element):
        result = {
            'name': element.get('name'),
            'url': element.xpath(URL_XPATH)[0].text,
            'registrationDate': element.xpath(DATE_XPATH)[0].text
        }

        if result['name'] not in self._stores:
            self._stores[result['name']] = StoreClient(result['url'])

        return result

    def _parse_offering(self, name, url, parsed_usdl, store, options, executor):

        jobs = []

        if isinstance(parsed_usdl, dict):
            parsed_usdl = [parsed_usdl]

        for ser in parsed_usdl:

            jobs.append(executor.submit(update_offering_info, ser, self, store, name, url, options))

        return jobs

    def get_all_stores(self):

        url = urljoin(self._marketplace_uri, "registration/stores/")
        response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd))

        if response.status_code == 404:
            return []
        elif response.status_code != 200:
            raise HTTPError(response.url, response.status_code, response.reason, None, None)

        parsed_body = etree.fromstring(response.content)

        result = []

        for res in parsed_body.xpath(RESOURCE_XPATH):
            result.append(self._process_store_info(res))

        return result

    def get_store_info(self, store):

        url = urljoin(self._marketplace_uri, "registration/store/" + urlquote(store))
        response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd))

        if response.status_code != 200:
            raise HTTPError(response.url, response.status_code, response.reason, None, None)

        parsed_body = etree.fromstring(response.content)
        return self._process_store_info(parsed_body)

    def get_all_services_from_store(self, store, **options):

        url = urljoin(self._marketplace_uri, "offering/store/" + urlquote(store) + "/offerings")
        response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd))

        if response.status_code != 200:
            raise HTTPError(response.url, response.status_code, response.reason, None, None)

        parsed_body = etree.fromstring(response.content)

        jobs = []

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            for res in parsed_body.xpath(RESOURCE_XPATH):

                url = res.xpath(URL_XPATH)[0].text

                try:
                    parsed_usdl = parse_usdl_from_url(url)
                except:
                    continue

                jobs += self._parse_offering(res.get('name'), url, parsed_usdl, store, options, executor)

            concurrent.futures.wait(jobs)

        return {'resources': tuple(job.result() for job in jobs)}

    def get_offering_info(self, store, id, options):

        url = urljoin(self._marketplace_uri, "offering/store/%(store)s/offering/%(offering_id)s" % {"store": urlquote(store), "offering_id": urlquote(id)})
        response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd))

        if response.status_code != 200:
            raise HTTPError(response.url, response.status_code, response.reason, None, None)

        parsed_body = etree.fromstring(response.content)
        url = parsed_body.xpath(URL_XPATH)[0].text

        parsed_usdl = parse_usdl_from_url(url)

        self.get_store(store)
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            jobs = self._parse_offering(id, url, parsed_usdl, store, options, executor)
            concurrent.futures.wait(jobs)

        return tuple(job.result() for job in jobs)

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
        response = requests.get(url, auth=HTTPBasicAuth(self._user, self._passwd))

        if response.status_code != 200:
            raise HTTPError(response.url, response.status_code, response.reason, None, None)

        parsed_body = etree.fromstring(response.content)

        jobs = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
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

                jobs += self._parse_offering(res.get('name'), url, parsed_usdl, service_store, options, executor)

        return {'resources': tuple(job.result() for job in jobs)}
