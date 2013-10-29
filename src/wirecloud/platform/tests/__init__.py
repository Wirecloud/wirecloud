# -*- coding: utf-8 -*-

# Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.


from wirecloud.platform.tests.base import BasicViewsAPI
from wirecloud.platform.tests.plugins import WirecloudPluginTestCase
from wirecloud.platform.tests.rest_api import ApplicationMashupAPI, ResourceManagementAPI, ExtraApplicationMashupAPI
from wirecloud.platform.localcatalogue.tests import LocalCatalogueTestCase, PackagedResourcesTestCase
from wirecloud.platform.wiring.tests import WiringTestCase, OperatorCodeEntryTestCase
from wirecloud.platform.widget.tests import CodeTransformationTestCase
from wirecloud.platform.workspace.tests import WorkspaceTestCase, WorkspaceCacheTestCase, ParameterizedWorkspaceParseTestCase, ParameterizedWorkspaceGenerationTestCase
from wirecloud.proxy.tests import ProxyTests, ProxySecureDataTests

from wirecloud.commons.utils.testcases import build_selenium_test_cases

build_selenium_test_cases(('wirecloud.platform.tests.selenium_tests.BasicSeleniumTests',), locals())
build_selenium_test_cases(('wirecloud.platform.localcatalogue.tests.LocalCatalogueSeleniumTests',), locals())
build_selenium_test_cases(('wirecloud.platform.wiring.tests.WiringSeleniumTestCase',), locals())
build_selenium_test_cases(('wirecloud.platform.wiring.tests.WiringRecoveringTestCase',), locals())
build_selenium_test_cases(('wirecloud.platform.wiring.tests.WiringGhostTestCase',), locals())
build_selenium_test_cases(('wirecloud.platform.wiring.tests.EndpointOrderTestCase',), locals())
build_selenium_test_cases(('wirecloud.platform.wiring.tests.MulticonnectorTestCase',), locals())
build_selenium_test_cases(('wirecloud.platform.markets.tests.MarketManagementSeleniumTestCase',), locals())
build_selenium_test_cases(('wirecloud.platform.wiring.tests.SimpleRecommendationsTestCase',), locals())
build_selenium_test_cases(('wirecloud.platform.wiring.tests.StickyEffectTestCase',), locals())
