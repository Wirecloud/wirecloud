# -*- coding: utf-8 -*-

from wirecloud.commons.test import WirecloudSeleniumTestCase

__test__ = False


class CatalogueSeleniumTests(WirecloudSeleniumTestCase):

    def test_add_widget_to_catalog_wgt(self):

        self.login()

        self.add_packaged_resource_to_catalogue('Wirecloud_Test_Selenium_1.0.wgt', 'Test_Selenium', shared=True)

    def test_widgets_are_deletable_by_the_uploader(self):

        self.login('normuser', 'admin')

        self.add_packaged_resource_to_catalogue('Wirecloud_Test_Selenium_1.0.wgt', 'Test_Selenium', shared=True)
        self.delete_resource('Test_Selenium')

    def test_reinstall_widget_to_catalog_wgt(self):

        self.login()

        self.delete_resource('Test')
        resource = self.add_packaged_resource_to_catalogue('Wirecloud_Test_1.0.wgt', 'Test', shared=True)
        self.instantiate(resource)

    def test_add_widget_to_catalogue_xml(self):

        self.login()

        self.add_template_to_catalogue('http://localhost:8001/test/test.xml', 'Test_Selenium')

    def test_add_widget_to_catalogue_rdf(self):

        self.login()

        self.add_template_to_catalogue('http://localhost:8001/test/test.rdf', 'Test_Selenium')

    def test_add_invalid_widget_to_catalogue_rdf(self):

        self.login()

        self.add_template_to_catalogue('http://localhost:8001/test/invalidTest.rdf', 'Test_Selenium', expect_error='missing required field: versionInfo.')

    def test_add_widget_twice(self):

        self.login()

        self.add_template_to_catalogue('http://localhost:8001/test/test_duplicated.rdf', 'Test', expect_error='Resource already exists.')

    def test_upload_duplicated_packaged_widget(self):

        self.login()

        self.add_packaged_resource_to_catalogue('Wirecloud_Test_1.0.wgt', 'Test', shared=True, expect_error='Resource already exists.')

    def test_add_and_instantiate_widget_rdf(self):

        self.login()

        resource = self.add_template_to_catalogue('http://localhost:8001/test/test.rdf', 'Test_Selenium')
        self.instantiate(resource)

    def test_add_and_delete_widget_rdf(self):

        self.login()

        self.add_template_to_catalogue('http://localhost:8001/test/test.rdf', 'Test_Selenium')
        self.delete_resource('Test_Selenium')
