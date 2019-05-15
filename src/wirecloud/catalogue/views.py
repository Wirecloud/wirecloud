# -*- coding: utf-8 -*-

# Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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

import errno
from io import BytesIO
import os
import json
from urllib.parse import urljoin
from urllib.request import pathname2url, url2pathname
import zipfile

from django.core.exceptions import PermissionDenied
from django.core.urlresolvers import reverse
from django.db.models import Q
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404, get_list_or_404
from django.utils.translation import get_language, ugettext as _
from django.views.decorators.http import require_GET
import markdown

from wirecloud.catalogue.models import CatalogueResource
import wirecloud.catalogue.utils as catalogue_utils
from wirecloud.catalogue.utils import get_latest_resource_version, get_resource_data, get_resource_group_data
from wirecloud.commons.utils.downloader import download_local_file
from wirecloud.commons.utils.wgt import InvalidContents, WgtFile
from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.html import clean_html, filter_changelog
from wirecloud.commons.utils.http import authentication_required, build_error_response, build_downloadfile_response, consumes, force_trailing_slash, parse_json_request, produces
from wirecloud.commons.utils.template import TemplateParseException
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.commons.utils.version import Version
from wirecloud.commons.search_indexes import get_search_engine
from wirecloud.platform.localcatalogue.utils import install_component


@require_GET
def serve_catalogue_media(request, vendor, name, version, file_path):

    base_dir = catalogue_utils.wgt_deployer.get_base_dir(vendor, name, version)

    response = build_downloadfile_response(request, file_path, base_dir)
    if response.status_code == 302:
        response['Location'] = reverse('wirecloud_catalogue.media', kwargs={"vendor": vendor, "name": name, "version": version, "file_path": response['Location']})

    return response


class ResourceCollection(Resource):

    @authentication_required
    @consumes(('multipart/form-data', 'application/octet-stream'))
    @produces(('application/json',))
    @commit_on_http_success
    def create(self, request):

        file_contents = None
        if request.mimetype == 'multipart/form-data':
            public = request.POST.get('public', 'true').strip().lower() == 'true'
            if 'file' not in request.FILES:
                return build_error_response(request, 400, _('Missing component file in the request'))

            downloaded_file = request.FILES['file']

        else:  # if request.mimetype == 'application/octet-stream'
            downloaded_file = BytesIO(request.body)
            public = request.GET.get('public', 'true').strip().lower() == 'true'

        try:
            file_contents = WgtFile(downloaded_file)
        except zipfile.BadZipfile:
            return build_error_response(request, 400, _('The uploaded file is not a zip file'))

        try:

            added, resource = install_component(file_contents, executor_user=request.user, public=public, users=(request.user,), restricted=True)
            if not added:
                return build_error_response(request, 409, _('Resource already exists'))

        except OSError as e:

            if e.errno == errno.EACCES:
                return build_error_response(request, 500, _('Error writing the resource into the filesystem. Please, contact the server administrator.'))
            else:
                raise

        except TemplateParseException as e:

            msg = "Error parsing config.xml descriptor file"
            return build_error_response(request, 400, msg, details=str(e))

        except InvalidContents as e:

            details = e.details if hasattr(e, 'details') else None
            return build_error_response(request, 400, e, details=str(details))

        response = HttpResponse(status=(201 if added else 204))
        response['Location'] = resource.get_template_url()
        return response

    def read(self, request):

        querytext = request.GET.get('q', '')

        filters = {
            'orderby': request.GET.get('orderby', '-creation_date'),
            'scope': request.GET.get('scope', None),
            'staff': request.GET.get('staff', 'false').lower() == 'true',
        }

        try:
            filters['pagenum'] = int(request.GET.get('pagenum', '1'))
        except ValueError:
            message = _('Invalid pagenum value: %s' % request.GET['pagenum'])
            return build_error_response(request, 422, message)

        try:
            filters['maxresults'] = int(request.GET.get('maxresults', '30'))
        except ValueError:
            message = _('Invalid maxresults value: %s' % request.GET['maxresults'])
            return build_error_response(request, 422, message)

        if not filters['orderby'].replace('-', '', 1) in ['creation_date', 'name', 'vendor']:
            return build_error_response(request, 400, _('Orderby value not supported: %s') % filters['orderby'])

        # This API only supports ordering by one field, but the searcher supports ordering by multiple fields
        filters['orderby'] = [filters['orderby']]

        if filters['scope']:
            filters['scope'] = filters['scope'].split(',')
            for scope in filters['scope']:
                if scope not in ['mashup', 'operator', 'widget']:
                    return build_error_response(request, 400, _('Scope value not supported: %s') % scope)

        if filters['staff'] and not request.user.is_staff:
            return build_error_response(request, 403, _('Forbidden'))

        response_json = get_search_engine("resource")(querytext, request, **filters)

        return HttpResponse(json.dumps(response_json, sort_keys=True), content_type='application/json')


