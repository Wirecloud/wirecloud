# -*- coding: utf-8 -*-

# Copyright 2012-2013 Universidad Politécnica de Madrid

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

import codecs
import json
import os
import re
import time

from django.conf import settings
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from django.db import transaction
from django.test import TransactionTestCase, Client
from django.utils import unittest
import selenium
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait

from wirecloud.commons.utils.testcases import uses_extra_resources, WirecloudTestCase, WirecloudSeleniumTestCase
from wirecloud.platform import plugins
from wirecloud.platform.workspace.models import Workspace


# Avoid nose to repeat these tests (they are run through wirecloud/tests.py)
__test__ = False

SELENIUM_VERSION = tuple(selenium.__version__.split('.'))


def selenium_supports_draganddrop(driver):
    return driver.capabilities['browserName'] != 'firefox' or SELENIUM_VERSION >= (2, 37, 2) or driver.profile.native_events_enabled


class WiringTestCase(TransactionTestCase):

    fixtures = ('test_data',)
    tags = ('wiring',)

    def setUp(self):

        super(WiringTestCase, self).setUp()

        self.user = User.objects.get(username='test')

        workspace = Workspace.objects.get(id=1)
        self.workspace_id = workspace.pk

        workspace.wiringStatus = json.dumps({
            'operators': [],
            'connections': [],
        })
        workspace.save()
        transaction.commit()

        self.wiring_url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': self.workspace_id})

    def test_save_basic_wiring_connection(self):
        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': [],
            'connections': [
                {
                    'source': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'slot',
                    },
                },
            ],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')

        self.assertEqual(response.status_code, 204)
    test_save_basic_wiring_connection.tags = ('wiring', 'fiware-ut-6')

    def test_wiring_modification_fails_with_incorrect_user(self):
        client = Client()
        client.login(username='test2', password='test')

        data = json.dumps({
            'operators': [],
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)
    test_wiring_modification_fails_with_incorrect_user.tags = ('wiring', 'fiware-ut-6')

    def test_basic_wiring_operations_with_read_only_connections(self):
        workspace = Workspace.objects.get(id=1)
        workspace.wiringStatus = json.dumps({
            'operators': [],
            'connections': [
                {
                    'readOnly': True,
                    'source': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'slot',
                    },
                },
            ],
        })
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': [],
            'connections': [
                {
                    'readOnly': True,
                    'source': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'slot',
                    },
                },
                {
                    'source': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'iwidget',
                        'id': 2,
                        'endpoint': 'slot',
                    },
                },
            ],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')

        self.assertEqual(response.status_code, 204)

    def test_read_only_connections_cannot_be_deleted(self):

        workspace = Workspace.objects.get(id=1)
        workspace.wiringStatus = json.dumps({
            'operators': [],
            'connections': [
                {
                    'readOnly': True,
                    'source': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'slot',
                    },
                },
            ],
        })
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': [],
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_read_only_connections_cannot_be_modified(self):

        workspace = Workspace.objects.get(id=1)
        workspace.wiringStatus = json.dumps({
            'operators': [],
            'connections': [
                {
                    'readOnly': True,
                    'source': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'slot',
                    },
                },
            ],
        })
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        data = json.dumps({
            'operators': [],
            'connections': [
                {
                    'readOnly': True,
                    'source': {
                        'type': 'iwidget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'iwidget',
                        'id': 2,
                        'endpoint': 'slot',
                    },
                },
            ],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)


class OperatorCodeEntryTestCase(WirecloudTestCase):

    XML_NORMALIZATION_RE = re.compile(r'>\s+<')
    fixtures = ('selenium_test_data',)
    tags = ('wiring',)

    @classmethod
    def setUpClass(cls):
        if hasattr(settings, 'FORCE_DOMAIN'):
            cls.old_FORCE_DOMAIN = settings.FORCE_DOMAIN
        if hasattr(settings, 'FORCE_PROTO'):
            cls.old_FORCE_PROTO = settings.FORCE_PROTO

        settings.FORCE_DOMAIN = 'example.com'
        settings.FORCE_PROTO = 'http'
        cls.OLD_WIRECLOUD_PLUGINS = getattr(settings, 'WIRECLOUD_PLUGINS', None)

        settings.WIRECLOUD_PLUGINS = ()
        plugins.clear_cache()

        super(OperatorCodeEntryTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, 'old_FORCE_DOMAIN'):
            settings.FORCE_DOMAIN = cls.old_FORCE_DOMAIN
        else:
            del settings.FORCE_DOMAIN

        if hasattr(cls, 'old_FORCE_PROTO'):
            settings.FORCE_PROTO = cls.old_FORCE_PROTO
        else:
            del settings.FORCE_PROTO

        settings.WIRECLOUD_PLUGINS = cls.OLD_WIRECLOUD_PLUGINS
        plugins.clear_cache()

        super(OperatorCodeEntryTestCase, cls).tearDownClass()

    def read_file(self, *filename):
        f = codecs.open(os.path.join(os.path.dirname(__file__), *filename), 'rb')
        contents = f.read()
        f.close()

        return contents

    def test_operator_code_entry_get(self):

        client = Client()

        # Authenticate
        client.login(username='normuser', password='admin')

        # Make the request
        resource_id = (
            'Wirecloud',
            'TestOperator',
            '1.0',
        )
        url = reverse('wirecloud.operator_code_entry', args=resource_id)
        response = client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/xhtml+xml')
        final_code = self.XML_NORMALIZATION_RE.sub('><', response.content)

        expected_code = self.read_file('test-data/xhtml1-expected.xhtml')
        self.assertEqual(final_code, expected_code)


class WiringSeleniumTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wiring', 'wiring_editor')

    def test_operators_are_usable_after_installing(self):

        self.login()

        self.add_packaged_resource_to_catalogue('Wirecloud_TestOperatorSelenium_1.0.zip', 'TestOperatorSelenium', shared=True)

        self.change_main_view('wiring')

        wiring_base_element = self.driver.find_element_by_css_selector('.wiring_editor')
        menubar = wiring_base_element.find_element_by_css_selector('.menubar')

        menubar.find_element_by_xpath("//*[contains(@class, 'styled_expander')]//*[contains(@class, 'title') and text()='Operators']").click()
        menubar.find_element_by_xpath("//*[contains(@class, 'container ioperator')]//*[text()='TestOperatorSelenium']")
    test_operators_are_usable_after_installing.tags = ('wiring', 'wiring_editor', 'fiware-ut-6')

    def test_operators_are_not_usable_after_being_uninstalled(self):

        self.login()

        self.uninstall_resource('TestOperator')

        self.change_main_view('wiring')

        wiring_base_element = self.driver.find_element_by_css_selector('.wiring_editor')
        menubar = wiring_base_element.find_element_by_css_selector('.menubar')

        menubar.find_element_by_xpath("//*[contains(@class, 'styled_expander')]//*[contains(@class, 'title') and text()='Operators']").click()
        self.assertRaises(NoSuchElementException, menubar.find_element_by_xpath, "//*[contains(@class, 'container ioperator')]//*[text()='TestOperator']")
    test_operators_are_not_usable_after_being_uninstalled.tags = ('wiring', 'wiring_editor', 'fiware-ut-6')

    def test_operators_are_not_usable_after_being_deleted(self):

        self.login()

        self.delete_resource('TestOperator')

        self.change_main_view('wiring')

        wiring_base_element = self.driver.find_element_by_css_selector('.wiring_editor')
        menubar = wiring_base_element.find_element_by_css_selector('.menubar')

        menubar.find_element_by_xpath("//*[contains(@class, 'styled_expander')]//*[contains(@class, 'title') and text()='Operators']").click()
        self.assertRaises(NoSuchElementException, menubar.find_element_by_xpath, "//*[contains(@class, 'container ioperator')]//*[text()='TestOperator']")

    def test_basic_wiring_editor_operations(self):

        if not selenium_supports_draganddrop(self.driver):
            raise unittest.SkipTest('This test need make use of the native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

        self.login()

        self.add_widget_to_mashup('Test', new_name='Test (1)')
        self.add_widget_to_mashup('Test', new_name='Test (2)')
        self.add_widget_to_mashup('Test', new_name='Test (3)')
        iwidgets = self.get_current_iwidgets()

        self.change_main_view('wiring')
        grid = self.driver.find_element_by_xpath("//*[contains(@class, 'container center_container grid')]")

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (1)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(-40, -40).release().perform()

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (2)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(40, 40).release().perform()

        source = iwidgets[0].get_wiring_endpoint('outputendpoint')
        target = iwidgets[1].get_wiring_endpoint('inputendpoint')
        ActionChains(self.driver).drag_and_drop(source.element, target.element).perform()

        self.change_main_view('workspace')

        with iwidgets[0]:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        time.sleep(0.2)

        with iwidgets[1]:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

        with iwidgets[2]:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

        with iwidgets[0]:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')
    test_basic_wiring_editor_operations.tags = ('wiring', 'wiring_editor', 'fiware-ut-6')

    def test_widget_preferences_in_wiring_editor(self):

        self.login(username='user_with_workspaces')
        iwidget = self.get_current_iwidgets()[0]

        with iwidget:
            self.assertEqual(self.driver.find_element_by_id('listPref').text, 'default')
            self.assertEqual(self.driver.find_element_by_id('textPref').text, 'initial text')
            self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'false')
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, 'default')

        self.change_main_view('wiring')

        # Change widget settings
        widget = self.wait_element_visible_by_css_selector('.grid > .iwidget')
        widget.find_element_by_css_selector('.editPos_button').click()
        self.popup_menu_click('Settings')

        list_input = self.driver.find_element_by_css_selector('.window_menu [name="list"]')
        self.fill_form_input(list_input, '1')  # value1
        text_input = self.driver.find_element_by_css_selector('.window_menu [name="text"]')
        self.fill_form_input(text_input, 'test')
        boolean_input = self.driver.find_element_by_css_selector('.window_menu [name="boolean"]')
        boolean_input.click()
        password_input = self.driver.find_element_by_css_selector('.window_menu [name="password"]')
        self.fill_form_input(password_input, 'password')

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        self.change_main_view('workspace')

        with iwidget:
            self.assertEqual(self.driver.find_element_by_id('listPref').text, '1')
            self.assertEqual(self.driver.find_element_by_id('textPref').text, 'test')
            self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'true')
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, 'password')

    def test_operator_preferences_in_wiring_editor(self):

        self.login(username='user_with_workspaces')
        iwidgets = self.get_current_iwidgets()

        self.change_main_view('wiring')

        # Change operator settings
        ioperator = self.get_current_wiring_editor_ioperators()[0]
        ioperator.element.find_element_by_css_selector('.specialIcon').click()
        self.wait_element_visible_by_css_selector('.editPos_button', element=ioperator.element).click()
        self.popup_menu_click('Settings')

        prefix_input = self.driver.find_element_by_css_selector('.window_menu [name="prefix"]')
        self.fill_form_input(prefix_input, 'prefix: ')

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        self.change_main_view('workspace')

        with iwidgets[0]:
            try:
                WebDriverWait(self.driver, timeout=10).until(lambda driver: driver.find_element_by_id('wiringOut').text != '')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'preferences changed: prefix')

        with iwidgets[1]:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        time.sleep(0.2)

        with iwidgets[0]:
            try:
                WebDriverWait(self.driver, timeout=10).until(lambda driver: driver.find_element_by_id('wiringOut').text != 'preferences changed: prefix')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'prefix: hello world!!')

    def test_input_endpoint_exceptions(self):

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        source_iwidget = iwidgets[0]
        target_iwidget = iwidgets[1]
        self.assertIsNotNone(source_iwidget.element)
        self.assertIsNotNone(target_iwidget.element)

        target_iwidget.perform_action('Settings')

        boolean_input = self.driver.find_element_by_css_selector('.window_menu [name="boolean"]')
        boolean_input.click()

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        self.assertEqual(source_iwidget.error_count, 0)
        self.assertEqual(target_iwidget.error_count, 0)
        with source_iwidget:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        WebDriverWait(self.driver, timeout=10).until(lambda driver: target_iwidget.error_count == 1)
        self.assertEqual(source_iwidget.error_count, 0)

        with target_iwidget:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

        # Test exception on the operator input endpoint
        source_iwidget = iwidgets[1]
        target_iwidget = iwidgets[0]

        self.change_main_view('wiring')

        # Change operator settings
        ioperator = self.get_current_wiring_editor_ioperators()[0]
        ioperator.element.find_element_by_css_selector('.specialIcon').click()
        self.wait_element_visible_by_css_selector('.editPos_button', element=ioperator.element).click()
        self.popup_menu_click('Settings')

        self.driver.find_element_by_css_selector('.window_menu [name="exception_on_event"]').click()
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        self.change_main_view('workspace')

        with source_iwidget:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        self.change_main_view('wiring')
        ioperator = self.get_current_wiring_editor_ioperators()[0]
        self.assertEqual(ioperator.error_count, 1)
        self.assertEqual(target_iwidget.error_count, 0)


class WiringRecoveringTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wiring', 'wiring_editor')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_wiring_recovers_from_invalid_views_data(self):

        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps({
            "views": [
                {
                    "label": "default",
                    "iwidgets": {
                        "1": None
                    },
                    "operators": {
                        "0": None
                    },
                    "connections": []
                }
            ],
            "operators": {
                "0": {
                    "name": "Wirecloud/TestOperator/1.0",
                    "id": "0",
                    "preferences": {}
                }
            },
            "connections": [
                {
                    "source": {
                        "type": "iwidget",
                        "id": 1,
                        "endpoint": "outputendpoint"
                    },
                    "target": {
                        "type": "iwidget",
                        "id": 2,
                        "endpoint": "inputendpoint"
                    }
                },
                {
                    "source": {
                        "type": "iwidget",
                        "id": 2,
                        "endpoint": "outputendpoint"
                    },
                    "target": {
                        "type": "ioperator",
                        "id": 0,
                        "endpoint": "input"
                    }
                },
                {
                    "source": {
                        "type": "ioperator",
                        "id": 0,
                        "endpoint": "output"
                    },
                    "target": {
                        "type": "iwidget",
                        "id": 1,
                        "endpoint": "inputendpoint"
                    }
                }
            ]
        })
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)
        self.change_main_view('wiring')
        self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']")
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']").click()
        time.sleep(2)
        window_menus = len(self.driver.find_elements_by_css_selector('.window_menu'))
        self.assertEqual(window_menus, 1)

        self.change_main_view('workspace')
        with iwidgets[0]:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        time.sleep(0.2)

        with iwidgets[1]:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_wiring_allows_wiring_status_reset_on_unrecoverable_errors(self):

        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps({
            "views": [],
            "operators": {
                "0": {
                    "name": "Wirecloud/TestOperator/1.0",
                    "id": "0"
                }
            },
            "connections": [
                {
                    "source": {},
                    "target": {
                        "type": "iwidget",
                        "id": 2,
                        "endpoint": "inputendpoint"
                    }
                }
            ]
        })
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)
        self.change_main_view('wiring')
        self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']")
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']").click()
        time.sleep(2)
        self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']")
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']").click()
        time.sleep(2)
        window_menus = len(self.driver.find_elements_by_css_selector('.window_menu'))
        self.assertEqual(window_menus, 1)
        wiring_entities = self.driver.find_elements_by_css_selector('.grid > .ioperator, .grid > .iwidget')
        self.assertEqual(len(wiring_entities), 0)


class WiringGhostTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wiring', 'wiring_editor')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_wiring_show_invisible_widget(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps({
            "views": [
                {
                    "label": "default",
                    "iwidgets": {
                        "1": {
                            "position": {
                                "posX": 84,
                                "posY": 44
                            },
                            "endPointsInOuts": {
                                "sources": ["outputendpoint"],
                                "targets": ["inputendpoint"]
                            },
                            "name": "Wirecloud/Test/1.0",
                        },
                        "2": {
                            "position": {
                                "posX": 84,
                                "posY": 153
                            },
                            "endPointsInOuts": {
                                "sources": ["outputendpoint"],
                                "targets": ["inputendpoint"]
                            },
                            "name": "Wirecloud/Test/1.0",
                        },
                        "3": {
                            "position": {
                                "posX": 200,
                                "posY": 100
                            },
                            "endPointsInOuts": {
                                "sources": ["outputendpoint"],
                                "targets": ["inputendpoint"]
                            },
                            "name": "Wirecloud/Test/1.0",
                        }
                    },
                    "operators": {
                        "0": {
                            "position": {
                                "posX": 84,
                                "posY": 256
                            }
                        }
                    },
                    "connections": []
                }
            ],
            "operators": {
                "0": {
                    "name": "Wirecloud/TestOperator/1.0",
                    "id": "0",
                    "preferences": {}
                }
            },
            "connections": []
        })
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)

        self.change_main_view('wiring')

        # Check ghost widget
        ghostWidget = self.driver.find_elements_by_css_selector('.grid > .iwidget.ghost')
        ghostEndpointsLabelsFirst1 = self.driver.find_elements_by_css_selector('.grid > .iwidget.ghost .labelDiv')[0].text
        ghostEndpointsLabelsFirst2 = self.driver.find_elements_by_css_selector('.grid > .iwidget.ghost .labelDiv')[1].text
        self.assertEqual(len(ghostWidget), 1, "The ghost Widget has not been painted in the first access to Wiring Editor")

        # Reload wiring Editor
        self.change_main_view('workspace')
        self.change_main_view('wiring')

        # Check ghost widget
        ghostWidget = self.driver.find_elements_by_css_selector('.grid > .iwidget.ghost')
        self.assertEqual(len(ghostWidget), 1, "The ghost Widget has not been painted in the second access to Wiring Editor")
        ghostEndpointsLabelsSecond = self.driver.find_elements_by_css_selector('.grid > .iwidget.ghost .labelDiv')
        self.assertEqual(ghostEndpointsLabelsFirst1, ghostEndpointsLabelsSecond[0].text, "The ghost Widget has change the endpoints label in the second access to Wiring Editor")
        self.assertEqual(ghostEndpointsLabelsFirst2, ghostEndpointsLabelsSecond[1].text, "The ghost Widget has change the endpoints label in the second access to Wiring Editor")

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_wiring_show_invisible_widget_with_connections(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps({
            "views": [
                {
                    "label": "default",
                    "iwidgets": {
                        "1": {
                            "position": {
                                "posX": 84,
                                "posY": 44
                            },
                            "endPointsInOuts": {
                                "sources": ["outputendpoint"],
                                "targets": ["inputendpoint"]
                            },
                            "name": "Wirecloud/Test/1.0",
                        },
                        "2": {
                            "position": {
                                "posX": 84,
                                "posY": 153
                            },
                            "endPointsInOuts": {
                                "sources": ["outputendpoint"],
                                "targets": ["inputendpoint"]
                            },
                            "name": "Wirecloud/Test/1.0",
                        },
                        "3": {
                            "position": {
                                "posX": 200,
                                "posY": 100
                            },
                            "endPointsInOuts": {
                                "sources": ["outputendpoint"],
                                "targets": ["inputendpoint"]
                            },
                            "name": "Wirecloud/Test/1.0",
                        }
                    },
                    "operators": {
                        "0": {
                            "position": {
                                "posX": 84,
                                "posY": 256
                            }
                        }
                    },
                    "connections": []
                }
            ],
            "operators": {
                "0": {
                    "name": "Wirecloud/TestOperator/1.0",
                    "id": "0",
                    "preferences": {
                    }
                }
            },
            "connections": [
                {
                    "source": {
                        "type": "iwidget",
                        "id": 1,
                        "endpoint": "outputendpoint"
                    },
                    "target": {
                        "type": "iwidget",
                        "id": 2,
                        "endpoint": "inputendpoint"
                    }
                },
                {
                    "source": {
                        "type": "iwidget",
                        "id": 2,
                        "endpoint": "outputendpoint"
                    },
                    "target": {
                        "type": "ioperator",
                        "id": 0,
                        "endpoint": "input"
                    }
                },
                {
                    "source": {
                        "type": "ioperator",
                        "id": 0,
                        "endpoint": "output"
                    },
                    "target": {
                        "type": "iwidget",
                        "id": 1,
                        "endpoint": "inputendpoint"
                    }
                },
                {
                    "source": {
                        "type": "ioperator",
                        "id": 0,
                        "endpoint": "output"
                    },
                    "target": {
                        "type": "iwidget",
                        "id": 3,
                        "endpoint": "inputendpoint"
                    }
                },
                {
                    "source": {
                        "type": "iwidget",
                        "id": 1,
                        "endpoint": "outputendpoint"
                    },
                    "target": {
                        "type": "iwidget",
                        "id": 3,
                        "endpoint": "inputendpoint"
                    }
                }
            ]
        })
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)

        self.assertTrue('error' in self.driver.find_element_by_css_selector("#wirecloud_header .menu .wiring").get_attribute('class'))
        self.change_main_view('wiring')

        ghostWidget = self.driver.find_elements_by_css_selector('.grid > .iwidget.ghost')
        self.assertEqual(len(ghostWidget), 1)
        # 5 connections
        connections = self.driver.find_elements_by_css_selector('.arrow')
        self.assertEqual(len(connections), 5, "Fail in ghost Widget connections")

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_wiring_show_invisible_operator(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps({
            "views": [
                {
                    "label": "default",
                    "iwidgets": {
                        "1": {
                            "position": {
                                "posX": 84,
                                "posY": 44
                            },
                            "endPointsInOuts": {
                                "sources": ["outputendpoint"],
                                "targets": ["inputendpoint"]
                            },
                            "name": "Wirecloud/Test/1.0",
                        },
                        "2": {
                            "position": {
                                "posX": 84,
                                "posY": 153
                            },
                            "endPointsInOuts": {
                                "sources": ["outputendpoint"],
                                "targets": ["inputendpoint"]
                            },
                            "name": "Wirecloud/Test/1.0",
                        }
                    },
                    "operators": {
                        "0": {
                            "position": {
                                "posX": 84,
                                "posY": 256
                            }
                        },
                        "1": {
                            "position": {
                                "posX": 84,
                                "posY": 400
                            },
                            "endPointsInOuts": {
                                "sources": ["in"],
                                "targets": ["out"]
                            }
                        }
                    },
                    "connections": []
                }
            ],
            "operators": {
                "0": {
                    "name": "Wirecloud/TestOperator/1.0",
                    "id": "0",
                    "preferences": {}
                },
                "1": {
                    "name": "Wirecloud/TestOperatorDePalo/1.0",
                    "id": "1",
                    "preferences": {}
                }
            },
            "connections": []
        })
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)
        self.change_main_view('wiring')
        ghostWidget = self.driver.find_elements_by_css_selector('.grid > .ioperator.ghost')
        ghostEndpointsLabelsFirst1 = self.driver.find_elements_by_css_selector('.grid > .ioperator.ghost .labelDiv')[0].text
        ghostEndpointsLabelsFirst2 = self.driver.find_elements_by_css_selector('.grid > .ioperator.ghost .labelDiv')[1].text
        # Ghost
        self.assertEqual(len(ghostWidget), 1, "The ghost Operator has not been painted in the first access to Wiring Editor")
        self.change_main_view('workspace')
        self.change_main_view('wiring')
        ghostOperator = self.driver.find_elements_by_css_selector('.grid > .ioperator.ghost')
        self.assertEqual(len(ghostOperator), 1, "The ghost Operator has not been painted in the second access to Wiring Editor")
        ghostEndpointsLabelsSecond = self.driver.find_elements_by_css_selector('.grid > .ioperator.ghost .labelDiv')
        # compare labels
        self.assertEqual(ghostEndpointsLabelsFirst1, ghostEndpointsLabelsSecond[0].text, "The ghost Operator has change the endpoints label in the second access to Wiring Editor")
        self.assertEqual(ghostEndpointsLabelsFirst2, ghostEndpointsLabelsSecond[1].text, "The ghost Operator has change the endpoints label in the second access to Wiring Editor")

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_wiring_show_invisible_operator_with_connections(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps({
            "views": [
                {
                    "label": "default",
                    "iwidgets": {
                        "1": {
                            "position": {
                                "posX": 84,
                                "posY": 44
                            },
                            "endPointsInOuts": {
                                "sources": ["outputendpoint"],
                                "targets": ["inputendpoint"]
                            },
                            "name": "Wirecloud/Test/1.0",
                        },
                        "2": {
                            "position": {
                                "posX": 84,
                                "posY": 153
                            },
                            "endPointsInOuts": {
                                "sources": ["outputendpoint"],
                                "targets": ["inputendpoint"]
                            },
                            "name": "Wirecloud/Test/1.0",
                        }
                    },
                    "operators": {
                        "0": {
                            "position": {
                                "posX": 84,
                                "posY": 256
                            }
                        },
                        "1": {
                            "position": {
                                "posX": 84,
                                "posY": 400
                            },
                            "endPointsInOuts": {
                                "sources": ["in"],
                                "targets": ["out"]
                            }
                        }
                    },
                    "connections": []
                }
            ],
            "operators": {
                "0": {
                    "name": "Wirecloud/TestOperator/1.0",
                    "id": "0",
                    "preferences": {}
                },
                "1": {
                    "name": "Wirecloud/TestOperatorDePalo/1.0",
                    "id": "1",
                    "preferences": {}
                }
            },
            "connections": [
                {
                    "source": {
                        "type": "iwidget",
                        "id": 1,
                        "endpoint": "outputendpoint"
                    },
                    "target": {
                        "type": "iwidget",
                        "id": 2,
                        "endpoint": "inputendpoint"
                    }
                },
                {
                    "source": {
                        "type": "iwidget",
                        "id": 2,
                        "endpoint": "outputendpoint"
                    },
                    "target": {
                        "type": "ioperator",
                        "id": 0,
                        "endpoint": "input"
                    }
                },
                {
                    "source": {
                        "type": "ioperator",
                        "id": 1,
                        "endpoint": "out"
                    },
                    "target": {
                        "type": "iwidget",
                        "id": 1,
                        "endpoint": "inputendpoint"
                    }
                },
                {
                    "source": {
                        "type": "ioperator",
                        "id": 0,
                        "endpoint": "output"
                    },
                    "target": {
                        "type": "ioperator",
                        "id": 1,
                        "endpoint": "in"
                    }
                },
                {
                    "source": {
                        "type": "iwidget",
                        "id": 1,
                        "endpoint": "outputendpoint"
                    },
                    "target": {
                        "type": "ioperator",
                        "id": 1,
                        "endpoint": "in"
                    }
                }
            ]
        })
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)

        self.assertTrue('error' in self.driver.find_element_by_css_selector("#wirecloud_header .menu .wiring").get_attribute('class'))
        self.change_main_view('wiring')

        ghostOperator = self.driver.find_elements_by_css_selector('.grid > .ioperator.ghost')
        self.assertEqual(len(ghostOperator), 1)
        # 5 connections
        connections = self.driver.find_elements_by_css_selector('.arrow')
        self.assertEqual(len(connections), 5, "Fail in ghost Operator connections")

    def test_read_only_connections_cannot_be_deleted_in_WiringEditor(self):

        workspace = Workspace.objects.get(id=2)
        parsedStatus = json.loads(workspace.wiringStatus)

        parsedStatus['views'] = [
            {
                "label": "default",
                "iwidgets": {
                    "1": {
                        "position": {
                            "posX": 84,
                            "posY": 44
                        },
                        "endPointsInOuts": {
                            "sources": ["outputendpoint"],
                            "targets": ["inputendpoint"]
                        },
                        "name": "Wirecloud/Test/1.0",
                    },
                    "2": {
                        "position": {
                            "posX": 350,
                            "posY": 64
                        },
                        "endPointsInOuts": {
                            "sources": ["outputendpoint"],
                            "targets": ["inputendpoint"]
                        },
                        "name": "Wirecloud/Test/1.0",
                    }
                },
                "operators": {
                    "0": {
                        "position": {
                            "posX": 84,
                            "posY": 256
                        },
                        "minimized": False
                    },
                },
                "connections": []
            }
        ]
        parsedStatus['connections'] = [
            {
                "readOnly": True,
                "source":{
                    "type":"iwidget",
                    "id":1,
                    "endpoint":"outputendpoint"
                },
                "target":{
                    "type":"iwidget",
                    "id":2,
                    "endpoint":"inputendpoint"
                }
            },
            {
                "readOnly": False,
                "source":{
                    "type":"iwidget",
                    "id":1,
                    "endpoint":"outputendpoint"
                },
                "target":{
                    "type":"ioperator",
                    "id":0,
                    "endpoint":"input"
                }
            }
        ]
        workspace.wiringStatus = json.dumps(parsedStatus)
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)
        self.change_main_view('wiring')
        arrows = self.driver.find_elements_by_css_selector('.arrow')
        self.assertEqual(len(arrows), 2)
        # The find_element_by_css_selector is needed to work around a bug in the firefox driver
        arrows[0].find_element_by_css_selector('g').click()
        self.wait_element_visible_by_css_selector('.closer', element=arrows[0]).click()
        arrows = self.driver.find_elements_by_css_selector('.arrow')
        self.assertEqual(len(arrows), 2)

    def test_widget_and_operator_with_read_only_connections_cannot_be_deleted_in_WiringEditor(self):

        workspace = Workspace.objects.get(id=2)
        parsedStatus = json.loads(workspace.wiringStatus)
        parsedStatus['views'] = [
            {
                "label": "default",
                "iwidgets": {
                    "1": {
                        "position": {
                            "posX": 84,
                            "posY": 44
                        },
                        "endPointsInOuts": {
                            "sources": ["outputendpoint"],
                            "targets": ["inputendpoint"]
                        },
                        "name": "Wirecloud/Test/1.0",
                    },
                    "2": {
                        "position": {
                            "posX": 350,
                            "posY": 64
                        },
                        "endPointsInOuts": {
                            "sources": ["outputendpoint"],
                            "targets": ["inputendpoint"]
                        },
                        "name": "Wirecloud/Test/1.0",
                    }
                },
                "operators": {
                    "0": {
                        "position": {
                            "posX": 84,
                            "posY": 256
                        },
                        "minimized": False
                    }
                },
                "connections": []
            }
        ]
        parsedStatus['connections'] = [
            {
                "readOnly": False,
                "source": {
                    "type": "iwidget",
                    "id": 1,
                    "endpoint": "outputendpoint"
                },
                "target": {
                    "type": "iwidget",
                    "id": 2,
                    "endpoint": "inputendpoint"
                }
            },
            {
                "readOnly": True,
                "source": {
                    "type": "iwidget",
                    "id": 1,
                    "endpoint": "outputendpoint"
                },
                "target":{
                    "type": "ioperator",
                    "id": 0,
                    "endpoint": "input"
                }
            }
        ]
        workspace.wiringStatus = json.dumps(parsedStatus)
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)
        self.change_main_view('wiring')
        widget = self.driver.find_elements_by_css_selector('.grid > .iwidget')[0]
        operator = self.driver.find_elements_by_css_selector('.grid > .ioperator')[0]
        widget.click()
        widget.find_element_by_css_selector('.closebutton').click()
        operator.click()
        self.wait_element_visible_by_css_selector('.closebutton', element=operator).click()
        widgets = self.driver.find_elements_by_css_selector('.grid > .iwidget')
        operators = self.driver.find_elements_by_css_selector('.grid > .ioperator')
        self.assertEqual(len(widgets), 2)
        self.assertEqual(len(operators), 1)


class EndpointOrderTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wiring', 'wiring_editor')

    @classmethod
    def setUpClass(cls):

        super(EndpointOrderTestCase, cls).setUpClass()

        if not selenium_supports_draganddrop(cls.driver):
            cls.tearDownClass()
            raise unittest.SkipTest('Endpoint reordering tests need make use of the native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

    @uses_extra_resources(('Wirecloud_TestMultiendpoint_1.0.wgt',), shared=True)
    def test_wiring_widget_reorder_endpoints(self):

        self.login()

        iwidget = self.add_widget_to_mashup('Test_Multiendpoint', new_name='Test (1)')
        self.change_main_view('wiring')

        grid = self.driver.find_element_by_xpath("//*[contains(@class, 'container center_container grid')]")
        miniwidget = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (1)']")

        ActionChains(self.driver).click_and_hold(miniwidget).move_to_element(grid).move_by_offset(10, 10).release().perform()

        widget = self.wait_element_visible_by_css_selector('.grid > .iwidget')
        widget.find_element_by_css_selector('.editPos_button').click()
        self.popup_menu_click('Reorder endpoints')

        output1 = iwidget.get_wiring_endpoint('output1')
        self.assertEqual(output1.pos, 0)
        self.assertEqual(iwidget.get_wiring_endpoint('output2').pos, 1)

        input3 = iwidget.get_wiring_endpoint('input3')
        self.assertEqual(input3.pos, 2)
        self.assertEqual(iwidget.get_wiring_endpoint('output1').pos, 0)

        ActionChains(self.driver).click_and_hold(output1.label).move_by_offset(0, 50).move_by_offset(0, 50).release().perform()
        ActionChains(self.driver).click_and_hold(input3.label).move_by_offset(0, -50).move_by_offset(0, -50).release().perform()
        time.sleep(0.2)

        self.assertEqual(output1.pos, 2)
        self.assertEqual(input3.pos, 0)

        # Reload the wiring view
        self.change_main_view('workspace')
        time.sleep(0.3) # We need to wait for the wiring status been saved
        self.change_main_view('wiring')
        time.sleep(2)

        self.assertEqual(iwidget.get_wiring_endpoint('output1').pos, 2)
        self.assertEqual(iwidget.get_wiring_endpoint('output2').pos, 0)
        self.assertEqual(iwidget.get_wiring_endpoint('input3').pos, 0)
        self.assertEqual(iwidget.get_wiring_endpoint('input1').pos, 1)

    @uses_extra_resources(('Wirecloud_TestOperatorMultiendpoint_1.0.wgt',), shared=True)
    def test_wiring_operator_reorder_endpoints(self):

        self.login()

        self.change_main_view('wiring')

        grid = self.driver.find_element_by_xpath("//*[contains(@class, 'container center_container grid')]")

        self.driver.find_element_by_xpath("//*[text()='Operators']").click()
        time.sleep(0.2)
        minioperator = self.driver.find_element_by_xpath("//*[contains(@class, 'container ioperator')]//*[text()='TestOp. Multiendpoint']")

        ActionChains(self.driver).click_and_hold(minioperator).move_to_element(grid).move_by_offset(10, 10).release().perform()
        self.wait_element_visible_by_css_selector('.grid > .ioperator')

        ioperator = self.get_current_wiring_editor_ioperators()[0]
        output1 = ioperator.get_wiring_endpoint('output1')
        self.assertEqual(output1.pos, 0)
        self.assertEqual(ioperator.get_wiring_endpoint('output3').pos, 2)
        input3 = ioperator.get_wiring_endpoint('input3')
        self.assertEqual(input3.pos, 2)
        self.assertEqual(ioperator.get_wiring_endpoint('input1').pos, 0)

        ioperator.element.find_element_by_css_selector('.editPos_button').click()
        self.popup_menu_click('Reorder endpoints')

        ActionChains(self.driver).click_and_hold(output1.label).move_by_offset(0, 50).move_by_offset(0, 50).release().perform()
        ActionChains(self.driver).click_and_hold(input3.label).move_by_offset(0, -50).move_by_offset(0, -50).release().perform()
        time.sleep(0.2)

        self.assertEqual(output1.pos, 2)
        self.assertEqual(input3.pos, 0)

        # Reload the wiring view
        self.change_main_view('workspace')
        time.sleep(0.3) # We need to wait for the wiring status been saved
        self.change_main_view('wiring')

        self.assertEqual(ioperator.get_wiring_endpoint('output1').pos, 2)
        self.assertEqual(ioperator.get_wiring_endpoint('output2').pos, 0)
        self.assertEqual(ioperator.get_wiring_endpoint('input3').pos, 0)
        self.assertEqual(ioperator.get_wiring_endpoint('input1').pos, 1)


class MulticonnectorTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wiring', 'wiring_editor')

    @classmethod
    def setUpClass(cls):

        super(MulticonnectorTestCase, cls).setUpClass()

        if not selenium_supports_draganddrop(cls.driver):
            cls.tearDownClass()
            raise unittest.SkipTest('Multiconnector tests need make use of the native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

    def test_wiring_basic_multiconnector_visualization(self):

        self.login()

        iwidget = self.add_widget_to_mashup('Test', new_name='Test (1)')

        self.change_main_view('wiring')
        grid = self.driver.find_element_by_xpath("//*[contains(@class, 'container center_container grid')]")

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (1)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(10, 10).release().perform()

        source = iwidget.get_wiring_endpoint('outputendpoint')
        target = iwidget.get_wiring_endpoint('inputendpoint')

        source.perform_action('Add multiconnector')

        sourcesmulti = self.driver.find_elements_by_css_selector('.source.multiconnector.anchor')
        self.assertEqual(len(sourcesmulti), 1)

        target.perform_action('Add multiconnector')

        targetsmulti = self.driver.find_elements_by_css_selector('.target.multiconnector.anchor')
        self.assertEqual(len(targetsmulti), 1)

        self.change_main_view('workspace')
        time.sleep(0.3) # We need to wait for the wiring status been saved
        self.change_main_view('wiring')
        time.sleep(2)

        sourcesmulti = self.driver.find_elements_by_css_selector('.source.multiconnector.anchor')
        self.assertEqual(len(sourcesmulti), 1)
        targetsmulti = self.driver.find_elements_by_css_selector('.target.multiconnector.anchor')
        self.assertEqual(len(targetsmulti), 1)

    def test_wiring_source_multiconnector_connection(self):

        self.login()

        self.add_widget_to_mashup('Test', new_name='Test (1)')
        self.add_widget_to_mashup('Test', new_name='Test (2)')
        self.add_widget_to_mashup('Test', new_name='Test (3)')

        iwidgets = self.get_current_iwidgets()

        self.change_main_view('wiring')
        grid = self.driver.find_element_by_xpath("//*[contains(@class, 'container center_container grid')]")

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (1)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(-220, -50).release().perform()

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (2)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(90, -120).release().perform()

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (3)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(90, 40).release().perform()

        source = iwidgets[0].get_wiring_endpoint('outputendpoint')
        target1 = iwidgets[1].get_wiring_endpoint('inputendpoint')
        target2 = iwidgets[2].get_wiring_endpoint('inputendpoint')

        source.perform_action('Add multiconnector')
        multi = self.driver.find_element_by_css_selector('.anchor.multiconnector.anchor')

        ActionChains(self.driver).drag_and_drop(target1.element, multi).perform()
        ActionChains(self.driver).drag_and_drop(target2.element, multi).perform()

        self.change_main_view('workspace')

        with iwidgets[0]:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'first hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        time.sleep(0.2)

        with iwidgets[1]:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'first hello world!!')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'first hello world!!')

        with iwidgets[2]:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'first hello world!!')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'first hello world!!')

    def test_wiring_target_multiconnector_connection(self):
        self.login()

        self.add_widget_to_mashup('Test', new_name='Test (1)')
        self.add_widget_to_mashup('Test', new_name='Test (2)')
        self.add_widget_to_mashup('Test', new_name='Test (3)')

        iwidgets = self.get_current_iwidgets()
        self.change_main_view('wiring')
        grid = self.driver.find_element_by_xpath("//*[contains(@class, 'container center_container grid')]")

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (1)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(90, -50).release().perform()

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (2)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(-220, -120).release().perform()

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (3)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(-220, 40).release().perform()

        target = iwidgets[0].get_wiring_endpoint('inputendpoint')
        source1 = iwidgets[1].get_wiring_endpoint('outputendpoint')
        source2 = iwidgets[2].get_wiring_endpoint('outputendpoint')

        target.perform_action('Add multiconnector')
        multi = self.driver.find_element_by_css_selector('.anchor.multiconnector.anchor')

        ActionChains(self.driver).drag_and_drop(source1.element, multi).perform()
        ActionChains(self.driver).drag_and_drop(source2.element, multi).perform()

        self.change_main_view('workspace')

        with iwidgets[1]:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'first hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        time.sleep(0.2)

        with iwidgets[0]:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'first hello world!!')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'first hello world!!')

        with iwidgets[2]:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'second hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        time.sleep(0.2)

        with iwidgets[0]:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'second hello world!!')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'second hello world!!')


class StickyEffectTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wiring', 'wiring_editor')

    @classmethod
    def setUpClass(cls):

        super(StickyEffectTestCase, cls).setUpClass()

        if not selenium_supports_draganddrop(cls.driver):
            cls.tearDownClass()
            raise unittest.SkipTest('Sticky effect tests need make use of the native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

    def test_wiring_stycky_effect_in_endpoint_label(self):
        self.login()

        self.add_widget_to_mashup('Test', new_name='Test (1)')
        iwidgets = self.get_current_iwidgets()
        self.change_main_view('wiring')
        grid = self.driver.find_element_by_xpath("//*[contains(@class, 'container center_container grid')]")

        widget = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (1)']")
        ActionChains(self.driver).click_and_hold(widget).move_to_element(grid).move_by_offset(90, -50).release().perform()

        wiring_base_element = self.driver.find_element_by_css_selector('.wiring_editor')
        menubar = wiring_base_element.find_element_by_css_selector('.menubar')
        menubar.find_element_by_xpath("//*[contains(@class, 'styled_expander')]//*[contains(@class, 'title') and text()='Operators']").click()

        operator = self.driver.find_element_by_xpath("//*[contains(@class, 'container ioperator')]//*[text()='TestOperator']")
        ActionChains(self.driver).click_and_hold(operator).move_to_element(grid).move_by_offset(-220, -120).release().perform()

        ioperator = self.get_current_wiring_editor_ioperators()[0]

        widgetInput = iwidgets[0].get_wiring_endpoint('inputendpoint')
        widgetOutput = iwidgets[0].get_wiring_endpoint('outputendpoint')
        operatorInput = ioperator.get_wiring_endpoint('input')
        operatorOutput = ioperator.get_wiring_endpoint('output')

        # Try to connect using stycky effect in label endpoints
        ActionChains(self.driver).drag_and_drop(widgetOutput.element, operatorInput.label).perform()
        ActionChains(self.driver).drag_and_drop(operatorOutput.element, widgetInput.label).perform()

        self.change_main_view('workspace')

        with iwidgets[0]:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()
            WebDriverWait(self.driver, timeout=2).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')


class SimpleRecommendationsTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wiring', 'wiring_editor')

    @classmethod
    def setUpClass(cls):

        super(SimpleRecommendationsTestCase, cls).setUpClass()

        if not selenium_supports_draganddrop(cls.driver):
            cls.tearDownClass()
            raise unittest.SkipTest('Simple recommendation tests need make use of the native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

    def test_wiring_recommendations_basic_mouseon(self):
        self.login()

        self.add_widget_to_mashup('Test', new_name='Test (1)')
        self.add_widget_to_mashup('Test', new_name='Test (2)')
        self.add_widget_to_mashup('Test', new_name='Test (3)')

        iwidgets = self.get_current_iwidgets()
        self.change_main_view('wiring')
        grid = self.driver.find_element_by_xpath("//*[contains(@class, 'container center_container grid')]")

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (1)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(90, -50).release().perform()

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (2)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(-220, -120).release().perform()

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (3)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(-220, 40).release().perform()

        target = iwidgets[0].get_wiring_endpoint('inputendpoint')
        source1 = iwidgets[1].get_wiring_endpoint('outputendpoint')
        source2 = iwidgets[2].get_wiring_endpoint('outputendpoint')
        source2b = iwidgets[2].get_wiring_endpoint('inputendpoint')

        # Activate Recommendations mouseon anchors
        ActionChains(self.driver).move_to_element(source1.element).perform();
        time.sleep(2)
        self.assertTrue('highlight' in target.label.get_attribute('class'))
        self.assertTrue('highlight' in source1.label.get_attribute('class'))
        self.assertTrue('highlight' in source2b.label.get_attribute('class'))
        self.assertFalse('highlight' in source2.label.get_attribute('class'))

        # Activate Invert Recommendations mouseon anchors
        ActionChains(self.driver).move_to_element(target.element).perform();
        time.sleep(2)
        self.assertTrue('highlight' in target.label.get_attribute('class'))
        self.assertTrue('highlight' in source1.label.get_attribute('class'))
        self.assertTrue('highlight' in source2.label.get_attribute('class'))
        self.assertFalse('highlight' in source2b.label.get_attribute('class'))

        # Activate Recommendations mouseon labels
        ActionChains(self.driver).move_to_element(source1.label).perform();
        time.sleep(2)
        self.assertTrue('highlight' in target.label.get_attribute('class'))
        self.assertTrue('highlight' in source1.label.get_attribute('class'))
        self.assertTrue('highlight' in source2b.label.get_attribute('class'))
        self.assertFalse('highlight' in source2.label.get_attribute('class'))

        # Activate Invert Recommendations mouseon labels
        ActionChains(self.driver).move_to_element(target.label).perform();
        time.sleep(2)
        self.assertTrue('highlight' in target.label.get_attribute('class'))
        self.assertTrue('highlight' in source1.label.get_attribute('class'))
        self.assertTrue('highlight' in source2.label.get_attribute('class'))
        self.assertFalse('highlight' in source2b.label.get_attribute('class'))


    def test_wiring_recommendations_creating_arrows(self):
        self.login()

        self.add_widget_to_mashup('Test', new_name='Test (1)')
        self.add_widget_to_mashup('Test', new_name='Test (2)')
        self.add_widget_to_mashup('Test', new_name='Test (3)')

        iwidgets = self.get_current_iwidgets()
        self.change_main_view('wiring')
        grid = self.driver.find_element_by_xpath("//*[contains(@class, 'container center_container grid')]")

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (1)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(90, -50).release().perform()

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (2)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(-220, -120).release().perform()

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (3)']")
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(-220, 40).release().perform()

        target = iwidgets[0].get_wiring_endpoint('inputendpoint')
        source1 = iwidgets[1].get_wiring_endpoint('outputendpoint')
        source2 = iwidgets[2].get_wiring_endpoint('outputendpoint')
        source2b = iwidgets[2].get_wiring_endpoint('inputendpoint')

        # Activate Recommendations while arrow is being created
        ActionChains(self.driver).click_and_hold(source1.element).move_by_offset(80, 80).perform()
        self.assertTrue('highlight' in target.label.get_attribute('class'))
        self.assertTrue('highlight' in source1.label.get_attribute('class'))
        self.assertTrue('highlight' in source2b.label.get_attribute('class'))
        self.assertFalse('highlight' in source2.label.get_attribute('class'))
        ActionChains(self.driver).release().perform()

        # Activate Invert Recommendations while arrow is being created
        ActionChains(self.driver).click_and_hold(target.element).move_by_offset(80, 80).perform()
        self.assertTrue('highlight' in target.label.get_attribute('class'))
        self.assertTrue('highlight' in source1.label.get_attribute('class'))
        self.assertTrue('highlight' in source2.label.get_attribute('class'))
        self.assertFalse('highlight' in source2b.label.get_attribute('class'))
