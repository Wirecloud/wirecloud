# -*- coding: utf-8 -*-

# Copyright (c) 2008-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

from importlib import import_module
import os
import shutil
import sys
import time

from selenium.common.exceptions import NoSuchElementException, StaleElementReferenceException, TimeoutException
from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

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
            span = item.find_element_by_css_selector('.se-popup-menu-item-title')
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

        if self.catalogue.get_subview() == 'details':
            WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".wirecloud_header_nav .wc-back-button")))
            WebDriverWait(self.testcase.driver, 5).until(lambda driver: self.catalogue.get_subview() == 'search')

        self.details = None

    @property
    def version_select(self):
        return Select(self.details.find_element_by_css_selector('.versions select'))

    def get_version_list(self):

        return [option.text for option in self.version_select.options]

    def switch_to(self, version):

        self.version_select.select_by_value(version)
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


class SelectableMACTester(object):

    def __init__(self, testcase, element):
        self.testcase = testcase
        self.element = element

    def select(self):
        self.testcase.scroll_and_click(self.element.find_element_by_css_selector('.mainbutton'))
        WebDriverWait(self.testcase.driver, 10).until(EC.invisibility_of_element_located((By.CSS_SELECTOR, '.window_menu.mac_selection_dialog')))


class MACFieldTester(object):

    def __init__(self, testcase, field_element):

        self.testcase = testcase
        self.element = None
        self.field_element = field_element

    def __enter__(self):
        WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".fa-search"), parent=True, base_element=self.field_element))
        self.element = self.testcase.wait_element_visible('.window_menu.mac_selection_dialog')
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

    def wait_ready(self, timeout=10):

        WebDriverWait(self.testcase.driver, timeout).until(lambda driver: 'in' in self.element.get_attribute('class'))

        list_element = self.element.find_element_by_css_selector('.wc-macsearch-list')
        WebDriverWait(self.testcase.driver, timeout).until(lambda driver: 'disabled' not in list_element.get_attribute('class'))
        time.sleep(0.1)

    def search(self, keywords):

        search_input = FieldTester(self.testcase, self.element.find_element_by_css_selector('.se-text-field'))
        search_input.set_value(keywords)
        search_input.enter()

        return self

    def search_in_results(self, widget_name):

        self.wait_ready()

        resources = self.element.find_elements_by_css_selector('.wc-macsearch-list > .resource')
        for resource in resources:
            resource_name = resource.find_element_by_css_selector('.resource_name')
            if resource_name.text == widget_name:
                return SelectableMACTester(self.testcase, resource)

        return None


class WebElementTester(object):

    def __init__(self, testcase, element):
        self.testcase = testcase
        self.element = element

    def scroll(self):
        self.testcase.driver.execute_script("return arguments[0].scrollIntoView(false);", self.element)
        return self

    @property
    def class_list(self):
        return self.get_attribute('class').split()

    @property
    def is_disabled(self):
        return self.has_class('disabled')

    @property
    def is_displayed(self):
        return self.element.is_displayed()

    def click(self):
        WebDriverWait(self.testcase.driver, timeout=5).until(WEC.element_be_clickable(self.element))
        return self

    def find_element(self, css_selector):
        try:
            return self.element.find_element_by_css_selector(css_selector)
        except NoSuchElementException:
            return None

    def find_elements(self, css_selector):
        try:
            elements = self.element.find_elements_by_css_selector(css_selector)
        except:
            return []

        return elements

    def get_attribute(self, name):
        return self.element.get_attribute(name)

    def has_class(self, extra_class):
        return extra_class in self.class_list


class ButtonTester(WebElementTester):

    @property
    def badge(self):
        return self.find_element(".badge")

    @property
    def icon(self):
        return self.find_element(".se-icon")

    @property
    def is_active(self):
        return self.has_class('active')

    def has_badge(self, text):
        return self.badge is not None and self.badge.text == text

    def has_icon(self, extra_class):
        return extra_class in self.icon.get_attribute('class').split()


class FieldTester(WebElementTester):

    @property
    def is_disabled(self):
        return self.get_attribute('disabled').strip().lower() == "true"

    @property
    def is_selected(self):
        return self.element.is_selected()

    @property
    def value(self):
        return self.get_attribute('value')

    def set_value(self, value):
        # We cannot send_keys due to 'http://code.google.com/p/chromedriver/issues/detail?id=35'
        self.testcase.driver.execute_script('''
            arguments[0].value = arguments[1]
        ''', self.element, value)
        return self

    def submit(self):
        self.element.submit()
        return self

    def enter(self):
        self.testcase.driver.execute_script('''
            arguments[0].dispatchEvent(new KeyboardEvent("keydown", {
                altKey: false,
                ctrlKey: false,
                key: "Enter",
                keyCode: 13,
                metaKey: false,
                shiftKey: false
            }));
        ''', self.element)


class ChoiceFieldTester(WebElementTester):

    @property
    def options(self):
        return Select(self.element).options

    @property
    def value(self):
        return self.get_attribute('value')

    def set_value(self, value):
        Select(self.element).select_by_value(value)
        return self


class ModalTester(WebElementTester):

    @property
    def body(self):
        return self.find_element(".window_content")

    @property
    def btn_accept(self):
        return ButtonTester(self.testcase, self.find_element(".window_bottom .btn-accept"))

    @property
    def btn_cancel(self):
        return ButtonTester(self.testcase, self.find_element(".window_bottom .btn-cancel"))

    def accept(self):
        self.btn_accept.click()
        return self

    def cancel(self):
        self.btn_cancel.click()
        return self

    def find_button(self, title):
        for e in self.find_elements(".window_bottom .se-btn"):
            if e.text == title:
                return ButtonTester(self.testcase, e)
        return None

    def wait_close(self, timeout=3):
        WebDriverWait(self.testcase.driver, timeout=timeout).until(EC.staleness_of(self.element))
        time.sleep(0.1)
        return self


class AlertTester(WebElementTester):

    @property
    def title(self):
        return self.find_element(".wc-log-title").text


class AlertModalTester(ModalTester):

    @property
    def count(self):
        return len(self.find_alerts())

    def find_alerts(self, title=None, state=None):
        css_selector = ".alert" if state is None else ".alert.alert-%s" % (state,)
        elements = [AlertTester(self.testcase, e) for e in self.body.find_elements_by_css_selector(css_selector)]
        return elements if title is None else [e for e in elements if e.title == title]


class FormTester(WebElementTester):

    @property
    def submit_button(self):
        return ButtonTester(self.testcase, self.find_element("input[type='submit']"))

    def get_field(self, name):
        field = self.find_element("[name='%s']" % (name,))
        if field.tag_name == 'select':
            return ChoiceFieldTester(self.testcase, field)
        return FieldTester(self.testcase, field)

    def submit(self):
        self.submit_button.click()


class FormModalTester(ModalTester):

    @property
    def error_message(self):
        return self.find_element("div.alert-error")

    def get_field(self, name):
        field = self.body.find_element_by_css_selector("[name='%s']" % (name,))
        if field.tag_name == 'select':
            return ChoiceFieldTester(self.testcase, field)
        return FieldTester(self.testcase, field)

    def wait_error(self, timeout=3):
        WebDriverWait(self.testcase.driver, timeout).until(lambda driver: self.error_message)
        return self


###############################################################################
# WORKSPACE VIEW
###############################################################################


