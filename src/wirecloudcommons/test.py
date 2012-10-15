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
from django.utils import translation
from selenium.webdriver.support.ui import WebDriverWait

from commons import http_utils
from wirecloud.widget import utils as showcase
from wirecloudcommons.utils.wgt import WgtDeployer, WgtFile


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

    def __call__(self, url, *args, **kwargs):
        parsed_url = urlparse(url)

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
    if driver.find_element_by_css_selector('#wirecloud_breadcrum .first_level').text == 'marketplace':
        return driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level').text != 'loading'
    else:
        return False


class WirecloudSeleniumTestCase(LiveServerTestCase):

    fixtures = ('selenium_test_data',)
    __test__ = False

    @classmethod
    def setUpClass(cls):

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

        # initialize
        cls.wgt_dir = os.path.join(os.path.dirname(__file__), 'test-data')
        cls.old_deployer = showcase.wgt_deployer
        cls.tmp_dir = mkdtemp()
        showcase.wgt_deployer = WgtDeployer(cls.tmp_dir)
        wgt_file = WgtFile(os.path.join(cls.wgt_dir, 'Wirecloud_Test_1.0.wgt'))
        showcase.create_widget_from_wgt(wgt_file, None, deploy_only=True)

        super(WirecloudSeleniumTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):
        rmtree(cls.tmp_dir, ignore_errors=True)

        cls.driver.quit()

        http_utils.download_http_content = cls._original_download_function

        settings.LANGUAGES = cls.old_LANGUAGES
        settings.LANGUAGE_CODE = cls.old_LANGUAGE_CODE
        settings.DEFAULT_LANGUAGE = cls.old_DEFAULT_LANGUAGE

        super(WirecloudSeleniumTestCase, cls).tearDownClass()

    def setUp(self):
        showcase.wgt_deployer = WgtDeployer(self.tmp_dir)
        cache.clear()
        super(WirecloudSeleniumTestCase, self).setUp()

    def tearDown(self):
        showcase.wgt_deployer = self.old_deployer
        super(WirecloudSeleniumTestCase, self).tearDown()

    def fill_form_input(self, form_input, value):
        # We cannot use send_keys due to http://code.google.com/p/chromedriver/issues/detail?id=35
        self.driver.execute_script('arguments[0].value = arguments[1]', form_input, value)

    def wait_wirecloud_ready(self, start_timeout=30, timeout=30):

        WebDriverWait(self.driver, start_timeout).until(lambda driver: driver.find_element_by_xpath(r'//*[@id="loading-window" and (@class="" or @class="fadding")]'))
        WebDriverWait(self.driver, timeout).until(lambda driver: driver.find_element_by_css_selector('#loading-window.fadding'))

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

    def add_wgt_widget_to_catalogue(self, wgt_file, widget_name):

        self.change_main_view('marketplace')
        WebDriverWait(self.driver, 30).until(marketplace_loaded)
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.popup_menu_click('Upload')
        time.sleep(2)

        self.driver.find_element_by_class_name('wgt_file').send_keys(self.wgt_dir + os.sep + wgt_file)
        self.driver.find_element_by_class_name('upload_wgt_button').click()
        self.wait_wirecloud_ready()

        self.search_resource(widget_name)
        widget = self.search_in_catalogue_results(widget_name)
        self.assertIsNotNone(widget)
        return widget

    def add_template_to_catalogue(self, template_url, resource_name):

        self.change_main_view('marketplace')
        WebDriverWait(self.driver, 30).until(marketplace_loaded)
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.popup_menu_click('Upload')
        WebDriverWait(self.driver, 30).until(lambda driver: driver.find_element_by_css_selector('form.template_submit_form .template_uri').is_displayed())
        time.sleep(0.1)

        template_input = self.driver.find_element_by_css_selector('form.template_submit_form .template_uri')
        self.fill_form_input(template_input, template_url)
        self.driver.find_element_by_class_name('submit_link').click()
        self.wait_wirecloud_ready()

        self.search_resource(resource_name)
        resource = self.search_in_catalogue_results(resource_name)
        self.assertIsNotNone(resource)
        return resource

    def add_template_to_catalogue_with_error(self, template_url, resource_name, msg):

        self.change_main_view('marketplace')
        WebDriverWait(self.driver, 30).until(marketplace_loaded)
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.popup_menu_click('Upload')
        WebDriverWait(self.driver, 30).until(lambda driver: driver.find_element_by_css_selector('form.template_submit_form .template_uri').is_displayed())
        time.sleep(0.1)

        template_input = self.driver.find_element_by_css_selector('form.template_submit_form .template_uri')
        self.fill_form_input(template_input, template_url)
        self.driver.find_element_by_class_name('submit_link').click()

        self.wait_wirecloud_ready()
        time.sleep(0.1)
        xpath = "//*[contains(@class, 'window_menu')]//*[text()='Error adding resource from URL: " + msg + "']"
        self.driver.find_element_by_xpath(xpath)
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()

    def search_resource(self, keyword):
        self.wait_catalogue_ready()
        search_input = self.driver.find_element_by_css_selector('.simple_search_text')
        self.fill_form_input(search_input, keyword)
        self.driver.execute_script('''
            var evt = document.createEvent("KeyboardEvent");
            if (evt.initKeyEvent != null) {
                evt.initKeyEvent ("keypress", true, true, window, false, false, false, false, 13, 0);
            } else {
                evt.initKeyboardEvent ("keypress", true, true, window, 0, 0, 0, 0, 0, 13);
            }
            arguments[0].dispatchEvent(evt);
        ''', search_input)

        self.wait_catalogue_ready()

    def search_in_catalogue_results(self, widget_name):

        self.wait_catalogue_ready()
        resources = self.driver.find_elements_by_css_selector('.resource_list .resource')
        for resource in resources:
            resource_name = resource.find_element_by_css_selector('.resource_name')
            if resource_name.text == widget_name:
                return resource

        return None

    def instantiate(self, resource):
        old_iwidget_count = self.count_iwidgets()
        resource.find_element_by_css_selector('.instantiate_button div').click()

        # TODO
        time.sleep(2)

        iwidget_count = self.count_iwidgets()
        self.assertEquals(iwidget_count, old_iwidget_count + 1)

    def add_widget_to_mashup(self, widget_name):

        self.change_main_view('marketplace')
        WebDriverWait(self.driver, 30).until(marketplace_loaded)
        self.search_resource(widget_name)
        resource = self.search_in_catalogue_results(widget_name)
        self.instantiate(resource)

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

        tabs = self.driver.find_elements_by_css_selector('.notebook.workspace .tab')
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

    def add_tab(self):

        old_tab_count = len(self.driver.find_elements_by_css_selector('#workspace .tab_wrapper .tab'))

        self.change_main_view('workspace')
        self.driver.find_element_by_css_selector('#workspace .tab_wrapper .icon-add-tab').click()
        self.wait_wirecloud_ready()

        new_tab_count = len(self.driver.find_elements_by_css_selector('#workspace .tab_wrapper .tab'))
        self.assertEqual(new_tab_count, old_tab_count + 1)

        return self.driver.find_elements_by_css_selector('#workspace .tab_wrapper .tab')[-1]

    def add_marketplace(self, name, url, type_):

        self.change_main_view('marketplace')
        WebDriverWait(self.driver, 30).until(marketplace_loaded)
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.popup_menu_click("Add new marketplace")

        market_name_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input[name="label"]')
        self.fill_form_input(market_name_input, name)
        market_url_input = self.driver.find_element_by_css_selector('.window_menu .styled_form input[name="url"]')
        self.fill_form_input(market_url_input, url)
        market_type_input = self.driver.find_element_by_css_selector('.window_menu .styled_form select')
        self.fill_form_input(market_type_input, type_)

        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Accept']").click()
        self.wait_wirecloud_ready()

    def delete_marketplace(self, market):

        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.popup_menu_click(market)
        time.sleep(2)

        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.popup_menu_click("Delete marketplace")
        self.driver.find_element_by_xpath("//*[contains(@class, 'window_menu')]//*[text()='Yes']").click()

    def delete_widget(self, widget_name, timeout=30):
        self.change_main_view('marketplace')
        self.search_resource(widget_name)
        resource = self.search_in_catalogue_results(widget_name)
        resource.find_element_by_css_selector('.click_for_details').click()

        WebDriverWait(self.driver, timeout).until(lambda driver: driver.find_element_by_css_selector('.advanced_operations').is_displayed())
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
