# -*- coding: utf-8 -*-

# Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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
from selenium.common.exceptions import NoSuchElementException, StaleElementReferenceException
from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait
import six

from wirecloud.commons.utils import expected_conditions as WEC


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

        items = self.element.find_elements_by_css_selector('.se-popup-menu-item')

        for item in items:
            span = item.find_element_by_css_selector('span:not([class*="se-icon"])')
            if span and span.text == name:
                return item

        return None

    def click_entry(self, item_name):

        if not isinstance(item_name, tuple):
            item_name = (item_name,)

        tester = self
        prev_popups = self.testcase.driver.find_elements_by_css_selector('.se-popup-menu')
        for i, entry in enumerate(item_name[:-1]):
            current_element = tester.get_entry(entry)
            ActionChains(self.testcase.driver).move_to_element(current_element).perform()
            WebDriverWait(self.testcase.driver, 5).until(lambda driver: len(driver.find_elements_by_css_selector('.se-popup-menu')) > len(prev_popups))
            next_popups = self.testcase.driver.find_elements_by_css_selector('.se-popup-menu')
            next_popup = next_popups[-1]
            tester = PopupMenuTester(self.testcase, next_popup)
            prev_popups = next_popups

        tester.get_entry(item_name[-1]).click()

    def check(self, must_be=(), must_be_absent=(), must_be_disabled=()):

        for item in must_be:
            menu_item = self.get_entry(item)
            self.testcase.assertIsNotNone(menu_item, '"%(item)s" item should be present' % {'item': item})
            self.testcase.assertFalse('disabled' in menu_item.get_attribute('class'), '"%(item)s" item should be enabled' % {'item': item})

        for item in must_be_absent:
            menu_item = self.get_entry(item)
            self.testcase.assertIsNone(menu_item, '"%(item)s" item shouldn\'t be present' % {'item': item})

        for item in must_be_disabled:
            menu_item = self.get_entry(item)
            self.testcase.assertIsNotNone(menu_item, '"%(item)s" item should be present' % {'item': item})
            self.testcase.assertTrue('disabled' in menu_item.get_attribute('class'), '"%(item)s" item shouldn\'t be enabled' % {'item': item})

        return self

    def close(self):
        if self.button is not None:
            self.button.click()
            WebDriverWait(self.testcase.driver, 5).until(EC.staleness_of(self.element))


