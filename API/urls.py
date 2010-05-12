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

from API.views import IGadgetCollection, IGadgetEntry

urlpatterns = patterns('API.views',

    # Gadgets
    (r'^/(?P<user_name>[\.\-\w]+)/gadget[s]?[/]?$', 
                IGadgetCollection(permitted_methods=('POST',))),
    (r'^/gadget[s]?[/]?$', 
                IGadgetCollection(permitted_methods=('POST',))),           
    (r'^/(?P<user_name>[\.\-\w]+)/gadget[s]?/(?P<gadget_id>\d+)/igadget[s]?[/]?$', 
                IGadgetCollection(permitted_methods=('DELETE',))),
    (r'^/gadget[s]?/(?P<gadget_id>\d+)/igadget[s]?[/]?$', 
                IGadgetCollection(permitted_methods=('DELETE',))),
    (r'^/(?P<user_name>[\.\-\w]+)/igadget[s]?/(?P<igadget_id>\d+)$', 
                IGadgetEntry(permitted_methods=('DELETE',))),
    (r'^/igadget[s]?/(?P<igadget_id>\d+)$', 
                IGadgetEntry(permitted_methods=('DELETE',))),               
       
)


