from cStringIO import StringIO

from django.http import HttpResponse

from catalogue.utils import add_widget_from_wgt, add_resource_from_template
from catalogue.models import CatalogueResource
from commons import http_utils
from commons.get_data import get_widget_data
from commons.resource import Resource
from commons.utils import json_encode
from wirecloud.models import Widget
from wirecloud.widget.utils import create_widget_from_template, create_widget_from_wgt
from wirecloudcommons.utils.http import get_content_type, supported_request_mime_types
from wirecloudcommons.utils.template import TemplateParser
from wirecloudcommons.utils.transaction import commit_on_http_success
from wirecloudcommons.utils.wgt import WgtFile


class ResourceCollection(Resource):

    @supported_request_mime_types(('application/x-www-form-urlencoded', 'application/octet-stream'))
    @commit_on_http_success
    def create(self, request):

        content_type = get_content_type(request)[0]
        if content_type == 'application/octet-stream':
            wgt_file = WgtFile(StringIO(request.raw_post_data))
            template_contents = wgt_file.get_template()
        else:
            packaged = request.POST.get('packaged', False) == 'true'
            if 'url' in request.POST:
                templateURL = request.POST['url']
            elif 'template_uri' in request.POST:
                templateURL = request.POST['template_uri']

            if packaged:
                wgt_file = WgtFile(StringIO(http_utils.download_http_content(templateURL)))
                template_contents = wgt_file.get_template()
            else:
                template_contents = http_utils.download_http_content(templateURL, user=request.user)

        # Check if the resource already exist on the catalogue
        template = TemplateParser(template_contents)
        resources = CatalogueResource.objects.filter(vendor=template.get_resource_vendor(), short_name=template.get_resource_name(), version=template.get_resource_version())[:1]

        # Create/recover catalogue resource
        if len(resources) == 1:
            resource = resources[0]
        else:
            if packaged:
                resource = add_widget_from_wgt(wgt_file, request.user)
            else:
                resource = add_resource_from_template(templateURL, template_contents, request.user)

        if resource.type == 0:  # Widgets
            if Widget.objects.filter(uri=template.get_resource_uri()).exists():
                local_resource = Widget.objects.get(uri=template.get_resource_uri())
            else:
                if resource.template_uri.lower().endswith('.wgt'):
                    local_resource = create_widget_from_wgt(resource.template_uri, request.user)
                else:
                    local_resource = create_widget_from_template(resource.template_uri, request.user)

            local_resource.users.add(request.user)
            data = get_widget_data(local_resource)
            data['type'] = 'widget'
            return HttpResponse(json_encode(data), mimetype='application/json; charset=UTF-8')
        else:  # Mashups and Operators
            return HttpResponse(resource.json_description, mimetype='application/json; charset=UTF-8')