class IWidgetTester(object):

    def __init__(self, testcase, iwidget_id, element):

        self.testcase = testcase
        self.id = iwidget_id
        self.element = element

    def __getitem__(self, key):

        if key == 'id':
            return self.id

    def __eq__(self, other):
        return isinstance(other, IWidgetTester) and other.id == self.id

    def __enter__(self):
        self.content_element = self.testcase.driver.execute_script('return Wirecloud.activeWorkspace.getIWidget("%s").content;' % self.id)

        self.testcase.driver.switch_to.frame(self.content_element)
        return None

    def __exit__(self, type, value, traceback):
        self.testcase.driver.switch_to.frame(None)

        # TODO work around webdriver bugs
        self.testcase.driver.switch_to.default_content()

    @property
    def title_element(self):
        return self.element.find_element_by_css_selector('.widget_menu > span')

    @property
    def name(self):
        return self.title_element.text

    @property
    def title(self):
        return self.name

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
        ''' % self.id))

    def open_menu(self):

        button = WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".icon-cogs"), base_element=self.element, parent=True))
        button.click()
        popup_menu_element = self.testcase.wait_element_visible_by_css_selector('.se-popup-menu')

        return PopupMenuTester(self.testcase, popup_menu_element, button)

    def rename(self, new_name, timeout=30):

        self.open_menu().click_entry('Rename')
        name_input = self.element.find_element_by_css_selector('.widget_menu > span')
        WebDriverWait(self.testcase.driver, 5).until(lambda driver: name_input.get_attribute('contenteditable') == 'true')
        # We cannot use send_keys due to http://code.google.com/p/chromedriver/issues/detail?id=35
        self.testcase.driver.execute_script('arguments[0].textContent = arguments[1]', name_input, new_name)
        self.testcase.driver.execute_script('''
            var evt = document.createEvent("KeyboardEvent");
            if (evt.initKeyEvent != null) {
                evt.initKeyEvent("keydown", true, true, window, false, false, false, false, 13, 0);
            } else {
                Object.defineProperty(evt, 'keyCode', {get: function () { return 13;}});
                evt.initKeyboardEvent("keydown", true, true, window, 0, 0, 0, 0, 0, 13);
            }
            arguments[0].dispatchEvent(evt);
        ''', name_input)

        def name_changed(driver):
            return driver.execute_script('return Wirecloud.activeWorkspace.getIWidget(%s).title === "%s"' % (self.id, new_name))

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

        WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_still(self.element))
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


class CatalogueEntryTester(object):

    def __init__(self, testcase, element, catalogue, name):

        self.testcase = testcase
        self.element = element
        self.catalogue = catalogue
        self.name = name

    def __enter__(self):

        catalogue_base_element = self.catalogue.get_current_catalogue_base_element()
        self.testcase.scroll_and_click(self.element)
        details_ready = WEC.element_be_enabled((By.CSS_SELECTOR, '.details_interface'), base_element=catalogue_base_element)
        WebDriverWait(self.testcase.driver, 5).until(lambda driver: details_ready(driver) and self.catalogue.get_current_resource() == self.name)
        self.details = catalogue_base_element.find_element_by_css_selector('.details_interface')

        return self

    def __exit__(self, type, value, traceback):

        button = WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".wirecloud_header_nav .icon-caret-left"), parent=True))

        if self.catalogue.get_subview() == 'details':
            button.click()

        self.details = None

    def get_version_list(self):

        version_select = Select(self.details.find_element_by_css_selector('.versions select'))
        return [option.text for option in version_select.options]

    def switch_to(self, version):

        version_select = Select(self.details.find_element_by_css_selector('.versions select'))
        version_select.select_by_value(version)
        catalogue_base_element = self.catalogue.get_current_catalogue_base_element()
        WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_enabled((By.CSS_SELECTOR, '.details_interface'), base_element=catalogue_base_element))

    def switch_tab(self, tab_label):

        tabs = self.details.find_elements_by_css_selector('.se-notebook-tab')
        for tab in tabs:
            if tab.text == tab_label:
                tab.click()
                return tab

        return None

    def advanced_operation(self, action):

        for operation in self.details.find_elements_by_css_selector('.advanced_operations .se-btn'):
            if operation.text == action:
                operation.click()
                return

        raise NoSuchElementException


class MashupWalletResourceTester(object):

    def __init__(self, testcase, element, wallet):
        self.testcase = testcase
        self.element = element
        self.wallet = wallet

    def merge(self):
        workspace_name = self.testcase.get_current_workspace_name()
        self.testcase.scroll_and_click(self.element.find_element_by_css_selector('.mainbutton'))
        self.testcase.wait_wirecloud_ready()
        WebDriverWait(self.testcase.driver, 5).until(EC.staleness_of(self.wallet.element))
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

    def __enter__(self):

        self.testcase.wait_element_visible_by_css_selector('.wc-toolbar .icon-plus').click()
        self.element = self.testcase.driver.find_element_by_css_selector('#workspace .widget_wallet')
        return self

    def __exit__(self, type, value, traceback):

        try:
            WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".widget_wallet .icon-remove"), parent=True, base_element=self.element)).click()
        except StaleElementReferenceException:
            pass

        WebDriverWait(self.testcase.driver, 5).until(EC.staleness_of(self.element))
        self.element = None

    def switch_scope(self, scope):

        self.wait_ready()
        WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_still(self.element))

        for pill in self.element.find_elements_by_css_selector('.se-pills > .se-pill'):
            if pill.text == scope:
                pill.click()
                return

        raise Exception('Invalid scope')

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

    def search_in_results(self, widget_name):

        self.wait_ready()

        resources = self.element.find_elements_by_css_selector('.widget_wallet_list > .resource')
        for resource in resources:
            resource_name = resource.find_element_by_css_selector('.resource_name')
            if resource_name.text == widget_name:
                if self.element.find_element_by_css_selector('.se-pills > .se-pill.active').text == 'Widgets':
                    return WidgetWalletResourceTester(self.testcase, resource)
                else:
                    return MashupWalletResourceTester(self.testcase, resource, self)

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
            self.element.find_element_by_css_selector('.window_bottom .se-btn').click()
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


class ButtonTester(object):

    def __init__(self, testcase, element):
        self.testcase = testcase
        self.element = element

    @property
    def active(self):
        return "active" in self.class_list

    @property
    def class_list(self):
        return self.element.get_attribute('class').split()

    @property
    def disabled(self):
        return "disabled" in self.class_list

    @property
    def displayed(self):
        return self.element.is_displayed()

    @property
    def badge(self):
        return self.element.find_element_by_css_selector(".badge")

    def containsIcon(self, icon):
        return icon in self.element.find_element_by_css_selector(".se-icon").get_attribute('class').split()

    def click(self):
        self.element.click()

    def check_badge_text(self, badge_text):
        badge = self.badge
        self.testcase.assertTrue(badge.is_displayed())
        self.testcase.assertEqual(badge.text, badge_text)


class BaseModalTester(object):

    def __init__(self, testcase, element):
        self.testcase = testcase
        self.element = element

    @property
    def content(self):
        return self.element.find_element_by_css_selector(".window_content")

    @property
    def bottom(self):
        return self.element.find_element_by_css_selector(".window_bottom")

    @property
    def btn_accept(self):
        return ButtonTester(self.testcase, self.bottom.find_element_by_css_selector(".btn-accept"))

    def find_alerts(self):
        return self.content.find_elements_by_css_selector(".alert")

    def filter_alerts_by_type(self, alert_type):
        return self.content.find_elements_by_css_selector(".alert-%s" % alert_type)

    def accept(self):
        self.btn_accept.click()

        return self


class FormModalTester(BaseModalTester):

    def get_field(self, name, tagname='input'):
        return self.element.find_element_by_css_selector('%s[name="%s"]' % (tagname, name))

    def get_field_value(self, name, tagname='input'):
        return self.get_field(name, tagname).get_attribute('value')

    def set_field_value(self, name, value, tagname='input'):
        field = self.get_field(name, tagname)

        # We cannot use send_keys due to http://code.google.com/p/chromedriver/issues/detail?id=35
        self.testcase.driver.execute_script('arguments[0].value = arguments[1]', field, value)

        return self


class WiringComponentItemTester(object):

    def __init__(self, testcase, element):
        self.testcase = testcase
        self.element = element

    @property
    def btn_show_menu_prefs(self):
        return ButtonTester(self.testcase, self.element.find_element_by_css_selector(".btn-show-prefs"))

    @property
    def id(self):
        return int(self.element.get_attribute('data-id'))

    @property
    def in_use(self):
        return self.element.find_element_by_css_selector(".badge").text == "in use"

    @property
    def title(self):
        return self.element.find_element_by_css_selector('.panel-heading .panel-title').text

    @property
    def volatile(self):
        return self.element.find_element_by_css_selector(".badge").text == "volatile"

    def rename(self, title):
        modal = self.show_modal_rename()

        modal.set_field_value('title', title)
        modal.accept()

        WebDriverWait(self.testcase.driver, timeout=3).until(lambda driver: self.title == title)

        return self

    def show_menu_prefs(self):
        button = self.btn_show_menu_prefs
        button.click()

        return PopupMenuTester(self.testcase, self.testcase.wait_element_visible_by_css_selector(".se-popup-menu"), button)

    def show_modal_rename(self):
        menu = self.show_menu_prefs()
        menu.click_entry("Rename")

        return FormModalTester(self.testcase, self.testcase.wait_element_visible_by_css_selector(".wc-component-rename-dialog"))

class WiringComponentGroupTester(object):

    def __init__(self, testcase, element):
        self.testcase = testcase
        self.element = element

    @property
    def components(self):
        return [WiringComponentItemTester(self.testcase, e) for e in self.element.find_elements_by_css_selector(".component")]

    @property
    def title(self):
        return self.element.find_element_by_css_selector('.panel-heading .panel-title').text

    def createComponent(self):

        button = ButtonTester(self.testcase, self.element.find_element_by_css_selector(".component-version-list .btn-create"))
        button.click()

        return self


class WiringComponentTester(object):

    def __init__(self, testcase, element):
        self.testcase = testcase
        self.element = element

    @property
    def btn_show_menu_prefs(self):
        return ButtonTester(self.testcase, self.element.find_element_by_css_selector(".btn-show-prefs"))

    @property
    def id(self):
        return int(self.element.get_attribute('data-id'))

    @property
    def background(self):
        return "background" in self.class_list

    @property
    def btn_display_preferences(self):
        return ButtonTester(self.testcase, self.element.find_element_by_css_selector(".btn-show-prefs"))

    @property
    def btn_notify(self):
        return ButtonTester(self.testcase, self.element.find_element_by_css_selector(".component-notice .label"))

    @property
    def btn_remove(self):
        return ButtonTester(self.testcase, self.element.find_element_by_css_selector(".btn-remove"))

    @property
    def btn_add(self):
        return ButtonTester(self.testcase, self.element.find_element_by_css_selector(".icon-plus-sign"))

    @property
    def class_list(self):
        return self.element.get_attribute('class').split()

    @property
    def collapsed(self):
        return "collapsed" in self.class_list

    @property
    def missing(self):
        return "missing" in self.class_list

    @property
    def sort_endpoints(self):
        return WiringComponentEditableTester(self.testcase, self)

    @property
    def source_endpoints(self):
        return [WiringEndpointTester(self.testcase, e, self) for e in self.element.find_elements_by_css_selector(".source-endpoints .endpoint")]

    @property
    def target_endpoints(self):
        return [WiringEndpointTester(self.testcase, e, self) for e in self.element.find_elements_by_css_selector(".target-endpoints .endpoint")]

    @property
    def endpoints(self):
        return self.target_endpoints + self.source_endpoints

    @property
    def title(self):
        return self.element.find_element_by_css_selector('.panel-heading .panel-title').text

    def collapse_endpoints(self):
        self.testcase.assertFalse(self.collapsed)
        self.display_preferences().click_entry("Collapse")
        self.testcase.assertTrue(self.collapsed)

        return self

    def expand_endpoints(self):
        self.testcase.assertTrue(self.collapsed)
        self.display_preferences().click_entry("Expand")
        self.testcase.assertFalse(self.collapsed)

        return self

    def get_all_endpoints(self, endpoint_type):
        endpoints = self.element.find_elements_by_css_selector(".%s-endpoints .endpoint" % endpoint_type)

        return [WiringEndpointTester(self.testcase, element, self) for element in endpoints]

    def filter_endpoints_by_type(self, endpoint_type):
        return [WiringEndpointTester(self.testcase, e, self) for e in self.element.find_elements_by_css_selector(".%s-endpoints .endpoint" % endpoint_type)]

    def find_endpoint_by_title(self, endpoint_type, endpoint_title):
        for endpoint in self.filter_endpoints_by_type(endpoint_type):
            if endpoint.title == endpoint_title:
                return endpoint

        return None

    def display_preferences(self):
        button = self.btn_display_preferences
        button.click()

        return PopupMenuTester(self.testcase, self.testcase.wait_element_visible_by_css_selector('.se-popup-menu'), button)

    def show_logger_modal(self):
        self.btn_notify.click()

        return BaseModalTester(self.testcase, self.testcase.wait_element_visible_by_css_selector(".wc-component-logs-dialog"))

    def show_settings_modal(self):
        self.display_preferences().click_entry('Settings')

        return FormModalTester(self.testcase, self.testcase.wait_element_visible_by_css_selector(".wc-component-preferences-dialog"))

    def rename(self, title):
        modal = self.show_modal_rename()

        modal.set_field_value('title', title)
        modal.accept()

        WebDriverWait(self.testcase.driver, timeout=3).until(lambda driver: self.title == title)

        return self

    def show_menu_prefs(self):
        button = self.btn_show_menu_prefs
        button.click()

        return PopupMenuTester(self.testcase, self.testcase.wait_element_visible_by_css_selector(".se-popup-menu"), button)

    def show_modal_rename(self):
        menu = self.show_menu_prefs()
        menu.click_entry("Rename")

        return FormModalTester(self.testcase, self.testcase.wait_element_visible_by_css_selector(".wc-component-rename-dialog"))


class WiringComponentEditableTester(object):

    def __init__(self, testcase, component):
        self.testcase = testcase
        self.component = component

    def __enter__(self):
        self.component.display_preferences().click_entry("Order endpoints")
        WebDriverWait(self.testcase.driver, 2).until(lambda driver: len(driver.find_elements_by_css_selector('.endpoints.sortable')) > 0)

        return self

    def __exit__(self, type, value, traceback):
        self.component.display_preferences().click_entry("Stop ordering")
        self.testcase.assertEqual(len([e for e in self.component.endpoints if e.active]), 0)

    def move_endpoint(self, endpoint_type, endpoint_start_title, endpoint_end_title):
        endpoint_start = self.component.find_endpoint_by_title(endpoint_type, endpoint_start_title)
        endpoint_end = self.component.find_endpoint_by_title(endpoint_type, endpoint_end_title)

        endpoint_start.set_position(endpoint_end)

        return self


class WiringOperatorTester(WiringComponentTester):

    type = "operator"

    @property
    def error_count(self):
        return self.testcase.driver.execute_script('return Wirecloud.activeWorkspace.wiring.ioperators[%s].logManager.errorCount' % self.id)

    @property
    def log_entries(self):
        return self.testcase.driver.execute_script('''
            var ioperator = Wirecloud.activeWorkspace.wiring.ioperators[%s];
            return ioperator.logManager.entries.map(function (entry) { return {date: entry.date.getTime(), level: entry.level, msg: entry.msg}; });
        ''' % self.id)


class WiringWidgetTester(WiringComponentTester):

    type = "widget"

    @property
    def error_count(self):
        return self.testcase.driver.execute_script('return Wirecloud.activeWorkspace.getIWidget(%s).logManager.errorCount' % self.id)

    @property
    def log_entries(self):
        return self.testcase.driver.execute_script('''
            var ioperator = Wirecloud.activeWorkspace.getIWidget(%s);
            return ioperator.logManager.entries.map(function (entry) { return {date: entry.date.getTime(), level: entry.level, msg: entry.msg}; });
        ''' % self.id)


class WiringConnectionTester(object):

    def __init__(self, testcase, element):
        self.testcase = testcase
        self.element = element

    @property
    def background(self):
        return "background" in self.class_list

    @property
    def btn_remove(self):
        return self._get_btn_by_class("btn-remove")

    @property
    def btn_add(self):
        return self._get_btn_by_class("btn-share")

    @property
    def btn_prefs(self):
        return self._get_btn_by_class("btn-show-prefs")

    @property
    def class_list(self):
        return self.element.get_attribute('class').split()

    @property
    def missing(self):
        return "missing" in self.class_list

    @property
    def readonly(self):
        return "readonly" in self.class_list

    @property
    def selected(self):
        return "selected" in self.class_list

    def _get_btn_by_class(self, class_name):
        return ButtonTester(self.testcase, self.element.find_element_by_css_selector(".connection-options .{}".format(class_name)))

    def display_preferences(self):
        button = self.btn_prefs
        button.click()
        return PopupMenuTester(self.testcase, self.testcase.wait_element_visible_by_css_selector('.se-popup-menu'), button)

    def click(self):
        if self.element.is_displayed():
            self.element.find_element_by_css_selector(".connection-border").click()
        else:
            ActionChains(self.testcase.driver).click(self.element).perform()

        if self.readonly:
            self.testcase.assertTrue(self.btn_remove.disabled)

        return self

    def remove(self):
        self.btn_remove.click()

        return self

    @property
    def sourceid(self):
        return self.element.get_attribute("data-sourceid")

    @property
    def targetid(self):
        return self.element.get_attribute("data-targetid")


class WiringEndpointTester(object):

    def __init__(self, testcase, element, component):
        self.testcase = testcase
        self.element = element
        self.component = component

    @property
    def _title(self):
        return self.element.find_element_by_css_selector(".endpoint-title")

    @property
    def name(self):
        return self.element.get_attribute("data-name")

    @property
    def id(self):
        return "{}/{}/{}".format(self.component.type, self.component.id, self.name)

    @property
    def anchor(self):
        return self.element.find_element_by_css_selector('.endpoint-anchor')

    @property
    def active(self):
        return 'active' in self.element.get_attribute('class').split()

    @property
    def position(self):
        return int(self.element.get_attribute('data-index'))

    @property
    def title(self):
        return self._title.text

    def connect(self, endpoint, sticky_effect=False):
        ActionChains(self.testcase.driver).drag_and_drop(self.anchor, endpoint._title if sticky_effect else endpoint.anchor).perform()

    def drag_connection(self, x, y):
        ActionChains(self.testcase.driver).click_and_hold(self.anchor).move_by_offset(x, y).perform()

    def drop_connection(self):
        ActionChains(self.testcase.driver).release().perform()

    def set_position(self, endpoint):
        new_position = endpoint.position

        actions = ActionChains(self.testcase.driver).click_and_hold(self._title)

        for i in range(abs(new_position - self.position)):
            actions.move_to_element(endpoint._title)

        actions.release().perform()
        self.testcase.assertEqual(self.position, new_position)

    def mouse_over(self):
        ActionChains(self.testcase.driver).move_to_element(self.element).perform()


class WiringBehaviourTester(object):

    def __init__(self, testcase, element):
        self.testcase = testcase
        self.element = element

    @property
    def active(self):
        return 'active' in self.element.get_attribute('class').split()

    @property
    def btn_activate(self):
        return self.element.find_element_by_css_selector(".btn-activate")

    @property
    def btn_show_preferences(self):
        return ButtonTester(self.testcase, self.element.find_element_by_css_selector(".btn-show-prefs"))

    @property
    def btn_remove(self):
        return ButtonTester(self.testcase, self.element.find_element_by_css_selector(".btn-remove"))

    @property
    def heading(self):
        return self.title_element

    @property
    def title(self):
        return self.title_element.text

    @property
    def title_element(self):
        return self.element.find_element_by_css_selector(".behaviour-title")

    @property
    def description(self):
        return self.element.find_element_by_css_selector(".behaviour-description").text

    def activate(self):
        self.title_element.click()

    def display_preferences(self):
        button = self.btn_show_preferences
        button.click()

        return PopupMenuTester(self.testcase, self.testcase.wait_element_visible_by_css_selector('.se-popup-menu'), button)

    def show_settings_modal(self):
        self.display_preferences().click_entry('Settings')

        return FormModalTester(self.testcase, self.testcase.wait_element_visible_by_css_selector(".behaviour-update-form"))

    def check_basic_info(self, title=None, description=None):
        if title is not None:
            self.testcase.assertEqual(self.title, self.title if not title else title)

        if description is not None:
            self.testcase.assertEqual(self.description, self.description if not description else description)

        return self


class WorkspaceTabTester(object):

    def __init__(self, testcase, element):

        self.testcase = testcase
        self.element = element

    @property
    def name(self):
        span = self.element.find_element_by_css_selector('span')
        return span.text

    def open_menu(self):

        tab_menu_button = self.testcase.wait_element_visible_by_css_selector('.icon-tab-menu', element=self.element)
        tab_menu_button.click()
        popup_menu_element = self.testcase.wait_element_visible_by_css_selector('.se-popup-menu')

        return PopupMenuTester(self.testcase, popup_menu_element, tab_menu_button)

    def rename(self, name):

        self.open_menu().click_entry('Rename')
        tab_name_input = self.testcase.driver.find_element_by_css_selector('.window_menu .styled_form input')
        self.testcase.fill_form_input(tab_name_input, name)
        self.testcase.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()
        self.testcase.wait_wirecloud_ready()


class RemoteTestCase(object):

    def fill_form_input(self, form_input, value):
        # We cannot use send_keys due to http://code.google.com/p/chromedriver/issues/detail?id=35
        self.driver.execute_script('arguments[0].value = arguments[1]', form_input, value)

    def wait_element_visible_by_css_selector(self, selector, timeout=10, element=None):
        condition = WEC.visibility_of_element_located((By.CSS_SELECTOR, selector), base_element=element)
        return WebDriverWait(self.driver, timeout).until(condition)

    def wait_element_visible_by_id(self, selector, timeout=10, element=None):
        condition = WEC.visibility_of_element_located((By.ID, selector), base_element=element)
        return WebDriverWait(self.driver, timeout).until(condition)

    def wait_element_visible_by_xpath(self, selector, timeout=10, element=None):
        condition = WEC.visibility_of_element_located((By.XPATH, selector), base_element=element)
        return WebDriverWait(self.driver, timeout).until(condition)

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

    def find_widget_by_id(self, widget_id):

        for widget in self.get_current_iwidgets():
            if widget.id == widget_id:
                return widget

        return None

    def send_basic_event(self, widget, event='hello world!!'):
        with widget:
            text_input = self.driver.find_element_by_tag_name('input')
            self.fill_form_input(text_input, event)
            # Work around hang when using Firefox Driver
            self.driver.execute_script('sendEvent();')
            #self.driver.find_element_by_id('b1').click()


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
        cls.driver.set_window_size(1024, 800)

    @classmethod
    def tearDownClass(cls):

        # Remove chrome/chromium temporal directories
        if 'chrome' in cls.driver.capabilities:
            shutil.rmtree(cls.driver.capabilities['chrome']['userDataDir'], ignore_errors=True)

        cls.driver.quit()

    def setUp(self):

        self.wallet = WalletTester(self)
        self.marketplace_view = MarketplaceViewTester(self)
        self.myresources_view = MyResourcesViewTester(self)
        self.wiring_view = WiringViewTester(self)

    def tearDown(self):

        self.driver.delete_all_cookies()

    def find_navbar_button(self, classname):
        return ButtonTester(self, self.driver.find_element_by_css_selector(".wc-toolbar .btn-%s" % classname))

    def scroll_and_click(self, element):

        # Work around chrome and firefox driver bugs
        try:
            self.driver.execute_script("arguments[0].scrollIntoView(false);", element)
        except:
            pass
        ActionChains(self.driver).click(element).perform()

    def wait_wirecloud_ready(self, start_timeout=10, timeout=10):

        loading_window = self.wait_element_visible_by_css_selector('#loading-window', timeout=2)

        def wait_loading_window(driver):
            return loading_window.get_attribute('class').strip() in ('', 'fadding')

        def wait_loading_window_hidden(driver):
            return loading_window.get_attribute('class').strip() in ('fadding', 'disabled')

        WebDriverWait(self.driver, start_timeout).until(wait_loading_window)
        WebDriverWait(self.driver, timeout).until(wait_loading_window_hidden)

        loading_message = loading_window.find_element_by_id('loading-message')
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

        # TODO
        self.driver.add_cookie({'name': 'policy_cookie', 'value': 'on', 'path': '/'})

        username_input = self.wait_element_visible_by_css_selector('#id_username')
        self.fill_form_input(username_input, username)
        password_input = self.driver.find_element_by_id('id_password')
        self.fill_form_input(password_input, password)
        password_input.submit()

        self.wait_wirecloud_ready()

    def get_current_view(self):

        try:
            return self.driver.execute_script("return LayoutManagerFactory.getInstance().header.currentView.view_name;")
        except:
            return ""

    def open_menu(self):
        button = self.wait_element_visible_by_css_selector('.wirecloud_header_nav .icon-reorder')
        button.click()
        popup_menu_element = self.wait_element_visible_by_css_selector('.se-popup-menu')

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
            with MACFieldTester(self, form.find_element_by_css_selector('.se-mac-field')) as select_dialog:
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

            # TODO Currently browsers only use the ETag/If-None-Match headers when using https
            # Last-Modified/If-Modified-Since headers have a resolution of 1 second
            time.sleep(1)
            # END TODO

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

        tabs = self.driver.find_elements_by_css_selector('.se-notebook.workspace > .se-notebook-tabs-wrapper .se-notebook-tab')
        for tab in tabs:
            span = tab.find_element_by_css_selector('span')
            if span.text == tab_name:
                return WorkspaceTabTester(self, tab)

        return None

    def get_current_workspace_tab(self):

        tab = self.driver.find_element_by_css_selector('.se-notebook.workspace > .se-notebook-tabs-wrapper .se-notebook-tab.selected')
        return WorkspaceTabTester(self, tab)

    def add_widget_to_mashup(self, widget_name, new_name=None):

        with self.wallet as wallet:
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

        self.open_menu().click_entry('Upload to my resources')

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
            tabs = self.driver.find_elements_by_css_selector('.styled_form .se-notebook-tab')
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
        return len(self.driver.find_elements_by_css_selector('#workspace > .se-notebook > .se-notebook-tabs-wrapper .se-notebook-tab'))

    def add_tab(self):

        old_tab_count = self.count_workspace_tabs()

        self.driver.find_element_by_css_selector('#workspace > .se-notebook > .se-notebook-tabs-wrapper .se-notebook-new-tab:not(.disabled)').click()
        self.wait_wirecloud_ready()

        new_tab_count = self.count_workspace_tabs()
        self.assertEqual(new_tab_count, old_tab_count + 1)

        element = self.driver.find_elements_by_css_selector('#workspace > .se-notebook > .se-notebook-tabs-wrapper .se-notebook-tab')[-1]
        return WorkspaceTabTester(self, element)


class MarketplaceViewTester(object):

    def __init__(self, testcase):

        self.testcase = testcase
        self.myresources = MyResourcesViewTester(testcase, self)

    def __enter__(self):
        self.testcase.wait_element_visible_by_css_selector(".wc-toolbar .icon-shopping-cart").click()
        WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'marketplace')
        WebDriverWait(self.testcase.driver, 10).until(marketplace_loaded)
        return self

    def __exit__(self, type, value, traceback):
        WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".wirecloud_header_nav .icon-caret-left"), parent=True)).click()
        WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'workspace')

    def get_current_catalogue_base_element(self):

        catalogues = self.testcase.driver.find_elements_by_css_selector('#marketplace > .alternatives > .wrapper > .catalogue')
        for catalogue_element in catalogues:
            if 'hidden' not in catalogue_element.get_attribute('class'):
                return catalogue_element

        return None

    def wait_catalogue_ready(self, timeout=10):
        time.sleep(0.1)
        catalogue_element = self.get_current_catalogue_base_element()
        search_view = catalogue_element.find_element_by_class_name('search_interface')
        WebDriverWait(self.testcase.driver, timeout).until(lambda driver: 'disabled' not in search_view.get_attribute('class'))

        return catalogue_element

    def open_menu(self):
        button = WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".wirecloud_header_nav .icon-reorder"), parent=True))
        button.click()
        popup_menu_element = self.testcase.wait_element_visible_by_css_selector('.se-popup-menu')

        return PopupMenuTester(self.testcase, popup_menu_element, button)

    def get_current_marketplace_name(self):
        breadcrum = self.testcase.driver.find_element_by_id('wirecloud_breadcrum').text
        if breadcrum.startswith('marketplace/'):
            return breadcrum.split('/')[-1]
        else:
            return None

    def get_subview(self):

        return self.testcase.driver.execute_script('return LayoutManagerFactory.getInstance().viewsByName.marketplace.alternatives.getCurrentAlternative().alternatives.getCurrentAlternative().view_name;')

    def get_current_resource(self):

        if self.get_subview() == 'details':
            return self.testcase.driver.find_element_by_css_selector('#wirecloud_breadcrum .resource_title').text

    def switch_to(self, market, timeout=5):

        if self.get_current_marketplace_name() == market:
            return

        self.open_menu().click_entry(market)
        WebDriverWait(self.testcase.driver, timeout).until(WEC.marketplace_name(self, market))
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
                return CatalogueEntryTester(self.testcase, resource, self, resource_name)

        return None


class MyResourcesViewTester(MarketplaceViewTester):

    def __init__(self, testcase, marketplace_view=None):

        self.testcase = testcase
        self.marketplace_view = marketplace_view

    def __enter__(self):
        self.testcase.wait_element_visible_by_css_selector(".wc-toolbar .icon-archive").click()
        WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'myresources')
        return self

    def __exit__(self, type, value, traceback):
        if value is not None:
            return False

        if self.marketplace_view is None:
            WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".wirecloud_header_nav .icon-caret-left"), parent=True)).click()

            WebDriverWait(self.testcase.driver, 5).until(lambda driver: self.testcase.get_current_view() == 'workspace')
        else:
            self.testcase.wait_element_visible_by_css_selector(".wc-toolbar .icon-shopping-cart").click()

            WebDriverWait(self.testcase.driver, 5).until(lambda driver: self.testcase.get_current_view() == 'marketplace')

    def get_current_catalogue_base_element(self):
        return self.testcase.driver.find_element_by_css_selector('.catalogue.myresources')

    def get_subview(self):

        return self.testcase.driver.execute_script('return LayoutManagerFactory.getInstance().viewsByName.myresources.alternatives.getCurrentAlternative().view_name;')

    def get_current_resource(self):

        if self.get_subview() == 'details':
            return self.testcase.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').text

    def upload_resource(self, wgt_file, resource_name, shared=False, expect_error=False):

        if shared:
            wgt_path = os.path.join(self.testcase.shared_test_data_dir, wgt_file)
        else:
            wgt_path = os.path.join(self.testcase.test_data_dir, wgt_file)
        wgt_path = os.path.abspath(wgt_path)

        self.wait_catalogue_ready()

        WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".wc-toolbar .icon-cloud-upload"), parent=True)).click()

        dialog = WebDriverWait(self.testcase.driver, 5).until(EC.visibility_of_element_located((By.CSS_SELECTOR, '.wc-upload-mac-dialog')))
        dialog.find_element_by_css_selector('input[type="file"]').send_keys(wgt_path)
        WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, '.btn-primary'), base_element=dialog)).click()
        self.testcase.wait_wirecloud_ready()

        window_menus = len(self.testcase.driver.find_elements_by_css_selector('.window_menu'))
        if expect_error:
            if window_menus == 1:
                self.testcase.fail('Error: resource shouldn\'t be added')

            dialog = WebDriverWait(self.testcase.driver, 5).until(EC.visibility_of_element_located((By.CSS_SELECTOR, '.window_menu.message')))
            error_msg = dialog.find_element_by_css_selector('.window_content li').text
            self.testcase.assertEqual(error_msg, os.path.basename(wgt_file) + ": " + expect_error)
            dialog.find_element_by_css_selector(".btn-primary").click()

            return None
        else:
            if window_menus != 1:
                self.testcase.fail('Error: resource was not added')

            self.search(resource_name)
            resource = self.search_in_results(resource_name)
            self.testcase.assertIsNotNone(resource)
            return resource

    def delete_resource(self, resource_name, version=None):

        self.search(resource_name)
        with self.search_in_results(resource_name) as resource:

            version_list = resource.get_version_list()
            should_disappear_from_listings = version is None or len(version_list) == 1

            action = 'Delete'
            if version is not None:
                resource.switch_to(version)
            elif len(version_list) > 1:
                action = 'Delete all versions'

            resource.advanced_operation(action)

            WebDriverWait(self.testcase.driver, 10).until(lambda driver: driver.find_element_by_xpath("//*[contains(@class,'window_menu')]//*[text()='Yes']").is_displayed())
            self.testcase.driver.find_element_by_xpath("//*[contains(@class,'window_menu')]//*[text()='Yes']").click()
            self.testcase.wait_wirecloud_ready()

        resource = self.search_in_results(resource_name)
        if should_disappear_from_listings:
            self.testcase.assertIsNone(resource)
        else:
            self.testcase.assertIsNotNone(resource)

    def uninstall_resource(self, resource_name, version=None, expect_error=False):

        should_disappear_from_listings = False

        self.search(resource_name)
        with self.search_in_results(resource_name) as resource:

            version_list = resource.get_version_list()
            should_disappear_from_listings = version is None or len(version_list) == 1

            action = 'Uninstall'
            if version is not None:
                resource.switch_to(version)
            elif len(version_list) > 1:
                action = 'Uninstall all versions'

            if expect_error:
                self.testcase.assertRaises(NoSuchElementException, resource.advanced_operation, action)
                return
            else:
                resource.advanced_operation(action)
                self.testcase.wait_wirecloud_ready()

        resource = self.search_in_results(resource_name)
        if should_disappear_from_listings:
            self.testcase.assertIsNone(resource)
        else:
            self.testcase.assertIsNotNone(resource)


class BaseWiringViewTester(object):

    def __init__(self, testcase):
        self.expect_error = False
        self.testcase = testcase

    @property
    def btn_back(self):
        return ButtonTester(self.testcase, self.testcase.driver.find_element_by_css_selector(".wirecloud_header_nav .btn-back"))

    @property
    def btn_list_behaviours(self):
        return ButtonTester(self.testcase, self.testcase.driver.find_element_by_css_selector(".wc-toolbar .btn-list-behaviours"))

    @property
    def btn_list_components(self):
        return ButtonTester(self.testcase, self.testcase.driver.find_element_by_css_selector(".wc-toolbar .btn-find-components"))

    @property
    def layout(self):
        return self.testcase.driver.find_element_by_css_selector(".wiring-view")

    @property
    def section_diagram(self):
        return self.testcase.driver.find_element_by_css_selector(".wiring-view .wiring-diagram")

    @property
    def section_sidebar(self):
        return self.testcase.driver.find_element_by_css_selector(".wiring-view .wiring-sidebar")

    def _build_component(self, component_type, element):
        if component_type is None:
            component_type = "widget" if ".component-widget" in element.get_attribute().split() else "operator"

        return WiringWidgetTester(self.testcase, element) if component_type == 'widget' else WiringOperatorTester(self.testcase, element)


class WiringBehaviourSidebarTester(BaseWiringViewTester):

    def __enter__(self):
        button = self.btn_list_behaviours

        if not button.active:
            button.click()
            WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_still(self.panel))

        return self

    def __exit__(self, type, value, traceback):
        button = self.btn_list_behaviours
        button.click()
        WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_still(self.panel))

    @property
    def active_behaviour(self):
        for behaviour in self.behaviour_list:
            if behaviour.active:
                return behaviour

        return None

    @property
    def behaviour_list(self):
        return [WiringBehaviourTester(self.testcase, e) for e in self.panel.find_elements_by_css_selector(".behaviour")]

    @property
    def btn_create_behaviour(self):
        return ButtonTester(self.testcase, self.panel.find_element_by_css_selector(".btn-create"))

    @property
    def btn_enable_behaviour_engine(self):
        return ButtonTester(self.testcase, self.panel.find_element_by_css_selector(".btn-enable"))

    @property
    def disabled(self):
        return self.btn_enable_behaviour_engine.containsIcon("icon-lock")

    @property
    def panel(self):
        return self.section_sidebar.find_element_by_css_selector(".panel-behaviours")

    def create_behaviour(self, title=None, description=None):
        old_behaviour_list_length = len(self.behaviour_list)

        self.btn_create_behaviour.click()
        form = FormModalTester(self.testcase, self.testcase.driver.find_element_by_css_selector(".behaviour-create-form"))

        if title is not None:
            form.set_field_value('title', title)
            self.testcase.assertEqual(form.get_field_value('title'), title)

        if description is not None:
            form.set_field_value('description', description, 'textarea')
            self.testcase.assertEqual(form.get_field_value('description', 'textarea'), description)

        form.accept()

        new_behaviour_list = self.behaviour_list
        self.testcase.assertEqual(len(new_behaviour_list), old_behaviour_list_length + 1)

        last_behaviour = new_behaviour_list[-1]

        self.testcase.assertEqual(last_behaviour.title, title if title is not None and title else "New behaviour")
        self.testcase.assertEqual(last_behaviour.description, description if description is not None and description else "No description provided.")

        return self

    def enable(self):
        if self.disabled:
            self.btn_enable_behaviour_engine.click()

        return self

    def has_behaviours(self):
        behaviours = self.behaviour_list

        if len(behaviours) == 0:
            self.testcase.assertTrue(self.disabled)
            self.testcase.assertTrue(self.panel.find_element_by_css_selector(".alert").is_displayed())
        else:
            self.testcase.assertFalse(self.disabled)
            self.testcase.assertTrue(self.btn_create_behaviour.displayed)

        return len(behaviours) > 0

    def update_behaviour(self, behaviour, title=None, description=None):
        form = behaviour.show_settings_modal()

        if title is not None:
            form.set_field_value('title', title)
            self.testcase.assertEqual(form.get_field_value('title'), title)

        if description is not None:
            form.set_field_value('description', description, 'textarea')
            self.testcase.assertEqual(form.get_field_value('description', 'textarea'), description)

        form.accept()
        behaviour.check_basic_info(title=title, description=description)

        return self


class WiringComponentSidebarTester(BaseWiringViewTester):

    def __enter__(self):
        button = self.btn_list_components

        if not button.active:
            button.click()
            WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_still(self.panel))

        return self

    def __exit__(self, type, value, traceback):
        button = self.btn_list_components
        button.click()
        WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_still(self.panel))

    @property
    def btn_show_operator_group(self):
        return ButtonTester(self.testcase, self.section_sidebar.find_element_by_css_selector(".btn-list-operator-group"))

    @property
    def btn_show_widget_group(self):
        return ButtonTester(self.testcase, self.section_sidebar.find_element_by_css_selector(".btn-list-widget-group"))

    @property
    def section_operator_group(self):
        return self.section_sidebar.find_element_by_css_selector(".section.operator-group")

    @property
    def section_widget_group(self):
        return self.section_sidebar.find_element_by_css_selector(".section.widget-group")

    @property
    def panel(self):
        return self.section_sidebar.find_element_by_css_selector(".panel-components")

    def _filter_components_by_type(self, component_type):
        return [self._build_component(component_type, e) for e in self.section_diagram.find_elements_by_css_selector(".component-%s[data-id]" % component_type)]

    def _find_component_by_title(self, component_type, component_title):

        for component in self._filter_components_by_type(component_type):
            if component.title == component_title:
                return component

        return None

    def add_component(self, component_type, component_title, x=0, y=0):

        component = self.find_component_by_title(component_type, component_title)
        self.testcase.assertIsNotNone(component)

        # Drag and drop the component
        x, y = (x + 50, y + 30,)
        old_components = len(self.section_diagram.find_elements_by_css_selector(".component-%s[data-id]" % component_type))
        ActionChains(self.testcase.driver).click_and_hold(component.element).perform()
        WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_still(self.section_diagram))
        ActionChains(self.testcase.driver).move_to_element_with_offset(self.section_diagram, x, y).release().perform()

        # Wait until the component is added to the diagram
        WebDriverWait(self.testcase.driver, 5).until(lambda driver: old_components + 1 == len(self.section_diagram.find_elements_by_css_selector(".component-%s[data-id]" % component_type)))
        new_component = self._find_component_by_title(component_type, component_title)

        return new_component

    def create_operator(self, group_title):

        group = self.find_component_group_by_title('operator', group_title)
        group.createComponent()

        return self

    def display_component_group(self, component_type):
        button = getattr(self, "btn_show_%s_group" % component_type)

        if not button.active:
            WebDriverWait(self.testcase.driver, 5).until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".wiring-sidebar .panel-components .btn-list-%s-group" % component_type)))
            button.click()

            section = getattr(self, "section_%s_group" % component_type)
            self.testcase.assertTrue(section.is_displayed())
            self.testcase.assertFalse("hidden" in section.get_attribute('class').split())

        return self

    def filter_components_by_type(self, component_type):
        self.display_component_group(component_type)

        return [WiringComponentItemTester(self.testcase, e) for e in self.panel.find_elements_by_css_selector(".component-%s" % component_type)]

    def find_component_by_title(self, component_type, component_title):
        self.display_component_group(component_type)

        for component in self.filter_components_by_type(component_type):
            if component.title == component_title:
                return component

        return None

    def filter_component_groups_by_type(self, component_type):
        self.display_component_group(component_type)
        section = getattr(self, "section_%s_group" % component_type)

        return [WiringComponentGroupTester(self.testcase, e) for e in section.find_elements_by_css_selector(".component-group")]

    def find_component_group_by_title(self, component_type, group_title):
        self.display_component_group(component_type)

        for group in self.filter_component_groups_by_type(component_type):
            if group.title == group_title:
                return group

        return None

    def find_operator_group_by_title(self, group_title):
        return self.find_component_group_by_title("operator", group_title)

    def get_components_of(self, component_type, group_title):
        self.display_component_group(component_type)

        for group in self.filter_component_groups_by_type(component_type):
            if group.title == group_title:
                return group.components

        return []

    def has_components(self, component_type):
        components = self.filter_components_by_type(component_type)

        return len(components) > 0

    def find_component_by_id(self, component_type, component_id):

        for component in self.find_components_by_type(component_type):
            if component.id == component_id:
                return component

        return None

    def find_components_by_type(self, component_type):
        self.show_components_of(component_type)

        return [WiringComponentItemTester(self.testcase, e) for e in self.panel.find_elements_by_css_selector(".component-%s" % component_type)]

    def show_components_of(self, component_type):
        button = getattr(self, "btn_show_%s_group" % component_type)

        if not button.active:
            WebDriverWait(self.testcase.driver, 5).until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".panel-components .btn-list-%s-group" % component_type)))
            button.click()

        return self


class WiringViewTester(BaseWiringViewTester):

    def __enter__(self):
        self.testcase.wait_element_visible_by_css_selector(".wc-toolbar .btn-display-wiring-view").click()

        if self.expect_error is False:
            WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'wiring' and not self.disabled)

        return self

    def __exit__(self, type, value, traceback):
        if self.expect_error is False or self.testcase.get_current_view() == 'wiring':
            self.btn_back.click()
            WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'workspace')

        self.expect_error = False

    @property
    def behaviour_sidebar(self):
        return WiringBehaviourSidebarTester(self.testcase)

    @property
    def component_sidebar(self):
        return WiringComponentSidebarTester(self.testcase)

    @property
    def disabled(self):
        return "disabled" in self.layout.get_attribute('class').split()

    @property
    def is_empty(self):
        components = self.find_components()
        connections = self.find_connections()

        if len(components) == 0 and len(connections) == 0:
            self.testcase.assertTrue(self.section_diagram.find_element_by_css_selector(".alert").is_displayed())

        return len(components) == 0 and len(connections) == 0

    def filter_components_by_type(self, component_type):
        return [self._build_component(component_type, e) for e in self.section_diagram.find_elements_by_css_selector(".component-%s[data-id]" % component_type)]

    def filter_connections_by_properties(self, *args):
        return [c for c in self.find_connections() for p in args if hasattr(c, p) and getattr(c, p)]

    def find_components(self):
        return [self._build_component(None, e) for e in self.section_diagram.find_elements_by_css_selector(".component")]

    def find_component_by_title(self, component_type, component_title):

        for component in self.filter_components_by_type(component_type):
            if component.title == component_title:
                return component

        return None

    def find_connections(self):
        return [WiringConnectionTester(self.testcase, e) for e in self.section_diagram.find_elements_by_css_selector(".connection")]

    def find_component_by_id(self, component_type, component_id):

        for component in self.find_components_by_type(component_type):
            if component.id == component_id:
                return component

        return None

    def find_components_by_type(self, component_type):
        return [self._build_component(component_type, e) for e in self.section_diagram.find_elements_by_css_selector(".component-%s[data-id]" % component_type)]


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
