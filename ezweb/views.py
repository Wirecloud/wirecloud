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

from commons.authentication import login_public_user
from commons.utils import get_xml_error, json_encode

from workspace.models import WorkSpace

from django.http import HttpResponseServerError
from django.conf import settings
from django.utils.translation import ugettext as _

@login_required
def index(request, user_name=None, template="index.html"):
    return render_ezweb(request, user_name, template)

@login_required
def wiring(request, user_name=None):
    """ Vista del Wiring """
    return render_to_response('wiring.html', {}, context_instance=RequestContext(request))

@login_required
def index_lite(request, user_name=None):
    """ Vista de ezweb sin cabecera"""
    return render_ezweb(request, template="index_lite.html")

def public_ws_viewer(request, public_ws_id):
    """ EzWeb viewer """
    try:
        workspace = WorkSpace.objects.get(id=public_ws_id)
    except WorkSpace.DoesNotExist:
         return HttpResponseServerError(get_xml_error(_('the workspace does not exist')), mimetype='application/xml; charset=UTF-8')
    
    last_user = None
    if (request.user):
        last_user = request.user
    
    public_user=login_public_user(request)
    
    request.user=public_user
    
    if (len(workspace.users.filter(username=public_user.username)) == 1):
        return render_ezweb(request, template="index_viewer.html", public_workspace=public_ws_id, last_user=last_user)
    
    return HttpResponseServerError(get_xml_error(_('the workspace is not shared')), mimetype='application/xml; charset=UTF-8')

def render_ezweb(request, user_name=None, template='index.html', public_workspace='', last_user=''):
    """ Main view """ 
    if request.META['HTTP_USER_AGENT'].find("iPhone") >= 0 or request.META['HTTP_USER_AGENT'].find("iPod") >= 0:
        return render_to_response('iphone.html', {},
                  context_instance=RequestContext(request))
    else:
        if not hasattr(settings, "THEME_URL"):
            if not hasattr(settings, "THEME") or settings.THEME == None:
                settings.THEME = "default"

            settings.THEME_URL = settings.MEDIA_URL + "themes/" + settings.THEME

        return render_to_response(template, {'current_tab': 'dragboard', 'THEME_URL': settings.THEME_URL, 'active_workspace': public_workspace, 'last_user': last_user},
                  context_instance=RequestContext(request))