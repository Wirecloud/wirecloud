# -*- coding: utf-8 -*-

# Copyright (c) 2013-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

import copy
import json


def remove_empty_string_fields(fields, data):

    for field in fields:

        value = data.get(field)

        if value is not None and not isinstance(value, str):
            raise Exception("Invalid value for field %s" % field)

        if field in data and (value is None or value == ''):
            del data[field]


def remove_empty_array_fields(fields, data):

    for field in fields:

        value = data.get(field)

        if value is not None and not isinstance(value, (list, tuple)):
            raise Exception("Invalid value for field %s" % field)

        if field in data and (value is None or len(value) == 0):
            del data[field]


def write_json_description(template_info):

    if template_info['type'] not in ('widget', 'operator', 'mashup'):
        raise Exception('Unsupported resource type: ' + template_info['type'])

    template_info = copy.deepcopy(template_info)

    remove_empty_string_fields(('title', 'description', 'longdescription', 'homepage', 'doc', 'image', 'smartphoneimage', 'license', 'licenseurl', 'issuetracker'), template_info)
    remove_empty_array_fields(('authors', 'contributors', 'altcontents', 'embedded'), template_info)

    if template_info['type'] == 'widget':
        contents = template_info.get('contents')
        if contents is None or 'src' not in contents:
            raise Exception('Missing widget content info')

        if 'altcontents' in template_info:
            for altcontents in template_info['altcontents']:
                if not isinstance(altcontents, dict) or 'src' not in altcontents or 'scope' not in altcontents:
                    raise Exception('Invalid alternative contents')

    elif template_info['type'] == 'mashup':

        if 'tabs' not in template_info:
            raise Exception('Missing tabs list')

        for tab in template_info['tabs']:
            remove_empty_string_fields(('title',), tab)

        if 'embedded' in template_info:
            for resource in template_info['embedded']:
                if not isinstance(resource, dict) or 'src' not in resource or 'vendor' not in resource or 'name' not in resource or 'version' not in resource:
                    raise Exception('Invalid embedded resource')

    del template_info['translation_index_usage']
    return json.dumps(template_info, sort_keys=True, indent=4, ensure_ascii=False)
