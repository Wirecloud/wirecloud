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
