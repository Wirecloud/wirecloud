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

    def __init__(self, selector, base_element=None, parent=False):
        self.selector = selector
        self.base_element = base_element
        self.check_parent = parent

    def __call__(self, driver):

        try:
            if self.base_element is not None:
                element = self.base_element.find_element(*self.selector)
            else:
                element = driver.find_element(*self.selector)
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
        time.sleep(0.1)
        new_position = self.element.location
        if old_position == new_position:
            return self.element
        else:
            return False



