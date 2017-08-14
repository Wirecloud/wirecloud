# -*- coding: utf-8 -*-

# Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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
import os

from django.core.urlresolvers import reverse
from django.test import Client

from wirecloud.commons.utils.testcases import DynamicWebServer, LocalFileSystemServer, WirecloudTestCase
from wirecloud.fiware.marketAdaptor.marketadaptor import MarketAdaptor


# Avoid nose to repeat these tests (they are run through wirecloud/fiware/tests/__init__.py)
__test__ = False


class MarketplaceTestCase(WirecloudTestCase):

    tags = ('wirecloud-fiware', 'wirecloud-fiware-marketplace', 'wirecloud-noselenium')
    fixtures = ('selenium_test_data', 'fiware_test_data')
    servers = {
        'http': {
            'marketplace.example.com': DynamicWebServer(),
            'repository.example.com': DynamicWebServer(fallback=LocalFileSystemServer(os.path.join(os.path.dirname(__file__), 'test-data', 'responses', 'repository'))),
            'store2.example.com': DynamicWebServer(fallback=LocalFileSystemServer(os.path.join(os.path.dirname(__file__), 'test-data', 'responses', 'store2'))),
        },
    }
    maxDiff = None

    @classmethod
    def setUpClass(cls):

        super(MarketplaceTestCase, cls).setUpClass()

        cls.store_list_response = cls.read_response_file('responses', 'marketplace', 'store_list.xml')
        cls.store2_offerings = cls.read_response_file('responses', 'marketplace', 'store2_offerings.xml')

    def setUp(self):

        super(MarketplaceTestCase, self).setUp()

        self.market_adaptor = MarketAdaptor('http://marketplace.example.com')
        self.network._servers['http']['marketplace.example.com'].clear()
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/registration/stores/', {'content': self.store_list_response})
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/offering/store/Store%202/offerings', {'content': self.store2_offerings})
        self.network._servers['http']['repository.example.com'].clear()

    @classmethod
    def read_response_file(self, *response):
        f = open(os.path.join(os.path.dirname(__file__), 'test-data', *response))
        contents = f.read()
        f.close()

        return contents

    def test_marketplace_complain_about_relative_urls(self):

        self.assertRaises(ValueError, MarketAdaptor, 'path')
        self.assertRaises(ValueError, MarketAdaptor, '/path')
        self.assertRaises(ValueError, MarketAdaptor, '//marketplace.example.com/path')

    def test_marketplace_handle_url_trailing_slashes(self):

        test_adaptor = MarketAdaptor('http://marketplace.example.com')
        self.assertEqual(test_adaptor._marketplace_uri, 'http://marketplace.example.com/')

        test_adaptor = MarketAdaptor('http://marketplace.example.com///')
        self.assertEqual(test_adaptor._marketplace_uri, 'http://marketplace.example.com/')

    def test_marketplace_must_ignore_params_query_and_framgent(self):

        test_adaptor = MarketAdaptor('http://marketplace.example.com/?query=a#a')
        self.assertEqual(test_adaptor._marketplace_uri, 'http://marketplace.example.com/')

    def test_marketplace_get_all_offerings_from_store(self):

        store2_offerings = self.read_response_file('responses', 'marketplace', 'store2_offerings.xml')
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/offering/store/Store%202/offerings', {'content': store2_offerings})
        result = self.market_adaptor.get_all_services_from_store('Store 2')
        result['resources'] = list(result['resources'])
        expected_result = json.loads(self.read_response_file('results', 'test_marketplace_get_all_offerings_from_store.json'))

        self.assertEqual(result, expected_result)

    def test_marketplace_get_all_offerings_from_store_repository_failing(self):

        old_repository = self.network._servers['http']['repository.example.com']
        del self.network._servers['http']['repository.example.com']

        try:
            result = self.market_adaptor.get_all_services_from_store('Store 2')

            self.assertEqual(result, {'resources': ()})
        finally:
            self.network._servers['http']['repository.example.com'] = old_repository

    def test_marketplace_get_all_offerings_from_store_bad_usdl_content(self):

        self.network._servers['http']['repository.example.com'].add_response('GET', '/CoNWeT/service2.rdf', {'content': 'invalid content'})
        result = self.market_adaptor.get_all_services_from_store('Store 2')
        result['resources'] = list(result['resources'])
        expected_result = json.loads(self.read_response_file('results', 'test_marketplace_get_all_offerings_from_store_bad_usdl_content.json'))

        self.assertEqual(result, expected_result)

    def test_marketplace_get_all_offerings_from_store_failures_are_cached(self):

        def build_invalid_usdl_response(method, url, *args, **kwargs):
            build_invalid_usdl_response.counter += 1
            return {
                'headers': {
                    'Content-Type': 'application/rdf+xml',
                    'Content-Length': 5,
                },
                'content': 'invalid content'
            }
        build_invalid_usdl_response.counter = 0

        self.network._servers['http']['repository.example.com'].add_response('GET', '/CoNWeT/service2.rdf', build_invalid_usdl_response)
        result1 = self.market_adaptor.get_all_services_from_store('Store 2')
        result2 = self.market_adaptor.get_all_services_from_store('Store 2')
        self.assertEqual(result1, result2)
        self.assertEqual(build_invalid_usdl_response.counter, 1)

    def test_marketplace_keyword_search(self):

        response_text = self.read_response_file('responses', 'marketplace', 'keyword_search.xml')
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/search/offerings/fulltext/test', {'content': response_text})
        result = self.market_adaptor.full_text_search('', 'test', {})
        result['resources'] = list(result['resources'])
        expected_result = json.loads(self.read_response_file('results', 'test_marketplace_keyword_search.json'))

        self.assertEqual(result, expected_result)

    def test_marketplace_get_store_info(self):

        response_text = self.read_response_file('responses', 'marketplace', 'store1_info.xml')
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/registration/store/Store%201', {'content': response_text})
        result = self.market_adaptor.get_store_info('Store 1')
        expected_result = json.loads(self.read_response_file('results', 'test_marketplace_get_store_info.json'))

        self.assertEqual(result, expected_result)

    def test_marketadaptor_views_require_authentication(self):

        client = Client()

        urls = [
            reverse('wirecloud.fiware.market_resource_collection', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware'}),
            reverse('wirecloud.fiware.store_resource_collection', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware', 'store': 'store1'}),
            reverse('wirecloud.fiware.market_offering_entry', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware', 'store': 'store1', 'offering_id': 'id'}),
            reverse('wirecloud.fiware.market_full_search', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware', 'search_string': 'test'}),
            reverse('wirecloud.fiware.store_search', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware', 'store': 'store1', 'search_string': 'test'}),
            reverse('wirecloud.fiware.store_collection', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware'}),
        ]

        for url in urls:
            response = client.get(url, HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 401)

        url = reverse('wirecloud.fiware.store_start_purchase', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware', 'store': 'store1'})
        response = client.post(url, '{"offering_url": ""}', content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)

    def test_marketadaptor_views_unexpected_response(self):

        client = Client()
        client.login(username='user_with_markets', password='admin')

        self.network._servers['http']['marketplace.example.com'].clear()
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/registration/stores/', {'status_code': 503})

        urls = [
            reverse('wirecloud.fiware.market_resource_collection', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware'}),
            reverse('wirecloud.fiware.store_resource_collection', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware', 'store': 'store1'}),
            reverse('wirecloud.fiware.market_offering_entry', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware', 'store': 'store1', 'offering_id': 'id'}),
            reverse('wirecloud.fiware.market_full_search', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware', 'search_string': 'test'}),
            reverse('wirecloud.fiware.store_search', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware', 'store': 'store1', 'search_string': 'test'}),
            reverse('wirecloud.fiware.store_collection', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware'}),
        ]

        for url in urls:
            response = client.get(url, HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 502)

        url = reverse('wirecloud.fiware.store_start_purchase', kwargs={'market_user': 'user_with_markets', 'market_name': 'fiware', 'store': 'store1'})
        response = client.post(url, '{"offering_url": ""}', content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 502)

    def test_marketplace_get_all_stores_emtpy(self):

        self.network._servers['http']['marketplace.example.com'].clear()

        response = self.market_adaptor.get_all_stores()
        self.assertEqual(response, [])
