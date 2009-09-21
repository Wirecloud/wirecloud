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

from catalogue.views import ResourceEnabler

#from clms import admin_view as clms_admin_view
#from clms.admin import clms_site, setup_admin
#setup_admin(clms_site)

#JavaScript translation
js_info_dict = {
    'packages': ('ezweb', )
}

urlpatterns = patterns('',
    # Static content
     (r'^ezweb/(.*)$', 'django.views.static.serve', {'document_root': path.join(settings.BASEDIR, 'media')}),

    # EzWeb
    (r'^', include('ezweb.urls')),
    (r'^user/(?P<user_name>[\s\-\.\w]+)/$', include('ezweb.urls')),
    
    # Gadgets
    (r'^user/(?P<user_name>[\s\-\.\w]+)/gadget(s)?', include('gadget.urls')),
    (r'^gadget(s)?', include('gadget.urls')),

    # WorkSpaces
    (r'^workspace(s)?', include('workspace.urls')),
    
    # Contracts Manager
    (r'^contract(s)?', include('resourceSubscription.urls')),

    # IGadgets
    (r'^workspace(s)?/(?P<workspace_id>\d+)/tab(s)?/(?P<tab_id>\d+)/igadget(s)?', include('igadget.urls')),

    # Connectables
    (r'^workspace(s)?/(?P<workspace_id>\d+)/connectable(s)?', include('connectable.urls')),

    # context
    (r'^user/(?P<user_name>[\s\-\.\w]+)/context(s)?', include('context.urls')),

    # Platform Preferences
    (r'^user/(?P<user_name>[_\w]+)/preference(s)?', include('preferences.urls')),

    # Catalogue Resource
    (r'^user/(?P<user_name>[\s\-\.\w]+)/catalogue/', include('catalogue.urls')),
    
    # Catalogue: Changing certification status
    (r'^catalogue/resource/(?P<resource_id>\d+)/activation$', ResourceEnabler(permitted_methods=('GET',))),
    
    #GadgetGenerator
    (r'^gadgetGenerator', include('gadgetGenerator.urls')),

    # Proxy
    (r'^proxy', include('proxy.urls')),

    # CLMS
    #(r'^clms/', include('clms.urls')),

    # Django contrib
    #(r'^registration/login_form/$', 'registration.views.login_form'),
    (r'^accounts/login/$', 'django.contrib.auth.views.login'),
 #   (r'^logout$', 'django.contrib.auth.views.logout'),    
    # custom logouts (to enable anonymous access)
    (r'^logout$', 'authentication.logout', {'next_page': '/'}),
    (r'^admin/logout/$', 'authentication.logout', {'next_page': '/'}),
    
    #Admin CLMS interface
    #(r'^admin/clms/(?P<layout_id>\d+)/content/popup/', clms_admin_view.panel_list_popup),
    #(r'^admin/clms/content/popup/', clms_admin_view.panel_list_popup),
    #(r'^admin/clms/content/filter/', clms_admin_view.contents_filter),
    #(r'^admin/clms/(?P<url>.*)', clms_site.root),
    
    #Admin interface
    (r'^admin/(.*)', admin.site.root),
    
    # Django "set language" (internacionalitation)
    (r'^i18n/', include('django.conf.urls.i18n')),
    
    # Django JavaScript Internacionalitation
    (r'^jsi18n/$', 'django.views.i18n.javascript_catalog', js_info_dict),

)
