# -*- coding: utf-8 -*-

# Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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
import requests
import os
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
        final_path = os.path.normpath(os.path.join(base_path, parsed_url.path[1:]))
        if final_path.startswith(base_path) and os.path.isfile(final_path):
            f = codecs.open(final_path, 'rb')
            contents = f.read()
            f.close()

            return contents
        else:
            raise HTTPError('url', '404', 'Not Found', None, None)


class FakeNetwork(object):

    def __init__(self, servers={}):
        self._servers = servers

    def __call__(self, method, url, *args, **kwargs):
        parsed_url = urlparse(url)

        if parsed_url.scheme not in self._servers or parsed_url.netloc not in self._servers[parsed_url.scheme]:
            raise URLError('not valid')

        server = self._servers[parsed_url.scheme][parsed_url.netloc]
        return server.request(method, url, *args, **kwargs)

    def get_requests_get(self):

        def wrapper(*args, **kwargs):
            res = requests.Response()
            res.status_code = 200
            res.headers.update({
                'Content-Type': 'application/json;charset=UTF-8',
                'Cache-Control': 'no-store',
                'Pragma': 'no-cache',
            })
            res._content = self('GET', *args, **kwargs)
            return res

        return wrapper


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
        cls.old_requests_get = requests.get
        requests.get = cls.network.get_requests_get()

    @classmethod
    def tearDownClass(cls):

        super(StoreTestCase, cls).tearDownClass()

        requests.get = cls.old_requests_get

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
        self.network._servers['http']['example.com'].add_response('GET', '/api/offering/offerings/17', response_text)
        info = self.store_client.get_offering_info('17', 'wirecloud_token')

        self.assertEqual(info, response)
