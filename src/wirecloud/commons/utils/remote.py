# -*- coding: utf-8 -*-

# Copyright (c) 2008-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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
import shutil
import sys
import time

from django.core.urlresolvers import reverse
from django.utils.http import urlencode
from django.utils.importlib import import_module
from selenium.common.exceptions import StaleElementReferenceException
from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
import six

from wirecloud.commons.utils.expected_conditions import element_be_clickable


def marketplace_loaded(driver):
    try:
        return driver.find_element_by_css_selector('#wirecloud_breadcrum').text != 'loading marketplace view...'
    except:
        pass

    return False


class PopupMenuTester(object):

    def __init__(self, testcase, element, button=None):

        self.testcase = testcase
        self.element = element
        self.button = button

    def get_entry(self, name):

        items = self.element.find_elements_by_css_selector('.menu_item')

        for item in items:
            span = item.find_element_by_css_selector('span')
            if span and span.text == name:
                return item

        return None

    def click_entry(self, item_name):

        if not isinstance(item_name, tuple):
            item_name = (item_name,)

        tester = self
        prev_popups = self.testcase.driver.find_elements_by_css_selector('.popup_menu')
        for i, entry in enumerate(item_name[:-1]):
            current_element = tester.get_entry(entry)
            ActionChains(self.testcase.driver).move_to_element(current_element).perform()
            WebDriverWait(self.testcase.driver, 5).until(lambda driver: len(driver.find_elements_by_css_selector('.popup_menu')) > len(prev_popups))
            next_popups = self.testcase.driver.find_elements_by_css_selector('.popup_menu')
            next_popup = next_popups[-1]
            tester = PopupMenuTester(self.testcase, next_popup)
            prev_popups = next_popups

        tester.get_entry(item_name[-1]).click()

    def check(self, must_be=(), must_be_absent=(), must_be_disabled=()):

        for item in must_be:
            menu_item = self.get_entry(item)
            self.testcase.assertIsNotNone(menu_item, '"%(item)s" item should be present' % { 'item': item })
            self.testcase.assertFalse('disabled' in menu_item.get_attribute('class'), '"%(item)s" item should be enabled' % { 'item': item })

        for item in must_be_absent:
            menu_item = self.get_entry(item)
            self.testcase.assertIsNone(menu_item, '"%(item)s" item shouldn\'t be present' % { 'item': item })

        for item in must_be_disabled:
            menu_item = self.get_entry(item)
            self.testcase.assertIsNotNone(menu_item, '"%(item)s" item should be present' % { 'item': item })
            self.testcase.assertTrue('disabled' in menu_item.get_attribute('class'), '"%(item)s" item shouldn\'t be enabled' % { 'item': item })

        return self

    def close(self):
        if self.button is not None:
            self.button.click()



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

    def open_menu(self):
        ActionChains(self.testcase.driver).context_click(self.element).perform()
        popup_menu_element = self.testcase.wait_element_visible_by_css_selector('.popup_menu')

        return PopupMenuTester(self.testcase, popup_menu_element)


