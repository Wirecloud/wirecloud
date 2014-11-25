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

from __future__ import unicode_literals

from io import BytesIO
import os
import json
from six.moves.urllib.parse import urljoin
from six.moves.urllib.request import pathname2url, url2pathname

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db.models import Q
from django.http import Http404, HttpResponse, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404, get_list_or_404
from django.utils.decorators import method_decorator
from django.utils.encoding import smart_str
from django.utils.translation import get_language, ugettext as _
from django.views.static import serve
import markdown

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.catalogue.models import search, suggest
import wirecloud.catalogue.utils as catalogue_utils
from wirecloud.catalogue.utils import get_latest_resource_version, get_resource_data, get_resource_group_data
from wirecloud.catalogue.utils import add_packaged_resource, delete_resource
from wirecloud.commons.utils.downloader import download_http_content, download_local_file
from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.cache import no_cache
from wirecloud.commons.utils.html import clean_html
from wirecloud.commons.utils.http import build_error_response, supported_request_mime_types, force_trailing_slash
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
    def create(self, request):

        try:
            if 'file' in request.FILES:

                request_file = request.FILES['file']
                resource = add_packaged_resource(request_file, request.user)

            elif 'template_uri' in request.POST:

                template_uri = request.POST['template_uri']
                downloaded_file = download_http_content(template_uri, user=request.user)
                resource = add_packaged_resource(BytesIO(downloaded_file), request.user)

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

        querytext = request.GET.get('q', '')

        filters = {
            'pagenum': int(request.GET.get('pagenum', '1')),
            'maxresults': int(request.GET.get('maxresults', '30')),
            'orderby': request.GET.get('orderby', '-creation_date'),
            'scope': request.GET.get('scope', None),
            'staff': request.GET.get('staff', 'false').lower() == 'true',
        }

        if not filters['orderby'].replace('-', '', 1) in ['creation_date', 'name', 'vendor']:
            return build_error_response(request, 400, _('Orderby not supported'))

        if filters['scope']:
            filters['scope'] = set(filters['scope'].split(','))
            for scope in filters['scope']:
                if scope not in ['mashup', 'operator', 'widget']:
                    return build_error_response(request, 400, _('Scope not supported: %s') % scope)

        if filters['staff'] and not request.user.is_staff:
            return build_error_response(request, 403, _('Forbidden'))

        response_json = search(querytext, request, **filters)

        return HttpResponse(json.dumps(response_json), content_type='application/json')


class ResourceEntry(Resource):

    def read(self, request, vendor, name, version=None):
        if version is not None:
            resource = get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version)
            data = get_resource_data(resource, request.user, request)
        else:
            resources = get_list_or_404(CatalogueResource.objects.filter(Q(vendor=vendor) & Q(short_name=name) & (Q(public=True) | Q(users=request.user) | Q(groups__in=request.user.groups.all()))).distinct())
            data = get_resource_group_data(resources, request.user, request)

        return HttpResponse(json.dumps(data), content_type='application/json; charset=UTF-8')

    @method_decorator(login_required)
    @commit_on_http_success
    def delete(self, request, vendor, name, version=None):

        response_json = {
            'affectedVersions': [],
            'removedIWidgets': []
        }
        if version is not None:
            # Delete only the specified version of the widget
            resources = (get_object_or_404(CatalogueResource, short_name=name, vendor=vendor, version=version),)
        else:
            # Delete all versions of the widget
            resources = get_list_or_404(CatalogueResource, short_name=name, vendor=vendor)

        for resource in resources:
            result = delete_resource(resource, request.user)
            response_json['affectedVersions'].append(resource.version)
            response_json['removedIWidgets'] += result['removedIWidgets']

        return HttpResponse(json.dumps(response_json), content_type='application/json; charset=UTF-8')


class ResourceSuggestion(Resource):

    def read(self, request):

        prefix = request.GET.get('p', '')
        number = request.GET.get('top', '30')

        if prefix.find(' ') != -1:
            return build_error_response(request, 400, _('Invalid prefix text'))

        if not number.isdigit():
            return build_error_response(request, 400, _('Invalid top number'))

        number = int(number)
        response_json = suggest(request, prefix, number)

        return HttpResponse(json.dumps(response_json), content_type='application/json')


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
        doc_relative_path = url2pathname(resource_info['changelog'])
        doc_base_url = force_trailing_slash(urljoin(resource.get_template_url(request=request, for_base=True), pathname2url(os.path.dirname(doc_relative_path))))
        doc_path = os.path.join(catalogue_utils.wgt_deployer.get_base_dir(vendor, name, version), doc_relative_path)

        (doc_filename_root, doc_filename_ext) = os.path.splitext(doc_path)
        localized_doc_path = doc_filename_root + '.' + get_language() + doc_filename_ext

        try:
            doc_code = download_local_file(localized_doc_path)
        except:
            try:
                doc_code = download_local_file(doc_path)
            except:
                msg = _('Error opening the changelog file')
                doc_code = '<div class="margin-top: 10px"><p>%s</p></div>' % msg

        doc_code = doc_code.decode('utf-8')
        doc_pre_html = markdown.markdown(doc_code, output_format='xhtml5', extensions=['codehilite'])
        doc = clean_html(doc_pre_html, base_url=doc_base_url)
        return HttpResponse(doc, content_type='application/xhtml+xml; charset=UTF-8')


class ResourceDocumentationEntry(Resource):

    def read(self, request, vendor, name, version):

        resource = get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version)
        resource_info = json.loads(resource.json_description)
        if resource_info['doc'] == '':
            raise Http404

        doc_base_url = None
        if resource_info['doc'].startswith(('http://', 'https://')):
            doc_code = _('You can find the documentation of this resource in this external <a target="_blank" href="%s">link</a>') % resource_info['doc']
            doc_code = '<div style="margin-top: 10px"><p>%s</p></div>' % doc_code
        else:
            doc_relative_path = url2pathname(resource_info['doc'])
            doc_base_url = force_trailing_slash(urljoin(resource.get_template_url(request=request, for_base=True), pathname2url(os.path.dirname(doc_relative_path))))
            doc_path = os.path.join(catalogue_utils.wgt_deployer.get_base_dir(vendor, name, version), doc_relative_path)

            (doc_filename_root, doc_filename_ext) = os.path.splitext(doc_path)
            localized_doc_path = doc_filename_root + '.' + get_language() + doc_filename_ext

            try:
                doc_code = download_local_file(localized_doc_path)
            except:
                try:
                    doc_code = download_local_file(doc_path)
                except:
                    msg = _('Error opening the documentation file')
                    doc_code = '<div class="margin-top: 10px"><p>%s</p></div>' % msg

        doc_code = doc_code.decode('utf-8')
        doc_pre_html = markdown.markdown(doc_code, output_format='xhtml5', extensions=['codehilite'])
        doc = clean_html(doc_pre_html, base_url=doc_base_url)
        return HttpResponse(doc, content_type='application/xhtml+xml; charset=UTF-8')
