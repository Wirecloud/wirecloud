# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

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
from shutil import rmtree
import stat
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

from commons import http_utils
from wirecloud.widget import utils as showcase
from catalogue import utils as catalogue
from wirecloudcommons.utils.wgt import WgtDeployer, WgtFile


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
            rmtree(fullname, ignore_errors=True)
        else:
            try:
                os.remove(fullname)
            except os.error:
                pass


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

    def set_live_server(self, host, port):
        self._live_netloc = host + ':' + str(port)

    def __call__(self, url, *args, **kwargs):
        parsed_url = urlparse(url)

        if parsed_url.scheme == 'file':
            f = codecs.open(parsed_url.path, 'rb')
            contents = f.read()
            f.close()
            return contents

        if parsed_url.netloc == self._live_netloc:
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


class widget_operation:

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


def marketplace_loaded(driver):
    try:
        if driver.find_element_by_css_selector('#wirecloud_breadcrum .first_level').text == 'marketplace':
            return driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').text != 'loading'
    except:
        pass

    return False


class WirecloudRemoteTestCase(object):

    def fill_form_input(self, form_input, value):
        # We cannot use send_keys due to http://code.google.com/p/chromedriver/issues/detail?id=35
        self.driver.execute_script('arguments[0].value = arguments[1]', form_input, value)

    def wait_element_visible_by_css_selector(self, selector, timeout=30, element=None):
        if element is None:
            element = self.driver

        WebDriverWait(self.driver, timeout).until(lambda driver: element.find_element_by_css_selector(selector).is_displayed())
        return element.find_element_by_css_selector(selector)

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
        WebDriverWait(self.driver, timeout).until(lambda driver: 'disabled' not in driver.find_element_by_class_name('catalogue').find_element_by_class_name('search_interface').get_attribute('class'))

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

    def add_wgt_widget_to_catalogue(self, wgt_file, widget_name):

        self.change_main_view('marketplace')
        catalogue_base_element = self.get_current_catalogue_base_element()

        self.perform_market_action('Upload')
        time.sleep(2)

        catalogue_base_element.find_element_by_class_name('wgt_file').send_keys(self.wgt_dir + os.sep + wgt_file)
        catalogue_base_element.find_element_by_class_name('upload_wgt_button').click()
        self.wait_wirecloud_ready()

        self.search_resource(widget_name)
        widget = self.search_in_catalogue_results(widget_name)
        self.assertIsNotNone(widget)
        return widget

    def add_template_to_catalogue(self, template_url, resource_name):

        self.change_main_view('marketplace')
        catalogue_base_element = self.get_current_catalogue_base_element()

        self.perform_market_action('Upload')
        WebDriverWait(self.driver, 30).until(lambda driver: catalogue_base_element.find_element_by_css_selector('form.template_submit_form .template_uri').is_displayed())
        time.sleep(0.1)

        template_input = catalogue_base_element.find_element_by_css_selector('form.template_submit_form .template_uri')
        self.fill_form_input(template_input, template_url)
        catalogue_base_element.find_element_by_class_name('submit_link').click()
        self.wait_wirecloud_ready()

        self.search_resource(resource_name)
        resource = self.search_in_catalogue_results(resource_name)
        self.assertIsNotNone(resource)
        return resource

    def add_template_to_catalogue_with_error(self, template_url, resource_name, msg):

        self.change_main_view('marketplace')
        catalogue_base_element = self.get_current_catalogue_base_element()

        self.perform_market_action('Upload')
        WebDriverWait(self.driver, 30).until(lambda driver: catalogue_base_element.find_element_by_css_selector('form.template_submit_form .template_uri').is_displayed())
        time.sleep(0.1)

        template_input = catalogue_base_element.find_element_by_css_selector('form.template_submit_form .template_uri')
        self.fill_form_input(template_input, template_url)
        catalogue_base_element.find_element_by_class_name('submit_link').click()

        self.wait_wirecloud_ready()
        time.sleep(0.1)
        xpath = "//*[contains(@class, 'window_menu')]//*[text()='Error adding resource from URL: " + msg + "']"
        self.driver.find_element_by_xpath(xpath)
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

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

    def instantiate(self, resource):
        old_iwidget_ids = [iwidget.id for iwidget in self.driver.find_elements_by_css_selector('div.iwidget')]
        old_iwidget_count = len(old_iwidget_ids)
        resource.find_element_by_css_selector('.instantiate_button div').click()

        # TODO
        time.sleep(2)

        iwidgets = self.driver.find_elements_by_css_selector('div.iwidget')
        iwidget_count = len(iwidgets)
        self.assertEquals(iwidget_count, old_iwidget_count + 1)

        for iwidget in iwidgets:
            if iwidget.id not in old_iwidget_ids:
                return iwidget

    def add_widget_to_mashup(self, widget_name, market=None, new_name=None):

        self.change_main_view('marketplace')
        if market is not None:
            self.change_marketplace(market)

        self.search_resource(widget_name)
        resource = self.search_in_catalogue_results(widget_name)
        iwidget = self.instantiate(resource)

        if new_name is not None:
            self.wait_element_visible_by_css_selector('.widget_menu > span', element=iwidget).click()
            name_input = iwidget.find_element_by_css_selector('.widget_menu > input.iwidget_name')
            self.fill_form_input(name_input, new_name)
            time.sleep(0.1)
            iwidget.find_element_by_css_selector('.statusBar').click()

    def create_workspace_from_catalogue(self, mashup_name):

        self.change_main_view('marketplace')
        self.search_resource(mashup_name)
        resource = self.search_in_catalogue_results(mashup_name)

        resource.find_element_by_css_selector('.instantiate_button div').click()
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='New Workspace']").click()
        self.wait_wirecloud_ready()
        self.assertTrue(self.get_current_workspace_name().startswith('Test Mashup'), 'Invalid workspace name after creating workspace from catalogue')

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
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.popup_menu_click('New workspace')

        workspace_name_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input')
        self.fill_form_input(workspace_name_input, workspace_name)
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        self.wait_wirecloud_ready()
        time.sleep(0.5)  # work around race condition
        self.assertEqual(self.get_current_workspace_name(), workspace_name)

    def rename_workspace(self, workspace_name):
        self.change_main_view('workspace')
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.popup_menu_click('Rename')

        workspace_name_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input')
        self.fill_form_input(workspace_name_input, workspace_name)
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

        self.wait_wirecloud_ready()
        time.sleep(0.5)  # work around race condition
        self.assertEqual(self.get_current_workspace_name(), workspace_name)

    def remove_workspace(self):
        self.change_main_view('workspace')
        workspace_to_remove = self.get_current_workspace_name()

        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.popup_menu_click('Remove')

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']").click()

        self.wait_wirecloud_ready()
        self.assertNotEqual(workspace_to_remove, self.get_current_workspace_name())

    def publish_workspace(self, info):
        self.change_main_view('workspace')

        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.popup_menu_click('Publish')

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

    def delete_resource(self, widget_name, timeout=30):
        self.change_main_view('marketplace')
        catalogue_base_element = self.get_current_catalogue_base_element()

        self.search_resource(widget_name)
        resource = self.search_in_catalogue_results(widget_name)
        resource.find_element_by_css_selector('.click_for_details').click()

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

        self.search_resource(widget_name)
        resource = self.search_in_catalogue_results(widget_name)
        self.assertIsNone(resource)


