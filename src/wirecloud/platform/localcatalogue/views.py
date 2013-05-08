# -*- coding: utf-8 -*-

# Copyright 2012-2013 Universidad Politécnica de Madrid

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
from cStringIO import StringIO
import os

from django.conf import settings
from django.db import IntegrityError
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import simplejson
from django.utils.encoding import smart_str
from django.utils.translation import ugettext as _
from django.views.static import serve

from wirecloud.catalogue.models import CatalogueResource
import wirecloud.catalogue.utils as catalogue_utils
from wirecloud.catalogue.views import iframe_error
from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils import downloader
from wirecloud.commons.utils.http import authentication_required, build_error_response, get_content_type, supported_request_mime_types
from wirecloud.commons.utils.template import TemplateParseException
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.get_data import get_widget_data
from wirecloud.platform.models import Widget, IWidget
from wirecloud.platform.localcatalogue.utils import install_resource_to_user, get_or_add_resource_from_available_marketplaces
from wirecloud.platform.widget.utils import get_or_add_widget_from_catalogue


class ResourceCollection(Resource):

    @authentication_required
    def read(self, request):

        resources = {}
        for resource in CatalogueResource.objects.filter(Q(public=True) | Q(users=request.user) | Q(groups=request.user.groups.all())):
            if resource.resource_type() == 'widget':
                try:
                    widget = resource.widget

                    resources[resource.local_uri_part] = get_widget_data(widget, request)
                    resources[resource.local_uri_part]['type'] = 'widget'

                except Widget.DoesNotExist:
                    pass

            else:
                options = json.loads(resource.json_description)
                resources[resource.local_uri_part] = options

        return HttpResponse(json.dumps(resources), mimetype='application/json; chatset=UTF-8')

    @authentication_required
    @iframe_error
    @supported_request_mime_types(('application/x-www-form-urlencoded', 'application/json', 'multipart/form-data', 'application/octet-stream'))
    @commit_on_http_success
    def create(self, request):

        force_create = False
        templateURL = None
        file_contents = None
        content_type = get_content_type(request)[0]
        if content_type == 'multipart/form-data':
            packaged = True
            force_create = request.POST.get('force_create', False) == 'true'
            if not 'file' in request.FILES:
                return build_error_response(request, 400, _('Missing file to upload'))

            downloaded_file = request.FILES['file']
            file_contents = WgtFile(downloaded_file)

        elif content_type == 'application/octet-stream':
            packaged = True
            if request._read_started:
                downloaded_file = StringIO(request.raw_post_data)
            else:
                downloaded_file = request

            file_contents = WgtFile(downloaded_file)
        else:
            if content_type == 'application/json':
                try:
                    data = simplejson.loads(request.raw_post_data)
                except Exception, e:
                    msg = _("malformed json data: %s") % unicode(e)
                    return build_error_response(request, 400, msg)

                force_create = data.get('force_create', False)
                packaged = data.get('packaged', False)
                templateURL = data.get('template_uri')
            else:
                force_create = request.POST.get('force_create', False) == 'true'
                packaged = request.POST.get('packaged', False) == 'true'
                if 'url' in request.POST:
                    templateURL = request.POST['url']
                elif 'template_uri' in request.POST:
                    templateURL = request.POST['template_uri']

            try:
                downloaded_file = downloader.download_http_content(templateURL)
            except:
                return build_error_response(request, 409, _('Content cannot be downloaded'))

            if packaged:
                downloaded_file = StringIO(downloaded_file)
                file_contents = WgtFile(downloaded_file)
            else:
                file_contents = downloaded_file

        # TODO for now, install dependencies if force_create is true
        install_dep = force_create
        try:
            resource = install_resource_to_user(request.user, file_contents=file_contents, templateURL=templateURL, packaged=packaged, raise_conflicts=force_create)

        except TemplateParseException, e:

            return build_error_response(request, 400, unicode(e.msg))

        except IntegrityError:

            return build_error_response(request, 409, _('Resource already exists'))

        if resource.resource_type() == 'widget':

            data = get_widget_data(resource.widget, request)
            data['type'] = 'widget'
            if install_dep:
                return HttpResponse(simplejson.dumps((data,)), status=201, mimetype='application/json; charset=UTF-8')
            else:
                return HttpResponse(simplejson.dumps(data), status=201, mimetype='application/json; charset=UTF-8')

        elif install_dep and resource.resource_type() == 'mashup':
            resources = [json.loads(resource.json_description)]
            workspace_info = json.loads(resource.json_description)
            for tab_entry in workspace_info['tabs']:
                for resource in tab_entry['resources']:
                    widget = get_or_add_widget_from_catalogue(resource.get('vendor'), resource.get('name'), resource.get('version'), request.user)
                    widget_data = get_widget_data(widget, request)
                    widget_data['type'] = 'widget'
                    resources.append(widget_data)

            for id_, op in workspace_info['wiring']['operators'].iteritems():
                op_id_args = op['name'].split('/')
                op_id_args.append(request.user)
                operator = get_or_add_resource_from_available_marketplaces(*op_id_args)
                resources.append(json.loads(operator.json_description))

            return HttpResponse(simplejson.dumps(resources), status=201, mimetype='application/json; charset=UTF-8')

        elif install_dep:
            return HttpResponse('[' + resource.json_description + ']', status=201, mimetype='application/json; charset=UTF-8')
        else:
            return HttpResponse(resource.json_description, status=201, mimetype='application/json; charset=UTF-8')


class ResourceEntry(Resource):

    @authentication_required
    def read(self, request, vendor, name, version):

        file_name = '_'.join((vendor, name, version)) + '.wgt'
        base_dir = catalogue_utils.wgt_deployer.get_base_dir(vendor, name, version)
        local_path = os.path.normpath(os.path.join(base_dir, file_name))

        if not os.path.isfile(local_path):
            return HttpResponse(status=404)

        if not getattr(settings, 'USE_XSENDFILE', False):
            return serve(request, local_path, document_root='/')
        else:
            response = HttpResponse()
            response['X-Sendfile'] = smart_str(local_path)
            return response

    @authentication_required
    @commit_on_http_success
    def delete(self, request, vendor, name, version):

        resource = get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version)
        resource.users.remove(request.user)

        if resource.resource_type() == 'widget':
            result = {'removedIWidgets': []}

            query = Widget.objects.filter(resource=resource)
            if query.exists():

                widget = query.get()

                # Remove all iwidgets that matches the resource
                iwidgets = IWidget.objects.filter(widget=widget, tab__workspace__creator=request.user)
                for iwidget in iwidgets:
                    result['removedIWidgets'].append(iwidget.id)
                    iwidget.delete()

            if request.GET.get('affected', 'false').lower() == 'true':
                return HttpResponse(simplejson.dumps(result), mimetype='application/json; charset=UTF-8')

        return HttpResponse(status=204)
