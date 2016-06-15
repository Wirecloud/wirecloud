# -*- coding: utf-8 -*-

# Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

import logging
import re
import requests
import six
from six.moves.http_cookies import SimpleCookie
from six.moves.urllib.parse import unquote, urlparse
import socket
import sys

from django.conf import settings
from django.core.urlresolvers import resolve, reverse
from django.http import HttpResponse, StreamingHttpResponse
from django.utils.encoding import iri_to_uri
from django.utils.translation import ugettext as _

from wirecloud.commons.utils.http import build_error_response, get_current_domain
from wirecloud.platform.models import Workspace
from wirecloud.platform.plugins import get_request_proxy_processors, get_response_proxy_processors
from wirecloud.proxy.utils import is_valid_response_header, ValidationError

request_logger = logging.getLogger('django.request')


def log_error(request, exc_info):

    request_logger.error('Internal Server Error: %s', request.path,
        exc_info=exc_info,
        extra={
            'status_code': 500,
            'request': request
        }
    )


class Proxy():

    http_headerRE = re.compile('^http_')
    protocolRE = re.compile('HTTP/(.*)')

    blacklisted_http_headers = [
        'http_host', 'http_forwarded', 'http_x_forwarded_by',
        'http_x_forwarded_host', 'http_x_forwarded_port',
        'http_x_forwarded_proto', 'http_x_forwarded_server'
    ]

    # set the timeout to 60 seconds
    socket.setdefaulttimeout(60)

    def do_request(self, request, url, method, workspace):

        url = iri_to_uri(url)

        request_data = {
            "method": method,
            "url": url,
            "data": None,
            "headers": {},
            "cookies": SimpleCookie(),
            "user": request.user,
            "workspace": workspace,
            "original-request": request,
        }

        # Request creation
        proto, host, cgi, param, query = urlparse(url)[:5]

        # Extract headers from META
        if 'HTTP_TRANSFER_ENCODING' in request.META:
            return build_error_response(request, 422, "WireCloud doesn't support requests using the Transfer-Encoding header")

        for header in request.META.items():
            header_name = header[0].lower()
            if header_name == 'content_type' and header[1]:
                request_data['headers']["content-type"] = header[1]

            elif header_name == 'content_length' and header[1]:
                # Only take into account request body if the request has a
                # Content-Length header (we don't support chunked requests)
                request_data['data'] = request
                request_data['headers']['content-length'] = header[1]
                request_data['data'].len = int(header[1])

            elif header_name == 'cookie' or header_name == 'http_cookie':

                cookie_parser = SimpleCookie(str(header[1]))

                del cookie_parser[str(settings.SESSION_COOKIE_NAME)]

                if str(settings.CSRF_COOKIE_NAME) in cookie_parser:
                    del cookie_parser[str(settings.CSRF_COOKIE_NAME)]

                request_data['cookies'].update(cookie_parser)

            elif self.http_headerRE.match(header_name) and not header_name in self.blacklisted_http_headers:

                fixed_name = header_name.replace("http_", "", 1).replace('_', '-')
                request_data['headers'][fixed_name] = header[1]

        # Build the Via header
        protocolVersion = self.protocolRE.match(request.META['SERVER_PROTOCOL'])
        if protocolVersion is not None:
            protocolVersion = protocolVersion.group(1)
        else:
            protocolVersion = '1.1'

        via_header = "%s %s (Wirecloud-python-Proxy/1.1)" % (protocolVersion, get_current_domain(request))
        if 'via' in request_data['headers']:
            request_data['headers']['via'] += ', ' + via_header
        else:
            request_data['headers']['via'] = via_header

        # XFF headers
        if 'x-forwarded-for' in request_data['headers']:
            request_data['headers']['x-forwarded-for'] += ', ' + request.META['REMOTE_ADDR']
        else:
            request_data['headers']['x-forwarded-for'] = request.META['REMOTE_ADDR']

        # Pass proxy processors to the new request
        try:
            for processor in get_request_proxy_processors():
                processor.process_request(request_data)
        except ValidationError as e:
            return e.get_response(request)

        # Cookies
        cookie_header_content = ', '.join([cookie_parser[key].OutputString() for key in request_data['cookies']])
        if cookie_header_content != '':
            request_data['headers']['Cookie'] = cookie_header_content

        # Open the request
        try:
            res = requests.request(request_data['method'], request_data['url'], headers=request_data['headers'], data=request_data['data'], stream=True, verify=getattr(settings, 'WIRECLOUD_HTTPS_VERIFY', True))
        except requests.exceptions.Timeout as e:
            return build_error_response(request, 504, _('Gateway Timeout'), details=six.text_type(e))
        except requests.exceptions.SSLError as e:
            return build_error_response(request, 502, _('SSL Error'), details=six.text_type(e))
        except (requests.exceptions.ConnectionError, requests.exceptions.HTTPError, requests.exceptions.TooManyRedirects) as e:
            return build_error_response(request, 504, _('Connection Error'), details=six.text_type(e))

        # Build a Django response
        response = StreamingHttpResponse(res.raw.stream(4096, decode_content=False), status=res.status_code)
        if 'reason_phrase' in response:  # pragma: no cover
            # Currently only django 1.6+ supports custom reason phrases
            response.reason_phrase = res.reason_phrase

        # Add all the headers received from the response
        for header in res.headers:

            header_lower = header.lower()
            if header_lower == 'set-cookie':

                for cookie in res.cookies:
                    response.set_cookie(cookie.name, value=cookie.value, expires=cookie.expires, path=cookie.path)

            elif header_lower == 'via':

                via_header = via_header + ', ' + res.headers[header]

            elif is_valid_response_header(header_lower):
                response[header] = res.headers[header]

        # Pass proxy processors to the response
        for processor in get_response_proxy_processors():
            response = processor.process_response(request_data, response)

        response['Via'] = via_header

        return response


