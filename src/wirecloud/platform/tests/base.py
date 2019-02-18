# -*- coding: utf-8 -*-

# Copyright (c) 2013-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

from copy import deepcopy
from io import BytesIO
import json
from lxml import etree
from unittest.mock import Mock, patch

import django
from django.contrib.auth.models import Group, User
from django.core.urlresolvers import reverse
from django.test import Client, TransactionTestCase
from django.test.client import RequestFactory
from django.test.utils import override_settings
from django.template import TemplateDoesNotExist
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from wirecloud.commons.authentication import logout
from wirecloud.commons.middleware import get_api_user
from wirecloud.commons.utils.http import get_absolute_reverse_url
from wirecloud.commons.utils.remote import FormTester
from wirecloud.commons.utils.testcases import WirecloudTestCase, wirecloud_selenium_test_case, WirecloudSeleniumTestCase
from wirecloud.commons.exceptions import HttpBadCredentials
from wirecloud.platform.models import Workspace
from wirecloud.platform.preferences.models import update_session_lang
from wirecloud.platform.views import get_default_view, render_wirecloud
from django.utils.translation import LANGUAGE_SESSION_KEY


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


class BasicViewsAPI(WirecloudTestCase, TransactionTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-base-views', 'wirecloud-base-views-unit', 'wirecloud-noselenium')
    use_search_indexes = False

    def setUp(self):
        super(BasicViewsAPI, self).setUp()

        self.client = Client()

    @classmethod
    def setUpClass(cls):
        super(BasicViewsAPI, cls).setUpClass()
        factory = RequestFactory()
        request = factory.get(reverse('login'))
        cls.login_url = reverse('login')

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

    def test_workspace_view_handles_missing_templates(self):

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'ExistingWorkspace'})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        with patch('wirecloud.platform.views.render', return_value=Mock(render=Mock(side_effect=TemplateDoesNotExist('test')))):
            self.assertRaises(TemplateDoesNotExist, self.client.get, url, HTTP_ACCEPT='application/xhtml+xml')

    def test_workspace_view_handles_bad_mode_value(self):

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'ExistingWorkspace'}) + '?mode=noexistent&a=b'

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 302)
        self.assertIn('Location', response)
        self.assertTrue(response['Location'].endswith('?a=b'))

    def test_workspace_view_handles_bad_theme_value(self):

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'ExistingWorkspace'}) + '?theme=noexistent&a=b'

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 302)
        self.assertIn('Location', response)
        self.assertTrue(response['Location'].endswith('?a=b'))

    @override_settings(ALLOW_ANONYMOUS_ACCESS=True)
    def test_workspace_view_public_anonymous_allowed(self):

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'public-workspace'})

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml', HTTP_USER_AGENT='')
        self.assertEqual(response.status_code, 200)

    @override_settings(ALLOW_ANONYMOUS_ACCESS=False)
    def test_workspace_view_public_anonymous_not_allowed(self):

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'public-workspace'})

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml', HTTP_USER_AGENT='')
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response['Location'].startswith(self.login_url))

    def test_workspace_view_shared_with_org(self):

        # Add access permissions for the org organization
        workspace = Workspace.objects.get(creator__username="user_with_workspaces", name="Workspace")
        workspace.groups.add(Group.objects.get(name="org"))
        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'Workspace'})

        # Authenticate
        self.client.login(username='orguser', password='admin')

        # orguser belongs to org, which is allowed to access the dashboard
        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml', HTTP_USER_AGENT='')
        self.assertEqual(response.status_code, 200)

    def test_workspace_view_shared_with_user(self):

        # Add access permissions for the normuser user
        workspace = Workspace.objects.get(creator__username="user_with_workspaces", name="Workspace")
        workspace.userworkspace_set.create(user=User.objects.get(username="normuser"))
        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'Workspace'})

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # normuser should be allowed to access the dashboard
        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml', HTTP_USER_AGENT='')
        self.assertEqual(response.status_code, 200)

    def test_render_wirecloud_invalid_view_type(self):
        request = Mock(GET={}, META={})
        with patch('wirecloud.platform.views.get_default_view', return_value="classic"):
            render_wirecloud(request, view_type='invalid')

    @override_settings(ALLOW_ANONYMOUS_ACCESS=True)
    def test_root_view_anonymous_allowed(self):

        url = reverse('wirecloud.root')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 200)

    @override_settings(ALLOW_ANONYMOUS_ACCESS=False)
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
        old_cookies = deepcopy(self.client.cookies)

        response = self.client.get(context_url, HTTP_ACCEPT='application/xhtml+xml')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data['platform']['username']['value'], 'user_with_workspaces')

        self.client.get(logout_url, HTTP_ACCEPT='application/xhtml+xml')
        for cookie in old_cookies.values():
            # Check session id has changed
            self.assertNotEqual(self.client.cookies[cookie.key].value, cookie.value)
            # Use old session id to be able to check that it has been deleted
            self.client.cookies[cookie.key] = cookie.value

        response = self.client.get(context_url, HTTP_ACCEPT='application/xhtml+xml')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data['platform']['username']['value'], 'anonymous')

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
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_data['platform']['language']['value'], 'es')

    def test_logout_obey_next_page_parameter(self):

        # logout without next_page
        request = Mock()
        request.session.get.return_value = None
        with patch('wirecloud.commons.authentication.render') as render_mock:
            response = logout(request, next_page=None)
            self.assertTrue(render_mock.called)
        self.assertTrue(request.session.cycle_key.called)

        # logout with next_page
        request = Mock()
        request.session.get.return_value = None
        with patch('wirecloud.commons.authentication.render') as render_mock:
            response = logout(request, next_page='newurl')
            self.assertFalse(render_mock.called)
        self.assertTrue(request.session.cycle_key.called)
        self.assertTrue(response['Location'], 'newurl')

    def test_update_session_lang_not_user_preference(self):

        request = Mock()
        request.session = {}

        user = Mock()
        with self.settings(DEFAULT_LANGUAGE='invented'):
            with patch('wirecloud.platform.preferences.models.PlatformPreference') as platform_preference_mock:
                platform_preference_mock.objects.filter.return_value = []
                update_session_lang(request, user)

        self.assertEqual(request.session[LANGUAGE_SESSION_KEY], 'invented')

    def test_update_session_lang_invalid_user_preference(self):

        request = Mock()
        request.session = {LANGUAGE_SESSION_KEY: 'es'}

        user = Mock()
        with self.settings(DEFAULT_LANGUAGE='invented', LANGUAGES=(('es', 'Spanish'),)):
            with patch('wirecloud.platform.preferences.models.PlatformPreference') as platform_preference_mock:
                lang_pref_mock = Mock()
                lang_pref_mock.value = 'invalid'
                platform_preference_mock.objects.filter.return_value = [lang_pref_mock]
                update_session_lang(request, user)

        self.assertEqual(request.session[LANGUAGE_SESSION_KEY], 'invented')

    def test_update_session_lang_browser(self):

        request = Mock()
        request.session = {LANGUAGE_SESSION_KEY: 'en'}

        user = Mock()
        with self.settings(DEFAULT_LANGUAGE='en', LANGUAGES=(('en', 'English'),)):
            with patch('wirecloud.platform.preferences.models.PlatformPreference') as platform_preference_mock:
                lang_pref_mock = Mock()
                lang_pref_mock.value = 'browser'
                platform_preference_mock.objects.filter.return_value = [lang_pref_mock]
                update_session_lang(request, user)

        self.assertNotIn(LANGUAGE_SESSION_KEY, request.session)

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

        self.assertNotIn(LANGUAGE_SESSION_KEY, request.session)

    def test_empty_authorization_header(self):

        request = Mock()
        request.META = {'HTTP_AUTHORIZATION': ''}
        self.assertRaises(HttpBadCredentials, get_api_user, request)

    def test_invalid_authorization_header(self):

        request = Mock()
        request.META = {'HTTP_AUTHORIZATION': 'type token extra_param'}
        self.assertRaises(HttpBadCredentials, get_api_user, request)

    def test_get_default_view_classic(self):

        request = Mock()
        request.META = {'HTTP_USER_AGENT': ''}
        request.session = {}
        with patch('wirecloud.platform.views.ua_parse') as ua_parse_mock:
            ua_parse_mock.return_value = Mock(is_mobile=False)
            self.assertEqual(get_default_view(request), 'classic')
            self.assertEqual(request.session['default_mode'], 'classic')

    def test_get_default_view_smartphone(self):

        request = Mock()
        request.META = {'HTTP_USER_AGENT': ''}
        request.session = {}
        with patch('wirecloud.platform.views.ua_parse') as ua_parse_mock:
            ua_parse_mock.return_value = Mock(is_mobile=True)
            self.assertEqual(get_default_view(request), 'smartphone')
            self.assertEqual(request.session['default_mode'], 'smartphone')

    @override_settings(ALLOW_ANONYMOUS_ACCESS=True)
    def test_session_created_public_workspace_anonymous_users(self):
        '''
        A session is created when an anonymous user access a public workspace
        '''

        url = reverse('wirecloud.workspace_view', kwargs={'owner': 'user_with_workspaces', 'name': 'public-workspace'}) + '?mode=embedded'
        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(self.client.cookies), 0)


