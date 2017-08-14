# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.contrib import auth
from django.contrib.auth.models import User
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _

from wirecloud.commons.baseviews import Resource, Service
from wirecloud.commons.searchers import get_search_engine, is_available
from wirecloud.commons.utils.http import authentication_required, build_error_response, get_html_basic_error_response, consumes, parse_json_request, produces


extra_formatters = {
    'text/html; charset=utf-8': get_html_basic_error_response,
    'application/xhtml+xml; charset=utf-8': get_html_basic_error_response,
}


def bad_request(request, exception=None):

    return build_error_response(request, 400, 'Bad Request', extra_formatters, context={'request_path': request.path})


def permission_denied(request, exception=None):

    return build_error_response(request, 403, 'Forbidden', extra_formatters, context={'request_path': request.path})


def page_not_found(request):

    return build_error_response(request, 404, 'Page Not Found', extra_formatters, context={'request_path': request.path})


def server_error(request):

    return build_error_response(request, 500, 'Internal Server Error', extra_formatters)


class ResourceSearch(Resource):

    @produces(('application/json',))
    def read(self, request):

        querytext = request.GET.get('q', '')
        indexname = request.GET.get('namespace', '').strip()

        if indexname == '':
            message = _('Missing namespace GET parameter providing a search namespace')
            return build_error_response(request, 400, message)

        if not is_available(indexname):
            message = _('Invalid search namespace: %s' % indexname)
            return build_error_response(request, 422, message)

        try:
            pagenum = int(request.GET.get('pagenum', '1'))
        except ValueError:
            message = _('Invalid pagenum value: %s' % request.GET['pagenum'])
            return build_error_response(request, 422, message)

        try:
            maxresults = int(request.GET.get('maxresults', '30'))
        except ValueError:
            message = _('Invalid maxresults value: %s' % request.GET['maxresults'])
            return build_error_response(request, 422, message)

        result = get_search_engine(indexname).search(querytext, request, pagenum=pagenum, maxresults=maxresults)

        return HttpResponse(json.dumps(result, sort_keys=True), status=200, content_type='application/json; charset=utf-8')


class SwitchUserService(Service):

    @authentication_required
    @consumes(('application/json',))
    def process(self, request):

        if not request.user.is_superuser:
            return build_error_response(request, 403, _("You don't have permission to switch current session user"))

        user_info = parse_json_request(request)

        if "username" not in user_info:
            return build_error_response(request, 422, "Missing target user info")

        user_id = get_object_or_404(User, username=user_info['username']).id
        target_user = None
        for backend in auth.get_backends():
            try:
                target_user = backend.get_user(user_id)
            except:
                continue
            if target_user is None:
                continue
            # Annotate the user object with the path of the backend.
            target_user.backend = "%s.%s" % (backend.__module__, backend.__class__.__name__)
            break

        if target_user is None:
            raise Http404

        auth.login(request, target_user)

        return HttpResponse(status=204)
