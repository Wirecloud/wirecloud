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

import urllib2, httplib, urlparse, re, socket

from urllib import urlencode

from commons.logs_exception import TracedServerError
from commons.resource import Resource
from commons.utils import get_xml_error

from proxy.utils import encode_query, is_valid_header, is_localhost

from django.utils.translation import ugettext as _
from django.utils.translation import string_concat

from django.http import Http404, HttpResponse, HttpResponseNotFound, HttpResponseBadRequest, HttpResponseServerError
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

    protocolRE = re.compile('HTTP/(.*)')
    hostRE = re.compile('([^.]+)\.(.*)')

    def _do_request(self, opener, method, url, params, headers):
        # Build a request object
        if method == 'GET' or method == 'DELETE':
            req = urllib2.Request(url, None, headers)
        else:
            req = MethodRequest(method, url, params, headers)

        # Do the request
        try:
            return opener.open(req)
        except urllib2.HTTPError, e:
            return e

    def create(self, request):

        # URI to be called
        if request.POST.has_key('url'):
            url = request.POST['url']
        else:
            return HttpResponseNotFound(get_xml_error(_(u"Url not specified")), mimetype='application/xml; charset=UTF-8')

        # HTTP method, by default is GET
        if request.POST.has_key('method'):
            method = request.POST['method']
        else:
            method = "GET"

        # Params
        if request.POST.has_key('params'):
            try:
                params = urlencode(simplejson.loads(request.POST['params']))
            except Exception, e:
                params = encode_query(request.POST['params'])
        else:
            params = ''

        # HTTP call
        try:
            httplib.HTTPConnection.debuglevel = 1
            # Request creation
            proto, host, cgi, param, query = urlparse.urlparse(url)[:5]

            # manage proxies with authentication (get it from environment)
            proxy = None
            for proxy_name in settings.NOT_PROXY_FOR:
                if host.startswith(proxy_name):
                    proxy = urllib2.ProxyHandler({})#no proxy
                    break

            if not proxy:
                #Host is not included in the NOT_PROXY_FOR list => proxy is needed!
                proxy = urllib2.ProxyHandler()#proxies from environment

            opener = urllib2.build_opener(proxy)


            # Adds original request Headers to the request (and modifies Content-Type for Servlets)
            headers = {}
            has_content_type = False
            http_content_type_value = ''
            for header in request.META.items():
                if (header[0].lower() == 'content-type'):
                    if (header[1] != None and header[1].lower() != 'none'):
                        has_content_type = True
                if (header[0].lower() == 'http_content_type'):
                    http_content_type_value = header[1]
                if (header[0].lower() == 'http_user_agent'):
                    headers["User-Agent"] = header[1]
                elif (header[0].find("HTTP_") >= 0
                      and header[0].lower() != 'http_cache_control' #NOTE:do not copy the CACHE_CONTROL header in order to allow 301 redirection
                      and header[0].lower() != 'http_content_length'
                      and header[0].lower() != 'http_x_forwarded_for'
                      and header[0].lower() != 'http_x_forwarded_proto'
                      and header[0].lower() != 'http_x_bluecoat_via'
                      and header[0].lower() != 'http_x_requested_with'
                      and header[0].lower() != 'http_x_prototype_version'
                      and header[0].lower() != 'http_host'
                      and header[0].lower() != 'http_referer'):
                    headers[header[0].replace("HTTP_", "", 1)] = header[1]

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

            print "%s %s (EzWeb-python-Proxy/1.1)" % (protocolVersion, hostName)
            headers["Via"] = "%s %s (EzWeb-python-Proxy/1.1)" % (protocolVersion, hostName)
            # Add Content-Type (Servlets bug)
            if ((method == 'POST' or method == 'PUT') and not has_content_type):
                if (http_content_type_value != ''):
                    headers['Content-Type'] = http_content_type_value
                else:
                    headers['Content-Type'] = 'application/x-www-form-urlencoded'

            # The same with cookies
            cookies = ''
            for cookie in request.COOKIES.items():
                cookies = cookies + cookie[0] + '=' + cookie[1] + '; '
            headers['Cookie'] = cookies

            # Open the request
            try:
                res = self._do_request(opener, method, url, params, headers)
            except urllib2.URLError, e:
                return HttpResponseNotFound(e.reason)

            # Add content-type header to the response
            try:
                response = HttpResponse (res.read(), mimetype=res.info()['Content-Type'])
            except:
                response = HttpResponse (res.read())

            # Set status code to the response
            response.status_code = res.code

            # Add all the headers recieved to the response
            headers = res.headers
            for header in headers:
                if is_valid_header (string.lower(header)):
                    response[header] = headers[header]

            return response

        except Exception, e:
            msg = _("Error processing proxy request: %s") % unicode(e)
            raise TracedServerError(e, None, request, msg)
