# -*- coding: utf-8 -*-

# Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

import unittest
from unittest.mock import Mock, patch, DEFAULT

from django.http import HttpResponse

from wirecloud.fiware.views import login, logout


# Avoid nose to repeat these tests (they are run through wirecloud/fiware/tests/__init__.py)
__test__ = False


class FIWAREViewsTestCase(unittest.TestCase):

    tags = ('wirecloud-fiware', 'wirecloud-fiware-views', 'wirecloud-noselenium')

    def test_login_redirect_invalid_method(self):

        request = Mock()
        request.META = {}
        request.method = 'POST'
        request.session.get.return_value = None
        response = login(request)
        self.assertEqual(response.status_code, 405)

    def test_login_redirects_to_social_auth(self):

        request = Mock()
        request.META = {}
        request.GET.urlencode.return_value = 'param=a&t=d'
        request.user.is_authenticated.return_value = False
        request.method = 'GET'
        request.session.get.return_value = None
        with patch("wirecloud.fiware.views.reverse") as reverse_mock:
            reverse_mock.return_value = '/login/fiware'
            response = login(request)
        self.assertEqual(response['Location'], '/login/fiware?param=a&t=d')
        self.assertEqual(response.status_code, 302)

    def test_login_redirects_authenticated_users_to_the_landing_page(self):

        request = Mock()
        request.META = {}
        request.GET.get.return_value = '/landing_page'
        request.user.is_authenticated.return_value = True
        request.method = 'GET'
        request.session.get.return_value = None
        response = login(request)
        self.assertEqual(response['Location'], '/landing_page')
        self.assertEqual(response.status_code, 302)

    def test_logout_invalid_method(self):

        request = Mock()
        request.META = {}
        request.method = 'POST'
        request.session.get.return_value = None
        with patch.multiple('wirecloud.fiware.views', wirecloud_logout=DEFAULT, ALLOWED_ORIGINS=()) as mocks:
            response = logout(request)
            self.assertFalse(mocks['wirecloud_logout'].called)
        self.assertEqual(response.status_code, 405)
        self.assertFalse(request.session.flush.called)

    def test_logout_from_not_allowed_origin(self):

        request = Mock()
        request.META = {'HTTP_ORIGIN': 'http://invalid_domain:666'}
        request.method = 'GET'
        request.session.get.return_value = None
        with patch.multiple('wirecloud.fiware.views', wirecloud_logout=DEFAULT, ALLOWED_ORIGINS=()) as mocks:
            response = logout(request)
            self.assertFalse(mocks['wirecloud_logout'].called)
        self.assertEqual(response.status_code, 403)
        self.assertFalse(request.session.flush.called)

    def test_logout_from_allowed_origin(self):

        request = Mock()
        request.META = {'HTTP_ORIGIN': 'http://valid_domain'}
        request.method = 'GET'
        request.session.get.return_value = None
        with patch.multiple('wirecloud.fiware.views', wirecloud_logout=DEFAULT, ALLOWED_ORIGINS=('http://valid_domain',)) as mocks:
            mocks['wirecloud_logout'].return_value = HttpResponse(status=204)
            response = logout(request)
            mocks['wirecloud_logout'].assert_called_with(request, next_page=None)
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response['Access-Control-Allow-Origin'], 'http://valid_domain')
        self.assertEqual(response['Access-Control-Allow-Credentials'], 'true')
        self.assertFalse(request.session.flush.called)

    def test_logout_from_server_domain(self):

        request = Mock()
        request.META = {}
        request.method = 'GET'
        request.session.get.return_value = None
        with patch.multiple('wirecloud.fiware.views', wirecloud_logout=DEFAULT, ALLOWED_ORIGINS=()) as mocks:
            mocks['wirecloud_logout'].return_value = HttpResponse(status=204)
            response = logout(request)
            mocks['wirecloud_logout'].assert_called_with(request)
        self.assertEqual(response.status_code, 204)
        self.assertNotIn('Access-Control-Allow-Origin', response)
        self.assertNotIn('Access-Control-Allow-Credentials', response)
        self.assertFalse(request.session.flush.called)
