# -*- coding: utf-8 -*-

# Copyright 2012-2013 Universidad Politécnica de Madrid

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

from django.utils.translation import ugettext_lazy as _

import wirecloud.platform
from wirecloud.platform.core.catalogue_manager import WirecloudCatalogueManager
from wirecloud.platform.plugins import WirecloudPlugin, build_url_template


WORKSPACE_CSS = (
    'css/workspace/iwidget.css',
    'css/workspace/empty_workspace_message.css',
)

CATALOGUE_CSS = (
    'css/catalogue/emptyCatalogueBox.css',
)

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
    'js/wirecloud/ui/WiringEditor/GenericInterfaceSettingsMenuItems.js',
)

STYLED_ELEMENTS_FILES = (
    'js/StyledElements/Addon.js',
    'js/StyledElements/Fragment.js',
    'js/StyledElements/Pagination.js',
    'js/StyledElements/Button.js',
    'js/StyledElements/PopupMenuBase.js',
    'js/StyledElements/PopupMenu.js',
    'js/StyledElements/MenuItem.js',
    'js/StyledElements/SubMenuItem.js',
    'js/StyledElements/PopupButton.js',
    'js/StyledElements/StaticPaginatedSource.js',
    'js/StyledElements/TextField.js',
    'js/StyledElements/TextArea.js',
    'js/StyledElements/StyledList.js',
    'js/StyledElements/PasswordField.js',
    'js/StyledElements/Select.js',
    'js/StyledElements/ToggleButton.js',
    'js/StyledElements/StyledNotebook.js',
    'js/StyledElements/Alternatives.js',
    'js/StyledElements/HorizontalLayout.js',
    'js/StyledElements/BorderLayout.js',
    'js/StyledElements/ModelTable.js',
    'js/StyledElements/EditableElement.js',
    'js/StyledElements/InputInterfaces.js',
    'js/StyledElements/Form.js',
    'js/StyledElements/GUIBuilder.js',
)

BASE_CSS = (
    'css/base/fade.css',
)

WIRING_EDITOR_CSS = (
    'css/wiring/editor.css',
    'css/wiring/anchor.css',
    'css/wiring/arrow.css',
    'css/wiring/entities.css',
    'css/wiring/multiconnector.css',
    'css/wiring/emptyWiringBox.css',
)

STYLED_ELEMENTS_CSS = (
    'css/styled_elements_core.css',
    'css/styledelements/styled_addon.css',
    'css/styledelements/styled_button.css',
    'css/styledelements/styled_notebook.css',
    'css/styledelements/styled_form.css',
    'css/styledelements/styled_text_field.css',
    'css/styledelements/styled_text_area.css',
    'css/styledelements/styled_password_field.css',
    'css/styledelements/styled_select.css',
    'css/styledelements/styled_horizontal_layout.css',
    'css/styledelements/styled_table.css',
    'css/styledelements/styled_label_badge.css',
    'css/styledelements/styled_message.css',
    'css/styledelements/styled_rating.css',
    'css/styledelements/styled_popup_menu.css',
)


