# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

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

import re
import urlparse

from django.utils.translation import ugettext as _
from lxml import etree

from commons.exceptions import TemplateParseException
from commons.translation_utils import get_trans_index


__all__ = ('TemplateParser',)


RESOURCE_DESCRIPTION_XPATH = etree.ETXPath('/Template/Catalog.ResourceDescription')
NAME_XPATH = etree.ETXPath('Name')
VENDOR_XPATH = etree.ETXPath('Vendor')
VERSION_XPATH = etree.ETXPath('Version')
DESCRIPTION_XPATH = etree.ETXPath('Description')
AUTHOR_XPATH = etree.ETXPath('Author')
ORGANIZATION_XPATH = etree.ETXPath('Organization')
IMAGE_URI_XPATH = etree.ETXPath('ImageURI')
IPHONE_IMAGE_URI_XPATH = etree.ETXPath('iPhoneImageURI')
MAIL_XPATH = etree.ETXPath('Mail')
DOC_URI_XPATH = etree.ETXPath('WikiURI')

DISPLAY_NAME_XPATH = etree.ETXPath('DisplayName')
CODE_XPATH = etree.ETXPath('/Template/Platform.Link')
PREFERENCES_XPATH = etree.ETXPath('/Template/Platform.Preferences')
PREFERENCE_XPATH = etree.ETXPath('Preference')
OPTION_XPATH = etree.ETXPath('Option')
PROPERTY_XPATH = etree.ETXPath('/Template/Platform.StateProperties/Property')
WIRING_XPATH = etree.ETXPath('/Template/Platform.Wiring')
SLOT_XPATH = etree.ETXPath('Slot')
EVENT_XPATH = etree.ETXPath('Event')
CONTEXT_XPATH = etree.ETXPath('/Template/Platform.Context')
PLATFORM_RENDERING_XPATH = etree.ETXPath('/Template/Platform.Rendering')
MENUCOLOR_XPATH = etree.ETXPath('/Template/MenuColor')

INCLUDED_RESOURCES_XPATH = etree.ETXPath('IncludedResources')
TAB_XPATH = etree.ETXPath('Tab')
RESOURCE_XPATH = etree.ETXPath('Resource')
POSITION_XPATH = etree.ETXPath('Position')
RENDERING_XPATH = etree.ETXPath('Rendering')
PARAM_XPATH = etree.ETXPath('Param')
PROPERTIES_XPATH = etree.ETXPath('Property')
CHANNEL_XPATH = etree.ETXPath('Channel')
IN_XPATH = etree.ETXPath('In')
OUT_XPATH = etree.ETXPath('Out')

TRANSLATIONS_XPATH = etree.ETXPath('/Template/Translations')
TRANSLATION_XPATH = etree.ETXPath('Translation')
MSG_XPATH = etree.ETXPath('msg')


