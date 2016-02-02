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

from __future__ import unicode_literals

from io import BytesIO
import json
import os

from mock import Mock

from wirecloud.commons.utils.testcases import DynamicWebServer, WirecloudTestCase
from wirecloud.fiware.storeclient import Conflict, NotFound, UnexpectedResponse, StoreClient


# Avoid nose to repeat these tests (they are run through wirecloud/fiware/tests/__init__.py)
__test__ = False


OFFERING_URL = "http://repository.exmaple.com/FiwareRepository/v1/storeOfferingCollection/user__offername__1.0"


class StoreTestCase(WirecloudTestCase):

    tags = ('wirecloud-fiware', 'wirecloud-fiware-store', 'wirecloud-noselenium')
    servers = {
        'http': {
            'example.com': DynamicWebServer()
        },
    }

    def setUp(self):

        super(StoreTestCase, self).setUp()

        self.store_client = StoreClient('http://example.com')
        self.network._servers['http']['example.com'].clear()

    def read_response_file(self, *response):
        f = open(os.path.join(os.path.dirname(__file__), 'test-data', *response))
        contents = f.read()
        f.close()

        return contents

    def test_storeclient_complain_about_relative_urls(self):

        self.assertRaises(ValueError, StoreClient, 'path')
        self.assertRaises(ValueError, StoreClient, '/path')
        self.assertRaises(ValueError, StoreClient, '//store.example.com/path')

    def test_storeclient_handle_url_trailing_slashes(self):

        test_client = StoreClient('http://store.example.com')
        self.assertEqual(test_client._url, 'http://store.example.com/')

        test_client = StoreClient('http://store.example.com///')
        self.assertEqual(test_client._url, 'http://store.example.com/')

    def test_storeclient_must_ignore_params_query_and_framgent(self):

        test_client = StoreClient('http://store.example.com/?query=a#a')
        self.assertEqual(test_client._url, 'http://store.example.com/')

    def test_unexpected_response(self):

        response = Mock()
        response.status_code = 422
        response.text = '{"message": "Unprocessable Entity"}'
        exception = UnexpectedResponse(response)
        self.assertEqual("%s" % exception, "Unexpected response from server (Error code: 422, Message: Unprocessable Entity)")

    def test_unexpected_response_without_error_message(self):

        response = Mock()
        response.status_code = 422
        response.content = 'no processable response'
        exception = UnexpectedResponse(response)
        self.assertEqual("%s" % exception, "Unexpected response from server (422 error code)")

    def test_get_supported_plugins(self):

        self.network._servers['http']['example.com'].add_response('GET', '/api/offering/resources/plugins', {'content': '[]'})
        self.assertEqual(self.store_client.get_supported_plugins('wirecloud_token'), [])

    def test_get_supported_plugins_unexpected_response(self):

        self.network._servers['http']['example.com'].add_response('GET', '/api/offering/resources/plugins', {'status_code': 409, 'content': '{"message": "error description"}'})
        self.assertRaises(UnexpectedResponse, self.store_client.get_supported_plugins, 'wirecloud_token')

    def test_offering_info_retreival(self):

        response_text = self.read_response_file('offering_info.json')
        response = json.loads(response_text)
        self.network._servers['http']['example.com'].add_response('GET', '/api/offering/offerings/17', {'content': response_text})
        info = self.store_client.get_offering_info('17', 'wirecloud_token')

        self.assertEqual(info, response)

    def test_offering_info_retreival_404(self):

        self.assertRaises(NotFound, self.store_client.get_offering_info, '17', 'wirecloud_token')

    def test_offering_info_retreival_unexpected_response(self):

        self.network._servers['http']['example.com'].add_response('GET', '/api/offering/offerings/17', {'status_code': 409, 'content': '{"message": "error description"}'})
        self.assertRaises(UnexpectedResponse, self.store_client.get_offering_info, '17', 'wirecloud_token')

    def test_start_purchase(self):

        self.network._servers['http']['example.com'].add_response('POST', '/api/contracting/form', {'content': '{"url": "http://store.example.org/api/contracting/form?ID=54662b63b73e260d625844ed521b881bb73e2611f137206b"}'})
        result = self.store_client.start_purchase(OFFERING_URL, 'http://example.com/redirect_uri', 'wirecloud_token')
        self.assertIn('url', result)

    def test_start_purchase_not_found(self):

        self.assertRaises(NotFound, self.store_client.start_purchase, OFFERING_URL, 'http://example.com/redirect_uri', 'wirecloud_token')

    def test_start_purchase_unexpected_response(self):

        self.network._servers['http']['example.com'].add_response('POST', '/api/contracting/form', {'status_code': 500, 'content': '{"message": "error description"}'})
        self.assertRaises(UnexpectedResponse, self.store_client.start_purchase, OFFERING_URL, 'http://example.com/redirect_uri', 'wirecloud_token')

    def test_resource_download(self):

        resource_link = '/media/resources/CoNWeT__Kurento one2one widget__1.1.2__CoNWeT_kurento-one2one_1.1.2.wgt'
        self.network._servers['http']['example.com'].add_response('GET', resource_link, {'content': 'resource content'})
        self.assertEqual(self.store_client.download_resource(resource_link, 'wirecloud_token'), b'resource content')

    def test_resource_download_unexpected_response(self):

        resource_link = '/media/resources/CoNWeT__Kurento one2one widget__1.1.2__CoNWeT_kurento-one2one_1.1.2.wgt'
        self.network._servers['http']['example.com'].add_response('GET', resource_link, {'status_code': 409, 'content': '{"message": "error description"}'})
        self.assertRaises(UnexpectedResponse, self.store_client.download_resource, resource_link, 'wirecloud_token')

    def test_resource_upload(self):

        self.network._servers['http']['example.com'].add_response('POST', '/api/offering/resources', {'content': '', 'status_code': 200})
        self.store_client.upload_resource('Resource Name', '1.0', 'resource.zip', 'Resource file, probably a widget, an operator or a mashup', 'application/octet-stream', BytesIO(b'file contents'), 'test_token')

    def test_resource_upload_resource_type(self):

        self.network._servers['http']['example.com'].add_response('POST', '/api/offering/resources', {'content': '', 'status_code': 200})
        self.store_client.upload_resource('Resource Name', '1.0', 'resource.zip', 'Resource file, probably a widget, an operator or a mashup', 'application/octet-stream', BytesIO(b'file contents'), 'test_token', resource_type="Mashable application component")

    def test_resource_upload_conflict(self):

        self.network._servers['http']['example.com'].add_response('POST', '/api/offering/resources', {'content': '', 'status_code': 409})
        self.assertRaises(Conflict, self.store_client.upload_resource, 'Resource Name', '1.0', 'resource.zip', 'Resource file, probably a widget, an operator or a mashup', 'application/octet-stream', BytesIO(b'file contents'), 'test_token')

    def test_resource_upload_error(self):

        self.network._servers['http']['example.com'].add_response('POST', '/api/offering/resources', {'content': '', 'status_code': 400})
        self.assertRaises(UnexpectedResponse, self.store_client.upload_resource, 'Resource Name', '1.0', 'resource.zip', 'Resource file, probably a widget, an operator or a mashup', 'application/octet-stream', BytesIO(b'file contents'), 'test_token')
