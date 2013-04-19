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

import time

from django.core.urlresolvers import reverse
from django.contrib.auth.models import User
from django.db import transaction
from django.test import TransactionTestCase, Client
from django.utils import simplejson
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait

from wirecloud.commons.test import WirecloudSeleniumTestCase, iwidget_context
from wirecloud.platform.workspace.models import Workspace


# Avoid nose to repeat these tests (they are run through wirecloud/tests.py)
__test__ = False


class WiringTestCase(TransactionTestCase):

    fixtures = ('test_data',)

    def setUp(self):

        super(WiringTestCase, self).setUp()

        self.user = User.objects.get(username='test')

        workspace = Workspace.objects.get(id=1)
        self.workspace_id = workspace.pk

        workspace.wiringStatus = simplejson.dumps({
            'operators': [],
            'connections': [],
        })
        workspace.save()
        transaction.commit()

        self.wiring_url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': self.workspace_id})

    def test_save_basic_wiring_connection(self):
        client = Client()
        client.login(username='test', password='test')

        data = simplejson.dumps({
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
    test_save_basic_wiring_connection.tags = ('fiware-ut-6',)

    def test_wiring_modification_fails_with_incorrect_user(self):
        client = Client()
        client.login(username='test2', password='test')

        data = simplejson.dumps({
            'operators': [],
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)
    test_wiring_modification_fails_with_incorrect_user.tags = ('fiware-ut-6',)

    def test_basic_wiring_operations_with_read_only_connections(self):
        workspace = Workspace.objects.get(id=1)
        workspace.wiringStatus = simplejson.dumps({
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

        data = simplejson.dumps({
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
        workspace.wiringStatus = simplejson.dumps({
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

        data = simplejson.dumps({
            'operators': [],
            'connections': [],
        })
        response = client.put(self.wiring_url, data, content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_read_only_connections_cannot_be_modified(self):

        workspace = Workspace.objects.get(id=1)
        workspace.wiringStatus = simplejson.dumps({
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

        data = simplejson.dumps({
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


class WiringSeleniumTestCase(WirecloudSeleniumTestCase):

    def test_operators_are_usable_after_installing(self):

        self.login()

        self.add_packaged_resource_to_catalogue('Wirecloud_TestOperatorSelenium_1.0.zip', 'TestOperatorSelenium', shared=True)

        self.change_main_view('wiring')
        time.sleep(2)

        wiring_base_element = self.driver.find_element_by_css_selector('.wiring_editor')
        menubar = wiring_base_element.find_element_by_css_selector('.menubar')

        menubar.find_element_by_xpath("//*[contains(@class, 'styled_expander')]//*[contains(@class, 'title') and text()='Operators']").click()
        menubar.find_element_by_xpath("//*[contains(@class, 'container ioperator')]//*[text()='TestOperatorSelenium']")
    test_operators_are_usable_after_installing.tags = ('fiware-ut-6',)

    def test_operators_are_not_usable_after_being_uninstalled(self):

        self.login()

        self.uninstall_resource('TestOperator')

        self.change_main_view('wiring')
        time.sleep(2)

        wiring_base_element = self.driver.find_element_by_css_selector('.wiring_editor')
        menubar = wiring_base_element.find_element_by_css_selector('.menubar')

        menubar.find_element_by_xpath("//*[contains(@class, 'styled_expander')]//*[contains(@class, 'title') and text()='Operators']").click()
        self.assertRaises(NoSuchElementException, menubar.find_element_by_xpath, "//*[contains(@class, 'container ioperator')]//*[text()='TestOperator']")
    test_operators_are_not_usable_after_being_uninstalled.tags = ('fiware-ut-6',)

    def test_operators_are_not_usable_after_being_deleted(self):

        self.login()

        self.delete_resource('TestOperator')

        self.change_main_view('wiring')
        time.sleep(2)

        wiring_base_element = self.driver.find_element_by_css_selector('.wiring_editor')
        menubar = wiring_base_element.find_element_by_css_selector('.menubar')

        menubar.find_element_by_xpath("//*[contains(@class, 'styled_expander')]//*[contains(@class, 'title') and text()='Operators']").click()
        self.assertRaises(NoSuchElementException, menubar.find_element_by_xpath, "//*[contains(@class, 'container ioperator')]//*[text()='TestOperator']")

    def test_basic_wiring_editor_operations(self):
        self.login()

        self.add_widget_to_mashup('Test', new_name='Test (1)')
        self.add_widget_to_mashup('Test', new_name='Test (2)')
        self.add_widget_to_mashup('Test', new_name='Test (3)')
        iwidgets = self.get_current_iwidgets()

        self.change_main_view('wiring')
        time.sleep(2)
        grid = self.driver.find_element_by_xpath("//*[contains(@class, 'container center_container grid')]")

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (1)']")
        # TODO there are several bugs in the firefox, for now, this line of code "works"
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(-40, -40).click().perform()

        source = self.driver.find_element_by_xpath("//*[contains(@class, 'container iwidget')]//*[text()='Test (2)']")
        # TODO there are several bugs in the firefox, for now, this line of code "works"
        ActionChains(self.driver).click_and_hold(source).move_to_element(grid).move_by_offset(40, 40).click().perform()
        time.sleep(0.2)

        source = self.get_iwidget_anchor(1, 'outputendpoint')
        target = self.get_iwidget_anchor(2, 'inputendpoint')
        ActionChains(self.driver).drag_and_drop(source, target).perform()

        self.change_main_view('workspace')
        time.sleep(0.2)

        with iwidget_context(self.driver, iwidgets[0]['id']):
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        time.sleep(0.2)

        with iwidget_context(self.driver, iwidgets[1]['id']):
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

        with iwidget_context(self.driver, iwidgets[2]['id']):
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')

        with iwidget_context(self.driver, iwidgets[0]['id']):
            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, '')
    test_basic_wiring_editor_operations.tags = ('fiware-ut-6',)
