# -*- coding: utf-8 -*-

# Copyright (c) 2011-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

from wirecloud.commons.utils.http import build_error_response


# Remove hop-by-hop headers (http://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html#sec13.5.1)
BLACKLISTED_HEADERS = {
    'connection': 1, 'keep-alive': 1, 'proxy-authenticate': 1,
    'proxy-authorization': 1, 'te': 1, 'trailers': 1, 'transfer-encoding': 1,
    'upgrade': 1,
}


class ValidationError(Exception):

    def __init__(self, msg):
        self.msg = msg

    def get_response(self, request):
        return build_error_response(request, 422, self.msg)


def is_valid_response_header(header):
    return header not in BLACKLISTED_HEADERS
