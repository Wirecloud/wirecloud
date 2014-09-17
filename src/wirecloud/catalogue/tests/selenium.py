# -*- coding: utf-8 -*-

# Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

from wirecloud.commons.utils.testcases import WirecloudSeleniumTestCase

__test__ = False


class CatalogueSeleniumTests(WirecloudSeleniumTestCase):

    tags = ('wirecloud-selenium', 'catalogue', 'catalogue-selenium')

    def test_upload_packaged_widget(self):

        self.login()

        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_Test_Selenium_1.0.wgt', 'Test_Selenium', shared=True)

    def test_upload_packaged_mashup(self):

        self.login()

        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_PackagedTestMashup_1.0.zip', 'PackagedTestMashup', shared=True)

    def test_upload_packaged_mashup_embedded_resources(self):

        self.login()

        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_TestMashupEmbedded_1.0.zip', 'TestMashupEmbedded', shared=True)
            myresources.search('nonavailable')
            self.assertIsNotNone(myresources.search_in_results('nonavailable-widget'))
            self.assertIsNotNone(myresources.search_in_results('nonavailable-operator'))

    def test_reinstall_packaged_widget(self):

        self.login()

        with self.myresources_view as myresources:
            myresources.delete_resource('Test')
            myresources.upload_resource('Wirecloud_Test_1.0.wgt', 'Test', shared=True)

        self.add_widget_to_mashup('Test')

    def test_upload_duplicated_widget(self):

        self.login()

        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_Test_1.0.wgt', 'Test', shared=True, expect_error='Resource already exists.')

    def test_upload_and_instantiate_widget(self):

        self.login()

        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_Test_Selenium_1.0.wgt', 'Test_Selenium', shared=True)

        self.add_widget_to_mashup('Test_Selenium')

    def test_upload_and_delete_widget(self):

        self.login()

        with self.myresources_view as myresources:
            myresources.upload_resource('Wirecloud_Test_Selenium_1.0.wgt', 'Test_Selenium', shared=True)
            myresources.delete_resource('Test_Selenium')

    def test_search_empty_results(self):

        self.login()

        with self.myresources_view as myresources:
            myresources.search('nousedkeyword')
            catalogue_base_element = myresources.wait_catalogue_ready()

            resources = catalogue_base_element.find_elements_by_css_selector('.resource_list .resource')
            self.assertEqual(len(resources), 0)

            alert = catalogue_base_element.find_elements_by_css_selector('.alert')
            self.assertEqual(len(alert), 1)
            self.assertIn('nousedkeyword', alert[0].text)
