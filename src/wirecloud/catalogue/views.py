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

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.catalogue.catalogue_utils import get_latest_resource_version
from wirecloud.catalogue.catalogue_utils import get_resource_response, filter_resources_by_user
from wirecloud.catalogue.catalogue_utils import filter_resources_by_scope
from wirecloud.catalogue.catalogue_utils import get_and_filter, get_or_filter, get_not_filter
from wirecloud.catalogue.catalogue_utils import get_event_filter, get_slot_filter, get_paginatedlist
from wirecloud.catalogue.catalogue_utils import group_resources
from wirecloud.catalogue.get_json_catalogue_data import get_resource_data
import wirecloud.catalogue.utils as catalogue_utils
from wirecloud.catalogue.utils import add_widget_from_wgt, add_resource_from_template, delete_resource
from wirecloud.commons.utils.downloader import download_http_content
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
                resource = add_widget_from_wgt(request_file, request.user)

            elif 'template_uri' in request.POST:

                template_uri = request.POST['template_uri']
                downloaded_file = download_http_content(template_uri, user=request.user)
                if request.POST.get('packaged', 'false').lower() == 'true':
                    resource = add_widget_from_wgt(StringIO(downloaded_file), request.user)
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
    def read(self, request, pag=0, offset=0):

        format = request.GET.get('format', 'default')
        orderby = request.GET.get('orderby', '-creation_date')
        scope = request.GET.get('scope', 'all')

        # Get all resource in the catalogue
        resources = filter_resources_by_scope(CatalogueResource.objects.all(), scope)
        resources = resources.order_by(orderby)
        resources = group_resources(resources)
        resources = filter_resources_by_user(request.user, resources)
        items = len(resources)

        resources = get_paginatedlist(resources, int(pag), int(offset))

        return get_resource_response(resources, format, items, request.user, request)


class ResourceEntry(Resource):

    #@method_decorator(login_required)
    def read(self, request, vendor, name, version):
        resource = get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version)
        return HttpResponse(json.dumps(get_resource_data(resource, request.user, request)), content_type='application/json; charset=UTF-8')

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


class ResourceCollectionBySimpleSearch(Resource):

    @no_cache
    def read(self, request, criteria, pag=0, offset=0):

        orderby = request.GET.get('orderby', '-creation_date')
        format = request.GET.get('format', 'default')
        scope = request.GET.get('scope', 'all')

        if criteria == 'connectEventSlot':
            search_criteria = request.GET.getlist('search_criteria')
        else:
            search_criteria = request.GET.get('search_criteria')

        resources = CatalogueResource.objects.none()

        if criteria == 'and':
            filters = get_and_filter(search_criteria, request.user)
        elif criteria == 'or' or criteria == 'simple_or':
            filters = get_or_filter(search_criteria, request.user)
        elif criteria == 'not':
            filters = get_not_filter(search_criteria, request.user)
        elif criteria == 'event':
            filters = get_event_filter(search_criteria)
        elif criteria == 'slot':
            filters = get_slot_filter(search_criteria)
        elif criteria == 'connectSlot':
            # get all resource compatible with the given events
            search_criteria = search_criteria.split()
            for e in search_criteria:
                resources = CatalogueResource.objects.filter(
                    Q(widgetwiring__friendcode=e),
                    Q(widgetwiring__wiring='out'))

        elif criteria == 'connectEvent':
            # get all resource compatible with the given slots
            search_criteria = search_criteria.split()
            filters = Q()
            for e in search_criteria:
                filters = filters | Q(widgetwiring__friendcode=e)
            filters = filters & Q(widgetwiring__wiring='out')

        resources = CatalogueResource.objects.filter(filters)
        resources = filter_resources_by_scope(resources, scope)
        resources = resources.order_by(orderby)
        resources = group_resources(resources)
        resources = filter_resources_by_user(request.user, resources)

        items = len(resources)
        resources = get_paginatedlist(resources, pag, offset)

        return get_resource_response(resources, format, items, request.user, request)


class ResourceCollectionByGlobalSearch(Resource):

    @no_cache
    def read(self, request, pag=0, offset=0):

        orderby = request.GET.get('orderby', '-creation_date')
        format = request.GET.get('format', 'default')
        scope = request.GET.get('scope', 'all')
        search_criteria = request.GET.getlist('search_criteria')
        search_boolean = request.GET.get('search_boolean')

        if search_boolean == 'AND':
            join_filters = lambda x, y: x & y
        else:
            join_filters = lambda x, y: x | y

        filters = Q()
        if search_criteria[0] != "":
            filters = get_and_filter(search_criteria[0], request.user)
        if search_criteria[1] != "":
            filters = join_filters(filters, get_or_filter(search_criteria[1], request.user))
        if search_criteria[2] != "":
            filters = join_filters(filters, get_not_filter(search_criteria[2], request.user))
        if search_criteria[4] != "":
            filters = join_filters(filters, get_event_filter(search_criteria[4]))
        if search_criteria[5] != "":
            filters = join_filters(filters, get_slot_filter(search_criteria[5]))

        resources = CatalogueResource.objects.filter(filters)
        resources = filter_resources_by_scope(resources, scope).distinct()
        resources = resources.order_by(orderby)
        resources = group_resources(resources)
        resources = filter_resources_by_user(request.user, resources)
        items = len(resources)

        resources = get_paginatedlist(resources, pag, offset)

        return get_resource_response(resources, format, items, request.user, request)


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
