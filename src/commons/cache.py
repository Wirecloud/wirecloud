from datetime import datetime
import time

from django.http import HttpResponse
from django.utils.http import http_date

from commons.utils import json_encode


def patch_cache_headers(response, cache_timestamp, cache_timeout):

    if cache_timestamp:
        timestamp = int(time.mktime(cache_timestamp.timetuple()))
        response['Last-Modified'] = http_date(timestamp)
    else:
        response['Last-Modified'] = http_date()

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
            timestamp = datetime.now()
        self.timestamp = timestamp

        self.timeout = timeout

    def get_data(self):
        return self.data

    def get_response(self):
        response = HttpResponse(json_encode(self.data), mimetype='application/json; charset=UTF-8')
        patch_cache_headers(response, self.timestamp, self.timeout)
        return response
