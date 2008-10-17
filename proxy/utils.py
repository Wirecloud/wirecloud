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

