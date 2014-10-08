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

from django.core.cache import cache
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.cache import CacheableData
from wirecloud.commons.utils.http import authentication_required, build_error_response, get_absolute_reverse_url, get_current_domain, supported_request_mime_types
from wirecloud.platform.models import Workspace
from wirecloud.platform.wiring.utils import generate_xhtml_operator_code, get_operator_cache_key


class WiringEntry(Resource):

    @authentication_required
    @supported_request_mime_types(('application/json',))
    def update(self, request, workspace_id):

        wiring_status_string = request.body
        try:
            wiring_status = json.loads(wiring_status_string)
        except ValueError as e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        workspace = get_object_or_404(Workspace, id=workspace_id)
        if not request.user.is_superuser and workspace.creator != request.user:
            return build_error_response(request, 403, _('You are not allowed to update this workspace'))

        old_wiring_status = json.loads(workspace.wiringStatus)
        old_read_only_connections = []
        for connection in old_wiring_status['connections']:
            if connection.get('readOnly', False):
                old_read_only_connections.append(connection)

        read_only_connections = []
        for connection in wiring_status['connections']:
            if connection.get('readOnly', False):
                read_only_connections.append(connection)

        if len(old_read_only_connections) > len(read_only_connections):
            return build_error_response(request, 403, _('You are not allowed to remove read only connections'))

        for connection in old_read_only_connections:
            if connection not in read_only_connections:
                return build_error_response(request, 403, _('You are not allowed to remove read only connections'))

        workspace.wiringStatus = wiring_status_string
        workspace.save()

        return HttpResponse(status=204)


def process_requirements(requirements):

    return dict((requirement['name'], {}) for requirement in requirements)


class OperatorEntry(Resource):

    def read(self, request, vendor, name, version):

        operator = get_object_or_404(CatalogueResource, type=2, vendor=vendor, short_name=name, version=version)
        # For now, all operators are freely accessible/distributable
        #if not operator.is_available_for(request.user):
        #    return HttpResponseForbidden()

        mode = request.GET.get('mode', 'classic')

        key = get_operator_cache_key(operator, get_current_domain(request), mode)
        cached_response = cache.get(key)
        if cached_response is None:
            options = json.loads(operator.json_description)
            js_files = options['js_files']

            base_url = operator.template_uri
            if not base_url.startswith(('http://', 'https://')):
                base_url = get_absolute_reverse_url('wirecloud.showcase_media', kwargs={
                    'vendor': operator.vendor,
                    'name': operator.short_name,
                    'version': operator.version,
                    'file_path': operator.template_uri
                }, request=request)

            xhtml = generate_xhtml_operator_code(js_files, base_url, request, process_requirements(options['requirements']), mode)
            cache_timeout = 31536000  # 1 year
            cached_response = CacheableData(xhtml, timeout=cache_timeout, content_type='application/xhtml+xml; charset=UTF-8')

            cache.set(key, cached_response, cache_timeout)

        return cached_response.get_response()
