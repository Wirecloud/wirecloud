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

import httplib
import urlparse

from urllib import urlencode

from commons.resource import Resource

from proxy.utils import encode_query, is_valid_header, is_localhost

from django.utils.translation import gettext_lazy as _
from django.utils.translation import string_concat

from django.http import Http404, HttpResponse, HttpResponseServerError
from django.conf import settings

from django.utils import simplejson

import string

def getConnection(protocol, proxy, host):
    if (proxy != "" and not is_localhost(host)):
        if (protocol=="http"):
            return httplib.HTTPConnection(proxy)
        elif (protocol=="https"):
             return httplib.HTTPSConnection(proxy)
    else:
        if (protocol=="http"):
            return httplib.HTTPConnection(host)
        elif (protocol=="https"):
            return httplib.HTTPSConnection(host) 

class Proxy(Resource):
    def create(self,request):
        # URI to be called
        if request.POST.has_key('url'):
            url = request.POST['url']
        else:
            return HttpResponse(string_concat(['<error>',_(u"Url not specified"),'</error>']))

        # HTTP method, by default is GET
        if request.POST.has_key('method'):
            method = request.POST['method']
        else:
            method = "GET"

        # Params
        if request.POST.has_key('params'):
            #params = encode_query(request.POST['params'])
            try:
                params = urlencode(simplejson.loads(request.POST['params']))
            except Exception, e:
                params = encode_query(request.POST['params'])
        else:
            params = ''

        # HTTP call
        try:
            # Request creation
            proto, host, cgi, param, query = urlparse.urlparse(url)[:5]
            
            query = encode_query(query)
            
            # Proxy support
            proxy = ""
            try:
                proxy = settings.PROXY_SERVER
            except Exception:
                proxy = ""
                
            conn = getConnection(proto, proxy, host)
                
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
                elif (header[0].find("HTTP_")>=0):
                    headers[header[0].replace("HTTP_", "", 1)] = header[1]
            
            headers["HOST"] = host       
            headers["Via"] = "EzWeb-Proxy"
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
            if query != '':
                cgi = cgi + '?%s' % query
                
            if (proxy != ""):
                conn.request(method, url, params, headers)
            else:
                conn.request(method, cgi, params, headers)

            res = conn.getresponse()

            # Redirect resolution
            MAX_REDIRECTS = 50
            index_redirects = 0
    
            while (res.status >= 300) and (res.status < 400):

                if (index_redirects >= MAX_REDIRECTS):
                    return HttpResponse('<error>Redirect limit has been exceeded</error>')
                index_redirects = index_redirects + 1

                url = res.getheader('Location')
                proto, host, cgi, param, auxquery = urlparse.urlparse(url)[:5]
                conn = getConnection(proto, proxy, host)

                auxquery = encode_query(auxquery)

                if query != '':
                    query = query + "&" + auxquery
                else:
                    query = auxquery

                if query != '':
                    cgi = cgi + '?%s' % query

                if (proxy != ""):
                    conn.request(method, url, params, headers)
                else:
                    conn.request(method, cgi, params, headers)

                res = conn.getresponse()
                
            # Add content-type header to the response
            if res.getheader('content-type'):
                response = HttpResponse (res.read(), mimetype=res.getheader('content-type'))
            else:
                response = HttpResponse (res.read())

            # Set status code to the response
            response.status_code = res.status

            # Add all the headers recieved to the response
            headers = res.getheaders()
            for header in headers:
                if is_valid_header (string.lower(header[0])):
                    response[header[0]] = header[1]

            return response

        except Exception, e:
            return HttpResponseServerError("<html><head><title>Error HTTP 500</title></head><body>%s</body></html>" % e, mimetype='text/html; charset=UTF-8')
