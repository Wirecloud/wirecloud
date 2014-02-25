# -*- coding: utf-8 -*-

# Copyright (c) 2011-2014 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import re

from django.http import HttpResponse
from django.utils.translation import ugettext as _

# content_length + hop-by-hop headers(http://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html#sec13.5.1)
BLACKLISTED_HEADERS = {
    'connection': 1, 'keep-alive': 1, 'proxy-authenticate': 1,
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
        msg = _('X-Wirecloud-Secure-Data: The following required parameters are missing: %(params)s')
        raise ValidationError(msg % {'params': ', '.join(missing_params)})


def check_invalid_refs(**kargs):
    invalid_params = []

    for param_name in kargs:
        if kargs[param_name] == None:
            invalid_params.append(param_name)

    if len(invalid_params) > 0:
        msg = _('X-Wirecloud-Secure-Data: The following required parameters are invalid: %(params)s')
        raise ValidationError(msg % {'params': ', '.join(invalid_params)})


def is_valid_header(header):
    return not header in BLACKLISTED_HEADERS