class WirecloudSeleniumTestCase(LiveServerTestCase, WirecloudRemoteTestCase):

    fixtures = ('selenium_test_data',)
    __test__ = False

    @classmethod
    def setUpClass(cls):

        cls.wgt_dir = os.path.join(os.path.dirname(__file__), 'test-data')

        cls.old_LANGUAGES = settings.LANGUAGES
        cls.old_LANGUAGE_CODE = settings.LANGUAGE_CODE
        cls.old_DEFAULT_LANGUAGE = settings.DEFAULT_LANGUAGE
        settings.LANGUAGES = (('en', 'English'),)
        settings.LANGUAGE_CODE = 'en'
        settings.DEFAULT_LANGUAGE = 'en'

        # downloader
        cls._original_download_function = http_utils.download_http_content
        http_utils.download_http_content = LocalDownloader(getattr(cls, 'servers', {
            'http': {
                'localhost:8001': os.path.join(os.path.dirname(__file__), 'test-data', 'src'),
            },
        }))

        # Load webdriver
        module_name, klass_name = getattr(cls, '_webdriver_class', 'selenium.webdriver.Firefox').rsplit('.', 1)
        module = import_module(module_name)
        webdriver_args = getattr(cls, '_webdriver_args', None)
        if webdriver_args is None:
            webdriver_args = {}
        cls.driver = getattr(module, klass_name)(**webdriver_args)

        # catalogue deployer
        cls.old_catalogue_deployer = catalogue.wgt_deployer
        cls.catalogue_tmp_dir = mkdtemp()
        catalogue.wgt_deployer = WgtDeployer(cls.catalogue_tmp_dir)

        # showcase deployer
        cls.old_deployer = showcase.wgt_deployer
        cls.tmp_dir = mkdtemp()
        showcase.wgt_deployer = WgtDeployer(cls.tmp_dir)

        super(WirecloudSeleniumTestCase, cls).setUpClass()

        http_utils.download_http_content.set_live_server(cls.server_thread.host, cls.server_thread.port)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

        http_utils.download_http_content = cls._original_download_function
        catalogue.wgt_deployer = cls.old_catalogue_deployer
        rmtree(cls.catalogue_tmp_dir, ignore_errors=True)
        showcase.wgt_deployer = cls.old_deployer
        rmtree(cls.tmp_dir, ignore_errors=True)

        settings.LANGUAGES = cls.old_LANGUAGES
        settings.LANGUAGE_CODE = cls.old_LANGUAGE_CODE
        settings.DEFAULT_LANGUAGE = cls.old_DEFAULT_LANGUAGE

        super(WirecloudSeleniumTestCase, cls).tearDownClass()

    def setUp(self):
        wgt_file = WgtFile(os.path.join(self.wgt_dir, 'Wirecloud_Test_1.0.wgt'))
        showcase.create_widget_from_wgt(wgt_file, None, deploy_only=True)

        cache.clear()
        super(WirecloudSeleniumTestCase, self).setUp()

    def tearDown(self):
        cleartree(self.tmp_dir)
        cleartree(self.catalogue_tmp_dir)

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
