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
import socket
from urlparse import urljoin

from django.core.urlresolvers import reverse
from django.http import HttpResponse
from django.utils.translation import ugettext as _
from lxml import etree

from wirecloud.commons.utils import mimeparser


def get_html_basic_error_response(request, mimetype, status_code, context):
    from django.shortcuts import render
    return render(request, '%s.html' % status_code, context, status=status_code, content_type=mimetype)


def get_xml_error_response(request, mimetype, status_code, context):

    doc = etree.Element('error')

    description = etree.Element('description')
    description.text = context['error_msg']

    doc.append(description)

    if context.get('details') is not None:
        details_element = etree.Element('details')
        for key in context['details']:
            element = etree.Element(key)
            if isinstance(context['details'][key], basestring):
                element.text = context['details'][key]
            else:
                for key2 in context['details'][key]:
                    list_element = etree.Element('element')
                    list_element.text = context['details'][key][key2]
                    element.append(list_element)

            details_element.append(element)

    return etree.tostring(doc, pretty_print=False, method='xml')


def get_json_error_response(request, mimetype, status_code, context):
    body = {
        'description': context['error_msg']
    }
    if context.get('details') is not None:
        body['details'] = context['details']

    return json.dumps(body)


def get_plain_text_error_response(request, mimetype, status_code, context):
    return unicode(context['error_msg'])


ERROR_FORMATTERS = {
    'application/json; charset=utf-8': get_json_error_response,
    'application/xml; charset=utf-8': get_xml_error_response,
    'text/html; charset=utf-8': get_html_basic_error_response,
    'application/xhtml+xml; charset=utf-8': get_html_basic_error_response,
    'text/plain; charset=utf-8': get_plain_text_error_response,
    '': get_plain_text_error_response,   # Fallback
}

def build_response(request, status_code, context, formatters, headers):

    if request.META.get('HTTP_X_REQUESTED_WITH', '') == 'XMLHttpRequest':
        mimetype = 'application/json; charset=utf-8'
    else:
        formatter_keys = formatters.keys()
        formatter_keys.remove('')
        mimetype = mimeparser.best_match(formatter_keys, request.META.get('HTTP_ACCEPT', '*/*'))

    if mimetype in formatters:
        formatter = formatters[mimetype]
    else:
        raise Exception('No suitable formatter found')

    body = formatter(request, mimetype, status_code, context)
    response = HttpResponse(body, mimetype=mimetype, status=status_code)
    if headers is None:
        headers = {}

    for header_name in headers:
        response[header_name] = headers[header_name]

    return response


def build_error_response(request, status_code, error_msg, extra_formats=None, headers=None, details=None):

    if extra_formats is not None:
        formatters = extra_formats.copy()
        formatters.update(ERROR_FORMATTERS)
    else:
        formatters = ERROR_FORMATTERS

    return build_response(request, status_code, {'error_msg': error_msg, 'details': details}, formatters, headers)


def parse_mime_type(mime_type):
    parts = mime_type.split(';')
    params = dict([tuple([s.strip() for s in param.split('=', 1)])
            for param in parts[1:]
                  ])
    full_type = parts[0].strip()
    if full_type == '*':
        full_type = '*/*'

    return (full_type, params)


def get_content_type(request):
    content_type_header = request.META.get('CONTENT_TYPE')
    if content_type_header is None:
        return '', ''
    else:
        return parse_mime_type(content_type_header)


def authentication_required(func):

    def wrapper(self, request, *args, **kwargs):
        if request.user.is_anonymous():
            from django.conf import settings

            return build_error_response(request, 401, 'Authentication required', headers={
                'WWW-Authenticate': 'Cookie realm="Acme" form-action="%s" cookie-name="%s"' % (settings.LOGIN_URL, settings.SESSION_COOKIE_NAME)
            })

        return func(self, request, *args, **kwargs)

    return wrapper


def supported_response_mime_types(mime_types):

    def wrap(func):
        def wrapper(self, request, *args, **kwargs):
            accept_header = request.META.get('HTTP_ACCEPT', '*/*')
            request.best_response_mimetype = mimeparser.best_match(mime_types, accept_header)
            if request.best_response_mimetype == '':
                msg = _("The requested resource is only capable of generating content not acceptable according to the Accept headers sent in the request")
                details = {'supported_mime_types': mime_types}
                return build_error_response(request, 406, msg, details=details)

            return func(self, request, *args, **kwargs)
        return wrapper

    return wrap


def supported_request_mime_types(mime_types):

    def wrap(func):
        def wrapper(self, request, *args, **kwargs):
            if get_content_type(request)[0] not in mime_types:
                msg = _("Unsupported request media type")
                return build_error_response(request, 415, msg)

            return func(self, request, *args, **kwargs)
        return wrapper

    return wrap


def get_current_domain(request=None):
    from django.conf import settings
    from django.contrib.sites.models import get_current_site

    if hasattr(settings, 'FORCE_DOMAIN'):
        return settings.FORCE_DOMAIN
    else:
        try:
            return get_current_site(request).domain
        except:
            domain = socket.getfqdn()
            port = getattr(settings, 'FORCE_PORT', 8000)
            if port != 80:
                domain += ':' + str(port)
            return domain


def get_current_scheme(request=None):
    from django.conf import settings

    if hasattr(settings, 'FORCE_PROTO'):
        return settings.FORCE_PROTO
    elif (request is not None) and request.is_secure():
        return 'https'
    else:
        return 'http'


def get_absolute_reverse_url(viewname, request=None, **kwargs):
    path = reverse(viewname, **kwargs)
    scheme = get_current_scheme(request)
    return urljoin(scheme + '://' + get_current_domain(request) + '/', path)


def get_absolute_static_url(url, request=None):
    from django.conf import settings

    scheme = get_current_scheme()
    base = urljoin(scheme + '://' + get_current_domain(request), settings.STATIC_URL)
    return urljoin(base, url)
