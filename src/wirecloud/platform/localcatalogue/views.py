# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

import errno
from io import BytesIO
import json
import os
import zipfile

from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_list_or_404, get_object_or_404
from django.utils.translation import ugettext as _
import six

from wirecloud.catalogue.models import CatalogueResource
import wirecloud.catalogue.utils as catalogue_utils
from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.http import authentication_required, authentication_required_cond, build_downloadfile_response, build_error_response, get_content_type, normalize_boolean_param, consumes, parse_json_request, produces
from wirecloud.commons.utils.structures import CaseInsensitiveDict
from wirecloud.commons.utils.template import TemplateParseException, UnsupportedFeature
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.commons.utils.wgt import InvalidContents, WgtFile
from wirecloud.platform.localcatalogue.signals import resource_uninstalled
from wirecloud.platform.localcatalogue.utils import install_resource_to_user, install_resource_to_all_users, fix_dev_version
from wirecloud.platform.markets.utils import get_market_managers
from wirecloud.platform.models import Workspace
from wirecloud.platform.settings import ALLOW_ANONYMOUS_ACCESS
from wirecloud.proxy.views import parse_context_from_referer, WIRECLOUD_PROXY


class ResourceCollection(Resource):

    @authentication_required
    @produces(('application/json',))
    def read(self, request):

        process_urls = request.GET.get('process_urls', 'true') == 'true'
        resources = {}
        if request.user.is_authenticated():
            for resource in CatalogueResource.objects.filter(Q(public=True) | Q(users=request.user) | Q(groups__in=request.user.groups.all())):
                options = resource.get_processed_info(request, process_urls=process_urls, url_pattern_name="wirecloud.showcase_media")
                resources[resource.local_uri_part] = options

        return HttpResponse(json.dumps(resources, sort_keys=True), content_type='application/json; chatset=UTF-8')

    @authentication_required
    @consumes(('application/json', 'multipart/form-data', 'application/octet-stream'))
    @produces(('application/json',))
    @commit_on_http_success
    def create(self, request):

        status_code = 201
        force_create = False
        install_embedded_resources = False
        templateURL = None
        file_contents = None
        content_type = get_content_type(request)[0]
        if content_type == 'multipart/form-data':
            force_create = request.POST.get('force_create', 'false').strip().lower() == 'true'
            public = request.POST.get('public', 'false').strip().lower() == 'true'
            install_embedded_resources = request.POST.get('install_embedded_resources', 'false').strip().lower() == 'true'
            if 'file' not in request.FILES:
                return build_error_response(request, 400, _('Missing component file in the request'))

            downloaded_file = request.FILES['file']
            try:
                file_contents = WgtFile(downloaded_file)
            except zipfile.BadZipfile:
                return build_error_response(request, 400, _('The uploaded file is not a zip file'))

        elif content_type == 'application/octet-stream':

            downloaded_file = BytesIO(request.body)
            try:
                file_contents = WgtFile(downloaded_file)
            except zipfile.BadZipfile:
                return build_error_response(request, 400, _('The uploaded file is not a zip file'))

            force_create = request.GET.get('force_create', 'false').strip().lower() == 'true'
            public = request.GET.get('public', 'false').strip().lower() == 'true'
            install_embedded_resources = request.GET.get('install_embedded_resources', 'false').strip().lower() == 'true'
        else:  # if content_type == 'application/json'

            market_endpoint = None

            data = parse_json_request(request)

            install_embedded_resources = normalize_boolean_param(request, 'install_embedded_resources', data.get('install_embedded_resources', False))
            force_create = data.get('force_create', False)
            public = request.GET.get('public', 'false').strip().lower() == 'true'
            templateURL = data.get('url')
            market_endpoint = data.get('market_endpoint', None)
            headers = data.get('headers', {})

            if market_endpoint is not None:

                if 'name' not in market_endpoint:
                    msg = _('Missing market name')
                    return build_error_response(request, 400, msg)

                market_id = market_endpoint['name']
                market_managers = get_market_managers(request.user)
                if market_id not in market_managers:
                    return build_error_response(request, 409, _('Unknown market: %s') % market_id)

                market_manager = market_managers[market_id]
                downloaded_file = market_manager.download_resource(request.user, templateURL, market_endpoint)

            else:

                try:
                    context = parse_context_from_referer(request)
                except:
                    context = {}

                try:
                    context["headers"] = CaseInsensitiveDict(headers)
                    response = WIRECLOUD_PROXY.do_request(request, templateURL, "GET", context)
                    if response.status_code >= 300 or response.status_code < 200:
                        raise Exception()

                    downloaded_file = b''.join(response)
                except:
                    return build_error_response(request, 409, _('Content cannot be downloaded from the specified url'))

            try:
                downloaded_file = BytesIO(downloaded_file)
                file_contents = WgtFile(downloaded_file)

            except zipfile.BadZipfile:

                return build_error_response(request, 400, _('The file downloaded from the marketplace is not a zip file'))

        if public and not request.user.is_superuser:
            return build_error_response(request, 403, _('You are not allowed to make resources publicly available to all users'))

        try:
            fix_dev_version(file_contents, request.user)
            added, resource = install_resource_to_user(request.user, file_contents=file_contents, templateURL=templateURL)

            if not added and force_create:
                return build_error_response(request, 409, _('Resource already exists'))
            elif not added:
                status_code = 200

            if public:
                install_resource_to_all_users(executor_user=request.user, file_contents=file_contents)

        except zipfile.BadZipfile as e:

            return build_error_response(request, 400, _('The uploaded file is not a valid zip file'), details="{}".format(e))

        except OSError as e:

            if e.errno == errno.EACCES:
                return build_error_response(request, 500, _('Error writing the resource into the filesystem. Please, contact the server administrator.'))
            else:
                raise

        except TemplateParseException as e:

            msg = "Error parsing config.xml descriptor file: %s" % e

            details = "%s" % e
            return build_error_response(request, 400, msg, details=details)

        except (InvalidContents, UnsupportedFeature) as e:

            details = e.details if hasattr(e, 'details') else None
            return build_error_response(request, 400, e, details=six.text_type(details))

        if install_embedded_resources:

            info = {
                'resource_details': resource.get_processed_info(request, url_pattern_name="wirecloud.showcase_media"),
                'extra_resources': []
            }
            if resource.resource_type() == 'mashup':
                resource_info = resource.get_processed_info(process_urls=False)
                for embedded_resource in resource_info['embedded']:
                    resource_file = BytesIO(file_contents.read(embedded_resource['src']))

                    extra_resource_contents = WgtFile(resource_file)
                    if public:
                        extra_resource_added, extra_resource = install_resource_to_user(request.user, file_contents=extra_resource_contents, raise_conflicts=False)
                    else:
                        extra_resource_added, extra_resource = install_resource_to_user(request.user, file_contents=extra_resource_contents, raise_conflicts=False)
                    if extra_resource_added:
                        info['extra_resources'].append(extra_resource.get_processed_info(request, url_pattern_name="wirecloud.showcase_media"))

            return HttpResponse(json.dumps(info, sort_keys=True), status=status_code, content_type='application/json; charset=UTF-8')

        else:

            return HttpResponse(json.dumps(resource.get_processed_info(request, url_pattern_name="wirecloud.showcase_media"), sort_keys=True), status=status_code, content_type='application/json; charset=UTF-8')


