# -*- coding: utf-8 -*-

from wirecloudcommons.test import WirecloudSeleniumTestCase

__test__ = False


class CatalogueSeleniumTests(WirecloudSeleniumTestCase):

    def test_add_widget_to_catalog_wgt(self):

        self.login()

        self.add_wgt_widget_to_catalogue('Morfeo_Calendar_Viewer.wgt', 'Calendar Viewer')
        self.add_wgt_widget_to_catalogue('Morfeo_Cliente_Correo.wgt', 'Cliente Correo')
        self.add_wgt_widget_to_catalogue('Morfeo_FeedList.wgt', 'Feed List')
        self.add_wgt_widget_to_catalogue('Morfeo_FeedReader.wgt', 'Feed Reader')

    def test_widgets_are_deletable_by_the_uploader(self):

        self.login('normuser', 'admin')

        self.add_wgt_widget_to_catalogue('Morfeo_Calendar_Viewer.wgt', 'Calendar Viewer')
        self.delete_resource('Calendar Viewer')

    def test_reinstall_widget_to_catalog_wgt(self):

        self.login()

        self.delete_resource('Test')
        resource = self.add_wgt_widget_to_catalogue('Wirecloud_Test_1.0.wgt', 'Test')
        self.instantiate(resource)

    def test_add_widget_to_catalogue_xml(self):

        self.login()

        self.add_template_to_catalogue('http://localhost:8001/test/test.xml', 'Test_Selenium')

    def test_add_widget_to_catalogue_rdf(self):

        self.login()

        self.add_template_to_catalogue('http://localhost:8001/test/test.rdf', 'Test_Selenium')

    def test_add_invalid_widget_to_catalogue_rdf(self):

        self.login()

        self.add_template_to_catalogue_with_error('http://localhost:8001/test/invalidTest.rdf', 'Test_Selenium', 'missing required field: versionInfo.')

    def test_add_widget_twice(self):

        self.login()

        self.add_template_to_catalogue('http://localhost:8001/test/test.rdf', 'Test_Selenium')
        self.add_template_to_catalogue_with_error('http://localhost:8001/test/test.rdf', 'Test_Selenium', 'Resource already exists.')

    def test_add_and_instantiate_widget_rdf(self):

        self.login()

        resource = self.add_template_to_catalogue('http://localhost:8001/test/test.rdf', 'Test_Selenium')
        self.instantiate(resource)

    def test_add_and_delete_widget_rdf(self):

        self.login()

        self.add_template_to_catalogue('http://localhost:8001/test/test.rdf', 'Test_Selenium')
        self.delete_resource('Test_Selenium')
