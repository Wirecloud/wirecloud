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

from urllib import urlopen, urlcleanup

from django.conf import settings

def download_http_content (uri):
    urlcleanup()
    
    try:
        proxy = settings.PROXY_SERVER
        
        #The proxy must not be used with local address
        host = urlparse(uri)[1]
    
        if (host.startswith(('localhost','127.0.0.1'))):
            proxy = False
        else:
            proxy = {'http': 'http://' + proxy}
            
    except Exception:
        proxy = False
        
    if proxy:
        return urlopen(uri,proxies=proxy).read()
    else:
        return urlopen(uri).read()


def PUT_parameter (request, parameter_name):    
    # Checking GET and POST space!
    return request.POST[parameter_name]

