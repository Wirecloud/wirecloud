# -*- coding: utf-8 -*-

from shutil import rmtree
from tempfile import mkdtemp

from django.conf import settings

import catalogue.utils
from wirecloudcommons.test import WirecloudSeleniumTestCase
from wirecloudcommons.utils.wgt import WgtDeployer

__test__ = False


class CatalogueSeleniumTests(WirecloudSeleniumTestCase):

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

    def test_add_widget_to_catalog_wgt(self):

        self.login()

        self.add_wgt_widget_to_catalogue('Morfeo_Calendar_Viewer.wgt', 'Calendar Viewer')
        self.add_wgt_widget_to_catalogue('Morfeo_Cliente_Correo.wgt', 'Cliente Correo')
        self.add_wgt_widget_to_catalogue('Morfeo_FeedList.wgt', 'Feed List')
        self.add_wgt_widget_to_catalogue('Morfeo_FeedReader.wgt', 'Feed Reader')

    def test_reinstall_widget_to_catalog_wgt(self):

        self.login()

        self.delete_widget('Test')
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
        self.delete_widget('Test_Selenium')
