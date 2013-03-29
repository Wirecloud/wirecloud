# -*- coding: utf-8 -*-

# Copyright 2012-2013 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.


import os
import codecs
import shutil
import stat
import sys
from tempfile import mkdtemp
import time
from urllib2 import URLError, HTTPError
from urlparse import urlparse

from django.conf import settings
from django.core.cache import cache
from django.core.urlresolvers import reverse
try:
    from django.test import LiveServerTestCase
except:
    class LiveServerTestCase(object):
        pass
from django.utils.importlib import import_module
from django.test import TransactionTestCase
from django.test.client import Client
from django.utils import translation
from selenium.webdriver.support.ui import WebDriverWait

from wirecloud.platform.localcatalogue.utils import install_resource_to_all_users
from wirecloud.platform.widget import utils as showcase
from wirecloud.proxy.tests import FakeDownloader as ProxyFakeDownloader
from wirecloud.proxy.views import WIRECLOUD_PROXY
from wirecloud.catalogue import utils as catalogue
from wirecloud.commons.utils import downloader
from wirecloud.commons.utils.wgt import WgtDeployer, WgtFile


def cleartree(path):

    if os.path.islink(path):
        # symlinks to directories are forbidden, see bug #1669
        raise OSError("Cannot call cleartree on a symbolic link")

    names = []
    try:
        names = os.listdir(path)
    except os.error:
        pass

    for name in names:
        fullname = os.path.join(path, name)
        try:
            mode = os.lstat(fullname).st_mode
        except os.error:
            mode = 0
        if stat.S_ISDIR(mode):
            shutil.rmtree(fullname, ignore_errors=True)
        else:
            try:
                os.remove(fullname)
            except os.error:
                pass


def restoretree(backup_path, dest_path):
    cleartree(dest_path)

    names = []
    try:
        names = os.listdir(backup_path)
    except os.error:
        pass

    for name in names:
        srcname = os.path.join(backup_path, name)
        dstname = os.path.join(dest_path, name)

        try:
            mode = os.lstat(srcname).st_mode
        except os.error:
            mode = 0

        if stat.S_ISDIR(mode):
            shutil.copytree(srcname, dstname)
        else:
            shutil.copy2(srcname, dstname)


class FakeDownloader(object):

    def __init__(self):
        self.reset()

    def reset(self):
        self._responses = {}
        self._exceptions = {}

    def set_response(self, url, response):
        self._responses[url] = response

    def set_exception(self, url, exception):
        self._exceptions[url] = exception

    def set_http_error(self, url):
        self.set_exception(url, HTTPError('url', '404', 'Not Found', None, None))

    def set_url_error(self, url):
        self.set_exception(url, URLError('not valid'))

    def __call__(self, *args, **kwargs):
        url = args[0]

        if url in self._exceptions:
            raise self._exceptions[url]

        if url in self._responses:
            return self._responses[url]
        else:
            raise HTTPError('url', '404', 'Not Found', None, None)


class LocalDownloader(object):

    def __init__(self, servers):
        self._servers = servers
        self._client = Client()
        self._live_netloc = None

    def set_live_server(self, host, port):
        self._live_netloc = host + ':' + str(port)

    def __call__(self, url, *args, **kwargs):
        parsed_url = urlparse(url)

        if parsed_url.scheme == 'file':
            f = codecs.open(parsed_url.path, 'rb')
            contents = f.read()
            f.close()
            return contents

        if self._live_netloc is not None and parsed_url.netloc == self._live_netloc:
            return self._client.get(url).content

        if parsed_url.scheme not in self._servers or parsed_url.netloc not in self._servers[parsed_url.scheme]:
            raise URLError('not valid')

        base_path = self._servers[parsed_url.scheme][parsed_url.netloc]
        final_path = os.path.normpath(os.path.join(base_path, parsed_url.path[1:]))

        if final_path.startswith(base_path) and os.path.isfile(final_path):
            f = codecs.open(final_path, 'rb')
            contents = f.read()
            f.close()

            return contents
        else:
            raise HTTPError('url', '404', 'Not Found', None, None)


