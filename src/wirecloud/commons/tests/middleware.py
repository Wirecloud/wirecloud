# -*- coding: utf-8 -*-

# Copyright (c) 2019-2020 Future Internet Consulting and Development Solutions S.L.

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

from django.core.exceptions import ImproperlyConfigured, MiddlewareNotUsed
from django.http import HttpResponse
from django.test import override_settings, TestCase

from wirecloud.commons.middleware import LocaleMiddleware, URLMiddleware


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
        request = Mock(GET={}, COOKIES={})
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


class EmptyMiddleware(object):
    pass


class OneMiddleware(object):

    process_request = Mock(return_value=None)
    process_view = Mock(return_value=None)
    process_template_response = Mock(return_value=None)
    process_response = Mock(return_value=None)
    process_exception = Mock(return_value=None)


class AnotherMiddleware(object):

    process_request = Mock(return_value=None)
    process_view = Mock(return_value=None)
    process_template_response = Mock(return_value=None)
    process_response = Mock(return_value=None)
    process_exception = Mock(return_value=None)


class ShortCircuitMiddleware(object):

    process_request = Mock(return_value=HttpResponse())
    process_view = Mock(return_value=HttpResponse())
    process_template_response = Mock(return_value=HttpResponse())
    process_response = Mock(return_value=HttpResponse())
    process_exception = Mock(return_value=HttpResponse())


class BrokenMiddleware(object):

    __init__ = Mock(side_effect=Exception)


class NotUsedMiddleware(object):

    __init__ = Mock(side_effect=MiddlewareNotUsed)
    process_request = Mock(return_value=None)


