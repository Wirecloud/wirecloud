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
import cookielib
import urllib2
from urllib import urlcleanup, urlencode
from urlparse import urlparse

from django.conf import settings


def download_http_content(uri, params=None, user=None, headers={}):
    urlcleanup()

    #proxy = settings.PROXY_SERVER

    #The proxy must not be used with local address
    host = urlparse(uri)[1]

    #manage proxies with authentication (get it from environment)
    proxy = None
    for proxy_name in settings.NOT_PROXY_FOR:
        if host.startswith(proxy_name):
            proxy = urllib2.ProxyHandler({})  # no proxy
            break

    if not proxy:
        #Host is not included in the NOT_PROXY_FOR list => proxy is needed!
        proxy = urllib2.ProxyHandler()  # proxies from environment

    opener = urllib2.build_opener(proxy)
    referer = getattr(settings, 'HTTP_REFERER', None)
    params = params or {}

    has_cookie = 'cookie' in params

    if referer or user or has_cookie:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows; U; Windows NT 5.0; en-GB) Gecko/20080201 Firefox/2.0.0.12 Python-urllib2/%s' % getattr(urllib2, '__version__', '1.0'),
            'Accept': 'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,image/png,*/*;q=0.5',
            'Accept-Language': 'en-gb,en;q=0.5',
            'Accept-Charset': 'ISO-8859-1,utf-8;q=0.7,*;q=0.7',
        }
        if referer:
            headers.update({
                'Referer': referer,
            })
        if user and not user.is_anonymous():
            headers.update({
                'Remote-User': user.username,
            })
        if has_cookie:
            headers.update({
                'Cookie': params['cookie'],
            })
        cookies = cookielib.LWPCookieJar()
        opener = urllib2.build_opener(urllib2.HTTPCookieProcessor(cookies))
        urllib2.install_opener(opener)
        data = params and urlencode(params) or None
        request = urllib2.Request(uri, data, headers)
        return urllib2.urlopen(request).read()
    elif params:
        data = params and urlencode(params)
        request = urllib2.Request(url=uri, data=data, headers=headers)
        return urllib2.urlopen(request).read()
    else:
        request = urllib2.Request(url=uri, headers=headers)
        return urllib2.urlopen(request).read()


def PUT_parameter(request, parameter_name):
    # Checking GET and POST space!
    return request.POST[parameter_name]
