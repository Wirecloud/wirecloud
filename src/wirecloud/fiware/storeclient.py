# -*- coding: utf-8 -*-

# Copyright (c) 2013 Conwet Lab., Universidad Politécnica de Madrid

# This file is part of Wirecluod.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import json
import requests
from urlparse import urljoin


class StoreClient(object):

    def __init__(self, url):
        self._url = url

    def get_offering_info(self, offering_id, token):

        headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token,
        }
        response = requests.get(urljoin(self._url, 'api/offering/offerings/' + offering_id), headers=headers)

        return json.loads(response.text)

    def start_purchase(self, offering_url, token):

        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=UTF-8',
            'Authorization': 'Bearer ' + token,
        }
        data = {
            'offering': offering_url,
        }
        response = requests.post(urljoin(self._url, 'api/contracting/form'), data=json.dumps(data, ensure_ascii=False), headers=headers)

        return json.loads(response.text)

    def upload_resource(self, name, version, filename, description, content_type, f, token):

        headers = {
            'Authorization': 'Bearer ' + token,
        }
        data = {
            'name': name,
            'version': version,
            'description': description,
            'content_type': content_type,
        }
        requests.post(urljoin(self._url, 'api/offering/resources'), headers=headers, data=data, files={'file': (filename, f)})
