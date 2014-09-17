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

from django.http import HttpResponse
from django.utils.translation import ugettext_lazy as _

from wirecloud.commons.baseviews import Resource
from wirecloud.commons.searchers import get_search_engine, is_available
from wirecloud.commons.utils.cache import no_cache
from wirecloud.commons.utils.http import build_error_response, get_html_basic_error_response


extra_formatters = {
    'text/html; charset=utf-8': get_html_basic_error_response,
    'application/xhtml+xml; charset=utf-8': get_html_basic_error_response,
}


def page_not_found(request):

    return build_error_response(request, 404, 'Page Not Found', extra_formatters, context={'request_path': request.path})


def server_error(request):

    return build_error_response(request, 500, 'Internal Server Error', extra_formatters)


class JsonResponse(HttpResponse):

    def __init__(self, data, **kwargs):
        kwargs.setdefault('content_type', 'application/json')
        content = json.dumps(data)

        HttpResponse.__init__(self, content=content, **kwargs)


class ResourceSearch(Resource):

    @no_cache
    def read(self, request):
        querytext = request.GET.get('q', '')
        indexname = request.GET.get('namespace', '')

        if not indexname or not is_available(indexname):
            message = _('A supported namespace is required.')
            return build_error_response(request, 400, message)

        response = get_search_engine(indexname).search(querytext)

        return JsonResponse(response)