class WorkspaceMixinTester(object):

    @property
    def active_tab(self):
        for tab in self.tabs:
            if tab.active:
                return tab
        return None

    @property
    def tabs(self):
        return [WorkspaceTabTester(self, e) for e in self.driver.find_elements_by_css_selector(".wc-workspace .wc-workspace-tab")]

    @property
    def widgets(self):
        return [WidgetTester(self, e) for e in self.driver.find_elements_by_css_selector(".wc-workspace .wc-widget")]

    @property
    def create_tab_button(self):
        return ButtonTester(self, self.driver.find_element_by_css_selector(".wc-workspace .wc-create-workspace-tab"))

    def create_tab(self):
        tab_ids = [tab.id for tab in self.tabs]
        self.create_tab_button.click()

        def tab_created(driver):
            tabs = self.tabs

            if len(tabs) == len(tab_ids) + 1:
                for tab in tabs:
                    if tab.id not in tab_ids:
                        return tab
            return None

        return WebDriverWait(self.driver, timeout=5).until(tab_created)

    def create_widget(self, query, new_title=None, version=None):
        with self.edit_mode as edit_session:
            with edit_session.resource_sidebar as sidebar:
                resource = sidebar.search_component('widget', query)
                tab_widget = resource.create_component(version=version)

        if new_title is not None:
            tab_widget.rename(new_title)

        return tab_widget

    def find_tab(self, id=None, name=None, title=None):
        for tab in self.tabs:
            if (id is not None and tab.id == id) or (name is not None and tab.name == name) or (title is not None and tab.title == title):
                return tab
        return None

    def find_widget(self, id=None, title=None):
        for widget in self.widgets:
            if (id is not None and widget.id == id) or (title is not None and widget.title == title):
                return widget
        return None


class EditModeSession(object):

    def __init__(self, testcase):
        self.resource_sidebar = WorkspaceComponentSidebarTester(testcase)
        self.wiring_view = WiringViewTester(testcase)


class EditMode(object):

    def __init__(self, testcase):
        self.testcase = testcase
        self.nestinglevel = 0

    def __enter__(self):
        if self.nestinglevel == 0:
            edit_mode_button = self.testcase.find_navbar_button("wc-edit-mode-button")
            edit_mode_button.click()
        self.nestinglevel += 1

        return EditModeSession(self.testcase)

    def __exit__(self, type, value, traceback):
        self.nestinglevel -= 1
        if self.nestinglevel == 0:
            edit_mode_button = self.testcase.find_navbar_button("wc-edit-mode-button")
            edit_mode_button.click()


class WorkspaceComponentSidebarTester(object):

    def __init__(self, testcase):
        self.testcase = testcase

    def __enter__(self):
        button = self.testcase.find_navbar_button("wc-show-component-sidebar-button")
        self.element = self.testcase.driver.find_element_by_css_selector(".wc-workspace .wc-resource-list")
        if not button.is_active:
            button.click()
            WebDriverWait(self.testcase.driver, timeout=5).until(WEC.element_be_still(self.element))
        return self

    def __exit__(self, type, value, traceback):
        button = self.testcase.find_navbar_button("wc-show-component-sidebar-button")
        if button.is_active:
            button.click()
            WebDriverWait(self.testcase.driver, timeout=5).until(WEC.element_be_still(self.element))

    @property
    def component_list(self):
        return self.element.find_element_by_css_selector('.wc-macsearch-list')

    @property
    def components(self):
        return [WorkspaceComponentTester(self.testcase, e) for e in self.component_list.find_elements_by_css_selector(".we-component-group")]

    def search_in_results(self, title):
        self.wait_ready()

        for resource in self.components:
            if resource.title == title:
                return resource
        return None

    def search(self, type, query):
        button = ButtonTester(self.testcase, self.element.find_element_by_css_selector(".wc-filter-type-%s" % (type,)))

        if not button.is_active:
            button.click()

        field = FieldTester(self.testcase, self.element.find_element_by_css_selector(".se-field-search"))
        field.set_value(query)
        field.enter()
        return self

    def search_component(self, type, title):
        return self.search(type, title).search_in_results(title)

    def wait_ready(self, timeout=10):
        WebDriverWait(self.testcase.driver, timeout).until(lambda driver: 'disabled' not in self.component_list.get_attribute('class').split())
        time.sleep(0.1)


class WorkspaceComponentTester(WebElementTester):

    @property
    def id(self):
        return self.get_attribute('data-id')

    @property
    def title(self):
        return self.find_element('.we-component-meta .panel-title').text

    @property
    def version_select(self):
        return Select(self.element.find_element_by_css_selector('.se-select select'))

    def switch_to(self, version):
        self.version_select.select_by_value(version)

    def create_component(self, version=None):
        if version is not None:
            self.switch_to(version)

        ids = [WidgetTester(self.testcase, e).id for e in self.testcase.driver.find_elements_by_css_selector(".wc-workspace .wc-widget")]
        self.testcase.scroll_and_click(self.find_element(".wc-create-resource-component"))

        def widget_created(driver):
            widgets = [WidgetTester(self.testcase, e) for e in self.testcase.driver.find_elements_by_css_selector(".wc-workspace .wc-widget")]

            if len(widgets) == len(ids) + 1:
                for widget in widgets:
                    if widget.id not in ids:
                        return widget
            return False

        return WebDriverWait(self.testcase.driver, timeout=5).until(widget_created)

    def merge(self):
        workspace_name = self.testcase.get_current_workspace_name()
        self.testcase.scroll_and_click(self.find_element(".wc-create-resource-component"))
        self.testcase.wait_wirecloud_ready()
        self.testcase.assertEqual(self.testcase.get_current_workspace_name(), workspace_name)


class WorkspaceTabTester(WebElementTester):

    @property
    def active(self):
        return 'selected' in self.class_list

    @property
    def content(self):
        return WebElementTester(self.testcase, self.testcase.driver.find_element_by_css_selector(".wc-workspace .wc-workspace-tab-content[data-id='%s']" % self.id))

    @property
    def id(self):
        return self.get_attribute('data-id')

    @property
    def name(self):
        return self.get_attribute('data-name')

    @property
    def title(self):
        return self.find_element("span").text

    @property
    def widgets(self):
        return [WidgetTester(self.testcase, e) for e in self.content.find_elements(".wc-widget")]

    def find_widget(self, id=None, title=None):
        for widget in self.widgets:
            if (id is not None and widget.id == id) or (title is not None and widget.title == title):
                return widget
        return None

    def show_preferences(self):
        button = WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".icon-tab-menu"), parent=True, base_element=self.element))
        element = self.testcase.wait_element_visible('.se-popup-menu')

        return PopupMenuTester(self.testcase, element, button)

    def remove(self, timeout=10):
        old_tab_count = len(self.testcase.driver.find_elements_by_css_selector(".wc-workspace .wc-workspace-tab"))
        empty = len(self.widgets) == 0

        self.show_preferences().click_entry('Remove')

        if not empty:
            self.testcase.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']").click()

        def tab_removed(driver):
            new_length = len(self.testcase.driver.find_elements_by_css_selector(".wc-workspace .wc-workspace-tab"))
            return new_length == old_tab_count - 1

        WebDriverWait(self.testcase.driver, timeout).until(tab_removed)

    def rename(self, new_title, timeout=10):
        self.show_preferences().click_entry("Rename")
        modal = FormModalTester(self.testcase, self.testcase.wait_element_visible(".window_menu:not(#loading-message)"))
        self.testcase.assertEqual(modal.get_field('title').value, self.title)
        modal.get_field('title').set_value(new_title)
        modal.accept()

        def tab_renamed(driver):
            return self.title == new_title

        WebDriverWait(self.testcase.driver, timeout).until(tab_renamed)


