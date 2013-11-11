# -*- coding: utf-8 -*-

# Copyright (c) 2008-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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
import sys
import time

from django.utils.importlib import import_module
from selenium.common.exceptions import StaleElementReferenceException
from selenium.webdriver import ActionChains
from selenium.webdriver.support.ui import WebDriverWait


def marketplace_loaded(driver):
    try:
        if driver.find_element_by_css_selector('#wirecloud_breadcrum .first_level').text == 'marketplace':
            return driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').text != 'loading'
    except:
        pass

    return False


class WiringEndpointTester(object):

    def __init__(self, testcase, endpoint_name, element):

        self.testcase = testcase
        self.endpoint_name = endpoint_name
        self.element = element

    @property
    def label(self):
        return self.testcase.driver.execute_script('return arguments[0].parentElement;', self.element);

    @property
    def pos(self):
        return self.testcase.driver.execute_script('''
            var endpoint_element = arguments[0].parentElement.parentElement;
            var endpointlist = Array.prototype.slice.call(arguments[0].parentElement.parentElement.parentElement.children);
            return endpointlist.indexOf(endpoint_element);
        ''', self.element);

    def perform_action(self, action):
        ActionChains(self.testcase.driver).context_click(self.element).perform()
        self.testcase.popup_menu_click(action)


class IWidgetTester(object):

    def __init__(self, testcase, iwidget_id, element):

        self.testcase = testcase
        self.id = iwidget_id
        self.element = element

    def __getitem__(self, key):

        if key == 'id':
            return self.id
        elif key == 'element':
            return self.element

    def __enter__(self):
        self.content_element = self.testcase.driver.execute_script('return opManager.activeWorkspace.getIWidget(%d).content;' % self.id)

        # TODO work around webdriver bugs
        self.testcase.driver.switch_to_default_content()

        self.testcase.driver.switch_to_frame(self.content_element)
        return None

    def __exit__(self, type, value, traceback):
        self.testcase.driver.switch_to_frame(None)

        # TODO work around webdriver bugs
        self.testcase.driver.switch_to_default_content()

    @property
    def name(self):
        return self.element.find_element_by_css_selector('.widget_menu > span').text

    @property
    def error_count(self):
        driver = self.testcase.driver

        old_frame = driver.execute_script("return window.frameElement")
        driver.switch_to_default_content()
        error_count = driver.execute_script('return opManager.activeWorkspace.getIWidget(%s).internal_iwidget.logManager.errorCount' % self.id)
        driver.switch_to_frame(old_frame)

        return error_count

    @property
    def log_entries(self):
        driver = self.testcase.driver

        old_frame = driver.execute_script("return window.frameElement")
        driver.switch_to_default_content()
        log_entries = driver.execute_script('''
            var iwidget = opManager.activeWorkspace.getIWidget(%s).internal_iwidget;
            return iwidget.logManager.entries.map(function (entry) { return {date: entry.date.getTime(), level: entry.level, msg: entry.msg}; });
        ''' % self.id)
        driver.switch_to_frame(old_frame)

        return log_entries

    def perform_action(self, action):

        self.element.find_element_by_css_selector('.icon-cogs').click()
        self.testcase.popup_menu_click(action)

    def rename(self, new_name, timeout=30):

        self.perform_action('Rename')
        name_input = self['element'].find_element_by_css_selector('.widget_menu > span')
        # We cannot use send_keys due to http://code.google.com/p/chromedriver/issues/detail?id=35
        self.testcase.driver.execute_script('arguments[0].textContent = arguments[1]', name_input, new_name)
        self.element.find_element_by_css_selector('.statusBar').click()

        def name_changed(driver):
            return driver.execute_script('return opManager.activeWorkspace.getIWidget(%s).name === "%s"' % (self.id, new_name))

        WebDriverWait(self.testcase.driver, timeout).until(name_changed)

    def wait_loaded(self, timeout=10):

        def iwidget_loaded(driver):
            iwidget_element = driver.execute_script('''
                var iwidget = opManager.activeWorkspace.getIWidget(%s);
                return iwidget.internal_iwidget.loaded ? iwidget.element : null;
            ''' % self.id)

            if iwidget_element is not None:
                self.element = iwidget_element
                return True

            return False

        WebDriverWait(self.testcase.driver, timeout).until(iwidget_loaded)

    def remove(self, timeout=30):

        old_iwidget_ids = self.testcase.driver.execute_script('return opManager.activeWorkspace.getIWidgets().map(function(iwidget) {return iwidget.id;});')
        old_iwidget_count = len(old_iwidget_ids)

        self.element.find_element_by_css_selector('.icon-remove').click()

        def iwidget_unloaded(driver):
            iwidgets = self.testcase.get_current_iwidgets()
            iwidget_count = len(iwidgets)
            return iwidget_count == old_iwidget_count - 1

        WebDriverWait(self.testcase.driver, timeout).until(iwidget_unloaded)

    def get_wiring_endpoint(self, endpoint_name, timeout=5):

        def widget_in_wiring_editor(driver):
            return driver.execute_script('''
                 var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
                 return wiringEditor.iwidgets[%(iwidget)d] != null;
            ''' % {"iwidget": self.id, "endpoint": endpoint_name})

        WebDriverWait(self.testcase.driver, timeout).until(widget_in_wiring_editor)

        return WiringEndpointTester(self.testcase, endpoint_name, self.testcase.driver.execute_script('''
             var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
             return wiringEditor.iwidgets[%(iwidget)d].getAnchor("%(endpoint)s").wrapperElement;
        ''' % {"iwidget": self.id, "endpoint": endpoint_name}
        ))


