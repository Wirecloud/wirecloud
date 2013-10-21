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

import json
import os
from cStringIO import StringIO

from wirecloud.commons.utils.testcases import DynamicWebServer, WirecloudTestCase
from wirecloud.fiware.storeclient import StoreClient


class StoreTestCase(WirecloudTestCase):

    tags = ('fiware', 'fiware-plugin', 'fiware-ut-13',)
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

    def test_offering_info_retreival(self):

        response_text = self.read_response_file('offering_info.json')
        response = json.loads(response_text)
        self.network._servers['http']['example.com'].add_response('GET', '/api/offering/offerings/17', {'content': response_text})
        info = self.store_client.get_offering_info('17', 'wirecloud_token')

        self.assertEqual(info, response)

    def test_resource_upload(self):

        self.network._servers['http']['example.com'].add_response('POST', '/api/offering/resources', {'content': '', 'status_code': 200})
        self.store_client.upload_resource('Resource Name', '1.0', 'resource.zip', 'Resource file, probably a widget, an operator or a mashup', 'application/octet-stream', StringIO('file contents'), 'test_token')
