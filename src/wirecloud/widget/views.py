# -*- coding: utf-8 -*-

#...............................licence...........................................
#
#     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
#     S.A.Unipersonal (Telefonica I+D)
#
#     This file is part of Morfeo EzWeb Platform.
#
#     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
#
#     You should have received a copy of the GNU Affero General Public License
#     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
#
#     Info about members and contributors of the MORFEO project
#     is available at
#
#     http://morfeo-project.org
#
#...............................licence...........................................#


#
import time
import os

from django.conf import settings
from django.core.cache import cache
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseNotAllowed, HttpResponseServerError, HttpResponseBadRequest
from django.shortcuts import get_object_or_404
from django.utils.encoding import smart_str
from django.utils.translation import ugettext as _
from django.views.static import serve

from commons.authentication import Http403
from commons.cache import no_cache, patch_cache_headers
from commons.utils import get_xml_error, json_encode, get_xhtml_content
from commons.get_data import get_widget_data
from commons.http_utils import download_http_content
from commons.logs_exception import TracedServerError
from commons.resource import Resource

from wirecloud.iwidget.utils import deleteIWidget
from wirecloud.models import Widget, IWidget
import wirecloud.widget.utils as showcase_utils
from wirecloud.widget.utils import get_or_create_widget, create_widget_from_template, fix_widget_code, get_site_domain
from wirecloud.workspace.utils import create_published_workspace_from_template
from wirecloudcommons.utils.template import TemplateParseException, TemplateParser
from wirecloudcommons.utils.transaction import commit_on_http_success


def parseAndCreateWidget(request, user, workspaceId, fromWGT):
    try:

        templateURL = None

        if 'url' in request.POST:
            templateURL = request.POST['url']
        elif 'template_uri' in request.POST:
            templateURL = request.POST['template_uri']
        else:
            msg = _("Missing template URL parameter")
            raise Exception(msg)

        if not workspaceId:
            msg = _("Missing workspaceId parameter")
            raise Exception(msg)

        #get or create the Widget
        return get_or_create_widget(templateURL, user, workspaceId, request, fromWGT)

    except TemplateParseException, e:
        msg = _("Error parsing the template: %(msg)s" % {"msg": e.msg})
        raise TracedServerError(e, {'url': templateURL}, request, msg)
    except IntegrityError, e:
        msg = _("Widget already exists")
        raise TracedServerError(e, {'url': templateURL}, request, msg)
    except IOError, e:
        msg = _("The url is not accesible")
        raise TracedServerError(e, {'url': templateURL}, request, msg)
    except Http403:
        raise
    except Exception, e:
        raise TracedServerError(e, {'url': templateURL}, request, str(e))


def deleteWidget(user, short_name, vendor, version):

    result = {'removedIWidgets': []}

    try:

        widget = Widget.objects.get(name=short_name, vendor=vendor, version=version)

        # Remove all iwidget that matches this Widget Resource
        iwidgets = IWidget.objects.filter(widget=widget)
        for iwidget in iwidgets:
            result['removedIWidgets'].append(iwidget.id)
            deleteIWidget(iwidget, user)

        if widget.xhtml is not None:
            widget.xhtml.delete()

        widget.delete()
        showcase_utils.wgt_deployer.undeploy(vendor, short_name, version)

    except Widget.DoesNotExist:
        pass

    return result


class WidgetCollection(Resource):

    @no_cache
    def read(self, request):

        widgets = Widget.objects.filter(users=request.user)

        data_list = [get_widget_data(widget) for widget in widgets]
        return HttpResponse(json_encode(data_list), mimetype='application/json; charset=UTF-8')

    @commit_on_http_success
    def create(self, request):

        if 'workspaceId' not in request.POST:
            msg = _("Missing workspaceId parameter")
            json = json_encode({"message": msg, "result": "error"})
            return HttpResponseServerError(json, mimetype='application/json; charset=UTF-8')

        #create the widget
        widget = parseAndCreateWidget(request, request.user, request.POST['workspaceId'], request.POST.get('packaged', False) == 'true')

        return HttpResponse(json_encode(get_widget_data(widget)), mimetype='application/json; charset=UTF-8')


class Showcase(Resource):

    @commit_on_http_success
    def create(self, request):

        if 'url' not in request.POST:
            return HttpResponseBadRequest()

        url = request.POST['url']
        template_content = download_http_content(url, user=request.user)
        template = TemplateParser(template_content, base=url)

        if template.get_resource_type() == 'widget':
            create_widget_from_template(template, request.user, request)
        else:
            create_published_workspace_from_template(template, request.user)

        return HttpResponse(status=201)


