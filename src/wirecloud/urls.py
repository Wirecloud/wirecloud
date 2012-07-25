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


from django.conf.urls.defaults import patterns, url
from wirecloud.iwidget import views as iwidget_views
from wirecloud.markets import views
from wirecloud.wiring import views as wiring_views
from wirecloud.preferences import views as preferences_views
from wirecloud.workspace import views as workspace_views


urlpatterns = patterns('wirecloud.views',

    url(r'^$', 'render_root_page', name='wirecloud.root'),

    url(r'^api/workspace/(?P<workspace_id>\d+)/wiring$',
        wiring_views.WiringEntry(permitted_methods=('PUT',)),
        name='wirecloud.workspace_wiring'),

    # IWidgets
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/iwidgets/?$',
        iwidget_views.IGadgetCollection(permitted_methods=('GET', 'POST', 'PUT',)),
        name='wirecloud.iwidget_collection'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/iwidget/(?P<iwidget_id>\d+)/?$',
        iwidget_views.IGadgetEntry(permitted_methods=('GET', 'POST', 'PUT', 'DELETE',)),
        name='wirecloud.iwidget_entry'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/iwidget/(?P<iwidget_id>\d+)/version/?$',
        iwidget_views.IGadgetVersion(permitted_methods=('PUT',)),
        name='wirecloud.iwidget_version_entry'
    ),

    # Preferences
    url(r'^api/preferences/platform/?',
        preferences_views.PlatformPreferencesCollection(permitted_methods=('GET', 'PUT')),
        name='wirecloud.platform_preferences'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/preferences/?$',
        preferences_views.WorkSpacePreferencesCollection(permitted_methods=('GET', 'PUT')),
        name='wirecloud.workspace_preferences'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\d+)/preferences/?$',
        preferences_views.TabPreferencesCollection(permitted_methods=('GET', 'PUT')),
        name='wirecloud.tab_preferences'
    ),

    url(r'^api/operators',
        wiring_views.OperatorCollection(permitted_methods=('GET',)),
        name='wirecloud.operators'
    ),
    url(r'^api/operator/(?P<vendor>[^/]+)/(?P<name>[^/]+)/(?P<version>[^/]+)/html',
        wiring_views.OperatorEntry(permitted_methods=('GET',)),
        name='wirecloud.operator_code_entry'
    ),

    url(r'^api/markets/?$', views.MarketCollection(permitted_methods=('GET', 'POST'))),
    url(r'^api/market/(?P<market>[\w -]+)/?$', views.MarketEntry(permitted_methods=('PUT', 'DELETE'))),

    # Workspace
    url(r'^api/workspaces/?$',
        workspace_views.WorkSpaceCollection(permitted_methods=('GET', 'POST', )),
        name='wirecloud.workspace_collection'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/?$',
        workspace_views.WorkSpaceEntry(permitted_methods=('GET', 'POST', 'PUT', 'DELETE',)),
        name='wirecloud.workspace_entry'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tabs/?$',
        workspace_views.TabCollection(permitted_methods=('GET', 'POST', 'PUT',)),
        name='wirecloud.tab_collection'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/tab/(?P<tab_id>\w+)/?$',
        workspace_views.TabEntry(permitted_methods=('GET', 'PUT', 'DELETE',)),
        name='wirecloud.tab_entry'
    ),

    url(r'^api/workspace/(?P<workspace_id>\d+)/variables/?$',
        workspace_views.WorkSpaceVariableCollection(permitted_methods=('PUT',)),
        name='wirecloud.variable_collection'
    ),

    url(r'^api/workspace/(?P<workspace_id>\d+)/share/groups/?$', workspace_views.WorkSpaceSharerEntry(permitted_methods=('GET', ))),
    url(r'^api/workspace/(?P<workspace_id>\d+)/share/(?P<share_boolean>\w+)/?$',
        workspace_views.WorkSpaceSharerEntry(permitted_methods=('PUT',)),
        name='wirecloud.workspace_share'
    ),

    url(r'^api/workspace/(?P<workspace_id>\d+)/clone/?$', workspace_views.WorkSpaceClonerEntry(permitted_methods=('GET', ))),
    url(r'^api/workspace/(?P<workspace_id>\d+)/link/?$', workspace_views.WorkSpaceLinkerEntry(permitted_methods=('GET', ))),
    url(r'^api/workspace/(?P<to_ws_id>\d+)/merge/?$',
        workspace_views.MashupMergeService(),
        name='wirecloud.workspace_merge'
    ),
    url(r'^api/workspace/(?P<to_ws_id>\d+)/merge/(?P<from_ws_id>\d+)/?$',
        workspace_views.MashupMergeService(),
        name='wirecloud.workspace_merge_local'
    ),

    url(r'^api/workspace/(?P<workspace_id>\d+)/publish/?$',
        workspace_views.WorkSpacePublisherEntry(permitted_methods=('POST',)),
        name='wirecloud.workspace_publish'
    ),
    url(r'^api/workspace/(?P<workspace_id>\d+)/export/?$',
        workspace_views.WorkspaceExportService(),
        name='wirecloud.workspace_export'
    ),

    url(r'^api/workspaces/import/?$',
        workspace_views.MashupImportService(),
        name="wirecloud.workspace_import"
    ),
    url(r'^api/workspaces/published/(?P<workspace_id>\d+)/template.xml$', workspace_views.MashupTemplate(permitted_methods=('GET', )), name='wirecloud_showcase.mashup_template'),

    url(r'^(?P<creator_user>[^/]+)/(?P<workspace>[^/]+)/?$', 'render_workspace_view', name='wirecloud.workspace_view'),
)
