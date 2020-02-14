# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from unittest.mock import DEFAULT, Mock, patch

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.test import override_settings, TestCase
from parameterized import parameterized

from wirecloud.platform.core.plugins import WirecloudCorePlugin
from wirecloud.platform.plugins import clear_cache, get_active_features, get_plugins, \
    get_extra_javascripts, get_widget_api_extensions, WirecloudPlugin, find_wirecloud_plugins


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


class WirecloudTestPlugin1(WirecloudPlugin):

    features = {
        'feature1': '0.1',
    }

    def get_scripts(self, view):
        if view == 'classic':
            return ('a.js', 'b.js')
        else:
            return ('a.js',)

    def get_widget_api_extensions(self, view, features):
        if view == 'classic':
            return ('d.js',)
        else:
            return ()


class WirecloudTestPlugin2(WirecloudPlugin):

    features = {
        'feature2': '0.2',
    }


class WirecloudTestConflictingPlugin(WirecloudPlugin):

    features = {
        'feature1': '0.1',
        'feature2': '0.2',
    }


class WirecloudPluginTestCase(TestCase):

    tags = ('wirecloud-plugins', 'wirecloud-noselenium')

    @classmethod
    def setUpClass(cls):
        cls.OLD_WIRECLOUD_PLUGINS = getattr(settings, 'WIRECLOUD_PLUGINS', None)
        super(WirecloudPluginTestCase, cls).setUpClass()

    def setUp(self):
        super(WirecloudPluginTestCase, self).setUp()
        clear_cache()

    def tearDown(self):
        settings.WIRECLOUD_PLUGINS = self.OLD_WIRECLOUD_PLUGINS
        clear_cache()
        super(WirecloudPluginTestCase, self).tearDown()

    def test_basic_conf(self):

        settings.WIRECLOUD_PLUGINS = ()

        core_plugins = len(get_plugins())
        core_features = len(get_active_features())
        core_classic_javascripts = len(get_extra_javascripts('classic'))
        core_smartphone_javascripts = len(get_extra_javascripts('smartphone'))
        core_classic_extensions = len(get_widget_api_extensions('classic', {}))
        core_smartphone_extensions = len(get_widget_api_extensions('smartphone', {}))

        settings.WIRECLOUD_PLUGINS = (
            'wirecloud.platform.tests.plugins.WirecloudTestPlugin1',
            'wirecloud.platform.tests.plugins.WirecloudTestPlugin2',
        )
        clear_cache()

        self.assertEqual(len(get_plugins()), core_plugins + 2)
        self.assertEqual(len(get_active_features()), core_features + 2)
        self.assertEqual(len(get_extra_javascripts('classic')), core_classic_javascripts + 2)
        self.assertEqual(len(get_extra_javascripts('smartphone')), core_smartphone_javascripts + 1)
        self.assertEqual(len(get_widget_api_extensions('classic', {})), core_classic_extensions + 1)
        self.assertEqual(len(get_widget_api_extensions('smartphone', {})), core_smartphone_extensions + 0)

    def test_inexistent_module(self):

        settings.WIRECLOUD_PLUGINS = ('inexistent.module.WirecloudTestPlugin1',)

        self.assertRaises(ImproperlyConfigured, get_plugins)

    def test_inexistent_plugin(self):

        settings.WIRECLOUD_PLUGINS = ('wirecloud.platform.tests.plugins.InexistentWirecloudTestPlugin',)

        self.assertRaises(ImproperlyConfigured, get_plugins)

    def test_invalid_plugin_entry(self):

        settings.WIRECLOUD_PLUGINS = (5,)

        self.assertRaises(ImproperlyConfigured, get_plugins)

    def test_several_plugins_with_the_same_feature(self):

        settings.WIRECLOUD_PLUGINS = (
            'wirecloud.platform.tests.plugins.WirecloudTestPlugin1',
            'wirecloud.platform.tests.plugins.WirecloudTestConflictingPlugin',
        )

        self.assertRaises(ImproperlyConfigured, get_plugins)

    def test_find_wirecloud_plugins_app_with_extra_import_errors(self):

        with self.settings(INSTALLED_APPS=('wirecloud.platform.tests.module_with_errors',)):
            with patch.multiple('wirecloud.platform.plugins', logger=DEFAULT, import_module=DEFAULT) as mocks:
                mocks['import_module'].side_effect = ImportError('No module named x')
                find_wirecloud_plugins()
                self.assertTrue(mocks['logger'].error.called)

    def test_find_wirecloud_plugins_app_with_syntax_errors(self):

        with self.settings(INSTALLED_APPS=('wirecloud.platform.tests.module_with_errors',)):
            with patch.multiple('wirecloud.platform.plugins', logger=DEFAULT, import_module=DEFAULT) as mocks:
                mocks['import_module'].side_effect = SyntaxError()
                find_wirecloud_plugins()
                self.assertTrue(mocks['logger'].error.called)

    def test_find_wirecloud_plugins_app_with_name_errors(self):

        with self.settings(INSTALLED_APPS=('wirecloud.platform.tests.module_with_errors',)):
            with patch.multiple('wirecloud.platform.plugins', logger=DEFAULT, import_module=DEFAULT) as mocks:
                mocks['import_module'].side_effect = NameError()
                find_wirecloud_plugins()
                self.assertTrue(mocks['logger'].error.called)


