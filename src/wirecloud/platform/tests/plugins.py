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

from unittest.mock import DEFAULT, patch

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.test import TestCase

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

    tags = ('wirecloud-plugins',)

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
