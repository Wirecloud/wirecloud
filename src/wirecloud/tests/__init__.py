from proxy.tests import ProxyTests, ProxySecureDataTests
from wirecloud.tests.plugins import WirecloudPluginTestCase
from wirecloud.wiring.tests import WiringTestCase

from commons.test import build_selenium_test_cases

build_selenium_test_cases(('wirecloud.tests.selenium_tests.BasicSeleniumTests',), locals())
