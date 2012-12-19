# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import json

from django.db.models import Q
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.http import get_absolute_reverse_url
from wirecloud.platform.get_data import _invalidate_cached_variable_values
from wirecloud.platform.models import Workspace
from wirecloud.platform.wiring.utils import generate_xhtml_operator_code


class WiringEntry(Resource):

    def update(self, request, workspace_id):

        content_type = request.META.get('CONTENT_TYPE', '')
        if content_type is None:
            content_type = ''

        if not content_type.startswith('application/json'):
            return HttpResponseBadRequest(_("Invalid content type"), mimetype='text/plain; charset=UTF-8')

        wiringStatus = request.raw_post_data
        try:
            json.loads(wiringStatus)
        except:
            return HttpResponseBadRequest(_("Request body is not valid JSON data"), mimetype='text/plain; charset=UTF-8')

        workspace = get_object_or_404(Workspace, id=workspace_id)
        if not request.user.is_superuser and workspace.creator != request.user:
            return HttpResponseForbidden()

        workspace.wiringStatus = wiringStatus
        workspace.save()

        _invalidate_cached_variable_values(workspace)

        return HttpResponse(status=204)


class OperatorCollection(Resource):

    def read(self, request):

        response = {}
        for operator in CatalogueResource.objects.filter(Q(type=2) & (Q(public=True) | Q(users=request.user))):
            options = json.loads(operator.json_description)
            response[operator.id] = options

        return HttpResponse(json.dumps(response), mimetype='application/json; chatset=UTF-8')


class OperatorEntry(Resource):

    def read(self, request, vendor, name, version):

        operator = get_object_or_404(CatalogueResource, type=2, vendor=vendor, short_name=name, version=version)
        options = json.loads(operator.json_description)
        js_files = options['js_files']

        base_url = operator.template_uri
        if not base_url.startswith(('http://', 'https://')):
            base_url = get_absolute_reverse_url('wirecloud_catalogue.media', kwargs={
                'vendor': operator.vendor,
                'name': operator.short_name,
                'version': operator.version,
                'file_path': operator.template_uri
            }, request=request)

        xhtml = generate_xhtml_operator_code(js_files, base_url, request)

        return HttpResponse(xhtml, mimetype='application/xhtml+xml; charset=UTF-8')
