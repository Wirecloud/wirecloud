# -*- coding: utf-8 -*-

# Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from six.moves.http_cookies import SimpleCookie
import re
import requests
import socket
from six.moves.urllib.parse import urlparse

from django.conf import settings
from django.core.urlresolvers import reverse
from django.http import HttpResponse
try:
    from django.http import StreamingHttpResponse
except: # Django 1.4
    from django.http import HttpResponse as StreamingHttpResponse
from django.utils.encoding import iri_to_uri
from django.utils.translation import ugettext as _

from wirecloud.commons.utils.http import build_error_response, get_current_domain
from wirecloud.platform.plugins import get_request_proxy_processors, get_response_proxy_processors
from wirecloud.proxy.utils import is_valid_response_header, ValidationError


class Proxy():

    http_headerRE = re.compile('^http_')
    protocolRE = re.compile('HTTP/(.*)')

    blacklisted_http_headers = [
        'http_host',
    ]

    # set the timeout to 60 seconds
    socket.setdefaulttimeout(60)

    def do_request(self, request, url, method):

        url = iri_to_uri(url)

        request_data = {
            "method": method,
            "url": url,
            "data": None,
            "headers": {},
            "cookies": SimpleCookie(),
            "user": request.user,
            "original-request": request,
        }

        # Request creation
        proto, host, cgi, param, query = urlparse(url)[:5]

        # Extract headers from META
        if 'HTTP_TRANSFER_ENCODING' in request.META:
            return build_error_response(request, 500, "Wirecloud doesn't support requests using Transfer-Encodings")

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

        request_data['headers']['x-forwarded-host'] = host
        if 'x-forwarded-server' in request_data['headers']:
            del request_data['headers']['x-forwarded-server']

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
        except requests.exceptions.HTTPError:
            return HttpResponse(status=504)
        except requests.exceptions.ConnectionError:
            return HttpResponse(status=502)

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

    try:
        if request.get_host() != urlparse(request.META["HTTP_REFERER"])[1]:
            raise Exception()

        if settings.SESSION_COOKIE_NAME not in request.COOKIES:
            raise Exception()
    except:
        return build_error_response(request, 403, _("Invalid request"))

    url = protocol + '://' + domain + path
    if len(request.GET) > 0:
        url += '?' + request.GET.urlencode()

    try:
        response = WIRECLOUD_PROXY.do_request(request, url, request.method.upper())
    except Exception as e:
        msg = _("Error processing proxy request: %s") % unicode(e)
        return build_error_response(request, 500, msg)

    # Process cookies
    for key in response.cookies:
        cookie = response.cookies[key]

        if cookie['path'] == '':
            cookie['path'] = reverse('wirecloud|proxy', kwargs={'protocol': protocol, 'domain': domain, 'path': path})
        else:
            cookie['path'] = reverse('wirecloud|proxy', kwargs={'protocol': protocol, 'domain': domain, 'path': cookie['path']})

    return response
