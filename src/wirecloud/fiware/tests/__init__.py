from wirecloud.commons.utils.testcases import build_selenium_test_cases

from wirecloud.fiware.tests.marketplace import MarketplaceTestCase
from wirecloud.fiware.tests.store import StoreTestCase

build_selenium_test_cases(('wirecloud.fiware.tests.selenium.FiWareSeleniumTestCase',), locals())
