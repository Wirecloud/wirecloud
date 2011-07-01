import time

from django.http import HttpResponse
from django.utils.cache import patch_cache_control
from django.utils.http import http_date

from commons.utils import json_encode


def no_cache(func):

    def _no_cache(*args, **kwargs):
        response = func(*args, **kwargs)
        patch_cache_control(response, no_cache=True, no_store=True, must_revalidate=True, max_age=0)
        return response

    return _no_cache


def patch_cache_headers(response, timestamp=None, cache_timeout=None):

    if timestamp is None:
        timestamp = time.time() * 1000

    timestamp = int(timestamp)
    response['Last-Modified'] = http_date(timestamp / 1000)
    response['ETag'] = '"' + str(timestamp) + '"'

    if cache_timeout != None and cache_timeout > 0:
        timeout_str = str(cache_timeout)
        response['Cache-Control'] = 'private, max-age=' + timeout_str
        response['Expires'] = http_date(time.time() + cache_timeout)
    else:
        response['Cache-Control'] = 'private, max-age=0, post-check=0, pre-check=0, must-revalidate'


class CacheableData(object):

    def __init__(self, data, timestamp=None, timeout=0):
        self.data = data

        if timestamp is None:
            timestamp = time.time() * 1000
        self.timestamp = timestamp

        self.timeout = timeout

    def get_data(self):
        return self.data

    def get_response(self):
        response = HttpResponse(json_encode(self.data), mimetype='application/json; charset=UTF-8')
        patch_cache_headers(response, self.timestamp, self.timeout)
        return response
