# -*- coding: utf-8 -*-

# Copyright (c) 2008-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

import Cookie
import errno
from httplib import BadStatusLine
import re
import socket
import urllib2
import urlparse

from django.conf import settings
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseNotFound
from django.utils.encoding import iri_to_uri
from django.utils.http import urlquote
from django.utils.translation import ugettext as _

from wirecloud.commons.utils.http import build_error_response
from wirecloud.proxy.processors import get_request_proxy_processors, get_response_proxy_processors
from wirecloud.proxy.utils import is_valid_header, ValidationError


class MethodRequest(urllib2.Request):

    def __init__(self, method, *args, **kwargs):
        self._method = method
        urllib2.Request.__init__(self, *args, **kwargs)

    def get_method(self):
        return self._method


class Proxy():

    http_headerRE = re.compile('^http_')
    protocolRE = re.compile('HTTP/(.*)')
    hostRE = re.compile('([^.]+)\.(.*)')

    blacklisted_http_headers = [
        'http_host',
        'http_content_length',
    ]

    # set the timeout to 60 seconds
    socket.setdefaulttimeout(60)

    def _do_request(self, opener, method, url, data, headers):
        # Build a request object
        req = MethodRequest(method, url, data, headers)

        # Do the request
        try:
            return opener.open(req)
        except urllib2.HTTPError, e:
            return e

    def do_request(self, request, url, method, data):

        # HTTP call
        try:
            url = iri_to_uri(url)

            request_data = {
                "method": method,
                "url": url,
                "data": data,
                "headers": {},
                "cookies": Cookie.SimpleCookie(),
                "user": request.user,
                "original-request": request,
            }

            # Request creation
            proto, host, cgi, param, query = urlparse.urlparse(url)[:5]

            # manage proxies with authentication (get it from environment)
            proxy = None
            for proxy_name in settings.NOT_PROXY_FOR:
                if host.startswith(proxy_name):
                    proxy = urllib2.ProxyHandler({})  # no proxy
                    break

            if not proxy:
                #Host is not included in the NOT_PROXY_FOR list => proxy is needed!
                proxy = urllib2.ProxyHandler()  # proxies from environment

            opener = urllib2.build_opener(proxy)

            # Extract headers from META
            for header in request.META.items():
                header_name = header[0].lower()
                if header_name == 'content_type' and header[1]:
                    request_data['headers']["content-type"] = header[1]

                elif header_name == 'cookie' or header_name == 'http_cookie':

                    cookie_parser = Cookie.SimpleCookie(str(header[1]))

                    # Remove Wirecloud cookies
                    if hasattr(settings, 'SESSION_COOKIE_NAME'):
                        del cookie_parser[settings.SESSION_COOKIE_NAME]

                    if hasattr(settings, 'CSRF_COOKIE_NAME') and settings.CSRF_COOKIE_NAME in cookie_parser:
                        del cookie_parser[settings.CSRF_COOKIE_NAME]

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

            hostName = self.hostRE.match(request.META['HTTP_HOST'])
            if hostName is not None:
                hostName = hostName.group(1)
            else:
                hostName = socket.gethostname()

            via_header = "%s %s (Wirecloud-python-Proxy/1.1)" % (protocolVersion, hostName)
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
            except ValidationError, e:
                return e.get_response()

            # Cookies
            cookie_header_content = ', '.join([cookie_parser[key].OutputString() for key in request_data['cookies']])
            if cookie_header_content != '':
                request_data['headers']['Cookie'] = cookie_header_content

            # Open the request
            try:
                res = self._do_request(opener, request_data['method'], request_data['url'], request_data['data'], request_data['headers'])
            except urllib2.URLError, e:
                if isinstance(e.reason, socket.timeout) or isinstance(e.reason, socket.error) and e.reason[0] == errno.ETIMEDOUT:
                    return HttpResponse(status=504)
                elif isinstance(e.reason, socket.error) and e.reason[0] == errno.ECONNREFUSED:
                    return HttpResponse(status=502)
                else:
                    return HttpResponseNotFound(str(e.reason))
            except BadStatusLine, e:
                return HttpResponse(status=504)

            # Add content-type header to the response
            res_info = res.info()
            if 'Content-Type' in res_info:
                response = HttpResponse(res.read(), mimetype=res_info['Content-Type'])
            else:
                response = HttpResponse(res.read())

            # Set status code to the response
            response.status_code = res.code

            # Add all the headers received from the response
            headers = res.headers
            for header in headers:

                header_lower = header.lower()
                if header_lower == 'set-cookie':

                    cookie_parser = Cookie.SimpleCookie()
                    cookies = res.headers.getheaders(header)
                    for i in range(len(cookies)):
                        cookie_parser.load(cookies[i])

                    for key in cookie_parser:
                        response.set_cookie(key, cookie_parser[key].value, expires=cookie_parser[key]['expires'], path=cookie_parser[key]['path'], domain=cookie_parser[key]['domain'])

                elif header_lower == 'via':

                    via_header = via_header + ', ' + headers[header]

                elif is_valid_header(header_lower):
                    response[header] = headers[header]

            # Pass proxy processors to the response
            for processor in get_response_proxy_processors():
                response = processor.process_response(request_data, response)

            response['Via'] = via_header

            return response

        except Exception, e:
            msg = _("Error processing proxy request: %s") % unicode(e)
            return build_error_response(request, 500, msg)


WIRECLOUD_PROXY = Proxy()


def proxy_request(request, protocol, domain, path):
    content_type = request.META.get('CONTENT_TYPE', '')
    if content_type is None:
        content_type = ''

    if not content_type.startswith('multipart') and '_method' in request.POST:
        method = request.POST['_method']
        del request.POST['_method']
    else:
        method = request.method.upper()

    if method in ('GET', 'DELETE'):
        raw_data = ''
    else:
        raw_data = request.raw_post_data

    if not request.user.is_authenticated():
        return HttpResponseForbidden(_('Your must be logged in to access this service'))

    try:
        if request.get_host() != urlparse.urlparse(request.META["HTTP_REFERER"])[1]:
            return build_error_response(request, 400, _(u"Invalid request Referer"))
    except:
        return build_error_response(request, 400, _(u"Invalid request Referer"))

    url = protocol + '://' + domain + path
    if len(request.GET) > 0:
        url += '?' + request.GET.urlencode()

    response = WIRECLOUD_PROXY.do_request(request, url, method, raw_data)

    # Process cookies
    for key in response.cookies:
        cookie = response.cookies[key]

        if 'path' in cookie:
            cookie['path'] = '/proxy/' + protocol + '/' + urlquote(domain, '') + cookie['path']
        else:
            cookie['path'] = '/proxy/' + protocol + '/' + urlquote(domain, '')

        del cookie['domain']

    return response
