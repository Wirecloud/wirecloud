# -*- coding: utf-8 -*-

# Copyright (c) 2011-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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
from selenium.webdriver.support.ui import WebDriverWait

from wirecloud.commons.utils.testcases import uses_extra_resources, uses_extra_workspace, WirecloudTestCase, WirecloudSeleniumTestCase, wirecloud_selenium_test_case
from wirecloud.platform import plugins
from wirecloud.platform.workspace.models import Workspace
from wirecloud.platform.workspace.utils import set_variable_value


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
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
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'slot',
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
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'slot',
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
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'slot',
                    },
                },
                {
                    'source': {
                        'type': 'widget',
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
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
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

        workspace = Workspace.objects.get(id=self.workspace_id)
        workspace.wiringStatus = json.dumps({
            'operators': [],
            'connections': [
                {
                    'readonly': True,
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
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
                    'readonly': True,
                    'source': {
                        'type': 'widget',
                        'id': 1,
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 2,
                        'endpoint': 'slot',
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
                        'endpoint': 'event',
                    },
                    'target': {
                        'type': 'widget',
                        'id': 2,
                        'endpoint': 'slot',
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
    tags = ('wirecloud-wiring',)

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


@wirecloud_selenium_test_case
class WiringLayoutTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    def test_user_with_behaviour_engine_disabled(self):

        self.login()

        with self.wiring_view as wiring:
            self.assertTrue(wiring.is_emptied)

            with wiring.component_sidebar as sidebar:
                self.assertTrue(sidebar.has_components('operator'))
                self.assertFalse(sidebar.has_components('widget'))

            with wiring.behaviour_sidebar as sidebar:
                self.assertFalse(sidebar.has_behaviours())


@wirecloud_selenium_test_case
class WiringBasicOperationTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

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
            with wiring.component_sidebar as sidebar:
                widget1 = sidebar.add_component('widget', "Test (1)")
                widget2 = sidebar.add_component('widget', "Test (2)", x=400)

            source = widget1.find_endpoint_by_title('source', "Output")
            target = widget2.find_endpoint_by_title('target', "Input")
            source.connect(target)

        self.send_basic_event(iwidgets[0])
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

            with wiring.component_sidebar as sidebar:
                widget1 = sidebar.add_component('widget', "Test (1)")
                widget2 = sidebar.add_component('widget', "Test (2)", x=400)
                widget3 = sidebar.add_component('widget', "Test (3)", x=100, y=200)

            source = widget1.find_endpoint_by_title('source', "Output")
            target = widget2.find_endpoint_by_title('target', "Input")
            source.connect(target)

        self.send_basic_event(iwidgets[0])
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

            widget2 = wiring.find_component_by_title('widget', "Test (2)")
            widget3 = wiring.find_component_by_title('widget', "Test (3)")

            target1 = widget2.find_endpoint_by_title('target', "Input")
            target2 = widget3.find_endpoint_by_title('target', "Input")

            connections = wiring.find_connections()
            connection = connections[0]
            connection.click()
            connections_length = len(connections)

            target1.connect(target2)
            self.assertEqual(len(wiring.find_connections()), connections_length)

        self.send_basic_event(iwidgets[0], 'hello new world!!')

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
            widget = wiring.find_component_by_title('widget', "Test 1")

            modal = widget.show_settings_modal()

            modal.set_field_value("list", "1", tagname="select")
            modal.set_field_value("text", "test")
            modal.get_field("boolean").click()
            modal.set_field_value("password", "password")

            modal.accept()

        with iwidget:
            self.assertEqual(self.driver.find_element_by_id('listPref').text, '1')
            self.assertEqual(self.driver.find_element_by_id('textPref').text, 'test')
            self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'true')
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, 'password')

    def test_operator_preferences_in_wiring_editor(self):

        self.login(username='user_with_workspaces')
        iwidgets = self.get_current_iwidgets()

        with self.wiring_view as wiring:
            operator = wiring.find_component_by_title('operator', "TestOperator")

            modal = operator.show_settings_modal()
            modal.set_field_value("prefix", "prefix: ")
            modal.accept()

        with iwidgets[0]:
            try:
                WebDriverWait(self.driver, timeout=10).until(lambda driver: driver.find_element_by_id('wiringOut').text != '')
            except:  # pragma: no cover
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'preferences changed: prefix')

        self.send_basic_event(iwidgets[1])
        time.sleep(0.2)

        with iwidgets[0]:
            try:
                WebDriverWait(self.driver, timeout=10).until(lambda driver: driver.find_element_by_id('wiringOut').text != 'preferences changed: prefix')
            except:  # pragma: no cover
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'prefix: hello world!!')

    def test_operator_logging_support(self):

        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            operator = wiring.find_component_by_title('operator', "TestOperator")
            self.assertEqual(operator.error_count, 0)

            modal = operator.show_settings_modal()
            modal.get_field("test_logging").click()
            modal.accept()

            self.assertEqual(operator.error_count, 2)
            self.assertEqual(len(operator.log_entries), 5)

        with self.get_current_iwidgets()[0]:
            try:
                WebDriverWait(self.driver, timeout=10).until(lambda driver: driver.find_element_by_id('wiringOut').text != '')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'preferences changed: test_logging')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    @uses_extra_workspace('admin', 'Wirecloud_api-test-mashup_1.0.wgt', shared=True)
    def test_type_error_and_value_exceptions(self):

        self.login(username="admin", next="/admin/api-test-mashup")
        iwidgets = self.get_current_iwidgets()

        self.send_basic_event(iwidgets[0], 'typeerror')
        self.send_basic_event(iwidgets[0], 'valueerror')
        self.send_basic_event(iwidgets[2], 'typeerror')
        self.send_basic_event(iwidgets[2], 'valueerror')

        error_badge = self.driver.find_element_by_css_selector(".wirecloud_toolbar .icon-puzzle-piece + .badge")
        self.assertTrue(error_badge.is_displayed())
        self.find_navbar_button("display-wiring-view").check_badge_text("4")


@wirecloud_selenium_test_case
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

    def test_wiring_recovers_from_invalid_views_data(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps(self._read_json_fixtures('wiringstatus_recoverabledata'))
        workspace.save()

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)
        self.wiring_view.expect_error = True

        with self.wiring_view as wiring:
            self.assertFalse(wiring.find_component_by_title('operator', "TestOperator").missing)
            self.assertFalse(wiring.find_component_by_title('widget', "Test 1").missing)
            self.assertFalse(wiring.find_component_by_title('widget', "Test 2").missing)
            self.assertEqual(len(wiring.find_connections()), 3)

        self.send_basic_event(iwidgets[0])
        time.sleep(0.2)

        with iwidgets[1]:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            except:  # pragma: no cover
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

    def test_wiring_allows_wiring_status_reset_on_unrecoverable_errors(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps(self._read_json_fixtures('wiringstatus_unrecoverabledata'))
        workspace.save()

        self.login(username='user_with_workspaces')
        self.find_navbar_button("display-wiring-view").check_badge_text("1")
        self.wiring_view.expect_error = True

        with self.wiring_view as wiring:
            self.assertFalse(wiring.find_component_by_title('operator', "TestOperator").missing)
            self.assertFalse(wiring.find_component_by_title('widget', "Test 2").missing)
            self.assertEqual(len(wiring.find_connections()), 0)


@wirecloud_selenium_test_case
class ComponentDraggableTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    def test_component_added_outside_of_diagram(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                sidebar.add_component('operator', "TestOperator", y=-150)
                sidebar.add_component('widget', "Test (1)", x=-150)


@wirecloud_selenium_test_case
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

    def test_widget_with_visual_info_is_not_in_workspace(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps(self._read_json_fixtures('wiringstatus_widget_missingtradeinfo'))
        workspace.save()

        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            self.assertTrue(wiring.find_component_by_title('widget', "Test").missing)

        with self.wiring_view as wiring:
            self.assertTrue(wiring.find_component_by_title('widget', "Test").missing)

    def test_widget_with_visualinfo_and_connections_is_not_in_workspace(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps(self._read_json_fixtures('wiringstatus_widget_missingtradeinfo_with_connections'))
        workspace.save()

        self.login(username='user_with_workspaces')
        self.find_navbar_button("display-wiring-view").check_badge_text("2")

        with self.wiring_view as wiring:
            self.assertTrue(wiring.find_component_by_title('widget', "Test").missing)
            self.assertEqual(len(wiring.find_connections()), 5)

    def test_operator_uninstalled_with_tradeinfo(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps(self._read_json_fixtures('wiringstatus_operatoruninstalled_with_tradeinfo'))
        workspace.save()

        self.login(username='user_with_workspaces')
        self.find_navbar_button("display-wiring-view").check_badge_text("1")

        with self.wiring_view as wiring:
            operator = wiring.find_component_by_title('operator', "TestOperatorDePalo")

            self.assertTrue(operator.missing)
            self.assertEqual(len(operator.filter_endpoints_by_type('source')), 1)
            self.assertEqual(len(operator.filter_endpoints_by_type('target')), 1)

        with self.wiring_view as wiring:
            operator = wiring.find_component_by_title('operator', "TestOperatorDePalo")

            self.assertTrue(operator.missing)
            self.assertEqual(len(operator.filter_endpoints_by_type('source')), 1)
            self.assertEqual(len(operator.filter_endpoints_by_type('target')), 1)

    def test_operator_uninstalled_with_tradeinfo_and_connections(self):
        workspace = Workspace.objects.get(id=2)
        workspace.wiringStatus = json.dumps(self._read_json_fixtures('wiringstatus_operatoruninstalled_with_tradeinfo_and_connections'))
        workspace.save()

        self.login(username='user_with_workspaces')
        self.find_navbar_button("display-wiring-view").check_badge_text("1")

        with self.wiring_view as wiring:
            operator = wiring.find_component_by_title('operator', "TestOperatorDePalo")
            self.assertTrue(operator.missing)

            self.assertEqual(len(operator.filter_endpoints_by_type('source')), 1)
            self.assertEqual(len(operator.filter_endpoints_by_type('target')), 1)

            self.assertEqual(len(wiring.find_connections()), 5)
            self.assertEqual(len(wiring.filter_connections_by_properties("missing")), 3)


@wirecloud_selenium_test_case
class ComponentOperatorTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    def test_operator_available_after_being_installed(self):
        self.login()

        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_TestOperatorSelenium_1.0.zip', 'TestOperatorSelenium', shared=True)

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                sidebar.add_component('operator', "TestOperatorSelenium")

    def test_operator_not_available_after_being_uninstalled(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        with self.myresources_view as myresources:
            myresources.uninstall_resource("TestOperator")

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                components = sidebar.filter_components_by_type('operator')
                self.assertEqual(len(components), 0)

            self.assertTrue(wiring.find_component_by_title('operator', "TestOperator").missing)

    def check_operator_reinstall_behaviour(self, reload):
        workspace = Workspace.objects.get(id=3)
        parsedStatus = json.loads(workspace.wiringStatus)
        parsedStatus['operators']['0']['preferences'] = {
            'prefix': {"readonly": False, "hidden": False, "value": 'test_'},
            'exception_on_event': {"readonly": False, "hidden": False, "value": 'true'},
            'test_logging': {"readonly": False, "hidden": False, "value": 'true'}
        }
        workspace.wiringStatus = json.dumps(parsedStatus, ensure_ascii=False)
        workspace.save()

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        with self.wiring_view as wiring:
            operator = wiring.find_component_by_title('operator', "TestOperator")

            modal = operator.show_settings_modal()
            modal.get_field("exception_on_event").click()
            modal.accept()

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
        self.send_basic_event(source_iwidget)

        with target_iwidget:
            WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_id('wiringOut').text != 'hello world!!')

        # Check preference values has been restored to the values used before uninstalling the widget and not to the default ones
        with self.wiring_view as wiring:
            operator = wiring.find_component_by_title('operator', "TestOperator")

            modal = operator.show_settings_modal()
            self.assertEqual(modal.get_field_value("prefix"), "test_")
            self.assertFalse(modal.get_field("exception_on_event").is_selected())
            self.assertTrue(modal.get_field("test_logging").is_selected())
            modal.accept()

    def test_operators_in_use_reinstall_behaviour(self):
        self.check_operator_reinstall_behaviour(False)

    def test_operators_in_use_reinstall_behaviour_reload(self):
        self.check_operator_reinstall_behaviour(True)

    def test_operators_are_not_usable_after_being_deleted(self):
        self.login()

        with self.myresources_view as myresources:
            myresources.delete_resource('TestOperator')

        with self.wiring_view as wiring:
            with wiring.component_sidebar:
                self.assertEqual(len(wiring.filter_components_by_type('operator')), 0)


@wirecloud_selenium_test_case
class ConnectionReadOnlyTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    def _set_connection_readonly(self, workspace_id, connection_index):
        workspace = Workspace.objects.get(id=workspace_id)
        wiring_status = json.loads(workspace.wiringStatus)
        wiring_status['connections'][connection_index]['readonly'] = True
        workspace.wiringStatus = json.dumps(wiring_status)
        workspace.save()

    def test_readonly_connection_cannot_be_deleted(self):
        self._set_connection_readonly(2, 1)
        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)

        with self.wiring_view as wiring:
            connections = wiring.filter_connections_by_properties("readonly")
            self.assertEqual(len(connections), 1)

            connection = connections[0]
            connection.click()

    def test_component_with_readonly_connections_cannot_be_deleted(self):
        self._set_connection_readonly(2, 1)
        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)

        with self.wiring_view as wiring:
            self.assertEqual(len(wiring.filter_connections_by_properties("readonly")), 1)
            self.assertFalse(wiring.find_component_by_title('operator', "TestOperator").btn_remove.displayed)
            self.assertFalse(wiring.find_component_by_title('widget', "Test 2").btn_remove.displayed)


@wirecloud_selenium_test_case
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
            with wiring.component_sidebar as sidebar:
                widget1 = sidebar.add_component('widget', 'Test (1)')
                widget2 = sidebar.add_component('widget', 'Test (2)', x=400)
                widget3 = sidebar.add_component('widget', 'Test (3)', x=100, y=200)

            target1 = widget1.find_endpoint_by_title('target', 'Input')
            source2 = widget2.find_endpoint_by_title('source', 'Output')
            target3 = widget3.find_endpoint_by_title('target', 'Input')
            source3 = widget3.find_endpoint_by_title('source', 'Output')

            source2.mouse_over()
            self.assertTrue(source2.highlighted)
            self.assertTrue(target1.highlighted)
            self.assertTrue(target3.highlighted)

            target1.mouse_over()
            self.assertTrue(target1.highlighted)
            self.assertTrue(source2.highlighted)
            self.assertTrue(source3.highlighted)

    def test_highlighted_endpoints_when_connection_is_dragging(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                widget1 = sidebar.add_component('widget', 'Test (1)')
                widget2 = sidebar.add_component('widget', 'Test (2)', x=400)
                widget3 = sidebar.add_component('widget', 'Test (3)', x=100, y=200)

            target1 = widget1.find_endpoint_by_title('target', 'Input')
            source2 = widget2.find_endpoint_by_title('source', 'Output')
            target3 = widget3.find_endpoint_by_title('target', 'Input')
            source3 = widget3.find_endpoint_by_title('source', 'Output')

            source2.drag_connection(80, 80)
            self.assertTrue(source2.highlighted)
            self.assertTrue(target1.highlighted)
            self.assertTrue(target3.highlighted)
            source2.drop_connection()

            target1.drag_connection(80, 80)
            self.assertTrue(target1.highlighted)
            self.assertTrue(source2.highlighted)
            self.assertTrue(source3.highlighted)
            target1.drop_connection()


@wirecloud_selenium_test_case
class EndpointCollapsedTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    @classmethod
    def setUpClass(cls):
        super(EndpointCollapsedTestCase, cls).setUpClass()

        if not selenium_supports_draganddrop(cls.driver):  # pragma: no cover
            cls.tearDownClass()
            raise unittest.SkipTest('EndpointCollapsedTestCase needs to use native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

    def test_component_endpoints_can_be_collapsed_and_expanded(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            operator = wiring.find_component_by_title('operator', "TestOperator")
            self.assertFalse(operator.collapsed)
            operator.collapse_endpoints()

        with self.wiring_view as wiring:
            operator = wiring.find_component_by_title('operator', "TestOperator")
            self.assertTrue(operator.collapsed)
            operator.expand_endpoints()

    def test_endpoints_collapsed_will_be_expanded_when_a_connection_is_creating(self):
        self.login(username='user_with_workspaces')

        with self.wiring_view as wiring:
            operator = wiring.find_component_by_title('operator', "TestOperator")
            operator.collapse_endpoints()

            widget1 = wiring.find_component_by_title('widget', "Test 1")
            widget1.collapse_endpoints()

            widget2 = wiring.find_component_by_title('widget', "Test 2")
            self.assertFalse(widget2.collapsed)

            source = widget2.find_endpoint_by_title('source', "Output")
            source.drag_connection(80, 80)

            self.assertFalse(operator.collapsed)
            self.assertFalse(widget1.collapsed)

            source.drop_connection()

    @uses_extra_resources(('Wirecloud_TestOperatorMultiendpoint_1.0.wgt',), shared=True)
    def test_component_with_endpoints_collapsed_cannot_display_option_sort_endpoints(self):
        self.login()

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                operator = sidebar.add_component('operator', "TestOp. Multiendpoint")

            menu_dropdown = operator.display_preferences()
            self.assertIsNotNone(menu_dropdown.get_entry('Sort endpoints'))
            menu_dropdown.close()

            operator.collapse_endpoints()

            menu_dropdown = operator.display_preferences()
            self.assertIsNone(menu_dropdown.get_entry('Sort endpoints'))


@wirecloud_selenium_test_case
class EndpointMissingTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium',)

    def check_input_endpoint_exceptions(self):

        self.login(username='user_with_workspaces')

        iwidgets = self.get_current_iwidgets()
        source_iwidget = iwidgets[0]
        target_iwidget = iwidgets[1]
        self.assertIsNotNone(source_iwidget.element)
        self.assertIsNotNone(target_iwidget.element)

        self.assertEqual(source_iwidget.error_count, 0)
        self.assertEqual(target_iwidget.error_count, 0)

        self.send_basic_event(source_iwidget)

        WebDriverWait(self.driver, timeout=10).until(lambda driver: target_iwidget.error_count == 1)
        self.assertEqual(source_iwidget.error_count, 0)

        with target_iwidget:
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

        # Test exception on the operator input endpoint
        source_iwidget = iwidgets[1]
        target_iwidget = iwidgets[0]

        self.send_basic_event(source_iwidget)

        self.find_navbar_button("display-wiring-view").check_badge_text("1")

        with self.wiring_view as wiring:

            operator = wiring.find_component_by_title('operator', "TestOperator")
            self.assertEqual(operator.error_count, 1)
            self.assertEqual(target_iwidget.error_count, 0)

            modal = operator.show_logger_modal()
            self.assertEqual(len(modal.filter_alerts_by_type("error")), 1)
            modal.accept()

    def test_input_endpoint_exceptions(self):

        # Enable widget exceptions
        set_variable_value(9, 'true')

        # Enable operator exceptions
        workspace = Workspace.objects.get(id=2)
        parsedStatus = json.loads(workspace.wiringStatus)
        parsedStatus['operators']['0']['preferences']['exception_on_event'] = {"readonly": False, "hidden": False, "value": 'true'}
        workspace.wiringStatus = json.dumps(parsedStatus, ensure_ascii=False)
        workspace.save()

        # Check exceptions
        self.check_input_endpoint_exceptions()

    def test_input_endpoint_no_handler_exceptions(self):

        # Update wiring connections to use the not handled input endpoints
        workspace = Workspace.objects.get(id=2)
        parsedStatus = json.loads(workspace.wiringStatus)
        parsedStatus['connections'][0]['target']['endpoint'] = 'nothandled'
        parsedStatus['connections'][1]['target']['endpoint'] = 'nothandled'
        workspace.wiringStatus = json.dumps(parsedStatus, ensure_ascii=False)
        workspace.save()

        self.check_input_endpoint_exceptions()


@wirecloud_selenium_test_case
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
            with wiring.component_sidebar as sidebar:
                operator = sidebar.add_component('operator', "TestOp. Multiendpoint")

            with operator.sort_endpoints as component_editable:
                component_editable.move_endpoint('source', "output1", "output2")
                component_editable.move_endpoint('target', "input1", "input3")

    @uses_extra_resources(('Wirecloud_TestMultiendpoint_1.0.wgt',), shared=True)
    def test_endpoint_sorting_in_widgets(self):
        self.login()
        self.add_widget_to_mashup('Test_Multiendpoint')

        with self.wiring_view as wiring:
            with wiring.component_sidebar as sidebar:
                widget = sidebar.add_component('widget', "Test_Multiendpoint")

            with widget.sort_endpoints as component_editable:
                component_editable.move_endpoint('source', "output1", "output2")
                component_editable.move_endpoint('target', "input1", "input3")


@wirecloud_selenium_test_case
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
            with wiring.component_sidebar as sidebar:
                operator = sidebar.add_component('operator', "TestOperator")
                widget = sidebar.add_component('widget', "Test 1", x=400)

            target1 = operator.find_endpoint_by_title('target', "input")
            source1 = operator.find_endpoint_by_title('source', "output")

            target2 = widget.find_endpoint_by_title('target', "Input")
            source2 = widget.find_endpoint_by_title('source', "Output")

            source1.connect(target2, sticky_effect=True)
            source2.connect(target1, sticky_effect=True)

        self.send_basic_event(iwidget)
        with iwidget:
            WebDriverWait(self.driver, timeout=2).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')


@wirecloud_selenium_test_case
class BehaviourManagementTestCase(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-wiring', 'wirecloud-wiring-selenium')

    @classmethod
    def setUpClass(cls):
        super(BehaviourManagementTestCase, cls).setUpClass()

        if not selenium_supports_draganddrop(cls.driver):  # pragma: no cover
            cls.tearDownClass()
            raise unittest.SkipTest('BehaviourManagementTestCase needs to use native events support on selenium <= 2.37.2 when using FirefoxDriver (not available on Mac OS)')

    def _build_simple_behaviour(self):
        return {
            'title': "New behaviour 0",
            'description': "No description provided.",
            'components': {
                'operator': {},
                'widget': {}
            },
            'connections': []
        }

    def _enable_behaviour_engine_in_workspace(self, workspace_id):
        workspace = Workspace.objects.get(id=workspace_id)
        wiring_status = json.loads(workspace.wiringStatus)
        wiring_status['visualdescription']['behaviours'].append(self._build_simple_behaviour())
        workspace.wiringStatus = json.dumps(wiring_status)
        workspace.save()

    def test_behaviour_engine_is_disabled_by_default(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                sidebar.enable()
                self.assertEqual(len(sidebar.behaviour_list), 1)
                sidebar.active_behaviour.check_basic_info("New behavior", "No description provided.")

            with wiring.behaviour_sidebar as sidebar:
                self.assertFalse(sidebar.disabled)
                self.assertEqual(len(sidebar.behaviour_list), 1)
                sidebar.active_behaviour.check_basic_info("New behavior", "No description provided.")

    def test_behaviour_basic_info_can_be_updated(self):
        self._enable_behaviour_engine_in_workspace(5)
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                behaviour = sidebar.active_behaviour
                sidebar.update_behaviour(behaviour, title="Title for behaviour 0", description="Description for behaviour 0")

    def test_behaviour_title_can_be_updated_alone(self):
        self._enable_behaviour_engine_in_workspace(5)
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                behaviour = sidebar.active_behaviour
                sidebar.update_behaviour(behaviour, title="Title for behaviour 0")

    def test_behaviour_description_can_be_updated_alone(self):
        self._enable_behaviour_engine_in_workspace(5)
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                behaviour = sidebar.active_behaviour
                sidebar.update_behaviour(behaviour, description="Description for behaviour 0")

    def test_behaviour_title_and_description_cannot_be_emptied(self):
        self._enable_behaviour_engine_in_workspace(5)
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                behaviour = sidebar.active_behaviour
                sidebar.update_behaviour(behaviour, title="", description="")

    def test_behaviour_can_be_created_with_no_basic_info(self):
        self._enable_behaviour_engine_in_workspace(5)
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                sidebar.create_behaviour()

    def test_behaviour_can_be_created_with_only_title(self):
        self._enable_behaviour_engine_in_workspace(5)
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                sidebar.create_behaviour(title="Title for behaviour 1")

    def test_behaviour_can_be_created_with_only_description(self):
        self._enable_behaviour_engine_in_workspace(5)
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                sidebar.create_behaviour(description="Description for behaviour 1")

    def test_behaviour_can_be_created_with_title_and_description(self):
        self._enable_behaviour_engine_in_workspace(5)
        self.login(username='user_with_workspaces', next='/user_with_workspaces/WiringTests')

        with self.wiring_view as wiring:
            with wiring.behaviour_sidebar as sidebar:
                sidebar.create_behaviour(title="Title for behaviour 1", description="Description for behaviour 1")
