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


try:
    from django.conf.urls import patterns, include, url
except ImportError:  # pragma: no cover
    # for Django version less than 1.4
    from django.conf.urls.defaults import patterns, include, url
from django.views.decorators.cache import cache_page
from django.views.i18n import javascript_catalog

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


urlpatterns = patterns('wirecloud.platform.views',

    url(r'^$', 'render_root_page', name='wirecloud.root'),

    url(r'^api/features/?$',
        views.FeatureCollection(permitted_methods=('GET',)),
        name='wirecloud.features'),

    # i18n
    url(r'^api/i18n/', include('django.conf.urls.i18n')),
    url(r'^api/i18n/js_catalogue/?$',
        cache_page(60 * 60 * 24)(javascript_catalog), {'packages': ()},
        name="wirecloud.javascript_translation_catalogue"),

    url(r'^api/workspace/(?P<workspace_id>\d+)/wiring$',
        wiring_views.WiringEntry(permitted_methods=('PUT',)),
        name='wirecloud.workspace_wiring'),

    # Context
    url(r'^api/context/?$',
        context_views.PlatformContextCollection(permitted_methods=('GET',)),
        name='wirecloud.platform_context_collection'),

    # Widgets
    url(r'^api/resources/?$',
        localcatalogue_views.ResourceCollection(permitted_methods=('GET', 'POST',)),
        name='wirecloud_showcase.resource_collection'),
    url(r'^api/resource/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/?$',
        localcatalogue_views.ResourceEntry(permitted_methods=('DELETE', 'GET')),
        name='wirecloud_showcase.resource_entry'),
    url(r'^api/resource/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/description/?$',
        localcatalogue_views.ResourceDescriptionEntry(permitted_methods=('GET',)),
        name='wirecloud_showcase.resource_description_entry'),
    url(r'^api/widget/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/xhtml/?$',
        widget_views.WidgetCodeEntry(permitted_methods=('GET',)),
        name='wirecloud.widget_code_entry'),

    # IWidgets
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/iwidgets/?$',
        iwidget_views.IWidgetCollection(permitted_methods=('GET', 'POST', 'PUT',)),
        name='wirecloud.iwidget_collection'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/iwidget/(?P<iwidget_id>\d+)/?$',
        iwidget_views.IWidgetEntry(permitted_methods=('GET', 'POST', 'DELETE',)),
        name='wirecloud.iwidget_entry'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/iwidget/(?P<iwidget_id>\d+)/preferences/?$',
        iwidget_views.IWidgetPreferences(permitted_methods=('POST',)),
        name='wirecloud.iwidget_preferences'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/iwidget/(?P<iwidget_id>\d+)/version/?$',
        iwidget_views.IWidgetVersion(permitted_methods=('PUT',)),
        name='wirecloud.iwidget_version_entry'
    ),

    # Preferences
    url(r'^api/preferences/platform/?$',
        preferences_views.PlatformPreferencesCollection(permitted_methods=('GET', 'POST')),
        name='wirecloud.platform_preferences'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/preferences/?$',
        preferences_views.WorkspacePreferencesCollection(permitted_methods=('GET', 'POST')),
        name='wirecloud.workspace_preferences'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/preferences/?$',
        preferences_views.TabPreferencesCollection(permitted_methods=('GET', 'POST')),
        name='wirecloud.tab_preferences'
    ),

    url(r'^api/operator/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/html$',
        wiring_views.OperatorEntry(permitted_methods=('GET',)),
        name='wirecloud.operator_code_entry'
    ),

    url(r'^api/markets/?$',
        market_views.MarketCollection(permitted_methods=('GET', 'POST')),
        name='wirecloud.market_collection'
    ),
    url(r'^api/market/(?P<market>[\w -]+)/?$',
        market_views.MarketEntry(permitted_methods=('PUT', 'DELETE')),
        name='wirecloud.market_entry'
    ),
    url(r'^api/market/(?P<user>[^/]+)/(?P<market>[\w -]+)/?$',
        market_views.MarketEntry(permitted_methods=('PUT', 'DELETE')),
        name='wirecloud.market_entry'
    ),
    url(r'^api/markets/publish/?$',
        market_views.PublishService(),
        name='wirecloud.publish_on_other_marketplace'
    ),

    # Themes
    url(r'^api/theme/(?P<name>[^/]+)/?$',
        theme_views.ThemeEntry(permitted_methods=('GET',)),
        name='wirecloud.theme_entry'
    ),

    # Workspace
    url(r'^api/workspaces/?$',
        workspace_views.WorkspaceCollection(permitted_methods=('GET', 'POST', )),
        name='wirecloud.workspace_collection'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/?$',
        workspace_views.WorkspaceEntry(permitted_methods=('GET', 'POST', 'DELETE',)),
        name='wirecloud.workspace_entry'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tabs/?$',
        workspace_views.TabCollection(permitted_methods=('POST', 'PUT',)),
        name='wirecloud.tab_collection'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\w+)/?$',
        workspace_views.TabEntry(permitted_methods=('PUT', 'DELETE',)),
        name='wirecloud.tab_entry'
    ),

    url(r'^api/workspace/(?P<workspace_id>\d+)/variables/?$',
        workspace_views.WorkspaceVariableCollection(permitted_methods=('POST',)),
        name='wirecloud.variable_collection'
    ),

    url(r'^api/workspace/(?P<workspace_id>\d+)/share/(?P<share_boolean>\w+)/?$',
        workspace_views.WorkspaceSharerEntry(permitted_methods=('PUT',)),
        name='wirecloud.workspace_share'
    ),

    url(r'^api/workspace/(?P<to_ws_id>\d+)/merge/?$',
        workspace_views.MashupMergeService(),
        name='wirecloud.workspace_merge'
    ),

    url(r'^api/workspace/(?P<workspace_id>\d+)/publish/?$',
        workspace_views.WorkspacePublisherEntry(permitted_methods=('POST',)),
        name='wirecloud.workspace_publish'
    ),

) + get_plugin_urls() + patterns('wirecloud.platform.views',

    url(r'^(?P<creator_user>[^/]+)/(?P<workspace>[^/]+)/?$', 'render_workspace_view', name='wirecloud.workspace_view'),
)
