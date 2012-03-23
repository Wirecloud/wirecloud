# -*- coding: utf-8 -*-


import time

from commons.test import WirecloudSeleniumTestCase

__test__ = False


class CatalogueSeleniumTests(WirecloudSeleniumTestCase):

    __test__ = True

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
