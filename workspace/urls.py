# -*- coding: utf-8 -*-

#...............................licence...........................................
#
#     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
#     S.A.Unipersonal (Telefonica I+D)
#
#     This file is part of Morfeo EzWeb Platform.
#
#     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
#
#     You should have received a copy of the GNU Affero General Public License
#     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
#
#     Info about members and contributors of the MORFEO project
#     is available at
#
#     http://morfeo-project.org
#
#...............................licence...........................................#


#

from django.conf.urls.defaults import patterns

from connectable.views import ConnectableEntry
from workspace.views import *

urlpatterns = patterns('workspace.views',
    # WorkSpace
    (r'^[/]?$', WorkSpaceCollection(permitted_methods=('GET','POST', ))),
    (r'^/((?P<workspace_id>\d+)/last_user/(?P<last_user>[\s\-\.\w]*)[/]?)?$',
	    WorkSpaceEntry(permitted_methods=('GET', 'POST', 'PUT', 'DELETE',))),
    # Tab
    (r'^/((?P<workspace_id>\d+)/tab(s)?[/]?)?$',
        TabCollection(permitted_methods=('GET', 'POST',))),
    (r'^/((?P<workspace_id>\d+)/tab(s)?/(?P<tab_id>\w+)[/]?)?$',
        TabEntry(permitted_methods=('GET', 'PUT', 'POST', 'DELETE',))),
        
    # Variables of the whole workspace
    (r'^/((?P<workspace_id>\d+)/variable(s)?[/]?)?$',
        WorkSpaceVariableCollection(permitted_methods=('PUT','POST', ))),
    
    # channels of the whole workspace
    (r'^/((?P<workspace_id>\d+)/channel(s)?[/]?)?$',
        WorkSpaceChannelCollection(permitted_methods=('GET', ))),
        
    # Wiring info for the whole workspace
    (r'^/((?P<workspace_id>\d+)/wiring?[/]?)?$',
        ConnectableEntry(permitted_methods=('PUT', 'POST', ))),
        
    # Sharing workspace
    (r'^/(?P<workspace_id>\d+)/share/groups[/]?$', 
        WorkSpaceSharerEntry(permitted_methods=('GET', ))), 
    (r'^/((?P<workspace_id>\d+)/share/(?P<share_boolean>\w+)[/]?)?$', 
        WorkSpaceSharerEntry(permitted_methods=('PUT', ))),
                            
    # Coping workspace structure when adding package
    (r'^/((?P<workspace_id>\d+)/copy?[/]?)?$', 
        WorkSpaceClonerEntry(permitted_methods=('GET', ))),
        
     # Linking workspace structure when adding package   
    (r'^/((?P<workspace_id>\d+)/link?[/]?)?$', 
        WorkSpaceLinkerEntry(permitted_methods=('GET', ))),
    
    # Merge a published workspace to a normal one  
    (r'^/published_workspace/(?P<published_ws_id>\d+)/merge/(?P<to_ws_id>\d+)?[/]?$', 
        PublishedWorkSpaceMergerEntry(permitted_methods=('GET', ))),
    
    # Publish workspace photo to PublishedWorkspaces  
    (r'^/((?P<workspace_id>\d+)/publish?[/]?)?$', 
        WorkSpacePublisherEntry(permitted_methods=('GET', 'POST',))),
    
    # Merge workspaces   
    (r'^/((?P<from_ws_id>\d+)/merge/(?P<to_ws_id>\d+)?[/]?)?$', 
        WorkSpaceMergerEntry(permitted_methods=('GET', ))),
    
    # Add workspaces   
    (r'^/((?P<workspace_id>\d+)/add?[/]?)?$', 
        WorkSpaceAdderEntry(permitted_methods=('GET', ))),
    
    # Create template for mashup   
    (r'^/templateGenerator/((?P<workspace_id>\d+)[/]?)?$', 
        GeneratorURL(permitted_methods=('GET', ))),
)
