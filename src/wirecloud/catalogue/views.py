# -*- coding: utf-8 -*-

# Copyright (c) 2011-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

import os
from cStringIO import StringIO
import json
from urllib import url2pathname

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db.models import Q
from django.http import HttpResponse, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404, get_list_or_404
from django.utils.decorators import method_decorator
from django.utils.encoding import smart_str
from django.utils.translation import ugettext as _
from django.views.static import serve
import markdown

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.catalogue.models import search
import wirecloud.catalogue.utils as catalogue_utils
from wirecloud.catalogue.utils import get_latest_resource_version, get_resource_data, get_resource_group_data
from wirecloud.catalogue.utils import add_packaged_resource, add_resource_from_template, delete_resource
from wirecloud.commons.utils.downloader import download_http_content, download_local_file
from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.cache import no_cache
from wirecloud.commons.utils.http import build_error_response, supported_request_mime_types
from wirecloud.commons.utils.template import TemplateParseException
from wirecloud.commons.utils.transaction import commit_on_http_success


def serve_catalogue_media(request, vendor, name, version, file_path):

    if request.method != 'GET':
        return HttpResponseNotAllowed(('GET',))

    base_dir = catalogue_utils.wgt_deployer.get_base_dir(vendor, name, version)
    local_path = os.path.normpath(os.path.join(base_dir, url2pathname(file_path)))

    if not os.path.isfile(local_path):
        return HttpResponse(status=404)

    if not getattr(settings, 'USE_XSENDFILE', False):
        return serve(request, file_path, document_root=base_dir)
    else:
        response = HttpResponse()
        response['X-Sendfile'] = smart_str(local_path)
        return response


class ResourceCollection(Resource):

    @method_decorator(login_required)
    @commit_on_http_success
    @supported_request_mime_types(('application/x-www-form-urlencoded', 'multipart/form-data'))
    def create(self, request, fromWGT=False):

        try:
            if 'file' in request.FILES:

                request_file = request.FILES['file']
                resource = add_packaged_resource(request_file, request.user)

            elif 'template_uri' in request.POST:

                template_uri = request.POST['template_uri']
                downloaded_file = download_http_content(template_uri, user=request.user)
                if request.POST.get('packaged', 'false').lower() == 'true':
                    resource = add_packaged_resource(StringIO(downloaded_file), request.user)
                else:
                    resource = add_resource_from_template(template_uri, downloaded_file, request.user)

            else:

                return build_error_response(request, 400, _("Missing parameter: template_uri or file"))

        except TemplateParseException as e:

            return build_error_response(request, 400, unicode(e.msg))

        except IntegrityError:

            return build_error_response(request, 409, _('Resource already exists'))

        resource.users.add(request.user)
        return HttpResponse(resource.json_description, content_type='application/json; charset=UTF-8')

    @no_cache
    def read(self, request):

        user = request.user
        querytext = unicode(request.GET.get('q', ''))

        filters = {
            'pagenum': int(request.GET.get('pagenum', '1')),
            'pagelen': int(request.GET.get('pagelen', '10')),
            'orderby': request.GET.get('orderby', '-creation_date'),
            'scope': request.GET.get('scope', None),
            'staff': request.GET.get('staff', 'false').lower() == 'true',
        }

        if not filters['orderby'].replace('-', '', 1) in ['creation_date', 'name', 'vendor']:
            return build_error_response(request, 400, _('Orderby not supported'))

        if filters['scope'] and not filters['scope'] in ['mashup', 'operator', 'widget']:
            return build_error_response(request, 400, _('Scope not supported'))

        if filters['staff'] and not user.is_staff:
            return build_error_response(request, 403, _('Forbidden'))

        response_json = search(querytext, user, **filters)

        return HttpResponse(json.dumps(response_json), content_type='application/json')


class ResourceEntry(Resource):

    def read(self, request, vendor, name, version=None):
        if version is not None:
            resource = get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version)
            data = get_resource_data(resource, request.user, request)
        else:
            resources = get_list_or_404(CatalogueResource, Q(vendor=vendor) & Q(short_name=name) & (Q(public=True) | Q(users=request.user) | Q(groups__in=request.user.groups.all())))
            data = get_resource_group_data(resources, request.user, request)

        return HttpResponse(json.dumps(data), content_type='application/json; charset=UTF-8')

    @method_decorator(login_required)
    @commit_on_http_success
    def delete(self, request, vendor, name, version=None):

        response_json = {'result': 'ok', 'removedIWidgets': []}
        if version is not None:
            #Delete only the specified version of the widget
            resource = get_object_or_404(CatalogueResource, short_name=name,
                                         vendor=vendor, version=version)
            result = delete_resource(resource, request.user)
            response_json['removedIWidgets'] = result['removedIWidgets']
        else:
            #Delete all versions of the widget
            resources = get_list_or_404(CatalogueResource, short_name=name, vendor=vendor)
            for resource in resources:
                result = delete_resource(resource, request.user)
                response_json['removedIWidgets'] += result['removedIWidgets']

        return HttpResponse(json.dumps(response_json),
                            content_type='application/json; charset=UTF-8')


class ResourceVersionCollection(Resource):

    @supported_request_mime_types(('application/json',))
    def create(self, request):

        try:
            resources = json.loads(request.body)
        except ValueError as e:
            msg = _("malformed json data: %s") % unicode(e)
            return build_error_response(request, 400, msg)

        result = []
        for g in resources:
            latest_resource_version = get_latest_resource_version(g["name"], g["vendor"])
            if latest_resource_version:
                # the resource is still in the catalogue
                g["lastVersion"] = latest_resource_version.version
                g["lastVersionURL"] = latest_resource_version.template_uri
                result.append(g)

        return HttpResponse(json.dumps({'resources': result}),
                            content_type='application/json; charset=UTF-8')


class ResourceChangelogEntry(Resource):

    def read(self, request, vendor, name, version):

        resource = get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version)
        resource_info = resource.get_processed_info(process_urls=False)
        doc_path = os.path.join(catalogue_utils.wgt_deployer.get_base_dir(vendor, name, version), url2pathname(resource_info['changelog']))
        doc_code = download_local_file(doc_path)
        doc = markdown.markdown(doc_code, output_format='xhtml5')
        return HttpResponse(doc, content_type='application/xhtml+xml; charset=UTF-8')