class WirecloudTestCase(TransactionTestCase):

    @classmethod
    def setUpClass(cls):

        cls.old_LANGUAGES = settings.LANGUAGES
        cls.old_LANGUAGE_CODE = settings.LANGUAGE_CODE
        cls.old_DEFAULT_LANGUAGE = settings.DEFAULT_LANGUAGE
        settings.LANGUAGES = (('en', 'English'),)
        settings.LANGUAGE_CODE = 'en'
        settings.DEFAULT_LANGUAGE = 'en'

        cls.shared_test_data_dir = os.path.join(os.path.dirname(__file__), 'test-data')

        super(WirecloudTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):
        settings.LANGUAGES = cls.old_LANGUAGES
        settings.LANGUAGE_CODE = cls.old_LANGUAGE_CODE
        settings.DEFAULT_LANGUAGE = cls.old_DEFAULT_LANGUAGE

        super(WirecloudTestCase, cls).tearDownClass()


class LocalizedTestCase(TransactionTestCase):

    @classmethod
    def setUpClass(cls):

        cls.old_LANGUAGES = settings.LANGUAGES
        cls.old_LANGUAGE_CODE = settings.LANGUAGE_CODE
        cls.old_DEFAULT_LANGUAGE = settings.DEFAULT_LANGUAGE
        settings.LANGUAGES = (('en', 'English'), ('es', 'Spanish'))

        super(LocalizedTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):
        settings.LANGUAGES = cls.old_LANGUAGES
        settings.LANGUAGE_CODE = cls.old_LANGUAGE_CODE
        settings.DEFAULT_LANGUAGE = cls.old_DEFAULT_LANGUAGE

        super(LocalizedTestCase, cls).tearDownClass()

    def setUp(self):
        super(LocalizedTestCase, self).setUp()

        self.changeLanguage('en')

    def changeLanguage(self, new_language):
        settings.LANGUAGE_CODE = new_language
        settings.DEFAULT_LANGUAGE = new_language
        translation.activate(new_language)


class iwidget_context:

    def __init__(self, driver, widget):
        self.driver = driver
        self.widget = widget

    def __enter__(self):
        self.driver.execute_script('return opManager.activeWorkspace.getIWidget(%d).content.setAttribute("id", "targetframe");' % self.widget)

        # TODO work around webdriver bugs
        self.driver.switch_to_default_content()

        self.driver.switch_to_frame(self.driver.find_element_by_id('targetframe'))
        return None

    def __exit__(self, type, value, traceback):
        self.driver.switch_to_frame(None)
        self.driver.execute_script('return opManager.activeWorkspace.getIWidget(%d).content.removeAttribute("id");' % self.widget)

        # TODO work around webdriver bugs
        self.driver.switch_to_default_content()


def uses_extra_resources(resources, shared=False):

    def wrap(test_func):

        def wrapper(self, *args, **kwargs):

            if shared:
                base = self.shared_test_data_dir
            else:
                base = self.test_data_dir

            for resource in resources:
                wgt_file = open(os.path.join(base, resource), 'rb')
                wgt = WgtFile(wgt_file)
                resource = install_resource_to_all_users(file_contents=wgt, packaged=True)
                wgt_file.close()

            return test_func(self, *args, **kwargs)

        wrapper.func_name = test_func.func_name
        return wrapper

    return wrap


