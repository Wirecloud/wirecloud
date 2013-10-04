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
import json
import time
import os
from urllib import url2pathname
from urlparse import urljoin

from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.core.cache import cache
from django.http import HttpResponse, HttpResponseForbidden, Http404
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.utils.encoding import smart_str
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_GET
from django.views.static import serve

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.baseviews import Resource
from wirecloud.commons.exceptions import Http403
from wirecloud.commons.utils import downloader
from wirecloud.commons.utils.cache import patch_cache_headers
from wirecloud.commons.utils.http import build_error_response, get_absolute_reverse_url, get_current_domain, get_xml_error_response
from wirecloud.platform.iwidget.utils import deleteIWidget
from wirecloud.platform.models import Widget, IWidget
import wirecloud.platform.widget.utils as showcase_utils
from wirecloud.platform.widget.utils import fix_widget_code


def deleteWidget(user, name, vendor, version):

    result = {'removedIWidgets': []}

    try:

        widget = Widget.objects.get(resource__short_name=name, resource__vendor=vendor, resource__version=version)

        # TODO
        # Remove all iwidget that matches this Widget Resource
        iwidgets = IWidget.objects.filter(widget=widget)
        for iwidget in iwidgets:
            result['removedIWidgets'].append(iwidget.id)
            deleteIWidget(iwidget, user)

        widget.delete()

    except Widget.DoesNotExist:
        pass

    return result


class WidgetCodeEntry(Resource):

    @method_decorator(login_required)
    def read(self, request, vendor, name, version):

        resource = get_object_or_404(CatalogueResource.objects.select_related('widget__xhtml'), vendor=vendor, short_name=name, version=version)
        if not resource.is_available_for(request.user):
            raise Http403()

        if resource.resource_type() != 'widget':
            raise Http404()

        widget_info = json.loads(resource.json_description)

        # check if the xhtml code has been cached
        if widget_info['code_cacheable'] is True:

            cache_key = resource.widget.xhtml.get_cache_key(get_current_domain(request))
            cache_entry = cache.get(cache_key)
            if cache_entry is not None:
                response = HttpResponse(cache_entry['code'], mimetype=cache_entry['mimetype'])
                patch_cache_headers(response, cache_entry['timestamp'], cache_entry['timeout'])
                return response

        # process xhtml
        xhtml = resource.widget.xhtml
        content_type = widget_info.get('code_content_type', 'text/html')
        charset = widget_info.get('code_charset', 'utf-8')

        force_base = False
        base_url = xhtml.url
        if not base_url.startswith(('http://', 'https://')):
            base_url = get_absolute_reverse_url('wirecloud_showcase.media', args=(base_url.split('/', 4)), request=request)
            force_base = True

        code = xhtml.code
        if not xhtml.cacheable or code == '':
            try:
                if xhtml.url.startswith(('http://', 'https://')):
                    code = downloader.download_http_content(urljoin(base_url, xhtml.url), user=request.user)
                else:
                    code = downloader.download_http_content('file://' + os.path.join(showcase_utils.wgt_deployer.root_dir, url2pathname(xhtml.url)), user=request.user)

            except Exception, e:
                msg = _("XHTML code is not accessible: %(errorMsg)s") % {'errorMsg': e.message}
                return build_error_response(request, 502, msg)
        else:
            # Code contents comes as unicode from persistence, we need bytes
            code = code.encode(charset)

        if xhtml.cacheable and (xhtml.code == '' or xhtml.code_timestamp is None):
            xhtml.code = code.decode(charset)
            xhtml.code_timestamp = time.time() * 1000
            xhtml.save()
        elif not xhtml.cacheable and xhtml.code != '':
            xhtml.code = ''
            xhtml.code_timestamp = None
            xhtml.save()

        try:
            code = fix_widget_code(code, base_url, content_type, request, charset, xhtml.use_platform_style, force_base=force_base)
        except UnicodeEncodeError:
            msg = _('Widget code was not encoded using the specified charset (%(charset)s according to the widget descriptor file).')
            return build_error_response(request, 502, msg % {'charset': charset})

        if xhtml.cacheable:
            cache_timeout = 31536000  # 1 year
            cache_entry = {
                'code': code,
                'mimetype': '%s; charset=%s' % (content_type, charset),
                'timestamp': xhtml.code_timestamp,
                'timeout': cache_timeout,
            }
            cache.set(cache_key, cache_entry, cache_timeout)
        else:
            cache_timeout = 0

        response = HttpResponse(code, mimetype='%s; charset=%s' % (content_type, charset))
        patch_cache_headers(response, xhtml.code_timestamp, cache_timeout)
        return response


@require_GET
def serve_showcase_media(request, vendor, name, version, file_path):

    resource = get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version)
    if not resource.is_available_for(request.user):
        return HttpResponseForbidden()

    base_dir = showcase_utils.wgt_deployer.get_base_dir(vendor, name, version)
    local_path = os.path.join(base_dir, url2pathname(file_path))

    if not os.path.isfile(local_path):
        return HttpResponse(status=404)

    if not getattr(settings, 'USE_XSENDFILE', False):
        return serve(request, file_path, document_root=base_dir)
    else:
        response = HttpResponse()
        response['X-Sendfile'] = smart_str(local_path)
        return response
