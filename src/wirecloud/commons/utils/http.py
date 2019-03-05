# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

import json
import os
import posixpath
import socket
from urllib.parse import urljoin, urlparse, unquote

from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect, Http404
from django.utils.encoding import smart_str
from django.utils.translation import ugettext as _
from lxml import etree

from wirecloud.commons.exceptions import HttpBadCredentials, ErrorResponse
from wirecloud.commons.utils import mimeparser


# See http://www.iana.org/assignments/http-status-codes
REASON_PHRASES = {
    100: 'CONTINUE',
    101: 'SWITCHING PROTOCOLS',
    102: 'PROCESSING',
    200: 'OK',
    201: 'CREATED',
    202: 'ACCEPTED',
    203: 'NON-AUTHORITATIVE INFORMATION',
    204: 'NO CONTENT',
    205: 'RESET CONTENT',
    206: 'PARTIAL CONTENT',
    207: 'MULTI-STATUS',
    208: 'ALREADY REPORTED',
    226: 'IM USED',
    300: 'MULTIPLE CHOICES',
    301: 'MOVED PERMANENTLY',
    302: 'FOUND',
    303: 'SEE OTHER',
    304: 'NOT MODIFIED',
    305: 'USE PROXY',
    306: 'RESERVED',
    307: 'TEMPORARY REDIRECT',
    308: 'PERMANENT REDIRECT',
    400: 'BAD REQUEST',
    401: 'UNAUTHORIZED',
    402: 'PAYMENT REQUIRED',
    403: 'FORBIDDEN',
    404: 'NOT FOUND',
    405: 'METHOD NOT ALLOWED',
    406: 'NOT ACCEPTABLE',
    407: 'PROXY AUTHENTICATION REQUIRED',
    408: 'REQUEST TIMEOUT',
    409: 'CONFLICT',
    410: 'GONE',
    411: 'LENGTH REQUIRED',
    412: 'PRECONDITION FAILED',
    413: 'REQUEST ENTITY TOO LARGE',
    414: 'REQUEST-URI TOO LONG',
    415: 'UNSUPPORTED MEDIA TYPE',
    416: 'REQUESTED RANGE NOT SATISFIABLE',
    417: 'EXPECTATION FAILED',
    418: "I'M A TEAPOT",
    422: 'UNPROCESSABLE ENTITY',
    423: 'LOCKED',
    424: 'FAILED DEPENDENCY',
    426: 'UPGRADE REQUIRED',
    428: 'PRECONDITION REQUIRED',
    429: 'TOO MANY REQUESTS',
    431: 'REQUEST HEADER FIELDS TOO LARGE',
    500: 'INTERNAL SERVER ERROR',
    501: 'NOT IMPLEMENTED',
    502: 'BAD GATEWAY',
    503: 'SERVICE UNAVAILABLE',
    504: 'GATEWAY TIMEOUT',
    505: 'HTTP VERSION NOT SUPPORTED',
    506: 'VARIANT ALSO NEGOTIATES',
    507: 'INSUFFICIENT STORAGE',
    508: 'LOOP DETECTED',
    510: 'NOT EXTENDED',
    511: 'NETWORK AUTHENTICATION REQUIRED',
}


def get_html_basic_error_response(request, mimetype, status_code, context):
    from django.shortcuts import render
    return render(request, '%s.html' % status_code, context, status=status_code, content_type=mimetype)


def get_xml_error_response(request, mimetype, status_code, context):

    doc = etree.Element('error')

    description = etree.Element('description')
    description.text = str(context['error_msg'])

    doc.append(description)

    if context.get('details') is not None:
        details_element = etree.Element('details')
        for key in context['details']:
            element = etree.Element(key)

            if isinstance(context['details'][key], str):
                element.text = context['details'][key]
            elif hasattr(context['details'][key], '__iter__'):
                for value in context['details'][key]:
                    list_element = etree.Element('element')
                    list_element.text = value
                    element.append(list_element)
            else:
                for key2 in context['details'][key]:
                    list_element = etree.Element(key2)
                    list_element.text = context['details'][key][key2]
                    element.append(list_element)

            details_element.append(element)

        doc.append(details_element)

    return etree.tostring(doc, pretty_print=False, method='xml')


