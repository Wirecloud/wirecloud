# -*- coding: utf-8 -*-

# Copyright (c) 2012 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.contrib.auth.decorators import login_required
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.utils.http import urlencode

from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.http import build_error_response
from wirecloud.platform.plugins import get_active_features
from wirecloud.platform.models import Workspace
from wirecloud.platform.workspace.utils import get_workspace_list


class FeatureCollection(Resource):

    def read(self, request):
        info = get_active_features()
        features = {}
        for feature_name in info:
            features[feature_name] = info[feature_name]['version']

        return HttpResponse(json.dumps(features), mimetype='application/json; charset=UTF-8')


def render_root_page(request):
    return auto_select_workspace(request, request.GET.get('view', None))


@login_required
def auto_select_workspace(request, mode=None):
    _junk1, active_workspace, _junk2 = get_workspace_list(request.user)

    url = reverse('wirecloud.workspace_view', kwargs={
        'creator_user': active_workspace.workspace.creator.username,
        'workspace': active_workspace.workspace.name,
    })

    if mode:
        url += '?' + urlencode({'view': mode})

    return HttpResponseRedirect(url)


@login_required
def render_workspace_view(request, creator_user, workspace):
    get_workspace_list(request.user)

    workspace = get_object_or_404(Workspace, creator__username=creator_user, name=workspace)
    if request.user not in workspace.users.all():
        return build_error_response(request, 403, 'forbidden')

    return render_wirecloud(request)


def render_wirecloud(request, view_type=None):

    if view_type is None:
        if 'view' in request.GET:
            view_type = request.GET['view']
        else:
            user_agent = request.META['HTTP_USER_AGENT']
            if user_agent.find("iPhone") != -1 or user_agent.find("iPod") != -1 or user_agent.find('Android') != -1:
                view_type = 'smartphone'
            else:
                view_type = 'classic'

    return render(request, 'wirecloud/views/%s.html' % view_type, content_type="application/xhtml+xml; charset=UTF-8")
