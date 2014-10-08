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

import json
import time

from django.http import HttpResponse
from django.utils.cache import patch_cache_control
from django.utils.http import http_date


def no_cache(func):

    def _no_cache(*args, **kwargs):
        response = func(*args, **kwargs)
        patch_cache_control(response, no_cache=True, no_store=True, must_revalidate=True, max_age=0)
        return response

    return _no_cache


def patch_cache_headers(response, timestamp=None, cache_timeout=None):

    current_timestamp = time.time() * 1000

    if timestamp is None:
        timestamp = current_timestamp
    else:
        timestamp = int(timestamp)

    response['Last-Modified'] = http_date(timestamp / 1000)
    response['ETag'] = '"%s"' % timestamp

    if cache_timeout is not None and timestamp + cache_timeout > current_timestamp:
        response['Cache-Control'] = 'private, max-age=%s' % (timestamp + cache_timeout - current_timestamp)
        response['Expires'] = http_date((timestamp / 1000) + cache_timeout)
    else:
        response['Cache-Control'] = 'private, max-age=0'


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