def marketplace_loaded(driver):
    try:
        if driver.find_element_by_css_selector('#wirecloud_breadcrum .first_level').text == 'marketplace':
            return driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').text != 'loading'
    except:
        pass

    return False


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

    @property
    def name(self):
        return self.element.find_element_by_css_selector('.widget_menu > span').text

    def rename(self, new_name):

        self.element.find_element_by_css_selector('.icon-cogs').click()
        self.testcase.popup_menu_click('Rename')
        name_input = self['element'].find_element_by_css_selector('.widget_menu > span')
        # We cannot use send_keys due to http://code.google.com/p/chromedriver/issues/detail?id=35
        self.testcase.driver.execute_script('arguments[0].textContent = arguments[1]', name_input, new_name)
        self.element.find_element_by_css_selector('.statusBar').click()

    def remove(self, timeout=30):

        old_iwidget_ids = self.testcase.driver.execute_script('return opManager.activeWorkspace.getIWidgets().map(function(iwidget) {return iwidget.id;});')
        old_iwidget_count = len(old_iwidget_ids)

        self.element.find_element_by_css_selector('.icon-remove').click()

        def iwidget_unloaded(driver):
            iwidgets = self.testcase.get_current_iwidgets()
            iwidget_count = len(iwidgets)
            return iwidget_count == old_iwidget_count - 1

        WebDriverWait(self.testcase.driver, timeout).until(iwidget_unloaded)


