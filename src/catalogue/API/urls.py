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

from catalogue.API.views import GadgetsCollection

urlpatterns = patterns('catalogue.API.views',

    #dealing with catalogue resources
    #if OK returns a json with:
        #result
        #contratable
        #templateUrl
        #gadgetName
        #gadgetId
        #vendor
        #version
    #else, error code 500 + message
    (r'^resource$',
        GadgetsCollection(permitted_methods=('POST', ))),

    # returns OK or error code 500 + message
    (r'^resource/(?P<gadget_id>\d+)$',
        GadgetsCollection(permitted_methods=('DELETE', ))),
)
