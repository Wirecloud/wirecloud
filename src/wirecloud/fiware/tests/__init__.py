from wirecloud.commons.utils.testcases import build_selenium_test_cases

from wirecloud.fiware.tests.marketplace import MarketplaceTestCase
from wirecloud.fiware.tests.store import StoreTestCase
from wirecloud.fiware.tests.proxy import ProxyTestCase

build_selenium_test_cases(('wirecloud.fiware.tests.selenium.FiWareSeleniumTestCase',), locals())
