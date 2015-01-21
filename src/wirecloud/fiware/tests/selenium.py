# -*- coding: utf-8 -*-

# Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import absolute_import, unicode_literals

import os

from selenium.webdriver.support.ui import Select, WebDriverWait

from wirecloud.commons.utils.testcases import DynamicWebServer, LocalFileSystemServer, uses_extra_resources, WirecloudSeleniumTestCase


__test__ = False


def read_response_file(*response):
    f = open(os.path.join(os.path.dirname(__file__), 'test-data', *response))
    contents = f.read()
    f.close()

    return contents


class FiWareSeleniumTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'fiware_test_data')
    servers = {
        'http': {
            'marketplace.example.com': DynamicWebServer(),
            'repository.example.com': LocalFileSystemServer(os.path.join(os.path.dirname(__file__), 'test-data', 'responses', 'repository')),
            'static.example.com': LocalFileSystemServer(os.path.join(os.path.dirname(__file__), 'test-data', 'responses', 'static')),
            'store.example.com': DynamicWebServer(fallback=LocalFileSystemServer(os.path.join(os.path.dirname(__file__), 'test-data', 'responses', 'store'))),
            'store2.example.com': DynamicWebServer(fallback=LocalFileSystemServer(os.path.join(os.path.dirname(__file__), 'test-data', 'responses', 'store2'))),
            'orion.example.com:1026': DynamicWebServer(),
        },
    }
    tags = ('wirecloud-selenium', 'fiware', 'fiware-plugin', 'fiware-selenium')

    @classmethod
    def setUpClass(cls):

        WirecloudSeleniumTestCase.setUpClass.im_func(cls)

        cls.store_list_response = read_response_file('responses', 'marketplace', 'store_list.xml')
        cls.store1_offerings = read_response_file('responses', 'marketplace', 'store1_offerings.xml')
        cls.store2_offerings = read_response_file('responses', 'marketplace', 'store2_offerings.xml')

    def setUp(self):

        super(FiWareSeleniumTestCase, self).setUp()

        self.network._servers['http']['marketplace.example.com'].clear()
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/registration/stores/', {'content': self.store_list_response})
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/offering/store/Store%201/offerings', {'content': self.store1_offerings})
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/offering/store/Store%202/offerings', {'content': self.store2_offerings})
        self.network._servers['http']['store.example.com'].clear()
        self.network._servers['http']['store2.example.com'].clear()
        self.network._servers['http']['orion.example.com:1026'].clear()

    def test_add_fiware_marketplace(self):

        self.login()

        with self.marketplace_view as marketplace:
            marketplace.add('fiware', 'http://marketplace.example.com/', 'fiware')
            widget_offering = marketplace.search_in_results('Smart City Lights application')
            self.assertIsNotNone(widget_offering)
    test_add_fiware_marketplace.tags = ('fiware', 'fiware-plugin', 'fiware-selenium', 'fiware-ut-8')

    def test_add_public_fiware_marketplace(self):

        self.login()

        with self.marketplace_view as marketplace:
            marketplace.add('fiware', 'http://marketplace.example.com/', 'fiware', public=True)
            widget_offering = marketplace.search_in_results('Smart City Lights application')
            self.assertIsNotNone(widget_offering)
    test_add_public_fiware_marketplace.tags = ('fiware', 'fiware-plugin', 'fiware-selenium', 'fiware-ut-8')

    def test_delete_fiware_marketplace(self):

        self.login(username='user_with_markets')

        with self.marketplace_view as marketplace:
            marketplace.switch_to('fiware')
            marketplace.delete()
    test_delete_fiware_marketplace.tags = ('fiware', 'fiware-plugin', 'fiware-selenium', 'fiware-ut-8')

    def test_ngsi_available_to_widgets(self):

        self.login()

        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_ngsi-test-widget_1.0.1.wgt', 'Wirecloud NGSI API test widget')

        with self.add_widget_to_mashup('Wirecloud NGSI API test widget'):
            api_element = self.driver.find_element_by_id('api_available')
            self.assertEqual(api_element.text, 'Yes')
    test_ngsi_available_to_widgets.tags = ('fiware', 'fiware-plugin', 'fiware-selenium', 'fiware-ut-7')

    @uses_extra_resources(('Wirecloud_ngsi-test-widget_1.0.1.wgt',))
    def test_ngsi_api_reports_failures(self):
        self.login()

        widget = self.add_widget_to_mashup('Wirecloud NGSI API test widget')

        # Open widget settings
        widget.open_menu().click_entry('Settings')

        # Change widget settings
        text_input = self.driver.find_element_by_css_selector('.window_menu [name="ngsi_server"]')
        self.fill_form_input(text_input, 'http://orion.example.com:1026')
        boolean_input = self.driver.find_element_by_css_selector('.window_menu [name="use_user_fiware_token"]')
        boolean_input.click()

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        with widget:
            api_element = self.driver.find_element_by_id('api_available')
            self.assertEqual(api_element.text, 'Yes')
            self.driver.find_element_by_css_selector('.btn-primary').click()
            alert = self.driver.find_element_by_css_selector('.alert-error p')
            self.assertEqual(alert.text, 'Unexpected error code: 404')

    def test_objectstorage_available_to_widgets(self):

        self.login()

        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_objectstorage-test-widget_1.0.wgt', 'Wirecloud Object Storage API test widget')

        with self.add_widget_to_mashup('Wirecloud Object Storage API test widget'):
            api_element = self.driver.find_element_by_id('api_available')
            self.assertEqual(api_element.text, 'Yes')
    test_objectstorage_available_to_widgets.tags = ('fiware', 'fiware-plugin', 'fiware-selenium', 'fiware-ut-12')

    @uses_extra_resources(('Wirecloud_objectstorage-test-widget_1.0.wgt',))
    def test_objectstorage_reports_failures(self):

        self.login()

        with self.add_widget_to_mashup('Wirecloud Object Storage API test widget'):
            api_element = self.driver.find_element_by_id('api_available')
            self.assertEqual(api_element.text, 'Yes')
            self.driver.find_element_by_css_selector('.btn-primary').click()
            WebDriverWait(self.driver, 10).until(lambda driver: driver.find_element_by_css_selector('.btn-primary:not(.disabled)'))

            tenant_id_step = self.driver.find_element_by_id('tenantId')
            self.assertEqual(tenant_id_step.text, 'Fail')
            alert = self.driver.find_element_by_css_selector('.alert-error')
            self.assertEqual(alert.text, 'Failure!')

    def test_marketplace_keyword_search(self):

        response_text = read_response_file('responses', 'marketplace', 'keyword_search.xml')
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/search/offerings/fulltext/test', {'content': response_text})

        self.login(username='user_with_markets')

        with self.marketplace_view as marketplace:
            marketplace.switch_to('fiware')

            marketplace.search('test')
            self.assertIsNotNone(marketplace.search_in_results('Smart City Lights application'))

    def test_marketplace_filter_by_store(self):

        self.login(username='user_with_markets')

        with self.marketplace_view as marketplace:
            marketplace.switch_to('fiware')

            catalogue_base_element = marketplace.wait_catalogue_ready()
            store_select = Select(catalogue_base_element.find_element_by_css_selector('.store_select select'))
            store_select.select_by_value('Store 1')

            # Check results from store 1 are not displayed
            self.assertIsNone(marketplace.search_in_results('Weather widget'))

            # Check results from store 2 are displayed
            self.assertIsNotNone(marketplace.search_in_results('Test Operator'))
            self.assertIsNotNone(marketplace.search_in_results('Smart City Lights application'))

    def test_marketplace_offering_buttons(self):

        response_text = read_response_file('responses', 'marketplace', 'keyword_search.xml')
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/search/offerings/fulltext/test', {'content': response_text})

        self.login(username='user_with_markets')

        with self.marketplace_view as marketplace:
            marketplace.switch_to('fiware')

            free_offering = marketplace.search_in_results('Weather widget')
            button = free_offering.element.find_element_by_css_selector('.mainbutton')
            self.assertEqual(button.text, 'Free')

            simple_price_offering = marketplace.search_in_results('Test Operator')
            button = simple_price_offering.element.find_element_by_css_selector('.mainbutton')
            self.assertEqual(button.text, '10 €')

            complex_price_offering = marketplace.search_in_results('Smart City Lights application')
            button = complex_price_offering.element.find_element_by_css_selector('.mainbutton')
            self.assertEqual(button.text, 'Purchase')

            arbitrary_offering = marketplace.search_in_results('Arbitrary Offering')
            button = arbitrary_offering.element.find_element_by_css_selector('.mainbutton')
            self.assertEqual(button.text, 'Details')

            # Purchased offerings
            pack_offering = marketplace.search_in_results('MultimediaPack')
            button = pack_offering.element.find_element_by_css_selector('.mainbutton')
            self.assertEqual(button.text, 'Install')

            open_offering = marketplace.search_in_results('Open Offering')
            button = open_offering.element.find_element_by_css_selector('.mainbutton')
            self.assertEqual(button.text, 'Install')

    def test_marketplace_offering_list_when_store_down(self):

        response_text = read_response_file('responses', 'marketplace', 'keyword_search.xml')
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/search/offerings/fulltext/test', {'content': response_text})
        old_store = self.network._servers['http']['store.example.com']
        del self.network._servers['http']['store.example.com']

        try:
            self.login(username='user_with_markets')

            with self.marketplace_view as marketplace:
                marketplace.switch_to('fiware')

                # Weather widget comes from an accesible store (store2 is online)
                free_offering = marketplace.search_in_results('Weather widget')
                button = free_offering.element.find_element_by_css_selector('.mainbutton')
                self.assertEqual(button.text, 'Free')

                arbitrary_offering = marketplace.search_in_results('Arbitrary Offering')
                button = arbitrary_offering.element.find_element_by_css_selector('.mainbutton')
                self.assertEqual(button.text, 'Details')

                open_offering = marketplace.search_in_results('Open Offering')
                button = open_offering.element.find_element_by_css_selector('.mainbutton')
                self.assertEqual(button.text, 'Install')

                # All offerings from store 1 should have a Details button (as it is currently down)
                for offering_name in ('Test Operator', 'Smart City Lights application', 'MultimediaPack'):
                    offering = marketplace.search_in_results(offering_name)
                    button = offering.element.find_element_by_css_selector('.mainbutton')
                    self.assertEqual(button.text, 'Details')

        finally:
            self.network._servers['http']['store.example.com'] = old_store

    def test_other_offering_buttons(self):

        offering_name = 'Arbitrary Offering'

        self.login(username='user_with_markets')

        with self.marketplace_view as marketplace:

            marketplace.switch_to('fiware')

            with marketplace.search_in_results(offering_name) as offering:
                buttons = len(offering.details.find_elements_by_css_selector('.panel .styled_button:not(.plain), .se-notebook-tab-content .styled_button'))
                self.assertEqual(buttons, 0)

    def test_store_upload_resource(self):

        self.network._servers['http']['store.example.com'].add_response('POST', '/api/offering/resources', {'content': ''})

        self.login(username='user_with_markets')

        with self.myresources_view as myresources:
            with myresources.search_in_results('Test') as resource:

                resource.advanced_operation('Publish')

                window_menu = self.wait_element_visible_by_css_selector('.window_menu.publish_resource')
                window_menu.find_element_by_css_selector('input[value="user_with_markets/fiware"]').click()
                self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()
                self.wait_wirecloud_ready()

                window_menus = self.driver.find_elements_by_css_selector('.window_menu')
                self.assertEqual(len(window_menus), 1, 'Resource was not uploaded')

    def _buy_offering(self):
        bought_response_text = read_response_file('responses', 'store2', 'service2_bought.json')
        self.network._servers['http']['store2.example.com'].add_response('GET', '/api/offering/offerings/service2.rdf', {'content': bought_response_text})
        self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Start']").click()
        WebDriverWait(self.driver, 10).until(lambda driver: len(driver.find_elements_by_css_selector('.window_menu')) == 1)
        self.wait_wirecloud_ready()

    def check_store_buy_offering(self, from_details):

        response_text = read_response_file('responses', 'marketplace', 'keyword_search.xml')
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/search/offerings/fulltext/test', {'content': response_text})
        self.network._servers['http']['store2.example.com'].add_response('POST', '/api/contracting/form', {'content': str('{"url": "' + self.live_server_url + '"}')})
        response_text = read_response_file('responses', 'marketplace', 'store2_weatherwidget_offering.xml')
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/offering/store/Store%202/offering/WeatherWidget', {'content': response_text})

        self.login(username='user_with_markets')

        with self.marketplace_view as marketplace:
            marketplace.switch_to('fiware')

            free_offering = marketplace.search_in_results('Weather widget')
            if from_details:
                with free_offering:
                    free_offering.details.find_element_by_css_selector('.mainbutton').click()
                    self._buy_offering()
                    mainbutton = free_offering.details.find_element_by_css_selector('.mainbutton')
                    self.assertEqual(mainbutton.text, 'Uninstall')
            else:
                free_offering.element.find_element_by_css_selector('.mainbutton').click()
                self._buy_offering()

            marketplace.wait_catalogue_ready()

            free_offering = marketplace.search_in_results('Weather widget')
            button = free_offering.element.find_element_by_css_selector('.mainbutton')
            self.assertEqual(button.text, 'Uninstall')

    def test_store_buy_offering(self):
        self.check_store_buy_offering(False)

    def test_store_buy_offering_from_details(self):
        self.check_store_buy_offering(True)

    def check_offering_install(self, offering_name, resources):

        self.login(username='user_with_markets')

        with self.marketplace_view as marketplace:

            with marketplace.myresources as myresources:
                for resource_name in resources:
                    self.assertIsNone(myresources.search_in_results(resource_name))

            marketplace.switch_to('fiware')

            offering = marketplace.search_in_results(offering_name)
            button = offering.element.find_element_by_css_selector('.mainbutton')
            self.assertEqual(button.text, 'Install')

            self.scroll_and_click(button)
            self.wait_wirecloud_ready()
            marketplace.wait_catalogue_ready()
            offering = marketplace.search_in_results(offering_name)
            button = offering.element.find_element_by_css_selector('.mainbutton')
            self.assertEqual(button.text, 'Uninstall')

            with marketplace.myresources as myresources:
                for resource_name in resources:
                    self.assertIsNotNone(myresources.search_in_results(resource_name))

    def test_install_store_offering(self):

        response_text = read_response_file('responses', 'store2', 'service2_bought.json')
        self.network._servers['http']['store2.example.com'].add_response('GET', '/api/offering/offerings/service2.rdf', {'content': response_text})
        offering_name = 'Weather widget'
        resources = ('Weather Widget Example',)

        self.check_offering_install(offering_name, resources)

    def test_install_store_open_offering(self):

        offering_name = 'Open Offering'
        resources = ('Weather Widget Example',)

        self.check_offering_install(offering_name, resources)

    def test_install_store_offering_embedded(self):

        response_text = read_response_file('responses', 'store2', 'service_embedded_bought.json')
        self.network._servers['http']['store2.example.com'].add_response('GET', '/api/offering/offerings/service2.rdf', {'content': response_text})
        offering_name = 'Weather widget'
        resources = (
            'TestMashupEmbedded',
            'nonavailable-widget',
            'nonavailable-operator',
        )

        self.check_offering_install(offering_name, resources)

    def test_install_store_pack_offering(self):

        offering_name = 'MultimediaPack'
        resources = (
            'YouTube Browser',
            'Input Box',
        )

        self.check_offering_install(offering_name, resources)

    @uses_extra_resources((
        'responses/static/CoNWeT__Input Box Widget__1.0__CoNWeT_input-box_1.0.wgt',
        'responses/static/CoNWeT__Youtube Browser Widget__2.99.0__CoNWeT_youtube-browser_2.99.0.wgt',
        ),
        public=False,
        users=('user_with_markets',))
    def test_uninstall_store_pack_offering(self):

        offering_name = 'MultimediaPack'
        resources = (
            'YouTube Browser',
            'Input Box',
        )

        self.login(username='user_with_markets')

        with self.marketplace_view as marketplace:

            with marketplace.myresources as myresources:
                for resource_name in resources:
                    self.assertIsNotNone(myresources.search_in_results(resource_name))

            marketplace.switch_to('fiware')

            free_offering = marketplace.search_in_results(offering_name)
            button = free_offering.element.find_element_by_css_selector('.mainbutton')
            self.assertEqual(button.text, 'Uninstall')

            button.click()
            self.wait_wirecloud_ready()

            free_offering = marketplace.search_in_results(offering_name)
            button = free_offering.element.find_element_by_css_selector('.mainbutton')
            self.assertEqual(button.text, 'Install')

            with marketplace.myresources as myresources:
                for resource_name in resources:
                    self.assertIsNone(myresources.search_in_results(resource_name))

    def check_install_individual_resource_from_store_offering(self, last):

        offering_name = 'MultimediaPack'
        resource_name = 'YouTube Browser'

        self.login(username='user_with_markets')

        with self.marketplace_view as marketplace:

            with marketplace.myresources as myresources:
                myresources.search(resource_name)
                self.assertIsNone(myresources.search_in_results(resource_name))

            marketplace.switch_to('fiware')

            with marketplace.search_in_results(offering_name) as free_offering:
                mainbutton = free_offering.details.find_element_by_css_selector('.mainbutton')
                self.assertEqual(mainbutton.text, 'Install')

                tabs = free_offering.details.find_elements_by_css_selector('.se-notebook-tab')
                for tab in tabs:
                    tab.location_once_scrolled_into_view
                    if tab.text == 'Resources':
                        self.scroll_and_click(tab)
                        break
                resources = free_offering.details.find_elements_by_css_selector('.offering_resource_list .offering_resource')
                resource = resources[0]
                button = resource.find_element_by_css_selector('.styled_button')
                self.assertEqual(button.text, 'Install')
                button.click()

                self.wait_wirecloud_ready()
                self.assertEqual(button.text, 'Uninstall')

                if last:
                    self.assertEqual(mainbutton.text, 'Uninstall')
                else:
                    self.assertEqual(mainbutton.text, 'Install')

            with marketplace.myresources as myresources:
                self.assertIsNotNone(myresources.search_in_results(resource_name))

    def test_install_individual_resource_from_store_offering(self):
        self.check_install_individual_resource_from_store_offering(False)

    @uses_extra_resources((
        'responses/static/CoNWeT__Input Box Widget__1.0__CoNWeT_input-box_1.0.wgt',
        ),
        public=False,
        users=('user_with_markets',))
    def test_install_last_individual_resource_from_store_offering(self):
        self.check_install_individual_resource_from_store_offering(True)

    def test_marketplace_navigation(self):

        response_text = read_response_file('responses', 'marketplace', 'store2_weatherwidget_offering.xml')
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/offering/store/Store%202/offering/WeatherWidget', {'content': response_text})
        response_text = read_response_file('responses', 'marketplace', 'store1_multimediapack_offering.xml')
        self.network._servers['http']['marketplace.example.com'].add_response('GET', '/offering/store/Store%201/offering/MultimediaPack', {'content': response_text})

        self.login(username="user_with_markets")

        # Fill navigation history
        with self.marketplace_view as marketplace:
            marketplace.switch_to('fiware')
            with marketplace.search_in_results('MultimediaPack'):
                pass
            with marketplace.search_in_results('Weather widget'):
                pass

        # Check navigation history has been filled correctly
        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.get_current_view() == 'marketplace')
        self.assertEqual(self.marketplace_view.get_current_marketplace_name(), 'fiware')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.marketplace_view.get_subview() == 'details')
        self.assertEqual(self.marketplace_view.get_current_resource(), 'Weather widget')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.marketplace_view.get_subview() == 'search')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.marketplace_view.get_subview() == 'details')
        self.assertEqual(self.marketplace_view.get_current_resource(), 'MultimediaPack')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.marketplace_view.get_subview() == 'search')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.marketplace_view.get_current_marketplace_name() == 'origin')
        self.assertEqual(self.marketplace_view.get_subview(), 'search')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.get_current_view() == 'workspace')

        # Replay navigation history
        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.get_current_view() == 'marketplace')
        self.assertEqual(self.marketplace_view.get_current_marketplace_name(), 'origin')
        self.assertEqual(self.marketplace_view.get_subview(), 'search')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.marketplace_view.get_current_marketplace_name() == 'fiware')
        self.assertEqual(self.marketplace_view.get_subview(), 'search')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.marketplace_view.get_subview() == 'details')
        self.assertEqual(self.marketplace_view.get_current_resource(), 'MultimediaPack')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.marketplace_view.get_subview() == 'search')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.marketplace_view.get_subview() == 'details')
        self.assertEqual(self.marketplace_view.get_current_resource(), 'Weather widget')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.marketplace_view.get_subview() == 'search')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.get_current_view() == 'workspace')
