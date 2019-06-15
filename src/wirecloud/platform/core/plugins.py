# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2018-2019 Future Internet Consulting and Development Solutions S.L.

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

from copy import deepcopy
from hashlib import md5, sha1
import json
import os

from django.conf import settings
from django.utils.translation import get_language, ugettext_lazy as _

from wirecloud.commons.utils.wgt import WgtFile
import wirecloud.platform
from wirecloud.platform.core.catalogue_manager import WirecloudCatalogueManager
from wirecloud.platform.localcatalogue.utils import install_component
from wirecloud.platform.models import CatalogueResource, IWidget, Workspace
from wirecloud.platform.plugins import build_url_template, get_active_features_info, WirecloudPlugin
from wirecloud.platform.themes import get_active_theme_name
from wirecloud.platform.workspace.utils import create_workspace


WIRING_EDITOR_FILES = (
    'js/wirecloud/ui/WiringEditor.js',
    'js/wirecloud/ui/WiringEditor/Behaviour.js',
    'js/wirecloud/ui/WiringEditor/BehaviourPrefs.js',
    'js/wirecloud/ui/WiringEditor/BehaviourEngine.js',
    'js/wirecloud/ui/WiringEditor/Endpoint.js',
    'js/wirecloud/ui/WiringEditor/EndpointGroup.js',
    'js/wirecloud/ui/WiringEditor/Component.js',
    'js/wirecloud/ui/WiringEditor/ComponentPrefs.js',
    'js/wirecloud/ui/WiringEditor/ComponentGroup.js',
    'js/wirecloud/ui/WiringEditor/ComponentShowcase.js',
    'js/wirecloud/ui/WiringEditor/ComponentDraggable.js',
    'js/wirecloud/ui/WiringEditor/ComponentDraggablePrefs.js',
    'js/wirecloud/ui/WiringEditor/Connection.js',
    'js/wirecloud/ui/WiringEditor/ConnectionPrefs.js',
    'js/wirecloud/ui/WiringEditor/ConnectionHandle.js',
    'js/wirecloud/ui/WiringEditor/ConnectionEngine.js',
    'js/wirecloud/ui/WiringEditor/KeywordSuggestion.js',
)

TUTORIAL_FILES = (
    'js/wirecloud/ui/Tutorial.js',
    'js/wirecloud/ui/Tutorial/Utils.js',
    'js/wirecloud/ui/TutorialCatalogue.js',
    'js/wirecloud/ui/TutorialSubMenu.js',
    'js/wirecloud/ui/Tutorial/PopUp.js',
    'js/wirecloud/ui/Tutorial/SimpleDescription.js',
    'js/wirecloud/ui/Tutorial/UserAction.js',
    'js/wirecloud/ui/Tutorial/FormAction.js',
    'js/wirecloud/ui/Tutorial/AutoAction.js',
    'js/wirecloud/Tutorials/BasicConcepts.js',
    'js/wirecloud/Tutorials/BehaviourOrientedWiring.js',
)

SHIM_FILES = (
    'js/wirecloud/shims/string.js',
    'js/wirecloud/shims/classList.js',
)

