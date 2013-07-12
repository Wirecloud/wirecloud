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

import requests
from urlparse import urljoin

from django.utils import unittest

from wirecloud.commons.utils.commands import BaseCommand
from wirecloud.commons.utils.remote import WirecloudRemoteTestCase


DEFAULT_BROWSER_CONF = {
    'Firefox': {
        'CLASS': 'selenium.webdriver.Firefox',
    },
    'GoogleChrome': {
        'CLASS': 'selenium.webdriver.Chrome',
    },
}

def build_selenium_test_cases(classes, namespace):

    browsers = DEFAULT_BROWSER_CONF

    for class_name in classes:
        for browser_name in browsers:
            browser = browsers[browser_name]

            if isinstance(class_name, basestring):
                module_name, klass_name = class_name.rsplit('.', 1)
                tests_class_name = browser_name + klass_name
                module = import_module(module_name)
                klass_instance = getattr(module, klass_name)
            else:
                tests_class_name = browser_name + class_name.__name__
                klass_instance = class_name

            namespace[tests_class_name] = type(
                tests_class_name,
                (klass_instance,),
                {
                    '__test__': True,
                    '_webdriver_class': browser['CLASS'],
                    '_webdriver_args': browser.get('ARGS', None),
                }
            )
build_selenium_test_cases.__test__ = False

WIRECLOUD_INSTANCE = 'http://wirecloud.testbed.fi-ware.eu'
STORE_INSTANCE = 'http://wstore.testbed.fi-ware.eu'

class IntegrationTestCase(WirecloudRemoteTestCase, unittest.TestCase):

    live_server_url = WIRECLOUD_INSTANCE

    def setUp(self):

        response = requests.get(urljoin(STORE_INSTANCE, 'api/administration/profiles/wcitester/reset'))
        self.assertEqual(response.status_code, 200, 'Unable to reset WStore status')
        self.login('itester', 'integration s3cr3t')

    def test_marketplace_integration(self):

        self.change_marketplace('FI-WARE')
        self.search_resource('Orion Context')
        resource = self.search_in_catalogue_results('Orion Context Broker')
        self.assertIsNotNone(resource, "FI-WARE Marketplace searches doesn't work")

    def test_store_integration(self):

        self.change_marketplace('FI-WARE')
        self.search_resource('Map Viewer')
        resource = self.search_in_catalogue_results('Map Viewer')
        resource.find_element_by_css_selector('.mainbutton')

    def test_pubsub_context_broker_integration(self):
        pass

    def test_object_storage_integration(self):
        pass

build_selenium_test_cases((IntegrationTestCase,), locals())

class IntegrationTestsCommand(BaseCommand):
    args = '<url>'
    help = 'Passes the integration tests to a Wirecloud instance'

    def handle(self, *args, **options):

        suite = unittest.TestSuite()
        suite.addTests(unittest.TestLoader().loadTestsFromTestCase(FirefoxIntegrationTestCase))
        unittest.TextTestRunner(verbosity=2).run(suite)
