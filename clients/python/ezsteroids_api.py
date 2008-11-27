# -*- coding: utf-8 -*-
# See license file (LICENSE.txt) for info about license terms.

import httplib
import base64
import urllib
import datetime
import time
import re
#import simplejson
from django.utils import simplejson
from django.forms import fields
from django.conf import settings



try:
    server = settings.AUTHENTICATION_SERVER_URL.replace("//","")
    server = server.split(":")
    PROTOCOL = server[0]
    HOST = server[1]
    PORT = server[2]
except AttributeError:
    HOST = 'localhost'
    PROTOCOL = 'http'
    PORT = 8001

PREFIX = '/api'

API_URL = '%s://%s:%s%s' % (PROTOCOL, HOST, PORT, PREFIX)



class StatusException(Exception):
    """Create an Error Response. """
    def __init__(self, value, result=None):
        self.value = value
        self.responses = {
        100: ('Continue', 'Request received, please continue'),
        101: ('Switching Protocols',
              'Switching to new protocol; obey Upgrade header'),
        200: ('OK', 'Request fulfilled, document follows'),
        201: ('Created', 'Document created, URL follows'),
        202: ('Accepted',
              'Request accepted, processing continues off-line'),
        203: ('Non-Authoritative Information', 'Request fulfilled from cache'),
        204: ('No Content', 'Request fulfilled, nothing follows'),
        205: ('Reset Content', 'Clear input form for further input.'),
        206: ('Partial Content', 'Partial content follows.'),
        300: ('Multiple Choices',
              'Object has several resources -- see URI list'),
        301: ('Moved Permanently', 'Object moved permanently -- see URI list'),
        302: ('Found', 'Object moved temporarily -- see URI list'),
        303: ('See Other', 'Object moved -- see Method and URL list'),
        304: ('Not Modified',
              'Document has not changed since given time'),
        305: ('Use Proxy',
              'You must use proxy specified in Location to access this '
              'resource.'),
        307: ('Temporary Redirect',
              'Object moved temporarily -- see URI list'),
        400: ('Bad Request',
              'Bad request syntax or unsupported method'),
        401: ('Unauthorized',
              'No permission -- see authorization schemes'),
        402: ('Payment Required',
              'No payment -- see charging schemes'),
        403: ('Forbidden',
              'Request forbidden -- authorization will not help'),
        404: ('Not Found', 'Nothing matches the given URI'),
        405: ('Method Not Allowed',
              'Specified method is invalid for this server.'),
        406: ('Not Acceptable', 'URI not available in preferred format.'),
        407: ('Proxy Authentication Required', 'You must authenticate with '
              'this proxy before proceeding.'),
        408: ('Request Timeout', 'Request timed out; try again later.'),
        409: ('Conflict', 'Request conflict.'),
        410: ('Gone',
              'URI no longer exists and has been permanently removed.'),
        411: ('Length Required', 'Client must specify Content-Length.'),
        412: ('Precondition Failed', 'Precondition in headers is false.'),
        413: ('Request Entity Too Large', 'Entity is too large.'),
        414: ('Request-URI Too Long', 'URI is too long.'),
        415: ('Unsupported Media Type', 'Entity body in unsupported format.'),
        416: ('Requested Range Not Satisfiable',
              'Cannot satisfy request range.'),
        417: ('Expectation Failed',
              'Expect condition could not be satisfied.'),
        500: ('Internal Server Error', 'Server got itself in trouble'),
        501: ('Not Implemented',
              'Server does not support this operation'),
        502: ('Bad Gateway', 'Invalid responses from another server/proxy.'),
        503: ('Service Unavailable',
              'The server cannot process the request due to a high load'),
        504: ('Gateway Timeout',
              'The gateway server did not receive a timely response'),
        505: ('HTTP Version Not Supported', 'Cannot fulfill request.'),
        }
        if result:
            self.result = "\n%s" % result
    def __str__(self):
        return "Error [%s]: %s. %s.%s" % (self.value,
            self.responses[self.value][0], self.responses[self.value][1],
            self.result)


