# -*- coding: utf-8 -*-

# Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

import hashlib
import time

from django.http import HttpResponse
from django.utils.http import http_date


def patch_cache_headers(response, timestamp=None, cache_timeout=None, etag=None):

    current_timestamp = int(time.time() * 1000)

    if timestamp is None:
        timestamp = current_timestamp
    else:
        timestamp = int(timestamp)

    if not response.has_header('Last-Modified'):
        response['Last-Modified'] = http_date(timestamp / 1000)

    if etag is not None:
        response['ETag'] = etag
    elif not response.streaming and not response.has_header('ETag'):
        response['ETag'] = '"%s"' % hashlib.sha1(response.content).hexdigest()

    if cache_timeout is not None and timestamp + cache_timeout > current_timestamp:
        response['Cache-Control'] = 'private, max-age=%s' % (timestamp + cache_timeout - current_timestamp)
        response['Expires'] = http_date((timestamp / 1000) + cache_timeout)
    else:
        response['Cache-Control'] = 'private, max-age=0'

    return response


class CacheableData(object):

    def __init__(self, data, timestamp=None, timeout=0, content_type='application/json; charset=UTF-8'):

        self.data = data

        if timestamp is None:
            timestamp = time.time() * 1000
        self.timestamp = timestamp

        self.timeout = timeout
        self.content_type = content_type

    def get_data(self):

        return self.data

    def get_response(self, status_code=200, cacheable=True):

        response = HttpResponse(self.data, status=status_code, content_type=self.content_type)
        if cacheable:
            patch_cache_headers(response, self.timestamp, self.timeout)

        return response
