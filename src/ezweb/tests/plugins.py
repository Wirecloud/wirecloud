from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils import unittest

from ezweb.plugins import get_plugins, WirecloudPlugin

try:
    from djangosanetesting.cases import UnitTestCase
except:
    class UnitTestCase(unittest.TestCase):
        pass


# Avoid nose to repeat these tests (they are run through ezweb/tests/__init__.py)
__test__ = False



class WirecloudTestPlugin1(WirecloudPlugin):
    feautes = {
        'feature1': '0.1',
    }


class WirecloudTestPlugin2(WirecloudPlugin):
    feautes = {
        'feature1': '0.2',
    }


class WirecloudPluginTestCase(UnitTestCase):

    def setUp(self):
        self.OLD_WIRECLOUD_PLUGINS = getattr(settings, 'WIRECLOUD_PLUGINS' , ())
        super(WirecloudPluginTestCase, self).setUp()

    def tearDown(self):
        settings.WIRECLOUD_PLUGINS = self.OLD_WIRECLOUD_PLUGINS
        super(WirecloudPluginTestCase, self).tearDown()

    def test_basic_conf(self):
        settings.WIRECLOUD_PLUGINS = (
            'WirecloudTestPlugin1',
        )

        self.assertEqual(len(get_plugins()), 1)

    def test_several_plugins_with_the_same_feature(self):
        settings.WIRECLOUD_PLUGINS = (
            'WirecloudTestPlugin1',
            'WirecloudTestPlugin2',
        )

        self.assertRaises(ImproperlyConfigured, get_plugins)
