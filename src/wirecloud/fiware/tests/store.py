# -*- coding: utf-8 -*-

# Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

import codecs
import json
import mimetypes
import os
import requests
from cStringIO import StringIO
from urllib2 import URLError, HTTPError
from urlparse import urlparse

from wirecloud.commons.utils.testcases import WirecloudTestCase
from wirecloud.fiware.storeclient import StoreClient


class DynamicWebServer(object):

    responses = {}

    def add_response(self, method, path, response_body):

        if path not in self.responses:
            self.responses[path] = {}

        self.responses[path][method] = response_body

    def clear(self):
        self.responses = {}

    def request(self, method, url, *args, **kwargs):

        parsed_url = urlparse(url)
        if parsed_url.path not in self.responses or method not in self.responses[parsed_url.path]:
            raise HTTPError('url', '404', 'Not Found', None, None)

        return self.responses[parsed_url.path][method]


class LocalFileSystemServer(object):

    def __init__(self, base_path):

        self.base_path = base_path

    def request(self, method, url, *args, **kwargs):

        if method != 'GET':
            raise HTTPError('url', '405', 'Method not allowed', None, None)

        parsed_url = urlparse(url)
        final_path = os.path.normpath(os.path.join(self.base_path, parsed_url.path[1:]))
        if final_path.startswith(self.base_path) and os.path.isfile(final_path):
            f = codecs.open(final_path, 'rb')
            contents = f.read()
            f.close()

            return {
                'headers': {
                    'Content-Type': mimetypes.guess_type(final_path, strict=False)[0],
                    'Content-Length': len(contents),
                },
                'content': contents,
            }
        else:
            raise HTTPError('url', '404', 'Not Found', None, None)


class FakeNetwork(object):

    old_requests_get = None
    old_requests_post = None

    def __init__(self, servers={}):
        self._servers = servers

    def __call__(self, method, url, *args, **kwargs):
        parsed_url = urlparse(url)

        if parsed_url.scheme not in self._servers or parsed_url.netloc not in self._servers[parsed_url.scheme]:
            raise URLError('not valid')

        server = self._servers[parsed_url.scheme][parsed_url.netloc]
        return server.request(method, url, *args, **kwargs)

    def mock_requests(self):

        if self.old_requests_get is not None:
            return

        def get_mock(url, *args, **kwargs):
            res_info = self('GET', url, *args, **kwargs)

            res = requests.Response()
            res.url = res_info.get('url', url)
            res.status_code = res_info.get('status_code', 200)
            if 'headers' in res_info:
                res.headers.update(res_info['headers'])
            res._content = res_info.get('content', '')
            return res

        def post_mock(url, *args, **kwargs):
            res_info = self('POST', url, *args, **kwargs)

            res = requests.Response()
            res.url = res_info.get('url', url)
            res.status_code = res_info.get('status_code', 200)
            if 'headers' in res_info:
                res.headers.update(res_info['headers'])
            res._content = res_info.get('content', '')
            return res

        self.old_requests_get = requests.get
        requests.get = get_mock
        self.old_requests_post = requests.post
        requests.post = post_mock

    def unmock_requests(self):
        requests.get = self.old_requests_get
        requests.post = self.old_requests_post
        self.old_requests_get = None
        self.old_requests_post = None


class StoreTestCase(WirecloudTestCase):

    tags = ('fiware-ut-13',)

    @classmethod
    def setUpClass(cls):

        super(StoreTestCase, cls).setUpClass()

        cls.network = FakeNetwork({
            'http': {
                'example.com': DynamicWebServer()
            },
        })
        cls.network.mock_requests()

    @classmethod
    def tearDownClass(cls):

        super(StoreTestCase, cls).tearDownClass()

        cls.network.unmock_requests()

    def setUp(self):

        super(StoreTestCase, self).setUp()

        self.store_client = StoreClient('http://example.com')
        self.network._servers['http']['example.com'].clear()

    def read_response_file(self, *response):
        f = open(os.path.join(os.path.dirname(__file__), 'test-data', *response))
        contents = f.read()
        f.close()

        return contents

    def test_offering_info_retreival(self):

        response_text = self.read_response_file('offering_info.json')
        response = json.loads(response_text)
        self.network._servers['http']['example.com'].add_response('GET', '/api/offering/offerings/17', {'content': response_text})
        info = self.store_client.get_offering_info('17', 'wirecloud_token')

        self.assertEqual(info, response)

    def test_resource_upload(self):

        self.network._servers['http']['example.com'].add_response('POST', '/api/offering/resources', {'content': '', 'status_code': 200})
        self.store_client.upload_resource('Resource Name', '1.0', 'resource.zip', 'Resource file, probably a widget, an operator or a mashup', 'application/octet-stream', 'file contents', 'test_token')