STYLED_ELEMENTS_FILES = (
    # 'js/StyledElements/Utils.js', Added on bootstrap.html
    # 'js/StyledElements/ObjectWithEvents.js', Added as common file
    'js/StyledElements/StyledElements.js',
    'js/StyledElements/InputElement.js',
    'js/StyledElements/CommandQueue.js',
    'js/StyledElements/Container.js',
    'js/StyledElements/Accordion.js',
    'js/StyledElements/Expander.js',
    'js/StyledElements/Fragment.js',
    'js/StyledElements/PaginatedSource.js',
    'js/StyledElements/GUIBuilder.js',
    'js/StyledElements/Tooltip.js',
    'js/StyledElements/Addon.js',
    'js/StyledElements/Button.js',
    'js/StyledElements/FileButton.js',
    'js/StyledElements/PopupMenuBase.js',
    'js/StyledElements/PopupMenu.js',
    'js/StyledElements/DynamicMenuItems.js',
    'js/StyledElements/MenuItem.js',
    'js/StyledElements/Separator.js',
    'js/StyledElements/SubMenuItem.js',
    'js/StyledElements/PopupButton.js',
    'js/StyledElements/StaticPaginatedSource.js',
    'js/StyledElements/FileField.js',
    'js/StyledElements/NumericField.js',
    'js/StyledElements/TextField.js',
    'js/StyledElements/TextArea.js',
    'js/StyledElements/List.js',
    'js/StyledElements/PasswordField.js',
    'js/StyledElements/Select.js',
    'js/StyledElements/ToggleButton.js',
    'js/StyledElements/Pills.js',
    'js/StyledElements/Tab.js',
    'js/StyledElements/Notebook.js',
    'js/StyledElements/Alternative.js',
    'js/StyledElements/Alternatives.js',
    'js/StyledElements/HorizontalLayout.js',
    'js/StyledElements/VerticalLayout.js',
    'js/StyledElements/BorderLayout.js',
    'js/StyledElements/ModelTable.js',
    'js/StyledElements/EditableElement.js',
    'js/StyledElements/HiddenField.js',
    'js/StyledElements/ButtonsGroup.js',
    'js/StyledElements/CheckBox.js',
    'js/StyledElements/RadioButton.js',
    'js/StyledElements/InputInterface.js',
    'js/StyledElements/TextInputInterface.js',
    'js/StyledElements/InputInterfaces.js',
    'js/wirecloud/ui/ParametrizableValueInputInterface.js',
    'js/wirecloud/ui/ParametrizedTextInputInterface.js',
    'js/wirecloud/ui/LayoutInputInterface.js',
    'js/StyledElements/VersionInputInterface.js',
    'js/StyledElements/InputInterfaceFactory.js',
    'js/StyledElements/DefaultInputInterfaceFactory.js',
    'js/StyledElements/Form.js',
    'js/StyledElements/PaginationInterface.js',
    'js/StyledElements/Popover.js',
    'js/StyledElements/Panel.js',
    'js/StyledElements/OffCanvasLayout.js',
    'js/StyledElements/Alert.js',
    'js/StyledElements/Typeahead.js',
)


BASE_CSS = (
    'css/fontawesome.min.css',
    'css/fontawesome-v4-shims.min.css',
    'css/base/utils.scss',
    'css/base/body.scss',
    'css/base/fade.css',
    'css/base/slide.scss',
    'css/base/code.scss',
    'css/base/z-depth.scss',
    'css/base/navigation.scss',
)


CLASSIC_CORE_CSS = (
    'css/mac_search.scss',
    'css/layout_field.css',
    'css/mac_field.scss',
    'css/mac_selection_dialog.css',
)


WORKSPACE_CSS = (
    'css/workspace/dragboard.scss',
    'css/workspace/dragboard_cursor.scss',
    'css/workspace/operator.scss',
    'css/workspace/widget.scss',
    'css/workspace/modals/share.scss',
    'css/workspace/modals/upload.scss',
    'css/modals/upgrade_downgrade_component.scss',
    'css/modals/embed_code.scss',
)


CATALOGUE_CSS = (
    'css/catalogue/emptyCatalogueBox.css',
    'css/catalogue/resource.scss',
    'css/catalogue/resource_details.scss',
    'css/catalogue/search_interface.scss',
    'css/catalogue/modals/upload.scss',
)


PLATFORM_CORE_CSS = (
    'css/wirecloud_core.scss',
    'css/header.scss',
    'css/icons.css',
    'css/modals/base.scss',
    'css/modals/logs.scss',
)


WIRING_EDITOR_CSS = (
    'css/wiring/layout.scss',
    'css/wiring/components.scss',
    'css/wiring/connection.scss',
    'css/wiring/behaviours.scss',
)


TUTORIAL_CSS = (
    'css/tutorial.scss',
)


