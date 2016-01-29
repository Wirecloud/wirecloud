# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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


from wirecloud.platform.tests.base import *
from wirecloud.platform.tests.plugins import WirecloudPluginTestCase
from wirecloud.platform.tests.rest_api import AdministrationAPI, ApplicationMashupAPI, ResourceManagementAPI, ExtraApplicationMashupAPI
from wirecloud.platform.tests.selenium_tests import *
from wirecloud.platform.tests.themes import ThemesTestCase
from wirecloud.platform.localcatalogue.tests import *
from wirecloud.platform.markets.tests import *
from wirecloud.platform.wiring.tests import *
from wirecloud.platform.widget.tests import CodeTransformationTestCase, WidgetModuleTestCase
from wirecloud.platform.workspace.tests import WorkspaceTestCase, WorkspaceCacheTestCase, ParameterizedWorkspaceParseTestCase, ParameterizedWorkspaceGenerationTestCase
from wirecloud.proxy.tests import ProxyTests, ProxySecureDataTests

import django
if django.VERSION[1] < 7:
    from wirecloud.platform.tests.south_migrations import PlatformSouthMigrationsTestCase