class WirecloudCorePlugin(WirecloudPlugin):

    features = {
        'Wirecloud': wirecloud.platform.__version__,
        'ApplicationMashup': '1.0',
        'StyledElements': '0.5',
    }

    def get_platform_context_definitions(self):
        return {
            'language': {
                'label': _('Language'),
                'description': _('Current language used in the platform'),
            },
            'username': {
                'label': _('Username'),
                'description': _('User name of the current logged user'),
            },
            'isstaff': {
                'label': _('Is Staff'),
                'description': _('Boolean. Designates whether current user can access the admin site.'),
            },
            'orientation': {
                'label': _('Orientation'),
                'description': _('Current screen orientation'),
            },
            'theme': {
                'label': _('Theme'),
                'description': _('Name of the theme used by the platform'),
            },
        }

    def get_platform_context_current_values(self, user):
        from django.conf import settings

        return {
            'language': 'es',
            'orientation': 'landscape',
            'username': user.username,
            'isstaff': user.is_staff,
            'theme': settings.THEME_ACTIVE
        }

    def get_workspace_context_definitions(self):
        return {
            'name': {
                'label': _('Name'),
                'description': _('Current name of the workspace'),
            },
        }

    def get_workspace_context_current_values(self, user_workspace):
        return {
            'name': user_workspace.workspace.name
        }

    def get_scripts(self, view):
        common = (
            'js/wirecloud/io.js',
            'js/wirecloud/ContextManager.js',
            'js/wirecloud/UserPref.js',
            'js/wirecloud/IWidget.js',
            'js/wirecloud/PolicyManager.js',
            'js/wirecloud/Wiring.js',
            'js/gadgetModel/Gadget.js',
        ) + STYLED_ELEMENTS_FILES + (
            'js/wirecloud/ui/IWidgetResizeHandle.js',
            'js/wirecloud/ui/IWidgetView.js',
            'js/wirecloud/ui/Draggable.js',
            'js/wirecloud/ui/Theme.js',
            'js/wirecloud/WirecloudCatalogue.js',
            'js/log/LogManager.js',
            'js/wirecloud/LocalCatalogue.js',
            'js/wirecloud/wiring/OperatorFactory.js',
            'js/wirecloud/wiring/OperatorUserPref.js',
            'js/wirecloud/wiring/Operator.js',
            'js/wirecloud/wiring/OperatorMeta.js',
            'js/wirecloud/wiring/OperatorSourceEndpoint.js',
            'js/wirecloud/wiring/OperatorTargetEndpoint.js',
        )

        if view == 'index':
            return common + (
                'js/dragboard/dragboard.js',
                'js/wirecloud/utils/CookieManager.js',
                'js/wirecloud/MarketManager.js',
                'js/wirecloud/ui/MarketplaceViewMenuItems.js',
                'js/catalogue/ResourceDetailsView.js',
                'js/wirecloud/ui/ResourcePainter.js',
                'js/wirecloud/ui/WirecloudCatalogue/PublishView.js',
                'js/wirecloud/ui/WindowMenu.js',
                'js/wirecloud/ui/AlertWindowMenu.js',
                'js/dragboard/PreferencesWindowMenu.js',
                'js/wirecloud/ui/InstantiateMashupWindowMenu.js',
                'js/wirecloud/ui/FormWindowMenu.js',
                'js/wirecloud/ui/MessageWindowMenu.js',
                'js/wirecloud/ui/NewWorkspaceWindowMenu.js',
                'js/wirecloud/ui/ParametrizeWindowMenu.js',
                'js/wirecloud/ui/PreferencesWindowMenu.js',
                'js/wirecloud/ui/OperatorPreferencesWindowMenu.js',
                'js/wirecloud/ui/PublishWorkspaceWindowMenu.js',
                'js/wirecloud/ui/PublishResourceWindowMenu.js',
                'js/wirecloud/ui/RenameWindowMenu.js',
            ) + WIRING_EDITOR_FILES
        else:
            return common

    def get_market_classes(self):
        return {
            'wirecloud': WirecloudCatalogueManager,
        }

    def get_templates(self, view):
        if view == 'index':
            return {
                "iwidget": "wirecloud/ui/iwidget.html",
                "window_menu": "wirecloud/ui/window_menu.html",
                "wirecloud_catalogue_search_interface": "wirecloud/catalogue/search_interface.html",
                "wirecloud_wiring_template": "wirecloud/wiring.html",
                "catalogue_resource_template": "wirecloud/catalogue/resource.html",
                "catalogue_main_resource_details_template": "wirecloud/catalogue/main_resource_details.html",
                "catalogue_resource_details_template": "wirecloud/catalogue/resource_details.html",
                "wirecloud_catalogue_publish_interface": "wirecloud/catalogue/developers.html",
                "wirecloud_logs_template": "wirecloud/logs.html",
            }
        else:
            return {}

    def get_ajax_endpoints(self, view):
        endpoints = (
            {'id': 'LOCAL_REPOSITORY', 'url': build_url_template('wirecloud.root')},
            {'id': 'LOCAL_RESOURCE_COLLECTION', 'url': build_url_template('wirecloud_showcase.resource_collection')},
            {'id': 'LOCAL_RESOURCE_ENTRY', 'url': build_url_template('wirecloud_showcase.resource_entry', ['vendor', 'name', 'version'])},
            {'id': 'IWIDGET_COLLECTION', 'url': build_url_template('wirecloud.iwidget_collection', ['workspace_id', 'tab_id'])},
            {'id': 'IWIDGET_ENTRY', 'url': build_url_template('wirecloud.iwidget_entry', ['workspace_id', 'tab_id', 'iwidget_id'])},
            {'id': 'IWIDGET_VERSION_ENTRY', 'url': build_url_template('wirecloud.iwidget_version_entry', ['workspace_id', 'tab_id', 'iwidget_id'])},
            {'id': 'PLATFORM_CONTEXT_COLLECTION', 'url': build_url_template('wirecloud.platform_context_collection')},
            {'id': 'PLATFORM_PREFERENCES', 'url': build_url_template('wirecloud.platform_preferences')},
            {'id': 'PROXY', 'url': build_url_template('wirecloud.proxy', ['protocol', 'domain', 'path'])},
            {'id': 'WORKSPACE_PREFERENCES', 'url': build_url_template('wirecloud.workspace_preferences', ['workspace_id'])},
            {'id': 'TAB_COLLECTION', 'url': build_url_template('wirecloud.tab_collection', ['workspace_id'])},
            {'id': 'TAB_ENTRY', 'url': build_url_template('wirecloud.tab_entry', ['workspace_id', 'tab_id'])},
            {'id': 'TAB_PREFERENCES', 'url': build_url_template('wirecloud.tab_preferences', ['workspace_id', 'tab_id'])},
            {'id': 'THEME_ENTRY', 'url': build_url_template('wirecloud.theme_entry', ['name'])},
            {'id': 'MARKET_COLLECTION', 'url': build_url_template('wirecloud.market_collection')},
            {'id': 'GLOBAL_MARKET_ENTRY', 'url': build_url_template('wirecloud.market_entry', ['market'])},
            {'id': 'MARKET_ENTRY', 'url': build_url_template('wirecloud.market_entry', ['user', 'market'])},
            {'id': 'WIRING_ENTRY', 'url': build_url_template('wirecloud.workspace_wiring', ['workspace_id'])},
            {'id': 'OPERATOR_ENTRY', 'url': build_url_template('wirecloud.operator_code_entry', ['vendor', 'name', 'version'])},
            {'id': 'VARIABLE_COLLECTION', 'url': build_url_template('wirecloud.variable_collection', ['workspace_id'])},
            {'id': 'WIDGET_CODE_ENTRY', 'url': build_url_template('wirecloud.widget_code_entry', ['vendor', 'name', 'version'])},
            {'id': 'WORKSPACE_COLLECTION', 'url': build_url_template('wirecloud.workspace_collection')},
            {'id': 'WORKSPACE_ENTRY', 'url': build_url_template('wirecloud.workspace_entry', ['workspace_id'])},
            {'id': 'WORKSPACE_PUBLISH', 'url': build_url_template('wirecloud.workspace_publish', ['workspace_id'])},
            {'id': 'PUBLISH_ON_OTHER_MARKETPLACE', 'url': build_url_template('wirecloud.publish_on_other_marketplace')},
            {'id': 'WORKSPACE_MERGE', 'url': build_url_template('wirecloud.workspace_merge', ['to_ws_id'])},
            {'id': 'WORKSPACE_MERGE_LOCAL', 'url': build_url_template('wirecloud.workspace_merge_local', ['from_ws_id', 'to_ws_id'])},
            {'id': 'WORKSPACE_SHARE', 'url': build_url_template('wirecloud.workspace_share', ['workspace_id', 'share_boolean'])},
        )

        from django.conf import settings
        if 'django.contrib.admin' in settings.INSTALLED_APPS:
            endpoints += ({'id': 'DJANGO_ADMIN', 'url': build_url_template('admin:index')},)

        return endpoints

    def get_platform_css(self, view):
        common = BASE_CSS + STYLED_ELEMENTS_CSS

        if view == 'index':
            return common + WORKSPACE_CSS + WIRING_EDITOR_CSS + CATALOGUE_CSS
        else:
            return common

    def get_widget_api_extensions(self, view):
        return (
            'js/WirecloudAPI/StyledElements.js',
        )
