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

from os import path
from django.conf.urls.defaults import patterns, include
from django.conf import settings

#from resource.views import addToPlatform

#JavaScript translation
js_info_dict = {
    'packages': ('ezweb', )
}

urlpatterns = patterns('',
    # Static content
     (r'^ezweb/(.*)$', 'django.views.static.serve', {'document_root': path.join(settings.BASEDIR, 'media')}),

    # EzWeb
    (r'^', include('ezweb.urls')),
    (r'^user/(?P<user_name>[_\w]+)/$', include('ezweb.urls')),
    
    # Gadgets
    (r'^user/(?P<user_name>[_\w]+)/gadget(s)?', include('gadget.urls')),
    (r'^gadget(s)?', include('gadget.urls')),

    # WorkSpaces
    (r'^workspace(s)?', include('workspace.urls')),

    # IGadgets
    (r'^workspace(s)?/(?P<workspace_id>\d+)/tab(s)?/(?P<tab_id>\d+)/igadget(s)?', include('igadget.urls')),

    # Connectables
    (r'^workspace(s)?/(?P<workspace_id>\d+)/connectable(s)?', include('connectable.urls')),

    # context
    (r'^user/(?P<user_name>[_\w]+)/context(s)?', include('context.urls')),

    # Catalogue Resource
    (r'^user/(?P<user_name>[_\w]+)/catalogue/', include('catalogue.urls')),

    # Proxy
    (r'^proxy', include('proxy.urls')),

    # Django contrib
    #(r'^registration/login_form/$', 'registration.views.login_form'),
    (r'^accounts/login/$', 'django.contrib.auth.views.login'),
    (r'^logout$', 'django.contrib.auth.views.logout'),
    (r'^admin/', include('django.contrib.admin.urls')),
    
    # Django "set language" (internacionalitation)
    (r'^i18n/', include('django.conf.urls.i18n')),
    
    # Django JavaScript Internacionalitation
    (r'^jsi18n/$', 'django.views.i18n.javascript_catalog', js_info_dict),
)