WIRECLOUD_PROXY = Proxy()


def proxy_request(request, protocol, domain, path):

    # TODO improve proxy security
    request_method = request.method.upper()
    if protocol not in ('http', 'https'):
        return build_error_response(request, 422, _("Invalid protocol: %s") % protocol)

    try:
        if settings.SESSION_COOKIE_NAME not in request.COOKIES:
            raise Exception()

        parsed_referer = urlparse(request.META["HTTP_REFERER"])
        if request.get_host() != parsed_referer[1]:
            raise Exception()

        referer_view_info = resolve(parsed_referer.path)
        if referer_view_info.url_name == 'wirecloud.workspace_view':

            workspace = Workspace.objects.get(creator__username=unquote(referer_view_info.kwargs['owner']), name=unquote(referer_view_info.kwargs['name']))
            if not workspace.is_available_for(request.user):
                raise Exception()

        elif referer_view_info.url_name == 'wirecloud.widget_code_entry' or referer_view_info.url_name == 'wirecloud|proxy':

            if request_method not in ('GET', 'POST'):
                raise Exception()

            workspace = None

        else:
            raise Exception()

    except:
        return build_error_response(request, 403, _("Invalid request"))

    url = protocol + '://' + domain + path
    if len(request.GET) > 0:
        url += '?' + request.GET.urlencode()

    try:
        response = WIRECLOUD_PROXY.do_request(request, url, request_method, workspace)
    except Exception as e:
        log_error(request, sys.exc_info())
        msg = _("Error processing proxy request: %s") % e
        return build_error_response(request, 500, msg)

    # Process cookies
    for key in response.cookies:
        cookie = response.cookies[key]

        if cookie['path'] == '':
            cookie['path'] = reverse('wirecloud|proxy', kwargs={'protocol': protocol, 'domain': domain, 'path': path})
        else:
            cookie['path'] = reverse('wirecloud|proxy', kwargs={'protocol': protocol, 'domain': domain, 'path': cookie['path']})

    return response
