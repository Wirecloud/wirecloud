# -*- coding: utf-8 -*-

import os
import time

from django.conf import settings
from django.core.cache import cache
try:
    from djangosanetesting.cases import HttpTestCase
except:
    class HttpTestCase(object):
        pass
from django.utils.importlib import import_module
from django.test import TestCase
from django.utils import translation
from selenium.common.exceptions import NoSuchElementException, ElementNotVisibleException
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait


class LocalizedTestCase(TestCase):

    def setUp(self):
        self.old_LANGUAGES = settings.LANGUAGES
        self.old_LANGUAGE_CODE = settings.LANGUAGE_CODE
        settings.LANGUAGES = (('en', 'English'), ('es', 'Spanish'))
        self.changeLanguage('en')

    def changeLanguage(self, new_language):
        settings.LANGUAGE_CODE = new_language
        translation.activate(new_language)

    def tearDown(self):
        settings.LANGUAGES = self.old_LANGUAGES
        settings.LANGUAGE_CODE = self.old_LANGUAGE_CODE


class WirecloudSeleniumTestCase(HttpTestCase):

    fixtures = ['extra_data', 'selenium_test_data']
    __test__ = False

    def setUp(self):
        super(WirecloudSeleniumTestCase, self).setUp()
        cache.clear()

        # Load webdriver
        module_name, klass_name = getattr(self, '_webdriver_class', 'selenium.webdriver.Firefox').rsplit('.', 1)
        module = import_module(module_name)
        webdriver_args = getattr(self, '_webdriver_args', None)
        if webdriver_args is None:
            webdriver_args = {}
        self.driver = getattr(module, klass_name)(**webdriver_args)

        # initialize
        self.wgt_dir = os.path.join(settings.BASEDIR, '..', 'tests', 'ezweb-data')

    def wait_wirecloud_ready(self, start_timeout=5, timeout=60):

        WebDriverWait(self.driver, start_timeout).until(lambda driver: driver.find_element_by_xpath(r'//*[@id="loading-window" and (@class="" or @class="fadding")]'))
        WebDriverWait(self.driver, timeout).until(lambda driver: driver.find_element_by_css_selector('#loading-window.fadding'))

        try:
            self.driver.find_element_by_id('loading-message').click()
        except ElementNotVisibleException:
            pass

    def login(self, username='admin', password='admin'):
        self.driver.get(self.get_live_server_url() + "accounts/login/?next=/")
        self.driver.find_element_by_xpath('//*[@id="id_username"]').clear()
        self.driver.find_element_by_xpath('//*[@id="id_username"]').send_keys(username)
        self.driver.find_element_by_xpath('//*[@id="id_password"]').clear()
        self.driver.find_element_by_xpath('//*[@id="id_password"]').send_keys(password)
        self.driver.find_element_by_xpath('//*[@id="submit"]').click()
        self.wait_wirecloud_ready()

    def get_current_view(self):

        current_view_menu_entry = self.driver.find_element_by_css_selector('#wirecloud_header .menu > .selected')
        return current_view_menu_entry.get_attribute('class').split(' ')[0]

    def change_main_view(self, view_name):

        if self.get_current_view() != view_name:
            self.driver.find_element_by_css_selector("#wirecloud_header .menu ." + view_name).click()

    def click_submenu_item(self, item_text):
        submenu_items = self.driver.find_elements_by_css_selector('#wirecloud_header .submenu span')
        for submenu_item in submenu_items:
            if submenu_item.text == item_text:
                submenu_item.click()
                return

    def add_wgt_gadget_to_catalogue(self, wgt_file, gadget_name):

        self.change_main_view('marketplace')
        self.click_submenu_item('publish')
        time.sleep(1)

        self.driver.find_element_by_id('wgt_file').send_keys(self.wgt_dir + os.sep + wgt_file)
        self.driver.find_element_by_id('upload_wgt_button').click()

        self.wait_wirecloud_ready()
        time.sleep(2)

        self.search_gadget(gadget_name)
        gadget = self.search_in_catalogue_results(gadget_name)
        self.assertIsNotNone(gadget)
        return gadget

    def search_gadget(self, keyword):
        search_input = self.driver.find_element_by_css_selector('#simple_search input')
        search_input.clear()
        search_input.send_keys(keyword + Keys.ENTER)

        # TODO
        time.sleep(2)

    def search_in_catalogue_results(self, gadget_name):

        resources = self.driver.find_elements_by_css_selector('.resource_list .resource')
        for resource in resources:
            resource_name = resource.find_element_by_css_selector('.resource_name')
            if resource_name.text == gadget_name:
                return resource

        return None

    def instanciate(self, resource):
        resource.find_element_by_css_selector('.instanciate_button').click()

        # TODO
        time.sleep(2)

    def add_widget_to_mashup(self, gadget_name):

        self.change_main_view('marketplace')
        self.search_gadget(gadget_name)
        resource = self.search_in_catalogue_results(gadget_name)
        self.instanciate(resource)

    def count_iwidgets(self):
        return len(self.driver.find_elements_by_css_selector('object'))

    def get_popup_menu_item(self, item_name):

        items = self.driver.find_elements_by_css_selector('.popup_menu > .menu_item')
        for item in items:
            span = item.find_element_by_css_selector('span')
            if span and span.text == item_name:
                return item

        return None

    def popup_menu_click(self, item_name):

        item = self.get_popup_menu_item(item_name)
        item.click()

    def get_current_workspace_name(self):

        self.change_main_view('workspace')
        return self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').text

    def get_workspace_tab_by_name(self, tab_name):

        tabs = self.driver.find_elements_by_css_selector('.notebook.workspace .tab')
        for tab in tabs:
            span = tab.find_element_by_css_selector('span')
            if span.text == tab_name:
                return tab

        return None

    def create_workspace(self, workspace_name):
        self.change_main_view('workspace')
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').click()
        self.popup_menu_click('New workspace')

        workspace_name_input = self.driver.find_element_by_css_selector('.window_menu .window_content input')
        workspace_name_input.clear()
        workspace_name_input.send_keys(workspace_name)
        self.driver.find_element_by_xpath("//div[contains(@class, 'window_menu')]//button[text()='Create']").click()

        self.wait_wirecloud_ready()
        time.sleep(0.5) # work around race condition
        self.assertEqual(self.get_current_workspace_name(), workspace_name)

    def rename_workspace(self, workspace_name):
        self.change_main_view('workspace')
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').click()
        self.popup_menu_click('Rename')

        workspace_name_input = self.driver.find_element_by_css_selector('.window_menu .window_content input')
        workspace_name_input.clear()
        workspace_name_input.send_keys(workspace_name)
        self.driver.find_element_by_xpath("//div[contains(@class, 'window_menu')]//button[text()='Accept']").click()

        self.wait_wirecloud_ready()
        time.sleep(0.5) # work around race condition
        self.assertEqual(self.get_current_workspace_name(), workspace_name)

    def remove_workspace(self):
        self.change_main_view('workspace')
        workspace_to_remove = self.get_current_workspace_name()

        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').click()
        self.popup_menu_click('Remove')

        self.driver.find_element_by_xpath("//div[contains(@class, 'window_menu')]//button[text()='Yes']").click()

        self.wait_wirecloud_ready()
        self.assertNotEqual(workspace_to_remove, self.get_current_workspace_name())

    def is_element_present(self, how, what):
        try:
            self.driver.find_element(by=how, value=what)
        except NoSuchElementException:
            return False
        return True

    def tearDown(self):
        self.driver.quit()
        super(WirecloudSeleniumTestCase, self).tearDown()


browsers = getattr(settings, 'WIRECLOUD_SELENIUM_BROWSER_COMMANDS', {
    'Firefox': {
        'CLASS': 'selenium.webdriver.Firefox',
    },
    'GoogleChrome': {
        'CLASS': 'selenium.webdriver.Chrome',
    },
})

def build_selenium_test_cases(classes, namespace):
    for class_name in classes:
        for browser_name in browsers:
            browser = browsers[browser_name]

            module_name, klass_name = class_name.rsplit('.', 1)
            tests_class_name = browser_name + klass_name
            module = import_module(module_name)
            klass_instance = getattr(module, klass_name)

            namespace[tests_class_name] = type(
                tests_class_name,
                (klass_instance,),
                {
                    '__test__': True,
                    '_webdriver_class': browser['CLASS'],
                    '_webdriver_args': browser.get('ARGS', None),
                }
            )
build_selenium_test_cases.__test__ = False
