# -*- coding: utf-8 -*-

# Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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


import time

from selenium.webdriver.support.ui import WebDriverWait

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.testcases import uses_extra_resources, WirecloudSeleniumTestCase


class BasicSeleniumTests(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')

    def test_basic_workspace_operations(self):

        self.login()

        # We need atleast one Workspace, so we cannot delete current workspace
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.check_popup_menu(('Rename', 'Settings', 'New workspace', 'Upload to local catalogue'), ('Remove',))

        self.create_workspace('Test')

        # Now we have two workspaces so we can remove any of them
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.check_popup_menu(('Rename', 'Settings', 'New workspace', 'Upload to local catalogue', 'Remove'), ())

        self.rename_workspace('test2')
        tab = self.get_workspace_tab_by_name('Tab')

        # Only one tab => we cannot remove it
        tab_menu_button = tab.find_element_by_css_selector('.icon-tab-menu')
        tab_menu_button.click()
        self.check_popup_menu(('Rename',), must_be_disabled=('Remove',))

        new_tab = self.add_tab()

        # Now we have two tabs so we can remove any of them
        tab_menu_button = tab.find_element_by_css_selector('.icon-tab-menu')
        tab_menu_button.click()
        self.check_popup_menu(must_be=('Rename', 'Remove'))

        new_tab.click()
        tab_menu_button = new_tab.find_element_by_css_selector('.icon-tab-menu')
        tab_menu_button.click()
        self.check_popup_menu(must_be=('Rename', 'Remove'))

        # Remove the recently created one
        self.popup_menu_click('Remove')
        self.wait_wirecloud_ready()
        self.assertEqual(len(self.driver.find_elements_by_css_selector('#workspace .tab_wrapper .tab')), 1)

        self.remove_workspace()

        # Now we have only one workspace, so we cannot remove it
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.check_popup_menu(('Rename', 'Settings', 'New workspace'), ('Remove',))
    test_basic_workspace_operations.tags = ('fiware-ut-5',)

    def test_add_widget_from_catalogue(self):

        self.login()
        self.add_widget_to_mashup('Test')
    test_add_widget_from_catalogue.tags = ('fiware-ut-5',)

    def test_remove_widget_from_workspace(self):

        self.login(username='user_with_workspaces')

        iwidget = self.get_current_iwidgets()[0]
        iwidget.remove()
    test_remove_widget_from_workspace.tags = ('fiware-ut-5',)

    def test_read_only_widgets_cannot_be_removed(self):

        self.login(username='user_with_workspaces')

        self.change_current_workspace('Pending Events')

        tab = self.get_workspace_tab_by_name('Tab 2')
        tab.click()

        iwidget = self.get_current_iwidgets()[1]
        iwidget.wait_loaded()
        close_button = iwidget.element.find_element_by_css_selector('.icon-remove')
        self.assertTrue('disabled' in close_button.get_attribute('class'))

    def test_tabs_with_read_only_widgets_cannot_be_removed(self):

        self.login(username='user_with_workspaces')

        self.change_current_workspace('Pending Events')

        tab = self.get_workspace_tab_by_name('Tab 2')
        tab.click()
        tab_menu_button = self.wait_element_visible_by_css_selector('.icon-tab-menu', element=tab)
        tab_menu_button.click()
        self.check_popup_menu(must_be_disabled=('Remove',))

    def test_widget_reload(self):

        self.login(username='user_with_workspaces')

        iwidget = self.get_current_iwidgets()[0]

        with iwidget:

            last_received_event_field = self.driver.find_element_by_id('wiringOut')
            self.driver.execute_script('arguments[0].textContent = "hello world!!";', last_received_event_field);

        iwidget.perform_action('Reload')

        with iwidget:
            last_received_event_field = self.wait_element_visible_by_id('wiringOut')
            self.assertEqual(last_received_event_field.text, '')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_basic_widget_functionalities(self):

        self.login(username='user_with_workspaces')
        iwidget = self.get_current_iwidgets()[0]
        api_test_iwidget = self.add_widget_to_mashup('Wirecloud API test')

        with iwidget:
            self.assertEqual(self.driver.find_element_by_id('listPref').text, 'default')
            self.assertEqual(self.driver.find_element_by_id('textPref').text, 'initial text')
            self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'false')
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, 'default')

        # Open widget settings
        iwidget.perform_action('Settings')

        # Check dialog shows correct values
        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="list"]').get_attribute('value'), 'default')
        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="text"]').get_attribute('value'), 'initial text')
        self.assertFalse(self.driver.find_element_by_css_selector('.window_menu [name="boolean"]').is_selected())
        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="password"]').get_attribute('value'), 'default')

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

        # Open widget settings again
        iwidget.perform_action('Settings')

        # Check dialog shows correct values
        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="list"]').get_attribute('value'), '1')
        self.assertEqual(self.driver.find_element_by_css_selector('.window_menu [name="text"]').get_attribute('value'), 'test')
        self.assertTrue(self.driver.find_element_by_css_selector('.window_menu [name="boolean"]').is_selected())
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
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, '')

        # Use api test widget to test other API features

        # Open widget settings again
        api_test_iwidget.perform_action('Settings')

        text_input = self.driver.find_element_by_css_selector('.window_menu [name="text"]')
        self.fill_form_input(text_input, 'Success!!')

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        with api_test_iwidget:
            self.assertEqual(self.driver.find_element_by_id('pref_registercallback_test').text, 'Success!!')
            self.assertEqual(self.driver.find_element_by_id('makerequest_test').text, 'Success!!')
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

    test_basic_widget_functionalities.tags = ('fiware-ut-5',)

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
        tab.click()

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
        self.create_workspace('Test')

        self.driver.refresh()
        self.wait_wirecloud_ready()

        self.assertEqual(self.get_current_workspace_name(), 'Test')

        # Add a new tab
        self.add_tab()

        self.driver.refresh()
        self.wait_wirecloud_ready()

        tabs = len(self.driver.find_elements_by_css_selector('#workspace .tab_wrapper .tab'))
        self.assertEqual(tabs, 2)

        tab = self.get_workspace_tab_by_name('Tab')

        # Rename the created tab
        tab_menu_button = tab.find_element_by_css_selector('.icon-tab-menu')
        tab_menu_button.click()
        self.popup_menu_click('Rename')
        tab_name_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input')
        self.fill_form_input(tab_name_input, 'Other Name')
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()
        self.wait_wirecloud_ready()

        self.driver.refresh()
        self.wait_wirecloud_ready()

        self.assertEqual(self.count_workspace_tabs(), 2)
        tab = self.get_workspace_tab_by_name('Other Name')
        self.assertIsNotNone(tab)
        tab = self.get_workspace_tab_by_name('Tab')
        self.assertIsNone(tab)

        # Add two widgets to the mashup
        self.add_widget_to_mashup('Test')
        self.add_widget_to_mashup('Test')

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
        tab_menu_button = tab.find_element_by_css_selector('.icon-tab-menu')
        tab_menu_button.click()
        self.popup_menu_click('Remove')
        self.wait_wirecloud_ready()

        self.driver.refresh()
        self.wait_wirecloud_ready()

        self.assertEqual(self.count_workspace_tabs(), 1)
        self.assertEqual(self.count_iwidgets(), 0)
    test_http_cache.tags = ('fiware-ut-5',)

    def test_create_workspace_from_catalogue(self):

        self.login()
        self.create_workspace_from_catalogue('Test Mashup')

        # Test that wiring works as expected
        tab = self.get_workspace_tab_by_name('Tab')
        tab2 = self.get_workspace_tab_by_name('Tab 2')

        # Load tab2
        tab2.click()
        tab.click()

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
        tab2.click()
        with iwidgets[1]:
            try:
                WebDriverWait(self.driver, timeout=30).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')
            except:
                pass

            text_div = self.driver.find_element_by_id('wiringOut')
            self.assertEqual(text_div.text, 'hello world!!')
    test_create_workspace_from_catalogue.tags = ('fiware-ut-5',)

    @uses_extra_resources(('Wirecloud_ParameterizedMashup_1.0.zip',), shared=True)
    def test_create_workspace_from_catalogue_using_parameters(self):

        self.login()
        self.create_workspace_from_catalogue('ParameterizedMashup', parameters={
            'text_param': 'parameterized value',
            'password_param': 'parameterized password',
        })

        iwidget = self.get_current_iwidgets()[0]

        iwidget.perform_action('Settings')

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

        self.change_main_view('wiring')

        ioperator = self.get_current_wiring_editor_ioperators()[0]
        ioperator.element.find_element_by_css_selector('.specialIcon').click()
        self.wait_element_visible_by_css_selector('.editPos_button', element=ioperator.element).click()
        self.popup_menu_click('Settings')

        prefix_pref = self.driver.find_element_by_css_selector('.window_menu [name="prefix"]')
        self.assertEqual(prefix_pref.get_attribute('disabled'), 'true')
        self.assertEqual(prefix_pref.get_attribute('value'), 'parameterized value: ')

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Cancel']").click()

    def test_create_workspace_from_catalogue_duplicated_workspaces(self):

        self.login()
        self.create_workspace('Test Mashup')
        self.create_workspace_from_catalogue('Test Mashup')
        self.assertNotEqual(self.get_current_workspace_name(), 'Test Mashup')
    test_create_workspace_from_catalogue_duplicated_workspaces.tags = ('fiware-ut-5',)

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
        self.create_workspace_from_catalogue('TestMashup2', expect_missing_dependencies=dependencies)
    test_create_workspace_from_catalogue_missing_dependencies.tags = ('fiware-ut-5')

    def test_merge_mashup(self):

        self.login()
        self.merge_mashup_from_catalogue('Test Mashup')

        self.assertEqual(self.count_workspace_tabs(), 3)
        tab = self.get_workspace_tab_by_name('Tab')
        self.assertIsNotNone(tab)
        tab = self.get_workspace_tab_by_name('Tab 2')
        self.assertIsNotNone(tab)
        tab = self.get_workspace_tab_by_name('Tab 2 2')
        self.assertIsNotNone(tab)

        self.assertEqual(self.count_iwidgets(), 0)
    test_merge_mashup.tags = ('fiware-ut-5',)

    def test_workspace_publish(self):

        self.login(username='user_with_workspaces')

        self.publish_workspace({
            'vendor': 'Wirecloud',
            'name': 'Published Workspace',
            'version': '1.0',
            'email': 'a@b.com',
        })
        self.search_resource('Published Workspace')
        mashup = self.search_in_catalogue_results('Published Workspace')
        self.assertIsNotNone(mashup, 'The published workspace is not available on the local catalogue')

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
        self.create_workspace_from_catalogue('Published Workspace')
        iwidget = self.get_current_iwidgets()[0]
        close_button = iwidget.element.find_element_by_css_selector('.icon-remove')
        self.assertTrue('disabled' in close_button.get_attribute('class'))
        close_button.click()

        self.change_main_view('wiring')

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

        self.change_main_view('workspace')

        self.assertEqual(len(self.get_current_iwidgets()), 2)

    def test_browser_navigation_history_management(self):

        self.login(username='user_with_workspaces')

        self.change_main_view('wiring')
        self.change_main_view('marketplace')
        self.change_main_view('wiring')

        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'marketplace')
        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'wiring')
        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')
        self.driver.back()
        self.assertEqual(self.driver.current_url, self.live_server_url + '/login')
