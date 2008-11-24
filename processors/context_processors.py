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



from django.conf import settings
def server_url(request):
    if hasattr(settings, 'AUTHENTICATION_SERVER_URL'):
        return {'AUTHENTICATION_SERVER_URL': settings.AUTHENTICATION_SERVER_URL }
    else:
        return {'AUTHENTICATION_SERVER_URL': None }

def is_anonymous(request):
    is_anonymous = False
    if hasattr(request, 'anonymous_id') and request.anonymous_id and request.anonymous_id==request.user.id:
        is_anonymous = True
    return {'is_anonymous': is_anonymous }

def home_gateway_url(request):
    if hasattr(settings, 'HOME_GATEWAY_DISPATCHER_URL'):
       return {'home_gateway_dispatcher_url': settings.HOME_GATEWAY_DISPATCHER_URL}
    else:
        return {'home_gateway_dispatcher_url': None}
    