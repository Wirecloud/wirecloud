# -*- coding: utf-8 -*-

# Copyright (c) 2011-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

import codecs
import json
import os
import re
import time

from django.conf import settings
from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from django.db import transaction
from django.test import Client
from django.utils import unittest
import selenium
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait

from wirecloud.commons.utils.expected_conditions import element_be_still
from wirecloud.commons.utils.testcases import uses_extra_resources, WirecloudTestCase, WirecloudSeleniumTestCase
from wirecloud.platform import plugins
from wirecloud.platform.workspace.models import Workspace
from wirecloud.platform.workspace.utils import set_variable_value


# Avoid nose to repeat these tests (they are run through wirecloud/tests.py)
__test__ = False

SELENIUM_VERSION = tuple(selenium.__version__.split('.'))


def selenium_supports_draganddrop(driver):
    return driver.capabilities['browserName'] != 'firefox' or SELENIUM_VERSION >= (2, 37, 2) or driver.profile.native_events_enabled


class WiringTestCase(WirecloudTestCase):

    fixtures = ('test_data',)
    tags = ('wirecloud-wiring',)

    def setUp(self):

        super(WiringTestCase, self).setUp()

        self.user = User.objects.get(username='test')
        self.empty_wiring = {
            'operators': [],
            'connections': [],
        }

        self.workspace_id = 1
        Workspace.objects.filter(id=self.workspace_id).update(wiringStatus=json.dumps(self.empty_wiring, ensure_ascii=False))
        transaction.commit()

        self.wiring_url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': self.workspace_id})

    def test_save_basic_wiring_connection(self):
        client = Client()
        client.login(username='test', password='test')

        new_wiring = {
            'operators': [],
            'connections': [
                {
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'name': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 1,
                        'name': 'slot',
                    },
                },
            ],
        }
        response = client.put(self.wiring_url, json.dumps(new_wiring), content_type='application/json')

        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace_wiring = json.loads(workspace.wiringStatus)
        self.assertEqual(workspace_wiring, new_wiring)

    def test_basic_wiring_operations_with_read_only_connections(self):
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = json.dumps({
            'operators': [],
            'connections': [
                {
                    'readonly': True,
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'name': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 1,
                        'name': 'slot',
                    },
                },
            ],
        })
        workspace.save()

        client = Client()
        client.login(username='test', password='test')

        new_wiring = {
            'operators': [],
            'connections': [
                {
                    'readonly': True,
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'name': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 1,
                        'name': 'slot',
                    },
                },
                {
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'name': 'event',
                    },
                    'target': {
                        'type': 'iwidget',
                        'id': 2,
                        'name': 'slot',
                    },
                },
            ],
        }
        response = client.put(self.wiring_url, json.dumps(new_wiring, ensure_ascii=False), content_type='application/json')

        self.assertEqual(response.status_code, 204)
        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace_wiring = json.loads(workspace.wiringStatus)
        self.assertEqual(workspace_wiring, new_wiring)

    def test_read_only_connections_cannot_be_deleted(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = json.dumps({
            'operators': [],
            'connections': [
                {
                    'readonly': True,
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'name': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 1,
                        'name': 'slot',
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

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = json.dumps({
            'operators': [],
            'connections': [
                {
                    'readonly': True,
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'name': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 1,
                        'name': 'slot',
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
                        'type': 'widget',
                        'id': 1,
                        'name': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 2,
                        'name': 'slot',
                    },
                },
            ],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_iwidget_removed(self):

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = json.dumps({
            'operators': [],
            'connections': [
                {
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'name': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 2,
                        'name': 'slot',
                    },
                },
            ],
        })
        workspace.save()

        client = Client()
        client.login(username='test', password='test')
        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': self.workspace_id, 'tab_id': 1, 'iwidget_id': 1})
        client.delete(url)

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace_wiring = json.loads(workspace.wiringStatus)
        self.assertEqual(workspace_wiring, self.empty_wiring)


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
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    def test_operator_available_after_being_installed(self):
        self.login()

        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_TestOperatorSelenium_1.0.zip', 'TestOperatorSelenium', shared=True)

        with self.wiring_view as wiring:
            collection = wiring.from_sidebar_get_all_components('operator')
            self.assertEqual(len(collection), 2)

            operator = wiring.from_sidebar_find_component_by_name('operator', 'TestOperatorSelenium', all_steps=True)
            self.assertIsNotNone(operator)
            wiring.add_component('operator', operator)

            collection = wiring.from_diagram_get_all_components('operator')
            self.assertEqual(len(collection), 1)

    def test_operator_not_available_after_being_uninstalled(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        with self.myresources_view as myresources:
            myresources.uninstall_resource('TestOperator')

        with self.wiring_view as wiring:
            collection = wiring.from_sidebar_get_all_components('operator')
            self.assertEqual(len(collection), 0)

            operator = wiring.from_sidebar_find_component_by_name('operator', 'TestOperator', all_steps=True)
            self.assertIsNone(operator)

            collection = wiring.from_diagram_get_all_components('operator')
            self.assertEqual(len(collection), 1)

            operator = wiring.from_diagram_find_component_by_name('operator', 'TestOperator')
            self.assertIsNotNone(operator)
            self.assertTrue(operator.is_missing)

    def check_operator_reinstall_behaviour(self, reload):
        workspace = Workspace.objects.get(id=3)
        parsedStatus = json.loads(workspace.wiringStatus)
        parsedStatus['operators']['0']['preferences'] = {
            'prefix': { "readOnly": False, "hidden": False, "value": 'test_' },
            'exception_on_event': { "readOnly": False, "hidden": False, "value": 'true' },
            'test_logging': { "readOnly": False, "hidden": False, "value": 'true' }
        }
        workspace.wiringStatus = json.dumps(parsedStatus, ensure_ascii=False)
        workspace.save()

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        with self.wiring_view as wiring:
            operator = wiring.from_diagram_find_component_by_name('operator', 'TestOperator')
            operator.open_menu().click_entry('Settings')

            self.driver.find_element_by_css_selector('.window_menu [name="exception_on_event"]').click()  # disable exception_on_event
            self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        with self.myresources_view as myresources:
            myresources.uninstall_resource('TestOperator')

        if reload is True:
            self.driver.refresh()

        # Reinstall the operator
        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_TestOperator_1.0.zip', 'TestOperator', shared=True)

        # Check the operator leaves ghost mode
        error_badge = self.driver.find_element_by_css_selector(".wirecloud_toolbar .icon-puzzle-piece + .badge")
        self.assertFalse(error_badge.is_displayed())

        # Check operator connections are restored sucessfully
        tab = self.get_workspace_tab_by_name('Tab 2')
        tab.element.click()
        (target_iwidget, source_iwidget) = self.get_current_iwidgets()
        with source_iwidget:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        with target_iwidget:
            WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_id('wiringOut').text != 'hello world!!')

        # Check preference values has been restored to the values used before uninstalling the widget and not to the default ones
        with self.wiring_view as wiring:
            operator = wiring.from_diagram_find_component_by_name('operator', 'TestOperator')
            self.assertFalse(operator.is_missing)

            operator.open_menu().click_entry('Settings')

            self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="prefix"]').get_attribute('value'), 'test_')
            self.assertFalse(self.driver.find_element_by_css_selector('.window_menu [name="exception_on_event"]').is_selected())
            self.assertTrue(self.driver.find_element_by_css_selector('.window_menu [name="test_logging"]').is_selected())

            self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

    def test_operators_in_use_reinstall_behaviour(self):
        self.check_operator_reinstall_behaviour(False)

    def test_operators_in_use_reinstall_behaviour_reload(self):
        self.check_operator_reinstall_behaviour(True)

    def test_operators_are_not_usable_after_being_deleted(self):
        self.login()

        with self.myresources_view as myresources:
            myresources.delete_resource('TestOperator')

        with self.wiring_view as wiring:
            collection = wiring.from_sidebar_get_all_components('operator')
            self.assertEqual(len(collection), 0)

            operator = wiring.from_sidebar_find_component_by_name('operator', 'TestOperator', all_steps=True)
            self.assertIsNone(operator)

    def test_basic_wiring_editor_operations(self):

        if not selenium_supports_draganddrop(self.driver):  # pragma: no cover
            raise unittest.SkipTest('This test need make use of the native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

        self.login()

        with self.wallet as wallet:
            wallet.search('Test')
            widget = wallet.search_in_results('Test')
            widget.instantiate()
            widget.instantiate()
            widget.instantiate()

        iwidgets = self.get_current_iwidgets()
        iwidgets[0].rename('Test (1)')
        iwidgets[1].rename('Test (2)')
        iwidgets[2].rename('Test (3)')

        with self.wiring_view as wiring:
            widget = wiring.from_sidebar_find_component_by_name('widget', 'Test (1)', all_steps=True)
            self.assertIsNotNone(widget)
            wiring.add_component('widget', widget)

            widget = wiring.from_sidebar_find_component_by_name('widget', 'Test (2)')
            self.assertIsNotNone(widget)
            wiring.add_component('widget', widget, pos_x=400)

            widget1 = wiring.from_diagram_find_component_by_name('widget', 'Test (1)')
            self.assertIsNotNone(widget1)

            widget2 = wiring.from_diagram_find_component_by_name('widget', 'Test (2)')
            self.assertIsNotNone(widget2)

            source = widget1.get_endpoint_by_name('source', 'Output')
            self.assertIsNotNone(source)

            target = widget2.get_endpoint_by_name('target', 'Input')
            self.assertIsNotNone(target)

            ActionChains(self.driver).drag_and_drop(source.anchor, target.anchor).perform()

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
            except:  # pragma: no cover
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

        with iwidgets[2]:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

        with iwidgets[0]:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

    def test_wiring_editor_modify_arrow_endpoints(self):

        if not selenium_supports_draganddrop(self.driver):  # pragma: no cover
            raise unittest.SkipTest('This test need make use of the native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        iwidgets = self.get_current_iwidgets()

        with self.wiring_view as wiring:
            widget = wiring.from_sidebar_find_component_by_name('widget', 'Test (1)', all_steps=True)
            self.assertIsNotNone(widget)
            wiring.add_component('widget', widget)

            widget = wiring.from_sidebar_find_component_by_name('widget', 'Test (2)')
            self.assertIsNotNone(widget)
            wiring.add_component('widget', widget, pos_x=400)

            widget = wiring.from_sidebar_find_component_by_name('widget', 'Test (3)')
            self.assertIsNotNone(widget)
            wiring.add_component('widget', widget, pos_x=100, pos_y=200)

            widget1 = wiring.from_diagram_find_component_by_name('widget', 'Test (1)')
            self.assertIsNotNone(widget1)

            widget2 = wiring.from_diagram_find_component_by_name('widget', 'Test (2)')
            self.assertIsNotNone(widget2)

            source = widget1.get_endpoint_by_name('source', 'Output')
            self.assertIsNotNone(source)

            target = widget2.get_endpoint_by_name('target', 'Input')
            self.assertIsNotNone(target)

            source.connect(target)

        with iwidgets[0]:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')

        time.sleep(0.2)

        with iwidgets[1]:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            except:  # pragma: no cover
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

        with iwidgets[2]:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

        with iwidgets[0]:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

        with self.wiring_view as wiring:
            widget1 = wiring.from_diagram_find_component_by_name('widget', 'Test (1)')
            self.assertIsNotNone(widget1)

            widget2 = wiring.from_diagram_find_component_by_name('widget', 'Test (2)')
            self.assertIsNotNone(widget2)

            widget3 = wiring.from_diagram_find_component_by_name('widget', 'Test (3)')
            self.assertIsNotNone(widget2)

            source = widget1.get_endpoint_by_name('source', 'Output')
            self.assertIsNotNone(source)

            target1 = widget2.get_endpoint_by_name('target', 'Input')
            self.assertIsNotNone(target1)

            target2 = widget3.get_endpoint_by_name('target', 'Input')
            self.assertIsNotNone(target1)

            connections = wiring.get_all_connections()
            self.assertEqual(len(connections), 1)
            connections[0].select()

            target1.connect(target2, from_existing=True)

            connections = wiring.get_all_connections()
            self.assertEqual(len(connections), 1)

        with iwidgets[0]:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello new world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')

        with iwidgets[2]:

            try:
                WebDriverWait(self.driver, timeout=2).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello new world!!')
            except:  # pragma: no cover
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello new world!!')

        with iwidgets[1]:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

        with iwidgets[0]:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

    def test_widget_preferences_in_wiring_editor(self):

        self.login(username='user_with_workspaces')
        iwidget = self.get_current_iwidgets()[0]

        with iwidget:
            self.assertEqual(self.driver.find_element_by_id('listPref').text, 'default')
            self.assertEqual(self.driver.find_element_by_id('textPref').text, 'initial text')
            self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'false')
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, 'default')

        with self.wiring_view as wiring:

            widget = wiring.from_diagram_find_component_by_name('widget', 'Test 1')
            self.assertIsNotNone(widget)
            widget.open_menu().click_entry('Settings')

            # Change widget settings

            list_input = self.driver.find_element_by_css_selector('.window_menu [name="list"]')
            self.fill_form_input(list_input, '1')  # value1
            text_input = self.driver.find_element_by_css_selector('.window_menu [name="text"]')
            self.fill_form_input(text_input, 'test')
            boolean_input = self.driver.find_element_by_css_selector('.window_menu [name="boolean"]')
            boolean_input.click()
            password_input = self.driver.find_element_by_css_selector('.window_menu [name="password"]')
            self.fill_form_input(password_input, 'password')

            self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        with iwidget:
            self.assertEqual(self.driver.find_element_by_id('listPref').text, '1')
            self.assertEqual(self.driver.find_element_by_id('textPref').text, 'test')
            self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'true')
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, 'password')

    def test_operator_preferences_in_wiring_editor(self):

        self.login(username='user_with_workspaces')
        iwidgets = self.get_current_iwidgets()

        with self.wiring_view as wiring:

            operator = wiring.from_diagram_find_component_by_name('operator', 'TestOperator')
            self.assertIsNotNone(operator)
            operator.open_menu().click_entry('Settings')

            # Change operator settings
            prefix_input = self.driver.find_element_by_css_selector('.window_menu [name="prefix"]')
            self.fill_form_input(prefix_input, 'prefix: ')

            self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        with iwidgets[0]:
            try:
                WebDriverWait(self.driver, timeout=10).until(lambda driver: driver.find_element_by_id('wiringOut').text != '')
            except:  # pragma: no cover
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
            except:  # pragma: no cover
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'prefix: hello world!!')

    def check_input_endpoint_exceptions(self):

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        source_iwidget = iwidgets[0]
        target_iwidget = iwidgets[1]
        self.assertIsNotNone(source_iwidget.element)
        self.assertIsNotNone(target_iwidget.element)

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

        with source_iwidget:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        error_badge = self.driver.find_element_by_css_selector(".wirecloud_toolbar .icon-puzzle-piece + .badge")
        self.assertEqual(error_badge.text, '1')
        self.assertTrue(error_badge.is_displayed())
        with self.wiring_view as wiring:

            operator = wiring.from_diagram_find_component_by_name('operator', 'TestOperator')
            self.assertIsNotNone(operator)

            self.assertEqual(operator.error_count, 1)
            self.assertEqual(target_iwidget.error_count, 0)

            button = operator.opt_notify
            button.click()

            self.wait_element_visible_by_css_selector('.window_menu.logwindowmenu')
            error_list = self.driver.find_elements_by_css_selector(".logwindowmenu .alert-error")
            self.assertEqual(len(error_list), 1)
            self.driver.find_element_by_xpath("//*[text()='Close']").click()

    def test_input_endpoint_exceptions(self):

        # Enable widget exceptions
        set_variable_value(9, 'true')

        # Enable operator exceptions
        workspace = Workspace.objects.get(id=2)
        parsedStatus = json.loads(workspace.wiringStatus)
        parsedStatus['operators']['0']['preferences']['exception_on_event'] = { "readOnly": False, "hidden": False, "value": 'true' }
        workspace.wiringStatus = json.dumps(parsedStatus, ensure_ascii=False)
        workspace.save()

        # Check exceptions
        self.check_input_endpoint_exceptions()

    def test_input_endpoint_no_handler_exceptions(self):

        # Update wiring connections to use the not handled input endpoints
        workspace = Workspace.objects.get(id=2)
        parsedStatus = json.loads(workspace.wiringStatus)
        parsedStatus['connections'][0]['target']['name'] = 'nothandled'
        parsedStatus['connections'][1]['target']['name'] = 'nothandled'
        workspace.wiringStatus = json.dumps(parsedStatus, ensure_ascii=False)
        workspace.save()

        self.check_input_endpoint_exceptions()

    def test_operator_logging_support(self):

        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            operator = wiring.from_diagram_find_component_by_name('operator', "TestOperator")
            self.assertIsNotNone(operator)

            self.assertEqual(operator.error_count, 0)

            # Change operator settings
            operator.open_menu().click_entry('Settings')

            self.driver.find_element_by_css_selector('.window_menu [name="test_logging"]').click()
            self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

            self.assertEqual(operator.error_count, 2)
            self.assertEqual(len(operator.log_entries), 5)

        with self.get_current_iwidgets()[0]:
            try:
                WebDriverWait(self.driver, timeout=10).until(lambda driver: driver.find_element_by_id('wiringOut').text != '')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'preferences changed: test_logging')


class WiringRecoveringTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    def _read_json_fixtures(self, *args):
        testdir_path = os.path.join(os.path.dirname(__file__), 'test-data')
        json_fixtures = []

        for filename in args:
            file_opened = open(os.path.join(testdir_path, filename + '.json'))
            json_fixtures.append(json.loads(file_opened.read()))
            file_opened.close()

        if len(json_fixtures) == 0:
            return None

        if len(json_fixtures) == 1:
            return json_fixtures[0]

        return tuple(json_fixtures)

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_wiring_recovers_from_invalid_views_data(self):
        wiring_status = self._read_json_fixtures('wiringstatus_recoverabledata')

        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps(wiring_status)
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)

        self.wiring_view.expect_error = True
        with self.wiring_view as wiring:

            operator = wiring.from_diagram_find_component_by_name('operator', "TestOperator")
            self.assertIsNotNone(operator)
            self.assertFalse(operator.is_missing)

            widget = wiring.from_diagram_find_component_by_name('widget', "Test 1")
            self.assertIsNotNone(widget)
            self.assertFalse(widget.is_missing)

            widget = wiring.from_diagram_find_component_by_name('widget', "Test 2")
            self.assertIsNotNone(widget)
            self.assertFalse(widget.is_missing)

            connections = wiring.get_all_connections()
            self.assertEqual(len(connections), 3)

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
            except:  # pragma: no cover
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_wiring_allows_wiring_status_reset_on_unrecoverable_errors(self):
        wiring_status = self._read_json_fixtures('wiringstatus_unrecoverabledata')

        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps(wiring_status)
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)

        error_badge = self.driver.find_element_by_css_selector(".wirecloud_toolbar .icon-puzzle-piece + .badge")
        self.assertEqual(error_badge.text, '1')
        self.assertTrue(error_badge.is_displayed())
        self.wiring_view.expect_error = True

        with self.wiring_view as wiring:
            operator = wiring.from_diagram_find_component_by_name('operator', "TestOperator")
            self.assertIsNotNone(operator)
            self.assertFalse(operator.is_missing)

            widget = wiring.from_diagram_find_component_by_name('widget', "Test 2")
            self.assertIsNotNone(widget)
            self.assertFalse(widget.is_missing)

            connections = wiring.get_all_connections()
            self.assertEqual(len(connections), 0)


class ComponentMissingTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    def _read_json_fixtures(self, *args):
        testdir_path = os.path.join(os.path.dirname(__file__), 'test-data')
        json_fixtures = []

        for filename in args:
            file_opened = open(os.path.join(testdir_path, filename + '.json'))
            json_fixtures.append(json.loads(file_opened.read()))
            file_opened.close()

        if len(json_fixtures) == 0:
            return None

        if len(json_fixtures) == 1:
            return json_fixtures[0]

        return tuple(json_fixtures)

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_widget_with_visual_info_is_not_in_workspace(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps(self._read_json_fixtures('wiringstatus_widget_missingtradeinfo'))
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)

        with self.wiring_view as wiring:

            widget = wiring.from_diagram_find_component_by_name('widget', "Test")
            self.assertTrue(widget.is_missing)

        with self.wiring_view as wiring:

            widget = wiring.from_diagram_find_component_by_name('widget', "Test")
            self.assertTrue(widget.is_missing)

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_widget_with_visualinfo_and_connections_is_not_in_workspace(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps(self._read_json_fixtures('wiringstatus_widget_missingtradeinfo_with_connections'))
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)

        wiring_error_badge = self.driver.find_element_by_css_selector(".wirecloud_toolbar .icon-puzzle-piece + .badge")
        self.assertTrue(wiring_error_badge.is_displayed())
        self.assertEqual(wiring_error_badge.text, '2')

        with self.wiring_view as wiring:

            widget = wiring.from_diagram_find_component_by_name('widget', "Test")
            self.assertTrue(widget.is_missing)

            connections = wiring.get_all_connections()
            self.assertEqual(len(connections), 5)

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_operator_uninstalled_with_tradeinfo(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps(self._read_json_fixtures('wiringstatus_operatoruninstalled_with_tradeinfo'))
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)

        wiring_error_badge = self.driver.find_element_by_css_selector(".wirecloud_toolbar .icon-puzzle-piece + .badge")
        self.assertTrue(wiring_error_badge.is_displayed())
        self.assertEqual(wiring_error_badge.text, '1')

        with self.wiring_view as wiring:

            operator = wiring.from_diagram_find_component_by_name('operator', "TestOperatorDePalo")
            self.assertTrue(operator.is_missing)

            self.assertEqual(len(operator.get_all_endpoints('source')), 1)
            self.assertEqual(len(operator.get_all_endpoints('target')), 1)

        with self.wiring_view as wiring:

            operator = wiring.from_diagram_find_component_by_name('operator', "TestOperatorDePalo")
            self.assertTrue(operator.is_missing)

            self.assertEqual(len(operator.get_all_endpoints('source')), 1)
            self.assertEqual(len(operator.get_all_endpoints('target')), 1)

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_operator_uninstalled_with_tradeinfo_and_connections(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps(self._read_json_fixtures('wiringstatus_operatoruninstalled_with_tradeinfo_and_connections'))
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)

        wiring_error_badge = self.driver.find_element_by_css_selector(".wirecloud_toolbar .icon-puzzle-piece + .badge")
        self.assertTrue(wiring_error_badge.is_displayed())
        self.assertEqual(wiring_error_badge.text, '1')

        with self.wiring_view as wiring:

            operator = wiring.from_diagram_find_component_by_name('operator', "TestOperatorDePalo")
            self.assertTrue(operator.is_missing)

            self.assertEqual(len(operator.get_all_endpoints('source')), 1)
            self.assertEqual(len(operator.get_all_endpoints('target')), 1)

            connections = wiring.get_all_connections()
            self.assertEqual(len(connections), 5)

            connections = wiring.get_all_connections(missing=True)
            self.assertEqual(len(connections), 3)


class ConnectionReadOnlyTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    def test_readonly_connection_cannot_be_deleted(self):

        workspace = Workspace.objects.get(id=2)
        wiring_status = json.loads(workspace.wiringStatus)
        wiring_status['connections'][0]['readonly'] = True
        workspace.wiringStatus = json.dumps(wiring_status)
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)

        with self.wiring_view as wiring:

            connections = wiring.get_all_connections()
            self.assertEqual(len(connections), 3)

            connections = wiring.get_all_connections(readonly=True)
            self.assertEqual(len(connections), 1)

            readonly_connection = connections[0]
            readonly_connection.select()
            self.assertFalse(readonly_connection.opt_remove.is_displayed())

    def test_widget_or_operator_with_readonly_connections_cannot_be_deleted(self):

        workspace = Workspace.objects.get(id=2)
        wiring_status = json.loads(workspace.wiringStatus)
        wiring_status['connections'][1]['readonly'] = True
        workspace.wiringStatus = json.dumps(wiring_status)
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)

        with self.wiring_view as wiring:

            connections = wiring.get_all_connections(readonly=True)
            self.assertEqual(len(connections), 1)

            operator = wiring.from_diagram_find_component_by_name('operator', "TestOperator")
            self.assertFalse(operator.opt_remove.is_displayed())

            widget = wiring.from_diagram_find_component_by_name('widget', "Test 2")
            self.assertFalse(widget.opt_remove.is_displayed())


class EndpointCollapsedTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    @classmethod
    def setUpClass(cls):
        super(EndpointCollapsedTestCase, cls).setUpClass()

        if not selenium_supports_draganddrop(cls.driver):  # pragma: no cover
            cls.tearDownClass()
            raise unittest.SkipTest('EndpointCollapsedTestCase needs to use native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

    def test_to_collapse_and_expand_component_endpoints(self):

        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:

            operator = wiring.from_diagram_find_component_by_name('operator', 'TestOperator')
            self.assertFalse(operator.is_collapsed)

            operator.collapse_endpoints()
            self.assertTrue(operator.is_collapsed)

        with self.wiring_view as wiring:

            operator = wiring.from_diagram_find_component_by_name('operator', 'TestOperator')
            self.assertTrue(operator.is_collapsed)

            operator.expand_endpoints()
            self.assertFalse(operator.is_collapsed)

    def test_endpoints_collapsed_will_be_expanded_when_a_connection_is_creating(self):

        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:

            operator = wiring.from_diagram_find_component_by_name('operator', 'TestOperator')
            operator.collapse_endpoints()
            self.assertTrue(operator.is_collapsed)

            widget1 = wiring.from_diagram_find_component_by_name('widget', 'Test 1')
            widget1.collapse_endpoints()
            self.assertTrue(widget1.is_collapsed)

            widget2 = wiring.from_diagram_find_component_by_name('widget', 'Test 2')
            self.assertFalse(widget2.is_collapsed)

            source = widget2.get_endpoint_by_name('source', 'Output')
            source.drag_connection(80, 80)

            self.assertFalse(operator.is_collapsed)
            self.assertFalse(widget1.is_collapsed)

    @uses_extra_resources(('Wirecloud_TestOperatorMultiendpoint_1.0.wgt',), shared=True)
    def test_component_with_endpoints_collapsed_cannot_display_option_sort_endpoints(self):

        self.login()

        with self.wiring_view as wiring:

            operator = wiring.add_component_by_name('operator', 'TestOp. Multiendpoint')

            menu_dropdown = operator.open_menu()
            self.assertIsNotNone(menu_dropdown.get_entry('Sort endpoints'))
            menu_dropdown.close()

            operator.collapse_endpoints()
            self.assertTrue(operator.is_collapsed)

            menu_dropdown = operator.open_menu()
            self.assertIsNone(menu_dropdown.get_entry('Sort endpoints'))


class EndpointSortingTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    @classmethod
    def setUpClass(cls):
        super(EndpointSortingTestCase, cls).setUpClass()

        if not selenium_supports_draganddrop(cls.driver):  # pragma: no cover
            cls.tearDownClass()
            raise unittest.SkipTest('EndpointSortingTestCase needs to use native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

    @uses_extra_resources(('Wirecloud_TestOperatorMultiendpoint_1.0.wgt',), shared=True)
    def test_endpoint_sorting_in_operators(self):
        self.login()

        with self.wiring_view as wiring:

            operator = wiring.add_component_by_name('operator', 'TestOp. Multiendpoint')
            operator.open_menu().click_entry('Sort endpoints')

            source1 = operator.get_endpoint_by_name('source', 'output1')
            source2 = operator.get_endpoint_by_name('source', 'output2')
            source1.set_position_of(source2)

            target1 = operator.get_endpoint_by_name('target', 'input1')
            target3 = operator.get_endpoint_by_name('target', 'input3')
            target3.set_position_of(target1)

            operator.open_menu().click_entry('Stop sorting')

        with self.wiring_view as wiring:

            operator = wiring.from_diagram_find_component_by_name('operator', 'TestOp. Multiendpoint')

            source = operator.get_endpoint_by_name('source', 'output1')
            self.assertEqual(source.position, 2)

            target = operator.get_endpoint_by_name('target', 'input3')
            self.assertEqual(target.position, 1)

    @uses_extra_resources(('Wirecloud_TestMultiendpoint_1.0.wgt',), shared=True)
    def test_endpoint_sorting_in_widgets(self):
        self.login()
        iwidget = self.add_widget_to_mashup('Test_Multiendpoint')

        with self.wiring_view as wiring:

            widget = wiring.add_component_by_name('widget', 'Test_Multiendpoint')
            widget.open_menu().click_entry('Sort endpoints')

            source1 = widget.get_endpoint_by_name('source', 'output1')
            source2 = widget.get_endpoint_by_name('source', 'output2')
            source1.set_position_of(source2)

            target1 = widget.get_endpoint_by_name('target', 'input1')
            target3 = widget.get_endpoint_by_name('target', 'input3')
            target3.set_position_of(target1)

            widget.open_menu().click_entry('Stop sorting')

        with self.wiring_view as wiring:

            widget = wiring.from_diagram_find_component_by_name('widget', 'Test_Multiendpoint')

            source = widget.get_endpoint_by_name('source', 'output1')
            self.assertEqual(source.position, 2)

            target = widget.get_endpoint_by_name('target', 'input3')
            self.assertEqual(target.position, 1)


class EndpointStickyEffectTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    @classmethod
    def setUpClass(cls):
        super(EndpointStickyEffectTestCase, cls).setUpClass()

        if not selenium_supports_draganddrop(cls.driver):  # pragma: no cover
            cls.tearDownClass()
            raise unittest.SkipTest('EndpointStickyEffectTestCase needs to use native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

    def test_sticky_effect_in_target_endpoint_label(self):
        self.login()
        iwidget = self.add_widget_to_mashup('Test', new_name='Test 1')

        with self.wiring_view as wiring:

            operator = wiring.add_component_by_name('operator', 'TestOperator')
            target1 = operator.get_endpoint_by_name('target', 'input')
            source1 = operator.get_endpoint_by_name('source', 'output')

            widget = wiring.add_component_by_name('widget', 'Test 1', x=400)
            target2 = widget.get_endpoint_by_name('target', 'Input')
            source2 = widget.get_endpoint_by_name('source', 'Output')

            source1.connect(target2, sticky_effect=True)
            source2.connect(target1, sticky_effect=True)

        with iwidget:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()
            WebDriverWait(self.driver, timeout=2).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')


class EndpointBasicRecommendationTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    @classmethod
    def setUpClass(cls):
        super(EndpointBasicRecommendationTestCase, cls).setUpClass()

        if not selenium_supports_draganddrop(cls.driver):  # pragma: no cover
            cls.tearDownClass()
            raise unittest.SkipTest('EndpointBasicRecommendationTestCase needs to use native events supported on Selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

    def test_highlighted_endpoints_when_endpoint_is_mousedover(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:

            widget1 = wiring.add_component_by_name('widget', 'Test (1)')
            target1 = widget1.get_endpoint_by_name('target', 'Input')

            widget2 = wiring.add_component_by_name('widget', 'Test (2)', x=400)
            source2 = widget2.get_endpoint_by_name('source', 'Output')

            widget3 = wiring.add_component_by_name('widget', 'Test (3)', x=100, y=200)
            target3 = widget3.get_endpoint_by_name('target', 'Input')
            source3 = widget3.get_endpoint_by_name('source', 'Output')

            source2.mouse_over()
            self.assertTrue(source2.is_highlighted)
            self.assertTrue(target1.is_highlighted)
            self.assertTrue(target3.is_highlighted)

            target1.mouse_over()
            self.assertTrue(target1.is_highlighted)
            self.assertTrue(source2.is_highlighted)
            self.assertTrue(source3.is_highlighted)

    def test_highlighted_endpoints_when_connection_is_dragging(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:

            widget1 = wiring.add_component_by_name('widget', 'Test (1)')
            target1 = widget1.get_endpoint_by_name('target', 'Input')

            widget2 = wiring.add_component_by_name('widget', 'Test (2)', x=400)
            source2 = widget2.get_endpoint_by_name('source', 'Output')

            widget3 = wiring.add_component_by_name('widget', 'Test (3)', x=100, y=200)
            target3 = widget3.get_endpoint_by_name('target', 'Input')
            source3 = widget3.get_endpoint_by_name('source', 'Output')

            source2.drag_connection(80, 80)
            self.assertTrue(source2.is_highlighted)
            self.assertTrue(target1.is_highlighted)
            self.assertTrue(target3.is_highlighted)
            source2.drop_connection()

            target1.drag_connection(80, 80)
            self.assertTrue(target1.is_highlighted)
            self.assertTrue(source2.is_highlighted)
            self.assertTrue(source3.is_highlighted)
            target1.drop_connection()