@wirecloud_selenium_test_case
class BasicViewsSeleniumTestCase(WirecloudSeleniumTestCase):

    tags = ('wirecloud-base-views', 'wirecloud-base-views-selenium')

    def check_login_behaviour(self):

        sign_in_button = self.wait_element_visible('#wc-user-menu .wc-signin-button')
        sign_in_button.click()

        form = FormTester(self, self.wait_element_visible('#wc-login-form'))
        form.get_field('username').set_value('user_with_workspaces')
        form.get_field('password').set_value('admin')
        form.submit()

        WebDriverWait(self.driver, timeout=5).until(EC.staleness_of(form.element))

    @override_settings(ALLOW_ANONYMOUS_ACCESS=True)
    def test_root_view_anonymous_allowed(self):

        url = self.live_server_url + reverse('wirecloud.root')
        self.driver.get(url)

        self.check_login_behaviour()
        self.wait_wirecloud_ready()

    @override_settings(ALLOW_ANONYMOUS_ACCESS=True)
    def test_workspace_not_found_view_not_logged(self):

        url = self.live_server_url + reverse('wirecloud.workspace_view', kwargs={'owner': 'noexistent_user', 'name': 'NonexistingWorkspace'})
        self.driver.get(url)

        self.check_login_behaviour()
        self.assertEqual(self.driver.current_url, url)