def get_json_error_response(request, mimetype, status_code, context):
    body = {
        'description': str(context['error_msg'])
    }
    if context.get('details') is not None:
        body['details'] = context['details']

    return json.dumps(body, ensure_ascii=False, sort_keys=True)


def get_plain_text_error_response(request, mimetype, status_code, context):
    return "%s" % context['error_msg']


ERROR_FORMATTERS = {
    'application/json; charset=utf-8': get_json_error_response,
    'application/xml; charset=utf-8': get_xml_error_response,
    'text/html; charset=utf-8': get_html_basic_error_response,
    'application/xhtml+xml; charset=utf-8': get_html_basic_error_response,
    'text/plain; charset=utf-8': get_plain_text_error_response,
    '': get_plain_text_error_response,   # Fallback
}


def build_response(request, status_code, context, formatters, headers=None):

    if request.META.get('HTTP_X_REQUESTED_WITH', '') == 'XMLHttpRequest':
        content_type = 'application/json; charset=utf-8'
    else:
        formatter_keys = list(formatters.keys())
        formatter_keys.remove('')
        content_type = mimeparser.best_match(formatter_keys, request.META.get('HTTP_ACCEPT', '*/*'))

    if content_type in formatters:
        formatter = formatters[content_type]
    else:
        raise Exception('No suitable formatter found')

    body = formatter(request, content_type, status_code, context)
    response = HttpResponse(body, content_type=content_type, status=status_code)
    if headers is None:
        headers = {}

    for header_name in headers:
        response[header_name] = headers[header_name]

    return response


def build_error_response(request, status_code, error_msg, extra_formats=None, headers=None, details=None, context=None):

    if extra_formats is not None:
        formatters = extra_formats.copy()
        formatters.update(ERROR_FORMATTERS)
    else:
        formatters = ERROR_FORMATTERS

    if context is None:
        context = {}

    context.update({'error_msg': error_msg, 'details': details})

    return build_response(request, status_code, context, formatters, headers)


def get_content_type(request):
    content_type_header = request.META.get('CONTENT_TYPE')
    if content_type_header is not None:
        try:
            return mimeparser.parse_mime_type(content_type_header)
        except mimeparser.InvalidMimeType:
            pass

    return '', {}


def build_auth_error_response(request, message='Authentication required', error_info=None):

    if error_info is None:
        from django.conf import settings
        error_info = 'Cookie realm="WireCloud" form-action="%s" cookie-name="%s"' % (settings.LOGIN_URL, settings.SESSION_COOKIE_NAME)

    return build_error_response(request, 401, message, headers={
        'WWW-Authenticate': error_info
    })


def authentication_required(func):

    def wrapper(self, request, *args, **kwargs):
        try:
            if request.user.is_anonymous():
                return build_auth_error_response(request)
        except HttpBadCredentials as e:
            return build_auth_error_response(request, e.message, e.error_info)

        return func(self, request, *args, **kwargs)

    return wrapper


def authentication_required_cond(cond):

    def wrap(func):

        if cond is True:
            return func
        else:
            return authentication_required(func)

    return wrap


def produces(mime_types):

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


def consumes(mime_types):

    def wrap(func):
        def wrapper(self, request, *args, **kwargs):
            request.mimetype = get_content_type(request)[0]
            if request.mimetype not in mime_types:
                msg = _("Unsupported request media type")
                return build_error_response(request, 415, msg)

            return func(self, request, *args, **kwargs)
        return wrapper

    return wrap


_servername = None


def get_current_domain(request=None):
    from django.conf import settings
    from django.contrib.sites.shortcuts import get_current_site

    # Server name
    if getattr(settings, 'FORCE_DOMAIN', None) is not None:
        servername = settings.FORCE_DOMAIN
    else:
        try:
            servername = get_current_site(request).domain.split(':', 1)[0]
        except:
            global _servername
            if _servername is None:
                _servername = socket.getfqdn()
            servername = _servername

    # Port
    scheme = get_current_scheme(request)

    if getattr(settings, 'FORCE_PORT', None) is not None:
        port = int(settings.FORCE_PORT)
    else:
        try:
            port = int(get_current_site(request).domain.split(':', 1)[1])
        except:
            port = 80 if scheme == 'http' else 443

    if (scheme == 'http' and port != 80) or (scheme == 'https' and port != 443):
        return servername + (':%s' % port)
    else:
        return servername


