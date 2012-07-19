from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils import unittest

from wirecloud.plugins import clear_cache, get_active_features, get_plugins, \
    get_extra_javascripts, get_gadget_api_extensions, WirecloudPlugin

try:
    from djangosanetesting.cases import UnitTestCase
except:
    class UnitTestCase(unittest.TestCase):
        pass


# Avoid nose to repeat these tests (they are run through wirecloud/tests/__init__.py)
__test__ = False


class WirecloudTestPlugin1(WirecloudPlugin):

    features = {
        'feature1': '0.1',
    }

    def get_scripts(view):
        if view == 'index':
            return ('a.js', 'b.js')
        else:
            return ('a.js',)

    def get_gadget_api_extensions(view):
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


class WirecloudPluginTestCase(UnitTestCase):

    def setUp(self):
        self.OLD_WIRECLOUD_PLUGINS = getattr(settings, 'WIRECLOUD_PLUGINS', ())
        super(WirecloudPluginTestCase, self).setUp()

    def tearDown(self):
        settings.WIRECLOUD_PLUGINS = self.OLD_WIRECLOUD_PLUGINS
        super(WirecloudPluginTestCase, self).tearDown()

    def test_basic_conf(self):
        settings.WIRECLOUD_PLUGINS = (
            'WirecloudTestPlugin1',
            'WirecloudTestPlugin2',
        )
        clear_cache()

        self.assertEqual(len(get_plugins()), 2)
        self.assertEqual(len(get_active_features()), 3)
        self.assertEqual(len(get_extra_javascripts('index')), 2)
        self.assertEqual(len(get_extra_javascripts('iphone')), 1)
        self.assertEqual(len(get_gadget_api_extensions('index')), 2)
        self.assertEqual(len(get_gadget_api_extensions('iphone')), 1)

    def test_several_plugins_with_the_same_feature(self):
        settings.WIRECLOUD_PLUGINS = (
            'WirecloudTestPlugin1',
            'WirecloudTestConflictingPlugin',
        )
        clear_cache()

        self.assertRaises(ImproperlyConfigured, get_plugins)
