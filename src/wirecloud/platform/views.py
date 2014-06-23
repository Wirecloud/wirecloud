# -*- coding: utf-8 -*-

# Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import json
from six.moves.urllib.parse import urlparse, urlunparse, parse_qs

from django.contrib.auth.views import redirect_to_login
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.template import TemplateDoesNotExist
from django.utils.http import urlencode
from user_agents import parse as ua_parse

from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.http import build_error_response
from wirecloud.platform.plugins import get_active_features_info
from wirecloud.platform.models import Workspace
from wirecloud.platform.settings import ALLOW_ANONYMOUS_ACCESS
from wirecloud.platform.workspace.utils import get_workspace_list


class FeatureCollection(Resource):

    def read(self, request):
        features = get_active_features_info()

        return HttpResponse(json.dumps(features), content_type='application/json; charset=UTF-8')


def render_root_page(request):
    return auto_select_workspace(request, request.GET.get('mode', None))


def auto_select_workspace(request, mode=None):

    if ALLOW_ANONYMOUS_ACCESS is False and request.user.is_authenticated() is False:
        return redirect_to_login(request.get_full_path())

    _junk1, active_workspace = get_workspace_list(request.user)

    if active_workspace is not None:
        url = reverse('wirecloud.workspace_view', kwargs={
            'owner': active_workspace.workspace.creator.username,
            'name': active_workspace.workspace.name,
        })

        if mode:
            url += '?' + urlencode({'mode': mode})

        return HttpResponseRedirect(url)
    elif request.user.is_authenticated():
        return render_wirecloud(request, mode)
    else:
        return render(request, 'wirecloud/landing_page.html', content_type="application/xhtml+xml; charset=UTF-8")


def render_workspace_view(request, owner, name):

    if ALLOW_ANONYMOUS_ACCESS is False and request.user.is_authenticated() is False:
        return redirect_to_login(request.get_full_path())

    get_workspace_list(request.user)

    workspace = get_object_or_404(Workspace, creator__username=owner, name=name)
    if not workspace.public and request.user not in workspace.users.all():
        if request.user.is_authenticated():
            return build_error_response(request, 403, 'forbidden')
        else:
            return redirect_to_login(request.get_full_path())

    return render_wirecloud(request)

def get_default_view(request):

    if 'default_mode' not in request.session:
        user_agent = ua_parse(request.META['HTTP_USER_AGENT'])
        if user_agent.is_mobile:
            mode = 'smartphone'
        else:
            mode = 'classic'

        request.session['default_mode'] = mode

    return request.session['default_mode']


def render_wirecloud(request, view_type=None):

    if view_type is None:
        if 'mode' in request.GET:
            view_type = request.GET['mode']
        else:
            view_type = get_default_view(request)

    try:
        return render(request, 'wirecloud/views/%s.html' % view_type, {'VIEW_MODE': view_type}, content_type="application/xhtml+xml; charset=UTF-8")
    except TemplateDoesNotExist:
        if 'mode' in request.GET:
            url = urlparse(request.build_absolute_uri())
            query_params = parse_qs(url.query, True)
            del query_params['mode']
            return HttpResponseRedirect(urlunparse((
                url.scheme,
                url.netloc,
                url.path,
                url.params,
                urlencode(query_params, True),
                url.fragment
            )))
        else:
            view_type = get_default_view(request)
            return render_wirecloud(request, view_type)
