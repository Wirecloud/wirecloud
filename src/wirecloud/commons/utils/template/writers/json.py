# -*- coding: utf-8 -*-

# Copyright (c) 2013-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import absolute_import, unicode_literals
import copy
import json


def remove_empty_fields(fields, data):

    for field in fields:
        value = data.get(field)
        if value is None or value == '':
            del data[field]


def write_json_description(template_info):

    if template_info['type'] not in ('widget', 'operator', 'mashup'):
        raise Exception('Unsupported resource type: ' + template_info['type'])

    template_info = copy.copy(template_info)

    remove_empty_fields(('title', 'description', 'authors', 'doc', 'image', 'smartphoneimage', 'license', 'licenseurl'), template_info)

    del template_info['translation_index_usage']
    return json.dumps(template_info, sort_keys=True, indent=4)
