# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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


from wirecloud.platform.tests.base import *  # noqa
from wirecloud.platform.tests.commands import PopuplateCommandTestCase  # noqa
from wirecloud.platform.tests.plugins import WirecloudPluginTestCase  # noqa
from wirecloud.platform.tests.rest_api import AdministrationAPI, ApplicationMashupAPI, ResourceManagementAPI, ExtraApplicationMashupAPI  # noqa
from wirecloud.platform.tests.search_indexes import *  # noqa
from wirecloud.platform.tests.selenium import *  # noqa
from wirecloud.platform.tests.themes import ThemesTestCase  # noqa
from wirecloud.platform.localcatalogue.tests import *  # noqa
from wirecloud.platform.markets.tests import *  # noqa
from wirecloud.platform.wiring.tests import *  # noqa
from wirecloud.platform.widget.tests import CodeTransformationTestCase, WidgetModuleTestCase  # noqa
from wirecloud.platform.workspace.tests import WorkspaceMigrationsTestCase, WorkspaceTestCase, WorkspaceCacheTestCase, ParameterizedWorkspaceParseTestCase, ParameterizedWorkspaceGenerationTestCase  # noqa
from wirecloud.proxy.tests import ProxyTests, ProxySecureDataTests  # noqa
