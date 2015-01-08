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


import os
import re
from six import text_type
from six.moves.urllib.parse import urljoin
from six.moves.urllib.request import pathname2url
import time

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select, WebDriverWait

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils import expected_conditions as WEC
from wirecloud.commons.utils.remote import PopupMenuTester
from wirecloud.commons.utils.testcases import uses_extra_resources, MobileWirecloudSeleniumTestCase, WirecloudSeleniumTestCase, wirecloud_selenium_test_case


def check_default_settings_values(test):

    test.assertEqual(test.driver.find_element_by_id('listPref').text, 'default')
    test.assertEqual(test.driver.find_element_by_id('textPref').text, 'initial text')
    test.assertEqual(test.driver.find_element_by_id('booleanPref').text, 'false')
    test.assertEqual(test.driver.find_element_by_id('numberPref').text, '2')
    test.assertEqual(test.driver.find_element_by_id('passwordPref').text, 'default')


class BasicSeleniumTests(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium',)

    def test_basic_workspace_operations(self):

        self.login()

        # We need atleast one Workspace, so we cannot delete current workspace
        self.open_menu().check(('Rename', 'Settings', 'New workspace', 'Upload to my resources'), must_be_disabled=('Remove',)).close()

        self.create_workspace(name='Test')

        # Now we have two workspaces so we can remove any of them
        self.open_menu().check(('Rename', 'Settings', 'New workspace', 'Upload to my resources', 'Remove'), ()).close()

        self.rename_workspace('test2')
        tab = self.get_workspace_tab_by_name('Tab')

        # Only one tab => we cannot remove it
        tab.open_menu().check(('Rename',), must_be_disabled=('Remove',))

        new_tab = self.add_tab()

        # Now we have two tabs so we can remove any of them
        tab.open_menu().check(must_be=('Rename', 'Remove'))
        new_tab.element.click()
        new_tab.open_menu().check(must_be=('Rename', 'Remove')).close()

        # Remove the recently created one (no confirmation needed as the tab is empty)
        new_tab.open_menu().click_entry('Remove')
        self.wait_wirecloud_ready()
        self.assertEqual(self.count_workspace_tabs(), 1)

        self.remove_workspace()

        # Now we have only one workspace, so we cannot remove it
        self.open_menu().check(('Rename', 'Settings', 'New workspace'), must_be_disabled=('Remove',))
    test_basic_workspace_operations.tags = ('wirecloud-selenium', 'fiware-ut-5')

    def test_move_iwidget_between_tabs(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        src_tab_iwidgets = self.get_current_iwidgets(tab=102)
        dst_tab_iwidgets = self.get_current_iwidgets(tab=103)
        src_iwidget_count = len(src_tab_iwidgets)
        dst_iwidget_count = len(dst_tab_iwidgets)

        iwidget = src_tab_iwidgets[0]

        handle = iwidget.element.find_element_by_css_selector('.widget_menu')
        tab = self.get_workspace_tab_by_name('Tab 2')
        ActionChains(self.driver).click_and_hold(handle).move_to_element(tab.element).release().perform()

        src_tab_iwidgets = self.get_current_iwidgets(tab=102)
        dst_tab_iwidgets = self.get_current_iwidgets(tab=103)
        self.assertEqual(len(src_tab_iwidgets), src_iwidget_count - 1)
        self.assertEqual(len(dst_tab_iwidgets), dst_iwidget_count + 1)
    test_move_iwidget_between_tabs.tags = ('wirecloud-selenium', 'dragboard')

    def test_add_widget_from_catalogue(self):

        self.login()
        self.add_widget_to_mashup('Test')
    test_add_widget_from_catalogue.tags = ('wirecloud-selenium', 'fiware-ut-5')

    def test_remove_widget_from_workspace(self):

        self.login(username='user_with_workspaces')

        iwidget = self.get_current_iwidgets()[0]
        iwidget.remove()
    test_remove_widget_from_workspace.tags = ('wirecloud-selenium', 'fiware-ut-5')

    def test_remove_tab_from_workspace(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        iwidgets = self.get_current_iwidgets()

        tab = self.get_workspace_tab_by_name('Tab 1')
        tab.open_menu().click_entry('Remove')
        # Confirm tab deletion
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']").click()

        with self.wiring_view as wiring:
            self.assertIsNone(wiring.get_iwidget(iwidgets[0]))

    def test_read_only_widgets_cannot_be_removed(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        tab = self.get_workspace_tab_by_name('Tab 2')
        tab.element.click()

        iwidget = self.get_current_iwidgets()[1]
        iwidget.wait_loaded()
        close_button = iwidget.element.find_element_by_css_selector('.icon-remove')
        self.assertTrue('disabled' in close_button.get_attribute('class'))

    def test_tabs_with_read_only_widgets_cannot_be_removed(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        tab = self.get_workspace_tab_by_name('Tab 2')
        tab.element.click()
        tab.open_menu().check(must_be_disabled=('Remove',))

    def test_widget_reload(self):

        self.login(username='user_with_workspaces')

        iwidget = self.get_current_iwidgets()[0]

        with iwidget:

            last_received_event_field = self.driver.find_element_by_id('wiringOut')
            self.driver.execute_script('arguments[0].textContent = "hello world!!";', last_received_event_field);

        iwidget.open_menu().click_entry('Reload')

        with iwidget:
            last_received_event_field = self.wait_element_visible_by_id('wiringOut')
            self.assertEqual(last_received_event_field.text, '')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_basic_widget_functionalities(self):

        self.login(username='user_with_workspaces')
        iwidget = self.get_current_iwidgets()[0]

        with iwidget:
            check_default_settings_values(self)

        # Open widget settings
        iwidget.open_menu().click_entry('Settings')

        # Check dialog shows correct values
        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="list"]').get_attribute('value'), 'default')
        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="text"]').get_attribute('value'), 'initial text')
        self.assertFalse(self.driver.find_element_by_css_selector('.window_menu [name="boolean"]').is_selected())
        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="number"]').get_attribute('value'), '2')
        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="password"]').get_attribute('value'), 'default')

        # Change widget settings
        list_input = self.driver.find_element_by_css_selector('.window_menu [name="list"]')
        self.fill_form_input(list_input, '1')  # value1
        text_input = self.driver.find_element_by_css_selector('.window_menu [name="text"]')
        self.fill_form_input(text_input, 'test')
        boolean_input = self.driver.find_element_by_css_selector('.window_menu [name="boolean"]')
        boolean_input.click()
        number_input = self.driver.find_element_by_css_selector('.window_menu [name="number"]')
        self.fill_form_input(number_input, '0')
        password_input = self.driver.find_element_by_css_selector('.window_menu [name="password"]')
        self.fill_form_input(password_input, 'password')

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        with iwidget:
            self.assertEqual(self.driver.find_element_by_id('listPref').text, '1')
            self.assertEqual(self.driver.find_element_by_id('textPref').text, 'test')
            self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'true')
            self.assertEqual(self.driver.find_element_by_id('numberPref').text, '0')
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, 'password')

        # Open widget settings again
        iwidget.open_menu().click_entry('Settings')

        # Check dialog shows correct values
        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="list"]').get_attribute('value'), '1')
        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="text"]').get_attribute('value'), 'test')
        self.assertTrue(self.driver.find_element_by_css_selector('.window_menu [name="boolean"]').is_selected())
        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="number"]').get_attribute('value'), '0')
        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="password"]').get_attribute('value'), 'password')

        # Change widget settings
        text_input = self.driver.find_element_by_css_selector('.window_menu [name="text"]')
        self.fill_form_input(text_input, '')
        password_input = self.driver.find_element_by_css_selector('.window_menu [name="password"]')
        self.fill_form_input(password_input, '')

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        with iwidget:
            self.assertEqual(self.driver.find_element_by_id('listPref').text, '1')
            self.assertEqual(self.driver.find_element_by_id('textPref').text, '')
            self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'true')
            self.assertEqual(self.driver.find_element_by_id('numberPref').text, '0')
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, '')

        # Restore default widget settings
        iwidget.open_menu().click_entry('Settings')
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Set Defaults']").click()
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        with iwidget:
            check_default_settings_values(self)

        # Use api test widget to test other API features
        self.network._servers['http']['example.com'].add_response('GET', '/success.html', {'content': 'remote makerequest was successful'})
        api_test_iwidget = self.add_widget_to_mashup('Wirecloud API test')

        # Open widget settings again
        api_test_iwidget.open_menu().click_entry('Settings')

        text_input = self.driver.find_element_by_css_selector('.window_menu [name="text"]')
        self.fill_form_input(text_input, 'Success!!')

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        with api_test_iwidget:
            self.assertEqual(self.driver.find_element_by_id('pref_registercallback_test').text, 'Success!!')
            WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_id('makerequest_test').text, 'Success!!')
            prop_input = self.driver.find_element_by_css_selector('#update_prop_input')
            self.fill_form_input(prop_input, 'new value')
            # Work around Firefox driver bugs
            self.driver.execute_script('arguments[0].click()',
                self.driver.find_element_by_css_selector('#update_prop_button'))

        self.driver.refresh()
        self.wait_wirecloud_ready()
        time.sleep(1)

        with api_test_iwidget:
            prop_input = self.driver.find_element_by_css_selector('#update_prop_input')
            self.assertEqual(prop_input.get_attribute('value'), 'new value')

            self.assertEqual(api_test_iwidget.error_count, 0)
            old_log_entries = len(api_test_iwidget.log_entries)
            # Work around some firefox driver bugs
            self.driver.execute_script('arguments[0].click()', self.driver.find_element_by_css_selector('#check_logs_button'))
            WebDriverWait(self.driver, timeout=2).until(lambda driver: driver.find_element_by_id('widget_log_test').text == 'Success!!')
            self.assertEqual(api_test_iwidget.error_count, 2)
            self.assertEqual(len(api_test_iwidget.log_entries), old_log_entries + 4)

            # Work around some firefox driver bugs
            self.driver.execute_script('arguments[0].click()', self.driver.find_element_by_css_selector('#check_endpoint_exceptions_button'))
            WebDriverWait(self.driver, timeout=2).until(lambda driver: driver.find_element_by_id('endpoint_exceptions_test').text == 'Success!!')
            self.assertEqual(api_test_iwidget.error_count, 5)
            self.assertEqual(len(api_test_iwidget.log_entries), old_log_entries + 7)

            # Work around some firefox driver bugs
            self.driver.execute_script('arguments[0].click()', self.driver.find_element_by_css_selector('#check_preference_exceptions_button'))
            WebDriverWait(self.driver, timeout=2).until(lambda driver: driver.find_element_by_id('preference_exceptions_test').text == 'Success!!')
            self.assertEqual(api_test_iwidget.error_count, 7)
            self.assertEqual(len(api_test_iwidget.log_entries), old_log_entries + 9)
    test_basic_widget_functionalities.tags = ('wirecloud-selenium', 'fiware-ut-5')

    @uses_extra_resources(('Wirecloud_Test_2.0.wgt',), shared=True)
    def test_widget_navigation_to_doc(self):

        self.login(username='user_with_workspaces')
        iwidget = self.get_current_iwidgets()[0]

        iwidget.open_menu().click_entry("User's Manual")

        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.get_current_view() == 'myresources')
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.myresources_view.get_subview() == 'details')
        current_tab = self.driver.find_element_by_css_selector('.details_interface .se-notebook-tab.selected').text
        self.assertEqual(self.myresources_view.get_current_resource(), 'Test')
        self.assertEqual(self.driver.find_element_by_css_selector('.details_interface .se-select.versions .se-select-text').text, 'v1.0')
        self.assertEqual(current_tab, 'Documentation')

        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')

        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.driver.current_url == self.live_server_url + '/login')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'myresources')
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.myresources_view.get_subview() == 'details')
        self.assertEqual(self.myresources_view.get_subview(), 'details')
        self.assertEqual(self.myresources_view.get_current_resource(), 'Test')

    def test_pending_wiring_events(self):

        self.login(username='user_with_workspaces')

        self.change_current_workspace('Pending Events')

        iwidgets = self.get_current_iwidgets()
        source_iwidget = iwidgets[0]
        target_iwidget = iwidgets[1]
        self.assertIsNotNone(source_iwidget.element)
        self.assertIsNone(target_iwidget.element)
        with source_iwidget:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        time.sleep(0.5)

        iwidgets = self.get_current_iwidgets()
        source_iwidget = iwidgets[0]
        target_iwidget = iwidgets[1]
        self.assertIsNotNone(source_iwidget.element)
        self.assertIsNotNone(target_iwidget.element)

        tab = self.get_workspace_tab_by_name('Tab 2')
        tab.element.click()

        with target_iwidget:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

    def test_http_cache(self):

        self.login()

        # Create a new workspace
        self.create_workspace(name='Test')

        self.driver.refresh()
        self.wait_wirecloud_ready()

        self.assertEqual(self.get_current_workspace_name(), 'Test')

        # Add a new tab
        self.add_tab()

        self.driver.refresh()
        self.wait_wirecloud_ready()

        tabs = self.count_workspace_tabs()
        self.assertEqual(tabs, 2)

        tab = self.get_workspace_tab_by_name('Tab')

        # Rename the created tab
        tab.rename('Other Name')

        self.driver.refresh()
        self.wait_wirecloud_ready()

        self.assertEqual(self.count_workspace_tabs(), 2)
        tab = self.get_workspace_tab_by_name('Other Name')
        self.assertIsNotNone(tab)
        tab = self.get_workspace_tab_by_name('Tab')
        self.assertIsNone(tab)

        # Add two widgets to the mashup
        with self.wallet as wallet:
            wallet.search('Test')
            resource = wallet.search_in_results('Test')
            resource.instantiate()
            resource.instantiate()

        self.driver.refresh()
        self.wait_wirecloud_ready()

        self.assertEqual(self.count_iwidgets(), 2)

        # Rename a widget

        iwidget = self.get_current_iwidgets()[1]
        iwidget.rename('Other Test')

        self.driver.refresh()
        self.wait_wirecloud_ready()

        iwidget = self.get_current_iwidgets()[0]
        self.assertEqual(iwidget.name, 'Test')

        iwidget = self.get_current_iwidgets()[1]
        self.assertEqual(iwidget.name, 'Other Test')

        # Remove a widget
        iwidget.remove()

        self.driver.refresh()
        self.wait_wirecloud_ready()

        self.assertEqual(self.count_iwidgets(), 1)

        # Rename the workspace
        self.rename_workspace('test2')

        self.driver.refresh()
        self.wait_wirecloud_ready()

        self.assertEqual(self.get_current_workspace_name(), 'test2')

        # Remove the tab with widgets
        tab = self.get_workspace_tab_by_name('Other Name')
        tab.open_menu().click_entry('Remove')
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']").click()
        self.wait_wirecloud_ready()

        self.driver.refresh()
        self.wait_wirecloud_ready()

        self.assertEqual(self.count_workspace_tabs(), 1)
        self.assertEqual(self.count_iwidgets(), 0)
    test_http_cache.tags = ('wirecloud-selenium', 'fiware-ut-5')

    def test_create_workspace_from_catalogue(self):

        self.login()
        self.create_workspace(mashup='Test Mashup')

        # Test that wiring works as expected
        tab = self.get_workspace_tab_by_name('Tab')
        tab2 = self.get_workspace_tab_by_name('Tab 2')

        # Load tab2
        tab2.element.click()
        tab.element.click()

        iwidgets = self.get_current_iwidgets()

        # Send wiring event
        with iwidgets[0]:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        time.sleep(0.2)

        # Check event is received by the second test widget
        tab2.element.click()
        with iwidgets[1]:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')
    test_create_workspace_from_catalogue.tags = ('wirecloud-selenium', 'fiware-ut-5')

    @uses_extra_resources(('Wirecloud_ParameterizedMashup_1.0.zip',), shared=True)
    def test_create_workspace_from_catalogue_using_parameters(self):

        self.login()
        self.create_workspace(mashup='ParameterizedMashup', parameters={
            'text_param': 'parameterized value',
            'password_param': 'parameterized password',
        })

        iwidget = self.get_current_iwidgets()[0]

        iwidget.open_menu().click_entry('Settings')

        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="list"]').get_attribute('value'), 'default')
        text_pref = self.driver.find_element_by_css_selector('.window_menu [name="text"]')
        self.assertEqual(text_pref.get_attribute('disabled'), 'true')
        self.assertEqual(text_pref.get_attribute('value'), 'parameterized value')

        self.assertFalse(self.driver.find_element_by_css_selector('.window_menu [name="boolean"]').is_selected())
        password_prefs = self.driver.find_elements_by_css_selector('.window_menu [name="password"]')
        self.assertEqual(len(password_prefs), 0)

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Cancel']").click()

        with iwidget:
            self.assertEqual(self.driver.find_element_by_id('listPref').text, 'default')
            self.assertEqual(self.driver.find_element_by_id('textPref').text, 'parameterized value')
            self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'false')
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, 'parameterized password')

        with self.wiring_view as wiring:
            ioperator = wiring.get_ioperators()[0]
            ioperator.element.find_element_by_css_selector('.specialIcon').click()
            WebDriverWait(self.driver, timeout=5).until(WEC.element_be_still(ioperator.element))
            ioperator.open_menu().click_entry('Settings')

            prefix_pref = self.driver.find_element_by_css_selector('.window_menu [name="prefix"]')
            self.assertEqual(prefix_pref.get_attribute('disabled'), 'true')
            self.assertEqual(prefix_pref.get_attribute('value'), 'parameterized value: ')

            self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Cancel']").click()

    def test_create_workspace_from_catalogue_duplicated_workspaces(self):

        self.login()
        self.create_workspace(name='Test Mashup')
        self.create_workspace(mashup='Test Mashup')
        self.assertNotEqual(self.get_current_workspace_name(), 'Test Mashup')
    test_create_workspace_from_catalogue_duplicated_workspaces.tags = ('wirecloud-selenium', 'fiware-ut-5')

    @uses_extra_resources(('Wirecloud_TestMashup2_1.0.zip',), shared=True)
    def test_create_workspace_from_catalogue_missing_dependencies(self):

        # Make Test and TestOperator unavailable to normuser
        test_widget = CatalogueResource.objects.get(short_name='Test')
        test_widget.public = False
        test_widget.users.clear()
        test_widget.save()

        test_operator = CatalogueResource.objects.get(short_name='TestOperator')
        test_operator.public = False
        test_operator.users.clear()
        test_operator.save()

        self.login(username='normuser')

        dependencies = (
            'Wirecloud/nonavailable-widget/1.0',
            'Wirecloud/nonavailable-operator/1.0',
            'Wirecloud/TestOperator/1.0',
            'Wirecloud/Test/1.0',
        )
        self.create_workspace(mashup='TestMashup2', expect_missing_dependencies=dependencies)
    test_create_workspace_from_catalogue_missing_dependencies.tags = ('wirecloud-selenium', 'fiware-ut-5')

    def test_merge_mashup(self):

        self.login()

        with self.wallet as wallet:
            wallet.switch_scope('Mashups')
            wallet.search('Test Mashup')
            mashup = wallet.search_in_results('Test Mashup')
            mashup.merge()

        self.assertEqual(self.count_workspace_tabs(), 3)
        tab = self.get_workspace_tab_by_name('Tab')
        self.assertIsNotNone(tab)
        tab = self.get_workspace_tab_by_name('Tab 2')
        self.assertIsNotNone(tab)
        tab = self.get_workspace_tab_by_name('Tab 2 2')
        self.assertIsNotNone(tab)

        self.assertEqual(self.count_iwidgets(), 0)

        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.driver.current_url == self.live_server_url + '/login')
    test_merge_mashup.tags = ('wirecloud-selenium', 'fiware-ut-5')

    def test_workspace_publish(self):

        self.login(username='user_with_workspaces')

        self.publish_workspace({
            'vendor': 'Wirecloud',
            'name': 'Published Workspace',
            'version': '1.0',
            'email': 'a@b.com',
        })
        with self.myresources_view as myresources:
            myresources.search('Published Workspace')
            mashup = myresources.search_in_results('Published Workspace')
            self.assertIsNotNone(mashup, 'The published workspace is not available on the local catalogue')
            myresources.uninstall_resource('Published Workspace')

    def test_workspace_publish_readonly_widgets_and_connections(self):

        self.login(username='user_with_workspaces')

        self.publish_workspace({
            'vendor': 'Wirecloud',
            'name': 'Published Workspace',
            'version': '1.0',
            'email': 'a@b.com',
            'readOnlyWidgets': True,
            'readOnlyConnectables': True,
        })
        self.create_workspace(mashup='Published Workspace')
        iwidget = self.get_current_iwidgets()[0]
        close_button = iwidget.element.find_element_by_css_selector('.icon-remove')
        self.assertTrue('disabled' in close_button.get_attribute('class'))
        close_button.click()

        with self.wiring_view:

            wiring_canvas = self.driver.find_element_by_css_selector('.grid .canvas')
            arrows = wiring_canvas.find_elements_by_css_selector('.arrow')
            self.assertEqual(len(arrows), 3)
            for arrow in arrows:
                try:
                    # The find_element_by_css_selector is needed to work around a bug in the firefox driver
                    arrow.find_element_by_css_selector('g').click()
                    self.wait_element_visible_by_css_selector('.closer', element=arrow).click()
                except:
                    pass
            arrows = wiring_canvas.find_elements_by_css_selector('.arrow')
            self.assertEqual(len(arrows), 3)

        self.assertEqual(len(self.get_current_iwidgets()), 2)

    def test_public_workspaces(self):

        # Make Test and TestOperator unavailable to emptyuser
        test_widget = CatalogueResource.objects.get(short_name='Test')
        test_widget.public = False
        test_widget.save()

        test_operator = CatalogueResource.objects.get(short_name='TestOperator')
        test_operator.public = False
        test_operator.save()

        self.login(username='emptyuser', next='/user_with_workspaces/Public Workspace')

        widget_wallet_button = self.driver.find_element_by_css_selector('.wirecloud_toolbar .icon-plus').find_element_by_xpath('..')
        self.assertIn('disabled', re.split('\s+', widget_wallet_button.get_attribute('class')))
        wiring_button = self.driver.find_element_by_css_selector('.wirecloud_toolbar .icon-puzzle-piece').find_element_by_xpath('..')
        self.assertIn('disabled', re.split('\s+', wiring_button.get_attribute('class')))
        myresources_button = self.driver.find_element_by_css_selector('.wirecloud_toolbar .icon-archive').find_element_by_xpath('..')
        self.assertNotIn('disabled', re.split('\s+', myresources_button.get_attribute('class')))
        marketplace_button = self.driver.find_element_by_css_selector('.wirecloud_toolbar .icon-shopping-cart').find_element_by_xpath('..')
        self.assertNotIn('disabled', re.split('\s+', marketplace_button.get_attribute('class')))

        # Check public workspaces cannot be renamed/removed by non owners
        self.open_menu().check(must_be_disabled=('Rename', 'Settings', 'Remove')).close()

        self.check_public_workspace()
    test_public_workspaces.tags = ('wirecloud-selenium', 'fiware-ut-18')

    def test_public_workspaces_anonymous_user(self):

        # Make Test and TestOperator unavailable to the anonymous user
        test_widget = CatalogueResource.objects.get(short_name='Test')
        test_widget.public = False
        test_widget.save()

        test_operator = CatalogueResource.objects.get(short_name='TestOperator')
        test_operator.public = False
        test_operator.save()

        url = self.live_server_url + '/user_with_workspaces/Public Workspace'
        self.driver.get(url)
        self.wait_wirecloud_ready()

        self.assertRaises(NoSuchElementException, self.driver.find_element_by_css_selector, '.wirecloud_toolbar .icon-plus')
        self.assertRaises(NoSuchElementException, self.driver.find_element_by_css_selector, '.wirecloud_toolbar .icon-puzzle-piece')
        self.assertRaises(NoSuchElementException, self.driver.find_element_by_css_selector, '.wirecloud_toolbar .icon-archive')
        self.assertRaises(NoSuchElementException, self.driver.find_element_by_css_selector, '.wirecloud_toolbar .icon-shopping-cart')

        self.check_public_workspace()

        sign_in_button = self.driver.find_element_by_css_selector('#wirecloud_header .user_menu_wrapper .styled_button, #wirecloud_header .arrow-down-settings')
        if sign_in_button.text != 'Sign in':
            # Oiltheme
            sign_in_button.click()
            popup_menu_element = self.wait_element_visible_by_css_selector('.se-popup-menu')
            popup_menu = PopupMenuTester(self, popup_menu_element)
            popup_menu.click_entry('Sign in')
        else:
            sign_in_button.click()

        username_input = self.wait_element_visible_by_css_selector('#id_username')
        self.fill_form_input(username_input, 'user_with_workspaces')
        password_input = self.driver.find_element_by_id('id_password')
        self.fill_form_input(password_input, 'admin')
        password_input.submit()

        self.wait_wirecloud_ready()
        self.assertEqual(self.get_current_workspace_name(), 'Public Workspace')
    test_public_workspaces_anonymous_user.tags = ('wirecloud-selenium', 'fiware-ut-18')

    def test_embedded_view(self):

        mashup_url = self.live_server_url + '/user_with_workspaces/Public Workspace?mode=embedded'
        iframe_test_path = os.path.join(self.shared_test_data_dir, 'iframe_test.html')
        iframe_test_url = urljoin('file:', pathname2url(iframe_test_path))
        self.driver.get(iframe_test_url)

        # Load Wirecloud using the iframe element
        self.driver.execute_script("document.getElementById('iframe').src = arguments[0]", mashup_url)

        # Swicth to Wirecloud's iframe
        iframe = self.driver.find_element_by_id('iframe')
        self.driver.switch_to.frame(iframe)
        self.wait_wirecloud_ready()
        self.check_public_workspace(frame_id='iframe')
    test_embedded_view.tags = ('wirecloud-selenium', 'fiware-ut-18')

    def check_public_workspace(self, frame_id=None):
        # Check iwidget are loaded correctly
        iwidgets = self.get_current_iwidgets()
        self.assertEqual(len(iwidgets), 2)
        source_iwidget = iwidgets[1]
        target_iwidget = iwidgets[0]
        self.assertIsNotNone(source_iwidget.element)
        self.assertIsNotNone(target_iwidget.element)

        source_iwidget.open_menu().check(must_be_disabled=('Rename', 'Settings', 'Full Dragboard', 'Extract from grid'))
        target_iwidget.open_menu().check(must_be_disabled=('Rename', 'Settings', 'Full Dragboard', 'Extract from grid'))

        tab = self.get_workspace_tab_by_name('Tab')
        self.assertRaises(NoSuchElementException, tab.element.find_element_by_css_selector, '.icon-tab-menu')

        self.assertRaises(NoSuchElementException, self.driver.find_element_by_css_selector, '.icon-add-tab')

        # Check wiring works
        with source_iwidget:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        # Work around selenium not being able to go to the parent frame
        if frame_id is not None:
            self.driver.switch_to.frame(self.driver.find_element_by_id(frame_id))

        with target_iwidget:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

    def test_browser_navigation_history_management(self):

        self.login(username='user_with_workspaces')

        with self.wiring_view:
            pass
        with self.marketplace_view:
            pass

        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')

        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'marketplace')
        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')
        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'wiring')
        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')
        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.driver.current_url == self.live_server_url + '/login')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')
        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'wiring')
        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')
        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'marketplace')

    def test_browser_workspace_navigation(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        # Fill navigation history
        tab = self.get_workspace_tab_by_name('Tab 2')
        tab.element.click()

        self.change_current_workspace('ExistingWorkspace')
        self.assertEqual(self.get_current_workspace_tab().name, 'OtherTab')

        tab = self.get_workspace_tab_by_name('ExistingTab')
        tab.element.click()

        self.myresources_view.__enter__()

        # Check navigation history has been filled correctly
        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.get_current_view() == 'workspace')
        self.assertEqual(self.get_current_workspace_tab().name, 'ExistingTab')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(WEC.workspace_tab_name(self, 'OtherTab'))
        self.assertEqual(self.get_current_workspace_name(), 'ExistingWorkspace')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(WEC.workspace_name(self, 'Pending Events'))
        self.assertEqual(self.get_current_workspace_tab().name, 'Tab 2')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(WEC.workspace_tab_name(self, 'Tab 1'))

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.driver.current_url == self.live_server_url + '/login?next=/user_with_workspaces/Pending%20Events')

        # Replay navigation history
        self.driver.forward()
        self.wait_wirecloud_ready()
        self.assertEqual(self.get_current_workspace_name(), 'Pending Events')
        self.assertEqual(self.get_current_workspace_tab().name, 'Tab 1')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(WEC.workspace_tab_name(self, 'Tab 2'))

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(WEC.workspace_tab_name(self, 'OtherTab'))

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(WEC.workspace_tab_name(self, 'ExistingTab'))

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.get_current_view() == 'myresources')

    def test_browser_workspace_initial_tab(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events#tab=Tab 2')
        self.assertEqual(self.get_current_workspace_tab().name, 'Tab 2')

        # Now test using an invalid tab name
        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events#tab=Tab 4')
        self.assertEqual(self.get_current_workspace_tab().name, 'Tab 1')

    def test_browser_navigation_from_renamed_tab(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        initial_workspace_tab = self.get_current_workspace_tab()
        initial_workspace_tab_name = initial_workspace_tab.name

        next_tab = self.get_workspace_tab_by_name('Tab 2')
        next_tab.element.click()
        next_tab.rename('NewName')

        initial_workspace_tab.element.click()

        self.driver.back()
        WebDriverWait(self.driver, 5).until(WEC.workspace_tab_name(self, 'NewName'))

        self.driver.back()
        WebDriverWait(self.driver, 5).until(WEC.workspace_tab_name(self, initial_workspace_tab_name))

        # Navigation history should be replayable
        self.driver.forward()
        WebDriverWait(self.driver, 5).until(WEC.workspace_tab_name(self, 'NewName'))

        self.driver.forward()
        WebDriverWait(self.driver, 5).until(WEC.workspace_tab_name(self, initial_workspace_tab_name))

    def test_browser_navigation_from_renamed_workspace(self):

        self.login(username='user_with_workspaces')

        initial_workspace = self.get_current_workspace_name()

        self.change_current_workspace('Pending Events')
        self.rename_workspace('New Name')

        self.change_current_workspace('ExistingWorkspace')

        # Check navigation history has been filled correctly
        self.driver.back()
        WebDriverWait(self.driver, 5).until(WEC.workspace_name(self, 'New Name'))

        self.driver.back()
        WebDriverWait(self.driver, 5).until(WEC.workspace_name(self, initial_workspace))

        # Navigation history should be replayable
        self.driver.forward()
        WebDriverWait(self.driver, 5).until(WEC.workspace_name(self, 'New Name'))

        self.driver.forward()
        WebDriverWait(self.driver, 5).until(WEC.workspace_name(self, 'ExistingWorkspace'))

    def test_browser_navigation_to_deleted_workspace(self):

        self.login(username='user_with_workspaces')

        self.change_current_workspace('Pending Events')
        self.remove_workspace()

        self.assertEqual(self.get_current_workspace_name(), 'ExistingWorkspace')

        self.driver.back()
        WebDriverWait(self.driver, 5).until(WEC.workspace_name(self, 'Pending Events'))

        widget_wallet_button = self.driver.find_element_by_css_selector('.wirecloud_toolbar .icon-plus').find_element_by_xpath('..')
        self.assertIn('disabled', re.split('\s+', widget_wallet_button.get_attribute('class')))
        wiring_button = self.driver.find_element_by_css_selector('.wirecloud_toolbar .icon-puzzle-piece').find_element_by_xpath('..')
        self.assertIn('disabled', re.split('\s+', wiring_button.get_attribute('class')))

        self.driver.back()
        WebDriverWait(self.driver, 5).until(WEC.workspace_name(self, 'Workspace'))

        widget_wallet_button = self.driver.find_element_by_css_selector('.wirecloud_toolbar .icon-plus').find_element_by_xpath('..')
        self.assertNotIn('disabled', re.split('\s+', widget_wallet_button.get_attribute('class')))
        wiring_button = self.driver.find_element_by_css_selector('.wirecloud_toolbar .icon-puzzle-piece').find_element_by_xpath('..')
        self.assertNotIn('disabled', re.split('\s+', wiring_button.get_attribute('class')))

    def assertElementHasFocus(self, element):
        # Workaround webkit problem with xhtml and retreiving element with focus
        if self.driver.capabilities['browserName'] == 'chrome':
            return
        focused_element = self.driver.switch_to.active_element.find_element_by_tag_name('span')
        self.assertEqual(element, focused_element)

    def test_gui_tutorials(self):

        self.login(username='emptyuser')

        self.driver.find_element_by_css_selector('#wirecloud_header .user_menu_wrapper .styled_button, #wirecloud_header .arrow-down-settings').click()
        popup_menu_element = self.wait_element_visible_by_css_selector('.se-popup-menu')
        popup_menu = PopupMenuTester(self, popup_menu_element)
        popup_menu.click_entry(('Tutorials', 'Basic concepts'))
        next_button = self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Next']")
        self.assertElementHasFocus(next_button)
        next_button.click()

        next_button = self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Next']")
        self.assertElementHasFocus(next_button)
        next_button.click()

        WebDriverWait(self.driver, 5).until(WEC.workspace_name(self, 'Basic concepts tutorial'))
        next_button = self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Next']")
        self.assertElementHasFocus(next_button)
        next_button.click()

        WebDriverWait(self.driver, 10).until(WEC.element_be_clickable((By.CSS_SELECTOR, '#wirecloud_header .wirecloud_toolbar .icon-plus')))
        with self.wallet as wallet:
            time.sleep(1)

            # Add the youtube browser widget
            def youtube_instantiable(driver):
                resource = wallet.search_in_results('YouTube Browser')
                return resource is not None and WEC.element_be_clickable((By.CSS_SELECTOR, '.mainbutton'), base_element=resource.element)(driver)
            WebDriverWait(self.driver, 10).until(youtube_instantiable).click()

            next_button = self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Next']")
            self.assertElementHasFocus(next_button)
            next_button.click()

            # Add the input box widget
            time.sleep(1)

            def input_box_instantiable(driver):
                resource = wallet.search_in_results('Input Box')
                return resource is not None and WEC.element_be_clickable((By.CSS_SELECTOR, '.mainbutton'), base_element=resource.element)(driver)
            WebDriverWait(self.driver, 10).until(input_box_instantiable).click()

            WebDriverWait(self.driver, 10).until(WEC.element_be_clickable((By.CSS_SELECTOR, '.widget_wallet .icon-remove')))

        # cancel current tutorial
        self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Cancel']").click()

        window_menues = self.driver.find_elements_by_css_selector('.window_menu')
        self.assertEqual(len(window_menues), 1)
    test_gui_tutorials.tags = ('wirecloud-selenium', 'fiware-ut-15')

    def test_move_widget_and_restore(self):

        self.login(username="user_with_workspaces")

        iwidgets = self.get_current_iwidgets()

        self.assertEqual(iwidgets[0].layout_position, (0, 0))
        self.assertEqual(iwidgets[1].layout_position, (6, 0))

        self.driver.execute_script('''
            var layout = Wirecloud.activeWorkspace.getActiveDragboard().baseLayout;
            var iwidget = Wirecloud.activeWorkspace.getIWidget(%s);
            layout.initializeMove(iwidget);
            layout.moveTemporally(6, 1);
            layout.acceptMove();
        ''' % iwidgets[0].id);

        self.assertEqual(iwidgets[0].layout_position, (6, 0))
        self.assertEqual(iwidgets[1].layout_position, (6, 24))

        self.driver.execute_script('''
            var layout = Wirecloud.activeWorkspace.getActiveDragboard().baseLayout;
            var iwidget = Wirecloud.activeWorkspace.getIWidget(%s);
            layout.initializeMove(iwidget);
            layout.moveTemporally(0, 0);
            layout.acceptMove();
        ''' % iwidgets[0].id);

        self.assertEqual(iwidgets[0].layout_position, (0, 0))
        self.assertEqual(iwidgets[1].layout_position, (6, 0))

    test_move_widget_and_restore.tags = ('wirecloud-selenium', 'dragboard')

    @uses_extra_resources(('Wirecloud_context-inspector_0.5.wgt',), shared=True)
    def test_basic_add_and_move_widget(self):

        self.login(username="admin")

        with self.wallet as wallet:
            resource = wallet.search_in_results('Context Inspector')
            widget1 = resource.instantiate()
            widget2 = resource.instantiate()

        initial_widget1_position = widget1.layout_position
        with widget1:
            position_from_context = (
                int(self.driver.find_element_by_css_selector('[data-name="xPosition"] .content').text),
                int(self.driver.find_element_by_css_selector('[data-name="yPosition"] .content').text),
            )
            self.assertEqual(position_from_context, initial_widget1_position)
            initial_widget1_xPosition_changes = self.driver.find_element_by_css_selector('[data-name="xPosition"] .badge').text
            initial_widget1_yPosition_changes = self.driver.find_element_by_css_selector('[data-name="yPosition"] .badge').text

        with widget2:
            initial_widget2_xPosition_changes = self.driver.find_element_by_css_selector('[data-name="xPosition"] .badge').text
            self.assertEqual(initial_widget2_xPosition_changes, '0')

            initial_widget2_yPosition_changes = self.driver.find_element_by_css_selector('[data-name="yPosition"] .badge').text
            self.assertEqual(initial_widget2_yPosition_changes, '0')

        # Move widget2 without affecting widget1
        self.driver.execute_script('''
            var layout = Wirecloud.activeWorkspace.getActiveDragboard().baseLayout;
            var iwidget = Wirecloud.activeWorkspace.getIWidget(%s);
            layout.initializeMove(iwidget);
            layout.moveTemporally(1, 0);
            layout.acceptMove();
        ''' % widget2.id);

        self.assertEqual(widget1.layout_position, initial_widget1_position)
        self.assertEqual(widget2.layout_position, (1, 0))

        with widget1:
            xPosition_changes = self.driver.find_element_by_css_selector('[data-name="xPosition"] .badge').text
            self.assertEqual(xPosition_changes, initial_widget1_xPosition_changes)

            yPosition_changes = self.driver.find_element_by_css_selector('[data-name="yPosition"] .badge').text
            self.assertEqual(yPosition_changes, initial_widget1_yPosition_changes)

            height_changes = self.driver.find_element_by_css_selector('[data-name="heightInPixels"] .badge').text
            self.assertEqual(height_changes, "0")

            width_changes = self.driver.find_element_by_css_selector('[data-name="widthInPixels"] .badge').text
            self.assertEqual(height_changes, "0")

        with widget2:
            xPosition_changes = self.driver.find_element_by_css_selector('[data-name="xPosition"] .badge').text
            self.assertEqual(xPosition_changes, text_type(int(initial_widget2_xPosition_changes) + 1))

            yPosition_changes = self.driver.find_element_by_css_selector('[data-name="yPosition"] .badge').text
            self.assertEqual(yPosition_changes, initial_widget2_yPosition_changes)

            height_changes = self.driver.find_element_by_css_selector('[data-name="heightInPixels"] .badge').text
            self.assertEqual(height_changes, "0")

            width_changes = self.driver.find_element_by_css_selector('[data-name="widthInPixels"] .badge').text
            self.assertEqual(height_changes, "0")

    test_basic_add_and_move_widget.tags = ('wirecloud-selenium', 'dragboard')

    def test_move_widget_interchange(self):

        self.login(username="user_with_workspaces")

        iwidgets = self.get_current_iwidgets()

        self.assertEqual(iwidgets[0].layout_position, (0, 0))
        self.assertEqual(iwidgets[1].layout_position, (6, 0))

        self.driver.execute_script('''
            var layout = Wirecloud.activeWorkspace.getActiveDragboard().baseLayout;
            var iwidget = Wirecloud.activeWorkspace.getIWidget(%s);
            layout.initializeMove(iwidget);
            layout.moveTemporally(6, 25);
            layout.acceptMove();
        ''' % iwidgets[0].id);

        self.assertEqual(iwidgets[0].layout_position, (6, 24))
        self.assertEqual(iwidgets[1].layout_position, (6, 0))

        self.driver.execute_script('''
            var layout = Wirecloud.activeWorkspace.getActiveDragboard().baseLayout;
            var iwidget = Wirecloud.activeWorkspace.getIWidget(%s);
            layout.initializeMove(iwidget);
            layout.moveTemporally(0, 0);
            layout.acceptMove();
        ''' % iwidgets[1].id);

        self.assertEqual(iwidgets[0].layout_position, (6, 0))
        self.assertEqual(iwidgets[1].layout_position, (0, 0))

    test_move_widget_interchange.tags = ('wirecloud-selenium', 'dragboard')

    @uses_extra_resources(('Wirecloud_context-inspector_0.5.wgt',), shared=True)
    def test_basic_layout_parameter_change(self):

        self.login(username="admin")

        with self.wallet as wallet:
            resource = wallet.search_in_results('Context Inspector')
            widget = resource.instantiate()

        # Check initial sizes
        with widget:
            old_width_from_context = int(self.driver.find_element_by_css_selector('[data-name="width"] .content').text)
            self.assertEqual(old_width_from_context, 6)

        # Change layout type (to gridlayout)
        self.open_menu().click_entry('Settings')
        workspace_preferences_dialog = self.wait_element_visible_by_css_selector('.window_menu.workspace_preferences')

        workspace_preferences_dialog.find_element_by_css_selector('.icon-cogs').click()
        layout_settings_dialog = self.wait_element_visible_by_css_selector('.window_menu.layout_settings')
        columns_input = layout_settings_dialog.find_element_by_css_selector('[name="columns"]')
        self.fill_form_input(columns_input, '10')
        layout_settings_dialog.find_element_by_xpath("//*[text()='Accept']").click()

        workspace_preferences_dialog.find_element_by_xpath("//*[text()='Save']").click()

        # Check new sizes
        with widget:
            width_changes = self.driver.find_element_by_css_selector('[data-name="width"] .badge').text
            self.assertEqual(width_changes, '1')
            height_changes = self.driver.find_element_by_css_selector('[data-name="height"] .badge').text
            self.assertEqual(height_changes, '0')

            new_width_from_context = self.driver.find_element_by_css_selector('[data-name="width"] .content').text
            self.assertEqual(new_width_from_context, '3')

            width_in_pixels_changes = self.driver.find_element_by_css_selector('[data-name="widthInPixels"] .badge').text
            self.assertEqual(width_in_pixels_changes, '0')
            height_in_pixels_changes = self.driver.find_element_by_css_selector('[data-name="heightInPixels"] .badge').text
            self.assertEqual(height_in_pixels_changes, '0')

    test_basic_layout_parameter_change.tags = ('wirecloud-selenium', 'dragboard')

    @uses_extra_resources(('Wirecloud_context-inspector_0.5.wgt',), shared=True)
    def test_layout_type_change(self):

        self.login(username="admin")

        with self.wallet as wallet:
            resource = wallet.search_in_results('Context Inspector')
            widget = resource.instantiate()

        # Check initial sizes
        with widget:
            old_size_from_context = (
                int(self.driver.find_element_by_css_selector('[data-name="width"] .content').text),
                int(self.driver.find_element_by_css_selector('[data-name="height"] .content').text),
            )
            old_size_in_pixels_from_context = (
                int(self.driver.find_element_by_css_selector('[data-name="widthInPixels"] .content').text),
                int(self.driver.find_element_by_css_selector('[data-name="heightInPixels"] .content').text),
            )
            self.assertEqual(old_size_from_context[0], 6)

        # Change layout columns
        self.open_menu().click_entry('Settings')
        workspace_preferences_dialog = self.wait_element_visible_by_css_selector('.window_menu.workspace_preferences')
        layout_type_select = Select(workspace_preferences_dialog.find_element_by_css_selector('[name="baselayout-type"]'))
        layout_type_select.select_by_value('gridlayout')
        workspace_preferences_dialog.find_element_by_xpath("//*[text()='Save']").click()

        # Check new sizes
        with widget:
            new_size_from_context = (
                int(self.driver.find_element_by_css_selector('[data-name="width"] .content').text),
                int(self.driver.find_element_by_css_selector('[data-name="height"] .content').text),
            )
            new_size_in_pixels_from_context = (
                int(self.driver.find_element_by_css_selector('[data-name="widthInPixels"] .content').text),
                int(self.driver.find_element_by_css_selector('[data-name="heightInPixels"] .content').text),
            )
            self.assertEqual(new_size_from_context[0], old_size_from_context[0])
            self.assertNotEqual(new_size_from_context[1], old_size_from_context[1])
            self.assertEqual(new_size_in_pixels_from_context[0], old_size_in_pixels_from_context[0])

    test_layout_type_change.tags = ('wirecloud-selenium', 'dragboard')


@wirecloud_selenium_test_case
class BasicMobileSeleniumTests(MobileWirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'mobile')

    def check_basic_workspace(self, frame_id=None):

        iwidget_icons = self.driver.find_elements_by_css_selector('.iwidget_item')

        # Send event from Test 2 as it is the one connected to the test operator
        iwidget_icons[1].click()
        source_iwidget = self.get_current_iwidgets()[1]

        with source_iwidget:
            check_default_settings_values(self)

            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, 'hello world!!')
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()

        self.driver.find_element_by_css_selector('.dragboard .toolbar .back_button > .menu_text').click()
        time.sleep(0.2)

        iwidget_icons[0].click()
        target_iwidget = self.get_current_iwidgets()[0]

        with target_iwidget:

            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text != '')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')

    def test_basic_widget_functionalities(self):

        self.login(username='user_with_workspaces')
        self.wait_element_visible_by_css_selector('.iwidget_item')

        self.check_basic_workspace()

    def test_public_workspaces(self):

        self.login(username='emptyuser', next='/user_with_workspaces/Public Workspace')
        self.wait_element_visible_by_css_selector('.iwidget_item')

        self.check_basic_workspace()