class TemplateParser(object):

    _doc = None
    _resource_description = None
    _parsed = False
    _info = {}
    _translation_indexes = {}

    def __init__(self, template, base=None):

        self.base = base

        if isinstance(template, str):
            self._doc = etree.fromstring(template)
        elif isinstance(template, unicode):
            # Work around: ValueError: Unicode strings with encoding
            # declaration are not supported.
            self._doc = etree.fromstring(template.encode('utf-8'))
        else:
            self._doc = template

        self._resource_description = RESOURCE_DESCRIPTION_XPATH(self._doc)[0]
        self._parse_basic_info()

        included_resources_elements = INCLUDED_RESOURCES_XPATH(self._resource_description)
        if len(included_resources_elements) == 1:
            self._info['type'] = 'mashup'
        else:
            self._info['type'] = 'gadget'

    def _add_translation_index(self, value, **kwargs):
        index = get_trans_index(value)
        if not index:
            return

        if index not in self._translation_indexes:
            self._translation_indexes[index] = []

        self._translation_indexes[index].append(kwargs)

    def _parse_extra_info(self):
        if self._info['type'] == 'gadget':
            self._parse_gadget_info()
        elif self._info['type'] == 'mashup':
            self._parse_workspace_info()

        self._parse_translation_catalogue()
        self._doc = None
        self._resource_description = None

    def _get_field(self, xpath, element, required=True):

        elements = xpath(element)
        if len(elements) == 1 and elements[0].text and len(elements[0].text.strip()) > 0:
            return elements[0].text
        elif not required:
            return ''
        else:
            raise TemplateParseException()

    def _get_url_field(self, *args, **kwargs):

        value = self._get_field(*args, **kwargs)
        if value.strip() != '':
            return urlparse.urljoin(self.base, value)
        else:
            return ''

    def _parse_basic_info(self):

        self._info['name'] = self._get_field(NAME_XPATH, self._resource_description)
        self._info['vendor'] = self._get_field(VENDOR_XPATH, self._resource_description)
        self._info['version'] = self._get_field(VERSION_XPATH, self._resource_description)
        if not re.match('^(?:[1-9]\d*\.|0\.)*(?:[1-9]\d*|0)$', self._info['version']):
            raise TemplateParseException(_('ERROR: the format of the version number is invalid. Format: X.X.X where X is an integer. Ex. "0.1", "1.11" NOTE: "1.01" should be changed to "1.0.1" or "1.1"'))

        self._info['description'] = self._get_field(DESCRIPTION_XPATH, self._resource_description)
        self._add_translation_index(self._info['description'], type='gadget', field='description')

        self._info['author'] = self._get_field(AUTHOR_XPATH, self._resource_description)
        self._info['mail'] = self._get_field(MAIL_XPATH, self._resource_description)
        self._info['organization'] = self._get_field(ORGANIZATION_XPATH, self._resource_description, required=False)
        self._info['image_uri'] = self._get_url_field(IMAGE_URI_XPATH, self._resource_description)
        self._info['doc_uri'] = self._get_url_field(DOC_URI_XPATH, self._resource_description)

    def _parse_gadget_info(self):

        self._info['display_name'] = self._get_field(DISPLAY_NAME_XPATH, self._resource_description, required=False)
        self._add_translation_index(self._info['display_name'], type='gadget', field='display_name')
        self._info['iphone_image_uri'] = self._get_url_field(IPHONE_IMAGE_URI_XPATH, self._resource_description, required=False)

        preferences = PREFERENCES_XPATH(self._doc)[0]
        self._info['preferences'] = []
        for preference in PREFERENCE_XPATH(preferences):
            self._add_translation_index(preference.get('label'), type='vdef', variable=preference.get('name'))
            self._add_translation_index(preference.get('description', ''), type='vdef', variable=preference.get('name'))
            preference_info = {
                'name': preference.get('name'),
                'type': preference.get('type'),
                'label': preference.get('label'),
                'description': preference.get('description', ''),
                'default_value': preference.get('default', ''),
                'secure': preference.get('secure', 'false').lower() == 'true',
            }

            if preference_info['type'] == 'list':
                preference_info['options'] = []
                for option in OPTION_XPATH(preference):
                    option_label = option.get('label', option.get('name')) 
                    self._add_translation_index(option_label, type='upo', variable=preference.get('name'), option=option_label)
                    preference_info['options'].append({
                        'label': option_label,
                        'value': option.get('value'),
                    })

            self._info['preferences'].append(preference_info)

        self._info['properties'] = []
        for prop in PROPERTY_XPATH(self._doc):
            self._add_translation_index(prop.get('label'), type='vdef', variable=prop.get('name'))
            self._add_translation_index(prop.get('description', ''), type='vdef', variable=prop.get('name'))
            self._info['properties'].append({
                'name': prop.get('name'),
                'type': prop.get('type'),
                'label': prop.get('label'),
                'description': prop.get('description', ''),
                'default_value': prop.get('default', ''),
                'secure': prop.get('secure', 'false').lower() == 'true',
            })

        wiring_element = WIRING_XPATH(self._doc)[0]

        self._info['slots'] = []
        for slot in SLOT_XPATH(wiring_element):
            self._add_translation_index(slot.get('label'), type='vdef', variable=slot.get('name'))
            self._add_translation_index(slot.get('action_label', ''), type='vdef', variable=slot.get('name'))
            self._add_translation_index(slot.get('description', ''), type='vdef', variable=slot.get('name'))
            self._info['slots'].append({
                'name': slot.get('name'),
                'type': slot.get('type'),
                'label': slot.get('label'),
                'description': slot.get('description', ''),
                'action_label': slot.get('action_label', ''),
                'friendcode': slot.get('friendcode'),
            })

        self._info['events'] = []
        for event in EVENT_XPATH(wiring_element):
            self._add_translation_index(event.get('label'), type='vdef', variable=event.get('name'))
            self._add_translation_index(event.get('description', ''), type='vdef', variable=event.get('name'))
            self._info['events'].append({
                'name': event.get('name'),
                'type': event.get('type'),
                'label': event.get('label'),
                'description': event.get('description', ''),
                'friendcode': event.get('friendcode'),
            })

        xhtml_element = CODE_XPATH(self._doc)[0]
        self._info['code_url'] = urlparse.urljoin(self.base, xhtml_element.get('href'))
        self._info['code_content_type'] = xhtml_element.get('content-type', 'text/html')
        self._info['code_cacheable'] = xhtml_element.get('cacheable', 'true').lower() == 'true'

        rendering_element = PLATFORM_RENDERING_XPATH(self._doc)[0]
        self._info['gadget_width'] = rendering_element.get('width')
        self._info['gadget_height'] = rendering_element.get('height')

        self._info['gadget_menucolor'] = self._get_field(MENUCOLOR_XPATH, self._doc, required=False)

    def _parse_workspace_info(self):

        workspace_structure = INCLUDED_RESOURCES_XPATH(self._resource_description)[0]
        self._info['readonly'] = workspace_structure.get('readonly', 'false').lower() == 'true'

        preferences = {}
        for preference in PREFERENCE_XPATH(workspace_structure):
            preferences[preference.get('name')] = preference.get('value')
        self._info['preferences'] = preferences

        params = {}
        for param in PARAM_XPATH(workspace_structure):
            params[param.get('name')] = {
               'label': param.get('label'),
               'type': param.get('type'),
            }
        self._info['params'] = params

        tabs = {}
        for tab in TAB_XPATH(workspace_structure):
            tab_info = {
                'name': tab.get('name'),
                'preferences': {},
                'resources': [],
            }

            for preference in PREFERENCE_XPATH(tab):
                tab_info['preferences'][preference.get('name')] = preference.get('value')

            for resource in RESOURCE_XPATH(tab):
                position = POSITION_XPATH(resource)[0]
                rendering = RENDERING_XPATH(resource)[0]

                resource_info = {
                    'id': resource.get('id'),
                    'name': resource.get('name'),
                    'vendor': resource.get('vendor'),
                    'version': resource.get('version'),
                    'title': resource.get('title'),
                    'position': {
                        'x': position.get('x'),
                        'y': position.get('y'),
                        'z': position.get('z'),
                    },
                    'rendering': {
                        'width': rendering.get('width'),
                        'height': rendering.get('height'),
                        'layout': rendering.get('layout'),
                    },
                }

                for prop in PROPERTIES_XPATH(resource):
                    resource_info['properties'][prop.get('name')] = {
                        'readonly': prop.get('readonly', 'false').lower() == 'true',
                        'value': prop.get('value'),
                    }

                for pref in PREFERENCE_XPATH(resource):
                    resource_info['preferences'][pref.get('name')] = {
                        'readonly': pref.get('readonly', 'false').lower() == 'true',
                        'hidden': pref.get('hidden', 'false').lower() == 'true',
                        'value': pref.get('value'),
                    }

                tab_info['resources'].append(resource_info)

            tabs[tab.get('id')] = tab_info

        self._info['tabs'] = tabs

        wiring_element = WIRING_XPATH(self._doc)[0]
        channels = {}
        for channel in CHANNEL_XPATH(wiring_element):
            channel_info = {
                'id': int(channel.get('id')),
                'name': channel.get('name'),
                'readonly': channel.get('readonly', 'false').lower() == 'true',
                'filter': channel.get('filter'),
                'filter_params': channel.get('filter_params'),
                'ins': [],
                'outs': [],
                'out_channels': [],
            }

            for in_ in IN_XPATH(channel):
                channel_info['ins'].append({
                    'igadget': in_.get('igadget'),
                    'name': in_.get('name'),
                })

            for out in OUT_XPATH(channel):
                channel_info['outs'].append({
                    'igadget': out.get('igadget'),
                    'name': out.get('name'),
                })

            for out_channel in CHANNEL_XPATH(channel):
                channel_info['out_channels'].append(out_channel.get('id'))

            channels[channel.get('id')] = channel_info

        self._info['channels'] = channels

    def _parse_translation_catalogue(self):
        self._info['translations'] = {}

        translations_elements = TRANSLATIONS_XPATH(self._doc)

        if len(translations_elements) == 0:
            return

        translations = translations_elements[0]
        self._info['default_lang'] = translations.get('default')

        for translation in TRANSLATION_XPATH(translations):
            current_catalogue = {}

            for msg in MSG_XPATH(translation):
                current_catalogue[msg.get('name')] = msg.text

            self._info['translations'][translation.get('lang')] = current_catalogue

        if self._info['default_lang'] not in self._info['translations']:
            raise TemplateParseException(_("ERROR: There isn't a Translation element with the default language (%(default_lang)s) translations") % {'default_lang': self._info['default_lang']})
        self._info['translation_index_usage'] = self._translation_indexes

    def typeText2typeCode(self, typeText):
        mapping = {
            'text': 'S',
            'number': 'N',
            'date': 'D',
            'boolean': 'B',
            'list': 'L',
            'password': 'P',
        }
        if typeText in mapping:
            return mapping[typeText]
        else:
            raise TemplateParseException(_(u"ERROR: unkown TEXT TYPE ") + typeText)

    def get_resource_type(self):
        return self._info['type']

    def get_resource_name(self):
        return self._info['name']

    def get_resource_vendor(self):
        return self._info['vendor']

    def get_resource_version(self):
        return self._info['version']

    def get_resource_info(self):
        if not self._parsed:
            self._parse_extra_info()

        return self._info