class WidgetTester(WebElementTester):

    def __eq__(self, other):
        return isinstance(other, WidgetTester) and other.id == self.id

    def __enter__(self):
        self.wait_loaded()
        self.testcase.driver.switch_to.frame(self.content)
        return self

    def __exit__(self, type, value, traceback):
        self.testcase.driver.switch_to.frame(None)
        self.testcase.driver.switch_to.default_content()  # TODO: work around webdriver bugs

    @property
    def bottom_handle(self):
        return WebElementTester(self.testcase, self.find_element(".wc-bottom-resize-handle"))

    @property
    def bottom_left_handle(self):
        return WebElementTester(self.testcase, self.find_element(".wc-bottom-left-resize-handle"))

    @property
    def bottom_right_handle(self):
        return WebElementTester(self.testcase, self.find_element(".wc-bottom-right-resize-handle"))

    @property
    def content(self):
        return self.find_element(".wc-widget-content")

    @property
    def id(self):
        return self.get_attribute('data-id')

    @property
    def loaded(self):
        return self.testcase.driver.execute_script("""
            try {
                return !!Wirecloud.activeWorkspace.findWidget(arguments[0]).loaded;
            } catch (e) {
                return false;
            }
        """, self.id)

    @property
    def btn_preferences(self):
        return ButtonTester(self.testcase, self.find_element(".wc-menu-button"))

    @property
    def title_element(self):
        return self.find_element(".panel-heading .panel-title")

    @property
    def title(self):
        return self.title_element.text

    @property
    def remove_button(self):
        return ButtonTester(self.testcase, self.find_element(".wc-remove"))

    @property
    def size(self):
        return {
            'width': "%ipx" % self.element.size['width'],
            'height': "%ipx" % self.element.size['height']
        }

    @property
    def position(self):
        return {
            'x': self.element.value_of_css_property('left'),
            'y': self.element.value_of_css_property('top')
        }

    @property
    def error_count(self):
        driver = self.testcase.driver

        old_frame = driver.execute_script("return window.frameElement")
        driver.switch_to.default_content()
        error_count = driver.execute_script('return Wirecloud.activeWorkspace.findWidget("%s").logManager.errorCount' % self.id)
        driver.switch_to.frame(old_frame)

        return error_count

    @property
    def log_entries(self):
        driver = self.testcase.driver

        old_frame = driver.execute_script("return window.frameElement")
        driver.switch_to.default_content()
        log_entries = driver.execute_script('''
            var iwidget = Wirecloud.activeWorkspace.findWidget("%s");
            return iwidget.logManager.entries.map(function (entry) { return {date: entry.date.getTime(), level: entry.level, msg: entry.msg}; });
        ''' % self.id)
        driver.switch_to.frame(old_frame)

        return log_entries

    @property
    def layout_position(self):

        return tuple(self.testcase.driver.execute_script('''
            var iwidget = Wirecloud.activeWorkspace.view.findWidget("%s");
            var position = iwidget.position;
            return [position.x, position.y];
        ''' % self.id))

    def open_menu(self):
        button = self.btn_preferences.click()
        return PopupMenuTester(self.testcase, self.testcase.wait_element_visible(".se-popup-menu"), button)

    def show_settings(self):
        self.open_menu().click_entry("Settings")
        return FormModalTester(self.testcase, self.testcase.wait_element_visible(".wc-component-preferences-modal"))

    def rename(self, new_title, timeout=30):

        self.open_menu().click_entry('Rename')
        name_input = self.element.find_element_by_css_selector('.wc-widget-heading span')
        WebDriverWait(self.testcase.driver, 5).until(lambda driver: name_input.get_attribute('contenteditable') == 'true')
        # We cannot use send_keys due to http://code.google.com/p/chromedriver/issues/detail?id=35
        self.testcase.driver.execute_script('arguments[0].textContent = arguments[1]', name_input, new_title)
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
            return driver.execute_script('return Wirecloud.activeWorkspace.findWidget("%s").title === "%s"' % (self.id, new_title))

        WebDriverWait(self.testcase.driver, timeout).until(name_changed)

    def resize(self, handle_name, x=0, y=0, timeout=5):
        WebDriverWait(self.testcase.driver, timeout=timeout).until(WEC.element_be_still(self.element))
        handle = getattr(self, handle_name + '_handle')
        ActionChains(self.testcase.driver).click_and_hold(handle.element).move_by_offset(x, y).perform()
        ActionChains(self.testcase.driver).release().perform()
        WebDriverWait(self.testcase.driver, timeout=timeout).until(WEC.element_be_still(self.element))

    def wait_still(self, timeout=2):
        WebDriverWait(self.testcase.driver, timeout=timeout).until(WEC.element_be_still(self.element))
        return self

    def wait_loaded(self):
        WebDriverWait(self.testcase.driver, timeout=10).until(lambda driver: self.loaded)
        return self

    def maximize(self, timeout=10):

        WebDriverWait(self.testcase.driver, 2).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".fa-plus"), base_element=self.element))
        WebDriverWait(self.testcase.driver, timeout=timeout).until(WEC.element_be_still(self.element))

    def minimize(self, timeout=10):

        WebDriverWait(self.testcase.driver, 2).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".fa-minus"), base_element=self.element))
        WebDriverWait(self.testcase.driver, timeout=timeout).until(WEC.element_be_still(self.element))

    def reload(self):
        self.open_menu().click_entry('Reload')
        return self

    def remove(self, timeout=10):
        old_length = len(self.testcase.driver.find_elements_by_css_selector(".wc-workspace .wc-widget"))
        self.remove_button.click()

        def widget_removed(driver):
            new_length = len(self.testcase.driver.find_elements_by_css_selector(".wc-workspace .wc-widget"))
            return old_length == new_length + 1

        WebDriverWait(self.testcase.driver, timeout).until(widget_removed)


###############################################################################
# WORKSPACE WIRING VIEW
###############################################################################


class BaseComponentTester(WebElementTester):

    def __init__(self, testcase, element, type):
        super(BaseComponentTester, self).__init__(testcase, element)
        self.type = type
        self.id = self.get_attribute('data-id')

    @property
    def btn_preferences(self):
        return ButtonTester(self.testcase, self.find_element(".we-prefs-btn"))

    @property
    def title(self):
        return self.find_element(".panel-title").text

    def rename(self, title):
        self.show_preferences().click_entry("Rename")

        modal = FormModalTester(self.testcase, self.testcase.wait_element_visible(".wc-component-rename-modal"))
        modal.get_field('title').set_value(title)
        modal.accept()

        WebDriverWait(self.testcase.driver, timeout=5).until(lambda driver: self.title == title)
        return self

    def show_logs(self):
        self.show_preferences().click_entry("Logs")
        return AlertModalTester(self.testcase, self.testcase.wait_element_visible(".wc-component-logs-modal"))

    def show_preferences(self):
        button = self.btn_preferences.click()
        return PopupMenuTester(self.testcase, self.testcase.wait_element_visible(".se-popup-menu"), button)

    def show_settings(self):
        self.show_preferences().click_entry("Settings")
        return FormModalTester(self.testcase, self.testcase.wait_element_visible(".wc-component-preferences-modal"))

    def change_version(self, version):
        self.show_preferences().click_entry("Upgrade/Downgrade")
        modal = FormModalTester(self.testcase, self.testcase.wait_element_visible(".wc-upgrade-component-modal"))
        modal.get_field('version').set_value(version)
        modal.accept()
        return self