class IWidgetTester(object):

    def __init__(self, testcase, iwidget_id, element):

        self.testcase = testcase
        self.id = iwidget_id
        self.element = element

    def __getitem__(self, key):

        if key == 'id':
            return self.id

    def __enter__(self):
        self.content_element = self.testcase.driver.execute_script('return Wirecloud.activeWorkspace.getIWidget(%d).content;' % self.id)

        self.testcase.driver.switch_to.frame(self.content_element)
        return None

    def __exit__(self, type, value, traceback):
        self.testcase.driver.switch_to.frame(None)

        # TODO work around webdriver bugs
        self.testcase.driver.switch_to.default_content()

    @property
    def name(self):
        return self.element.find_element_by_css_selector('.widget_menu > span').text

    @property
    def error_count(self):
        driver = self.testcase.driver

        old_frame = driver.execute_script("return window.frameElement")
        driver.switch_to.default_content()
        error_count = driver.execute_script('return Wirecloud.activeWorkspace.getIWidget(%s).internal_iwidget.logManager.errorCount' % self.id)
        driver.switch_to.frame(old_frame)

        return error_count

    @property
    def log_entries(self):
        driver = self.testcase.driver

        old_frame = driver.execute_script("return window.frameElement")
        driver.switch_to.default_content()
        log_entries = driver.execute_script('''
            var iwidget = Wirecloud.activeWorkspace.getIWidget(%s).internal_iwidget;
            return iwidget.logManager.entries.map(function (entry) { return {date: entry.date.getTime(), level: entry.level, msg: entry.msg}; });
        ''' % self.id)
        driver.switch_to.frame(old_frame)

        return log_entries

    @property
    def layout_position(self):

        return tuple(self.testcase.driver.execute_script('''
            var iwidget = Wirecloud.activeWorkspace.getIWidget(%s);
            var position = iwidget.getPosition();
            return [position.x, position.y];
        ''' % self.id));

    def open_menu(self):

        button = self.element.find_element_by_css_selector('.icon-cogs')
        button.click()
        popup_menu_element = self.testcase.wait_element_visible_by_css_selector('.popup_menu')

        return PopupMenuTester(self.testcase, popup_menu_element, button)

    def rename(self, new_name, timeout=30):

        self.open_menu().click_entry('Rename')
        name_input = self.element.find_element_by_css_selector('.widget_menu > span')
        WebDriverWait(self.testcase.driver, 5).until(lambda driver: name_input.get_attribute('contenteditable') == 'true')
        # We cannot use send_keys due to http://code.google.com/p/chromedriver/issues/detail?id=35
        self.testcase.driver.execute_script('arguments[0].textContent = arguments[1]', name_input, new_name)
        self.element.find_element_by_css_selector('.statusBar').click()

        def name_changed(driver):
            return driver.execute_script('return Wirecloud.activeWorkspace.getIWidget(%s).name === "%s"' % (self.id, new_name))

        WebDriverWait(self.testcase.driver, timeout).until(name_changed)

    def wait_loaded(self, timeout=10):

        def iwidget_loaded(driver):
            iwidget_element = driver.execute_script('''
                var iwidget = Wirecloud.activeWorkspace.getIWidget(%s);
                return iwidget.internal_iwidget.loaded ? iwidget.element : null;
            ''' % self.id)

            if iwidget_element is not None:
                self.element = iwidget_element
                return True

            return False

        WebDriverWait(self.testcase.driver, timeout).until(iwidget_loaded)

    def remove(self, timeout=30):

        old_iwidget_ids = self.testcase.driver.execute_script('return Wirecloud.activeWorkspace.getIWidgets().map(function(iwidget) {return iwidget.id;});')
        old_iwidget_count = len(old_iwidget_ids)

        self.element.find_element_by_css_selector('.icon-remove').click()

        def iwidget_unloaded(driver):
            iwidgets = self.testcase.get_current_iwidgets()
            iwidget_count = len(iwidgets)
            return iwidget_count == old_iwidget_count - 1

        WebDriverWait(self.testcase.driver, timeout).until(iwidget_unloaded)


class WidgetWalletResourceTester(object):

    def __init__(self, testcase, element):
        self.testcase = testcase
        self.element = element

    def instantiate(self):

        old_iwidget_ids = self.testcase.driver.execute_script('return Wirecloud.activeWorkspace.getIWidgets().map(function(iwidget) {return iwidget.id;});')
        old_iwidget_count = len(old_iwidget_ids)

        self.testcase.scroll_and_click(self.element.find_element_by_css_selector('.mainbutton'))

        tmp = {
            'new_iwidget': None,
        }
        def iwidget_loaded(driver):
            if tmp['new_iwidget'] is not None and tmp['new_iwidget'].element is not None:
                return tmp['new_iwidget'].element.is_displayed()

            iwidgets = self.testcase.get_current_iwidgets()
            iwidget_count = len(iwidgets)
            if iwidget_count != old_iwidget_count + 1:
                return False

            for iwidget in iwidgets:
                if iwidget['id'] not in old_iwidget_ids:
                    tmp['new_iwidget'] = iwidget

            return tmp['new_iwidget']['element'] is not None and tmp['new_iwidget']['element'].is_displayed()

        WebDriverWait(self.testcase.driver, 10).until(iwidget_loaded)
        # TODO firefox
        time.sleep(0.1)
        return tmp['new_iwidget']


