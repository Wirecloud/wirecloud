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

import json

from django.utils.translation import ugettext as _
from six import text_type

from wirecloud.commons.utils.template.base import is_valid_name, is_valid_vendor, is_valid_version, parse_contacts_info, TemplateParseException
from wirecloud.commons.utils.translation import get_trans_index


class JSONTemplateParser(object):

    def __init__(self, template, base=None):

        self.base = base
        if isinstance(template, text_type):
            self._info = json.loads(template)
        elif isinstance(template, bytes):
            self._info = json.loads(template.decode('utf8'))
        elif isinstance(template, dict):
            self._info = template
        else:
            raise TemplateParseException('Invalid input data')

        if 'type' not in self._info:
            raise TemplateParseException(_('Missing resource type.'))

        if self._info['type'] not in ('widget', 'operator', 'mashup'):
            raise TemplateParseException(_('Invalid resource type: %s') % self._info['type'])

    def _check_array_fields(self, fields, place=None, required=False):

        if place is None:
            place = self._info

        for field in fields:
            if field not in place:
                if required:
                    raise TemplateParseException('Missing required field: %s' % field)

                place[field] = []
            elif not isinstance(place[field], (list, tuple)):
                raise TemplateParseException('An array value was expected for the %s field' % field)

    def _check_string_fields(self, fields, place=None, required=False, default='', null=False):
        if place is None:
            place = self._info

        for field in fields:
            if field not in place:
                if required:
                    raise TemplateParseException('Missing required field: %s' % field)

                place[field] = default
            elif not isinstance(place[field], text_type):
                if null is True and place[field] is None:
                    continue
                raise TemplateParseException('A string value was expected for the %s field' % field)

    def _check_boolean_fields(self, fields, place=None, required=False, default=False):
        if place is None:
            place = self._info

        for field in fields:
            if field not in place:
                if required:
                    raise TemplateParseException('Missing required field: %s' % field)

                place[field] = default
            elif not isinstance(place[field], bool):
                raise TemplateParseException('A boolean value was expected for the %s field' % field)

    def _check_contacts_fields(self, fields, place=None, required=False):
        if place is None:
            place = self._info

        for field in fields:
            if field not in place:
                if required:
                    raise TemplateParseException('Missing required field: %s' % field)

                place[field] = []
            elif isinstance(place[field], (text_type, list, tuple)):
                place[field] = parse_contacts_info(place[field])
            else:
                raise TemplateParseException('%s field must be a list or string' % field)

    def _check_contents_field(self, data, alternative=True):
        if isinstance(data, dict):
            self._check_string_fields(('src',), place=data, required=True)
            self._check_string_fields(('contenttype',), place=data, default='text/html')
            self._check_string_fields(('charset',), place=data, default='utf-8')

            if alternative is True:
                self._check_string_fields(('scope',), place=data, required=True)
            else:
                self._check_boolean_fields(('cacheable',), place=data, default=True)
                self._check_boolean_fields(('useplatformstyle',), place=data, default=False)
        else:
            raise TemplateParseException('contents info must be an object')

    def _add_translation_index(self, value, **kwargs):
        index = get_trans_index(value)
        if not index:
            return

        if index not in self._info['translation_index_usage']:
            self._info['translation_index_usage'][index] = []

        self._info['translation_index_usage'][index].append(kwargs)

    def _init(self):

        self._check_string_fields(('title', 'description', 'longdescription', 'email',  'homepage','doc', 'changelog', 'image', 'smartphoneimage', 'license', 'licenseurl'))
        self._check_contacts_fields(('authors', 'contributors'))

        # Normalize/check preferences and properties (only for widgets and operators)
        if self._info['type'] != 'mashup':

            self._check_array_fields(('preferences', 'properties'))
            for preference in self._info['preferences']:
                self._check_string_fields(('name', 'type'), place=preference, required=True)
                self._check_string_fields(('label', 'description', 'default'), place=preference)
                self._check_boolean_fields(('readonly', 'secure'), place=preference, default=False)
                self._check_string_fields(('value',), place=preference, null=True, default=None)

            for prop in self._info['properties']:
                self._check_string_fields(('name', 'type'), place=prop, required=True)
                self._check_string_fields(('label', 'description', 'default'), place=prop)
                self._check_boolean_fields(('secure',), place=prop, default=False)

        if self._info['type'] == 'widget':

            self._check_array_fields(('altcontents',))
            if self._info.get('contents', None) is None:
                raise TemplateParseException('Missing widget content info')
            if not isinstance(self._info['contents'], dict):
                raise TemplateParseException('Content info must be an object')

            self._check_contents_field(self._info['contents'], alternative=False)
            for altcontent in self._info['altcontents']:
                self._check_contents_field(altcontent)

        elif self._info['type'] == 'mashup':

            self._check_array_fields(('params', 'embedded'))
            for resource in self._info['embedded']:
                if isinstance(resource, dict):
                    self._check_string_fields(('vendor', 'name', 'version', 'src'), place=resource, required=True)
                else:
                    raise TemplateParseException('embedded resource info must be an object')

        if not 'wiring' in self._info:
            self._info['wiring'] = {}

        self._check_array_fields(('inputs', 'outputs'), place=self._info['wiring'])

        # Translations
        self._check_string_fields(('default_lang',), default='en')
        self._info['translation_index_usage'] = {}
        if 'translations' not in self._info:
            self._info['translations'] = {}

        self._add_translation_index(self._info['title'], type='resource', field='title')
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
                self._check_string_fields(('name', 'type'), required=True, place=input_endpoint)
                self._check_string_fields(('label', 'description', 'actionlabel', 'friendcode'), place=input_endpoint)
                self._add_translation_index(input_endpoint['label'], type='inputendpoint', variable=input_endpoint['name'], field='label')
                self._add_translation_index(input_endpoint['description'], type='inputendpoint', variable=input_endpoint['name'], field='description')
                self._add_translation_index(input_endpoint['actionlabel'], type='inputendpoint', variable=input_endpoint['name'], field='actionlabel')

            for output_endpoint in self._info['wiring']['outputs']:
                self._check_string_fields(('name', 'type'), required=True, place=output_endpoint)
                self._check_string_fields(('label', 'description', 'friendcode'), place=output_endpoint)
                self._add_translation_index(output_endpoint['label'], type='outputendpoint', variable=output_endpoint['name'], field='label')
                self._add_translation_index(output_endpoint['description'], type='outputendpoint', variable=output_endpoint['name'], field='description')

        # Requirements
        self._check_array_fields(('requirements',))

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