class WiringComponentTester(BaseComponentTester):

    @property
    def state(self):
        label_element = self.find_element(".label")
        return "" if label_element is None else label_element.text

    @property
    def version(self):
        return self.find_element(".component-version").text

    def has_state(self, state):
        return self.state == state

    def change_version(self, version):
        super(WiringComponentTester, self).change_version(version)
        WebDriverWait(self.testcase.driver, timeout=5).until(lambda driver: self.version == "v" + version)
        return self


class WiringComponentGroupTester(WebElementTester):

    def __init__(self, testcase, element, type):
        super(WiringComponentGroupTester, self).__init__(testcase, element)
        self.type = type

    @property
    def btn_create(self):
        return ButtonTester(self.testcase, self.find_element(".btn-create"))

    @property
    def id(self):
        return self.get_attribute('data-id')

    @property
    def image(self):
        return self.find_element(".se-thumbnail")

    @property
    def title(self):
        return self.find_element(".we-component-meta .panel-title").text

    def create_component(self):
        new_length = len(self.find_components()) + 1
        # scroll into view the component_group panel to be able to click the create button
        self.scroll().btn_create.click()
        WebDriverWait(self.testcase.driver, timeout=5).until(lambda driver: new_length == len(self.find_components()))
        return self.find_components()[-1]

    def find_component(self, id=None, title=None):
        if id is not None and not isinstance(id, str):
            id = "%s" % id

        for component in self.find_components():
            if (id is not None and id == component.id) or (title is not None and title == component.title):
                return component
        return None

    def find_components(self, state=None):
        if state is None:
            return [WiringComponentTester(self.testcase, e, self.type) for e in self.find_elements(".we-component")]
        return [c for c in self.find_components() if c.has_state(state)]

    def has_components(self):
        return len(self.components) != 0

    def has_image(self):
        return 'se-thumbnail-missing' not in self.image.get_attribute('class').split()


class WiringComponentDraggableTester(BaseComponentTester):

    @property
    def btn_add(self):
        return ButtonTester(self.testcase, self.find_element(".btn-add"))

    @property
    def btn_remove(self):
        return ButtonTester(self.testcase, self.find_element(".btn-remove"))

    @property
    def order_endpoints(self):
        return ComponentEditableViewTester(self.testcase, self)

    def collapse_endpoints(self):
        self.testcase.assertFalse(self.has_class('collapsed'))
        self.show_preferences().click_entry("Collapse")
        self.testcase.assertTrue(self.has_class('collapsed'))
        return self

    def expand_endpoints(self):
        self.testcase.assertTrue(self.has_class('collapsed'))
        self.show_preferences().click_entry("Expand")
        self.testcase.assertFalse(self.has_class('collapsed'))
        return self

    def find_endpoint(self, type, name=None, title=None):
        for endpoint in self.find_endpoints(type):
            if title is not None and endpoint.title == title or name is not None and endpoint.name == name:
                return endpoint

        return None

    def find_endpoints(self, type=None):
        if type is None:
            return self.find_endpoints('target') + self.find_endpoints('source')
        return [WiringEndpointTester(self.testcase, e, type, self) for e in self.find_elements(".%s-endpoints .endpoint" % (type,))]

    def remove(self):
        self.btn_remove.click()
        return self

    def wait_to_be_loaded(self, timeout=5):

        def is_loaded(driver):
            return driver.execute_script('''
                return Wirecloud.activeWorkspace.%ssById["%s"].loaded;
            ''' % (self.type, self.id))

        WebDriverWait(self.testcase.driver, timeout=timeout).until(is_loaded)


class WiringConnectionTester(WebElementTester):

    @property
    def btn_add(self):
        return ButtonTester(self.testcase, self.options.find_element_by_css_selector(".btn-add"))

    @property
    def btn_logs(self):
        return ButtonTester(self.testcase, self.options.find_element_by_css_selector(".btn-show-logs"))

    @property
    def btn_preferences(self):
        return ButtonTester(self.testcase, self.options.find_element_by_css_selector(".we-prefs-btn"))

    @property
    def btn_remove(self):
        return ButtonTester(self.testcase, self.options.find_element_by_css_selector(".btn-remove"))

    @property
    def distance(self):
        return self.find_element(".connection-path").get_attribute('d')

    @property
    def options(self):
        return self.testcase.driver.find_element_by_css_selector(".connection-options[data-sourceid='%s'][data-targetid='%s']" % (self.source_id, self.target_id))

    @property
    def source_id(self):
        return self.element.get_attribute("data-sourceid")

    @property
    def target_id(self):
        return self.element.get_attribute("data-targetid")

    def change_endpoint(self, endpoint, new_endpoint):
        if not self.has_class('active'):
            self.click()
        ActionChains(self.testcase.driver).click_and_hold(endpoint.element).move_to_element(new_endpoint.element).perform()
        WebDriverWait(self.testcase.driver, 2).until(lambda driver: self.has_class('temporal'))
        ActionChains(self.testcase.driver).release().perform()
        return self

    def click(self):
        # FIXME: This method should click over some point of this connection. For example,
        # getting the connection path. For now, we are using a work around for
        # not clicking on the connection buttons as they are placed in the
        # middle of the connection
        self.testcase.driver.execute_script('''
            var connectionEngine = Wirecloud.UserInterfaceManager.views.wiring.connectionEngine;
            connectionEngine.getConnection("%s", "%s").click();
        ''' % (self.source_id, self.target_id))
        return self

    def remove(self):
        self.btn_remove.click()

        return self

    def show_preferences(self):
        button = self.btn_preferences.click()
        return PopupMenuTester(self.testcase, self.testcase.wait_element_visible(".se-popup-menu"), button)

    def show_logs(self):
        self.btn_logs.click()
        return AlertModalTester(self.testcase, self.testcase.wait_element_visible(".logwindowmenu"))


