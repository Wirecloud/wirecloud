# -*- coding: utf-8 -*-

# Copyright 2013 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

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


from django.core.urlresolvers import reverse
from django.test import Client
from django.utils import simplejson

from wirecloud.commons.test import WirecloudTestCase


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


class ApplicationMashupAPI(WirecloudTestCase):

    fixtures = ('selenium_test_data',)

    @classmethod
    def setUpClass(cls):
        super(ApplicationMashupAPI, cls).setUpClass()

        cls.client = Client()

    def test_features(self):

        url = reverse('wirecloud.features')

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_workspace_collection_read(self):

        url = reverse('wirecloud.workspace_collection')

        self.client.login(username='admin', password='admin')

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, list))
        self.assertTrue(isinstance(response_data[0], dict))