class MashupWalletResourceTester(object):

    def __init__(self, testcase, element):
        self.testcase = testcase
        self.element = element

    def merge(self):
        workspace_name = self.testcase.get_current_workspace_name()
        self.testcase.scroll_and_click(self.element.find_element_by_css_selector('.mainbutton'))
        self.testcase.wait_wirecloud_ready()
        self.testcase.assertEqual(self.testcase.get_current_workspace_name(), workspace_name)


class SelectableMACTester(object):

    def __init__(self, testcase, element):
        self.testcase = testcase
        self.element = element

    def select(self):
        self.testcase.scroll_and_click(self.element.find_element_by_css_selector('.mainbutton'))
        WebDriverWait(self.testcase.driver, 10).until(EC.invisibility_of_element_located((By.CSS_SELECTOR, '.window_menu.mac_selection_dialog')))


class WalletTester(object):

    def __init__(self, testcase):

        self.testcase = testcase
        self.element = None

    def __exit__(self, type, value, traceback):

        try:
            WebDriverWait(self.testcase.driver, 5).until(element_be_clickable((By.CSS_SELECTOR, ".widget_wallet .icon-remove"), base_element=self.element)).click()
        except StaleElementReferenceException:
            pass

        WebDriverWait(self.testcase.driver, 5).until(EC.staleness_of(self.element))
        self.element = None

    def wait_ready(self, timeout=10):

        WebDriverWait(self.testcase.driver, timeout).until(lambda driver: 'in' in self.element.get_attribute('class'))

        list_element = self.element.find_element_by_css_selector('.widget_wallet_list')
        WebDriverWait(self.testcase.driver, timeout).until(lambda driver: 'disabled' not in list_element.get_attribute('class'))
        time.sleep(0.1)

    def search(self, keywords):

        search_input = self.element.find_element_by_css_selector('.se-text-field')
        self.testcase.fill_form_input(search_input, keywords)
        self.testcase.driver.execute_script('''
            var evt = document.createEvent("KeyboardEvent");
            if (evt.initKeyEvent != null) {
                evt.initKeyEvent ("keypress", true, true, window, false, false, false, false, 13, 0);
            } else {
                Object.defineProperty(evt, 'keyCode', {get: function () { return 13;}});
                evt.initKeyboardEvent ("keypress", true, true, window, 0, 0, 0, 0, 0, 13);
            }
            arguments[0].dispatchEvent(evt);
        ''', search_input)


class MashupWalletTester(WalletTester):

    def __enter__(self):

        self.testcase.wait_element_visible_by_css_selector('.wirecloud_toolbar .icon-random').click()
        self.element = self.testcase.driver.find_element_by_css_selector('#workspace .widget_wallet')
        return self

    def search_in_results(self, widget_name):

        self.wait_ready()

        resources = self.element.find_elements_by_css_selector('.widget_wallet_list > .resource')
        for resource in resources:
            resource_name = resource.find_element_by_css_selector('.resource_name')
            if resource_name.text == widget_name:
                return MashupWalletResourceTester(self.testcase, resource)

        return None


class WidgetWalletTester(WalletTester):

    def __enter__(self):

        self.testcase.wait_element_visible_by_css_selector('.wirecloud_toolbar .icon-plus').click()
        self.element = self.testcase.driver.find_element_by_css_selector('#workspace .widget_wallet')
        return self

    def search_in_results(self, widget_name):

        self.wait_ready()

        resources = self.element.find_elements_by_css_selector('.widget_wallet_list > .resource')
        for resource in resources:
            resource_name = resource.find_element_by_css_selector('.resource_name')
            if resource_name.text == widget_name:
                return WidgetWalletResourceTester(self.testcase, resource)

        return None


class MACFieldTester(WalletTester):

    def __init__(self, testcase, field_element):

        super(MACFieldTester, self).__init__(testcase)
        self.field_element = field_element

    def __enter__(self):
        self.field_element.find_element_by_css_selector('.icon-search').click()
        self.element = self.testcase.wait_element_visible_by_css_selector('.window_menu.mac_selection_dialog')
        return self

    def __exit__(self, type, value, traceback):
        try:
            # Calling any method forces a staleness check
            self.element.is_enabled()
        except StaleElementReferenceException:
            self.element = None

        if self.element is not None:
            self.element.find_element_by_css_selector('.window_bottom .styled_button').click()
            WebDriverWait(self.testcase.driver, 5).until(EC.staleness_of(self.element))
            self.element = None

    def search_in_results(self, widget_name):

        self.wait_ready()

        resources = self.element.find_elements_by_css_selector('.widget_wallet_list > .resource')
        for resource in resources:
            resource_name = resource.find_element_by_css_selector('.resource_name')
            if resource_name.text == widget_name:
                return SelectableMACTester(self.testcase, resource)

        return None


