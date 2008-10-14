# -*- coding: utf-8 -*-

# MORFEO Project 
# http://morfeo-project.org 
# 
# Component: EzWeb
# 
# (C) Copyright 2004 Telefónica Investigación y Desarrollo 
#     S.A.Unipersonal (Telefónica I+D) 
# 
# Info about members and contributors of the MORFEO project 
# is available at: 
# 
#   http://morfeo-project.org/
# 
# This program is free software; you can redistribute it and/or modify 
# it under the terms of the GNU General Public License as published by 
# the Free Software Foundation; either version 2 of the License, or 
# (at your option) any later version. 
# 
# This program is distributed in the hope that it will be useful, 
# but WITHOUT ANY WARRANTY; without even the implied warranty of 
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
# GNU General Public License for more details. 
# 
# You should have received a copy of the GNU General Public License 
# along with this program; if not, write to the Free Software 
# Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
# 
# If you want to use this software an plan to distribute a 
# proprietary application in any way, and you are not licensing and 
# distributing your source code under GPL, you probably need to 
# purchase a commercial license of the product.  More info about 
# licensing options is available at: 
# 
#   http://morfeo-project.org/
#

from urllib import unquote
from django.utils.http import urlencode

import re

def is_localhost (host):
    localhostMatcher = re.compile('^((localhost)|(127\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)))(:\d*)?$')
    if localhostMatcher.match(host) == None:
        return False
    return True
    
def is_valid_header (header):
    if (header == 'connection') or (header== 'keep-alive') or (header == 'proxy-authenticate') or (header == 'proxy-authorization') or (header == 'te') or (header == 'trailers') or (header == 'transfer-encoding') or (header == 'upgrade'):
        return False
    else:
        return True

def encode_query (query):
    params = query.split("&")
    query_params = {}
    for i in range(len(params)):
        elements = params[i].split("=")
        if len(elements) > 1:
            query_params[unquote(elements[0].encode('utf8')).decode('utf8')] = unquote(elements[1].encode('utf8')).decode('utf8')
    return urlencode(query_params)

