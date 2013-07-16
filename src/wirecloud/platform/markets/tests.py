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

from wirecloud.commons.utils.testcases import WirecloudSeleniumTestCase, WirecloudTestCase


__test__ = False


class MarketManagementSeleniumTestCase(WirecloudSeleniumTestCase):

    def test_add_marketplace(self):

        self.login()
        self.add_marketplace('remote', 'http://localhost:8080', 'wirecloud')

        self.login('normuser', 'admin')

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
