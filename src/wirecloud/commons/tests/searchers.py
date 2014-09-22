# -*- coding: utf-8 -*-

# Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid

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


class UserSearcherTestCase(WirecloudTestCase):

    fixtures = ('user_search_test_data',)
    tags = ('user-search',)

    @classmethod
    def setUpClass(cls):
        super(UserSearcherTestCase, cls).setUpClass()
        cls.url = reverse('wirecloud.resource_search')

    def test_simple_search(self):
        response = self.client.get(self.url + '?namespace=user&q=li')

        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(result_json['results']), 3)