class Request(object):
    """Create an HTTP request object for HTTP
    verbs GET, POST, PUT and DELETE.
    """
    def __init__(self, username=None, password=None, protocol=PROTOCOL, host=HOST, port=PORT, prefix=PREFIX, key_file=None, cert_file=None):
        self._username = username
        self.password = password
        self.protocol = protocol
        self.host = host
        self.port = port
        self.prefix = prefix
        self.key_file = key_file
        self.cert_file = cert_file

    def get(self, url, headers=None):
        """Perform an HTTP GET request for a given URL.
        Returns the response object.
        """
        return self.__request__('GET', url, headers=headers)

    def post(self, url, body, headers=None):
        """Perform an HTTP POST request for a given url.
        Returns the response object.
        """
        return self.__request__('POST', url, body, headers=headers)

    def put(self, url, body, headers=None):
        """Perform an HTTP PUT request for a given url.
        Returns the response object.
        """
        return self.__request__('PUT', url, body, headers=headers)

    def delete(self, url, headers=None):
        """Perform an HTTP DELETE request for a given url.
        Returns the response object.
        """
        return self.__request__('DELETE', url, headers=headers)

    def __request__(self, method, url, body=None, headers=None):
        if self.protocol.lower() == 'https':
            _connection = httplib.HTTPSConnection(self.host, self.port, self.key_file, self.cert_file)
        else:
            _connection = httplib.HTTPConnection(self.host, self.port)
        _headers = {}
        _body = None
        if body:
            _body = {}
            for k, v in body.items():
                if v is None:
                    _body[k] = ''
                else:
                    _body[k] = v
            _body = urllib.urlencode(_body)
            _headers['Content-Type'] = '*/*'
            _headers['Accept'] = '*/*'
            _headers['Accept-Encoding'] = '*'

        if self._username and self.password:
            _credentials = "%s:%s" % (self._username, self.password)
            # _authorization = "Basic %s" % base64.encodestring(_credentials.encode('UTF-8')).strip()
            _authorization = "Basic %s" % base64.encodestring(_credentials)[:-1]
            _headers['Authorization'] = _authorization

        if headers:
            _headers.update(headers)

        _url = self.prefix + url
        _connection.request(method, _url, _body, _headers)
        _response = _connection.getresponse()
        _response.body = _response.read()
        _connection.close()
        if _response.status == 401:
            raise StatusException(401, "Authorization Required")
        return _response


class API(object):
    """ Main class of the library. """
    def __init__(self, username=None, password=None, protocol=PROTOCOL, host=HOST, port=PORT, prefix=PREFIX):
        self._username = username
        self.request = Request(username=username, password=password, protocol=protocol, host=host, port=port, prefix=prefix)
        #self.User = User(request=self.request, username=username, auto_commit=auto_commit)
        #self.Group = Groups(request=self.request, username=username, auto_commit=auto_commit, auto_sync=auto_sync)

    def get_all_policies(self):
        url = '/policies.json'
        response = self.request.get(url)
        if response.status == 200:
            response_json = simplejson.loads(response.body)
            policy_list_json = response_json['policy_list']
            policy_list = []
            for policy_json in policy_list_json:
                policy = Policy(policy_json)
                policy_list.append(policy)
            return policy_list
        else:
            raise StatusException(response.status, "Unable get all policies.")

    def get_user_policies(self, username):
        url = '/user/%s/policies.json' % username
        response = self.request.get(url)
        if response.status == 200:
            response_json = simplejson.loads(response.body)
            policy_list_json = response_json['policy_list']
            policy_list = []
            for policy_json in policy_list_json:
                policy = Policy(policy_json)
                policy_list.append(policy)
            return policy_list
        else:
            raise StatusException(response.status, "Unable get user policies.")

    def evalue_policy(self, username , policy_codename):
        url = '/user/%s/policies/%s.json' % (username, policy_codename)
        response = self.request.get(url)
        if response.status == 200:
            response_json = simplejson.loads(response.body)
            if response_json['policy'] in [None, "None"]:
                return False
            else:
                return True;
        else:
            raise StatusException(response.status, "Unable check user policy.")

    def get_all_categories(self):
        url = '/categories.json'
        response = self.request.get(url)
        if response.status == 200:
            response_json = simplejson.loads(response.body)
            category_list_json = response_json['category_list']
            category_list = []
            for category_json in category_list_json:
                category = Category(category_json, request=self.request)
                category_list.append(category)
            return category_list
        else:
            raise StatusException(response.status, "Unable get all categories.")

    def get_categories(self, username):
        url = '/user/%s/categories.json' % username
        response = self.request.get(url)
        if response.status == 200:
            response_json = simplejson.loads(response.body)
            category_list_json = response_json['category_list']
            category_list = []
            for category_json in category_list_json:
                category = Category(category_json, self.request)
                category_list.append(category)

            return category_list
        else:
            raise StatusException(response.status, "Unable get user categories.")

    def check_category(self, username, category_name):
        url = '/user/%s/categories/%s.json' % (username, category_name)
        response = self.request.get(url)
        if response.status == 200:
            response_json = simplejson.loads(response.body)
            if response_json['category'] in ["None", None] :
                return False
            else:
                return True
        else:
            raise StatusException(response.status, "Unable check user category.")


class Abstract(object):
    def __init__(self, response_json, request=None):
        for key, value in response_json.items():
            if hasattr(self, 'remote_attrs') and key in self.remote_attrs.keys():
                json_key, Cls = self.remote_attrs[key]
                url = value.replace(API_URL,'')[:-1]+'.json'
                response = request.get(url)
                if response.status == 200:
                    response_json = simplejson.loads(response.body)
                    generic_list_json = response_json[json_key]
                    generic_list = []
                    for generic_json in generic_list_json:
                        obj = Cls(generic_json)
                        generic_list.append(obj)
                    setattr(self, key, generic_list)
                else:
                    raise StatusException(response.status, "Unable get category policies.")
            else:
                setattr(self, key, value)


class Policy(Abstract):
    pass


class Category(Abstract):
    remote_attrs = {'policies': ('policy_list', Policy)}



__all__ = ('API', 'Request')