def get_current_scheme(request=None):
    from django.conf import settings

    if getattr(settings, 'FORCE_PROTO', None) is not None:
        return settings.FORCE_PROTO
    elif (request is not None) and request.is_secure():
        return 'https'
    else:
        return 'http'


def force_trailing_slash(url):
    return url if url[-1] == '/' else url + '/'


def get_absolute_reverse_url(viewname, request=None, **kwargs):
    path = reverse(viewname, **kwargs)
    scheme = get_current_scheme(request)
    return urljoin(scheme + '://' + get_current_domain(request) + '/', path)


def get_absolute_static_url(url, request=None, versioned=False):
    from django.conf import settings

    scheme = get_current_scheme(request)
    base = urljoin(scheme + '://' + get_current_domain(request), settings.STATIC_URL)

    if versioned:
        from wirecloud.platform.core.plugins import get_version_hash
        url += '?v=' + get_version_hash()

    return urljoin(base, url)


def validate_url_param(request, name, value, force_absolute=True, required=False):

    if isinstance(value, str):
        if required and value.strip() == '':
            msg = _('Missing required parameter: %(parameter)s') % {"parameter": name}
            raise ErrorResponse(build_error_response(request, 422, msg))

        parsed_url = urlparse(value)
        if force_absolute and not bool(parsed_url.netloc and parsed_url.scheme):
            msg = _("%(parameter)s must be an absolute URL") % {"parameter": name}
            raise ErrorResponse(build_error_response(request, 422, msg))
        elif parsed_url.scheme not in ('', 'http', 'https', 'ftp'):
            msg = _("Invalid schema: %(schema)s") % {"schema": parsed_url.scheme}
            raise ErrorResponse(build_error_response(request, 422, msg))
    elif required and value is None:
        msg = _('Missing required parameter: %(parameter)s') % {"parameter": name}
        raise ErrorResponse(build_error_response(request, 422, msg))
    else:
        msg = _('Invalid %(parameter)s type') % {"parameter": name}
        raise ErrorResponse(build_error_response(request, 422, msg))


def normalize_boolean_param(request, name, value):

    if isinstance(value, str):
        value = value.strip().lower()
        if value not in ('true', 'false'):
            msg = _('Invalid %(parameter)s value') % {"parameter": name}
            raise ErrorResponse(build_error_response(request, 422, msg))
        return value == 'true'
    elif not isinstance(value, bool):
        msg = _('Invalid %(parameter)s type') % {"parameter": name}
        raise ErrorResponse(build_error_response(request, 422, msg))

    return value


def build_sendfile_response(file_path, document_root):
    path = posixpath.normpath(unquote(file_path))
    path = path.lstrip('/')
    newpath = ''
    for part in path.split('/'):
        drive, part = os.path.splitdrive(part)
        head, part = os.path.split(part)
        if part in (os.curdir, os.pardir):
            # Strip '.' and '..' in path.
            continue
        newpath = os.path.join(newpath, part).replace('\\', '/')
    if newpath and path != newpath:
        return HttpResponseRedirect(newpath)
    fullpath = os.path.join(document_root, newpath)

    if not os.path.isfile(fullpath):
        raise Http404(_('"%(path)s" does not exist') % {'path': fullpath})

    response = HttpResponse()
    response['X-Sendfile'] = smart_str(fullpath)
    return response


def build_downloadfile_response(request, file_path, base_dir):

    from django.conf import settings
    from django.views.static import serve

    if not getattr(settings, 'USE_XSENDFILE', False):
        return serve(request, file_path, document_root=base_dir)
    else:
        return build_sendfile_response(file_path, base_dir)


def parse_json_request(request):

    try:
        return json.loads(request.body.decode('utf-8'))
    except ValueError as e:
        msg = _("malformed json data: %s") % e
        raise ErrorResponse(build_error_response(request, 400, msg))