class WiringEntityTester(object):

    def __init__(self, testcase, entity_id, element):

        self.testcase = testcase
        self.element = element
        self.id = entity_id

    def open_menu(self):
        button = self.testcase.wait_element_visible_by_css_selector('.editPos_button', element=self.element)
        button.click()
        popup_menu_element = self.testcase.wait_element_visible_by_css_selector('.popup_menu')

        return PopupMenuTester(self.testcase, popup_menu_element, button)


class WiringIOperatorTester(WiringEntityTester):

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
        return self.testcase.driver.execute_script('return Wirecloud.activeWorkspace.wiring.ioperators[%s].logManager.errorCount' % self.id)

    @property
    def log_entries(self):
        return self.testcase.driver.execute_script('''
            var ioperator = Wirecloud.activeWorkspace.wiring.ioperators[%s];
            return ioperator.logManager.entries.map(function (entry) { return {date: entry.date.getTime(), level: entry.level, msg: entry.msg}; });
        ''' % self.id)


class WiringIWidgetTester(WiringEntityTester):

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

    @property
    def error_count(self):
        return self.testcase.driver.execute_script('return Wirecloud.activeWorkspace.getIWidget(%s).logManager.errorCount' % self.id)

    @property
    def log_entries(self):
        return self.testcase.driver.execute_script('''
            var ioperator = Wirecloud.activeWorkspace.getIWidget(%s);
            return ioperator.logManager.entries.map(function (entry) { return {date: entry.date.getTime(), level: entry.level, msg: entry.msg}; });
        ''' % self.id)


class WorkspaceTabTester(object):

    def __init__(self, testcase, element):

        self.testcase = testcase
        self.element = element

    def open_menu(self):

        tab_menu_button = self.testcase.wait_element_visible_by_css_selector('.icon-tab-menu', element=self.element)
        tab_menu_button.click()
        popup_menu_element = self.testcase.wait_element_visible_by_css_selector('.popup_menu')

        return PopupMenuTester(self.testcase, popup_menu_element, tab_menu_button)


class RemoteTestCase(object):

    def fill_form_input(self, form_input, value):
        # We cannot use send_keys due to http://code.google.com/p/chromedriver/issues/detail?id=35
        self.driver.execute_script('arguments[0].value = arguments[1]', form_input, value)

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

    def get_current_iwidgets(self, tab=None):

        if tab is None:
            iwidget_ids = self.driver.execute_script('return Wirecloud.activeWorkspace.getIWidgets().map(function(iwidget) {return iwidget.id;});')
            iwidget_elements = self.driver.execute_script('return Wirecloud.activeWorkspace.getIWidgets().map(function(iwidget) {return iwidget.internal_iwidget.loaded ? iwidget.element : null;});')
        else:
            iwidget_ids = self.driver.execute_script('return Wirecloud.activeWorkspace.getTab(arguments[0]).getIWidgets().map(function(iwidget) {return iwidget.id;});', tab)
            iwidget_elements = self.driver.execute_script('return Wirecloud.activeWorkspace.getTab(arguments[0]).getIWidgets().map(function(iwidget) {return iwidget.internal_iwidget.loaded ? iwidget.element : null;});', tab)

        # Work around race condition reading iwidget ids and elements
        if len(iwidget_ids) != len(iwidget_elements):
            time.sleep(0.1)
            return self.get_current_iwidgets(tab)

        return [IWidgetTester(self, iwidget_ids[i], iwidget_elements[i]) for i in range(len(iwidget_ids))]


