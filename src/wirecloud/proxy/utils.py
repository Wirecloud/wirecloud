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

from django.http import HttpResponse
from django.utils.translation import ugettext as _

# content_length + hop-by-hop headers(http://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html#sec13.5.1)
BLACKLISTED_HEADERS = {
    'connection': 1, 'content-length': 1, 'keep-alive': 1, 'proxy-authenticate': 1,
    'proxy-authorization': 1, 'te': 1, 'trailers': 1, 'transfer-encoding': 1,
    'upgrade': 1,
}


class ValidationError(Exception):

    def __init__(self, msg):
        self.msg = msg

    def get_response(self):
        return HttpResponse(self.msg, status=422)


def check_empty_params(**kargs):
    missing_params = []

    for param_name in kargs:
        if kargs[param_name] == '':
            missing_params.append(param_name)

    if len(missing_params) > 0:
        msg = _('X-EzWeb-Secure-Data: The following required parameters are missing: %(params)s')
        raise ValidationError(msg % {'params': ', '.join(missing_params)})


def check_invalid_refs(**kargs):
    invalid_params = []

    for param_name in kargs:
        if kargs[param_name] == None:
            invalid_params.append(param_name)

    if len(invalid_params) > 0:
        msg = _('X-EzWeb-Secure-Data: The following required parameters are invalid: %(params)s')
        raise ValidationError(msg % {'params': ', '.join(invalid_params)})


def is_valid_header(header):
    return not header in BLACKLISTED_HEADERS
