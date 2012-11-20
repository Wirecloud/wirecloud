from cStringIO import StringIO

from django.db import IntegrityError
from django.http import HttpResponse
from django.utils.translation import ugettext as _

from catalogue.utils import add_widget_from_wgt, add_resource_from_template
from catalogue.models import CatalogueResource
from commons import http_utils
from commons.get_data import get_widget_data
from commons.resource import Resource
from commons.utils import json_encode
from wirecloud.models import Widget
from wirecloud.widget.utils import create_widget_from_template, create_widget_from_wgt
from wirecloudcommons.utils.http import build_error_response, get_content_type, supported_request_mime_types
from wirecloudcommons.utils.template import TemplateParseException, TemplateParser
from wirecloudcommons.utils.transaction import commit_on_http_success
from wirecloudcommons.utils.wgt import WgtFile


class ResourceCollection(Resource):

    @supported_request_mime_types(('application/x-www-form-urlencoded', 'application/octet-stream'))
    @commit_on_http_success
    def create(self, request):

        force_create = False
        content_type = get_content_type(request)[0]
        if content_type == 'application/octet-stream':
            wgt_file = WgtFile(StringIO(request.raw_post_data))
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
                wgt_file = WgtFile(StringIO(downloaded_file))
                template_contents = wgt_file.get_template()
            else:
                template_contents = http_utils.download_http_content(templateURL, user=request.user)

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
                resource = add_widget_from_wgt(wgt_file, request.user)
            else:
                resource = add_resource_from_template(templateURL, template_contents, request.user)

        if resource.type == 0:  # Widgets
            if not force_create and Widget.objects.filter(uri=template.get_resource_uri()).exists():
                local_resource = Widget.objects.get(uri=template.get_resource_uri())
            else:
                try:
                    if resource.template_uri.lower().endswith('.wgt'):
                        local_resource = create_widget_from_wgt(resource.template_uri, request.user)
                    else:
                        local_resource = create_widget_from_template(resource.template_uri, request.user)
                except IntegrityError:
                    return build_error_response(request, 409, _('Resource already exists'))


            local_resource.users.add(request.user)
            data = get_widget_data(local_resource)
            data['type'] = 'widget'
            return HttpResponse(json_encode(data), mimetype='application/json; charset=UTF-8')
        else:  # Mashups and Operators
            return HttpResponse(resource.json_description, mimetype='application/json; charset=UTF-8')
