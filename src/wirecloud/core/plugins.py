# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

from django.core.urlresolvers import reverse

from wirecloud import VERSION
from wirecloud.plugins import WirecloudPlugin

from wirecloud.core.catalogue_manager import WirecloudCatalogueManager


class WirecloudCorePlugin(WirecloudPlugin):

    features = {
        'Wirecloud': '.'.join(map(str, VERSION)),
    }

    def get_scripts(self, view):
        if view == 'index':
            return (
                'js/wirecloud/MarketManager.js',
            )
        else:
            return ()

    def get_market_classes(self):
        return {
            'wirecloud': WirecloudCatalogueManager,
        }

    def get_ajax_endpoints(self, views):
        return (
            {'id': 'PLATFORM_PREFERENCES', 'url': reverse('wirecloud.platform_preferences')},
            {'id': 'WORKSPACE_PREFERENCES', 'url': '/api/workspace/#{workspace_id}/preferences'},
            {'id': 'TAB_PREFERENCES', 'url': '/api/workspace/#{workspace_id}/tab/#{tab_id}/preferences'},
            {'id': 'MARKET_COLLECTION', 'url': '/api/markets'},
            {'id': 'MARKET_ENTRY', 'url': '/api/market/#{market}'},
            {'id': 'WIRING_ENTRY', 'url': '/api/workspace/#{id}/wiring'},
            {'id': 'OPERATOR_COLLECTION', 'url': '/api/operators'},
            {'id': 'OPERATOR_ENTRY', 'url': '/api/operator/#{vendor}/#{name}/#{version}/html'},
        )
