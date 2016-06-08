# -*- coding: utf-8 -*-

# Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

import json

from django.core.urlresolvers import reverse
from wirecloud.commons.utils.testcases import WirecloudTestCase


# Avoid nose to repeat these tests (they are run through wirecloud/commons/tests/__init__.py)
__test__ = False


class SearchAPITestCase(WirecloudTestCase):

    fixtures = ('user_search_test_data',)
    tags = ('wirecloud-search-api', 'wirecloud-noselenium')

    @classmethod
    def setUpClass(cls):
        super(SearchAPITestCase, cls).setUpClass()
        cls.url = reverse('wirecloud.search_service')

    def test_simple_search(self):
        response = self.client.get(self.url + '?namespace=user&q=li', HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(result_json['results']), 3)

    def test_searches_are_cached(self):

        response = self.client.get(self.url + '?namespace=user&q=li', HTTP_ACCEPT="application/json")
        self.assertIn('ETag', response)
        initial_etag = response['ETag']

        self.assertEqual(response.status_code, 200)

        # New request without changing nothing in the server side
        response = self.client.get(self.url + '?namespace=user&q=li', HTTP_ACCEPT="application/json", HTTP_IF_NONE_MATCH=initial_etag)
        self.assertEqual(response.status_code, 304)

    def test_missing_namespace_parameters(self):
        response = self.client.get(self.url, HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 400)
        json.loads(response.content.decode('utf-8'))

    def test_invalid_namespace_parameters(self):
        response = self.client.get(self.url + '?namespace=invalid', HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 422)
        json.loads(response.content.decode('utf-8'))
