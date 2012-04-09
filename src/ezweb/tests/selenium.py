import time

from commons.test import WirecloudSeleniumTestCase


class BasicSeleniumTests(WirecloudSeleniumTestCase):

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
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').click()
        self.check_popup_menu(('Rename', 'Settings', 'New workspace'), ('Remove',))
        self.driver.find_element_by_class_name('disable-layer').click()

        self.create_workspace('Test')

        # Now we have two workspaces so we can remove any of them
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').click()
        self.check_popup_menu(('Rename', 'Settings', 'New workspace', 'Remove'), ())
        self.driver.find_element_by_class_name('disable-layer').click()

        self.rename_workspace('test2')
        tab = self.get_workspace_tab_by_name('Tab')

        # Only one tab => we cannot remove it
        tab_menu_button = tab.find_element_by_css_selector('.icon-tab-menu')
        tab_menu_button.click()
        self.check_popup_menu(('Rename',), ('Remove',))
        self.driver.find_element_by_class_name('disable-layer').click()

        self.remove_workspace()

        # Now we have only one workspace, so we cannot remove it
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').click()
        self.check_popup_menu(('Rename', 'Settings', 'New workspace'), ('Remove',))
        self.driver.find_element_by_class_name('disable-layer').click()

    def test_add_widget_from_catalogue(self):

        self.login()
        self.assertEqual(self.count_iwidgets(), 0)
        self.add_widget_to_mashup('Test')
        self.assertEqual(self.count_iwidgets(), 1)
