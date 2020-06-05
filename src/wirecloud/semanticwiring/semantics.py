# -*- coding: utf-8 -*-

# Copyright (c) 2013 Conwet Lab., Universidad Politécnica de Madrid
# Copyright (c) 2013 Center for Open Middleware

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
import requests
from urllib.parse import urljoin

from django.conf import settings


def get_widget_semantic_data(widget):

    fields = []
    widget_description = json.loads(widget.json_description)
    for input_endpoint in widget_description['wiring']['inputs']:
        fields.append({
            'syntacticType': input_endpoint['type'],
            'semanticType': input_endpoint['friendcode'],
            'flow': 'input',
            'id': widget.local_uri_part + '/' + input_endpoint['name']
        })

    for output_endpoint in widget_description['wiring']['outputs']:
        fields.append({
            'syntacticType': output_endpoint['type'],
            'semanticType': output_endpoint['friendcode'],
            'flow': 'output',
            'id': widget.local_uri_part + '/' + output_endpoint['name']
        })

    return fields


def add_widget_semantic_data(user, widget):

    matchingSpace = urljoin(settings.SEMANTIC_MATCHING_SERVICE, str(user.username))
    response = requests.get(matchingSpace)

    if response.status_code == 404 or response.text == '':
        requests.put(matchingSpace)
        if response.status_code <= 200 or response.status_code >= 300:
            raise Exception()

    data = {
        'fields': get_widget_semantic_data(widget),
        'type': 'addition',
        'ontologies': [],
    }

    response = requests.post(matchingSpace, data=json.dumps(data), headers={'Content-Type': 'application/json'})
    if response.status_code != 200:
        raise Exception()


def remove_widget_semantic_data(user, widget):

    matchingSpace = urljoin(settings.SEMANTIC_MATCHING_SERVICE, str(user.username))
    response = requests.get(matchingSpace)

    if response.status_code == 404 or response.text == '':
        return

    data = {
        'fields': get_widget_semantic_data(widget),
        'type': 'removal',
        'ontologies': [],
    }

    response = requests.post(matchingSpace, data=json.dumps(data), headers={'Content-Type': 'application/json'})
    if response.status_code != 200:
        raise Exception()
