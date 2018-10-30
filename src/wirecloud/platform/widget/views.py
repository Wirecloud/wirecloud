# -*- coding: utf-8 -*-

# Copyright (c) 2011-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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
import time
import os
from urllib.request import url2pathname

from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext as _
from django.views.decorators.http import require_GET
from django.views.generic import TemplateView

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.cache import patch_cache_headers
from wirecloud.commons.utils.downloader import download_local_file
from wirecloud.commons.utils.http import build_response, build_downloadfile_response, get_current_domain
from wirecloud.platform.themes import get_active_theme_name
import wirecloud.platform.widget.utils as showcase_utils
from wirecloud.platform.widget.utils import WIDGET_ERROR_FORMATTERS, fix_widget_code, get_widget_platform_style


def process_requirements(requirements):

    return dict((requirement['name'], {}) for requirement in requirements)


def process_widget_code(request, resource):

    mode = request.GET.get('mode', 'classic')
    theme = request.GET.get('theme', get_active_theme_name())
    widget_info = resource.json_description

    # check if the xhtml code has been cached
    if widget_info['contents']['cacheable'] is True:

        cache_key = resource.widget.xhtml.get_cache_key(get_current_domain(request), mode, theme)
        cache_entry = cache.get(cache_key)
        if cache_entry is not None:
            response = HttpResponse(cache_entry['code'], content_type=cache_entry['content_type'])
            patch_cache_headers(response, cache_entry['timestamp'], cache_entry['timeout'])
            return response

    # process xhtml
    xhtml = resource.widget.xhtml
    content_type = widget_info['contents'].get('contenttype', 'text/html')
    charset = widget_info['contents'].get('charset', 'utf-8')

    code = xhtml.code
    if not xhtml.cacheable or code == '':
        try:
            code = download_local_file(os.path.join(showcase_utils.wgt_deployer.root_dir, url2pathname(xhtml.url)))

        except Exception as e:
            if isinstance(e, IOError) and e.errno == errno.ENOENT:
                return build_response(request, 404, {'error_msg': _("Widget code not found"), 'details': "%s" % e}, WIDGET_ERROR_FORMATTERS)
            else:
                return build_response(request, 500, {'error_msg': _("Error reading widget code"), 'details': "%s" % e}, WIDGET_ERROR_FORMATTERS)
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

    try:
        code = fix_widget_code(code, content_type, request, charset, xhtml.use_platform_style, process_requirements(widget_info['requirements']), mode, theme)
    except UnicodeDecodeError:
        msg = _('Widget code was not encoded using the specified charset (%(charset)s as stated in the widget description file).') % {'charset': charset}
        return build_response(request, 502, {'error_msg': msg}, WIDGET_ERROR_FORMATTERS)
    except Exception as e:
        msg = _('Error processing widget code')
        return build_response(request, 502, {'error_msg': msg, 'details': "%s" % e}, WIDGET_ERROR_FORMATTERS)

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
    if resource.resource_type() not in ['widget', 'operator']:
        raise Http404()

    # For now, all widgets and operators are freely accessible/distributable
    # if not resource.is_available_for(request.user):
    #     return build_error_response(request, 403, "Forbidden")

    if resource.resource_type() == 'widget' and request.GET.get('entrypoint', 'false') == 'true':
        return process_widget_code(request, resource)

    base_dir = showcase_utils.wgt_deployer.get_base_dir(vendor, name, version)
    response = build_downloadfile_response(request, file_path, base_dir)
    if response.status_code == 302:
        response['Location'] = reverse('wirecloud.showcase_media', kwargs={"vendor": vendor, "name": name, "version": version, "file_path": response['Location']})

    return response


class MissingWidgetCodeView(TemplateView):

    template_name = 'wirecloud/workspace/missing_widget.html'

    def get_context_data(self, **kwargs):
        context = super(MissingWidgetCodeView, self).get_context_data(**kwargs)
        theme = self.request.GET.get('theme', get_active_theme_name())
        context['style'] = get_widget_platform_style(theme)
        return context
