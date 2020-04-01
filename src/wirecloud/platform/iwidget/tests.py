# -*- coding: utf-8 -*-

# Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.

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

from unittest.mock import MagicMock

from django.test import TestCase

from wirecloud.platform.iwidget.utils import parse_value_from_text, update_anchor_value, update_boolean_value


class IWidgetUtilsTestCase(TestCase):

    tags = ('wirecloud-iwidget-utils', 'wirecloud-noselenium')

    def test_update_anchor_value(self):
        model = MagicMock()
        data = {
            "anchor": "topleft"
        }
        update_anchor_value(model, data)

        self.assertEqual(data, {"anchor": "topleft"})

    def test_update_anchor_value_not_defined(self):
        model = MagicMock()
        data = {}
        update_anchor_value(model, data)

        self.assertEqual(data, {})

    def test_update_anchor_value_invalid_value_type(self):
        model = MagicMock()
        data = {
            "anchor": 5
        }
        self.assertRaises(TypeError, update_anchor_value, model, data)

    def test_update_anchor_value_invalid_value(self):
        model = MagicMock()
        data = {
            "anchor": "invalid"
        }
        self.assertRaises(ValueError, update_anchor_value, model, data)

    def test_update_boolean_value(self):
        model = MagicMock()
        data = {
            "relx": True
        }
        update_boolean_value(model, data, "relx")

        self.assertEqual(data, {"relx": True})

    def test_update_boolean_value_not_defined(self):
        model = MagicMock()
        data = {}
        update_boolean_value(model, data, "relx")

        self.assertEqual(data, {})

    def test_update_boolean_value_invalid_value_type(self):
        model = MagicMock()
        data = {
            "relx": 5
        }
        self.assertRaises(TypeError, update_boolean_value, model, data, "relx")

    def test_parse_value_from_text_boolean_true(self):
        self.assertEqual(parse_value_from_text({"type": "boolean"}, "tRue"), True)

    def test_parse_value_from_text_boolean_false(self):
        self.assertEqual(parse_value_from_text({"type": "boolean"}, "false"), False)

    def test_parse_value_from_text_number(self):
        self.assertEqual(parse_value_from_text({"type": "number"}, "5.5"), 5.5)

    def test_parse_value_from_text_number_default(self):
        self.assertEqual(parse_value_from_text({"type": "number", "default": "3"}, ""), 3)

    def test_parse_value_from_text_number_invalid_value_default(self):
        self.assertEqual(parse_value_from_text({"type": "number", "default": "3"}, "false"), 3)

    def test_parse_value_from_text_number_invalid_value_nodefault(self):
        self.assertEqual(parse_value_from_text({"type": "number"}, "false"), 0)

    def test_parse_value_from_text_number_invalid_value_invalid_default(self):
        self.assertEqual(parse_value_from_text({"type": "number", "default": "false"}, "false"), 0)

    def test_parse_value_from_text_text(self):
        self.assertEqual(parse_value_from_text({"type": "text"}, "value"), "value")

    def test_parse_value_from_text_password(self):
        self.assertEqual(parse_value_from_text({"type": "password"}, "value"), "value")