class WiringEndpointTester(WebElementTester):

    def __init__(self, testcase, element, type, component):
        super(WiringEndpointTester, self).__init__(testcase, element)
        self.type = type
        self.component = component

    @property
    def id(self):
        return "{}/{}/{}".format(self.component.type, self.component.id, self.name)

    @property
    def index(self):
        return int(self.get_attribute('data-index'))

    @property
    def is_active(self):
        return self.has_class('active')

    @property
    def name(self):
        return self.get_attribute('data-name')

    @property
    def title(self):
        return self.find_element(".endpoint-title").text

    def change_position(self, endpoint):
        new_index = endpoint.index
        ActionChains(self.testcase.driver).click_and_hold(self.element).move_to_element(endpoint.element).release().perform()

        WebDriverWait(self.testcase.driver, 3).until(lambda driver: self.index == new_index)
        return self

    def create_connection(self, endpoint, must_recommend=(), must_expand=()):
        ActionChains(self.testcase.driver).click_and_hold(self.element).perform()
        # Wait until the browser reacts
        time.sleep(0.4)
        WebDriverWait(self.testcase.driver, 5).until(lambda driver: self.is_active)
        for endpoint in must_recommend:
            self.testcase.assertTrue(endpoint.is_active)
        for component in must_expand:
            self.testcase.assertFalse(component.has_class('collapsed'))

        ActionChains(self.testcase.driver).move_to_element(endpoint.element).release().perform()
        return WebDriverWait(self.testcase.driver, 5).until(lambda driver: self.find_connection(endpoint))

    def find_connection(self, endpoint):
        for connection in self.find_connections():
            if getattr(connection, '%s_id' % (endpoint.type,)) == endpoint.id:
                return connection
        return None

    def find_connections(self):
        return [WiringConnectionTester(self.testcase, e) for e in self.testcase.driver.find_elements_by_css_selector(".connection[data-%sid='%s']" % (self.type, self.id))]

    def mouse_over(self, must_recommend=()):
        ActionChains(self.testcase.driver).move_to_element(self.element).perform()
        # Wait until the browser reacts
        time.sleep(0.2)
        WebDriverWait(self.testcase.driver, 5).until(lambda driver: self.is_active)
        for endpoint in must_recommend:
            self.testcase.assertTrue(endpoint.is_active)
        return self


class WiringBehaviourTester(WebElementTester):

    @property
    def btn_preferences(self):
        return ButtonTester(self.testcase, self.find_element(".we-prefs-btn"))

    @property
    def btn_remove(self):
        return ButtonTester(self.testcase, self.find_element(".btn-remove"))

    @property
    def description(self):
        return self.find_element(".behaviour-description").text

    @property
    def heading(self):
        return self.find_element(".behaviour-title")

    @property
    def index(self):
        return int(self.get_attribute('data-index'))

    @property
    def is_active(self):
        return self.has_class('active')

    @property
    def title(self):
        return self.heading.text

    def activate(self):
        # scroll into view the component panel to be able to drag and dop it
        self.testcase.driver.execute_script("return arguments[0].scrollIntoView();", self.element)

        WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable(self.heading))
        return self

    def change_position(self, behaviour):
        new_index = behaviour.index
        actions = ActionChains(self.testcase.driver).click_and_hold(self.heading)

        for i in range(abs(new_index - self.index)):
            actions.move_to_element(behaviour.heading)

        actions.release().perform()
        self.testcase.assertEqual(self.index, new_index)
        return self

    def check_info(self, title=None, description=None):
        if title is not None:
            self.testcase.assertEqual(self.title, title)
        if description is not None:
            self.testcase.assertEqual(self.description, description)
        return self

    def show_preferences(self):
        button = self.btn_preferences.click()
        return PopupMenuTester(self.testcase, self.testcase.wait_element_visible(".se-popup-menu"), button)

    def show_settings(self):
        self.show_preferences().click_entry("Settings")
        return FormModalTester(self.testcase, self.testcase.wait_element_visible(".behaviour-update-form"))

    def update(self, title=None, description=None):
        modal = self.show_settings()

        if title is not None:
            modal.get_field('title').set_value(title)

        if description is not None:
            modal.get_field('description').set_value(description)

        modal.accept()

        title = title if title is not None and title else "New behaviour"
        description = description if description is not None and description else "No description provided."

        return self.check_info(title, description)


class ComponentEditableViewTester(object):

    def __init__(self, testcase, component):
        self.testcase = testcase
        self.component = component

    def __enter__(self):
        self.component.show_preferences().click_entry("Order endpoints")
        WebDriverWait(self.testcase.driver, timeout=5).until(lambda driver: len(driver.find_elements_by_css_selector('.endpoints.orderable')) > 0)
        return self

    def __exit__(self, type, value, traceback):
        self.component.show_preferences().click_entry("Stop ordering")
        self.testcase.assertEqual(len([e for e in self.component.find_endpoints() if e.is_active]), 0)

    def move_endpoint(self, type, e1_name, e2_name, must_change=()):
        distances = [c.distance for c in must_change]
        self.component.find_endpoint(type, e1_name).change_position(self.component.find_endpoint(type, e2_name))
        for d1, d2 in zip(distances, [c.distance for c in must_change]):
            self.testcase.assertTrue(d1 != d2)
        return self


