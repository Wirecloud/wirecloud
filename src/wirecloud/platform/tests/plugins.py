# -*- coding: utf-8 -*-

# Copyright 2012-2013 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.


from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.unittest import TestCase

from wirecloud.platform.plugins import clear_cache, get_active_features, get_plugins, \
    get_extra_javascripts, get_widget_api_extensions, WirecloudPlugin


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


class WirecloudTestPlugin1(WirecloudPlugin):

    features = {
        'feature1': '0.1',
    }

    def get_scripts(self, view):
        if view == 'index':
            return ('a.js', 'b.js')
        else:
            return ('a.js',)

    def get_widget_api_extensions(self, view):
        if view == 'index':
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

    @classmethod
    def setUpClass(cls):
        cls.OLD_WIRECLOUD_PLUGINS = getattr(settings, 'WIRECLOUD_PLUGINS', None)
        super(WirecloudPluginTestCase, cls).setUpClass()

    @classmethod
    def tearDown(cls):
        settings.WIRECLOUD_PLUGINS = cls.OLD_WIRECLOUD_PLUGINS
        clear_cache()
        super(WirecloudPluginTestCase, cls).tearDownClass()

    def test_basic_conf(self):

        settings.WIRECLOUD_PLUGINS = ()
        clear_cache()

        core_plugins = len(get_plugins())
        core_features = len(get_active_features())
        core_index_javascripts = len(get_extra_javascripts('index'))
        core_iphone_javascripts = len(get_extra_javascripts('iphone'))
        core_index_extensions = len(get_widget_api_extensions('index'))
        core_iphone_extensions = len(get_widget_api_extensions('iphone'))

        settings.WIRECLOUD_PLUGINS = (
            'wirecloud.platform.tests.plugins.WirecloudTestPlugin1',
            'wirecloud.platform.tests.plugins.WirecloudTestPlugin2',
        )
        clear_cache()

        self.assertEqual(len(get_plugins()), core_plugins + 2)
        self.assertEqual(len(get_active_features()), core_features + 2)
        self.assertEqual(len(get_extra_javascripts('index')), core_index_javascripts + 2)
        self.assertEqual(len(get_extra_javascripts('iphone')), core_iphone_javascripts + 1)
        self.assertEqual(len(get_widget_api_extensions('index')), core_index_extensions + 1)
        self.assertEqual(len(get_widget_api_extensions('iphone')), core_iphone_extensions + 0)

    def test_several_plugins_with_the_same_feature(self):
        settings.WIRECLOUD_PLUGINS = (
            'wirecloud.platform.tests.plugins.WirecloudTestPlugin1',
            'wirecloud.platform.tests.plugins.WirecloudTestConflictingPlugin',
        )
        clear_cache()

        self.assertRaises(ImproperlyConfigured, get_plugins)
