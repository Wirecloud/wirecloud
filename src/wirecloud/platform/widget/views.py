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

import json
import time
import os
from six.moves.urllib.parse import urljoin
from six.moves.urllib.request import url2pathname

from django.conf import settings
from django.core.cache import cache
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils.encoding import smart_str
from django.utils.http import urlunquote
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_GET
from django.views.static import serve

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.baseviews import Resource
from wirecloud.commons.utils.cache import patch_cache_headers
from wirecloud.commons.utils.downloader import download_http_content, download_local_file
from wirecloud.commons.utils.http import build_response, get_absolute_reverse_url, get_current_domain
import wirecloud.platform.widget.utils as showcase_utils
from wirecloud.platform.widget.utils import WIDGET_ERROR_FORMATTERS, fix_widget_code


def process_requirements(requirements):

    return dict((requirement['name'], {}) for requirement in requirements)


class WidgetCodeEntry(Resource):

    def read(self, request, vendor, name, version):

        resource = get_object_or_404(CatalogueResource.objects.select_related('widget__xhtml'), vendor=vendor, short_name=name, version=version)
        # For now, all widgets are freely accessible/distributable
        #if not resource.is_available_for(request.user):
        #    return build_error_response(request, 403, "Forbidden")

        if resource.resource_type() != 'widget':
            raise Http404()

        mode = request.GET.get('mode', 'classic')
        widget_info = json.loads(resource.json_description)

        # check if the xhtml code has been cached
        if widget_info['contents']['cacheable'] is True:

            cache_key = resource.widget.xhtml.get_cache_key(get_current_domain(request), mode)
            cache_entry = cache.get(cache_key)
            if cache_entry is not None:
                response = HttpResponse(cache_entry['code'], content_type=cache_entry['content_type'])
                patch_cache_headers(response, cache_entry['timestamp'], cache_entry['timeout'])
                return response

        # process xhtml
        xhtml = resource.widget.xhtml
        content_type = widget_info['contents'].get('contenttype', 'text/html')
        charset = widget_info['contents'].get('charset', 'utf-8')

        force_base = False
        base_url = xhtml.url
        if not base_url.startswith(('http://', 'https://')):
            # Newer versions of Django urlencode urls created using reverse
            # Fix double encoding
            base_url = urlunquote(base_url)
            base_url = get_absolute_reverse_url('wirecloud.showcase_media', args=(base_url.split('/', 4)), request=request)
            force_base = True

        code = xhtml.code
        if not xhtml.cacheable or code == '':
            try:
                if xhtml.url.startswith(('http://', 'https://')):
                    code = download_http_content(urljoin(base_url, xhtml.url), user=request.user)
                else:
                    code = download_local_file(os.path.join(showcase_utils.wgt_deployer.root_dir, url2pathname(xhtml.url)))

            except Exception as e:
                return build_response(request, 502, {'error_msg': _("(X)HTML code is not accessible"), 'details': "%s" % e}, WIDGET_ERROR_FORMATTERS)
        else:
            # Code contents comes as unicode from persistence, we need bytes
            code = code.encode(charset)

        if xhtml.cacheable and (xhtml.code == '' or xhtml.code_timestamp is None):
            try:
                xhtml.code = code.decode(charset)
            except UnicodeDecodeError:
                msg = _('Widget code was not encoded using the specified charset (%(charset)s as stated in the widget description file).') % {'charset': charset}
                return build_response(request, 502, {'error_msg': msg}, WIDGET_ERROR_FORMATTERS)

            xhtml.code_timestamp = time.time() * 1000
            xhtml.save()
        elif not xhtml.cacheable and xhtml.code != '':
            xhtml.code = ''
            xhtml.code_timestamp = None
            xhtml.save()

        try:
            code = fix_widget_code(code, base_url, content_type, request, charset, xhtml.use_platform_style, process_requirements(widget_info['requirements']), force_base, mode)
        except UnicodeDecodeError:
            msg = _('Widget code was not encoded using the specified charset (%(charset)s as stated in the widget description file).') % {'charset': charset}
            return build_response(request, 502, {'error_msg': msg}, WIDGET_ERROR_FORMATTERS)
        except Exception as e:
            msg = _('Error processing widget code')
            return build_response(request, 502, {'error_msg': msg, 'details':"%s" % e}, WIDGET_ERROR_FORMATTERS)

        if xhtml.cacheable:
            cache_timeout = 31536000  # 1 year
            cache_entry = {
                'code': code,
                'content_type': '%s; charset=%s' % (content_type, charset),
                'timestamp': xhtml.code_timestamp,
                'timeout': cache_timeout,
            }
            cache.set(cache_key, cache_entry, cache_timeout)
        else:
            cache_timeout = 0

        response = HttpResponse(code, content_type='%s; charset=%s' % (content_type, charset))
        patch_cache_headers(response, xhtml.code_timestamp, cache_timeout)
        return response


@require_GET
def serve_showcase_media(request, vendor, name, version, file_path):

    resource = get_object_or_404(CatalogueResource, vendor=vendor, short_name=name, version=version)
    # For now, all widgets are freely accessible/distributable
    #if not resource.is_available_for(request.user):
    #    return build_error_response(request, 403, "Forbidden")

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
