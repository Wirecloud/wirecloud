# -*- coding: utf-8 -*-


import time
from shutil import rmtree
from tempfile import mkdtemp

from django.conf import settings

import catalogue.utils
from commons.test import WirecloudSeleniumTestCase
from commons.wgt import WgtDeployer

__test__ = False


class CatalogueSeleniumTests(WirecloudSeleniumTestCase):

    __test__ = True

    def setUp(self):

        self.old_CATALOGUE_MEDIA_ROOT = settings.CATALOGUE_MEDIA_ROOT
        settings.CATALOGUE_MEDIA_ROOT = mkdtemp()
        self.old_deployer = catalogue.utils.wgt_deployer
        catalogue.utils.wgt_deployer = WgtDeployer(settings.CATALOGUE_MEDIA_ROOT)

        super(CatalogueSeleniumTests, self).setUp()

    def tearDown(self):
        rmtree(settings.CATALOGUE_MEDIA_ROOT, ignore_errors=True)
        settings.CATALOGUE_MEDIA_ROOT = self.old_CATALOGUE_MEDIA_ROOT
        catalogue.utils.wgt_deployer = self.old_deployer

        super(CatalogueSeleniumTests, self).tearDown()

    def test_add_gadget_to_catalog_wgt(self):
        driver = self.driver

        self.login()

        self.change_main_view("marketplace")
        time.sleep(3)

        self.add_wgt_gadget_to_catalogue('Morfeo_Calendar_Viewer.wgt', 'Calendar Viewer')
        self.add_wgt_gadget_to_catalogue('Morfeo_Cliente_Correo.wgt', 'Cliente Correo')
        self.add_wgt_gadget_to_catalogue('Morfeo_FeedList.wgt', 'FeedList')
        self.add_wgt_gadget_to_catalogue('Morfeo_FeedReader.wgt', 'FeedReader')

        driver.get(self.get_live_server_url() + "admin/")
        driver.find_element_by_link_text("Catalogue resources").click()
        driver.find_element_by_link_text("Calendar Viewer").click()
        driver.find_element_by_link_text("Delete").click()
        driver.find_element_by_xpath("//input[@value=\"Yes, I'm sure\"]").click()
        driver.find_element_by_link_text("Cliente Correo").click()
        driver.find_element_by_link_text("Delete").click()
        driver.find_element_by_xpath("//input[@value=\"Yes, I'm sure\"]").click()
        driver.find_element_by_link_text("FeedList").click()
        driver.find_element_by_link_text("Delete").click()
        driver.find_element_by_xpath("//input[@value=\"Yes, I'm sure\"]").click()
        driver.find_element_by_link_text("FeedReader").click()
        driver.find_element_by_link_text("Delete").click()
        driver.find_element_by_xpath("//input[@value=\"Yes, I'm sure\"]").click()
        driver.find_element_by_link_text("Log out").click()