class RemoteTestCase(WorkspaceMixinTester):

    def wait_element_visible(self, selector, timeout=10, element=None):
        condition = WEC.visibility_of_element_located((By.CSS_SELECTOR, selector), base_element=element)
        return WebDriverWait(self.driver, timeout).until(condition)

    def wait_element_visible_by_xpath(self, selector, timeout=10, element=None):
        condition = WEC.visibility_of_element_located((By.XPATH, selector), base_element=element)
        return WebDriverWait(self.driver, timeout).until(condition)


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
        cls._driver_needs_unload = (
            cls.driver.capabilities['browserName'] == 'firefox' and
            cls.driver.capabilities.get('browserVersion', '0').split('.') > ['52', '3']
        )

    @classmethod
    def tearDownClass(cls):

        # Remove chrome/chromium temporal directories
        if 'chrome' in cls.driver.capabilities:
            shutil.rmtree(cls.driver.capabilities['chrome']['userDataDir'], ignore_errors=True)

        cls.driver.quit()

    def setUp(self):

        self.edit_mode = EditMode(self)
        self.marketplace_view = MarketplaceViewTester(self)
        self.myresources_view = MyResourcesViewTester(self)

    def tearDown(self):

        self.driver.delete_all_cookies()

    def find_navbar_button(self, classname, wait=False):
        if wait:
            return ButtonTester(self, self.wait_element_visible(".wc-toolbar .%s" % classname))
        else:
            try:
                return ButtonTester(self, self.driver.find_element_by_css_selector(".wc-toolbar .%s" % classname))
            except NoSuchElementException:
                return None

    def scroll_and_click(self, element):

        # Work around chrome and firefox driver bugs
        try:
            self.driver.execute_script("arguments[0].scrollIntoView(false);", element)
        except:
            pass
        ActionChains(self.driver).click(element).perform()

    def reload(self):
        """
        Reloads the current page

        This method differs from self.driver.refresh() in that the later purges
        the cache before reloading the browser
        """
        self.driver.execute_script("location.reload()")
        self.wait_wirecloud_unload()

    def wait_wirecloud_unload(self, timeout=15):

        # TODO: This seems to be needed when using some version greather than 52.3
        # of firefox. We need to detect the exact version, but seems safe to use
        # 52.3 as threshold for now
        if self._driver_needs_unload:
            loading_window = self.wait_element_visible('#loading-window')
            WebDriverWait(self.driver, timeout).until(EC.staleness_of(loading_window))

    def wait_wirecloud_ready(self, start_timeout=20, timeout=20, login=False, embedded=False):

        loading_window = None

        def wait_loading_window_fadding(driver):
            return 'in' not in loading_window.get_attribute('class').strip()

        try:
            loading_window = self.wait_element_visible('#loading-window')
        except TimeoutException:
            # On page load, selenium sometimes waits until the loading process
            # ends completely. In that case, the loading window element won't be
            # visible, but because WireCloud is already ready.
            if not login:
                raise
        else:
            WebDriverWait(self.driver, timeout).until(wait_loading_window_fadding)

            loading_message = loading_window.find_element_by_id('loading-message')
            try:
                self.driver.execute_script("arguments[0].click();", loading_message)
            except:
                pass

        if embedded:
            self.wait_element_visible('.wc-body:not(.se-on-transition)')
        else:
            WebDriverWait(self.driver, 10).until(lambda driver: self.get_current_view() != '')

        time.sleep(0.2)  # work around some problems

    def login(self, username='admin', password='admin', next=None):

        url = self.live_server_url + '/login'
        if next is not None:
            url += '?next=' + next

        self.driver.get(url)

        # TODO
        self.driver.add_cookie({'name': 'policy_cookie', 'value': 'on', 'path': '/'})

        form = FormTester(self, self.wait_element_visible('#wc-login-form'))
        form.get_field('username').set_value(username)
        form.get_field('password').set_value(password)
        form.submit()

        self.wait_wirecloud_ready(login=True)

    def get_current_view(self):

        try:
            return self.driver.execute_script("return document.querySelector('.wc-body').classList.contains('se-on-transition') ? '' : Wirecloud.UserInterfaceManager.header.currentView.view_name;")
        except:
            return ""

    def open_menu(self):
        button = WebDriverWait(self.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".wirecloud_header_nav .wc-menu-button")))
        popup_menu_element = self.wait_element_visible('.se-popup-menu')

        return PopupMenuTester(self, popup_menu_element, button)

    def create_workspace(self, title=None, mashup=None, expect_missing_dependencies=None, install_dependencies=False, parameters=None):

        if mashup is None and title is None:
            raise ValueError('Missing workspace title')

        self.open_menu().click_entry('New workspace')

        form = FormModalTester(self, self.wait_element_visible('.wc-new-workspace-modal'))

        if title:
            form.get_field('title').set_value(title)

        if mashup:
            with MACFieldTester(self, form.element.find_element_by_css_selector('.se-mac-field')) as select_dialog:
                select_dialog.search(mashup)
                resource = select_dialog.search_in_results(mashup)
                resource.select()

        form.accept()

        if expect_missing_dependencies is not None:

            form = FormModalTester(self, self.wait_element_visible('.wc-missing-dependencies-modal'))

            missing_dependency_elements = form.body.find_elements_by_tag_name('li')
            missing_dependencies = [missing_dependency_element.text for missing_dependency_element in missing_dependency_elements]

            self.assertEqual(set(missing_dependencies), set(expect_missing_dependencies))

            if not install_dependencies:
                form.cancel()
                return

            form.accept()

        if parameters is not None:

            form = FormModalTester(self, self.wait_element_visible('.wc-workspace-preferences-modal'))

            for parameter_name, parameter_value in parameters.items():
                form.get_field(parameter_name).set_value(parameter_value)

            # Browsers only use the ETag/If-None-Match headers when the serve uses http 1.1+
            # Last-Modified/If-Modified-Since headers have a resolution of 1 second
            # Django uses by default http 1.0
            time.sleep(1.5)

            form.accept()

        self.wait_wirecloud_ready()

        if title is not None:
            self.assertEqual(self.get_current_workspace_title(), title)
        else:
            self.assertTrue(self.get_current_workspace_title() == mashup, 'Invalid workspace name after creating workspace from catalogue')

    def get_current_workspace_name(self):

        return self.driver.execute_script('return Wirecloud.activeWorkspace.name;')

    def get_current_workspace_title(self):

        try:
            return self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').text
        except StaleElementReferenceException:
            return self.get_current_workspace_name()

    def rename_workspace(self, workspace_title):
        self.open_menu().click_entry("Rename")

        modal = FormModalTester(self, self.wait_element_visible(".window_menu:not(#loading-message)"))
        self.assertEqual(modal.get_field('title').value, self.get_current_workspace_title())
        modal.get_field('title').set_value(workspace_title)
        modal.accept()

        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.get_current_workspace_title() == workspace_title)

    def change_current_workspace(self, workspace_title):
        self.open_menu().click_entry(workspace_title)

        self.wait_wirecloud_ready()
        self.assertEqual(self.get_current_workspace_title(), workspace_title)

    def remove_workspace(self):
        self.open_menu().click_entry('Remove')

        modal = ModalTester(self, self.wait_element_visible(".wc-alert-modal"))
        modal.accept()

        def workspace_removed(driver):
            return self.get_current_workspace_name() == 'home'

        WebDriverWait(self.driver, timeout=5).until(workspace_removed)

    def publish_workspace(self, info):

        self.open_menu().click_entry('Upload to my resources')

        form = FormModalTester(self, self.wait_element_visible('.wc-upload-workspace-modal'))
        form.get_field('title').set_value(info['title'])
        form.get_field('vendor').set_value(info['vendor'])
        form.get_field('version').set_value(info['version'])

        if 'email' in info:
            form.get_field('email').set_value(info['email'])

        if info.get('readOnlyWidgets', False) is True or info.get('readOnlyConnectables', False) is True:
            tabs = self.driver.find_elements_by_css_selector('.styled_form .se-notebook-tab')
            for tab in tabs:
                span = tab.find_element_by_css_selector('span')
                if span.text == 'Advanced':
                    tab.click()

            if info.get('readOnlyWidgets', False) is True:
                form.get_field("readOnlyWidgets").click()

            if info.get('readOnlyConnectables', False) is True:
                form.get_field("readOnlyConnectables").click()

        form.accept()
        WebDriverWait(self.driver, timeout=10).until(lambda driver: len(driver.find_elements_by_css_selector('.window_menu')) == 1)

        # Check that there are not windows showing errors
        # (the loading indicator has the window_menu class so always there is one window_menu)
        window_menus = self.driver.find_elements_by_css_selector('.window_menu')
        self.assertEqual(len(window_menus), 1, 'Error publishing workspace')

    def check_wiring_badge(self, error_count):
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.find_navbar_button("wc-show-wiring-button").has_badge(error_count))


