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

from os import path
from django.conf.urls.defaults import patterns, include
from django.conf import settings

from django.contrib import admin
admin.autodiscover()

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
 #   (r'^logout$', 'django.contrib.auth.views.logout'),    
    # custom logouts (to enable anonymous access)
    (r'^logout$', 'authentication.logout', {'next_page': '/'}),
    (r'^admin/logout/$', 'authentication.logout', {'next_page': '/'}),
    
    #Admin interface
    (r'^admin/(.*)', admin.site.root),
    
    # Django "set language" (internacionalitation)
    (r'^i18n/', include('django.conf.urls.i18n')),
    
    # Django JavaScript Internacionalitation
    (r'^jsi18n/$', 'django.views.i18n.javascript_catalog', js_info_dict),
)
