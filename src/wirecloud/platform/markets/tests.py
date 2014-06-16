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

import os

from wirecloud.commons.utils.testcases import DynamicWebServer, LocalFileSystemServer, WirecloudSeleniumTestCase


__test__ = False


class MarketManagementSeleniumTestCase(WirecloudSeleniumTestCase):

    servers = {
        'http': {
            'wcatalogue.example.com': DynamicWebServer(fallback=LocalFileSystemServer(os.path.join(os.path.dirname(__file__), 'test-data', 'responses', 'wcatalogue'))),
        },
    }
    tags = ('markets',)

    def check_resource_buttons(self, resources, button_text=None):
        for resource_name in resources:
            resource = self.search_in_catalogue_results(resource_name)
            self.assertIsNotNone(resource)
            button = resource.find_element_by_css_selector('.mainbutton')
            self.assertEqual(button.text, button_text)

    def test_add_marketplace(self):

        self.login()
        self.add_marketplace('remote', 'http://wcatalogue.example.com', 'wirecloud')
        self.check_resource_buttons(('New Widget', 'New Operator', 'New Mashup'), 'Install')
        self.check_resource_buttons(('Test', 'TestOperator', 'Test Mashup'), 'Uninstall')

        self.login('normuser', 'admin')
        popup_menu = self.open_marketplace_menu()
        popup_menu.check(must_be_absent=('remote',))

    def test_add_public_marketplace(self):

        self.login()
        self.add_marketplace('remote', 'http://wcatalogue.example.com', 'wirecloud', public=True)
        self.check_resource_buttons(('New Widget', 'New Operator', 'New Mashup'), 'Install')
        self.check_resource_buttons(('Test', 'TestOperator', 'Test Mashup'), 'Uninstall')

        self.login('normuser', 'admin')
        self.change_marketplace('remote')
        self.check_resource_buttons(('New Widget', 'New Operator', 'New Mashup'), 'Install')
        self.check_resource_buttons(('Test', 'TestOperator', 'Test Mashup'), 'Uninstall')

    def test_add_duplicated_marketplace(self):

        self.login('user_with_markets', 'admin')
        self.add_marketplace('deleteme', 'http://localhost:8080', 'wirecloud', expect_error=True)

    def test_delete_marketplace(self):

        self.login('user_with_markets', 'admin')

        self.delete_marketplace('deleteme')

    def test_global_marketplace_are_deletable_by_superusers(self):

        self.login('normuser', 'admin')

        self.change_marketplace('origin')
        self.driver.find_element_by_css_selector('#wirecloud_breadcrum .second_level > .icon-menu').click()
        self.check_popup_menu((), (), ('Delete marketplace',))

        self.login('admin', 'admin')

        self.delete_marketplace('origin')

