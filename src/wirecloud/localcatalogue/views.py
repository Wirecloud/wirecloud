import json
from cStringIO import StringIO

from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.utils.translation import ugettext as _

from catalogue.utils import add_widget_from_wgt, add_resource_from_template
from catalogue.models import CatalogueResource
from catalogue.views import iframe_error
from commons import http_utils
from commons.get_data import get_widget_data
from commons.resource import Resource
from commons.utils import json_encode
from wirecloud.models import Widget, IWidget
from wirecloud.localcatalogue.utils import get_or_add_resource_from_available_marketplaces
from wirecloud.widget.utils import get_or_add_widget_from_catalogue, create_widget_from_template, create_widget_from_wgt
from wirecloud.commons.utils.http import build_error_response, get_content_type, supported_request_mime_types
from wirecloud.commons.utils.template import TemplateParseException, TemplateParser
from wirecloud.commons.utils.transaction import commit_on_http_success
from wirecloud.commons.utils.wgt import WgtFile


class ResourceCollection(Resource):

    @method_decorator(login_required)
    @commit_on_http_success
    def read(self, request):

        resources = {}
        for resource in CatalogueResource.objects.filter(Q(public=True) | Q(users=request.user)):
            if resource.resource_type() == 'widget':
                widgets = Widget.objects.filter(vendor=resource.vendor, name=resource.short_name, version=resource.version)[:1]
                if len(widgets) == 1:

                    widget = widgets[0]

                    resources[resource.local_uri_part] = get_widget_data(widget, request)
                    resources[resource.local_uri_part]['type'] = 'widget'
            else:
                options = json.loads(resource.json_description)
                resources[resource.local_uri_part] = options

        return HttpResponse(json.dumps(resources), mimetype='application/json; chatset=UTF-8')

    @method_decorator(login_required)
    @iframe_error
    @supported_request_mime_types(('application/x-www-form-urlencoded', 'multipart/form-data', 'application/octet-stream'))
    @commit_on_http_success
    def create(self, request):

        force_create = False
        content_type = get_content_type(request)[0]
        if content_type == 'multipart/form-data':
            packaged = True
            if not 'file' in request.FILES:
                return build_error_response(request, 400, _('Missing file to upload'))

            downloaded_file = request.FILES['file']
            wgt_file = WgtFile(downloaded_file)
            template_contents = wgt_file.get_template()

        elif content_type == 'application/octet-stream':
            packaged = True
            downloaded_file = StringIO(request.raw_post_content)
            wgt_file = WgtFile(downloaded_file)
            template_contents = wgt_file.get_template()
        else:
            force_create = request.POST.get('force_create', False) == 'true'
            packaged = request.POST.get('packaged', False) == 'true'
            if 'url' in request.POST:
                templateURL = request.POST['url']
            elif 'template_uri' in request.POST:
                templateURL = request.POST['template_uri']

            try:
                downloaded_file = http_utils.download_http_content(templateURL)
            except:
                return build_error_response(request, 409, _('Content cannot be downloaded'))

            if packaged:
                downloaded_file = StringIO(downloaded_file)
                wgt_file = WgtFile(downloaded_file)
                template_contents = wgt_file.get_template()
            else:
                template_contents = downloaded_file

        # Check if the resource already exist on the catalogue
        try:
            template = TemplateParser(template_contents)

        except TemplateParseException, e:

            return build_error_response(request, 400, unicode(e.msg))

        resources = CatalogueResource.objects.filter(vendor=template.get_resource_vendor(), short_name=template.get_resource_name(), version=template.get_resource_version())[:1]

        # Create/recover catalogue resource
        if len(resources) == 1:
            resource = resources[0]
        else:
            if packaged:
                resource = add_widget_from_wgt(downloaded_file, request.user, wgt_file=wgt_file)
            else:
                resource = add_resource_from_template(templateURL, template_contents, request.user)

        resource.users.add(request.user)

        if resource.resource_type() == 'widget':
            if not force_create and Widget.objects.filter(uri=template.get_resource_uri()).exists():
                local_resource = Widget.objects.get(uri=template.get_resource_uri())
            else:
                try:
                    if packaged:
                        local_resource = create_widget_from_wgt(wgt_file, request.user)
                    else:
                        local_resource = create_widget_from_template(resource.template_uri, request.user)
                except IntegrityError:
                    return build_error_response(request, 409, _('Resource already exists'))

            local_resource.users.add(request.user)
            data = get_widget_data(local_resource, request)
            data['type'] = 'widget'
            return HttpResponse(json_encode((data,)), mimetype='application/json; charset=UTF-8')

        elif resource.resource_type() == 'mashup':
            resources = [json.loads(resource.json_description)]
            workspace_info = json.loads(resource.json_description)
            for tab_entry in workspace_info['tabs']:
                for resource in tab_entry['resources']:
                    widget = get_or_add_widget_from_catalogue(resource.get('vendor'), resource.get('name'), resource.get('version'), request.user)
                    widget_data = get_widget_data(widget)
                    widget_data['type'] = 'widget'
                    resources.append(widget_data)

            for id_, op in workspace_info['wiring']['operators'].iteritems():
                op_id_args = op['name'].split('/')
                op_id_args.append(request.user)
                operator = get_or_add_resource_from_available_marketplaces(*op_id_args)
                resources.append(json.loads(operator.json_description))

            return HttpResponse(json_encode(resources), mimetype='application/json; charset=UTF-8')

        else:  # Mashups and Operators
            return HttpResponse('[' + resource.json_description + ']', mimetype='application/json; charset=UTF-8')


class ResourceEntry(Resource):

    @method_decorator(login_required)
    @commit_on_http_success
    def delete(self, request, vendor, name, version):

        resource = get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version)
        resource.users.remove(request.user)

        if resource.resource_type() == 'widget':
            result = {'removedIWidgets': []}

            widgets = Widget.objects.filter(vendor=resource.vendor, name=resource.short_name, version=resource.version)[:1]
            if len(widgets) == 1:

                widget = widgets[0]

                # Remove all iwidgets that matches the resource
                iwidgets = IWidget.objects.filter(widget=widget, tab__workspace__creator=request.user)
                for iwidget in iwidgets:
                    result['removedIWidgets'].append(iwidget.id)
                    iwidget.delete()

                widget.delete()

            return HttpResponse(json_encode(result), mimetype='application/json; charset=UTF-8')

        else:
            return HttpResponse(status=204)
