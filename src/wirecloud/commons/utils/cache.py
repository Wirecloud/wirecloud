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
    response['ETag'] = '"' + str(timestamp) + '"'

    if cache_timeout is not None and timestamp + cache_timeout > current_timestamp:
        timeout_str = str(timestamp + cache_timeout - current_timestamp)
        response['Cache-Control'] = 'private, max-age=' + timeout_str
        response['Expires'] = http_date((timestamp / 1000) + cache_timeout)
    else:
        response['Cache-Control'] = 'private, max-age=0, post-check=0, pre-check=0, must-revalidate'


class CacheableData(object):

    def __init__(self, data, timestamp=None, timeout=0, mimetype='application/json; charset=UTF-8'):

        self.data = data

        if timestamp is None:
            timestamp = time.time() * 1000
        self.timestamp = timestamp

        self.timeout = timeout
        self.mimetype = mimetype

    def get_data(self):

        return self.data

    def get_response(self, status_code=200, cacheable=True):

        response = HttpResponse(self.data, status=status_code, mimetype=self.mimetype)
        if cacheable:
            patch_cache_headers(response, self.timestamp, self.timeout)

        return response
