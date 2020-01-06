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

from django.test import override_settings, TestCase

from wirecloud.commons.middleware import LocaleMiddleware


# Avoid nose to repeat these tests (they are run through wirecloud/commons/tests/__init__.py)
__test__ = False


class LocaleMiddlewareTestCase(TestCase):

    tags = ('wirecloud-locale-middleware', 'wirecloud-middleware', 'wirecloud-noselenium')

    @classmethod
    def setUpClass(cls):
        cls.middleware = LocaleMiddleware()
        super(LocaleMiddlewareTestCase, cls).setUpClass()

    @patch('wirecloud.commons.middleware.translation')
    def test_process_request(self, translation):
        request = Mock(GET={})
        self.middleware.process_request(request)

        translation.activate.assert_called_once_with(translation.get_language_from_request())

    @override_settings(LANGUAGE_CODE="en")
    @patch('wirecloud.commons.middleware.translation')
    def test_process_request_get_parameter(self, translation):
        request = Mock(GET={"lang": "es"})
        self.middleware.process_request(request)

        translation.activate.assert_called_once_with("es")

    @override_settings(LANGUAGE_CODE="en")
    @patch('wirecloud.commons.middleware.translation')
    def test_process_response(self, translation):
        request = Mock()
        response = Mock()
        self.assertEqual(self.middleware.process_response(request, response), response)

        response.setdefault.assert_called_once_with('Content-Language', translation.get_language())
