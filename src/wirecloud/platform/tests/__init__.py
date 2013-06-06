from wirecloud.platform.tests.plugins import WirecloudPluginTestCase
from wirecloud.platform.tests.rest_api import ApplicationMashupAPI, ResourceManagementAPI, ExtraApplicationMashupAPI
from wirecloud.platform.localcatalogue.tests import LocalCatalogueTestCase, PackagedResourcesTestCase
from wirecloud.platform.wiring.tests import WiringTestCase
from wirecloud.platform.widget.tests import CodeTransformationTestCase
from wirecloud.platform.workspace.tests import WorkspaceTestCase, WorkspaceCacheTestCase, ParameterizedWorkspaceParseTestCase, ParameterizedWorkspaceGenerationTestCase
from wirecloud.proxy.tests import ProxyTests, ProxySecureDataTests

from wirecloud.commons.test import build_selenium_test_cases

build_selenium_test_cases(('wirecloud.platform.tests.selenium_tests.BasicSeleniumTests',), locals())
build_selenium_test_cases(('wirecloud.platform.localcatalogue.tests.LocalCatalogueSeleniumTests',), locals())
build_selenium_test_cases(('wirecloud.platform.wiring.tests.WiringSeleniumTestCase',), locals())
build_selenium_test_cases(('wirecloud.platform.wiring.tests.WiringRecoveringTestCase',), locals())
build_selenium_test_cases(('wirecloud.platform.markets.tests.MarketManagementSeleniumTestCase',), locals())
