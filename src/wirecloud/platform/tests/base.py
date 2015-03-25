# -*- coding: utf-8 -*-

# Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import unicode_literals

from io import BytesIO
import json
from lxml import etree

from django.conf import settings
from django.core.urlresolvers import reverse
from django.test.client import RequestFactory
from django.test import Client
from django.utils import unittest
from mock import Mock, patch

from wirecloud.commons.authentication import logout
from wirecloud.commons.utils.http import get_absolute_reverse_url
from wirecloud.commons.utils.remote import PopupMenuTester
from wirecloud.commons.utils.testcases import WirecloudTestCase, WirecloudSeleniumTestCase
from wirecloud.platform.preferences.models import update_session_lang


class BasicViewsAPI(WirecloudTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-base-views',)

    def setUp(self):
        super(BasicViewsAPI, self).setUp()

        self.client = Client()

    @classmethod
    def setUpClass(cls):
        super(BasicViewsAPI, cls).setUpClass()
        factory = RequestFactory()
        request = factory.get(reverse('login'))
        cls.login_url = get_absolute_reverse_url('login', request=request)

    def test_workspace_view_redirects_to_login(self):

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'ExistingWorkspace'})

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 302)
        self.assertIn('Location', response)
        self.assertTrue(response['Location'].startswith(self.login_url))

    def test_workspace_view_check_permissions(self):

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'ExistingWorkspace'})

        # Authenticate
        self.client.login(username='emptyuser', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/xhtml+xml')

        parser = etree.XMLParser(encoding='utf-8')
        etree.parse(BytesIO(response.content), parser)

    def test_general_not_found_view(self):

        url = reverse('wirecloud.root') + 'nonexisting page/abc/buu'

        response = self.client.get(url, HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

        parser = etree.XMLParser(encoding='utf-8')
        etree.parse(BytesIO(response.content), parser)

    def test_workspace_view_handles_not_found(self):

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'noexistent_user', 'name': 'NonexistingWorkspace'})

        # Authenticate
        self.client.login(username='emptyuser', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

        parser = etree.XMLParser(encoding='utf-8')
        etree.parse(BytesIO(response.content), parser)

    def test_workspace_view_handles_bad_view_value(self):

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'ExistingWorkspace'}) + '?mode=noexistent&a=b'

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 302)
        self.assertIn('Location', response)
        self.assertTrue(response['Location'].endswith('?a=b'))

    @unittest.skipIf(settings.ALLOW_ANONYMOUS_ACCESS is False, 'Anonymous access disabled')
    def test_root_view_anonymous_allowed(self):

        url = reverse('wirecloud.root')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 200)

    @unittest.skipIf(settings.ALLOW_ANONYMOUS_ACCESS is True, 'Anonymous access enabled')
    def test_root_view_anonymous_not_allowed(self):

        url = reverse('wirecloud.root')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response['Location'].startswith(self.login_url))

    def test_logout_delete_session_data(self):

        logout_url = reverse('logout')
        context_url = reverse('wirecloud.platform_context_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')
        old_cookies = self.client.cookies.values()

        response = self.client.get(context_url, HTTP_ACCEPT='application/xhtml+xml')
        response_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data['username']['value'], 'user_with_workspaces')

        self.client.get(logout_url, HTTP_ACCEPT='application/xhtml+xml')
        for cookie in old_cookies:
            # Check session id has also changed
            self.assertNotEqual(self.client.cookies[cookie.key].value, cookie.value)
            self.client.cookies[cookie.key] = cookie.value

        response = self.client.get(context_url, HTTP_ACCEPT='application/xhtml+xml')
        response_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data['username']['value'], 'anonymous')

    def test_logout_maintains_language_setting(self):

        logout_url = reverse('logout')
        context_url = reverse('wirecloud.platform_context_collection')
        platform_prefs_url = reverse('wirecloud.platform_preferences')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Set the language
        response = self.client.post(platform_prefs_url, b'{"language": {"value": "es"}}', content_type="application/json", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # logout
        self.client.get(logout_url, HTTP_ACCEPT='application/xhtml+xml')

        # Check language after logout
        response = self.client.get(context_url, HTTP_ACCEPT='application/xhtml+xml')
        response_data = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data['language']['value'], 'es')

    def test_logout_obey_next_page_parameter(self):

        # logout without next_page
        request = Mock()
        request.session.get.return_value = None
        with patch('wirecloud.commons.authentication.render') as render_mock:
            response = logout(request, next_page=None)
            self.assertTrue(render_mock.called)
        self.assertTrue(request.session.flush.called)

        # logout with next_page
        request = Mock()
        request.session.get.return_value = None
        with patch('wirecloud.commons.authentication.render') as render_mock:
            response = logout(request, next_page='newurl')
            self.assertFalse(render_mock.called)
        self.assertTrue(request.session.flush.called)
        self.assertTrue(response['Location'], 'newurl')

    def test_update_session_lang_not_user_preference(self):

        request = Mock()
        request.session = {}

        user = Mock()
        with self.settings(DEFAULT_LANGUAGE='invented'):
            with patch('wirecloud.platform.preferences.models.PlatformPreference') as platform_preference_mock:
                platform_preference_mock.objects.filter.return_value = []
                update_session_lang(request, user)

        self.assertEqual(request.session['django_language'], 'invented')

    def test_update_session_lang_invalid_user_preference(self):

        request = Mock()
        request.session = {'django_language': 'es'}

        user = Mock()
        with self.settings(DEFAULT_LANGUAGE='invented', LANGUAGES=(('es', 'Spanish'),)):
            with patch('wirecloud.platform.preferences.models.PlatformPreference') as platform_preference_mock:
                lang_pref_mock = Mock()
                lang_pref_mock.value = 'invalid'
                platform_preference_mock.objects.filter.return_value = [lang_pref_mock]
                update_session_lang(request, user)

        self.assertEqual(request.session['django_language'], 'invented')

    def test_update_session_lang_browser(self):

        request = Mock()
        request.session = {'django_language': 'en'}

        user = Mock()
        with self.settings(DEFAULT_LANGUAGE='en', LANGUAGES=(('en', 'English'),)):
            with patch('wirecloud.platform.preferences.models.PlatformPreference') as platform_preference_mock:
                lang_pref_mock = Mock()
                lang_pref_mock.value = 'browser'
                platform_preference_mock.objects.filter.return_value = [lang_pref_mock]
                update_session_lang(request, user)

        self.assertNotIn('django_language', request.session)

    def test_update_session_lang_default_browser(self):

        request = Mock()
        request.session = {}

        user = Mock()
        with self.settings(DEFAULT_LANGUAGE='browser', LANGUAGES=(('en', 'English'),)):
            with patch('wirecloud.platform.preferences.models.PlatformPreference') as platform_preference_mock:
                lang_pref_mock = Mock()
                lang_pref_mock.value = 'default'
                platform_preference_mock.objects.filter.return_value = [lang_pref_mock]
                update_session_lang(request, user)

        self.assertNotIn('django_language', request.session)


