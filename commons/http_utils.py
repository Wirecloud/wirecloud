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

from urlparse import urlparse

from urllib import urlcleanup, urlencode
import urllib2
from django.utils import simplejson

from django.conf import settings

def download_http_content (uri, params=None):
    urlcleanup()
    
    #proxy = settings.PROXY_SERVER
    
    #The proxy must not be used with local address
    host = urlparse(uri)[1]

    #manage proxies with authentication (get it from environment)
    if (host.startswith(('localhost','127.0.0.1'))):
        proxy = urllib2.ProxyHandler({})#no proxy
    else:
        proxy = urllib2.ProxyHandler()#proxies from environment

    opener = urllib2.build_opener(proxy)
    
    if params:
        return opener.open(uri,data=urlencode(params)).read()
    else:
        return opener.open(uri).read()

def PUT_parameter (request, parameter_name):    
    # Checking GET and POST space!
    return request.POST[parameter_name]