class ResourceEntry(Resource):

    def read(self, request, vendor, name, version=None):
        objects = CatalogueResource.objects.exclude(template_uri="")
        if version is not None:
            resource = get_object_or_404(objects, vendor=vendor, short_name=name, version=version)
            data = get_resource_data(resource, request.user, request)
        else:
            if request.user.is_authenticated():
                resources = get_list_or_404(objects.filter(Q(vendor=vendor) & Q(short_name=name) & (Q(public=True) | Q(users=request.user) | Q(groups__in=request.user.groups.all()))).distinct())
            else:
                resources = get_list_or_404(objects.filter(Q(vendor=vendor) & Q(short_name=name) & Q(public=True)))
            data = get_resource_group_data(resources, request.user, request)

        return HttpResponse(json.dumps(data, sort_keys=True), content_type='application/json; charset=UTF-8')

    @authentication_required
    @commit_on_http_success
    def delete(self, request, vendor, name, version=None):

        response_json = {
            'affectedVersions': [],
        }
        if version is not None:
            # Delete only the specified version of the widget
            resource = get_object_or_404(CatalogueResource, short_name=name, vendor=vendor, version=version)

            # Check the user has permissions
            if not resource.is_removable_by(request.user, vendor=True):
                msg = _("user %(username)s is not the owner of the resource %(resource_id)s") % {'username': request.user.username, 'resource_id': resource.id}
                raise PermissionDenied(msg)

            resources = (resource,)
        else:
            # Delete all versions of the widget
            resources = get_list_or_404(CatalogueResource, short_name=name, vendor=vendor)

            # Check the user has permissions (we only require to check this with one of the resources)
            if not resources[0].is_removable_by(request.user, vendor=True):
                msg = _("user %(username)s is not the owner of the resource %(resource_id)s") % {'username': request.user.username, 'resource_id': '{}/{}'.format(vendor, name)}
                raise PermissionDenied(msg)

        for resource in resources:
            # Mark as not available
            resource.template_uri = ""
            resource.save()
            response_json['affectedVersions'].append(resource.version)

        return HttpResponse(json.dumps(response_json), content_type='application/json; charset=UTF-8')


class ResourceVersionCollection(Resource):

    @consumes(('application/json',))
    def create(self, request):

        resources = parse_json_request(request)

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

    @produces(('application/xhtml+xml',))
    def read(self, request, vendor, name, version):

        from_version = request.GET.get('from')
        if from_version is not None:
            try:
                from_version = Version(from_version)
            except ValueError:
                return build_error_response(request, 422, _("Missing parameter: template_uri or file"))

        resource = get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version)
        resource_info = resource.get_processed_info(process_urls=False)
        if resource_info['changelog'] == '':
            raise Http404

        doc_relative_path = url2pathname(resource_info['changelog'])
        doc_base_url = force_trailing_slash(urljoin(resource.get_template_url(request=request, for_base=True), pathname2url(os.path.dirname(doc_relative_path))))
        doc_path = os.path.join(catalogue_utils.wgt_deployer.get_base_dir(vendor, name, version), doc_relative_path)

        (doc_filename_root, doc_filename_ext) = os.path.splitext(doc_path)
        localized_doc_path = doc_filename_root + '.' + get_language() + doc_filename_ext

        try:
            doc_code = download_local_file(localized_doc_path).decode('utf-8')
        except Exception:
            try:
                doc_code = download_local_file(doc_path).decode('utf-8')
            except Exception:
                msg = _('Error opening the changelog file')
                doc_code = '<div class="margin-top: 10px"><p>%s</p></div>' % msg

        doc_pre_html = markdown.markdown(doc_code, output_format='xhtml5', extensions=['markdown.extensions.codehilite', 'markdown.extensions.fenced_code'])

        if from_version:
            doc_pre_html = filter_changelog(doc_pre_html, from_version)
            if doc_pre_html.strip() == '':
                raise Http404

        doc = clean_html(doc_pre_html, base_url=doc_base_url)
        return HttpResponse(doc, content_type='application/xhtml+xml; charset=UTF-8')


class ResourceDocumentationEntry(Resource):

    @produces(('application/xhtml+xml',))
    def read(self, request, vendor, name, version):

        resource = get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version)
        resource_info = resource.json_description
        if resource_info['doc'] == '':
            raise Http404

        doc_base_url = None
        if resource_info['doc'].startswith(('http://', 'https://')):
            doc_code = _('You can find the userguide of this component in this external <a target="_blank" href="%s">link</a>') % resource_info['doc']
            doc_code = '<div style="margin-top: 10px"><p>%s</p></div>' % doc_code
        else:
            doc_relative_path = url2pathname(resource_info['doc'])
            doc_base_url = force_trailing_slash(urljoin(resource.get_template_url(request=request, for_base=True), pathname2url(os.path.dirname(doc_relative_path))))
            doc_path = os.path.join(catalogue_utils.wgt_deployer.get_base_dir(vendor, name, version), doc_relative_path)

            (doc_filename_root, doc_filename_ext) = os.path.splitext(doc_path)
            localized_doc_path = doc_filename_root + '.' + get_language() + doc_filename_ext

            try:
                doc_code = download_local_file(localized_doc_path).decode('utf-8')
            except Exception:
                try:
                    doc_code = download_local_file(doc_path).decode('utf-8')
                except Exception:
                    msg = _('Error opening the userguide file')
                    doc_code = '<div class="margin-top: 10px"><p>%s</p></div>' % msg

        doc_pre_html = markdown.markdown(doc_code, output_format='xhtml5', extensions=['markdown.extensions.codehilite', 'markdown.extensions.fenced_code'])
        doc = clean_html(doc_pre_html, base_url=doc_base_url)
        return HttpResponse(doc, content_type='application/xhtml+xml; charset=UTF-8')
