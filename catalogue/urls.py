# -*- coding: utf-8 -*-

# MORFEO Project 
# http://morfeo-project.org 
# 
# Component: EzWeb
# 
# (C) Copyright 2004 Telefónica Investigación y Desarrollo 
#     S.A.Unipersonal (Telefónica I+D) 
# 
# Info about members and contributors of the MORFEO project 
# is available at: 
# 
#   http://morfeo-project.org/
# 
# This program is free software; you can redistribute it and/or modify 
# it under the terms of the GNU General Public License as published by 
# the Free Software Foundation; either version 2 of the License, or 
# (at your option) any later version. 
# 
# This program is distributed in the hope that it will be useful, 
# but WITHOUT ANY WARRANTY; without even the implied warranty of 
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
# GNU General Public License for more details. 
# 
# You should have received a copy of the GNU General Public License 
# along with this program; if not, write to the Free Software 
# Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
# 
# If you want to use this software an plan to distribute a 
# proprietary application in any way, and you are not licensing and 
# distributing your source code under GPL, you probably need to 
# purchase a commercial license of the product.  More info about 
# licensing options is available at: 
# 
#   http://morfeo-project.org/
#
from django.conf.urls.defaults import patterns
from catalogue.views import *

urlpatterns = patterns('catalogue.views',

    # Gadgets
    (r'^resource/(?P<vendor>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)/(?P<name>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)/(?P<version>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)$', GadgetsCollection(permitted_methods=('DELETE','PUT'))),
    (r'^resource/(?P<pag>\d+)/(?P<offset>\d+)$', GadgetsCollection(permitted_methods=('GET',))),
    (r'^resource/(?P<vendor>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)/(?P<name>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)$', GadgetsCollection(permitted_methods=('DELETE',))),
    (r'^resource$', GadgetsCollection(permitted_methods=('GET', 'POST',))),

    # Search Gadgets

    (r'^globalsearch/(?P<pag>\d+)/(?P<offset>\d+)$',
        GadgetsCollectionByGlobalSearch(permitted_methods=('GET',))),
    (r'^search/(?P<criteria>\w+)/(?P<pag>\d+)/(?P<offset>\d+)$',
        GadgetsCollectionBySimpleSearch(permitted_methods=('GET',))),

    # Tags
    (r'^tag(s)?/(?P<vendor>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)/(?P<name>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)/(?P<version>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)/(?P<tag>\d+)$',
        GadgetTagsCollection(permitted_methods=('DELETE',))),
    (r'^tag(s)?/(?P<vendor>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)/(?P<name>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)/(?P<version>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)$',
        GadgetTagsCollection(permitted_methods=('GET','POST',))),

    # Vote Gadgets
    (r'^voting/(?P<vendor>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)/(?P<name>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)/(?P<version>[\@_\%_\._\!_\s_\-_\|_\&_\/_\:_\(_\)_\w]+)$',
        GadgetVotesCollection(permitted_methods=('GET','POST','PUT',))),

 )
