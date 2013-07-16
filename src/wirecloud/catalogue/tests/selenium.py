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


from wirecloud.commons.utils.testcases import WirecloudSeleniumTestCase

__test__ = False


class CatalogueSeleniumTests(WirecloudSeleniumTestCase):

    def test_add_widget_to_catalog_wgt(self):

        self.login()

        self.add_packaged_resource_to_catalogue('Wirecloud_Test_Selenium_1.0.wgt', 'Test_Selenium', shared=True)

    def test_add_packaged_mashup(self):

        self.login()

        self.add_packaged_resource_to_catalogue('Wirecloud_PackagedTestMashup_1.0.zip', 'PackagedTestMashup', shared=True)

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