class MarketplaceViewTester(object):

    def __init__(self, testcase):

        self.testcase = testcase
        self.myresources = MyResourcesViewTester(testcase, self)

    def __enter__(self):
        self.testcase.find_navbar_button("wc-show-marketplace-button").click()
        WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'marketplace')
        WebDriverWait(self.testcase.driver, 10).until(marketplace_loaded)
        return self

    def __exit__(self, type, value, traceback):
        WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".wirecloud_header_nav .wc-back-button")))
        WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'workspace')

    def get_current_catalogue_base_element(self):

        catalogues = self.testcase.driver.find_elements_by_css_selector('#marketplace > .se-alternatives > .catalogue')
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
        button = WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".wirecloud_header_nav .wc-menu-button")))
        popup_menu_element = self.testcase.wait_element_visible('.se-popup-menu')

        return PopupMenuTester(self.testcase, popup_menu_element, button)

    def get_current_marketplace_name(self):
        breadcrum = self.testcase.driver.find_element_by_id('wirecloud_breadcrum').text
        if breadcrum.startswith('marketplace/'):
            return breadcrum.split('/')[-1]
        else:
            return None

    def get_subview(self):

        return self.testcase.driver.execute_script('''
            var alternatives = Wirecloud.UserInterfaceManager.views.marketplace.alternatives.getCurrentAlternative().alternatives;
            return alternatives.hasClassName('se-on-transition') ? "" : alternatives.getCurrentAlternative().view_name;
        ''')

    def get_current_resource(self):

        if self.get_subview() == 'details':
            try:
                return self.testcase.driver.find_element_by_css_selector('#wirecloud_breadcrum .resource_title').text
            except StaleElementReferenceException:
                return ""

    def switch_to(self, market, timeout=5):

        if self.get_current_marketplace_name() == market:
            return

        self.open_menu().click_entry(market)
        WebDriverWait(self.testcase.driver, timeout).until(WEC.marketplace_name(self, market))
        self.wait_catalogue_ready()

    def add(self, name, url, type_, expect_error=False, public=False):

        self.open_menu().click_entry("Add new marketplace")

        form = FormModalTester(self.testcase, self.testcase.wait_element_visible('.wc-add-external-catalogue-modal'))
        form.get_field('title').set_value(name)
        form.get_field('url').set_value(url)
        form.get_field('type').set_value(type_)

        if public:
            form.get_field('public').click()

        form.accept()

        if expect_error:
            try:
                form.wait_error()
            except TimeoutException:
                self.testcase.fail("Marketplace addition didn't fail as expected")
            finally:
                form.cancel()

            self.testcase.assertNotEqual(self.get_current_marketplace_name(), name)
        else:
            form.wait_close()

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

            WebDriverWait(self.testcase.driver, 3).until(lambda driver: self.get_current_marketplace_name() != market)

    def search(self, keyword):
        catalogue_base_element = self.wait_catalogue_ready()

        search_input = FieldTester(self.testcase, catalogue_base_element.find_element_by_css_selector('.simple_search_text'))
        search_input.set_value(keyword)
        search_input.enter()

        self.wait_catalogue_ready()

        return self

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
        self.testcase.find_navbar_button("wc-show-myresources-button").click()
        WebDriverWait(self.testcase.driver, 10).until(lambda driver: self.testcase.get_current_view() == 'myresources')
        self.testcase.wait_element_visible('.wc-body:not(.se-on-transition)')
        return self

    def __exit__(self, type, value, traceback):
        if value is not None:
            return False

        if self.marketplace_view is None:
            WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, ".wirecloud_header_nav .wc-back-button")))

            WebDriverWait(self.testcase.driver, 5).until(lambda driver: self.testcase.get_current_view() == 'workspace')
        else:
            self.testcase.find_navbar_button("wc-show-marketplace-button").click()

            WebDriverWait(self.testcase.driver, 5).until(lambda driver: self.testcase.get_current_view() == 'marketplace')

    def get_current_catalogue_base_element(self):
        return self.testcase.driver.find_element_by_css_selector('.catalogue.myresources')

    def get_subview(self):

        return self.testcase.driver.execute_script('''
            var alternatives = Wirecloud.UserInterfaceManager.views.myresources.alternatives;
            return alternatives.hasClassName('se-on-transition') ? "" : alternatives.getCurrentAlternative().view_name;
        ''')

    def get_current_resource(self):

        if self.get_subview() == 'details':
            try:
                return self.testcase.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').text
            except StaleElementReferenceException:
                return ""

    def upload_resource(self, wgt_file, resource_name, shared=False, expect_error=False):

        if shared:
            wgt_path = os.path.join(self.testcase.shared_test_data_dir, wgt_file)
        else:
            wgt_path = os.path.join(self.testcase.test_data_dir, wgt_file)
        wgt_path = os.path.abspath(wgt_path)

        self.wait_catalogue_ready()

        self.testcase.find_navbar_button('wc-upload-mac-button').click()

        dialog = WebDriverWait(self.testcase.driver, 5).until(EC.visibility_of_element_located((By.CSS_SELECTOR, '.wc-upload-mac-modal')))
        dialog.find_element_by_css_selector('input[type="file"]').send_keys(wgt_path)
        WebDriverWait(self.testcase.driver, 5).until(WEC.element_be_clickable((By.CSS_SELECTOR, '.btn-primary'), base_element=dialog))
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

        resource = self.search(resource_name).search_in_results(resource_name)
        with resource:

            version_list = resource.get_version_list()
            should_disappear_from_listings = version is None or len(version_list) == 1

            action = 'Delete'
            if version is not None:
                resource.switch_to(version)
            elif len(version_list) > 1:
                action = 'Delete all versions'

            time.sleep(1)  # Work around some problems dealing with the cache
            resource.advanced_operation(action)

            modal = FormModalTester(self.testcase, self.testcase.wait_element_visible(".wc-alert-modal"))
            modal.accept()

            if should_disappear_from_listings:
                WebDriverWait(self.testcase.driver, 5).until(lambda driver: self.get_subview() == 'search')
            else:
                WebDriverWait(self.testcase.driver, 5).until(lambda driver: resource.version_select.first_selected_option != version)

        if should_disappear_from_listings:
            WebDriverWait(self.testcase.driver, 5).until(EC.staleness_of(resource.element))

        time.sleep(0.2)
        resource = self.search_in_results(resource_name)
        if should_disappear_from_listings:
            self.testcase.assertIsNone(resource)
        else:
            self.testcase.assertIsNotNone(resource)

    def uninstall_resource(self, resource_name, version=None, expect_error=False):

        resource = self.search(resource_name).search_in_results(resource_name)
        with resource:

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
                time.sleep(1)  # Work around some problems dealing with the cache
                resource.advanced_operation(action)
                if should_disappear_from_listings:
                    WebDriverWait(self.testcase.driver, 5).until(lambda driver: self.get_subview() == 'search')
                else:
                    WebDriverWait(self.testcase.driver, 5).until(lambda driver: resource.version_select.first_selected_option != version)

        if should_disappear_from_listings:
            WebDriverWait(self.testcase.driver, 5).until(EC.staleness_of(resource.element))

        time.sleep(0.2)
        resource = self.search_in_results(resource_name)
        if should_disappear_from_listings:
            self.testcase.assertIsNone(resource)
        else:
            self.testcase.assertIsNotNone(resource)


class BaseWiringViewTester(object):

    def __init__(self, testcase):
        self.testcase = testcase
        self.expect_error = False

    @property
    def body(self):
        return self.testcase.driver.find_element_by_css_selector(".wiring-diagram")

    @property
    def btn_back(self):
        return ButtonTester(self.testcase, self.testcase.driver.find_element_by_css_selector(".wirecloud_header_nav .wc-back-button"))

    @property
    def btn_behaviours(self):
        return self.testcase.find_navbar_button("we-show-behaviour-sidebar-button")

    @property
    def btn_components(self):
        return self.testcase.find_navbar_button("we-show-component-sidebar-button")

    def find_connection(self, source_id, target_id):
        for connection in self.find_connections():
            if connection.source_id == source_id and connection.target_id == target_id:
                return connection
        return None

    def find_connections(self, extra_class=None):
        if extra_class is None:
            return [WiringConnectionTester(self.testcase, e) for e in self.testcase.driver.find_elements_by_css_selector(".connection")]
        return [c for c in self.find_connections() if c.has_class(extra_class)]

    def find_draggable_component(self, type, id=None, title=None):
        if id is not None and not isinstance(id, str):
            id = "%s" % id

        for component in self.find_draggable_components(type):
            if (id is not None and id == component.id) or (title is not None and title == component.title):
                return component
        return None

    def find_draggable_components(self, type=None, extra_class=None):
        if type is None:
            return self.find_draggable_components('operator', extra_class=extra_class) + self.find_draggable_components('widget', extra_class=extra_class)
        components = [WiringComponentDraggableTester(self.testcase, e, type) for e in self.testcase.driver.find_elements_by_css_selector(".component-draggable.component-%s[data-id]" % (type,))]

        if extra_class is None:
            return components
        return [c for c in components if c.has_class(extra_class)]