class IOperatorTester(object):

    def __init__(self, testcase, ioperator_id, element):

        self.testcase = testcase
        self.id = ioperator_id
        self.element = element

    def get_wiring_endpoint(self, endpoint_name, timeout=5):

        def operator_in_wiring_editor(driver):
            return driver.execute_script('''
                 var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
                 return wiringEditor.currentlyInUseOperators[%(ioperator)s] != null;
            ''' % {"ioperator": self.id, "endpoint": endpoint_name})

        WebDriverWait(self.testcase.driver, timeout).until(operator_in_wiring_editor)

        return WiringEndpointTester(self.testcase, endpoint_name, self.testcase.driver.execute_script('''
             var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
             return wiringEditor.currentlyInUseOperators['%(ioperator)s'].getAnchor("%(endpoint)s").wrapperElement;
        ''' % {"ioperator": self.id, "endpoint": endpoint_name}
        ))

    @property
    def error_count(self):
        return self.testcase.driver.execute_script('return opManager.activeWorkspace.wiring.ioperators[%s].logManager.errorCount' % self.id)


class WirecloudRemoteTestCase(object):

    @classmethod
    def setUpClass(cls):

        cls.shared_test_data_dir = os.path.join(os.path.dirname(__file__), '../test-data')
        cls.test_data_dir = os.path.join(os.path.dirname(sys.modules[cls.__module__].__file__), 'test-data')

        # Load webdriver
        module_name, klass_name = getattr(cls, '_webdriver_class', 'selenium.webdriver.Firefox').rsplit('.', 1)
        module = import_module(module_name)
        webdriver_args = getattr(cls, '_webdriver_args', None)
        if webdriver_args is None:
            webdriver_args = {}
        cls.driver = getattr(module, klass_name)(**webdriver_args)

    @classmethod
    def tearDownClass(cls):

        cls.driver.quit()

    def tearDown(self):

        self.driver.delete_all_cookies()

    def fill_form_input(self, form_input, value):
        # We cannot use send_keys due to http://code.google.com/p/chromedriver/issues/detail?id=35
        self.driver.execute_script('arguments[0].value = arguments[1]', form_input, value)

    def scroll_and_click(self, element):

        # Work around chrome and firefox driver bugs
        try:
            self.driver.execute_script("arguments[0].scrollIntoView(false);", element);
        except:
            pass
        ActionChains(self.driver).click(element).perform()

    def wait_element_visible_by_css_selector(self, selector, timeout=30, element=None):
        if element is None:
            element = self.driver

        WebDriverWait(self.driver, timeout).until(lambda driver: element.find_element_by_css_selector(selector).is_displayed())
        time.sleep(0.1)
        return element.find_element_by_css_selector(selector)

    def wait_element_visible_by_id(self, selector, timeout=30, element=None):
        if element is None:
            element = self.driver

        WebDriverWait(self.driver, timeout).until(lambda driver: element.find_element_by_id(selector).is_displayed())
        time.sleep(0.1)
        return element.find_element_by_id(selector)

    def wait_element_visible_by_xpath(self, selector, timeout=30, element=None):
        if element is None:
            element = self.driver

        WebDriverWait(self.driver, timeout).until(lambda driver: element.find_element_by_xpath(selector).is_displayed())
        time.sleep(0.1)
        return element.find_element_by_xpath(selector)

    def wait_wirecloud_ready(self, start_timeout=30, timeout=30):

        loading_window = self.driver.find_element_by_css_selector('#loading-window')

        def wait_loading_window(driver):
            return loading_window.get_attribute('class').strip() in ('', 'disabled')

        def wait_loading_window_hidden(driver):
            return loading_window.get_attribute('class').strip() in ('fadding', 'disabled')

        WebDriverWait(self.driver, start_timeout).until(wait_loading_window)
        WebDriverWait(self.driver, timeout).until(wait_loading_window_hidden)

        loading_message = self.driver.find_element_by_id('loading-message')
        try:
            loading_message.click()
        except:
            pass

        time.sleep(0.1)  # work around some problems

    def wait_catalogue_ready(self, timeout=30):
        catalogue_element = self.get_current_catalogue_base_element()
        search_view = catalogue_element.find_element_by_class_name('search_interface')
        WebDriverWait(self.driver, timeout).until(lambda driver: 'disabled' not in search_view.get_attribute('class'))

    def login(self, username='admin', password='admin'):

        self.driver.get(self.live_server_url + '/login')
        self.wait_element_visible_by_css_selector('#id_username')

        username_input = self.driver.find_element_by_id('id_username')
        self.fill_form_input(username_input, username)
        password_input = self.driver.find_element_by_id('id_password')
        self.fill_form_input(password_input, password)
        password_input.submit()

        self.wait_wirecloud_ready()

    def get_current_view(self):

        current_view_menu_entry = self.driver.find_element_by_css_selector('#wirecloud_header .menu > .selected')
        return current_view_menu_entry.get_attribute('class').split(' ')[0]

    def change_main_view(self, view_name):

        if self.get_current_view() == view_name:
            return

        self.driver.find_element_by_css_selector("#wirecloud_header .menu ." + view_name).click()

        WebDriverWait(self.driver, 30).until(lambda driver: self.get_current_view() == view_name)

        if view_name == 'marketplace':
            WebDriverWait(self.driver, 30).until(marketplace_loaded)

    def check_popup_menu(self, must_be=(), must_be_absent=(), must_be_disabled=()):

        time.sleep(0.1)

        for item in must_be:
            menu_item = self.get_popup_menu_item(item)
            self.assertIsNotNone(menu_item)

        for item in must_be_absent:
            menu_item = self.get_popup_menu_item(item)
            self.assertIsNone(menu_item)

        for item in must_be_disabled:
            menu_item = self.get_popup_menu_item(item)
            self.assertIsNotNone(menu_item)
            self.assertTrue('disabled' in menu_item.get_attribute('class'))

    def add_packaged_resource_to_catalogue(self, wgt_file, widget_name, shared=False, expect_error=False):

        if shared:
            wgt_path = os.path.join(self.shared_test_data_dir, wgt_file)
        else:
            wgt_path = os.path.join(self.test_data_dir, wgt_file)
        wgt_path = os.path.abspath(wgt_path)

        self.change_main_view('marketplace')
        catalogue_base_element = self.get_current_catalogue_base_element()

        self.perform_market_action('Upload')

        self.wait_element_visible_by_css_selector('.wgt_file', element=catalogue_base_element).send_keys(wgt_path)
        catalogue_base_element.find_element_by_css_selector('.upload_wgt_button div').click()
        self.wait_wirecloud_ready()

        window_menus = len(self.driver.find_elements_by_css_selector('.window_menu'))
        if expect_error:
            if window_menus == 1:
                self.fail('Error: resource shouldn\'t be added')

            xpath = "//*[contains(@class, 'window_menu')]//*[text()='Error adding packaged resource: " + expect_error + "']"
            self.driver.find_element_by_xpath(xpath)
            self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

            return None
        else:
            if window_menus != 1:
                self.fail('Error: resource was not added')

            self.search_resource(widget_name)
            widget = self.search_in_catalogue_results(widget_name)
            self.assertIsNotNone(widget)
            return widget

    def add_template_to_catalogue(self, template_url, resource_name, expect_error=False):

        self.change_main_view('marketplace')
        catalogue_base_element = self.get_current_catalogue_base_element()

        self.perform_market_action('Upload')
        WebDriverWait(self.driver, 30).until(lambda driver: catalogue_base_element.find_element_by_css_selector('form.template_submit_form .template_uri').is_displayed())
        time.sleep(0.1)

        template_input = catalogue_base_element.find_element_by_css_selector('form.template_submit_form .template_uri')
        self.fill_form_input(template_input, template_url)
        catalogue_base_element.find_element_by_css_selector('.submit_link div').click()
        self.wait_wirecloud_ready()

        window_menus = len(self.driver.find_elements_by_css_selector('.window_menu'))
        if expect_error:
            if window_menus == 1:
                self.fail('Error: resource shouldn\'t be added')

            xpath = "//*[contains(@class, 'window_menu')]//*[text()='Error adding resource from URL: " + expect_error + "']"
            self.driver.find_element_by_xpath(xpath)
            self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

            return None
        else:
            if window_menus != 1:
                self.fail('Error: resource was not added')

            self.search_resource(resource_name)
            resource = self.search_in_catalogue_results(resource_name)
            self.assertIsNotNone(resource)
            return resource

    def search_resource(self, keyword):
        self.change_main_view('marketplace')
        self.wait_catalogue_ready()
        catalogue_base_element = self.get_current_catalogue_base_element()

        search_input = catalogue_base_element.find_element_by_css_selector('.simple_search_text')
        self.fill_form_input(search_input, keyword)
        self.driver.execute_script('''
            var evt = document.createEvent("KeyboardEvent");
            if (evt.initKeyEvent != null) {
                evt.initKeyEvent ("keypress", true, true, window, false, false, false, false, 13, 0);
            } else {
                Object.defineProperty(evt, 'keyCode', {get: function () { return 13;}});
                evt.initKeyboardEvent ("keypress", true, true, window, 0, 0, 0, 0, 0, 13);
            }
            arguments[0].dispatchEvent(evt);
        ''', search_input)

        self.wait_catalogue_ready()

    def search_in_catalogue_results(self, widget_name):

        self.wait_catalogue_ready()
        catalogue_base_element = self.get_current_catalogue_base_element()

        resources = catalogue_base_element.find_elements_by_css_selector('.resource_list .resource')
        for resource in resources:
            resource_name = resource.find_element_by_css_selector('.resource_name')
            if resource_name.text == widget_name:
                return resource

        return None

    def get_current_iwidgets(self):
        iwidget_ids = self.driver.execute_script('return opManager.activeWorkspace.getIWidgets().map(function(iwidget) {return iwidget.id;});')
        iwidget_elements = self.driver.execute_script('return opManager.activeWorkspace.getIWidgets().map(function(iwidget) {return iwidget.internal_iwidget.loaded ? iwidget.element : null;});')

        return [IWidgetTester(self, iwidget_ids[i], iwidget_elements[i]) for i in range(len(iwidget_ids))]

    def get_current_wiring_editor_ioperators(self):

        ioperators = self.driver.execute_script('''
            var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
            var ioperator_ids = [];
            var ioperator_elements = [];

            for (var key in wiringEditor.currentlyInUseOperators) {
                ioperator_ids.push(key);
                ioperator_elements.push(wiringEditor.currentlyInUseOperators[key].wrapperElement);
            }
            return [ioperator_ids, ioperator_elements];
        ''');

        return [
            IOperatorTester(self, ioperators[0][i], ioperators[1][i])
            for i in range(len(ioperators[0]))
        ]

    def instantiate(self, resource, timeout=30):

        old_iwidget_ids = self.driver.execute_script('return opManager.activeWorkspace.getIWidgets().map(function(iwidget) {return iwidget.id;});')
        old_iwidget_count = len(old_iwidget_ids)

        self.scroll_and_click(resource.find_element_by_css_selector('.instantiate_button div'))

        tmp = {
            'new_iwidget': None,
        }
        def iwidget_loaded(driver):
            if tmp['new_iwidget'] is not None and tmp['new_iwidget']['element'] is not None:
                return tmp['new_iwidget']['element'].is_displayed()

            iwidgets = self.get_current_iwidgets()
            iwidget_count = len(iwidgets)
            if iwidget_count != old_iwidget_count + 1:
                return False

            for iwidget in iwidgets:
                if iwidget['id'] not in old_iwidget_ids:
                    tmp['new_iwidget'] = iwidget

            return tmp['new_iwidget']['element'] is not None and tmp['new_iwidget']['element'].is_displayed()

        WebDriverWait(self.driver, timeout).until(iwidget_loaded)
        # TODO firefox
        time.sleep(0.1)
        return tmp['new_iwidget']

    def add_widget_to_mashup(self, widget_name, new_name=None):

        self.change_main_view('marketplace')
        self.change_marketplace('local')

        self.search_resource(widget_name)
        resource = self.search_in_catalogue_results(widget_name)
        iwidget = self.instantiate(resource)

        if new_name is not None:
            iwidget.rename(new_name)

        return iwidget

    def create_workspace_from_catalogue(self, mashup_name, expect_missing_dependencies=None, install_dependencies=False, parameters=None):

        self.change_main_view('marketplace')
        self.search_resource(mashup_name)
        resource = self.search_in_catalogue_results(mashup_name)

        resource.find_element_by_css_selector('.instantiate_button div').click()

        if expect_missing_dependencies is not None:

            continue_button = self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Continue']")
            window_menu = self.driver.find_element_by_css_selector('.window_menu.missing_dependencies')

            missing_dependency_elements = window_menu.find_elements_by_tag_name('li')
            missing_dependencies = [missing_dependency_element.text for missing_dependency_element in missing_dependency_elements]

            self.assertEqual(set(missing_dependencies), set(expect_missing_dependencies))

            if not install_dependencies:
                cancel_button = window_menu.find_element_by_xpath("//*[text()='Cancel']")
                cancel_button.click()
                return

            continue_button.click()

        self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='New Workspace']").click()

        if parameters is not None:

            save_button = self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Save']")
            window_menu = self.driver.find_element_by_css_selector('.window_menu.workspace_preferences')

            for parameter_name, parameter_value in parameters.iteritems():
                param_input = window_menu.find_element_by_css_selector('input[name="' + parameter_name + '"]')
                self.fill_form_input(param_input, parameter_value)

            time.sleep(0.2) # Work around saving form data problems
            save_button.click()

        self.wait_wirecloud_ready()
        self.assertTrue(self.get_current_workspace_name().startswith(mashup_name), 'Invalid workspace name after creating workspace from catalogue')

    def merge_mashup_from_catalogue(self, mashup_name):

        self.change_main_view('marketplace')
        self.search_resource(mashup_name)
        resource = self.search_in_catalogue_results(mashup_name)

        resource.find_element_by_css_selector('.instantiate_button div').click()
        self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Current Workspace']").click()
        self.wait_wirecloud_ready()

    def count_iwidgets(self):
        return len(self.driver.find_elements_by_css_selector('div.iwidget'))

    def get_popup_menu_item(self, item_name):

        items = self.driver.find_elements_by_css_selector('.popup_menu > .menu_item')
        for item in items:
            span = item.find_element_by_css_selector('span')
            if span and span.text == item_name:
                return item

        return None

    def popup_menu_click(self, item_name):

        self.wait_element_visible_by_css_selector('.popup_menu')
        item = self.get_popup_menu_item(item_name)
        item.click()

    def get_current_workspace_name(self):

        self.change_main_view('workspace')
        return self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').text

    def get_workspace_tab_by_name(self, tab_name):

        tabs = self.driver.find_elements_by_css_selector('.notebook.workspace .tab_wrapper .tab')
        for tab in tabs:
            span = tab.find_element_by_css_selector('span')
            if span.text == tab_name:
                return tab

        return None

    def create_workspace(self, workspace_name):
        self.change_main_view('workspace')
        self.perform_workspace_action('New workspace')

        workspace_name_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input')
        self.fill_form_input(workspace_name_input, workspace_name)
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        self.wait_wirecloud_ready()
        time.sleep(0.5)  # work around race condition
        self.assertEqual(self.get_current_workspace_name(), workspace_name)

    def rename_workspace(self, workspace_name):
        self.change_main_view('workspace')
        self.perform_workspace_action('Rename')

        workspace_name_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input')
        self.fill_form_input(workspace_name_input, workspace_name)
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        self.wait_wirecloud_ready()
        time.sleep(0.5)  # work around race condition
        self.assertEqual(self.get_current_workspace_name(), workspace_name)

    def change_current_workspace(self, workspace_name):
        self.change_main_view('workspace')

        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.popup_menu_click(workspace_name)

        self.wait_wirecloud_ready()
        self.assertEqual(self.get_current_workspace_name(), workspace_name)

    def remove_workspace(self):
        self.change_main_view('workspace')
        workspace_to_remove = self.get_current_workspace_name()
        self.perform_workspace_action('Remove')

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']").click()

        self.wait_wirecloud_ready()
        self.assertNotEqual(workspace_to_remove, self.get_current_workspace_name())

    def publish_workspace(self, info):
        self.change_main_view('workspace')

        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.popup_menu_click('Upload to local catalogue')

        self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']")

        name_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input[name="name"]')
        self.fill_form_input(name_input, info['name'])
        vendor_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input[name="vendor"]')
        self.fill_form_input(vendor_input, info['vendor'])
        version_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input[name="version"]')
        self.fill_form_input(version_input, info['version'])
        email_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input[name="email"]')
        self.fill_form_input(email_input, info['email'])

        if info.get('readOnlyWidgets', False) is True or info.get('readOnlyConnectables', False) is True:
            tabs = self.driver.find_elements_by_css_selector('.styled_form .notebook .tab_wrapper .tab')
            for tab in tabs:
                span = tab.find_element_by_css_selector('span')
                if span.text == 'Advanced':
                    tab.click()

        if info.get('readOnlyWidgets', False) is True:
            boolean_input = self.driver.find_element_by_css_selector('.window_menu [name="readOnlyWidgets"]')
            boolean_input.click()

        if info.get('readOnlyConnectables', False) is True:
            boolean_input = self.driver.find_element_by_css_selector('.window_menu [name="readOnlyConnectables"]')
            boolean_input.click()

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()
        self.wait_wirecloud_ready()

        # Check that there are not windows showing errors
        # (the loading indicator has the window_menu class so always there is one window_menu)
        window_menus = self.driver.find_elements_by_css_selector('.window_menu')
        self.assertEqual(len(window_menus), 1, 'Error publishing workspace')

    def count_workspace_tabs(self):
        return len(self.driver.find_elements_by_css_selector('#workspace .tab_wrapper .tab'))

    def add_tab(self):

        old_tab_count = self.count_workspace_tabs()

        self.change_main_view('workspace')
        self.driver.find_element_by_css_selector('#workspace .tab_wrapper .icon-add-tab').click()
        self.wait_wirecloud_ready()

        new_tab_count = self.count_workspace_tabs()
        self.assertEqual(new_tab_count, old_tab_count + 1)

        return self.driver.find_elements_by_css_selector('#workspace .tab_wrapper .tab')[-1]

    def get_current_marketplace_name(self):
        self.change_main_view('marketplace')
        try:
            return self.driver.find_element_by_css_selector('#wirecloud_breadcrum .third_level').text
        except:
            return self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').text

    def perform_market_action(self, action):
        try:
            self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        except:
            self.driver.find_element_by_css_selector('#wirecloud_breadcrum .third_level > .icon-menu').click()

        self.popup_menu_click(action)

    def perform_workspace_action(self, action):
        self.change_main_view('workspace')
        popup_button = self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu')

        if 'open' not in popup_button.get_attribute('class'):
            popup_button.click()

        self.popup_menu_click(action)

    def get_current_catalogue_base_element(self):

        catalogues = self.driver.find_elements_by_css_selector('#marketplace > .alternatives > .wrapper > .catalogue')
        for catalogue_element in catalogues:
            if 'hidden' not in catalogue_element.get_attribute('class'):
                return catalogue_element

        return None

    def add_marketplace(self, name, url, type_, expect_error=False):

        self.change_main_view('marketplace')
        self.perform_market_action("Add new marketplace")

        market_name_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input[name="name"]')
        self.fill_form_input(market_name_input, name)
        market_url_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input[name="url"]')
        self.fill_form_input(market_url_input, url)
        market_type_input = self.driver.find_element_by_css_selector('.window_menu .styled_form select')
        self.fill_form_input(market_type_input, type_)

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()
        self.wait_wirecloud_ready()
        time.sleep(0.1)  # work around some problems

        window_menus = len(self.driver.find_elements_by_css_selector('.window_menu'))
        if expect_error:
            if window_menus == 1:
                self.fail('Error: marketplace shouldn\'t be added')

            self.assertNotEqual(self.get_current_marketplace_name(), name)
        else:
            if window_menus != 1:
                self.fail('Error: marketplace was not added')

            self.assertEqual(self.get_current_marketplace_name(), name)

    def change_marketplace(self, market, timeout=30):

        self.change_main_view('marketplace')
        if self.get_current_marketplace_name() == market:
            return

        self.perform_market_action(market)
        WebDriverWait(self.driver, timeout, ignored_exceptions=(StaleElementReferenceException,)).until(lambda driver: self.get_current_marketplace_name() == market)
        self.wait_catalogue_ready()

    def delete_marketplace(self, market, expect_error=False):

        self.change_main_view('marketplace')
        self.change_marketplace(market)
        self.perform_market_action("Delete marketplace")
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']").click()
        self.wait_wirecloud_ready()

        window_menus = len(self.driver.find_elements_by_css_selector('.window_menu'))
        if expect_error:
            if window_menus == 1:
                self.fail('Error: marketplace shouldn\'t be deleted')

            self.assertEqual(self.get_current_marketplace_name(), market)
        else:
            if window_menus != 1:
                self.fail('Error: marketplace was not deleted')

            self.assertNotEqual(self.get_current_marketplace_name(), market)

    def delete_resource(self, resource_name, timeout=30):
        self.change_main_view('marketplace')
        catalogue_base_element = self.get_current_catalogue_base_element()

        self.search_resource(resource_name)
        resource = self.search_in_catalogue_results(resource_name)
        self.scroll_and_click(resource)

        WebDriverWait(self.driver, timeout).until(lambda driver: catalogue_base_element.find_element_by_css_selector('.advanced_operations').is_displayed())
        time.sleep(0.1)

        found = False
        for operation in self.driver.find_elements_by_css_selector('.advanced_operations .styled_button'):
            if operation.text == 'Delete':
                found = True
                operation.find_element_by_css_selector('div').click()
                break
        self.assertTrue(found)

        WebDriverWait(self.driver, timeout).until(lambda driver: driver.find_element_by_xpath("//*[contains(@class,'window_menu')]//*[text()='Yes']").is_displayed())
        self.driver.find_element_by_xpath("//*[contains(@class,'window_menu')]//*[text()='Yes']").click()
        self.wait_wirecloud_ready()

        self.search_resource(resource_name)
        resource = self.search_in_catalogue_results(resource_name)
        self.assertIsNone(resource)

    def uninstall_resource(self, resource_name, timeout=30):
        self.change_main_view('marketplace')
        catalogue_base_element = self.get_current_catalogue_base_element()

        self.search_resource(resource_name)
        resource = self.search_in_catalogue_results(resource_name)
        self.scroll_and_click(resource)

        WebDriverWait(self.driver, timeout).until(lambda driver: catalogue_base_element.find_element_by_css_selector('.advanced_operations').is_displayed())
        time.sleep(0.1)

        found = False
        for operation in self.driver.find_elements_by_css_selector('.advanced_operations .styled_button'):
            if operation.text == 'Uninstall':
                found = True
                operation.find_element_by_css_selector('div').click()
                break
        self.assertTrue(found)

        self.wait_wirecloud_ready()

        self.search_resource(resource_name)
        resource = self.search_in_catalogue_results(resource_name)
        self.assertIsNone(resource)
