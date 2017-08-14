# -*- coding: utf-8 -*-

# Copyright (c) 2013-2015 Conwet Lab., Universidad Politécnica de Madrid

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

from __future__ import unicode_literals

import json
from six.moves.urllib.parse import urljoin, urlparse, urlunparse

import requests


class NotFound(Exception):
    pass


class Conflict(Exception):
    pass


class UnexpectedResponse(Exception):

    status = None
    message = None

    def __init__(self, response):
        self.status = response.status_code

        try:
            error_info = json.loads(response.text)
            self.message = error_info['message']
        except:
            pass

    def __str__(self):
        if self.status is not None and self.message is not None:
            return "Unexpected response from server (Error code: %(error_code)s, Message: %(error_message)s)" % {"error_code": self.status, "error_message": self.message}
        else:
            return "Unexpected response from server (%s error code)" % self.status


class StoreClient(object):

    def __init__(self, url):
        url = urlparse(url)
        if not bool(url.netloc and url.scheme):
            raise ValueError("Your must provide an absolute Store URL")

        self._url = urlunparse((url.scheme, url.netloc, url.path.rstrip('/') + '/', '', '', ''))

    def get_supported_plugins(self, token):

        headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token,
        }
        response = requests.get(urljoin(self._url, 'api/offering/resources/plugins'), headers=headers)

        if response.status_code != 200:
            raise UnexpectedResponse(response)

        return json.loads(response.text)

    def get_offering_info(self, offering_id, token):

        headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token,
        }
        response = requests.get(urljoin(self._url, 'api/offering/offerings/' + offering_id), headers=headers)

        if response.status_code == 404:
            raise NotFound()

        if response.status_code != 200:
            raise UnexpectedResponse(response)

        return json.loads(response.text)

    def start_purchase(self, offering_url, redirect_uri, token):

        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer ' + token,
        }
        data = {
            'offering': offering_url,
            'redirect_uri': redirect_uri
        }
        response = requests.post(urljoin(self._url, 'api/contracting/form'), data=json.dumps(data), headers=headers)

        if response.status_code == 404:
            raise NotFound
        elif response.status_code != 200:
            raise UnexpectedResponse(response)

        return json.loads(response.text)

    def download_resource(self, url, token):

        headers = {
            'Authorization': 'Bearer ' + token,
        }

        response = requests.get(urljoin(self._url, url), headers=headers)

        if response.status_code not in (200, 201, 204):
            raise UnexpectedResponse(response)

        return response.content

    def upload_resource(self, name, version, filename, description, content_type, f, token, open=True, resource_type=None):

        headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token,
        }
        json_data = {
            'name': name,
            'version': version,
            'description': description,
            'content_type': content_type,
            'open': open,
        }
        if resource_type is not None:
            json_data['resource_type'] = resource_type

        data = {'json': json.dumps(json_data)}

        # Rest file to ensure the full file is uploaded
        f.seek(0)
        response = requests.post(urljoin(self._url, 'api/offering/resources'), headers=headers, data=data, files={'file': (filename, f)})
        if response.status_code == 409:
            raise Conflict('Resource already exists')

        if response.status_code not in (200, 201, 204):
            raise UnexpectedResponse(response)
