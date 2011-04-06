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

import re
from urllib import unquote

from django.utils.http import urlencode

LOCALHOST_RE = re.compile('^((localhost)|(127\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)))(:\d*)?$')

# content_length + hop-by-hop headers(http://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html#sec13.5.1)
BLACKLISTED_HEADERS = {
    'connection': 1, 'content-length': 1, 'keep-alive': 1, 'proxy-authenticate': 1,
    'proxy-authorization': 1, 'te': 1, 'trailers': 1, 'transfer-encoding': 1,
    'upgrade': 1
}


def is_localhost(host):
    if LOCALHOST_RE.match(host) == None:
        return False
    return True


def is_valid_header(header):
    return not header in BLACKLISTED_HEADERS


def encode_query(query):
    params = query.split("&")
    query_params = {}
    for param in params:
        elements = param.split("=")
        if len(elements) > 1:
            key, value = elements
            query_params[unquote(key.encode('utf8')).decode('utf8')] = unquote(value.encode('utf8')).decode('utf8')
    return urlencode(query_params)
