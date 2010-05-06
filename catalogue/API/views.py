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
from django.shortcuts import get_object_or_404
from commons.resource import Resource
from commons.custom_decorators import basicauth_or_logged_in
from catalogue.models import GadgetResource

class GadgetsCollection (Resource):

    #check if the request is authenticated and create a new resource
    @basicauth_or_logged_in()
    def create(self, request, fromWGT = False):

        from catalogue.views import GadgetsCollection
        gadgetsCol = GadgetsCollection()

        return gadgetsCol.create(request, request.user.username, fromWGT)

    #check if the request is authenticated and delete the resource
    @basicauth_or_logged_in()    
    def delete (self, request, gadget_id):
    
        resource = get_object_or_404(GadgetResource,id=gadget_id)
        
        from catalogue.views import GadgetsCollection
        gadgetsCol = GadgetsCollection()

        return gadgetsCol.delete(request, request.user.username, resource.vendor, resource.short_name, resource.version)
