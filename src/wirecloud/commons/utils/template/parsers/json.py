# -*- coding: utf-8 -*-

# Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import absolute_import

import json
import urlparse

from django.utils.translation import ugettext as _

from wirecloud.commons.utils.template.base import is_valid_name, is_valid_vendor, is_valid_version, TemplateParseException
from wirecloud.commons.utils.translation import get_trans_index


class JSONTemplateParser(object):

    def __init__(self, template, base=None):

        self.base = base
        self._info = json.loads(template)

        if 'type' not in self._info:
            raise TemplateParseException(_('Missing resource type.'))

        if self._info['type'] not in ('widget', 'operator', 'mashup'):
            raise TemplateParseException(_('Invalid resource type: %s') % self._info['type'])

    def _add_translation_index(self, value, **kwargs):
        index = get_trans_index(value)
        if not index:
            return

        if index not in self._info['translation_index_usage']:
            self._info['translation_index_usage'][index] = []

        self._info['translation_index_usage'][index].append(kwargs)

    def _init(self):

        for field in ['doc_uri', 'image_uri', 'iphone_image_uri']:
            if field not in self._info:
                self._info[field] = ''

        if self._info['type'] == 'widget':

            if self._info.get('code_content_type') is None:
                self._info['code_content_type'] = 'text/html'

            if self._info.get('code_charset') is None:
                self._info['code_charset'] = 'utf-8'

        # Translations
        self._info['translation_index_usage'] = {}
        if 'translations' not in self._info:
            self._info['translations'] = {}

        self._add_translation_index(self._info['display_name'], type='resource', field='display_name')
        self._add_translation_index(self._info['description'], type='resource', field='description')

        if self._info['type'] != 'mashup':
            for preference in self._info['preferences']:
                self._add_translation_index(preference['label'], type='vdef', variable=preference['name'], field='label')
                self._add_translation_index(preference['description'], type='vdef', variable=preference['name'], field='description')

                if preference['type'] == 'list':
                    for option_index, option in enumerate(preference['options']):
                        self._add_translation_index(option['label'], type='upo', variable=preference['name'], option=option_index)

            for prop in self._info['properties']:
                self._add_translation_index(prop['label'], type='vdef', variable=prop['name'], field='label')
                self._add_translation_index(prop['description'], type='vdef', variable=prop['name'], field='description')

            for input_endpoint in self._info['wiring']['inputs']:
                self._add_translation_index(input_endpoint['label'], type='vdef', variable=input_endpoint['name'], field='label')
                self._add_translation_index(input_endpoint['description'], type='vdef', variable=input_endpoint['name'], field='description')
                self._add_translation_index(input_endpoint['actionlabel'], type='vdef', variable=input_endpoint['name'], field='actionlabel')

            for output_endpoint in self._info['wiring']['outputs']:
                self._add_translation_index(output_endpoint['label'], type='vdef', variable=output_endpoint['name'], field='label')
                self._add_translation_index(output_endpoint['description'], type='vdef', variable=output_endpoint['name'], field='description')

    def get_resource_type(self):
        return self._info['type']

    def get_resource_name(self):
        return self._info['name']

    def get_resource_vendor(self):
        return self._info['vendor']

    def get_resource_version(self):
        return self._info['version']

    def get_resource_info(self):

        if not is_valid_vendor(self._info['vendor']):
            raise TemplateParseException(_('ERROR: the format of the vendor is invalid.'))

        if not is_valid_name(self._info['name']):
            raise TemplateParseException(_('ERROR: the format of the name is invalid.'))

        if not is_valid_version(self._info['version']):
            raise TemplateParseException(_('ERROR: the format of the version number is invalid. Format: X.X.X where X is an integer. Ex. "0.1", "1.11" NOTE: "1.01" should be changed to "1.0.1" or "1.1"'))

        return dict(self._info)
