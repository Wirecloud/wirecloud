from proxy.tests import ProxyTests, ProxySecureDataTests
from wirecloud.tests.plugins import WirecloudPluginTestCase
from wirecloud.wiring.tests import WiringTestCase
from wirecloud.widget.tests import ShowcaseTestCase, WGTShowcaseTestCase
from wirecloud.workspace.tests import WorkspaceTestCase, WorkspaceCacheTestCase, ParametrizedWorkspaceParseTestCase, ParamatrizedWorkspaceGenerationTestCase


from commons.test import build_selenium_test_cases

build_selenium_test_cases(('wirecloud.tests.selenium_tests.BasicSeleniumTests',), locals())
