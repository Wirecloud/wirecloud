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

import json

from django.utils.translation import ugettext as _

from wirecloud.commons.utils.template.base import is_valid_name, is_valid_vendor, is_valid_version, parse_contacts_info, TemplateParseException
from wirecloud.commons.utils.translation import get_trans_index
from wirecloud.platform.wiring.utils import get_wiring_skeleton, parse_wiring_old_version


class JSONTemplateParser(object):

    def __init__(self, template, base=None):

        self.base = base
        if isinstance(template, str):
            self._info = json.loads(template)
        elif isinstance(template, bytes):
            self._info = json.loads(template.decode('utf8'))
        elif isinstance(template, dict):
            self._info = template
        else:
            raise ValueError('Invalid input data')

        if 'type' not in self._info:
            raise ValueError(_('Missing component type.'))

        if self._info['type'] not in ('widget', 'operator', 'mashup'):
            raise ValueError(_('Invalid component type: %s') % self._info['type'])

    def _check_array_fields(self, fields, place=None, required=False):

        if place is None:
            place = self._info

        if not isinstance(fields, (list, tuple)):
            fields = (fields,)

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

        if not isinstance(fields, (list, tuple)):
            fields = (fields,)

        for field in fields:
            if field not in place:
                if required:
                    raise TemplateParseException('Missing required field: %s' % field)

                place[field] = default
            elif not isinstance(place[field], str):
                if null is True and place[field] is None:
                    continue
                raise TemplateParseException('A string value was expected for the %s field' % field)

    def _check_boolean_fields(self, fields, place=None, required=False, default=False):
        if place is None:
            place = self._info

        if not isinstance(fields, (list, tuple)):
            fields = (fields,)

        for field in fields:
            if field not in place:
                if required:
                    raise TemplateParseException('Missing required field: %s' % field)

                place[field] = default
            elif not isinstance(place[field], bool):
                raise TemplateParseException('A boolean value was expected for the %s field' % field)

    def _check_integer_fields(self, fields, place=None, required=False, default=0):
        if place is None:
            place = self._info

        for field in fields:
            if field not in place:
                if required:
                    raise TemplateParseException('Missing required field: %s' % field)

                place[field] = default
            elif not isinstance(place[field], int):
                raise TemplateParseException('An integer value was expected for the %s field' % field)

    def _check_contacts_fields(self, fields, place=None, required=False):
        if place is None:
            place = self._info

        for field in fields:
            if field not in place:
                if required:
                    raise TemplateParseException('Missing required field: %s' % field)

                place[field] = []
            elif isinstance(place[field], (str, list, tuple)):
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

    def _check_handle_field(self, data, name):
        if name not in data:
            data[name] = 'auto'
        elif data[name] != 'auto':
            self._check_integer_fields(('x', 'y'), data[name])

    def _check_connection_handles(self, data):
        self._check_handle_field(data, 'sourcehandle')
        self._check_handle_field(data, 'targethandle')

    def _check_component_info(self, data, component_type):

        for component_id, component in data['components'][component_type].items():
            self._check_boolean_fields('collapsed', place=component, default=False)
            if 'endpoints' not in component:
                component['endpoints'] = {}

            if 'source' not in component['endpoints']:
                component['endpoints']['source'] = []

            if 'target' not in component['endpoints']:
                component['endpoints']['target'] = []

    def _check_behaviour_view_fields(self, data):

        self._check_component_info(data, 'operator')
        self._check_component_info(data, 'widget')
        self._check_array_fields(('connections',), place=data, required=False)
        for connection in data['connections']:
            self._check_string_fields(('sourcename', 'targetname'), place=connection, required=True)
            self._check_connection_handles(connection)

    def _add_translation_index(self, value, **kwargs):
        index = get_trans_index(str(value))
        if not index:
            return

        if index not in self._info['translation_index_usage']:
            self._info['translation_index_usage'][index] = []

        self._info['translation_index_usage'][index].append(kwargs)

    def _init(self):

        self._check_string_fields(('title', 'description', 'longdescription', 'email', 'homepage', 'doc', 'changelog', 'image', 'smartphoneimage', 'license', 'licenseurl', 'issuetracker'))
        self._check_contacts_fields(('authors', 'contributors'))

        # Normalize/check preferences and properties (only for widgets and operators)
        if self._info['type'] != 'mashup':

            self._check_array_fields(('preferences', 'properties'))
            for preference in self._info['preferences']:
                self._check_string_fields(('name', 'type'), place=preference, required=True)
                self._check_string_fields(('label', 'description', 'default'), place=preference)
                self._check_boolean_fields(('readonly', 'secure'), place=preference, default=False)
                self._check_string_fields(('value',), place=preference, null=True, default=None)
                preference['multiuser'] = False
                self._check_boolean_fields('required', place=preference, default=False)

            for prop in self._info['properties']:
                self._check_string_fields(('name', 'type'), place=prop, required=True)
                self._check_string_fields(('label', 'description', 'default'), place=prop)
                self._check_boolean_fields(('secure',), place=prop, default=False)
                self._check_boolean_fields(('multiuser',), place=prop, default=False)

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

            self._check_array_fields(('params', 'tabs', 'embedded'))

            for tab in self._info['tabs']:
                self._check_string_fields(('name',), place=tab, required=True)
                self._check_string_fields(('title',), place=tab, required=False)

            for preference in self._info['params']:
                self._check_string_fields(('name', 'type'), place=preference, required=True)
                self._check_string_fields(('label', 'description', 'default'), place=preference)
                self._check_boolean_fields('readonly', place=preference, default=False)
                self._check_string_fields(('value',), place=preference, null=True, default=None)
                self._check_boolean_fields('required', place=preference, default=True)

            for component in self._info['embedded']:
                if isinstance(component, dict):
                    self._check_string_fields(('vendor', 'name', 'version', 'src'), place=component, required=True)
                else:
                    raise TemplateParseException('embedded component info must be an object')

            if 'wiring' not in self._info:
                self._info['wiring'] = get_wiring_skeleton()

            self._check_string_fields(('version',), place=self._info['wiring'], default='1.0')

            if self._info['wiring']['version'] == '1.0':

                # TODO: update to the new wiring format
                inputs = self._info['wiring']['inputs']
                outputs = self._info['wiring']['outputs']
                self._info['wiring'] = parse_wiring_old_version(self._info['wiring'])
                self._info['wiring']['inputs'] = inputs
                self._info['wiring']['outputs'] = outputs
                # END TODO

            elif self._info['wiring']['version'] == '2.0':

                if 'visualdescription' not in self._info['wiring']:
                    self._info['wiring']['visualdescription'] = {}

                self._check_array_fields('behaviours', place=self._info['wiring']['visualdescription'], required=False)
                self._check_behaviour_view_fields(self._info['wiring']['visualdescription'])
                for behaviour in self._info['wiring']['visualdescription']['behaviours']:
                    self._check_behaviour_view_fields(behaviour)

        if 'wiring' not in self._info:
            self._info['wiring'] = {}

        self._check_array_fields(('inputs', 'outputs'), place=self._info['wiring'], required=False)

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
        else:

            for preference in self._info['params']:
                self._add_translation_index(preference['label'], type='vdef', variable=preference['name'], field='label')
                self._add_translation_index(preference['description'], type='vdef', variable=preference['name'], field='description')

                if preference['type'] == 'list':
                    for option_index, option in enumerate(preference['options']):
                        self._add_translation_index(option['label'], type='upo', variable=preference['name'], option=option_index)

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
            raise TemplateParseException(_('The format of the vendor is invalid.'))

        if not is_valid_name(self._info['name']):
            raise TemplateParseException(_('The format of the name is invalid.'))

        if not is_valid_version(self._info['version']):
            raise TemplateParseException(_('The format of the version number is invalid. Format: X.X.X where X is an integer. Ex. "0.1", "1.11" NOTE: "1.01" should be changed to "1.0.1" or "1.1"'))

        return dict(self._info)
