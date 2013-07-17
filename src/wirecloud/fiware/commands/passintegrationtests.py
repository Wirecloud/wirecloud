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
import requests
import time
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

    def test_store_integration_buy(self):

        self.change_marketplace('FI-WARE')
        self.search_resource('Map Viewer')
        resource = self.search_in_catalogue_results('Map Viewer')
        resource.find_element_by_css_selector('.mainbutton > div').click()

        wirecloud_window = self.driver.window_handles[0]
        self.wait_element_visible_by_css_selector('.window_menu .btn-primary > div').click()

        wstore_window = self.driver.window_handles[1]
        self.driver.switch_to_window(wstore_window)

        username_input = self.wait_element_visible_by_id('id_username')
        self.fill_form_input(username_input, 'wcitester')
        password_input = self.driver.find_element_by_id('id_password')
        self.fill_form_input(password_input, 'pass')
        password_input.submit()

        self.wait_element_visible_by_id('tax_addr').click()
        self.driver.find_element_by_css_selector('.modal-footer > .btn-basic').click()

        payment_input = self.wait_element_visible_by_id('pay-method')
        payment_input.send_keys('credit_card')
        self.wait_element_visible_by_id('curr-card').click()
        self.driver.find_element_by_css_selector('.modal-footer > .btn-basic').click()

        self.wait_element_visible_by_id('back')
        time.sleep(0.5)
        self.driver.find_element_by_id('back').click()
        self.driver.switch_to_window(wirecloud_window)

        time.sleep(0.5)
        self.wait_catalogue_ready()
        resource = self.search_in_catalogue_results('Map Viewer')
        self.assertIn(resource.find_element_by_css_selector('.mainbutton > div').text, ('Install', 'Uninstall'))

    def test_store_integration_install_bought_widget(self):

        # Pre buy the Map Viewer offering
        data = {
            "offering": {
                "organization": "CoNWeT",
                "name": "MapViewer",
                "version": "1.0"
            },
            "payment": {
                "method": "credit_card"
            }
        }
        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer wcitester_token',
        }
        response = requests.post(urljoin(STORE_INSTANCE, 'api/contracting'), data=json.dumps(data), headers=headers)
        self.assertEqual(response.status_code, 201, 'Unable to reset WStore status')

        # And uninstall Map Viewer just in case it was installed
        self.search_resource('Map Viewer')
        resource = self.search_in_catalogue_results('Map Viewer')
        if resource is not None:
            self.uninstall_resource('Map Viewer')

        # Run the test
        self.change_marketplace('FI-WARE')
        self.search_resource('Map Viewer')
        resource = self.search_in_catalogue_results('Map Viewer')
        install_button = resource.find_element_by_css_selector('.mainbutton > div')
        self.assertEqual(install_button.text, 'Install')
        install_button.click()
        time.sleep(0.1)
        self.wait_catalogue_ready()

        self.add_widget_to_mashup('Map Viewer')

    def test_pubsub_context_broker_integration(self):

        iwidget = self.add_widget_to_mashup('Wirecloud NGSI API test widget')

        try:
            with iwidget:
                self.driver.find_element_by_css_selector('.styled_button > div').click()
                self.assertEqual(self.wait_element_visible_by_css_selector('.alert').text, 'Success!')
        finally:
            iwidget.remove()

    def test_object_storage_integration(self):
        iwidget = self.add_widget_to_mashup('Wirecloud Object Storage API test widget')

        try:
            with iwidget:
                self.driver.find_element_by_css_selector('.styled_button > div').click()
                self.assertEqual(self.wait_element_visible_by_css_selector('.alert').text, 'Success!')
        finally:
            iwidget.remove()

build_selenium_test_cases((IntegrationTestCase,), locals())

class IntegrationTestsCommand(BaseCommand):
    args = '<url> [test_name]'
    help = 'Passes the integration tests to a Wirecloud instance'

    def handle(self, *args, **options):

        suite = unittest.TestSuite()

        if len(args) == 0:
            suite.addTests(unittest.TestLoader().loadTestsFromTestCase(GoogleChromeIntegrationTestCase))
        else:

            for test in args:
                suite.addTest(GoogleChromeIntegrationTestCase(test))

        unittest.TextTestRunner(verbosity=2).run(suite)
