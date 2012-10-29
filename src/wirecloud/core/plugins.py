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

import wirecloud
from wirecloud.plugins import WirecloudPlugin, build_url_template

from wirecloud.core.catalogue_manager import WirecloudCatalogueManager


WIRING_EDITOR_FILES = (
    'js/wirecloud/ui/WiringEditor.js',
    'js/wirecloud/ui/WiringEditor/Anchor.js',
    'js/wirecloud/ui/WiringEditor/Arrow.js',
    'js/wirecloud/ui/WiringEditor/ArrowCreator.js',
    'js/wirecloud/ui/WiringEditor/Canvas.js',
    'js/wirecloud/ui/WiringEditor/GenericInterface.js',
    'js/wirecloud/ui/WiringEditor/WidgetInterface.js',
    'js/wirecloud/ui/WiringEditor/OperatorInterface.js',
    'js/wirecloud/ui/WiringEditor/SourceAnchor.js',
    'js/wirecloud/ui/WiringEditor/TargetAnchor.js',
    'js/wirecloud/ui/WiringEditor/Multiconnector.js',
)

WIRING_EDITOR_CSS = (
    'css/wiring/editor.css',
    'css/wiring/anchor.css',
    'css/wiring/arrow.css',
    'css/wiring/entities.css',
    'css/wiring/multiconnector.css',
)

STYLED_ELEMENTS_CSS = (
    'css/styled_elements_core.css',
    'css/styledelements/styled_button.css',
    'css/styledelements/styled_notebook.css',
    'css/styledelements/styled_text_field.css',
    'css/styledelements/styled_password_field.css',
    'css/styledelements/styled_select.css',
    'css/styledelements/styled_horizontal_layout.css',
)


class WirecloudCorePlugin(WirecloudPlugin):

    features = {
        'Wirecloud': wirecloud.__version__,
    }

    def get_scripts(self, view):
        common = (
            'js/wirecloud/PolicyManager.js',
            'js/StyledElements/Fragment.js',
            'js/StyledElements/Pagination.js',
            'js/StyledElements/TextField.js',
            'js/StyledElements/PasswordField.js',
            'js/StyledElements/Select.js',
            'js/StyledElements/ToggleButton.js',
            'js/StyledElements/StyledNotebook.js',
            'js/StyledElements/HorizontalLayout.js',
            'js/StyledElements/BorderLayout.js',
            'js/gadgetModel/Gadget.js',
        )

        if view == 'index':
            return common + (
                'js/wirecloud/utils/CookieManager.js',
                'js/wirecloud/WirecloudCatalogue.js',
                'js/wirecloud/MarketManager.js',
                'js/wirecloud/ui/ResourcePainter.js',
                'js/wirecloud/ui/WirecloudCatalogue/PublishView.js',
                'js/wirecloud/ui/FormWindowMenu.js',
                'js/wirecloud/ui/NewWorkspaceWindowMenu.js',
                'js/wirecloud/ui/ParametrizeWindowMenu.js',
                'js/wirecloud/ui/PublishWindowMenu.js',
                'js/wirecloud/ui/RenameWindowMenu.js',
            ) + WIRING_EDITOR_FILES
        else:
            return common

    def get_market_classes(self):
        return {
            'wirecloud': WirecloudCatalogueManager,
        }

    def get_ajax_endpoints(self, views):
        return (
            {'id': 'ADD_WORKSPACE', 'url': build_url_template('wirecloud.workspace_import')},
            {'id': 'LOCAL_REPOSITORY', 'url': build_url_template('wirecloud.root')},
            {'id': 'IWIDGET_COLLECTION', 'url': build_url_template('wirecloud.iwidget_collection', ['workspace_id', 'tab_id'])},
            {'id': 'IWIDGET_ENTRY', 'url': build_url_template('wirecloud.iwidget_entry', ['workspace_id', 'tab_id', 'iwidget_id'])},
            {'id': 'IWIDGET_VERSION_ENTRY', 'url': build_url_template('wirecloud.iwidget_version_entry', ['workspace_id', 'tab_id', 'iwidget_id'])},
            {'id': 'PLATFORM_PREFERENCES', 'url': build_url_template('wirecloud.platform_preferences')},
            {'id': 'WORKSPACE_PREFERENCES', 'url': build_url_template('wirecloud.workspace_preferences', ['workspace_id'])},
            {'id': 'TAB_COLLECTION', 'url': build_url_template('wirecloud.tab_collection', ['workspace_id'])},
            {'id': 'TAB_ENTRY', 'url': build_url_template('wirecloud.tab_entry', ['workspace_id', 'tab_id'])},
            {'id': 'TAB_PREFERENCES', 'url': build_url_template('wirecloud.tab_preferences', ['workspace_id', 'tab_id'])},
            {'id': 'MARKET_COLLECTION', 'url': '/api/markets'},
            {'id': 'MARKET_ENTRY', 'url': '/api/market/#{market}'},
            {'id': 'WIRING_ENTRY', 'url': build_url_template('wirecloud.workspace_wiring', ['workspace_id'])},
            {'id': 'OPERATOR_COLLECTION', 'url': build_url_template('wirecloud.operators')},
            {'id': 'OPERATOR_ENTRY', 'url': build_url_template('wirecloud.operator_code_entry', ['vendor', 'name', 'version'])},
            {'id': 'VARIABLE_COLLECTION', 'url': build_url_template('wirecloud.variable_collection', ['workspace_id'])},
            {'id': 'WIDGET_COLLECTION', 'url': build_url_template('wirecloud.widget_collection')},
            {'id': 'WIDGET_ENTRY', 'url': build_url_template('wirecloud.widget_entry', ['vendor', 'name', 'version'])},
            {'id': 'WIDGET_CODE_ENTRY', 'url': build_url_template('wirecloud.widget_code_entry', ['vendor', 'name', 'version'])},
            {'id': 'WORKSPACE_COLLECTION', 'url': build_url_template('wirecloud.workspace_collection')},
            {'id': 'WORKSPACE_ENTRY', 'url': build_url_template('wirecloud.workspace_entry', ['workspace_id'])},
            {'id': 'WORKSPACE_PUBLISH', 'url': build_url_template('wirecloud.workspace_publish', ['workspace_id'])},
            {'id': 'WORKSPACE_MERGE', 'url': build_url_template('wirecloud.workspace_merge', ['to_ws_id'])},
            {'id': 'WORKSPACE_MERGE_LOCAL', 'url': build_url_template('wirecloud.workspace_merge_local', ['from_ws_id', 'to_ws_id'])},
            {'id': 'WORKSPACE_SHARE', 'url': build_url_template('wirecloud.workspace_share', ['workspace_id', 'share_boolean'])},
        )

    def get_platform_css(self, view):
        common = STYLED_ELEMENTS_CSS

        if view == 'index':
            return common + WIRING_EDITOR_CSS
        else:
            return common