class BasicViewsSeleniumTestCase(WirecloudSeleniumTestCase):

    tags = ('base-views', 'base-views-selenium')

    @unittest.skipIf(settings.ALLOW_ANONYMOUS_ACCESS is False, 'Anonymous access disabled')
    def test_root_view_anonymous_allowed(self):
        url = self.live_server_url + reverse('wirecloud.root')
        self.driver.get(url)
        sign_in_button = self.wait_element_visible_by_css_selector('#wirecloud_header .user_menu_wrapper .styled_button, #wirecloud_header .arrow-down-settings')

        if sign_in_button.text != 'Sign in':
            # Oiltheme
            sign_in_button.click()
            popup_menu_element = self.wait_element_visible_by_css_selector('.se-popup-menu')
            popup_menu = PopupMenuTester(self, popup_menu_element)
            popup_menu.click_entry('Sign in')
        else:
            sign_in_button.click()

        username_input = self.wait_element_visible_by_css_selector('#id_username')
        self.fill_form_input(username_input, 'user_with_workspaces')
        password_input = self.driver.find_element_by_id('id_password')
        self.fill_form_input(password_input, 'admin')
        password_input.submit()

        self.wait_wirecloud_ready()

    def check_login_behaviour(self, initial_url):

        sign_in_button = self.wait_element_visible_by_css_selector('#wirecloud_header .user_menu_wrapper .styled_button, #wirecloud_header .arrow-down-settings')

        if sign_in_button.text != 'Sign in':
            # Oiltheme
            sign_in_button.click()
            popup_menu_element = self.wait_element_visible_by_css_selector('.se-popup-menu')
            popup_menu = PopupMenuTester(self, popup_menu_element)
            popup_menu.click_entry('Sign in')
        else:
            sign_in_button.click()

        username_input = self.wait_element_visible_by_css_selector('#id_username')
        self.fill_form_input(username_input, 'user_with_workspaces')
        password_input = self.driver.find_element_by_id('id_password')
        self.fill_form_input(password_input, 'admin')
        password_input.submit()

        self.assertEqual(self.driver.current_url, initial_url)

    def test_workspace_not_found_view_not_logged(self):

        url = self.live_server_url + reverse('wirecloud.workspace_view', kwargs={'owner': 'noexistent_user', 'name': 'NonexistingWorkspace'})
        self.driver.get(url)

        self.check_login_behaviour(url)