STYLED_ELEMENTS_CSS = (
    'css/styled_elements_core.css',
    'css/styledelements/styled_addon.scss',
    'css/styledelements/styled_alternatives.scss',
    'css/styledelements/styled_container.css',
    'css/styledelements/styled_button.scss',
    'css/styledelements/styled_checkbox.css',
    'css/styledelements/styled_pills.scss',
    'css/styledelements/styled_notebook.scss',
    'css/styledelements/styled_form.css',
    'css/styledelements/styled_panel.scss',
    'css/styledelements/styled_numeric_field.scss',
    'css/styledelements/styled_text_field.scss',
    'css/styledelements/styled_text_area.scss',
    'css/styledelements/styled_password_field.scss',
    'css/styledelements/styled_select.scss',
    'css/styledelements/styled_border_layout.css',
    'css/styledelements/styled_horizontal_and_vertical_layout.scss',
    'css/styledelements/styled_file_field.scss',
    'css/styledelements/styled_table.scss',
    'css/styledelements/styled_label_badge.scss',
    'css/styledelements/styled_alert.scss',
    'css/styledelements/styled_rating.scss',
    'css/styledelements/styled_popup_menu.scss',
    'css/styledelements/styled_popover.scss',
    'css/styledelements/styled_tooltip.css',
    'css/styledelements/styled_expander.scss',
    'css/styledelements/styled_offcanvas_layout.scss',
    'css/styledelements/styled_pagination.scss',
    'css/styledelements/styled_thumbnail.scss',
)


BASE_PATH = os.path.dirname(__file__)
WORKSPACE_BROWSER_FILE = os.path.join(BASE_PATH, 'initial', 'WireCloud_workspace-browser_0.1.3.wgt')
INITIAL_HOME_DASHBOARD_FILE = os.path.join(BASE_PATH, 'initial', 'initial_home_dashboard.wgt')
MARKDOWN_VIEWER_FILE = os.path.join(BASE_PATH, 'initial', 'CoNWeT_markdown-viewer_0.1.1.wgt')
MARKDOWN_EDITOR_FILE = os.path.join(BASE_PATH, 'initial', 'CoNWeT_markdown-editor_0.1.0.wgt')
LANDING_DASHBOARD_FILE = os.path.join(BASE_PATH, 'initial', 'WireCloud_landing-dashboard_1.0.wgt')


def get_version_hash():
    return sha1(json.dumps(get_active_features_info(), ensure_ascii=False, sort_keys=True).encode('utf8')).hexdigest()