class CorePluginTestCase(TestCase):

    tags = ('wirecloud-plugins', 'wirecloud-core-plugin', 'wirecloud-noselenium')

    @classmethod
    def setUpClass(cls):
        super(CorePluginTestCase, cls).setUpClass()
        cls.plugin = WirecloudCorePlugin()

    @override_settings(INSTALLED_APPS=[])
    def test_get_ajax_endpoints(self):
        self.assertEqual(type(self.plugin.get_ajax_endpoints("classic")), tuple)

    @override_settings(INSTALLED_APPS=["django.contrib.admin"])
    def test_get_ajax_endpoints_admin(self):
        endpoints = self.plugin.get_ajax_endpoints("classic")
        self.assertEqual(type(endpoints), tuple)

    def test_get_constants(self):
        self.assertEqual(type(self.plugin.get_constants()), dict)

    def test_get_market_classes(self):
        self.assertEqual(type(self.plugin.get_market_classes()), dict)

    def test_get_platform_context_definitions(self):
        self.assertEqual(type(self.plugin.get_platform_context_definitions()), dict)

    def test_get_platform_context_current_values_anonymous(self):
        user = Mock(
            is_authenticated=False,
            is_anonymous=True,
            email="myemail@example.com",
            groups=Mock(
                values_list=Mock(return_value=[]),
                filter=Mock(return_value=Mock(values_list=Mock(return_value=[])))
            )
        )
        session = None
        context = self.plugin.get_platform_context_current_values(user, session)
        self.assertEqual(type(context), dict)
        self.assertTrue(context['isanonymous'])
        self.assertEqual(context['groups'], ())
        self.assertEqual(context['realuser'], None)

    def test_get_platform_context_current_values_authenticated(self):
        user = Mock(
            is_authenticated=True,
            is_anonymous=False,
            email="myemail@example.com",
            groups=Mock(
                values_list=Mock(return_value=["group1", "group2", "org1"]),
                filter=Mock(return_value=Mock(values_list=Mock(return_value=["org1"])))
            )
        )
        session = None
        context = self.plugin.get_platform_context_current_values(user, session)
        self.assertEqual(type(context), dict)
        self.assertFalse(context['isanonymous'])
        self.assertEqual(context['groups'], ("group1", "group2", "org1"))
        self.assertEqual(context['organizations'], ("org1",))
        self.assertEqual(context['realuser'], None)

    def test_get_platform_context_current_values_realuser(self):
        user = Mock(
            is_authenticated=False,
            is_anonymous=True,
            email="myemail@example.com",
            groups=Mock(
                values_list=Mock(return_value=[]),
                filter=Mock(return_value=Mock(values_list=Mock(return_value=[])))
            )
        )
        session = {"realuser": "admin"}
        context = self.plugin.get_platform_context_current_values(user, session)
        self.assertEqual(type(context), dict)
        self.assertEqual(context['realuser'], "admin")

    @parameterized.expand([
        ("classic"),
        ("embedded"),
        ("smartphone"),
        ("other"),
    ])
    def test_get_platform_css(self, view):
        self.assertIn(type(self.plugin.get_platform_css(view)), (tuple, list))

    @patch("wirecloud.platform.core.plugins.Workspace")
    @patch("wirecloud.platform.core.plugins.CatalogueResource")
    def test_populate_up_to_date(self, CatalogueResource, Workspace):
        user = Mock()
        log = Mock()
        CatalogueResource.objects.filter().exists.return_value = True
        Workspace.objects.filter().exists.return_value = True
        self.assertFalse(self.plugin.populate(user, log))

    @patch("wirecloud.platform.core.plugins.create_workspace")
    @patch("wirecloud.platform.core.plugins.install_component")
    @patch("wirecloud.platform.core.plugins.Workspace")
    @patch("wirecloud.platform.core.plugins.IWidget")
    @patch("wirecloud.platform.core.plugins.CatalogueResource")
    def test_populate_out_of_date(self, CatalogueResource, IWidget, Workspace, install_component, create_workspace):
        user = Mock()
        log = Mock()
        CatalogueResource.objects.filter().exists.return_value = False
        Workspace.objects.filter().exists.return_value = False
        install_component.return_value = (True, Mock())
        self.assertTrue(self.plugin.populate(user, log))

    def test_get_proxy_processors(self):
        self.assertIn(type(self.plugin.get_proxy_processors()), (tuple, list))

    @parameterized.expand([
        ("classic"),
        ("embedded"),
        ("smartphone"),
        ("other"),
    ])
    def test_get_scripts_classic(self, view):
        self.assertIn(type(self.plugin.get_scripts(view)), (tuple, list))

    def test_get_tab_preferences(self):
        self.assertEqual(type(self.plugin.get_tab_preferences()), list)

    def test_get_templates_classic(self):
        self.assertEqual(type(self.plugin.get_templates("classic")), list)

    def test_get_templates_embedded(self):
        self.assertEqual(type(self.plugin.get_templates("embedded")), list)

    def test_get_templates_smartphone(self):
        self.assertEqual(type(self.plugin.get_templates("smartphone")), list)

    def test_get_workspace_preferences(self):
        self.assertEqual(type(self.plugin.get_workspace_preferences()), list)

    def test_get_workspace_context_definitions(self):
        self.assertEqual(type(self.plugin.get_workspace_context_definitions()), dict)

    def test_get_workspace_context_current_values(self):
        user = Mock()
        workspace = Mock(name="myworkspace", owner=Mock(username="owner"))
        context = self.plugin.get_workspace_context_current_values(workspace, user)
        self.assertEqual(type(context), dict)

    def test_get_widget_api_extensions_no_feature(self):
        scripts = self.plugin.get_widget_api_extensions("classic", [])
        self.assertEqual(scripts, ['js/WirecloudAPI/StyledElements.js'])

    def test_get_widget_api_extensions_feature(self):
        scripts = self.plugin.get_widget_api_extensions("classic", ["DashboardManagement", "ComponentManagement"])
        self.assertEqual(scripts, ['js/WirecloudAPI/StyledElements.js', 'js/WirecloudAPI/DashboardManagementAPI.js', 'js/WirecloudAPI/ComponentManagementAPI.js'])

    def test_get_operator_api_extensions_no_feature(self):
        scripts = self.plugin.get_operator_api_extensions("classic", [])
        self.assertEqual(scripts, [])

    def test_get_operator_api_extensions_feature(self):
        scripts = self.plugin.get_operator_api_extensions("classic", ["DashboardManagement", "ComponentManagement"])
        self.assertEqual(scripts, ['js/WirecloudAPI/DashboardManagementAPI.js', 'js/WirecloudAPI/ComponentManagementAPI.js'])