class URLMiddlewareTestCase(TestCase):

    tags = ('wirecloud-url-middleware', 'wirecloud-middleware', 'wirecloud-noselenium')

    def setUp(self):
        super(URLMiddlewareTestCase, self).setUp()
        self.middleware = URLMiddleware()

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'invalidmodule',
        ]
    })
    def test_invalid_module(self):
        request = Mock(path='/api/version', GET={})
        self.assertRaises(ImproperlyConfigured, self.middleware.process_request, request)

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'inexistent.module.Middleware',
        ]
    })
    def test_inexistent_module(self):
        request = Mock(path='/api/version', GET={})
        self.assertRaises(ImproperlyConfigured, self.middleware.process_request, request)

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'wirecloud.commons.tests.middleware.InexistentClass',
        ]
    })
    def test_inexistent_class(self):
        request = Mock(path='/api/version', GET={})
        self.assertRaises(ImproperlyConfigured, self.middleware.process_request, request)

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'wirecloud.commons.tests.middleware.BrokenMiddleware',
        ]
    })
    def test_broken_middleware(self):
        request = Mock(path='/api/version', GET={})
        self.assertRaises(ImproperlyConfigured, self.middleware.process_request, request)

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'wirecloud.commons.tests.middleware.NotUsedMiddleware',
            'wirecloud.commons.tests.middleware.OneMiddleware',
        ]
    })
    def test_notused_middleware(self):
        request = Mock(path='/api/version', GET={})
        OneMiddleware.process_request.reset_mock()
        self.middleware.process_request(request)

        OneMiddleware.process_request.assert_called_once_with(request)

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'wirecloud.commons.tests.middleware.OneMiddleware',
            'wirecloud.commons.tests.middleware.AnotherMiddleware',
        ],
    })
    def test_middleware_is_cached(self):
        request = Mock(path='/api/version', GET={})
        self.middleware.process_request(request)

        from django.conf import settings
        settings.URL_MIDDLEWARE_CLASSES = {'api': []}
        OneMiddleware.process_request.reset_mock()
        AnotherMiddleware.process_request.reset_mock()
        self.middleware.process_request(request)

        OneMiddleware.process_request.assert_called_once_with(request)
        AnotherMiddleware.process_request.assert_called_once_with(request)

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'wirecloud.commons.tests.middleware.OneMiddleware',
            'wirecloud.commons.tests.middleware.AnotherMiddleware',
        ],
        'default': [
            'wirecloud.commons.tests.middleware.AnotherMiddleware',
        ],
    })
    def test_middleware_is_applied_taking_into_account_request_path(self):
        request = Mock(path='/api/version', GET={})
        self.middleware.process_request(request)

        OneMiddleware.process_request.reset_mock()
        AnotherMiddleware.process_request.reset_mock()
        request = Mock(path='/my/workspace', GET={})
        self.middleware.process_request(request)

        OneMiddleware.process_request.assert_not_called()
        AnotherMiddleware.process_request.assert_called_once_with(request)

    @override_settings(
        INSTALLED_APPS=["wirecloud.platform"],
        URL_MIDDLEWARE_CLASSES={
            'default': [
                'wirecloud.commons.tests.middleware.OneMiddleware',
                'wirecloud.commons.tests.middleware.AnotherMiddleware',
            ],
            'proxy': [
                'wirecloud.commons.tests.middleware.AnotherMiddleware',
            ],
        }
    )
    @patch("wirecloud.commons.middleware.reverse", return_value="/cdp/")
    def test_proxy_middleware_is_enabled_if_platform_is_used(self, reverse):
        request = Mock(path='/cdp/version', GET={})
        OneMiddleware.process_request.reset_mock()
        AnotherMiddleware.process_request.reset_mock()
        self.middleware.process_request(request)

        OneMiddleware.process_request.assert_not_called()
        AnotherMiddleware.process_request.assert_called_once_with(request)

    @override_settings(
        INSTALLED_APPS=[],
        URL_MIDDLEWARE_CLASSES={
            'default': [
                'wirecloud.commons.tests.middleware.OneMiddleware',
                'wirecloud.commons.tests.middleware.AnotherMiddleware',
            ],
            'proxy': [
                'wirecloud.commons.tests.middleware.AnotherMiddleware',
            ],
        }
    )
    @patch("wirecloud.commons.middleware.reverse", return_value="/cdp/")
    def test_proxy_middleware_is_disabled_if_platform_is_not_used(self, reverse):
        request = Mock(path='/cdp/version', GET={})
        OneMiddleware.process_request.reset_mock()
        AnotherMiddleware.process_request.reset_mock()
        self.middleware.process_request(request)

        OneMiddleware.process_request.assert_called_once_with(request)
        AnotherMiddleware.process_request.assert_called_once_with(request)

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'wirecloud.commons.tests.middleware.EmptyMiddleware',
            'wirecloud.commons.tests.middleware.OneMiddleware',
            'wirecloud.commons.tests.middleware.AnotherMiddleware',
        ],
    })
    def test_process_request(self):
        request = Mock(path='/api/version', GET={})
        OneMiddleware.process_request.reset_mock()
        AnotherMiddleware.process_request.reset_mock()
        self.middleware.process_request(request)

        OneMiddleware.process_request.assert_called_once_with(request)
        AnotherMiddleware.process_request.assert_called_once_with(request)

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'wirecloud.commons.tests.middleware.OneMiddleware',
            'wirecloud.commons.tests.middleware.ShortCircuitMiddleware',
            'wirecloud.commons.tests.middleware.AnotherMiddleware',
        ],
    })
    def test_process_request_short_circuit(self):
        request = Mock(path='/api/version', GET={})
        OneMiddleware.process_request.reset_mock()
        AnotherMiddleware.process_request.reset_mock()
        self.middleware.process_request(request)

        OneMiddleware.process_request.assert_called_once_with(request)
        AnotherMiddleware.process_request.assert_not_called()

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'wirecloud.commons.tests.middleware.EmptyMiddleware',
            'wirecloud.commons.tests.middleware.OneMiddleware',
            'wirecloud.commons.tests.middleware.AnotherMiddleware',
        ],
    })
    def test_process_view(self):
        request = Mock(path='/api/version', GET={})
        view_func = Mock()
        view_args = []
        view_kwargs = {}
        OneMiddleware.process_view.reset_mock()
        AnotherMiddleware.process_view.reset_mock()
        self.middleware.process_view(request, view_func, view_args, view_kwargs)

        OneMiddleware.process_view.assert_called_once_with(request, view_func, view_args, view_kwargs)
        AnotherMiddleware.process_view.assert_called_once_with(request, view_func, view_args, view_kwargs)

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'wirecloud.commons.tests.middleware.OneMiddleware',
            'wirecloud.commons.tests.middleware.ShortCircuitMiddleware',
            'wirecloud.commons.tests.middleware.AnotherMiddleware',
        ],
    })
    def test_process_view_short_circuit(self):
        request = Mock(path='/api/version', GET={})
        view_func = Mock()
        view_args = []
        view_kwargs = {}
        OneMiddleware.process_view.reset_mock()
        AnotherMiddleware.process_view.reset_mock()
        self.middleware.process_view(request, view_func, view_args, view_kwargs)

        OneMiddleware.process_view.assert_called_once_with(request, view_func, view_args, view_kwargs)
        AnotherMiddleware.process_view.assert_not_called()

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'wirecloud.commons.tests.middleware.OneMiddleware',
            'wirecloud.commons.tests.middleware.ShortCircuitMiddleware',
        ],
    })
    def test_process_template_response(self):
        request = Mock(path='/api/version', GET={})
        response = HttpResponse()
        short_circuit_response = ShortCircuitMiddleware.process_template_response()
        OneMiddleware.process_template_response.reset_mock()
        ShortCircuitMiddleware.process_template_response.reset_mock()
        self.middleware.process_template_response(request, response)

        OneMiddleware.process_template_response.assert_called_once_with(request, short_circuit_response)
        ShortCircuitMiddleware.process_template_response.assert_called_once_with(request, response)

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'wirecloud.commons.tests.middleware.OneMiddleware',
            'wirecloud.commons.tests.middleware.ShortCircuitMiddleware',
        ],
    })
    def test_process_response(self):
        request = Mock(path='/api/version', GET={})
        response = HttpResponse()
        short_circuit_response = ShortCircuitMiddleware.process_response()
        OneMiddleware.process_response.reset_mock()
        ShortCircuitMiddleware.process_response.reset_mock()
        self.middleware.process_response(request, response)

        OneMiddleware.process_response.assert_called_once_with(request, short_circuit_response)
        ShortCircuitMiddleware.process_response.assert_called_once_with(request, response)

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'wirecloud.commons.tests.middleware.EmptyMiddleware',
            'wirecloud.commons.tests.middleware.OneMiddleware',
            'wirecloud.commons.tests.middleware.AnotherMiddleware',
        ],
    })
    def test_process_exception(self):
        request = Mock(path='/api/version', GET={})
        exception = Mock()
        OneMiddleware.process_exception.reset_mock()
        AnotherMiddleware.process_exception.reset_mock()
        self.middleware.process_exception(request, exception)

        OneMiddleware.process_exception.assert_called_once_with(request, exception)
        AnotherMiddleware.process_exception.assert_called_once_with(request, exception)

    @override_settings(URL_MIDDLEWARE_CLASSES={
        'api': [
            'wirecloud.commons.tests.middleware.OneMiddleware',
            'wirecloud.commons.tests.middleware.ShortCircuitMiddleware',
            'wirecloud.commons.tests.middleware.AnotherMiddleware',
        ],
    })
    def test_process_exception_short_circuit(self):
        request = Mock(path='/api/version', GET={})
        exception = Mock()
        OneMiddleware.process_exception.reset_mock()
        AnotherMiddleware.process_exception.reset_mock()
        self.middleware.process_exception(request, exception)

        OneMiddleware.process_exception.assert_not_called()
        AnotherMiddleware.process_exception.assert_called_once_with(request, exception)
