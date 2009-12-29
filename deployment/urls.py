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
from django.conf.urls.defaults import patterns
from deployment.views import *
from os import path
import settings

deployment = "deployment/gadgets"
urlpatterns = patterns('',

		# Error view
		(r'^gadgets/error$', Error(permitted_methods=('GET',))),

		# Gadgets .wgt
		(r'^gadgets/(?P<username>.+)/(?P<vendor>[^/\t\n\r\f\v]+)/(?P<name>[^/\t\n\r\f\v]+)/(?P<version>[^/\t\n\r\f\v]+)/$', Resources(permitted_methods=('GET',))),

		# Upload Gadget
		(r'^gadgets/$', Resources(permitted_methods=('POST','UPDATE'))),

		# Static content
		(r'^gadgets/(.*)$', 'django.views.static.serve', {'document_root': settings.GADGETS_ROOT}),

	)