class WirecloudRemoteTestCase(object):

    @classmethod
    def setUpClass(cls):

        cls.shared_test_data_dir = os.path.join(os.path.dirname(__file__), 'test-data')
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

    def fill_form_input(self, form_input, value):
        # We cannot use send_keys due to http://code.google.com/p/chromedriver/issues/detail?id=35
        self.driver.execute_script('arguments[0].value = arguments[1]', form_input, value)

    def scroll_and_click(self, element):

        # Work around chromedriver bugs
        if self.driver.capabilities['browserName'] == "chrome":
            try:
                self.driver.execute_script("arguments[0].scrollIntoView(false);", element);
            except:
                pass
        element.click()

    def wait_element_visible_by_css_selector(self, selector, timeout=30, element=None):
        if element is None:
            element = self.driver

        WebDriverWait(self.driver, timeout).until(lambda driver: element.find_element_by_css_selector(selector).is_displayed())
        time.sleep(0.1)
        return element.find_element_by_css_selector(selector)

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

        self.driver.get(self.live_server_url + reverse('login'))
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

        if self.get_current_view() != view_name:
            self.driver.find_element_by_css_selector("#wirecloud_header .menu ." + view_name).click()

            if view_name == 'marketplace':
                WebDriverWait(self.driver, 30).until(marketplace_loaded)

    def check_popup_menu(self, must_be, must_be_absent):

        time.sleep(0.1)

        for item in must_be:
            menu_item = self.get_popup_menu_item(item)
            self.assertIsNotNone(menu_item)

        for item in must_be_absent:
            menu_item = self.get_popup_menu_item(item)
            self.assertIsNone(menu_item)

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

            xpath = "//*[contains(@class, 'window_menu')]//*[text()='The resource could not be added to the catalogue: " + expect_error + "']"
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
        iwidget_elements = self.driver.execute_script('return opManager.activeWorkspace.getIWidgets().map(function(iwidget) {return iwidget.element;});')

        return [IWidgetTester(self, iwidget_ids[i], iwidget_elements[i]) for i in range(len(iwidget_ids))]

    def instantiate(self, resource, timeout=30):

        old_iwidget_ids = self.driver.execute_script('return opManager.activeWorkspace.getIWidgets().map(function(iwidget) {return iwidget.id;});')
        old_iwidget_count = len(old_iwidget_ids)

        self.scroll_and_click(resource.find_element_by_css_selector('.instantiate_button div'))

        tmp = {
            'new_iwidget': None,
        }
        def iwidget_loaded(driver):
            if tmp['new_iwidget'] is not None:
                return tmp['new_iwidget']['element'].is_displayed()

            iwidgets = self.get_current_iwidgets()
            iwidget_count = len(iwidgets)
            if iwidget_count != old_iwidget_count + 1:
                return False

            for iwidget in iwidgets:
                if iwidget['id'] not in old_iwidget_ids:
                    tmp['new_iwidget'] = iwidget

            return tmp['new_iwidget']['element'].is_displayed()

        WebDriverWait(self.driver, timeout).until(iwidget_loaded)
        # TODO firefox
        time.sleep(0.1)
        return tmp['new_iwidget']

    def add_widget_to_mashup(self, widget_name, market=None, new_name=None):

        self.change_main_view('marketplace')
        if market is not None:
            self.change_marketplace(market)

        self.search_resource(widget_name)
        resource = self.search_in_catalogue_results(widget_name)
        iwidget = self.instantiate(resource)

        if new_name is not None:
            iwidget.rename(new_name)

        return iwidget

    def create_workspace_from_catalogue(self, mashup_name):

        self.change_main_view('marketplace')
        self.search_resource(mashup_name)
        resource = self.search_in_catalogue_results(mashup_name)

        resource.find_element_by_css_selector('.instantiate_button div').click()
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='New Workspace']").click()
        self.wait_wirecloud_ready()
        self.assertTrue(self.get_current_workspace_name().startswith(mashup_name), 'Invalid workspace name after creating workspace from catalogue')

    def merge_mashup_from_catalogue(self, mashup_name):

        self.change_main_view('marketplace')
        self.search_resource(mashup_name)
        resource = self.search_in_catalogue_results(mashup_name)

        resource.find_element_by_css_selector('.instantiate_button div').click()
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Current Workspace']").click()
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
        self.popup_menu_click('Publish')

        self.wait_element_visible_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']")
        name_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input[name="name"]')
        self.fill_form_input(name_input, info['name'])
        vendor_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input[name="vendor"]')
        self.fill_form_input(vendor_input, info['vendor'])
        version_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input[name="version"]')
        self.fill_form_input(version_input, info['version'])
        email_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input[name="email"]')
        self.fill_form_input(email_input, info['email'])

        tabs = self.driver.find_elements_by_css_selector('.window_menu .notebook .tab_wrapper .tab')
        for tab in tabs:
            span = tab.find_element_by_css_selector('span')
            if span.text == 'Publish place':
                tab.click()

        self.driver.find_element_by_css_selector('.window_menu .styled_form input[name="local"]').click()

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

    def change_marketplace(self, market):

        self.change_main_view('marketplace')
        self.perform_market_action(market)
        time.sleep(2)
        self.assertEqual(self.get_current_marketplace_name(), market)

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
        self.scroll_and_click(resource.find_element_by_css_selector('.click_for_details'))

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
        self.scroll_and_click(resource.find_element_by_css_selector('.click_for_details'))

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

    def get_iwidget_anchor(self, iwidget, endpoint):
        return self.driver.execute_script('''
            var wiringEditor = LayoutManagerFactory.getInstance().viewsByName["wiring"];
            return LayoutManagerFactory.getInstance().viewsByName["wiring"].iwidgets[%(iwidget)d].getAnchor("%(endpoint)s").wrapperElement;
        ''' % {"iwidget": iwidget, "endpoint": endpoint}
        )


