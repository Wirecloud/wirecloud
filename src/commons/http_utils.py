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
import platform
import urllib2
from urllib import urlcleanup, urlencode
from urlparse import urlparse

from django.conf import settings

import wirecloud

VERSIONS = {
    'wirecloud_version': wirecloud.__version__,
    'system': platform.system(),
    'machine': platform.machine(),
    'urllib2_version': getattr(urllib2, '__version__', '1.0')
}


def download_http_content(url, params=None, user=None, headers={}):
    urlcleanup()

    #proxy = settings.PROXY_SERVER

    #The proxy must not be used with local address
    host = urlparse(url)[1]

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

    custom_headers = headers
    headers = {
        'User-Agent': 'Mozilla/5.0 (%(system)s %(machine)s;U) Wirecloud/%(wirecloud_version)s Python-urllib2/%(urllib2_version)s' % VERSIONS,
        'Accept': '*/*',
        'Accept-Language': 'en-gb,en;q=0.8,*;q=0.7',
        'Accept-Charset': 'utf-8;q=1,*;q=0.2',
    }
    headers.update(custom_headers)

    if referer is not None:
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
    request = urllib2.Request(url, data, headers)
    return urllib2.urlopen(request).read()


def PUT_parameter(request, parameter_name):
    # Checking GET and POST space!
    return request.POST[parameter_name]
