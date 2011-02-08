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

import Cookie
import urllib2, httplib, urlparse, re, socket, errno

from commons.logs_exception import TracedServerError
from commons.resource import Resource
from commons.utils import get_xml_error

from proxy.utils import encode_query, is_valid_header, is_localhost

from django.utils.http import urlencode, urlquote
from django.utils.translation import ugettext as _
from django.utils.translation import string_concat

from django.http import Http404, HttpResponse, HttpResponseForbidden, HttpResponseNotFound, HttpResponseBadRequest, HttpResponseServerError
from django.conf import settings

from django.utils import simplejson

import string


class MethodRequest(urllib2.Request):

    def __init__(self, method, *args, **kwargs):
        self._method = method
        urllib2.Request.__init__(self, *args, **kwargs)

    def get_method(self):
        return self._method


class Proxy(Resource):

    http_headerRE = re.compile('^http_')
    protocolRE = re.compile('HTTP/(.*)')
    hostRE = re.compile('([^.]+)\.(.*)')

    blacklisted_http_headers = [
        'http_host',
        'http_content_length'
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

    def create(self, request):
        if not request.user.is_authenticated():
            return HttpResponseForbidden(_('Your must be logged in to access this service'))

        try:
            if request.get_host() != urlparse.urlparse(request.META["HTTP_REFERER"])[1]:
                return HttpResponseServerError(get_xml_error(_(u"Invalid request Referer")), mimetype='application/xml; charset=UTF-8')
        except:
            return HttpResponseServerError(get_xml_error(_(u"Invalid request Referer")), mimetype='application/xml; charset=UTF-8')

        # URI to be called
        if request.POST.has_key('url'):
            url = request.POST['url']
        else:
            return HttpResponseNotFound(get_xml_error(_(u"Url not specified")), mimetype='application/xml; charset=UTF-8')

        # HTTP method, by default is GET
        if request.POST.has_key('method'):
            method = request.POST['method'].upper()
        else:
            method = "GET"

        # Params
        if method != 'GET' and request.POST.has_key('params'):
            # if Content-Type is xml or json then skipping encode function.
            if re.search("application/(json|xml|[a-zA-Z-]+\+xml)|text/xml", request.META["CONTENT_TYPE"]) != None:
                params = request.POST['params'].encode('utf-8')
            else:
                try:
                    params = urlencode(simplejson.loads(request.POST['params']))
                except Exception, e:
                    params = encode_query(request.POST['params'])
        else:
            params = None

        return self.do_request(request, url, method, params);

    def do_request(self, request, url, method, data):

        # HTTP call
        try:
            httplib.HTTPConnection.debuglevel = 1
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

            # Adds original request Headers to the request
            headers = {}
            for header in request.META.items():
                header_name = header[0].lower()
                if header_name == 'content_type' and header[1]:
                    headers["content-type"] = header[1]
                elif header_name == 'cookie' or header_name == 'http_cookie':

                    cookie_parser = Cookie.SimpleCookie(header[1])

                    # Remove EzWeb cookies
                    if hasattr(settings, 'SESSION_COOKIE_NAME'):
                        del cookie_parser[settings.SESSION_COOKIE_NAME]

                    if hasattr(settings, 'CSRF_COOKIE_NAME'):
                        del cookie_parser[settings.CSRF_COOKIE_NAME]

                    content = ', '.join([cookie_parser[key].OutputString() for key in cookie_parser])
                    if content != '':
                        headers['Cookie'] = content
                elif self.http_headerRE.match(header_name) and not header_name in self.blacklisted_http_headers:
                    fixed_name = header_name.replace("http_", "", 1).replace('_', '-')
                    headers[fixed_name] = header[1]

            protocolVersion = self.protocolRE.match(request.META['SERVER_PROTOCOL'])
            if protocolVersion != None:
                protocolVersion = protocolVersion.group(1)
            else:
                protocolVersion = '1.1'

            hostName = self.hostRE.match(request.META['HTTP_HOST'])
            if hostName != None:
                hostName = hostName.group(1)
            else:
                hostName = socket.gethostname()

            headers["Via"] = "%s %s (EzWeb-python-Proxy/1.1)" % (protocolVersion, hostName)

            if (method == 'POST' or method == 'PUT') and not 'content-type' in headers:
                # Add Content-Type (Servlets bug)
                headers['content-type'] = "application/x-www-form-urlencoded"

            # Remote user header
            if not request.user.is_anonymous():
                headers['Remote-User'] = request.user.username

            # Open the request
            try:
                res = self._do_request(opener, method, url, data, headers)
            except urllib2.URLError, e:
                if e.reason[0] == errno.ECONNREFUSED:
                    return HttpResponse(status=504)
                else:
                    return HttpResponseNotFound(e.reason)

            # Add content-type header to the response
            if (res.info().has_key('Content-Type')):
                response = HttpResponse(res.read(), mimetype=res.info()['Content-Type'])
            else:
                response = HttpResponse(res.read())

            # Set status code to the response
            response.status_code = res.code

            # Add all the headers received from the response
            headers = res.headers
            for header in headers:
                if string.lower(header) == 'set-cookie':
                    cookie_parser = Cookie.SimpleCookie()
                    cookies = res.headers.getheaders(header)
                    for i in range(len(cookies)):
                        cookie_parser.load(cookies[i])

                    for key in cookie_parser:
                        response.set_cookie(key, cookie_parser[key].value, expires=cookie_parser[key]['expires'], path=cookie_parser[key]['path'], domain=cookie_parser[key]['domain'])

                elif is_valid_header(string.lower(header)):
                    response[header] = headers[header]

            return response

        except Exception, e:
            msg = _("Error processing proxy request: %s") % unicode(e)
            raise TracedServerError(e, None, request, msg)


EZWEB_PROXY = Proxy()


def proxy_request(request, protocol, domain, path):
    content_type = request.META.get('CONTENT_TYPE', '')
    if content_type == None:
        content_type = ''

    if not content_type.startswith('multipart') and '_method' in request.POST:
        method = request.POST['_method']
        del request.POST['_method']
    else:
        method = request.method.upper()

    raw_data = request.raw_post_data

    if not request.user.is_authenticated():
        return HttpResponseForbidden(_('Your must be logged in to access this service'))

    try:
        if request.get_host() != urlparse.urlparse(request.META["HTTP_REFERER"])[1]:
            return HttpResponseServerError(get_xml_error(_(u"Invalid request Referer")), mimetype='application/xml; charset=UTF-8')
    except:
        return HttpResponseServerError(get_xml_error(_(u"Invalid request Referer")), mimetype='application/xml; charset=UTF-8')

    url = protocol + '://' + domain + path
    if len(request.GET) > 0:
        url += '?' + request.GET.urlencode()

    response = EZWEB_PROXY.do_request(request, url, method, raw_data)

    # Process cookies
    for key in response.cookies:
        cookie = response.cookies[key]

        if 'path' in cookie:
            cookie['path'] = '/proxy/' + protocol + '/' + urlquote(domain, '') + cookie['path']
        else:
            cookie['path'] = '/proxy/' + protocol + '/' + urlquote(domain, '')

        del cookie['domain']

    return response