class WidgetEntry(Resource):

    @no_cache
    def read(self, request, vendor, name, version):
        widget = get_object_or_404(Widget, users=request.user, vendor=vendor, name=name, version=version)
        data_fields = get_widget_data(widget)
        return HttpResponse(json_encode(data_fields), mimetype='application/json; charset=UTF-8')

    def delete(self, request, vendor, name, version):
        widget = get_object_or_404(Widget, users=request.user, vendor=vendor, name=name, version=version)
        widget.delete()
        return HttpResponse('ok')


class WidgetCodeEntry(Resource):

    def read(self, request, vendor, name, version):

        widget = get_object_or_404(Widget, vendor=vendor, name=name, version=version, users=request.user)

        # check if the xhtml code has been cached
        if widget.xhtml.cacheable:
            cache_key = '_widget_xhtml/' + get_site_domain(request) + '/' + str(widget.xhtml.id)
            cache_entry = cache.get(cache_key)
            if cache_entry is not None:
                response = HttpResponse(cache_entry['code'], mimetype='%s; charset=UTF-8' % cache_entry['content_type'])
                patch_cache_headers(response, cache_entry['timestamp'], cache_entry['timeout'])
                return response

        # process xhtml
        xhtml = widget.xhtml

        content_type = xhtml.content_type
        if not content_type:
            content_type = 'text/html'

        code = xhtml.code
        if not xhtml.cacheable or code == '':
            try:
                if xhtml.url.startswith(('http://', 'https://')):
                    code = download_http_content(widget.get_resource_url(xhtml.url, request), user=request.user)
                else:
                    code = download_http_content('file://' + os.path.join(showcase_utils.wgt_deployer.root_dir, xhtml.url), user=request.user)

            except Exception, e:
                # FIXME: Send the error or use the cached original code?
                msg = _("XHTML code is not accessible: %(errorMsg)s") % {'errorMsg': e.message}
                return HttpResponse(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')

        if xhtml.cacheable and (xhtml.code == '' or xhtml.code_timestamp is None):
            xhtml.code = code
            xhtml.code_timestamp = time.time() * 1000
            xhtml.save()
        elif not xhtml.cacheable and xhtml.code != '':
            xhtml.code = ''
            xhtml.code_timestamp = None
            xhtml.save()

        code = fix_widget_code(code, xhtml.url, request)
        if xhtml.cacheable:
            cache_timeout = 31536000  # 1 year
            cache_entry = {
                'code': code,
                'content_type': content_type,
                'timestamp': xhtml.code_timestamp,
                'timeout': cache_timeout,
            }
            cache.set(cache_key, cache_entry, cache_timeout)
        else:
            cache_timeout = 0

        response = HttpResponse(code, mimetype='%s; charset=UTF-8' % content_type)
        patch_cache_headers(response, xhtml.code_timestamp, cache_timeout)
        return response

    def update(self, request, vendor, name, version):
        widget = get_object_or_404(Widget, users=request.user, vendor=vendor, name=name, version=version)
        xhtml = widget.xhtml

        try:
            url = xhtml.url
            if (url.startswith('http')):
                # Absolute URL
                xhtml.code = download_http_content(url, user=request.user)
            else:
                # Relative URL
                if (url.startswith('/deployment/widgets')):
                    #GWT widget package
                    xhtml.code = get_xhtml_content(url)
                else:
                    #Widget with relative url and it's not a GWT package
                    url = widget.get_resource_url(url, request)
                    xhtml.code = download_http_content(url, user=request.user)

            xhtml.save()
        except Exception, e:
            msg = _("XHTML code is not accessible")

            raise TracedServerError(e, {'vendor': vendor, 'name': name, 'version': version}, request, msg)

        return HttpResponse('ok')


def serve_showcase_media(request, vendor, name, version, file_path):

    if request.method != 'GET':
        return HttpResponseNotAllowed(('GET',))

    local_path = os.path.join(
        showcase_utils.wgt_deployer.get_base_dir(vendor, name, version),
        file_path)

    if not os.path.isfile(local_path):
        return HttpResponse(status=404)

    if not getattr(settings, 'USE_XSENDFILE', False):
        return serve(request, local_path, document_root='/')
    else:
        response = HttpResponse()
        response['X-Sendfile'] = smart_str(local_path)
        return response