class ResourceEntry(Resource):

    @authentication_required
    def read(self, request, vendor, name, version):

        resource = get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version)
        if not request.user.is_superuser and not resource.is_available_for(request.user):
            return build_error_response(request, 403, _('You are not allowed to retrieve info about this resource'))

        file_name = '_'.join((vendor, name, version)) + '.wgt'
        base_dir = catalogue_utils.wgt_deployer.get_base_dir(vendor, name, version)
        response = build_downloadfile_response(request, file_name, base_dir)
        response['Content-Type'] = resource.mimetype
        return response

    @authentication_required
    @commit_on_http_success
    def delete(self, request, vendor, name, version=None):

        if version is not None:
            resources = [get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version, users=request.user)]
        else:
            resources = get_list_or_404(CatalogueResource, vendor=vendor, short_name=name, users=request.user)

        result = {
            "affectedVersions": []
        } if request.GET.get('affected', 'false').lower() == 'true' else None

        for resource in resources:
            resource.users.remove(request.user)
            resource_uninstalled.send(sender=resource, user=request.user)
            if result is not None:
                result['affectedVersions'].append(resource.version)

            if resource.public is False and resource.users.count() == 0 and resource.groups.count() == 0:
                resource.delete()

        if result is not None:
            return HttpResponse(json.dumps(result), content_type='application/json; charset=UTF-8')
        else:
            return HttpResponse(status=204)


class ResourceDescriptionEntry(Resource):

    # @authentication_required
    def read(self, request, vendor, name, version):

        resource = get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version)
        # For now, all components are freely accessible/distributable
        # if not request.user.is_superuser and not resource.is_available_for(request.user):
        #     return build_error_response(request, 403, _('You are not allowed to retrieve info about this resource'))

        resource_info = resource.get_processed_info(request, process_urls=request.GET.get('process_urls', 'true') == 'true')
        if request.GET.get('include_wgt_files', '').lower() == 'true':
            base_dir = catalogue_utils.wgt_deployer.get_base_dir(resource.vendor, resource.short_name, resource.version)
            wgt_file = zipfile.ZipFile(os.path.join(base_dir, resource.template_uri))
            resource_info['wgt_files'] = [filename for filename in wgt_file.namelist() if filename[-1] != '/']
            wgt_file.close()

        return HttpResponse(json.dumps(resource_info, sort_keys=True), content_type='application/json; charset=UTF-8')


class WorkspaceResourceCollection(Resource):

    @authentication_required_cond(ALLOW_ANONYMOUS_ACCESS)
    def read(self, request, workspace_id):

        workspace = get_object_or_404(Workspace, id=workspace_id)
        if not workspace.is_available_for(request.user):
            return build_error_response(request, 403, _("You don't have access to this workspace"))

        resources = set()
        for tab in workspace.tab_set.all():
            for iwidget in tab.iwidget_set.select_related('widget__resource').all():
                if iwidget.widget is not None and iwidget.widget.resource.is_available_for(workspace.creator):
                    resources.add(iwidget.widget.resource)

        for operator_id, operator in six.iteritems(workspace.wiringStatus['operators']):
            vendor, name, version = operator['name'].split('/')
            try:
                resource = CatalogueResource.objects.get(vendor=vendor, short_name=name, version=version)
                if resource.is_available_for(workspace.creator):
                    resources.add(resource)
            except CatalogueResource.DoesNotExist:
                pass

        result = {}
        process_urls = request.GET.get('process_urls', 'true') == 'true'
        for resource in resources:
            if resource.is_available_for(workspace.creator):
                options = resource.get_processed_info(request, process_urls=process_urls, url_pattern_name="wirecloud.showcase_media")
                result[resource.local_uri_part] = options

        return HttpResponse(json.dumps(result, sort_keys=True), content_type='application/json; chatset=UTF-8')
