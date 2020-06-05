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

from django.conf.urls import include, url

import wirecloud.commons.urls
from wirecloud.commons.views import ResourceSearch, SwitchUserService
from wirecloud.platform import views
from wirecloud.platform.context import views as context_views
from wirecloud.platform.iwidget import views as iwidget_views
from wirecloud.platform.localcatalogue import views as localcatalogue_views
from wirecloud.platform.markets import views as market_views
from wirecloud.platform.plugins import get_plugin_urls
from wirecloud.platform.wiring import views as wiring_views
from wirecloud.platform.preferences import views as preferences_views
from wirecloud.platform.theme import views as theme_views
from wirecloud.platform.widget import views as widget_views
from wirecloud.platform.workspace import views as workspace_views


urlpatterns = (

    url(r'^$', views.render_root_page, name='wirecloud.root'),

    url(r'^api/features$',
        views.feature_collection,
        name='wirecloud.features'),

    url(r'^api/version$',
        views.version_entry,
        name='wirecloud.version'),

    # Context
    url(r'^api/context/?$',
        context_views.PlatformContextCollection(permitted_methods=('GET',)),
        name='wirecloud.platform_context_collection'),

    url(r'^showcase/media/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/(?P<file_path>.+)$',
        widget_views.serve_showcase_media,
        name='wirecloud.showcase_media'),

    # Search service
    url(r'^api/search$',
        ResourceSearch(permitted_methods=('GET',)),
        name='wirecloud.search_service'),

    # Widgets
    url(r'^api/resources/?$',
        localcatalogue_views.ResourceCollection(permitted_methods=('GET', 'POST',)),
        name='wirecloud.resource_collection'),
    url(r'^api/resource/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/?$',
        localcatalogue_views.ResourceEntry(permitted_methods=('DELETE', 'GET')),
        name='wirecloud.resource_entry'),
    url(r'^api/resource/(?P<vendor>[^/]+)/(?P<name>[^/]+)/?$',
        localcatalogue_views.ResourceEntry(permitted_methods=('DELETE',)),
        name='wirecloud.unversioned_resource_entry'),
    url(r'^api/resource/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/description/?$',
        localcatalogue_views.ResourceDescriptionEntry(permitted_methods=('GET',)),
        name='wirecloud.resource_description_entry'),
    url('^api/widget/missing_widget$',
        widget_views.MissingWidgetCodeView.as_view(),
        name='wirecloud.missing_widget_code_entry'),

    # IWidgets
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/iwidgets/?$',
        iwidget_views.IWidgetCollection(permitted_methods=('GET', 'POST', 'PUT',)),
        name='wirecloud.iwidget_collection'),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/iwidget/(?P<iwidget_id>\d+)/?$',
        iwidget_views.IWidgetEntry(permitted_methods=('GET', 'POST', 'DELETE',)),
        name='wirecloud.iwidget_entry'),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/iwidget/(?P<iwidget_id>\d+)/preferences$',
        iwidget_views.IWidgetPreferences(permitted_methods=('POST', 'GET',)),
        name='wirecloud.iwidget_preferences'),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/iwidget/(?P<iwidget_id>\d+)/properties$',
        iwidget_views.IWidgetProperties(permitted_methods=('POST', 'GET',)),
        name='wirecloud.iwidget_properties'),

    # Preferences
    url(r'^api/preferences/platform/?$',
        preferences_views.PlatformPreferencesCollection(permitted_methods=('GET', 'POST')),
        name='wirecloud.platform_preferences'),
    url(r'^api/workspace/(?P<workspace_id>\d+)/preferences/?$',
        preferences_views.WorkspacePreferencesCollection(permitted_methods=('GET', 'POST')),
        name='wirecloud.workspace_preferences'),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/preferences/?$',
        preferences_views.TabPreferencesCollection(permitted_methods=('GET', 'POST')),
        name='wirecloud.tab_preferences'),

    url(r'^api/operator/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/html$',
        wiring_views.OperatorEntry(permitted_methods=('GET',)),
        name='wirecloud.operator_code_entry'),

    url(r'^api/markets/?$',
        market_views.MarketCollection(permitted_methods=('GET', 'POST')),
        name='wirecloud.market_collection'),
    url(r'^api/market/(?P<user>[^/]+)/(?P<market>[\w -]+)/?$',
        market_views.MarketEntry(permitted_methods=('DELETE',)),
        name='wirecloud.market_entry'),
    url(r'^api/markets/publish/?$',
        market_views.PublishService(),
        name='wirecloud.publish_on_other_marketplace'),

    # Themes
    url(r'^api/theme/(?P<name>[^/]+)/?$',
        theme_views.ThemeEntry(permitted_methods=('GET',)),
        name='wirecloud.theme_entry'),

    # Workspace
    url(r'^api/workspaces/?$',
        workspace_views.WorkspaceCollection(permitted_methods=('GET', 'POST', )),
        name='wirecloud.workspace_collection'),
    url(r'^api/workspace/(?P<workspace_id>\d+)/?$',
        workspace_views.WorkspaceEntry(permitted_methods=('GET', 'POST', 'DELETE',)),
        name='wirecloud.workspace_entry'),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tabs/?$',
        workspace_views.TabCollection(permitted_methods=('POST',)),
        name='wirecloud.tab_collection'),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tabs/order/?$',
        workspace_views.TabOrderService(),
        name='wirecloud.tab_order'),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\w+)/?$',
        workspace_views.TabEntry(permitted_methods=('GET', 'POST', 'DELETE',)),
        name='wirecloud.tab_entry'),

    url(r'^api/workspace/(?P<workspace_id>\d+)/resources$',
        localcatalogue_views.WorkspaceResourceCollection(permitted_methods=('GET',)),
        name='wirecloud.workspace_resource_collection'),

    url(r'^api/workspace/(?P<workspace_id>\d+)/wiring$',
        wiring_views.WiringEntry(permitted_methods=('PUT', 'PATCH')),
        name='wirecloud.workspace_wiring'),

    url(r'^api/workspace/(?P<workspace_id>\d+)/operators/(?P<operator_id>\d+)/variables$',
        wiring_views.OperatorVariablesEntry(permitted_methods=('GET',)),
        name='wirecloud.operator_variables'),

    url(r'^api/workspace/(?P<to_ws_id>\d+)/merge/?$',
        workspace_views.MashupMergeService(),
        name='wirecloud.workspace_merge'),

    url(r'^api/workspace/(?P<workspace_id>\d+)/publish/?$',
        workspace_views.WorkspacePublisherEntry(permitted_methods=('POST',)),
        name='wirecloud.workspace_publish'),

    url(r'^api/workspace/(?P<owner>[^/]+)/(?P<name>[^/]+)?$',
        workspace_views.WorkspaceEntry(permitted_methods=('GET', 'POST', 'DELETE',)),
        name='wirecloud.workspace_entry_owner_name'),

    url(r'api/admin/switchuser$',
        SwitchUserService(),
        name='wirecloud.switch_user_service'),

) + wirecloud.commons.urls.urlpatterns + get_plugin_urls() + (

    url(r'^(?P<owner>[^/]+)/(?P<name>[^/]+)/?$', views.render_workspace_view, name='wirecloud.workspace_view'),

)
