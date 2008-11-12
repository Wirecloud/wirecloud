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

from django.shortcuts import render_to_response
from django.template import RequestContext
from django.contrib.auth.decorators import login_required

from django.conf import settings


@login_required
def index(request, user_name=None, template="index.html"):
    """ Vista principal """

    is_anonymous = False
    if hasattr(request, 'anonymous_id') and request.anonymous_id and request.anonymous_id==request.user.id:
        is_anonymous = True

    try:
        home_gw_url = settings.HOME_GATEWAY_DISPATCHER_URL
    except:
        home_gw_url = None
    
    
    if request.META['HTTP_USER_AGENT'].find("iPhone") >= 0 or request.META['HTTP_USER_AGENT'].find("iPod") >= 0:
        return render_to_response('iphone.html', {}, 
                  context_instance=RequestContext(request, 
                        {'is_anonymous': is_anonymous, 
                         'home_gateway_dispatcher_url': home_gw_url }))
    else:
        return render_to_response(template, {'current_tab': 'dragboard'}, 
                  context_instance=RequestContext(request, 
                        {'is_anonymous': is_anonymous, 
                         'home_gateway_dispatcher_url': home_gw_url }))

@login_required
def wiring(request, user_name=None):
    """ Vista del Wiring """
    return render_to_response('wiring.html', {}, context_instance=RequestContext(request))

@login_required
def index_lite(request, user_name=None):
    """ Vista de ezweb sin cabecera"""
    return index(request, template="index_lite.html")
