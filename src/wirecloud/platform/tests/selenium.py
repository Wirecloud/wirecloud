# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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
import unittest
from urllib.parse import urljoin

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.touch_actions import TouchActions
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils import expected_conditions as WEC
from wirecloud.commons.utils.remote import ButtonTester, FieldTester, FormModalTester, FormTester, PopupMenuTester
from wirecloud.commons.utils.testcases import uses_extra_resources, uses_extra_workspace, WirecloudSeleniumTestCase, wirecloud_selenium_test_case


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


def check_default_settings_values(test):

    test.assertEqual(test.driver.find_element_by_id('listPref').text, 'default')
    test.assertEqual(test.driver.find_element_by_id('textPref').text, 'initial text')
    test.assertEqual(test.driver.find_element_by_id('booleanPref').text, 'false')
    test.assertEqual(test.driver.find_element_by_id('numberPref').text, '2')
    test.assertEqual(test.driver.find_element_by_id('passwordPref').text, 'default')


@wirecloud_selenium_test_case
class BasicSeleniumTests(WirecloudSeleniumTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-selenium', 'wirecloud-basics-selenium')
    populate = False

    def test_basic_workspace_operations(self):

        self.login(username="admin", next="/admin/Workspace")

        # admin only have one workspace, but WireCloud should allow any workspace operation
        self.open_menu().check(('New workspace', 'Upload to my resources', 'Remove', 'Share', 'Embed')).close()

        self.create_workspace('Test')

        # Now we have two workspaces, nothing should change except that now we are on edit mode
        with self.edit_mode as edit_session:
            self.open_menu().check(('Rename', 'Settings', 'New workspace', 'Upload to my resources', 'Remove', 'Share', 'Embed'), ()).close()
            self.rename_workspace('test2')
            tab = self.find_tab(title="Tab")

            # Only one tab => we cannot remove it
            tab.show_preferences().check(('Rename',), must_be_disabled=('Remove',))

            new_tab = self.create_tab()

            # Now we have two tabs so we can remove any of them
            tab.show_preferences().check(must_be=('Rename', 'Remove'))
            new_tab.click()
            new_tab.show_preferences().check(must_be=('Rename', 'Remove')).close()

            # Remove the recently created one (no confirmation needed as the tab is empty)
            new_tab.remove()

        self.remove_workspace()

        # We should be in the wirecloud/home dashboard after removing a workspace
        self.assertEqual(self.get_current_workspace_name(), 'home')

        # Admin is not the owner of this workspace, so WireCloud should not
        # allow him to edit it
        # (the admin user can edit this workspace, but it show switch to the
        # wirecloud org first)
        self.open_menu().check(('New workspace',), must_be_disabled=('Rename', 'Settings', 'Remove'))

    def test_move_iwidget_between_tabs(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/pending-events')

        src_iwidget_count = len(self.find_tab(id="102").widgets)
        dst_iwidget_count = len(self.find_tab(id="103").widgets)

        iwidget = self.find_tab(id="102").widgets[0]

        tab = self.find_tab(title='Tab 2')
        with self.edit_mode as edit_session:
            ActionChains(self.driver).click_and_hold(iwidget.title_element).move_to_element(tab.element).release().perform()

            self.assertEqual(len(self.find_tab(id="102").widgets), src_iwidget_count - 1)
            self.assertEqual(len(self.find_tab(id="103").widgets), dst_iwidget_count + 1)
    test_move_iwidget_between_tabs.tags = tags + ('wirecloud-dragboard',)

    def test_create_widget_from_component_sidebar(self):
        self.login(username="admin", next="/admin/Workspace")
        self.create_widget("Test")

    def test_remove_widget_from_workspace(self):
        self.login(username="user_with_workspaces", next="/user_with_workspaces/Workspace")
        with self.edit_mode as edit_session:
            self.find_widget(title="Test 1").remove()

    def test_remove_tab_from_workspace(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/pending-events')

        with self.edit_mode as edit_session:
            self.find_tab(title="Tab 1").remove()
            with edit_session.wiring_view as wiring:
                self.assertIsNone(wiring.find_draggable_component('widget', title="Test 1"))

    def test_tabs_with_read_only_widgets_cannot_be_removed(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/pending-events')

        with self.edit_mode as edit_session:
            tab = self.find_tab(title="Tab 2")
            tab.show_preferences().check(must_be_disabled=('Remove',))

            tab.click()
            tab_widget = tab.find_widget(title="Test 2")
            self.assertTrue(tab_widget.remove_button.is_disabled)

    def test_refresh_widget(self):
        self.login(username="user_with_workspaces", next="/user_with_workspaces/Workspace")

        with self.edit_mode as edit_session:
            tab_widget = self.find_widget(title="Test 1")
            with tab_widget:
                last_received_event_field = self.driver.find_element_by_id('wiringOut')
                self.driver.execute_script('arguments[0].textContent = "hello world!!";', last_received_event_field)

            tab_widget.reload().wait_loaded()

        with tab_widget:
            last_received_event_field = self.wait_element_visible('#wiringOut')
            self.assertEqual(last_received_event_field.text, '')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_basic_widget_functionalities(self):

        self.login(username="user_with_workspaces", next="/user_with_workspaces/Workspace")
        with self.edit_mode as edit_session:
            iwidget = self.find_widget(title="Test 1")

            with iwidget:
                check_default_settings_values(self)

            # Open widget settings
            modal = iwidget.show_settings()

            # Check dialog shows correct values
            self.assertEqual(modal.get_field('list').value, "default")
            self.assertEqual(modal.get_field('text').value, "initial text")
            self.assertFalse(modal.get_field('boolean').is_selected)
            self.assertEqual(modal.get_field('number').value, "2")
            self.assertEqual(modal.get_field('password').value, "default")

            # Change widget settings
            modal.get_field('list').set_value("1")  # value1
            modal.get_field('text').set_value("test")
            modal.get_field('boolean').click()
            modal.get_field('number').set_value("0")
            modal.get_field('password').set_value("password")

            modal.accept()

            with iwidget:
                self.assertEqual(self.driver.find_element_by_id('listPref').text, '1')
                self.assertEqual(self.driver.find_element_by_id('textPref').text, 'test')
                self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'true')
                self.assertEqual(self.driver.find_element_by_id('numberPref').text, '0')
                self.assertEqual(self.driver.find_element_by_id('passwordPref').text, 'password')

            # Open widget settings again
            modal = iwidget.show_settings()

            # Check dialog shows correct values
            self._check_modified_widget_preferences(modal)

            modal.accept()

        self.reload()
        self.wait_wirecloud_ready(login=True)
        WebDriverWait(self.driver, timeout=15).until(lambda driver: self.active_tab is not None)

        with self.edit_mode as edit_session:
            iwidget = self.find_widget(title="Test 1")

            # Open widget settings again
            modal = iwidget.show_settings()

            # Check dialog shows correct values
            self._check_modified_widget_preferences(modal)

            # Change widget settings
            modal.get_field('text').set_value("")
            modal.get_field('password').set_value("")

            modal.accept()

            with iwidget:
                self.assertEqual(self.driver.find_element_by_id('listPref').text, '1')
                self.assertEqual(self.driver.find_element_by_id('textPref').text, '')
                self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'true')
                self.assertEqual(self.driver.find_element_by_id('numberPref').text, '0')
                self.assertEqual(self.driver.find_element_by_id('passwordPref').text, '')

            # Restore default widget settings
            modal = iwidget.show_settings()
            modal.find_button("Set Defaults").click()
            modal.accept()

            with iwidget:
                check_default_settings_values(self)

            # Use api test widget to test other API features
            self.network._servers['http']['example.com'].add_response('GET', '/success.html', {'content': 'remote makerequest was successful'})
            api_test_iwidget = self.create_widget("Wirecloud API test")
            api_test_iwidget_id = api_test_iwidget.id

            # Open widget settings again
            modal = api_test_iwidget.show_settings()
            modal.get_field('text').set_value("Success!!")
            modal.accept()

        expected_value = 'new value'

        with api_test_iwidget:
            # Check the widget can make local requests
            WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_id('makerequest_local_test').text, 'Success!!')
            # Check the widget can make external requests
            WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_id('makerequest_test').text, 'Success!!')
            # Check MashupPlatform.wiring.registerCallback works as expected
            self.assertEqual(self.driver.find_element_by_id('pref_registercallback_test').text, 'Success!!')
            # Check the property API works
            prop_input = FieldTester(self, self.driver.find_element_by_css_selector('#update_prop_input'))
            prop_input.set_value(expected_value)
            # Work around Firefox driver bugs
            self.driver.execute_script(
                'arguments[0].click()',
                self.driver.find_element_by_css_selector('#update_prop_button')
            )

        # TODO manual wait until the property value is stored in the server
        time.sleep(1)

        self.reload()
        WebDriverWait(self.driver, timeout=15).until(lambda driver: self.active_tab is not None)
        # Refresh api_test_iwidget as we have reloaded the browser
        api_test_iwidget = self.find_widget(id=api_test_iwidget_id)

        with api_test_iwidget:
            WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_css_selector('#update_prop_input').get_attribute('value') == expected_value)

            self.assertEqual(api_test_iwidget.error_count, 0)
            old_log_entries = len(api_test_iwidget.log_entries)
            # Work around some firefox driver bugs
            self.driver.execute_script('arguments[0].click()', self.driver.find_element_by_css_selector('#check_logs_button'))
            WebDriverWait(self.driver, timeout=2).until(lambda driver: driver.find_element_by_id('widget_log_test').text == 'Success!!')
            self.assertEqual(api_test_iwidget.error_count, 2)
            self.assertEqual(len(api_test_iwidget.log_entries), old_log_entries + 4)

            # Check wiring api exceptions
            # Work around some firefox driver bugs
            self.driver.execute_script('arguments[0].click()', self.driver.find_element_by_css_selector('#check_endpoint_exceptions_button'))
            WebDriverWait(self.driver, timeout=2).until(lambda driver: driver.find_element_by_id('endpoint_exceptions_test').text == 'Success!!')

            # Check preference api exceptions
            # Work around some firefox driver bugs
            self.driver.execute_script('arguments[0].click()', self.driver.find_element_by_css_selector('#check_preference_exceptions_button'))
            WebDriverWait(self.driver, timeout=2).until(lambda driver: driver.find_element_by_id('preference_exceptions_test').text == 'Success!!')

            # Check context api exceptions
            # Work around some firefox driver bugs
            self.driver.execute_script('arguments[0].click()', self.driver.find_element_by_css_selector('#check_context_exceptions_button'))
            WebDriverWait(self.driver, timeout=2).until(lambda driver: driver.find_element_by_id('context_exceptions_test').text == 'Success!!')

            # API exceptions are chatched by the api-test widget, check they have not affected the logged entries
            self.assertEqual(api_test_iwidget.error_count, 2)
            self.assertEqual(len(api_test_iwidget.log_entries), old_log_entries + 4)

            # Check uncatched exceptions are logged
            # Work around some firefox driver bugs
            self.driver.execute_script('arguments[0].click()', self.driver.find_element_by_css_selector('#check_general_exceptions_button'))
            self.assertEqual(api_test_iwidget.error_count, 3)
            self.assertEqual(len(api_test_iwidget.log_entries), old_log_entries + 5)

    def test_resize_widgets(self):
        self.login(username="user_with_workspaces", next="/user_with_workspaces/Workspace")

        with self.edit_mode as edit_session:
            widget1 = self.widgets[1]
            old_size = widget1.size
            old_position = widget1.position

            widget1.resize('bottom_left', -30, 30)
            new_size = widget1.size
            new_position = widget1.position
            self.assertNotEqual(new_size, old_size)
            self.assertNotEqual(new_position, old_position)

        # Django uses http 1.0 by default
        # If-Modified-Since has a 1 second resolution
        time.sleep(1)

        self.reload()
        self.wait_wirecloud_ready(login=True)

        widget1 = self.widgets[1]
        self.assertEqual(new_size, widget1.size)
        self.assertEqual(new_position, widget1.position)

    def _check_modified_widget_preferences(self, modal):
        self.assertEqual(modal.get_field('list').value, "1")
        self.assertEqual(modal.get_field('text').value, "test")
        self.assertTrue(modal.get_field('boolean').is_selected)
        self.assertEqual(modal.get_field('number').value, "0")
        self.assertEqual(modal.get_field('password').value, "password")

    @uses_extra_resources(('Wirecloud_Test_2.0.wgt',), shared=True)
    def test_widget_navigation_to_doc(self):

        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")
        iwidget = self.widgets[0]

        self.edit_mode.__enter__()
        iwidget.open_menu().click_entry("User's Manual")

        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.get_current_view() == 'myresources')
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.myresources_view.get_subview() == 'details')
        self.assertEqual(self.myresources_view.get_current_resource(), 'Test')
        self.assertEqual(self.driver.find_element_by_css_selector('.details_interface .se-select.versions .se-select-text').text, 'v1.0')
        current_tab = self.driver.find_element_by_css_selector('.details_interface .se-notebook-tab.selected').text
        self.assertEqual(current_tab, 'Documentation')

        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')

        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.driver.current_url.startswith(self.live_server_url + '/login'))

        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'myresources')
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.myresources_view.get_current_resource() == 'Test')

    def test_pending_wiring_events(self):

        self.login(username='user_with_workspaces')
        self.change_current_workspace('Pending Events')

        # Check iwidget 4 is not painted yet (as it is not in the initial tab)
        source_iwidget = self.find_widget(id='3')
        target_iwidget = self.find_widget(id='4')
        source_iwidget.wait_loaded()
        self.assertFalse(target_iwidget.loaded)

        # Force loading iwidget 4 by sending it a wiring event
        self.send_basic_event(source_iwidget)

        # Wait until iwidget 4 gets painted
        target_iwidget = WebDriverWait(self.driver, timeout=5).until(lambda driver: self.find_widget(id='4'))

        tab = self.find_tab(title='Tab 2')
        tab.click()

        with target_iwidget:
            WebDriverWait(self.driver, timeout=3).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')

    def test_http_cache(self):

        self.login()

        # Create a new workspace
        self.create_workspace('Test')

        self.reload()
        self.wait_wirecloud_ready()

        self.assertEqual(self.get_current_workspace_title(), 'Test')

        # Add a new tab
        with self.edit_mode as edit_session:
            self.create_tab()

        self.reload()
        self.wait_wirecloud_ready(login=True)

        tabs = len(self.tabs)
        self.assertEqual(tabs, 2)

        with self.edit_mode as edit_session:
            tab = self.find_tab(title='Tab')

            # Rename the created tab
            tab.rename('Other Name')

        self.reload()
        self.wait_wirecloud_ready(login=True)

        self.assertEqual(len(self.tabs), 2)
        tab = self.find_tab(title='Other Name')
        self.assertIsNotNone(tab)
        tab = self.find_tab(title='Tab')
        self.assertIsNone(tab)

        # Add two widgets to the mashup
        with self.edit_mode as edit_session:
            with edit_session.resource_sidebar as sidebar:
                resource = sidebar.search_component('widget', 'Test')
                resource.create_component()
                resource.create_component()

        self.reload()
        self.wait_wirecloud_ready(login=True)

        self.assertEqual(len(self.widgets), 2)

        # Rename a widget
        with self.edit_mode as edit_session:
            iwidget = self.widgets[1]
            iwidget.rename('Other Test')

        self.reload()
        self.wait_wirecloud_ready(login=True)

        with self.edit_mode as edit_session:
            iwidget = self.widgets[0]
            self.assertEqual(iwidget.title, 'Test')

            iwidget = self.widgets[1]
            self.assertEqual(iwidget.title, 'Other Test')

            # Remove a widget
            iwidget.remove()

        self.reload()
        self.wait_wirecloud_ready(login=True)

        self.assertEqual(len(self.widgets), 1)

        # Rename the workspace
        with self.edit_mode as edit_session:
            self.rename_workspace('test2')

        self.reload()
        self.wait_wirecloud_ready(login=True)

        self.assertEqual(self.get_current_workspace_title(), 'test2')

        # Remove the tab with widgets
        with self.edit_mode as edit_session:
            tab = self.find_tab(title='Other Name')
            tab.remove()

        self.reload()
        self.wait_wirecloud_ready(login=True)

        self.assertEqual(len(self.tabs), 1)
        self.assertEqual(len(self.widgets), 0)

    def test_create_workspace_from_catalogue(self):

        self.login()

        self.create_workspace(mashup='Test Mashup')

        # Test that wiring works as expected
        tab = self.find_tab(title='Tab')
        tab2 = self.find_tab(title='Tab 2')

        # Load tab2
        tab2.element.click()
        tab.element.click()

        iwidgets = self.widgets

        # Send wiring event
        self.send_basic_event(iwidgets[0])
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

    @uses_extra_resources(('Wirecloud_ParameterizedMashup_1.0.zip',), shared=True)
    def test_create_workspace_from_catalogue_using_parameters(self):

        self.login(username="admin", next="/admin/Workspace")
        self.create_workspace(mashup='ParameterizedMashup', parameters={
            'text_param': 'parameterized value',
            'password_param': 'parameterized password',
        })

        iwidget = self.widgets[0]

        with self.edit_mode as edit_session:
            iwidget.open_menu().click_entry('Settings')

            form = FormModalTester(self, self.wait_element_visible(".wc-component-preferences-modal"))
            self.assertEqual(form.get_field('list').value, 'default')
            text_pref = form.get_field('text')
            self.assertTrue(text_pref.is_disabled)
            self.assertEqual(text_pref.value, 'parameterized value')
            self.assertFalse(form.get_field('boolean').is_selected)
            self.assertRaises(NoSuchElementException, form.get_field, 'password')
            form.cancel()

            with iwidget:
                self.assertEqual(self.driver.find_element_by_id('listPref').text, 'default')
                self.assertEqual(self.driver.find_element_by_id('textPref').text, 'parameterized value')
                self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'false')
                self.assertEqual(self.driver.find_element_by_id('passwordPref').text, 'parameterized password')

            with edit_session.wiring_view as wiring:
                operator = wiring.find_draggable_component('operator', title="TestOperator")

                modal = operator.show_settings()
                prefix_field = modal.get_field('prefix')
                self.assertEqual(prefix_field.get_attribute('disabled'), 'true')
                self.assertEqual(prefix_field.get_attribute('value'), 'parameterized value: ')
                modal.accept()

    def test_create_workspace_from_catalogue_duplicated_workspaces(self):

        self.login(username="admin", next="/admin/Workspace")
        self.create_workspace('Test Mashup')
        workspace_name = self.get_current_workspace_name()
        self.create_workspace(mashup='Test Mashup')
        self.assertNotEqual(self.get_current_workspace_name(), workspace_name)

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

    def test_merge_mashup(self):

        self.login(username="admin", next="/admin/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.resource_sidebar as sidebar:
                resource = sidebar.search_component('mashup', 'Test Mashup')
                resource.merge()

        self.assertEqual(len(self.tabs), 3)
        tab1 = self.find_tab(name='tab')
        self.assertIsNotNone(tab1)
        tab2 = self.find_tab(name='Tab')
        self.assertIsNotNone(tab2)
        tab3 = self.find_tab(name='Tab 2')
        self.assertIsNotNone(tab3)

        self.assertEqual(len(self.find_tab(id=tab1.id).widgets), 0)
        self.assertEqual(len(self.find_tab(id=tab2.id).widgets), 1)
        self.assertEqual(len(self.find_tab(id=tab3.id).widgets), 1)

        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.driver.current_url.startswith(self.live_server_url + '/login'))

    def test_workspace_publish(self):

        self.login(username="user_with_workspaces", next="/user_with_workspaces/Workspace")

        self.publish_workspace({
            'vendor': 'Wirecloud',
            'title': 'Published Workspace',
            'version': '1.0',
            'email': 'a@b.com',
        })
        with self.myresources_view as myresources:
            myresources.search('Published Workspace')
            mashup = myresources.search_in_results('Published Workspace')
            self.assertIsNotNone(mashup, 'The published workspace is not available on the local catalogue')
            myresources.uninstall_resource('Published Workspace')

    def test_workspace_publish_readonly_widgets_and_connections(self):

        self.login(username="user_with_workspaces", next="/user_with_workspaces/Workspace")

        self.publish_workspace({
            'vendor': 'Wirecloud',
            'title': 'Published Workspace',
            'version': '1.0',
            'email': 'a@b.com',
            'readOnlyWidgets': True,
            'readOnlyConnectables': True,
        })
        self.create_workspace(mashup='Published Workspace')
        with self.edit_mode as edit_session:
            iwidget = self.widgets[0]
            close_button = ButtonTester(self, iwidget.element.find_element_by_css_selector('.wc-remove'))
            self.assertTrue(close_button.is_disabled)

            with edit_session.wiring_view as wiring:
                self.assertEqual(len(wiring.find_connections(extra_class="readonly")), 3)

        self.assertEqual(len(self.widgets), 2)

    def test_public_workspaces(self):

        # Make Test and TestOperator unavailable to emptyuser
        test_widget = CatalogueResource.objects.get(short_name='Test')
        test_widget.public = False
        test_widget.save()

        test_operator = CatalogueResource.objects.get(short_name='TestOperator')
        test_operator.public = False
        test_operator.save()

        self.login(username='emptyuser', next='/user_with_workspaces/public-workspace')

        self.assertTrue(self.find_navbar_button("wc-show-component-sidebar-button").is_disabled)
        self.assertTrue(self.find_navbar_button("wc-show-wiring-button").is_disabled)
        self.assertFalse(self.find_navbar_button("wc-show-myresources-button").is_disabled)
        self.assertFalse(self.find_navbar_button("wc-show-marketplace-button").is_disabled)

        # Check public workspaces cannot be renamed/removed by non owners
        self.open_menu().check(must_be_disabled=('Rename', 'Settings', 'Remove')).close()

        self.check_public_workspace()

    def test_public_workspaces_anonymous_user(self):

        # Make Test and TestOperator unavailable to the anonymous user
        test_widget = CatalogueResource.objects.get(short_name='Test')
        test_widget.public = False
        test_widget.save()

        test_operator = CatalogueResource.objects.get(short_name='TestOperator')
        test_operator.public = False
        test_operator.save()

        url = self.live_server_url + '/user_with_workspaces/public-workspace'
        self.driver.get(url)
        self.wait_wirecloud_ready(login=True)

        self.assertIsNone(self.find_navbar_button("wc-show-component-sidebar-button"))
        self.assertIsNone(self.find_navbar_button("wc-show-wiring-button"))
        self.assertIsNone(self.find_navbar_button("wc-show-myresources-button"))
        self.assertIsNone(self.find_navbar_button("wc-show-marketplace-button"))

        self.check_public_workspace()

        sign_in_button = self.wait_element_visible('#wc-user-menu .wc-signin-button')
        sign_in_button.click()

        form = FormTester(self, self.wait_element_visible('#wc-login-form'))
        form.get_field('username').set_value('user_with_workspaces')
        form.get_field('password').set_value('admin')
        form.submit()

        self.wait_wirecloud_ready(login=True)
        self.assertEqual(self.get_current_workspace_title(), 'Public Workspace')

    def test_embedded_view(self):

        mashup_url = self.live_server_url + '/user_with_workspaces/public-workspace?mode=embedded'
        from django.conf import settings
        iframe_test_url = urljoin(self.live_server_url, settings.STATIC_URL) + 'tests/embedded_iframe.html'
        self.driver.get(iframe_test_url)

        # Load Wirecloud using the iframe element
        self.driver.execute_script("document.getElementById('iframe').src = arguments[0]", mashup_url)

        # Swicth to Wirecloud's iframe
        iframe = self.driver.find_element_by_id('iframe')
        self.driver.switch_to.frame(iframe)
        self.wait_wirecloud_ready(embedded=True)
        self.check_public_workspace(frame_id='iframe')

    def check_public_workspace(self, frame_id=None):
        # Check iwidget are loaded correctly
        iwidgets = self.widgets
        self.assertEqual(len(iwidgets), 2)
        source_iwidget = iwidgets[1]
        target_iwidget = iwidgets[0]
        source_iwidget.wait_loaded()
        target_iwidget.wait_loaded()
        self.assertFalse(source_iwidget.btn_preferences.is_displayed)
        self.assertFalse(target_iwidget.btn_preferences.is_displayed)

        tab = self.tabs[0]
        self.assertRaises(NoSuchElementException, tab.element.find_element_by_css_selector, '.icon-tab-menu')
        self.assertRaises(NoSuchElementException, self.driver.find_element_by_css_selector, '.icon-add-tab')

        # Check wiring works
        self.send_basic_event(source_iwidget)

        # Work around selenium not being able to go to the parent frame
        if frame_id is not None:
            self.driver.switch_to.frame(self.driver.find_element_by_id(frame_id))

        with target_iwidget:
            WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')

    def test_browser_navigation_history_management(self):

        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.wiring_view:
                pass
        with self.marketplace_view:
            pass

        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'marketplace')
        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')
        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'wiring')
        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')
        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.driver.current_url == self.live_server_url + '/login?next=/user_with_workspaces/Workspace')

        self.driver.forward()
        self.wait_wirecloud_ready(login=True)
        self.assertEqual(self.get_current_workspace_title(), 'Workspace')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'wiring')
        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')
        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'marketplace')
        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: self.get_current_view() == 'workspace')

    def test_browser_workspace_navigation(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/pending-events')

        # Fill navigation history
        tab = self.find_tab(title='Tab 2')
        tab.element.click()

        self.change_current_workspace('ExistingWorkspace')
        self.assertEqual(self.active_tab.title, 'OtherTab')

        tab = self.find_tab(title='ExistingTab')
        tab.element.click()

        self.myresources_view.__enter__()

        # Check navigation history has been filled correctly
        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(
            WEC.workspace(self, owner='user_with_workspaces', name='ExistingWorkspace', tab='ExistingTab')
        )

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(
            WEC.workspace(self, owner='user_with_workspaces', name='ExistingWorkspace', tab='OtherTab')
        )

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(
            WEC.workspace(self, owner='user_with_workspaces', name='Pending Events', tab='Tab 2')
        )

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(
            WEC.workspace(self, owner='user_with_workspaces', name='Pending Events', tab='Tab 1')
        )

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.driver.current_url == self.live_server_url + '/login?next=/user_with_workspaces/pending-events')

        # Replay navigation history
        self.driver.forward()
        self.wait_wirecloud_ready(login=True)
        WebDriverWait(self.driver, timeout=10).until(
            WEC.workspace(self, owner='user_with_workspaces', name='Pending Events', tab='Tab 1')
        )

        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(
            WEC.workspace(self, owner='user_with_workspaces', name='Pending Events', tab='Tab 2')
        )

        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(
            WEC.workspace(self, owner='user_with_workspaces', name='ExistingWorkspace', tab='OtherTab')
        )

        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(
            WEC.workspace(self, owner='user_with_workspaces', name='ExistingWorkspace', tab='ExistingTab')
        )

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.get_current_view() == 'myresources')

    def test_browser_workspace_initial_tab(self):
        self.login(username='user_with_workspaces', next='/user_with_workspaces/pending-events#tab=Tab 2')
        self.assertEqual(self.active_tab.title, 'Tab 2')

        # Now test using an invalid tab name
        self.login(username='user_with_workspaces', next='/user_with_workspaces/pending-events#tab=Tab 4')
        self.assertEqual(self.active_tab.title, 'Tab 1')

    def test_browser_navigation_from_renamed_tab(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/pending-events')
        initial_workspace_tab = self.active_tab
        initial_workspace_tab_name = initial_workspace_tab.title

        with self.edit_mode as edit_session:
            self.find_tab(title='Tab 2').click().rename('NewName')

        initial_workspace_tab.click()
        WebDriverWait(self.driver, 5).until(WEC.workspace(self, tab=initial_workspace_tab_name))

        self.driver.back()
        WebDriverWait(self.driver, 5).until(WEC.workspace(self, tab='NewName'))

        self.driver.back()
        WebDriverWait(self.driver, 5).until(WEC.workspace(self, tab=initial_workspace_tab_name))

        # Navigation history should be replayable
        self.driver.forward()
        WebDriverWait(self.driver, 5).until(WEC.workspace(self, tab='NewName'))

        self.driver.forward()
        WebDriverWait(self.driver, 5).until(WEC.workspace(self, tab=initial_workspace_tab_name))

    def test_browser_navigation_from_renamed_workspace(self):

        self.login(username="user_with_workspaces", next="/user_with_workspaces/Workspace")

        self.change_current_workspace('Pending Events')
        with self.edit_mode as edit_session:
            self.rename_workspace('New Name')

        self.change_current_workspace('ExistingWorkspace')

        # Check navigation history has been filled correctly
        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(WEC.workspace(self, owner='user_with_workspaces', name='New Name'))

        self.driver.back()
        WebDriverWait(self.driver, timeout=10).until(WEC.workspace(self, owner='user_with_workspaces', name='Workspace'))

        # Navigation history should be replayable
        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(WEC.workspace(self, owner='user_with_workspaces', name='New Name'))

        self.driver.forward()
        WebDriverWait(self.driver, timeout=10).until(WEC.workspace(self, owner='user_with_workspaces', name='ExistingWorkspace'))

    def test_browser_navigation_to_deleted_workspace(self):

        self.login(username="user_with_workspaces", next="/user_with_workspaces/Workspace")

        self.change_current_workspace('Pending Events')
        self.remove_workspace()

        self.driver.back()
        WebDriverWait(self.driver, 10).until(WEC.workspace(self, owner='user_with_workspaces', name='Pending Events'))

        # "Pending Events" workspace cannot be edited anymore
        self.assertTrue(self.find_navbar_button("wc-show-component-sidebar-button").is_disabled)
        self.assertTrue(self.find_navbar_button("wc-show-wiring-button").is_disabled)

        self.driver.back()
        WebDriverWait(self.driver, 10).until(WEC.workspace(self, owner='user_with_workspaces', name='Workspace'))

        # "Workspace" workspace should be editable
        self.assertFalse(self.find_navbar_button("wc-edit-mode-button").is_disabled)
        self.assertTrue(self.find_navbar_button("wc-show-component-sidebar-button").is_disabled)
        self.assertTrue(self.find_navbar_button("wc-show-wiring-button").is_disabled)

    def assertElementHasFocus(self, element):
        # Workaround webkit problem with xhtml and retreiving element with focus
        if self.driver.capabilities['browserName'] == 'chrome':
            return
        focused_element = self.driver.switch_to.active_element.find_element_by_tag_name('span')
        self.assertEqual(element, focused_element)

    def test_gui_tutorials(self):

        self.login(username='emptyuser')

        self.driver.find_element_by_css_selector('#wc-user-menu .se-btn').click()
        popup_menu_element = self.wait_element_visible('.se-popup-menu')
        popup_menu = PopupMenuTester(self, popup_menu_element)
        popup_menu.click_entry(('Tutorials', 'Basic concepts'))
        next_button = self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Next']")
        self.assertElementHasFocus(next_button)
        next_button.click()

        next_button = self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Next']")
        self.assertElementHasFocus(next_button)
        next_button.click()

        WebDriverWait(self.driver, 5).until(WEC.workspace(self, owner="emptyuser", name='Basic concepts tutorial'))
        next_button = self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Next']")
        self.assertElementHasFocus(next_button)
        next_button.click()

        with self.edit_mode as edit_session:
            WebDriverWait(self.driver, 10).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".wc-toolbar .wc-show-component-sidebar-button")))
            with edit_session.resource_sidebar as sidebar:

                # Add the youtube browser widget
                WebDriverWait(self.driver, timeout=15).until(WEC.component_instantiable(sidebar, 'YouTube Browser'))

                # Next tutorial step
                next_button = self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Next']")
                self.assertElementHasFocus(next_button)
                next_button.click()

                # Add the input box widget
                WebDriverWait(self.driver, timeout=15).until(WEC.component_instantiable(sidebar, 'Input Box'))

            # cancel current tutorial
            self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Cancel']").click()

        window_menues = self.driver.find_elements_by_css_selector('.window_menu')
        self.assertEqual(len(window_menues), 1)

    def test_move_widget_and_restore(self):

        self.login(username='user_with_workspaces', next="/user_with_workspaces/Workspace")

        iwidgets = self.widgets

        with self.edit_mode as edit_session:
            self.assertEqual(iwidgets[0].layout_position, (0, 0))
            self.assertEqual(iwidgets[1].layout_position, (6, 0))

            offset = iwidgets[1].element.location['x'] - iwidgets[0].element.location['x']
            ActionChains(self.driver).click_and_hold(iwidgets[0].title_element).move_by_offset(offset, 0).release().perform()
            WebDriverWait(self.driver, timeout=5).until(lambda driver: iwidgets[0].layout_position == (6, 0) and iwidgets[1].layout_position == (6, 24))

            ActionChains(self.driver).click_and_hold(iwidgets[0].title_element).move_by_offset(-offset, 300).release().perform()
            WebDriverWait(self.driver, timeout=5).until(lambda driver: iwidgets[0].layout_position == (0, 0) and iwidgets[1].layout_position == (6, 0))

    test_move_widget_and_restore.tags = tags + ('wirecloud-dragboard',)

    def test_move_widget_and_restore_touch(self):

        if self.driver.capabilities['browserName'] != 'chrome':  # pragma: no cover
            raise unittest.SkipTest('Touch events are supported only by chrome/chromium')

        self.login(username="user_with_workspaces", next="/user_with_workspaces/Workspace")

        iwidgets = self.widgets

        with self.edit_mode as edit_session:
            self.assertEqual(iwidgets[0].layout_position, (0, 0))
            self.assertEqual(iwidgets[1].layout_position, (6, 0))

            iwidgets[0].wait_loaded()

            title_location = iwidgets[0].title_element.location
            TouchActions(self.driver).tap_and_hold(title_location['x'] + 10, title_location['y'] + 10).move(330, title_location['y'] + 10).release(990, 300).perform()
            WebDriverWait(self.driver, timeout=5).until(lambda driver: iwidgets[0].layout_position == (6, 0) and iwidgets[1].layout_position == (6, 24))

            title_location = iwidgets[0].title_element.location
            TouchActions(self.driver).tap_and_hold(title_location['x'] + 10, title_location['y'] + 10).move(0, 300).release(0, 300).perform()
            WebDriverWait(self.driver, timeout=5).until(lambda driver: iwidgets[0].layout_position == (0, 0) and iwidgets[1].layout_position == (6, 0))

    test_move_widget_and_restore_touch.tags = tags + ('wirecloud-dragboard',)

    @uses_extra_resources(('Wirecloud_context-inspector_0.5.wgt',), shared=True)
    def test_basic_add_and_move_widget(self):

        self.login(username="admin", next="/admin/Workspace")

        with self.edit_mode as edit_session:
            with edit_session.resource_sidebar as sidebar:
                resource = sidebar.search_component('widget', 'Context Inspector')
                widget1 = resource.create_component()
                widget2 = resource.create_component()

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

            # Move widget2 moving widget1 as side effect
            self.driver.execute_script('''
                var view = Wirecloud.UserInterfaceManager.views.workspace;
                var layout = view.activeTab.dragboard.baseLayout;
                var widget = view.activeTab.findWidget(%s);
                layout.initializeMove(widget);
                layout.moveTemporally(3, 0);
                layout.acceptMove();
            ''' % widget2.id)

            self.assertEqual(widget1.layout_position, (initial_widget1_position[0], 24))
            self.assertEqual(widget2.layout_position, (3, 0))

            with widget1:
                xPosition_changes = self.driver.find_element_by_css_selector('[data-name="xPosition"] .badge').text
                self.assertEqual(xPosition_changes, initial_widget1_xPosition_changes)

                yPosition_changes = self.driver.find_element_by_css_selector('[data-name="yPosition"] .badge').text
                self.assertEqual(yPosition_changes, str(int(initial_widget1_yPosition_changes) + 1))

                height_changes = self.driver.find_element_by_css_selector('[data-name="heightInPixels"] .badge').text
                self.assertEqual(height_changes, "0")

                width_changes = self.driver.find_element_by_css_selector('[data-name="widthInPixels"] .badge').text
                self.assertEqual(width_changes, "0")

            with widget2:
                xPosition_changes = self.driver.find_element_by_css_selector('[data-name="xPosition"] .badge').text
                self.assertEqual(xPosition_changes, str(int(initial_widget2_xPosition_changes) + 1))

                yPosition_changes = self.driver.find_element_by_css_selector('[data-name="yPosition"] .badge').text
                self.assertEqual(yPosition_changes, initial_widget2_yPosition_changes)

                height_changes = self.driver.find_element_by_css_selector('[data-name="heightInPixels"] .badge').text
                self.assertEqual(height_changes, "0")

                width_changes = self.driver.find_element_by_css_selector('[data-name="widthInPixels"] .badge').text
                self.assertEqual(width_changes, "0")

            # Move widget2 again without affecting widget1
            self.driver.execute_script('''
                var view = Wirecloud.UserInterfaceManager.views.workspace;
                var layout = view.activeTab.dragboard.baseLayout;
                var widget = view.activeTab.findWidget(%s);
                layout.initializeMove(widget);
                layout.moveTemporally(0, 3);
                layout.acceptMove();
            ''' % widget2.id)

            self.assertEqual(widget1.layout_position, (initial_widget1_position[0], 24))
            self.assertEqual(widget2.layout_position, (0, 0))

            with widget1:
                xPosition_changes = self.driver.find_element_by_css_selector('[data-name="xPosition"] .badge').text
                self.assertEqual(xPosition_changes, initial_widget1_xPosition_changes)

                yPosition_changes = self.driver.find_element_by_css_selector('[data-name="yPosition"] .badge').text
                self.assertEqual(yPosition_changes, str(int(initial_widget1_yPosition_changes) + 1))

                height_changes = self.driver.find_element_by_css_selector('[data-name="heightInPixels"] .badge').text
                self.assertEqual(height_changes, "0")

                width_changes = self.driver.find_element_by_css_selector('[data-name="widthInPixels"] .badge').text
                self.assertEqual(width_changes, "0")

            with widget2:
                xPosition_changes = self.driver.find_element_by_css_selector('[data-name="xPosition"] .badge').text
                self.assertEqual(xPosition_changes, str(int(initial_widget2_xPosition_changes) + 2))

                yPosition_changes = self.driver.find_element_by_css_selector('[data-name="yPosition"] .badge').text
                self.assertEqual(yPosition_changes, initial_widget2_yPosition_changes)

                height_changes = self.driver.find_element_by_css_selector('[data-name="heightInPixels"] .badge').text
                self.assertEqual(height_changes, "0")

                width_changes = self.driver.find_element_by_css_selector('[data-name="widthInPixels"] .badge').text
                self.assertEqual(width_changes, "0")
    test_basic_add_and_move_widget.tags = tags + ('wirecloud-dragboard',)

    def test_move_widget_interchange(self):

        self.login(username="user_with_workspaces", next="/user_with_workspaces/Workspace")

        iwidgets = self.widgets

        with self.edit_mode as edit_session:
            self.assertEqual(iwidgets[0].layout_position, (0, 0))
            self.assertEqual(iwidgets[1].layout_position, (6, 0))

            self.driver.execute_script('''
                var view = Wirecloud.UserInterfaceManager.views.workspace;
                var layout = view.activeTab.dragboard.baseLayout;
                var widget = view.activeTab.findWidget(%s);
                layout.initializeMove(widget);
                layout.moveTemporally(6, 25);
                layout.acceptMove();
            ''' % iwidgets[0].id)

            self.assertEqual(iwidgets[0].layout_position, (6, 24))
            self.assertEqual(iwidgets[1].layout_position, (6, 0))

            self.driver.execute_script('''
                var view = Wirecloud.UserInterfaceManager.views.workspace;
                var layout = view.activeTab.dragboard.baseLayout;
                var widget = view.activeTab.findWidget(%s);
                layout.initializeMove(widget);
                layout.moveTemporally(0, 0);
                layout.acceptMove();
            ''' % iwidgets[1].id)

            self.assertEqual(iwidgets[0].layout_position, (6, 0))
            self.assertEqual(iwidgets[1].layout_position, (0, 0))

    test_move_widget_interchange.tags = tags + ('wirecloud-dragboard',)

    @uses_extra_resources(('Wirecloud_context-inspector_0.5.wgt',), shared=True)
    @uses_extra_workspace('admin', 'Wirecloud_GridLayoutTests_1.0.wgt', shared=True)
    def test_extract_widget_from_grid(self):

        self.login(username="admin", next="/admin/GridLayoutTests")
        iwidget = self.widgets[0]

        with self.edit_mode as edit_session:
            _, old_size = self.get_widget_sizes_from_context(iwidget)

            iwidget.open_menu().click_entry('Extract from grid')
            _, new_size = self.get_widget_sizes_from_context(iwidget.wait_still())

            self.assertEqual(old_size, new_size)
    test_extract_widget_from_grid.tags = tags + ('wirecloud-dragboard',)

    @uses_extra_resources(('Wirecloud_context-inspector_0.5.wgt',), shared=True)
    @uses_extra_workspace('user_with_workspaces', 'Wirecloud_ColumnLayoutTests_1.0.wgt', shared=True)
    def test_minimize_widget(self):

        self.login(username="user_with_workspaces", next="/user_with_workspaces/ColumnLayoutTests")

        with self.edit_mode as edit_session:
            iwidget = self.widgets[0]
            affected_iwidget = self.widgets[2]
            old_size, old_size_in_pixels = self.get_widget_sizes_from_context(iwidget)
            old_affected_iwidget_position = affected_iwidget.layout_position

            iwidget.minimize()
            minimized_size, minimized_size_in_pixels = self.get_widget_sizes_from_context(iwidget)
            self.assertEqual(minimized_size[0], old_size[0])
            self.assertLess(minimized_size[1], old_size[1])
            self.assertEqual(minimized_size_in_pixels, (old_size_in_pixels[0], 0))
            self.assertEqual(affected_iwidget.layout_position, (0, minimized_size[1]))

            iwidget.maximize()
            new_size, new_size_in_pixels = self.get_widget_sizes_from_context(iwidget)

            self.assertEqual(old_size, new_size)
            self.assertEqual(old_size_in_pixels, new_size_in_pixels)
            self.assertEqual(old_affected_iwidget_position, affected_iwidget.layout_position)

    test_minimize_widget.tags = tags + ('wirecloud-dragboard',)

    @uses_extra_resources(('Wirecloud_context-inspector_0.5.wgt',), shared=True)
    def test_basic_layout_parameter_change(self):

        self.login(username="admin", next="/admin/Workspace")

        widget = self.create_widget('Context Inspector')

        # Check initial sizes
        with widget:
            old_width_from_context = int(self.driver.find_element_by_css_selector('[data-name="width"] .content').text)
            old_height_in_pixels_changes = int(self.driver.find_element_by_css_selector('[data-name="heightInPixels"] .badge').text)
            self.assertEqual(old_width_from_context, 6)

        # Change columns to 10
        with self.edit_mode as edit_session:
            self.open_menu().click_entry('Settings')
            workspace_preferences_dialog = FormModalTester(self, self.wait_element_visible('.wc-workspace-preferences-modal'))

            workspace_preferences_dialog.find_element('.fa-cogs').click()
            layout_form = FormModalTester(self, self.wait_element_visible(".wc-layout-settings-modal"))
            layout_form.get_field("columns").set_value('10')
            layout_form.accept()

            workspace_preferences_dialog.accept()

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
            self.assertEqual(height_in_pixels_changes, "%s" % (old_height_in_pixels_changes + 1))

    test_basic_layout_parameter_change.tags = tags + ('wirecloud-dragboard',)

    def get_widget_sizes_from_context(self, widget):
        # Check initial sizes
        with widget:
            size_from_context = (
                int(self.driver.find_element_by_css_selector('[data-name="width"] .content').get_attribute('textContent')),
                int(self.driver.find_element_by_css_selector('[data-name="height"] .content').get_attribute('textContent')),
            )
            size_in_pixels_from_context = (
                int(self.driver.find_element_by_css_selector('[data-name="widthInPixels"] .content').get_attribute('textContent')),
                int(self.driver.find_element_by_css_selector('[data-name="heightInPixels"] .content').get_attribute('textContent')),
            )

        return size_from_context, size_in_pixels_from_context

    @uses_extra_resources(('Wirecloud_context-inspector_0.5.wgt',), shared=True)
    @uses_extra_workspace('admin', 'Wirecloud_GridLayoutTests_1.0.wgt', shared=True)
    def test_basic_layout_parameter_change_several_widgets(self):

        self.login(username="admin", next="/admin/GridLayoutTests")

        iwidgets = self.widgets
        old_size_from_context1, old_size_in_pixels_from_context1 = self.get_widget_sizes_from_context(iwidgets[0])
        old_size_from_context2, old_size_in_pixels_from_context2 = self.get_widget_sizes_from_context(iwidgets[1])

        # Change columns to 10
        with self.edit_mode as edit_session:
            self.open_menu().click_entry('Settings')
            workspace_preferences_dialog = FormModalTester(self, self.wait_element_visible('.wc-workspace-preferences-modal'))

            workspace_preferences_dialog.find_element('.fa-cogs').click()
            layout_form = FormModalTester(self, self.wait_element_visible(".wc-layout-settings-modal"))
            layout_form.get_field("columns").set_value('10')
            layout_form.accept()

            workspace_preferences_dialog.accept()

        # Check new widget 1 sizes
        new_size_from_context1, new_size_in_pixels_from_context1 = self.get_widget_sizes_from_context(iwidgets[0].wait_still())
        self.assertNotEqual(new_size_from_context1[0], old_size_from_context1[0])
        self.assertEqual(new_size_from_context1[1], old_size_from_context1[1])
        self.assertNotEqual(new_size_in_pixels_from_context1[0], old_size_in_pixels_from_context1[0])
        # self.assertEqual(new_size_in_pixels_from_context1[1], old_size_in_pixels_from_context1[1])

        # Check new widget 2 sizes
        new_size_from_context2, new_size_in_pixels_from_context2 = self.get_widget_sizes_from_context(iwidgets[1].wait_still())
        self.assertNotEqual(new_size_from_context2[0], old_size_from_context2[0])
        self.assertEqual(new_size_from_context2[1], old_size_from_context2[1])
        self.assertNotEqual(new_size_in_pixels_from_context2[0], old_size_in_pixels_from_context2[0])
        # self.assertEqual(new_size_in_pixels_from_context2[1], old_size_in_pixels_from_context2[1])
    test_basic_layout_parameter_change_several_widgets.tags = tags + ('wirecloud-dragboard',)

    @uses_extra_resources(('Wirecloud_context-inspector_0.5.wgt',), shared=True)
    def test_layout_type_change(self):

        self.login(username="admin", next="/admin/Workspace")

        widget = self.create_widget('Context Inspector')

        # Check initial sizes
        old_size_from_context, old_size_in_pixels_from_context = self.get_widget_sizes_from_context(widget)
        self.assertEqual(old_size_from_context[0], 6)

        # Change current layout to grid
        with self.edit_mode as edit_session:
            self.open_menu().click_entry('Settings')
            form = FormModalTester(self, self.wait_element_visible(".wc-workspace-preferences-modal"))
            form.get_field("baselayout-type").set_value('gridlayout')
            form.accept()

        # Check new sizes
        new_size_from_context, new_size_in_pixels_from_context = self.get_widget_sizes_from_context(widget)
        self.assertEqual(new_size_from_context[0], old_size_from_context[0])
        self.assertNotEqual(new_size_from_context[1], old_size_from_context[1])
        self.assertEqual(new_size_in_pixels_from_context[0], old_size_in_pixels_from_context[0])

    test_layout_type_change.tags = tags + ('wirecloud-dragboard',)

    @uses_extra_resources(('Wirecloud_context-inspector_0.5.wgt',), shared=True)
    @uses_extra_workspace('admin', 'Wirecloud_GridLayoutTests_1.0.wgt', shared=True)
    def test_window_resize(self):

        self.login(username="admin", next="/admin/GridLayoutTests")

        iwidgets = self.widgets
        old_size_from_context1, old_size_in_pixels_from_context1 = self.get_widget_sizes_from_context(iwidgets[0])
        old_size_from_context2, old_size_in_pixels_from_context2 = self.get_widget_sizes_from_context(iwidgets[1])

        # Resize browser window
        old_browser_size = self.driver.get_window_size()
        try:
            self.driver.set_window_size(800, 400)

            # Check new widget sizes
            new_size_from_context1, new_size_in_pixels_from_context1 = self.get_widget_sizes_from_context(iwidgets[0].wait_still())
            new_size_from_context2, new_size_in_pixels_from_context2 = self.get_widget_sizes_from_context(iwidgets[1].wait_still())
            self.assertEqual(new_size_from_context1, old_size_from_context1)
            self.assertNotEqual(new_size_in_pixels_from_context1[0], old_size_in_pixels_from_context1[0])
            self.assertNotEqual(new_size_in_pixels_from_context1[1], old_size_in_pixels_from_context1[1])
            self.assertEqual(new_size_from_context2, old_size_from_context2)
            self.assertNotEqual(new_size_in_pixels_from_context2[0], old_size_in_pixels_from_context2[0])
            self.assertNotEqual(new_size_in_pixels_from_context2[1], old_size_in_pixels_from_context2[1])
        finally:
            self.driver.set_window_size(old_browser_size['width'], old_browser_size['height'])

    test_window_resize.tags = tags + ('wirecloud-dragboard',)

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    @uses_extra_workspace('admin', 'Wirecloud_api-test-mashup_1.0.wgt', shared=True)
    def test_dashboard_management_api(self):

        self.login(username="admin", next="/admin/api-test-mashup")

        initial_iwidgets = self.widgets
        initial_iwidget_count = len(initial_iwidgets)

        with initial_iwidgets[1]:
            # use execute_script as we are not testing if the button is visible
            # and directly clickable without scrolling the view
            self.driver.execute_script("document.getElementById('dashboard_management_button').click();")
            # Wait until the test finish with a success message
            WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_id('dashboard_management_test').text == 'Success!!')

        # Two widgets are created when clicking the dashboard management button
        # one of them is connected directly, the other is connected through and
        # operator. The test will drop direct connections once passed, leaving
        # the connection between the volatile operator and the volatile widget
        WebDriverWait(self.driver, timeout=3).until(lambda driver: len(self.widgets) == (initial_iwidget_count + 2))

        # An event is sent from the widget using the pushEvent method
        iwidgets = self.widgets
        with iwidgets[3]:
            text_div = self.driver.find_element_by_id('registercallback_test')
            self.assertEqual(text_div.text, 'Success!!')

        with iwidgets[4]:
            text_div = self.driver.find_element_by_id('registercallback_test')
            self.assertEqual(text_div.text, 'Success!!')

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    @uses_extra_workspace('admin', 'Wirecloud_api-test-mashup_1.0.wgt', shared=True)
    def test_dashboard_management_api_from_operator(self):

        self.login(username="admin", next="/admin/api-test-mashup")

        initial_iwidgets = self.widgets
        initial_iwidget_count = len(initial_iwidgets)

        self.send_basic_event(initial_iwidgets[2], 'dashboard_management_test')

        # Two widgets are created when clicking the dashboard management button
        # one of them is connected directly, the other is connected through and
        # operator. The test will drop direct connections once passed, leaving
        # the connection between the volatile operator and the volatile widget
        WebDriverWait(self.driver, timeout=3).until(lambda driver: len(self.widgets) == (initial_iwidget_count + 2))

        iwidgets = self.widgets
        with iwidgets[3]:
            text_div = self.driver.find_element_by_id('registercallback_test')
            self.assertEqual(text_div.text, 'Success!!')

        with iwidgets[4]:
            text_div = self.driver.find_element_by_id('registercallback_test')
            self.assertEqual(text_div.text, 'Success!!')

        self.assertIsNone(self.find_navbar_button("wc-show-wiring-button").badge)

    @uses_extra_resources(('Wirecloud_Test_3.0.wgt',), shared=True)
    def test_upgrade_widget(self):

        self.login(username="user_with_workspaces", next="/user_with_workspaces/Workspace")

        widget, other_widget = self.widgets

        with self.edit_mode as edit_session:
            # Upgrade to version 3.0
            widget.open_menu().click_entry('Upgrade/Downgrade')
            form = FormModalTester(self, self.wait_element_visible(".wc-upgrade-component-modal"))
            form.accept()

            # Check settings
            widget.open_menu().click_entry('Settings')

            form = FormModalTester(self, self.wait_element_visible(".wc-component-preferences-modal"))
            self.assertRaises(NoSuchElementException, form.get_field, 'list')
            self.assertEqual(form.get_field('text').value, 'initial text')
            self.assertRaises(NoSuchElementException, form.get_field, 'boolean')
            self.assertRaises(NoSuchElementException, form.get_field, 'number')
            self.assertRaises(NoSuchElementException, form.get_field, 'password')
            self.assertEqual(form.get_field('new').value, 'initial value')
            form.accept()

            # Check wiring
            self.send_basic_event(widget)

            # This should work as the outputendpoint is still available on version 3.0
            with other_widget:
                WebDriverWait(self.driver, timeout=3).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world!!')

            self.send_basic_event(other_widget)
            time.sleep(3)

            # Instead inputendpoint has been replaced by inputendpoint2
            with widget:
                text_div = self.driver.find_element_by_id('wiringOut')
                self.assertEqual(text_div.text, '')

            # Downgrade to version 1.0
            widget.open_menu().click_entry('Upgrade/Downgrade')
            form = FormModalTester(self, self.wait_element_visible(".wc-upgrade-component-modal"))
            form.accept()

            # Check settings
            widget.open_menu().click_entry('Settings')

            form = FormModalTester(self, self.wait_element_visible(".wc-component-preferences-modal"))
            self.assertEqual(form.get_field('list').value, 'default')
            self.assertEqual(form.get_field('text').value, 'initial text')
            self.assertRaises(NoSuchElementException, form.get_field, 'new')
            form.accept()

        # Check wiring
        self.send_basic_event(widget, 'hello world 2!!')

        # This should still be working
        with other_widget:
            WebDriverWait(self.driver, timeout=3).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world 2!!')

        self.send_basic_event(other_widget, 'hello world 2!!')

        # And this connection should be restored
        with widget:
            WebDriverWait(self.driver, timeout=3).until(lambda driver: driver.find_element_by_id('wiringOut').text == 'hello world 2!!')