class WiringBehaviourSidebarTester(BaseWiringViewTester):

    def __enter__(self):
        self.btn_behaviours.click()
        self.panel = self.testcase.driver.find_element_by_css_selector(".we-panel-behaviours")
        WebDriverWait(self.testcase.driver, timeout=5).until(WEC.element_be_still(self.panel))
        return self

    def __exit__(self, type, value, traceback):
        self.btn_behaviours.click()
        WebDriverWait(self.testcase.driver, timeout=5).until(WEC.element_be_still(self.panel))

    @property
    def active_behaviour(self):
        for behaviour in self.find_behaviours():
            if behaviour.is_active:
                return behaviour

        return None

    @property
    def btn_create(self):
        return ButtonTester(self.testcase, self.panel.find_element_by_css_selector(".btn-create"))

    @property
    def btn_enable(self):
        return ButtonTester(self.testcase, self.panel.find_element_by_css_selector(".btn-enable"))

    @property
    def btn_order(self):
        return ButtonTester(self.testcase, self.panel.find_element_by_css_selector(".btn-order"))

    @property
    def disabled(self):
        return self.btn_enable.has_icon("fa-lock")

    def create_behaviour(self, title=None, description=None):
        new_length = len(self.find_behaviours()) + 1
        self.btn_create.click()

        modal = FormModalTester(self.testcase, self.testcase.driver.find_element_by_css_selector(".we-new-behaviour-modal"))

        if title is not None:
            modal.get_field('title').set_value(title)

        if description is not None:
            modal.get_field('description').set_value(description)

        modal.accept()
        WebDriverWait(self.testcase.driver, timeout=5).until(lambda driver: new_length == len(self.find_behaviours()))

        title = title if title is not None and title else "New behaviour"
        description = description if description is not None and description else "No description provided."

        return self.find_behaviours()[-1].check_info(title, description)

    def find_behaviour(self, title):
        for behaviour in self.find_behaviours():
            if behaviour.title == title:
                return behaviour

        return None

    def find_behaviours(self):
        return [WiringBehaviourTester(self.testcase, e) for e in self.panel.find_elements_by_css_selector(".behaviour")]

    def has_behaviours(self):
        return len(self.find_behaviours()) != 0


class WiringComponentSidebarTester(BaseWiringViewTester):

    def __enter__(self):
        self.btn_components.click()
        self.element = self.testcase.driver.find_element_by_css_selector(".wc-workspace-wiring .we-panel-components")
        WebDriverWait(self.testcase.driver, timeout=5).until(WEC.element_be_still(self.element))
        return self

    def __exit__(self, type, value, traceback):
        self.btn_components.click()
        WebDriverWait(self.testcase.driver, timeout=5).until(WEC.element_be_still(self.element))

    @property
    def search_field(self):
        return FieldTester(self.testcase, self.element.find_element_by_css_selector(".se-text-field"))

    @property
    def alert(self):
        return WebElementTester(self.testcase, self.component_list.find_element_by_css_selector(".alert"))

    @property
    def component_list(self):
        return self.element.find_element_by_css_selector('.wc-macsearch-list')

    def add_component(self, type, group_id, id=None, title=None, x=0, y=0):
        component_group = self.find_component_group(type, group_id)
        component = component_group.create_component() if id is None and title is None else component_group.find_component(id=id, title=title)
        return self.create_component_draggable(component, x, y)

    def create_component_draggable(self, component, x=150, y=50):
        # scroll into view the component panel to be able to drag and dop it
        self.testcase.driver.execute_script("return arguments[0].scrollIntoView();", component.element)

        ActionChains(self.testcase.driver).click_and_hold(component.element).perform()
        try:
            WebDriverWait(self.testcase.driver, timeout=5).until(WEC.element_be_still(self.body))
            # move_to_element_with_offset sometimes fails with a MoveTargetOutOfBoundsException exception
            body_size = self.body.size
            ActionChains(self.testcase.driver).move_to_element(self.body).perform()
            ActionChains(self.testcase.driver) \
                .move_by_offset(-body_size['width'] / 2, -body_size['height'] / 2) \
                .perform()

            time.sleep(0.3)
            ActionChains(self.testcase.driver).move_by_offset(x, y).perform()
        finally:
            ActionChains(self.testcase.driver).release().perform()

        return self.find_draggable_component(component.type, id=component.id)

    def find_component(self, type, group_id, id=None, title=None):
        return self.find_component_group(type, group_id).find_component(id=id, title=title)

    def find_components(self, type, group_id, state=None):
        return self.find_component_group(type, group_id).find_components(state=state)

    def find_component_group(self, type, group_id):
        for component_group in self.find_component_groups(type):
            if component_group.id == group_id:
                return component_group
        return None

    def find_component_groups(self, type, keywords=None):
        if keywords is not None:
            self.search_field.set_value(keywords)

        self.show_component_groups(type)
        self.wait_ready()
        return [WiringComponentGroupTester(self.testcase, e, type) for e in self.component_list.find_elements_by_css_selector(".we-component-group")]

    def has_components(self, type=None):
        if type is None:
            return self.has_components('operator') or self.has_components('widget')
        for component_group in self.find_component_groups(type):
            if component_group.has_components():
                return True
        return False

    def show_component_groups(self, type):
        WebDriverWait(self.testcase.driver, timeout=5).until(WEC.element_be_still(self.element))
        ButtonTester(self.testcase, self.element.find_element_by_css_selector(".btn-list-%s-group" % (type,))).click()
        return self

    def wait_ready(self, timeout=10):
        WebDriverWait(self.testcase.driver, timeout).until(lambda driver: 'disabled' not in self.component_list.get_attribute('class').split())
        time.sleep(0.1)


class WiringViewTester(BaseWiringViewTester):

    def __enter__(self):
        self.testcase.find_navbar_button("wc-show-wiring-button", wait=True).click()
        self.testcase.wait_element_visible('.wc-body:not(.se-on-transition)')
        if self.expect_error is False:
            WebDriverWait(self.testcase.driver, timeout=5).until(lambda driver: self.testcase.get_current_view() == 'wiring' and not self.disabled)
        return self

    def __exit__(self, type, value, traceback):
        if self.expect_error is False or self.testcase.get_current_view() == 'wiring':
            self.btn_back.click()
            WebDriverWait(self.testcase.driver, timeout=5).until(lambda driver: self.testcase.get_current_view() == 'workspace')
        self.expect_error = False

    @property
    def behaviour_sidebar(self):
        return WiringBehaviourSidebarTester(self.testcase)

    @property
    def component_sidebar(self):
        return WiringComponentSidebarTester(self.testcase)

    @property
    def disabled(self):
        return 'disabled' in self.testcase.driver.find_element_by_css_selector(".wc-workspace-wiring").get_attribute('class').split()

    def select(self, components=(), key=Keys.CONTROL):
        actions = ActionChains(self.testcase.driver)
        for component in components:
            actions.key_down(key).click(component.element)
        actions.perform()
        ActionChains(self.testcase.driver).key_up(key).perform()
        return self
