# -*- coding: utf-8 -*-

# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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

from unittest.mock import patch, Mock

from django.core.exceptions import ValidationError
from django.db.models.fields import NOT_PROVIDED
from django.test import TestCase

from wirecloud.commons.fields import JSONField


# Avoid nose to repeat these tests (they are run through wirecloud/commons/tests/__init__.py)
__test__ = False


class JSONFieldTestCase(TestCase):

    tags = ('wirecloud-fields', 'wirecloud-noselenium')

    def test_get_default_none(self):
        field = JSONField()

        default = field.get_default()
        self.assertEqual(default, {})

    def test_get_default_not_provided(self):
        field = JSONField(null=False, default=NOT_PROVIDED)

        self.assertEqual(field.get_default(), {})

    def test_get_default_not_provided_null(self):
        field = JSONField(null=True, default=NOT_PROVIDED)

        self.assertEqual(field.get_default(), None)

    def test_get_default_static_value(self):
        obj = {"h": "w"}
        field = JSONField(default=obj)

        default = field.get_default()
        self.assertEqual(default, obj)
        default["h"] = "a"
        self.assertNotEqual(default, obj)

    def test_get_default_callable(self):
        obj = {"h": "w"}
        field = JSONField(default=lambda: obj)

        default = field.get_default()
        self.assertEqual(default, obj)
        default["h"] = "a"
        self.assertNotEqual(default, obj)

    def test_from_db_value(self):
        field = JSONField()
        field.to_python = Mock()
        value = '{"a": "b"}'

        self.assertEqual(field.from_db_value(value, None, None, None), field.to_python(value))

        field.to_python.assert_called_with(value)

    def test_to_python_null_none(self):
        field = JSONField(null=True)
        self.assertEqual(field.to_python(None), None)

    def test_to_python_none(self):
        field = JSONField(null=False)
        self.assertEqual(field.to_python(None), {})

    def test_to_python_str(self):
        field = JSONField()
        obj = {"a": "c"}
        self.assertEqual(field.to_python('{"a": "c"}'), obj)

    def test_to_python_str_exception(self):
        field = JSONField()
        self.assertRaises(ValidationError, field.to_python, 'invalid json')

    def test_to_python_json(self):
        field = JSONField()
        obj = {"a": "c"}
        self.assertEqual(field.to_python(obj), obj)

    def test_get_prep_value_exception(self):
        field = JSONField()
        self.assertRaises(ValidationError, field.get_prep_value, set())

    @patch("wirecloud.commons.fields.json")
    def test_implements_value_from_object(self, json):
        field = JSONField()
        field.set_attributes_from_name("myfield")
        obj = Mock(myfield={"a": "b"})
        json.dumps.return_value = "serialized json"

        self.assertEqual(field.value_from_object(obj), "serialized json")

        json.dumps.assert_called_once_with({"a": "b"})

    @patch("wirecloud.commons.fields.json")
    def test_implements_value_to_string(self, json):
        field = JSONField()
        field.set_attributes_from_name("myfield")
        obj = Mock(myfield={"a": "b"})
        json.dumps.return_value = "serialized json"

        self.assertEqual(field.value_to_string(obj), "serialized json")

        json.dumps.assert_called_once_with({"a": "b"})