class WirecloudRemoteTestCase(RemoteTestCase):

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

        # Remove chrome/chromium temporal directories
        if 'chrome' in cls.driver.capabilities:
            shutil.rmtree(cls.driver.capabilities['chrome']['userDataDir'], ignore_errors=True)

        cls.driver.quit()

    def setUp(self):

        self.widget_wallet = WidgetWalletTester(self)
        self.mashup_wallet = MashupWalletTester(self)
        self.marketplace_view = MarketplaceViewTester(self)
        self.myresources_view = MyResourcesViewTester(self)
        self.wiring_view = WiringViewTester(self)

    def tearDown(self):

        self.driver.delete_all_cookies()

    def scroll_and_click(self, element):

        # Work around chrome and firefox driver bugs
        try:
            self.driver.execute_script("arguments[0].scrollIntoView(false);", element);
        except:
            pass
        ActionChains(self.driver).click(element).perform()

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
            self.driver.execute_script("arguments[0].click();", loading_message)
        except:
            pass

        time.sleep(0.1)  # work around some problems

    def login(self, username='admin', password='admin', next=None):

        url = self.live_server_url + '/login'
        if next is not None:
            url += '?next=' + next

        self.driver.get(url)

        username_input = self.wait_element_visible_by_css_selector('#id_username')
        self.fill_form_input(username_input, username)
        password_input = self.driver.find_element_by_id('id_password')
        self.fill_form_input(password_input, password)
        password_input.submit()

        self.wait_wirecloud_ready()

    def get_current_view(self):

        try:
            return self.driver.execute_script("return LayoutManagerFactory.getInstance().header.currentView.view_name;");
        except:
            return ""

    def open_menu(self):
        button = self.wait_element_visible_by_css_selector('.wirecloud_header_nav .icon-reorder')
        button.click()
        popup_menu_element = self.wait_element_visible_by_css_selector('.popup_menu')

        return PopupMenuTester(self, popup_menu_element, button)

    def create_workspace(self, name=None, mashup=None, expect_missing_dependencies=None, install_dependencies=False, parameters=None):

        if mashup is None and name is None:
            raise ValueError('Missing workspace name')

        self.open_menu().click_entry('New workspace')

        dialog = self.driver.find_element_by_css_selector('.window_menu.new_workspace')
        form = self.driver.find_element_by_css_selector('.styled_form')
        if name:
            name_input = form.find_element_by_css_selector('input')
            self.fill_form_input(name_input, name)

        if mashup:
            with MACFieldTester(self, form.find_element_by_css_selector('.styled_mac_field')) as select_dialog:
                select_dialog.search(mashup)
                resource = select_dialog.search_in_results(mashup)
                resource.select()

        dialog.find_element_by_xpath("//*[text()='Accept']").click()

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

        if parameters is not None:

            save_button = self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Save']")
            window_menu = self.driver.find_element_by_css_selector('.window_menu.workspace_preferences')

            for parameter_name, parameter_value in six.iteritems(parameters):
                param_input = window_menu.find_element_by_css_selector('input[name="' + parameter_name + '"]')
                self.fill_form_input(param_input, parameter_value)

            time.sleep(0.2) # Work around saving form data problems
            save_button.click()

        self.wait_wirecloud_ready()

        if name is not None:
            self.assertEqual(self.get_current_workspace_name(), name)
        else:
            self.assertTrue(self.get_current_workspace_name().startswith(mashup), 'Invalid workspace name after creating workspace from catalogue')

    def count_iwidgets(self):
        return len(self.driver.find_elements_by_css_selector('div.iwidget'))

    def get_current_workspace_name(self):

        return self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').text

    def get_workspace_tab_by_name(self, tab_name):

        tabs = self.driver.find_elements_by_css_selector('.notebook.workspace .tab_wrapper .tab')
        for tab in tabs:
            span = tab.find_element_by_css_selector('span')
            if span.text == tab_name:
                return WorkspaceTabTester(self, tab)

        return None

    def add_widget_to_mashup(self, widget_name, new_name=None):

        with self.widget_wallet as wallet:
            wallet.search(widget_name)
            resource = wallet.search_in_results(widget_name)
            iwidget = resource.instantiate()

        if new_name is not None:
            iwidget.rename(new_name)

        return iwidget

    def rename_workspace(self, workspace_name):
        self.open_menu().click_entry('Rename')

        workspace_name_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input')
        self.fill_form_input(workspace_name_input, workspace_name)
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        self.wait_wirecloud_ready()
        time.sleep(0.5)  # work around race condition
        self.assertEqual(self.get_current_workspace_name(), workspace_name)

    def change_current_workspace(self, workspace_name):
        self.open_menu().click_entry(workspace_name)

        self.wait_wirecloud_ready()
        self.assertEqual(self.get_current_workspace_name(), workspace_name)

    def remove_workspace(self):
        workspace_to_remove = self.get_current_workspace_name()
        self.open_menu().click_entry('Remove')

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']").click()

        self.wait_wirecloud_ready()
        self.assertNotEqual(workspace_to_remove, self.get_current_workspace_name())

    def publish_workspace(self, info):

        self.open_menu().click_entry('Upload to local catalogue')

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

        self.driver.find_element_by_css_selector('#workspace .tab_wrapper .icon-add-tab').click()
        self.wait_wirecloud_ready()

        new_tab_count = self.count_workspace_tabs()
        self.assertEqual(new_tab_count, old_tab_count + 1)

        element = self.driver.find_elements_by_css_selector('#workspace .tab_wrapper .tab')[-1]
        return WorkspaceTabTester(self, element)


