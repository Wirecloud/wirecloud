import time

from wirecloudcommons.test import widget_operation, WirecloudSeleniumTestCase


class BasicSeleniumTests(WirecloudSeleniumTestCase):

    tags = ('fiware-ut-5',)

    def check_popup_menu(self, must_be, must_be_absent):

        time.sleep(0.1)

        for item in must_be:
            menu_item = self.get_popup_menu_item(item)
            self.assertIsNotNone(menu_item)

        for item in must_be_absent:
            menu_item = self.get_popup_menu_item(item)
            self.assertIsNone(menu_item)

    def test_basic_workspace_operations(self):

        self.login()

        # We need atleast one Workspace, so we cannot delete current workspace
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.check_popup_menu(('Rename', 'Settings', 'New workspace', 'Publish'), ('Remove',))
        self.driver.find_element_by_class_name('disable-layer').click()

        self.create_workspace('Test')

        # Now we have two workspaces so we can remove any of them
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.check_popup_menu(('Rename', 'Settings', 'New workspace', 'Publish', 'Remove'), ())
        self.driver.find_element_by_class_name('disable-layer').click()

        self.rename_workspace('test2')
        tab = self.get_workspace_tab_by_name('Tab')

        # Only one tab => we cannot remove it
        tab_menu_button = tab.find_element_by_css_selector('.icon-tab-menu')
        tab_menu_button.click()
        self.check_popup_menu(('Rename',), ('Remove',))
        self.driver.find_element_by_class_name('disable-layer').click()

        new_tab = self.add_tab()

        # Now we have two tabs so we can remove any of them
        tab_menu_button = tab.find_element_by_css_selector('.icon-tab-menu')
        tab_menu_button.click()
        self.check_popup_menu(('Rename', 'Remove'), ())
        self.driver.find_element_by_class_name('disable-layer').click()

        new_tab.click()
        tab_menu_button = new_tab.find_element_by_css_selector('.icon-tab-menu')
        tab_menu_button.click()
        self.check_popup_menu(('Rename', 'Remove'), ())

        # Remove the recently created one
        self.popup_menu_click('Remove')
        self.wait_wirecloud_ready()
        self.assertEqual(len(self.driver.find_elements_by_css_selector('#workspace .tab_wrapper .tab')), 1)

        self.remove_workspace()

        # Now we have only one workspace, so we cannot remove it
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.check_popup_menu(('Rename', 'Settings', 'New workspace'), ('Remove',))
        self.driver.find_element_by_class_name('disable-layer').click()

    def test_add_widget_from_catalogue(self):

        self.login()
        self.add_widget_to_mashup('Test')

    def test_basic_widget_functionalities(self):

        self.login()
        self.add_widget_to_mashup('Test')

        with widget_operation(self.driver, 1):
            self.assertEqual(self.driver.find_element_by_id('listPref').text, 'default')
            self.assertEqual(self.driver.find_element_by_id('textPref').text, 'initial text')
            self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'false')
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, 'default')

        # Change widget settings
        self.driver.find_element_by_css_selector('.iwidget .settingsbutton').click()
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

        with widget_operation(self.driver, 1):
            self.assertEqual(self.driver.find_element_by_id('listPref').text, '1')
            self.assertEqual(self.driver.find_element_by_id('textPref').text, 'test')
            self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'true')
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, 'password')

        # Change widget settings again
        self.driver.find_element_by_css_selector('.iwidget .settingsbutton').click()
        self.popup_menu_click('Settings')

        text_input = self.driver.find_element_by_css_selector('.window_menu [name="text"]')
        self.fill_form_input(text_input, '')
        password_input = self.driver.find_element_by_css_selector('.window_menu [name="password"]')
        self.fill_form_input(password_input, '')

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        with widget_operation(self.driver, 1):
            self.assertEqual(self.driver.find_element_by_id('listPref').text, '1')
            self.assertEqual(self.driver.find_element_by_id('textPref').text, '')
            self.assertEqual(self.driver.find_element_by_id('booleanPref').text, 'true')
            self.assertEqual(self.driver.find_element_by_id('passwordPref').text, '')

    def test_http_cache(self):

        self.login()
        self.create_workspace('Test')

        self.driver.refresh()
        self.wait_wirecloud_ready()

        self.assertEqual(self.get_current_workspace_name(), 'Test')
        self.add_tab()

        self.driver.refresh()
        self.wait_wirecloud_ready()

        tabs = len(self.driver.find_elements_by_css_selector('#workspace .tab_wrapper .tab'))
        self.assertEquals(tabs, 2)

        tab = self.get_workspace_tab_by_name('Tab')
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

        self.add_widget_to_mashup('Test')

        self.driver.refresh()
        self.wait_wirecloud_ready()

        self.assertEqual(self.count_iwidgets(), 1)
        self.rename_workspace('test2')

        self.driver.refresh()
        self.wait_wirecloud_ready()

        self.assertEqual(self.get_current_workspace_name(), 'test2')

        tab = self.get_workspace_tab_by_name('Other Name')
        tab_menu_button = tab.find_element_by_css_selector('.icon-tab-menu')
        tab_menu_button.click()
        self.popup_menu_click('Remove')
        self.wait_wirecloud_ready()

        self.driver.refresh()
        self.wait_wirecloud_ready()

        self.assertEqual(self.count_workspace_tabs(), 1)
        self.assertEqual(self.count_iwidgets(), 0)

    def test_duplicated_workspaces(self):

        self.login()
        self.create_workspace('Test Mashup')
        self.create_workspace_from_catalogue('Test Mashup')
        self.assertNotEqual(self.get_current_workspace_name(), 'Test Mashup')

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

    def test_workspace_publish(self):

        self.login()
        # TODO workspace must come from fixtures
        self.create_workspace_from_catalogue('Test Mashup')

        self.publish_workspace({
            'vendor': 'Wirecloud',
            'name': 'Published Workspace',
            'version': '1.0',
            'email': 'a@b.com',
        })
        self.search_resource('Published Workspace')
        mashup = self.search_in_catalogue_results('Published Workspace')
        self.assertIsNotNone(mashup, 'The published workspace is not available on the local catalogue')
