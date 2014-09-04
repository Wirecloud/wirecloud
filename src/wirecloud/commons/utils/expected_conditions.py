# -*- coding: utf-8 -*-

# Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

import time

from selenium.common.exceptions import NoSuchElementException, StaleElementReferenceException


class element_be_clickable(object):

    def __init__(self, locator, base_element=None, parent=False):
        self.locator = locator
        self.base_element = base_element
        self.check_parent = parent

    def __call__(self, driver):

        try:
            if self.base_element is not None:
                element = self.base_element.find_element(*self.locator)
            else:
                element = driver.find_element(*self.locator)
        except NoSuchElementException:
            return False

        try:
            wrapper_element = element
            if self.check_parent is True:
                wrapper_element = element.find_element_by_xpath('..')

            if 'disabled' in wrapper_element.get_attribute('class'):
                return False

            position = element.location
            top_element = driver.execute_script('return document.elementFromPoint(arguments[0], arguments[1]);',
                    position['x'] + (element.size['width'] / 2),
                    position['y'] + (element.size['height'] / 2)
                )

            while top_element is not None:
                if element == top_element:
                    return element
                top_element = top_element.find_element_by_xpath('..')
            return False
        except (NoSuchElementException, StaleElementReferenceException):
            return False


class element_be_still(object):
    """ An expectation for checking that an element is still
    """
    def __init__(self, element):
        self.element = element

    def __call__(self, driver):
        old_position = self.element.location
        old_size = self.element.size
        time.sleep(0.1)
        new_position = self.element.location
        new_size = self.element.size
        if old_position == new_position and old_size == new_size:
            return self.element
        else:
            return False


class element_be_enabled(object):
    """ An expectation for checking that an element is enabled
    """
    def __init__(self, locator, base_element=None):
        self.locator = locator
        self.base_element = base_element

    def __call__(self, driver):

        try:
            if self.base_element is not None:
                element = self.base_element.find_element(*self.locator)
            else:
                element = driver.find_element(*self.locator)
        except NoSuchElementException:
            return False

        try:
            if element.is_displayed() and 'disabled' not in element.get_attribute('class'):
                return element
            else:
                return None
        except StaleElementReferenceException:
            return False


class visibility_of_element_located(object):
    """ An expectation for checking that an element is present on the DOM of a
    page and visible. Visibility means that the element is not only displayed
    but also has a height and width that is greater than 0.
    locator - used to find the element
    returns the WebElement once it is located and visible
    """
    def __init__(self, locator, base_element=None):
        self.locator = locator
        self.base_element = base_element

    def __call__(self, driver):
        try:
            if self.base_element is not None:
                element = self.base_element.find_element(*self.locator)
            else:
                element = driver.find_element(*self.locator)
        except NoSuchElementException:
            return False

        try:
            return element if element.is_displayed() else None
        except StaleElementReferenceException:
            return False


class workspace_tab_name(object):
    """An expectation for checking the name of a workspace tab.
    returns True if the name matches, false otherwise."""
    def __init__(self, testcase, expected_name):
        self.testcase = testcase
        self.expected_name = expected_name

    def __call__(self, driver):
        try:
            return self.testcase.get_current_workspace_tab().name == self.expected_name
        except StaleElementReferenceException:
            return False


class workspace_name(object):
    """An expectation for checking the name of a workspace.
    returns True if the name matches, false otherwise."""
    def __init__(self, testcase, expected_name):
        self.testcase = testcase
        self.expected_name = expected_name

    def __call__(self, driver):
        try:
            return self.testcase.get_current_workspace_name() == self.expected_name
        except StaleElementReferenceException:
            return False


class marketplace_name(object):
    """An expectation for checking the name of a marketplace.
    returns True if the name matches, false otherwise."""
    def __init__(self, marketplace_tester, expected_name):
        self.marketplace_tester = marketplace_tester
        self.expected_name = expected_name

    def __call__(self, driver):
        try:
            return self.marketplace_tester.get_current_marketplace_name() == self.expected_name
        except StaleElementReferenceException:
            return False
