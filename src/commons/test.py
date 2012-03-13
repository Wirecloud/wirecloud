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
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException


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

    def wait_wirecloud_ready(self):

        for i in range(60):
            try:
                if self.is_element_present(By.XPATH, r'//*[@id="loading-window" and @class="fadding"]'):
                    break
            except:
                pass
            time.sleep(1)
        else:
            self.fail("time out")

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
        self.driver.implicitly_wait(30)
        self.wgt_dir = os.path.join(settings.BASEDIR, '..', 'tests', 'ezweb-data')

    def login(self, username='admin', password='admin'):
        self.driver.get(self.get_live_server_url() + "accounts/login/?next=/")
        self.driver.find_element_by_xpath('//*[@id="id_username"]').clear()
        self.driver.find_element_by_xpath('//*[@id="id_username"]').send_keys('admin')
        self.driver.find_element_by_xpath('//*[@id="id_password"]').clear()
        self.driver.find_element_by_xpath('//*[@id="id_password"]').send_keys('admin')
        self.driver.find_element_by_xpath('//*[@id="submit"]').click()
        self.wait_wirecloud_ready()

    def change_main_view(self, view_name):
        self.driver.find_element_by_css_selector("#wirecloud_header .menu ." + view_name).click()

    def add_wgt_gadget_to_catalogue(self, wgt_file, gadget_name):
        self.driver.find_element_by_xpath('//*[@id="developers_button_toolbar"]').click()

        self.driver.find_element_by_xpath('//*[@id="gadget_uri"]').send_keys(self.wgt_dir + os.sep + wgt_file)
        self.driver.find_element_by_xpath('//*[@id="gadget_link"]').click()

        self.wait_wirecloud_ready()
        time.sleep(2)

        gadget = self.search_in_catalogue_results(gadget_name)
        self.assertIsNotNone(gadget)
        return gadget

    def search_gadget(self, keyword):
        search_input = self.driver.find_element_by_css_selector('#simple_search input')
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

    def add_gadget_to_mashup(self, gadget_name):

        self.change_main_view('marketplace')
        self.search_gadget(gadget_name)
        resource = self.search_in_catalogue_results(gadget_name)
        self.instanciate(resource)

    def is_element_present(self, how, what):
        try:
            self.driver.find_element(by=how, value=what)
        except NoSuchElementException:
            return False
        return True

    def tearDown(self):
        self.driver.quit()
        super(WirecloudSeleniumTestCase, self).tearDown()