class MarketplaceViewTester(object):

    def __init__(self, testcase):

        self.testcase = testcase
        self.myresources = MyResourcesViewTester(testcase, self)

    def __enter__(self):
        self.testcase.wait_element_visible_by_css_selector(".wirecloud_toolbar .icon-shopping-cart").click()
        WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'marketplace')
        WebDriverWait(self.testcase.driver, 10).until(marketplace_loaded)
        return self

    def __exit__(self, type, value, traceback):
        WebDriverWait(self.testcase.driver, 5).until(element_be_clickable((By.CSS_SELECTOR, ".wirecloud_header_nav .icon-caret-left"), parent=True)).click()
        WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'workspace')

    def get_current_catalogue_base_element(self):

        catalogues = self.testcase.driver.find_elements_by_css_selector('#marketplace > .alternatives > .wrapper > .catalogue')
        for catalogue_element in catalogues:
            if 'hidden' not in catalogue_element.get_attribute('class'):
                return catalogue_element

        return None

    def wait_catalogue_ready(self, timeout=20):
        time.sleep(0.1)
        catalogue_element = self.get_current_catalogue_base_element()
        search_view = catalogue_element.find_element_by_class_name('search_interface')
        WebDriverWait(self.testcase.driver, timeout).until(lambda driver: 'disabled' not in search_view.get_attribute('class'))

        return catalogue_element

    def open_menu(self):
        button = self.testcase.wait_element_visible_by_css_selector('.wirecloud_header_nav .icon-reorder')
        button.click()
        popup_menu_element = self.testcase.wait_element_visible_by_css_selector('.popup_menu')

        return PopupMenuTester(self.testcase, popup_menu_element, button)

    def get_current_marketplace_name(self):
        breadcrum = self.testcase.driver.find_element_by_id('wirecloud_breadcrum').text
        if breadcrum.startswith('marketplace/'):
            return breadcrum.split('/')[-1]
        else:
            return None

    def switch_to(self, market, timeout=10):

        if self.get_current_marketplace_name() == market:
            return

        self.open_menu().click_entry(market)
        WebDriverWait(self.testcase.driver, timeout, ignored_exceptions=(StaleElementReferenceException,)).until(lambda driver: self.get_current_marketplace_name() == market)
        self.wait_catalogue_ready()

    def add(self, name, url, type_, expect_error=False, public=False):

        self.open_menu().click_entry("Add new marketplace")

        market_name_input = self.testcase.driver.find_element_by_css_selector('.window_menu .styled_form input[name="name"]')
        self.testcase.fill_form_input(market_name_input, name)
        market_url_input = self.testcase.driver.find_element_by_css_selector('.window_menu .styled_form input[name="url"]')
        self.testcase.fill_form_input(market_url_input, url)
        market_type_input = self.testcase.driver.find_element_by_css_selector('.window_menu .styled_form select')
        self.testcase.fill_form_input(market_type_input, type_)

        if public:
            self.testcase.driver.find_element_by_css_selector('.window_menu .styled_form input[name="public"]').click()

        self.testcase.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()
        self.testcase.wait_wirecloud_ready()
        time.sleep(0.1)  # work around some problems

        window_menus = len(self.testcase.driver.find_elements_by_css_selector('.window_menu'))
        if expect_error:
            if window_menus == 1:
                self.testcase.fail('Error: marketplace shouldn\'t be added')

            self.testcase.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()
            self.testcase.assertNotEqual(self.get_current_marketplace_name(), name)
        else:
            if window_menus != 1:
                self.testcase.fail('Error: marketplace was not added')

            self.testcase.assertEqual(self.get_current_marketplace_name(), name)
            self.wait_catalogue_ready()

    def delete(self, expect_error=False):

        market = self.get_current_marketplace_name()

        self.open_menu().click_entry("Delete marketplace")
        self.testcase.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']").click()
        self.testcase.wait_wirecloud_ready()

        window_menus = len(self.testcase.driver.find_elements_by_css_selector('.window_menu'))
        if expect_error:
            if window_menus == 1:
                self.testcase.fail('Error: marketplace shouldn\'t be deleted')

            self.testcase.assertEqual(self.get_current_marketplace_name(), market)
        else:
            if window_menus != 1:
                self.testcase.fail('Error: marketplace was not deleted')

            self.testcase.assertNotEqual(self.get_current_marketplace_name(), market)

    def search(self, keyword):
        catalogue_base_element = self.wait_catalogue_ready()

        search_input = catalogue_base_element.find_element_by_css_selector('.simple_search_text')
        self.testcase.fill_form_input(search_input, keyword)
        self.testcase.driver.execute_script('''
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

    def search_in_results(self, resource_name):

        catalogue_base_element = self.wait_catalogue_ready()

        resources = catalogue_base_element.find_elements_by_css_selector('.resource_list .resource')
        for resource in resources:
            c_resource_name = resource.find_element_by_css_selector('.resource_name').text
            if c_resource_name == resource_name:
                return resource

        return None


class MyResourcesViewTester(MarketplaceViewTester):

    def __init__(self, testcase, marketplace_view=None):

        self.testcase = testcase
        self.marketplace_view = marketplace_view

    def __enter__(self):
        self.testcase.wait_element_visible_by_css_selector(".wirecloud_toolbar .icon-archive").click()
        WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'myresources')
        return self

    def __exit__(self, type, value, traceback):
        if self.marketplace_view is None:
            WebDriverWait(self.testcase.driver, 5).until(element_be_clickable((By.CSS_SELECTOR, ".wirecloud_header_nav .icon-caret-left"), parent=True)).click()

            WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'workspace')
        else:
            self.testcase.wait_element_visible_by_css_selector(".wirecloud_toolbar .icon-shopping-cart").click()

            WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'marketplace')

    def get_current_catalogue_base_element(self):
        return self.testcase.driver.find_element_by_css_selector('.catalogue.myresources')

    def upload_resource(self, wgt_file, resource_name, shared=False, expect_error=False):

        if shared:
            wgt_path = os.path.join(self.testcase.shared_test_data_dir, wgt_file)
        else:
            wgt_path = os.path.join(self.testcase.test_data_dir, wgt_file)
        wgt_path = os.path.abspath(wgt_path)

        catalogue_base_element = self.wait_catalogue_ready()

        self.testcase.wait_element_visible_by_css_selector(".wirecloud_toolbar .icon-cloud-upload").click()

        self.testcase.wait_element_visible_by_css_selector('.wgt_file', element=catalogue_base_element).send_keys(wgt_path)
        catalogue_base_element.find_element_by_css_selector('.upload_wgt_button').click()
        self.testcase.wait_wirecloud_ready()

        window_menus = len(self.testcase.driver.find_elements_by_css_selector('.window_menu'))
        if expect_error:
            if window_menus == 1:
                self.testcase.fail('Error: resource shouldn\'t be added')

            xpath = "//*[contains(@class, 'window_menu')]//*[text()='Error adding packaged resource: " + expect_error + "']"
            self.testcase.driver.find_element_by_xpath(xpath)
            self.testcase.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

            self.testcase.driver.find_element_by_css_selector(".wirecloud_header_nav .icon-caret-left").click()

            return None
        else:
            if window_menus != 1:
                self.testcase.fail('Error: resource was not added')

            self.search(resource_name)
            resource = self.search_in_results(resource_name)
            self.testcase.assertIsNotNone(resource)
            return resource

    def delete_resource(self, resource_name, timeout=30):
        catalogue_base_element = self.get_current_catalogue_base_element()

        self.search(resource_name)
        resource = self.search_in_results(resource_name)
        self.testcase.scroll_and_click(resource)

        WebDriverWait(self.testcase.driver, timeout).until(lambda driver: catalogue_base_element.find_element_by_css_selector('.advanced_operations').is_displayed())
        time.sleep(0.1)

        found = False
        for operation in catalogue_base_element.find_elements_by_css_selector('.advanced_operations .styled_button'):
            if operation.text == 'Delete':
                found = True
                operation.click()
                break
        self.testcase.assertTrue(found)

        WebDriverWait(self.testcase.driver, timeout).until(lambda driver: driver.find_element_by_xpath("//*[contains(@class,'window_menu')]//*[text()='Yes']").is_displayed())
        self.testcase.driver.find_element_by_xpath("//*[contains(@class,'window_menu')]//*[text()='Yes']").click()
        self.testcase.wait_wirecloud_ready()

        self.search(resource_name)
        resource = self.search_in_results(resource_name)
        self.testcase.assertIsNone(resource)

    def uninstall_resource(self, resource_name, timeout=30, expect_error=False):
        catalogue_base_element = self.wait_catalogue_ready()

        self.search(resource_name)
        resource = self.search_in_results(resource_name)
        self.testcase.scroll_and_click(resource)

        WebDriverWait(self.testcase.driver, timeout).until(lambda driver: catalogue_base_element.find_element_by_css_selector('.advanced_operations').is_displayed())
        time.sleep(0.1)

        uninstall_button = None
        for operation in catalogue_base_element.find_elements_by_css_selector('.advanced_operations .styled_button'):
            if operation.text == 'Uninstall':
                uninstall_button = operation
                break

        if expect_error:
            self.testcase.assertIsNone(uninstall_button)
            self.testcase.driver.find_element_by_css_selector(".wirecloud_header_nav .icon-caret-left").click()
        else:
            self.testcase.assertIsNotNone(uninstall_button)
            uninstall_button.click()

            self.testcase.wait_wirecloud_ready()

            self.search(resource_name)
            resource = self.search_in_results(resource_name)
            self.testcase.assertIsNone(resource)


class WiringViewTester(object):

    def __init__(self, testcase):

        self.testcase = testcase
        self.expect_error = False

    def __enter__(self):
        self.testcase.wait_element_visible_by_css_selector(".wirecloud_toolbar .icon-puzzle-piece").click()
        if self.expect_error is False:
            wiring_loaded = lambda driver: self.testcase.get_current_view() == 'wiring' and 'disabled' not in driver.find_element_by_css_selector('.wiring_editor').get_attribute('class')
            WebDriverWait(self.testcase.driver, 10).until(wiring_loaded)
        return self

    def __exit__(self, type, value, traceback):
        if self.expect_error is False or self.testcase.get_current_view() == 'wiring':
            self.testcase.driver.find_element_by_css_selector(".wirecloud_header_nav .icon-caret-left").click()
            WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'workspace')
        self.expect_error = False

    def get_ioperators(self):

        ioperators = self.testcase.driver.execute_script('''
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
            WiringIOperatorTester(self.testcase, ioperators[0][i], ioperators[1][i])
            for i in range(len(ioperators[0]))
        ]

    def get_iwidget(self, iwidget):
        if isinstance(iwidget, IWidgetTester):
            iwidget_id = iwidget.id
        else:
            iwidget_id = iwidget

        return WiringIWidgetTester(self.testcase, iwidget_id, None)


class MobileWirecloudRemoteTestCase(RemoteTestCase):

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

        # Remove chrome/chromium temporal directories
        if 'chrome' in cls.driver.capabilities:
            shutil.rmtree(cls.driver.capabilities['chrome']['userDataDir'], ignore_errors=True)

        cls.driver.quit()

    def login(self, username='admin', password='admin', next=None):

        url = self.live_server_url
        url += reverse('login')
        if next is not None:
            next_url = next
        else:
            next_url = self.live_server_url
        next_url += "?mode=smartphone"
        url += "?" + urlencode({'next': next_url})

        self.driver.get(url)
        self.wait_element_visible_by_css_selector('#id_username')

        username_input = self.driver.find_element_by_id('id_username')
        self.fill_form_input(username_input, username)
        password_input = self.driver.find_element_by_id('id_password')
        self.fill_form_input(password_input, password)
        password_input.submit()

        self.wait_wirecloud_ready()

    def wait_wirecloud_ready(self):

        self.wait_element_visible_by_css_selector('.wirecloud_tab')