class WirecloudSeleniumTestCase(LiveServerTestCase, WirecloudRemoteTestCase):

    fixtures = ('selenium_test_data',)
    __test__ = False

    @classmethod
    def setUpClass(cls):

        WirecloudRemoteTestCase.setUpClass()

        cls.old_LANGUAGES = settings.LANGUAGES
        cls.old_LANGUAGE_CODE = settings.LANGUAGE_CODE
        cls.old_DEFAULT_LANGUAGE = settings.DEFAULT_LANGUAGE
        settings.LANGUAGES = (('en', 'English'),)
        settings.LANGUAGE_CODE = 'en'
        settings.DEFAULT_LANGUAGE = 'en'

        # downloader
        cls._original_download_function = staticmethod(downloader.download_http_content)
        downloader.download_http_content = LocalDownloader(getattr(cls, 'servers', {
            'http': {
                'localhost:8001': os.path.join(os.path.dirname(__file__), 'test-data', 'src'),
            },
        }))
        cls._original_proxy_do_request_function = WIRECLOUD_PROXY._do_request
        WIRECLOUD_PROXY._do_request = ProxyFakeDownloader()
        WIRECLOUD_PROXY._do_request.set_response('http://example.com/success.html', 'remote makerequest succeded')

        # catalogue deployer
        cls.old_catalogue_deployer = catalogue.wgt_deployer
        cls.catalogue_tmp_dir_backup = mkdtemp()
        cls.catalogue_tmp_dir = mkdtemp()
        catalogue.wgt_deployer = WgtDeployer(cls.catalogue_tmp_dir)

        # showcase deployer
        cls.old_deployer = showcase.wgt_deployer
        cls.localcatalogue_tmp_dir_backup = mkdtemp()
        cls.tmp_dir = mkdtemp()
        showcase.wgt_deployer = WgtDeployer(cls.tmp_dir)

        # deploy resource files
        operator_wgt_file = open(os.path.join(cls.shared_test_data_dir, 'Wirecloud_TestOperator_1.0.zip'), 'rb')
        operator_wgt = WgtFile(operator_wgt_file)
        catalogue.add_widget_from_wgt(operator_wgt_file, None, wgt_file=operator_wgt, deploy_only=True)
        operator_wgt_file.close()

        widget_wgt_file = open(os.path.join(cls.shared_test_data_dir, 'Wirecloud_Test_1.0.wgt'))
        widget_wgt = WgtFile(widget_wgt_file)
        catalogue.add_widget_from_wgt(widget_wgt_file, None, wgt_file=widget_wgt, deploy_only=True)
        showcase.wgt_deployer.deploy(widget_wgt)
        widget_wgt_file.close()

        restoretree(cls.tmp_dir, cls.localcatalogue_tmp_dir_backup)
        restoretree(cls.catalogue_tmp_dir, cls.catalogue_tmp_dir_backup)

        super(WirecloudSeleniumTestCase, cls).setUpClass()

        downloader.download_http_content.set_live_server(cls.server_thread.host, cls.server_thread.port)

    @classmethod
    def tearDownClass(cls):

        WirecloudRemoteTestCase.tearDownClass()

        # downloader
        downloader.download_http_content = cls._original_download_function
        WIRECLOUD_PROXY._do_request = cls._original_proxy_do_request_function

        # deployers
        catalogue.wgt_deployer = cls.old_catalogue_deployer
        shutil.rmtree(cls.catalogue_tmp_dir_backup, ignore_errors=True)
        shutil.rmtree(cls.catalogue_tmp_dir, ignore_errors=True)
        showcase.wgt_deployer = cls.old_deployer
        shutil.rmtree(cls.localcatalogue_tmp_dir_backup, ignore_errors=True)
        shutil.rmtree(cls.tmp_dir, ignore_errors=True)

        settings.LANGUAGES = cls.old_LANGUAGES
        settings.LANGUAGE_CODE = cls.old_LANGUAGE_CODE
        settings.DEFAULT_LANGUAGE = cls.old_DEFAULT_LANGUAGE

        super(WirecloudSeleniumTestCase, cls).tearDownClass()

    def setUp(self):
        restoretree(self.localcatalogue_tmp_dir_backup, self.tmp_dir)
        restoretree(self.catalogue_tmp_dir_backup, self.catalogue_tmp_dir)
        cache.clear()
        super(WirecloudSeleniumTestCase, self).setUp()


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

            if isinstance(class_name, basestring):
                module_name, klass_name = class_name.rsplit('.', 1)
                tests_class_name = browser_name + klass_name
                module = import_module(module_name)
                klass_instance = getattr(module, klass_name)
            else:
                tests_class_name = browser_name + class_name.__name__
                klass_instance = class_name

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
