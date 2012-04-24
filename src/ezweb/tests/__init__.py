from proxy.tests import ProxyTests, ProxySecureDataTests
from ezweb.tests.plugins import WirecloudPluginTestCase

from commons.test import build_selenium_test_cases

build_selenium_test_cases(('ezweb.tests.selenium_tests.BasicSeleniumTests',), locals())
