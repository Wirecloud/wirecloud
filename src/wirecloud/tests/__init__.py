from wirecloud.proxy.tests import ProxyTests, ProxySecureDataTests
from wirecloud.tests.plugins import WirecloudPluginTestCase
from wirecloud.wiring.tests import WiringTestCase
from wirecloud.widget.tests import CodeTransformationTestCase, ShowcaseTestCase, WGTShowcaseTestCase
from wirecloud.workspace.tests import WorkspaceTestCase, WorkspaceCacheTestCase, ParameterizedWorkspaceParseTestCase, ParameterizedWorkspaceGenerationTestCase

from wirecloudcommons.test import build_selenium_test_cases

build_selenium_test_cases(('wirecloud.tests.selenium_tests.BasicSeleniumTests',), locals())
build_selenium_test_cases(('wirecloud.wiring.tests.WiringSeleniumTestCase',), locals())
build_selenium_test_cases(('wirecloud.markets.tests.MarketManagementTestCase',), locals())