class WirecloudCorePlugin(WirecloudPlugin):

    features = {
        'Wirecloud': wirecloud.platform.__version__,
        'ApplicationMashup': wirecloud.platform.__application_mashup_version__,
        'StyledElements': '0.10.0',
        'FullscreenWidget': '0.5',
        'DashboardManagement': '1.0',
        'ComponentManagement': '1.0',
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
            'fullname': {
                'label': _('Full name'),
                'description': _('Full name of the logged user'),
            },
            'avatar': {
                'label': _('Avatar'),
                'description': _('URL of the avatar'),
            },
            'isanonymous': {
                'label': _('Is Anonymous'),
                'description': _('Boolean. Designates whether current user is logged in the system.'),
            },
            'isstaff': {
                'label': _('Is Staff'),
                'description': _('Boolean. Designates whether current user can access the admin site.'),
            },
            'issuperuser': {
                'label': _('Is Superuser'),
                'description': _('Boolean. Designates whether current user is a super user.'),
            },
            'mode': {
                'label': _('Mode'),
                'description': _('Rendering mode used by the platform (available modes: classic, smartphone and embedded)'),
            },
            'orientation': {
                'label': _('Orientation'),
                'description': _('Current screen orientation'),
            },
            'theme': {
                'label': _('Theme'),
                'description': _('Name of the theme used by the platform'),
            },
            'version': {
                'label': _('Version'),
                'description': _('Version of the platform'),
            },
            'version_hash': {
                'label': _('Version Hash'),
                'description': _('Hash for the current version of the platform. This hash changes when the platform is updated or when an addon is added or removed'),
            },
        }

    def get_platform_context_current_values(self, user):
        if user.is_authenticated():
            username = user.username
            fullname = user.get_full_name()
            avatar = 'https://www.gravatar.com/avatar/' + md5(user.email.strip().lower().encode('utf8')).hexdigest() + '?s=25'
        else:
            username = 'anonymous'
            fullname = _('Anonymous')
            avatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?s=25'

        return {
            'language': get_language(),
            'orientation': 'landscape',
            'username': username,
            'fullname': fullname,
            'avatar': avatar,
            'isanonymous': user.is_anonymous(),
            'isstaff': user.is_staff,
            'issuperuser': user.is_superuser,
            'mode': 'unknown',
            'theme': get_active_theme_name(),
            'version': wirecloud.platform.__version__,
            'version_hash': get_version_hash(),
        }

    def get_workspace_context_definitions(self):
        return {
            'title': {
                'label': _('Title'),
                'description': _('Current title of the workspace'),
            },
            'name': {
                'label': _('Name'),
                'description': _('Current name of the workspace'),
            },
            'owner': {
                'label': _('Owner'),
                'description': _("Workspace's owner username"),
            },
            'description': {
                'label': _('Description'),
                'description': _("Short description of the workspace without formating"),
            },
            'longdescription': {
                'label': _('Long description'),
                'description': _("Detailed workspace's description. This description can contain formatting."),
            }
        }

    def get_workspace_context_current_values(self, workspace, user):
        return {
            'name': workspace.name,
            'owner': workspace.creator.username,
        }

    def get_workspace_preferences(self):
        return [
            {
                "name": "public",
                "defaultValue": False,
                "label": _("Public"),
                "type": "boolean",
                "hidden": True,
                "description": _("Allow any user to open this workspace (in read-only mode). (default: disabled)")
            },
            {
                "name": "sharelist",
                "defaultValue": [],
                "label": _("Share list"),
                "type": "layout",
                "hidden": True,
                "description": _("List of users with access to this workspace. (default: [])")
            },
            {
                "name": "initiallayout",
                "defaultValue": "Fixed",
                "label": _("Default layout"),
                "type": "select",
                "initialEntries": [
                    {"value": "Fixed", "label": _("Base")},
                    {"value": "Free", "label": _("Free")}
                ],
                "description": _("Default layout for the new widgets.")
            },
            {
                "name": "baselayout",
                "defaultValue": {
                    "type": "columnlayout",
                    "smart": "false",
                    "columns": 20,
                    "cellheight": 12,
                    "horizontalmargin": 4,
                    "verticalmargin": 3
                },
                "label": _("Base layout"),
                "type": "layout"
            }
        ]

    def get_tab_preferences(self):
        workspace_preferences = self.get_workspace_preferences()
        tab_preferences = deepcopy(workspace_preferences)
        for preference in tab_preferences:
            if preference['name'] == 'public':
                public_preference = preference
            else:
                preference['inheritable'] = True
                preference['inheritByDefault'] = True

        tab_preferences.remove(public_preference)

        return tab_preferences

    def get_scripts(self, view):
        common = SHIM_FILES + (
            'js/wirecloud/BaseRequirements.js',
            'js/common/ComputedStyle.js',
            'js/wirecloud/constants.js',
            'js/StyledElements/Event.js',
            'js/StyledElements/ObjectWithEvents.js',
            'js/wirecloud/core.js',
            'js/wirecloud/UserInterfaceManager.js',
            'js/wirecloud/Task.js',
            'js/wirecloud/io.js',
            'js/wirecloud/ContextManager.js',
            'js/wirecloud/PreferenceDoesNotExistError.js',
            'js/wirecloud/UserPrefDef.js',
            'js/wirecloud/UserPref.js',
            'js/wirecloud/PersistentVariable.js',
            'js/wirecloud/PersistentVariableDef.js',
            'js/wirecloud/PolicyManager.js',
            'js/wirecloud/HistoryManager.js',
            'js/wirecloud/Version.js',
            'js/wirecloud/MashableApplicationComponent.js',
            'js/wirecloud/WidgetMeta.js',
            'js/wirecloud/PreferenceDef.js',
            'js/wirecloud/PlatformPref.js',
            'js/wirecloud/PreferencesDef.js',
            'js/wirecloud/PlatformPreferencesDef.js',
            'js/wirecloud/WorkspacePreferencesDef.js',
            'js/wirecloud/TabPreferencesDef.js',
        ) + STYLED_ELEMENTS_FILES + (
            'js/wirecloud/WorkspaceTab.js',
            'js/wirecloud/Workspace.js',
            'js/wirecloud/Preferences.js',
            'js/wirecloud/PlatformPreferences.js',
            'js/wirecloud/PreferenceManager.js',
            'js/wirecloud/WorkspacePreferences.js',
            'js/wirecloud/TabPreferences.js',
            'js/wirecloud/PropertyCommiter.js',
            'js/wirecloud/LogManager.js',
            'js/wirecloud/Widget.js',
            'js/wirecloud/Wiring.js',
            'js/wirecloud/ui/MACField.js',
            'js/wirecloud/ui/InputInterfaceFactory.js',
            'js/wirecloud/ui/ResizeHandle.js',
            'js/wirecloud/ui/WidgetView.js',
            'js/wirecloud/ui/WidgetViewMenuItems.js',
            'js/wirecloud/ui/WidgetViewResizeHandle.js',
            'js/wirecloud/ui/Draggable.js',
            'js/wirecloud/ui/Theme.js',
            'js/wirecloud/WirecloudCatalogue.js',
            'js/wirecloud/WirecloudCatalogue/ResourceDetails.js',
            'js/wirecloud/LocalCatalogue.js',
            'js/wirecloud/WorkspaceCatalogue.js',
            'js/wirecloud/wiring/Connection.js',
            'js/wirecloud/wiring/Endpoint.js',
            'js/wirecloud/wiring/EndpointDoesNotExistError.js',
            'js/wirecloud/wiring/EndpointTypeError.js',
            'js/wirecloud/wiring/EndpointValueError.js',
            'js/wirecloud/wiring/SourceEndpoint.js',
            'js/wirecloud/wiring/TargetEndpoint.js',
            'js/wirecloud/wiring/MissingEndpoint.js',
            'js/wirecloud/wiring/Operator.js',
            'js/wirecloud/wiring/OperatorMeta.js',
            'js/wirecloud/wiring/OperatorSourceEndpoint.js',
            'js/wirecloud/wiring/OperatorTargetEndpoint.js',
            'js/wirecloud/wiring/WidgetSourceEndpoint.js',
            'js/wirecloud/wiring/WidgetTargetEndpoint.js',
            'js/wirecloud/wiring/KeywordSuggestion.js',
        )

        if view in ('classic', 'embedded', 'smartphone'):
            scripts = common + (
                'js/wirecloud/ui/WorkspaceListItems.js',
                'js/wirecloud/ui/WorkspaceViewMenuItems.js',
                'js/wirecloud/ui/MACSearch.js',
                'js/wirecloud/ui/ComponentSidebar.js',
                'js/wirecloud/ui/WorkspaceView.js',
                'js/wirecloud/ui/WorkspaceTabView.js',
                'js/wirecloud/ui/WorkspaceTabViewMenuItems.js',
                'js/wirecloud/ui/WorkspaceTabViewDragboard.js',
                'js/wirecloud/ui/MyResourcesView.js',
                'js/wirecloud/ui/MarketplaceView.js',
                'js/catalogue/CatalogueSearchView.js',
                'js/catalogue/CatalogueView.js',
                'js/wirecloud/ui/WidgetViewDraggable.js',
                'js/wirecloud/DragboardPosition.js',
                'js/wirecloud/ui/DragboardCursor.js',
                'js/wirecloud/ui/MultiValuedSize.js',
                'js/wirecloud/ui/DragboardLayout.js',
                'js/wirecloud/ui/FreeLayout.js',
                'js/wirecloud/ui/FullDragboardLayout.js',
                'js/wirecloud/ui/ColumnLayout.js',
                'js/wirecloud/ui/SmartColumnLayout.js',
                'js/wirecloud/ui/GridLayout.js',
                'js/wirecloud/MarketManager.js',
                'js/wirecloud/ui/MarketplaceViewMenuItems.js',
                'js/wirecloud/ui/ResourcePainter.js',
                'js/wirecloud/ui/WindowMenu.js',
                'js/wirecloud/ui/WirecloudCatalogue/UploadWindowMenu.js',
                'js/wirecloud/ui/WirecloudCatalogue/ResourceDetailsView.js',
                'js/wirecloud/ui/AlertWindowMenu.js',
                'js/wirecloud/ui/ExternalProcessWindowMenu.js',
                'js/wirecloud/ui/HTMLWindowMenu.js',
                'js/wirecloud/Widget/PreferencesWindowMenu.js',
                'js/wirecloud/ui/MissingDependenciesWindowMenu.js',
                'js/wirecloud/ui/FormWindowMenu.js',
                'js/wirecloud/ui/LogWindowMenu.js',
                'js/wirecloud/ui/EmbedCodeWindowMenu.js',
                'js/wirecloud/ui/SharingWindowMenu.js',
                'js/wirecloud/ui/MACSelectionWindowMenu.js',
                'js/wirecloud/ui/MessageWindowMenu.js',
                'js/wirecloud/ui/NewWorkspaceWindowMenu.js',
                'js/wirecloud/ui/ParametrizeWindowMenu.js',
                'js/wirecloud/ui/PreferencesWindowMenu.js',
                'js/wirecloud/ui/OperatorPreferencesWindowMenu.js',
                'js/wirecloud/ui/PublishWorkspaceWindowMenu.js',
                'js/wirecloud/ui/PublishResourceWindowMenu.js',
                'js/wirecloud/ui/RenameWindowMenu.js',
                'js/wirecloud/ui/UpgradeWindowMenu.js',
                'js/wirecloud/ui/UserTypeahead.js',
            ) + WIRING_EDITOR_FILES + TUTORIAL_FILES

            if view != 'embedded':
                scripts += ('js/wirecloud/ui/WirecloudHeader.js',)

            return scripts

        else:
            return common

    def get_market_classes(self):
        return {
            'wirecloud': WirecloudCatalogueManager,
        }

    def get_constants(self):
        languages = [{'value': lang[0], 'label': _(lang[1])} for lang in settings.LANGUAGES]
        return {
            'AVAILABLE_LANGUAGES': languages,
        }

    def get_templates(self, view):
        if view == 'classic':
            return [
                "wirecloud/component_sidebar",
                "wirecloud/catalogue/main_resource_details",
                "wirecloud/catalogue/modals/upload",
                "wirecloud/catalogue/resource",
                "wirecloud/catalogue/resource_details",
                "wirecloud/catalogue/search_interface",
                "wirecloud/logs/details",
                "wirecloud/modals/base",
                "wirecloud/modals/embed_code",
                "wirecloud/macsearch/base",
                "wirecloud/macsearch/component",
                "wirecloud/wiring/behaviour_sidebar",
                "wirecloud/wiring/component_group",
                "wirecloud/wiring/footer",
                "wirecloud/workspace/empty_tab_message",
                "wirecloud/workspace/sharing_user",
                "wirecloud/workspace/visibility_option",
                "wirecloud/workspace/widget",
                "wirecloud/modals/upgrade_downgrade_component",
                "wirecloud/signin",
                "wirecloud/user_menu",
            ]
        else:
            return {}

    def get_ajax_endpoints(self, view):
        endpoints = (
            {'id': 'IWIDGET_COLLECTION', 'url': build_url_template('wirecloud.iwidget_collection', ['workspace_id', 'tab_id'])},
            {'id': 'IWIDGET_ENTRY', 'url': build_url_template('wirecloud.iwidget_entry', ['workspace_id', 'tab_id', 'iwidget_id'])},
            {'id': 'IWIDGET_PREFERENCES', 'url': build_url_template('wirecloud.iwidget_preferences', ['workspace_id', 'tab_id', 'iwidget_id'])},
            {'id': 'IWIDGET_PROPERTIES', 'url': build_url_template('wirecloud.iwidget_properties', ['workspace_id', 'tab_id', 'iwidget_id'])},
            {'id': 'LOCAL_REPOSITORY', 'url': build_url_template('wirecloud.root')},
            {'id': 'LOCAL_RESOURCE_COLLECTION', 'url': build_url_template('wirecloud.resource_collection')},
            {'id': 'LOCAL_RESOURCE_ENTRY', 'url': build_url_template('wirecloud.resource_entry', ['vendor', 'name', 'version'])},
            {'id': 'LOCAL_UNVERSIONED_RESOURCE_ENTRY', 'url': build_url_template('wirecloud.unversioned_resource_entry', ['vendor', 'name'])},
            {'id': 'LOGIN_VIEW', 'url': build_url_template('login')},
            {'id': 'LOGOUT_VIEW', 'url': build_url_template('logout')},
            {'id': 'MAC_BASE_URL', 'url': build_url_template('wirecloud.showcase_media', ['vendor', 'name', 'version', 'file_path'])},
            {'id': 'MARKET_COLLECTION', 'url': build_url_template('wirecloud.market_collection')},
            {'id': 'MARKET_ENTRY', 'url': build_url_template('wirecloud.market_entry', ['user', 'market'])},
            {'id': 'MISSING_WIDGET_CODE_ENTRY', 'url': build_url_template('wirecloud.missing_widget_code_entry')},
            {'id': 'OPERATOR_ENTRY', 'url': build_url_template('wirecloud.operator_code_entry', ['vendor', 'name', 'version'])},
            {'id': 'PLATFORM_CONTEXT_COLLECTION', 'url': build_url_template('wirecloud.platform_context_collection')},
            {'id': 'PLATFORM_PREFERENCES', 'url': build_url_template('wirecloud.platform_preferences')},
            {'id': 'PROXY', 'url': build_url_template('wirecloud|proxy', ['protocol', 'domain', 'path'])},
            {'id': 'PUBLISH_ON_OTHER_MARKETPLACE', 'url': build_url_template('wirecloud.publish_on_other_marketplace')},
            {'id': 'ROOT_URL', 'url': build_url_template('wirecloud.root')},
            {'id': 'SEARCH_SERVICE', 'url': build_url_template('wirecloud.search_service')},
            {'id': 'SWITCH_USER_SERVICE', 'url': build_url_template('wirecloud.switch_user_service')},
            {'id': 'TAB_COLLECTION', 'url': build_url_template('wirecloud.tab_collection', ['workspace_id'])},
            {'id': 'TAB_ENTRY', 'url': build_url_template('wirecloud.tab_entry', ['workspace_id', 'tab_id'])},
            {'id': 'TAB_PREFERENCES', 'url': build_url_template('wirecloud.tab_preferences', ['workspace_id', 'tab_id'])},
            {'id': 'THEME_ENTRY', 'url': build_url_template('wirecloud.theme_entry', ['name'])},
            {'id': 'WIRING_ENTRY', 'url': build_url_template('wirecloud.workspace_wiring', ['workspace_id'])},
            {'id': 'OPERATOR_VARIABLES_ENTRY', 'url': build_url_template('wirecloud.operator_variables', ['workspace_id', 'operator_id'])},
            {'id': 'WORKSPACE_COLLECTION', 'url': build_url_template('wirecloud.workspace_collection')},
            {'id': 'WORKSPACE_ENTRY_OWNER_NAME', 'url': build_url_template('wirecloud.workspace_entry_owner_name', ['owner', 'name'])},
            {'id': 'WORKSPACE_ENTRY', 'url': build_url_template('wirecloud.workspace_entry', ['workspace_id'])},
            {'id': 'WORKSPACE_MERGE', 'url': build_url_template('wirecloud.workspace_merge', ['to_ws_id'])},
            {'id': 'WORKSPACE_PREFERENCES', 'url': build_url_template('wirecloud.workspace_preferences', ['workspace_id'])},
            {'id': 'WORKSPACE_PUBLISH', 'url': build_url_template('wirecloud.workspace_publish', ['workspace_id'])},
            {'id': 'WORKSPACE_RESOURCE_COLLECTION', 'url': build_url_template('wirecloud.workspace_resource_collection', ['workspace_id'])},
            {'id': 'WORKSPACE_VIEW', 'url': build_url_template('wirecloud.workspace_view', ['owner', 'name'])},
        )

        from django.conf import settings
        if 'django.contrib.admin' in settings.INSTALLED_APPS:
            endpoints += ({'id': 'DJANGO_ADMIN', 'url': build_url_template('admin:index')},)

        return endpoints

    def get_platform_css(self, view):
        common = BASE_CSS + STYLED_ELEMENTS_CSS

        if view in ('classic', 'smartphone'):
            return common + PLATFORM_CORE_CSS + WORKSPACE_CSS + CLASSIC_CORE_CSS + WIRING_EDITOR_CSS + CATALOGUE_CSS + TUTORIAL_CSS
        elif view == 'embedded':
            return common + PLATFORM_CORE_CSS + WORKSPACE_CSS
        else:
            return common

    def get_widget_api_extensions(self, view, features):
        extensions = ['js/WirecloudAPI/StyledElements.js']

        if 'DashboardManagement' in features:
            extensions.append('js/WirecloudAPI/DashboardManagementAPI.js')

        if 'ComponentManagement' in features:
            extensions.append('js/WirecloudAPI/ComponentManagementAPI.js')

        return extensions

    def get_operator_api_extensions(self, view, features):
        extensions = []

        if 'DashboardManagement' in features:
            extensions.append('js/WirecloudAPI/DashboardManagementAPI.js')

        if 'ComponentManagement' in features:
            extensions.append('js/WirecloudAPI/ComponentManagementAPI.js')

        return extensions

    def get_proxy_processors(self):
        return ('wirecloud.proxy.processors.SecureDataProcessor',)

    def populate_component(self, wirecloud_user, log, vendor, name, version, wgt):

        if not CatalogueResource.objects.filter(vendor=vendor, short_name=name, version=version).exists():
            log('Installing the %(name)s widget... ' % {"name": name}, 1, ending='')
            added, component = install_component(WgtFile(wgt), executor_user=wirecloud_user, users=[wirecloud_user])
            IWidget.objects.filter(widget__resource__vendor=vendor, widget__resource__short_name=name).exclude(widget__resource__version=version).update(widget=component.widget, widget_uri=component.local_uri_part)
            log('DONE', 1)
            return True
        return False

    def populate(self, wirecloud_user, log):
        updated = False

        updated |= self.populate_component(wirecloud_user, log, "WireCloud", "workspace-browser", "0.1.3", WORKSPACE_BROWSER_FILE)

        if not Workspace.objects.filter(creator__username="wirecloud", name="home").exists():
            updated = True
            log('Creating a initial version of the wirecloud/home workspace... ', 1, ending='')
            with open(INITIAL_HOME_DASHBOARD_FILE, 'rb') as f:
                create_workspace(wirecloud_user, f, public=True, searchable=False)
            log('DONE', 1)

        updated |= self.populate_component(wirecloud_user, log, "CoNWeT", "markdown-viewer", "0.1.1", MARKDOWN_VIEWER_FILE)
        updated |= self.populate_component(wirecloud_user, log, "CoNWeT", "markdown-editor", "0.1.0", MARKDOWN_EDITOR_FILE)

        if not Workspace.objects.filter(creator__username="wirecloud", name="landing").exists():
            updated = True
            log('Creating a initial version of the wirecloud/landing workspace... ', 1, ending='')
            with open(LANDING_DASHBOARD_FILE, 'rb') as f:
                create_workspace(wirecloud_user, f, public=True, searchable=False)
            log('DONE', 1)

        return updated
