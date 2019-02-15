# -*- coding: utf-8 -*-

# Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid

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
from unittest.mock import Mock

from django.core.urlresolvers import reverse
from django.test import Client, TestCase
from django.test.utils import override_settings

from wirecloud.commons.utils.testcases import WirecloudTestCase


# Avoid nose to repeat these tests (they are run through wirecloud/commons/tests/__init__.py)
__test__ = False


@override_settings(ROOT_URLCONF='wirecloud.commons.tests.basic_views_urls')
class BasicViewTestCase(WirecloudTestCase, TestCase):

    tags = ('wirecloud-noselenium', 'wirecloud-error-handlers')
    populate = False
    use_search_indexes = False

    def setUp(self):
        super(BasicViewTestCase, self).setUp()

        self.client = Client()

    def check_html_response(self, response, status_code):
        self.assertEqual(response.status_code, status_code)
        self.assertEqual(response['Content-Type'], 'text/html; charset=utf-8')

    def check_json_response(self, response, status_code):
        self.assertEqual(response.status_code, status_code)
        self.assertEqual(response['Content-Type'], 'application/json; charset=utf-8')

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_bad_request_html(self):

        url = reverse('valid_path')
        response = self.client.get(url, HTTP_HOST='bad_host', HTTP_ACCEPT='text/html')
        self.check_html_response(response, 400)

    def test_bad_request_json(self):

        url = reverse('valid_path')
        response = self.client.get(url, HTTP_HOST='bad_host', HTTP_ACCEPT='application/json')
        self.check_json_response(response, 400)

    def test_forbidden_html(self):

        url = reverse('forbidden_path')
        response = self.client.get(url, HTTP_ACCEPT='text/html')
        self.check_html_response(response, 403)

    def test_forbidden_json(self):

        url = reverse('forbidden_path')
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.check_json_response(response, 403)

    def test_not_found_html(self):

        response = self.client.get('notfound', HTTP_ACCEPT='text/html')
        self.check_html_response(response, 404)

    def test_not_found_json(self):

        response = self.client.get('notfound', HTTP_ACCEPT='application/json')
        self.check_json_response(response, 404)

    def test_server_error_html(self):

        # Django Client reraises exceptions raised by views
        # We mock the store_exc_info method to retrieve the internal error
        # response instead
        self.client.store_exc_info = Mock()

        url = reverse('server_error_path')
        response = self.client.get(url, HTTP_ACCEPT='text/html')
        self.check_html_response(response, 500)

    def test_server_error_json(self):

        # Django Client reraises exceptions raised by views
        # We mock the store_exc_info method to retrieve the internal error
        # response instead
        self.client.store_exc_info = Mock()

        url = reverse('server_error_path')
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.check_json_response(response, 500)
