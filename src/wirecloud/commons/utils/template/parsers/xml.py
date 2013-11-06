# -*- coding: utf-8 -*-

# Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

from lxml import etree

from django.utils.translation import ugettext as _

from wirecloud.commons.utils.template.base import is_valid_name, is_valid_vendor, is_valid_version, TemplateParseException
from wirecloud.commons.utils.translation import get_trans_index


WIRECLOUD_TEMPLATE_NS = 'http://wirecloud.conwet.fi.upm.es/ns/template#'

RESOURCE_DESCRIPTION_XPATH = '/t:Template/t:Catalog.ResourceDescription'
NAME_XPATH = 't:Name'
VENDOR_XPATH = 't:Vendor'
VERSION_XPATH = 't:Version'
DISPLAY_NAME_XPATH = 't:DisplayName'
DESCRIPTION_XPATH = 't:Description'
AUTHOR_XPATH = 't:Author'
ORGANIZATION_XPATH = 't:Organization'
IMAGE_URI_XPATH = 't:ImageURI'
IPHONE_IMAGE_URI_XPATH = 't:iPhoneImageURI'
MAIL_XPATH = 't:Mail'
DOC_URI_XPATH = 't:WikiURI'
REQUIREMENTS_XPATH = 't:Requirements'

FEATURE_XPATH = 't:Feature'
CODE_XPATH = '/t:Template/t:Platform.Link[1]/t:XHTML'
PREFERENCE_XPATH = 't:Preference'
PREFERENCES_XPATH = '/t:Template/t:Platform.Preferences[1]/t:Preference'
OPTION_XPATH = 't:Option'
PROPERTY_XPATH = '/t:Template/t:Platform.StateProperties[1]/t:Property'
WIRING_XPATH = '/t:Template/t:Platform.Wiring'
INPUT_ENDPOINT_XPATH = 't:InputEndpoint'
OUTPUT_ENDPOINT_XPATH = 't:OutputEndpoint'
PLATFORM_RENDERING_XPATH = '/t:Template/t:Platform.Rendering'

INCLUDED_RESOURCES_XPATH = 't:IncludedResources'
TAB_XPATH = 't:Tab'
RESOURCE_XPATH = 't:Resource'
POSITION_XPATH = 't:Position'
RENDERING_XPATH = 't:Rendering'
PARAM_XPATH = 't:Param'
PROPERTIES_XPATH = 't:Property'
CONNECTION_XPATH = 't:Connection'
IOPERATOR_XPATH = 't:Operator'
SOURCE_XPATH = 't:Source'
TARGET_XPATH = 't:Target'

TRANSLATIONS_XPATH = '/t:Template/t:Translations'
TRANSLATION_XPATH = 't:Translation'
MSG_XPATH = 't:msg'


class WirecloudTemplateParser(object):

    _doc = None
    _resource_description = None
    _parsed = False

    def __init__(self, template):

        self._info = {}
        self._translation_indexes = {}

        if isinstance(template, str):
            self._doc = etree.fromstring(template)
        elif isinstance(template, unicode):
            # Work around: ValueError: Unicode strings with encoding
            # declaration are not supported.
            self._doc = etree.fromstring(template.encode('utf-8'))
        else:
            self._doc = template

        prefix = self._doc.prefix
        xmlns = None
        if prefix in self._doc.nsmap:
            xmlns = self._doc.nsmap[prefix]

        if xmlns is not None and xmlns != WIRECLOUD_TEMPLATE_NS:
            raise TemplateParseException("Invalid namespace: " + xmlns)

        self._namespace = xmlns

    def _init(self):

        self._resource_description = self._xpath(RESOURCE_DESCRIPTION_XPATH, self._doc)[0]
        self._parse_basic_info()

        included_resources_elements = self._xpath(INCLUDED_RESOURCES_XPATH, self._resource_description)
        if len(included_resources_elements) == 1:
            self._info['type'] = 'mashup'
        else:
            self._info['type'] = 'widget'

    def _xpath(self, query, element):
        if self._namespace is not None:
            return element.xpath(query, namespaces={'t': self._namespace})
        else:
            query = query.replace('t:', '')
            return element.xpath(query)

    def get_xpath(self, query, element):
        elements = self._xpath(query, element)

        if len(elements) == 0:
            raise TemplateParseException('Missing %s element' % query.replace('t:', ''))
        else:
            return elements[0]

    def _add_translation_index(self, value, **kwargs):
        index = get_trans_index(value)
        if not index:
            return

        if index not in self._translation_indexes:
            self._translation_indexes[index] = []

        self._translation_indexes[index].append(kwargs)

    def _parse_extra_info(self):
        if self._info['type'] == 'widget':
            self._parse_widget_info()
        elif self._info['type'] == 'mashup':
            self._parse_workspace_info()

        self._parse_translation_catalogue()
        self._parsed = True
        self._doc = None
        self._resource_description = None

    def _get_field(self, xpath, element, required=True):

        elements = self._xpath(xpath, element)
        if len(elements) == 1 and elements[0].text and len(elements[0].text.strip()) > 0:
            return elements[0].text
        elif not required:
            return ''
        else:
            msg = _('missing required field: %(field)s')
            raise TemplateParseException(msg % {'field': xpath})

    def _parse_basic_info(self):

        self._info['vendor'] = self._get_field(VENDOR_XPATH, self._resource_description).strip()
        if not is_valid_vendor(self._info['vendor']):
            raise TemplateParseException(_('ERROR: the format of the vendor is invalid.'))

        self._info['name'] = self._get_field(NAME_XPATH, self._resource_description).strip()
        if not is_valid_name(self._info['name']):
            raise TemplateParseException(_('ERROR: the format of the name is invalid.'))

        self._info['version'] = self._get_field(VERSION_XPATH, self._resource_description).strip()
        if not is_valid_version(self._info['version']):
            raise TemplateParseException(_('ERROR: the format of the version number is invalid. Format: X.X.X where X is an integer. Ex. "0.1", "1.11" NOTE: "1.01" should be changed to "1.0.1" or "1.1"'))

        self._info['display_name'] = self._get_field(DISPLAY_NAME_XPATH, self._resource_description, required=False)
        self._add_translation_index(self._info['display_name'], type='resource', field='display_name')

        if not self._info['display_name']:
            self._info['display_name'] = self._info['name']

        self._info['description'] = self._get_field(DESCRIPTION_XPATH, self._resource_description, required=False)
        self._add_translation_index(self._info['description'], type='resource', field='description')

        self._info['author'] = self._get_field(AUTHOR_XPATH, self._resource_description, required=False)
        self._info['email'] = self._get_field(MAIL_XPATH, self._resource_description)
        self._info['image_uri'] = self._get_field(IMAGE_URI_XPATH, self._resource_description, required=False)
        self._info['iphone_image_uri'] = self._get_field(IPHONE_IMAGE_URI_XPATH, self._resource_description, required=False)
        self._info['doc_uri'] = self._get_field(DOC_URI_XPATH, self._resource_description, required=False)
        self._parse_requirements()

    def _parse_requirements(self):

        self._info['requirements'] = []
        requirements_elements = self._xpath(REQUIREMENTS_XPATH, self._resource_description)
        if len(requirements_elements) < 1:
            return

        for requirement in self._xpath(FEATURE_XPATH, requirements_elements[0]):
            if requirement.get('name', '').strip() == '':
                raise TemplateParseException('Missing required feature name')

            self._info['requirements'].append({
                'type': 'feature',
                'name': requirement.get('name')
            })

    def _parse_wiring_info(self, parse_connections=False):

        self._info['wiring'] = {
            'inputs': [],
            'outputs': [],
        }

        wiring_elements = self._xpath(WIRING_XPATH, self._doc)
        if len(wiring_elements) < 1:
            return
        wiring_element = wiring_elements[0]

        for slot in self._xpath(INPUT_ENDPOINT_XPATH, wiring_element):
            self._add_translation_index(slot.get('label'), type='vdef', variable=slot.get('name'))
            self._add_translation_index(slot.get('actionlabel', ''), type='vdef', variable=slot.get('name'))
            self._add_translation_index(slot.get('description', ''), type='vdef', variable=slot.get('name'))
            self._info['wiring']['inputs'].append({
                'name': slot.get('name'),
                'type': slot.get('type'),
                'label': slot.get('label'),
                'description': slot.get('description', ''),
                'actionlabel': slot.get('actionlabel', slot.get('action_label', '')),
                'friendcode': slot.get('friendcode'),
            })

        for event in self._xpath(OUTPUT_ENDPOINT_XPATH, wiring_element):
            self._add_translation_index(event.get('label'), type='vdef', variable=event.get('name'))
            self._add_translation_index(event.get('description', ''), type='vdef', variable=event.get('name'))
            self._info['wiring']['outputs'].append({
                'name': event.get('name'),
                'type': event.get('type'),
                'label': event.get('label'),
                'description': event.get('description', ''),
                'friendcode': event.get('friendcode'),
            })

        if parse_connections:
            self._parse_wiring_connection_info(wiring_element)
            self._parse_wiring_operator_info(wiring_element)
            self._info['wiring']['views'] = []

    def _parse_wiring_connection_info(self, wiring_element):

        connections = []

        for connection in self._xpath(CONNECTION_XPATH, wiring_element):

            if len(self._xpath(SOURCE_XPATH, connection)) > 0:
                source_element = self._xpath(SOURCE_XPATH, connection)[0]
            else:
                raise TemplateParseException(_('Missing required field: source'))

            if len(self._xpath(SOURCE_XPATH, connection)) > 0:
                target_element = self._xpath(TARGET_XPATH, connection)[0]
            else:
                raise TemplateParseException(_('Missing required field: target'))

            connection_info = {
                'readonly': connection.get('readonly', 'false').lower() == 'true',
                'source': {
                    'type': source_element.get('type'),
                    'endpoint': source_element.get('endpoint'),
                    'id': source_element.get('id'),
                },
                'target': {
                    'type': target_element.get('type'),
                    'endpoint': target_element.get('endpoint'),
                    'id': target_element.get('id'),
                }
            }

            connections.append(connection_info)

        self._info['wiring']['connections'] = connections

    def _parse_wiring_operator_info(self, wiring_element):

        self._info['wiring']['operators'] = {}

        for operator in self._xpath(IOPERATOR_XPATH, wiring_element):
            operator_info = {
                'id': operator.get('id'),
                'name': operator.get('name'),
                'preferences': {},
            }

            for pref in self._xpath(PREFERENCE_XPATH, operator):
                operator_info['preferences'][pref.get('name')] = {
                    'readonly': pref.get('readonly', 'false').lower() == 'true',
                    'hidden': pref.get('hidden', 'false').lower() == 'true',
                    'value': pref.get('value'),
                }

            self._info['wiring']['operators'][operator_info['id']] = operator_info

    def _parse_widget_info(self):

        self._info['preferences'] = []
        for preference in self._xpath(PREFERENCES_XPATH, self._doc):
            self._add_translation_index(preference.get('label'), type='vdef', variable=preference.get('name'), field='label')
            self._add_translation_index(preference.get('description', ''), type='vdef', variable=preference.get('name'), field='description')
            preference_info = {
                'name': preference.get('name'),
                'type': preference.get('type'),
                'label': preference.get('label'),
                'description': preference.get('description', ''),
                'readonly': preference.get('readonly', 'false').lower() == 'true',
                'default_value': preference.get('default', ''),
                'value': preference.get('value'),
                'secure': preference.get('secure', 'false').lower() == 'true',
            }

            if preference_info['type'] == 'list':
                preference_info['options'] = []
                for option_index, option in enumerate(self._xpath(OPTION_XPATH, preference)):
                    option_label = option.get('label', option.get('name'))
                    self._add_translation_index(option_label, type='upo', variable=preference.get('name'), option=option_index)
                    preference_info['options'].append({
                        'label': option_label,
                        'value': option.get('value'),
                    })

            self._info['preferences'].append(preference_info)

        self._info['properties'] = []
        for prop in self._xpath(PROPERTY_XPATH, self._doc):
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

        self._parse_wiring_info()

        xhtml_elements = self._xpath(CODE_XPATH, self._doc)
        if len(xhtml_elements) == 1 and xhtml_elements[0].get('href', '') != '':
            xhtml_element = xhtml_elements[0]
            self._info['code_url'] = xhtml_element.get('href')
        else:
            msg = _('missing required attribute in Platform.Link: href')
            raise TemplateParseException(msg)

        self._info['code_content_type'] = xhtml_element.get('content-type', 'text/html')
        self._info['code_charset'] = xhtml_element.get('charset', 'utf-8')
        self._info['code_uses_platform_style'] = xhtml_element.get('use-platform-style', 'false').lower() == 'true'
        self._info['code_cacheable'] = xhtml_element.get('cacheable', 'true').lower() == 'true'

        rendering_element = self.get_xpath(PLATFORM_RENDERING_XPATH, self._doc)
        self._info['widget_width'] = rendering_element.get('width')
        self._info['widget_height'] = rendering_element.get('height')

    def _parse_workspace_info(self):

        workspace_structure = self._xpath(INCLUDED_RESOURCES_XPATH, self._resource_description)[0]

        preferences = {}
        for preference in self._xpath(PREFERENCE_XPATH, workspace_structure):
            preferences[preference.get('name')] = preference.get('value')
        self._info['preferences'] = preferences

        self._info['params'] = []
        for param in self._xpath(PARAM_XPATH, workspace_structure):
            self._info['params'].append({
                'name': param.get('name'),
                'label': param.get('label'),
                'type': param.get('type'),
            })

        tabs = []
        for tab in self._xpath(TAB_XPATH, workspace_structure):
            tab_info = {
                'name': tab.get('name'),
                'preferences': {},
                'resources': [],
            }

            for preference in self._xpath(PREFERENCE_XPATH, tab):
                tab_info['preferences'][preference.get('name')] = preference.get('value')

            for resource in self._xpath(RESOURCE_XPATH, tab):
                position = self.get_xpath(POSITION_XPATH, resource)
                rendering = self.get_xpath(RENDERING_XPATH, resource)

                resource_info = {
                    'id': resource.get('id'),
                    'name': resource.get('name'),
                    'vendor': resource.get('vendor'),
                    'version': resource.get('version'),
                    'title': resource.get('title'),
                    'readonly': resource.get('readonly', '').lower() == 'true',
                    'properties': {},
                    'preferences': {},
                    'position': {
                        'x': position.get('x'),
                        'y': position.get('y'),
                        'z': position.get('z'),
                    },
                    'rendering': {
                        'fulldragboard': rendering.get('fulldragboard', 'false').lower() == 'true',
                        'minimized': rendering.get('minimized', 'false').lower() == 'true',
                        'width': rendering.get('width'),
                        'height': rendering.get('height'),
                        'layout': rendering.get('layout'),
                    },
                }

                for prop in self._xpath(PROPERTIES_XPATH, resource):
                    resource_info['properties'][prop.get('name')] = {
                        'readonly': prop.get('readonly', 'false').lower() == 'true',
                        'value': prop.get('value'),
                    }

                for pref in self._xpath(PREFERENCE_XPATH, resource):
                    resource_info['preferences'][pref.get('name')] = {
                        'readonly': pref.get('readonly', 'false').lower() == 'true',
                        'hidden': pref.get('hidden', 'false').lower() == 'true',
                        'value': pref.get('value'),
                    }

                tab_info['resources'].append(resource_info)

            tabs.append(tab_info)

        self._info['tabs'] = tabs
        self._parse_wiring_info(parse_connections=True)

    def _parse_translation_catalogue(self):

        self._info['translations'] = {}
        self._info['default_lang'] = 'en'
        self._info['translation_index_usage'] = {}

        translations_elements = self._xpath(TRANSLATIONS_XPATH, self._doc)

        if len(translations_elements) == 0:
            return

        missing_translations = []
        extra_translations = set()

        translations = translations_elements[0]
        self._info['default_lang'] = translations.get('default')

        for translation in self._xpath(TRANSLATION_XPATH, translations):
            current_catalogue = {}

            for msg in self._xpath(MSG_XPATH, translation):
                if msg.get('name') not in self._translation_indexes:
                    extra_translations.add(msg.get('name'))

                current_catalogue[msg.get('name')] = msg.text

            self._info['translations'][translation.get('lang')] = current_catalogue

        if self._info['default_lang'] not in self._info['translations']:
            raise TemplateParseException(_("ERROR: There isn't a Translation element with the default language (%(default_lang)s) translations") % {'default_lang': self._info['default_lang']})

        for index in self._translation_indexes:
            if index not in self._info['translations'][self._info['default_lang']]:
                missing_translations.append(index)

        if len(missing_translations) > 0:
            msg = _("ERROR: the following translation indexes need a default value: %(indexes)s.")
            raise TemplateParseException(msg % {'indexes': ', '.join(missing_translations)})

        if len(extra_translations) > 0:
            msg = _("ERROR: the following translation indexes are not used: %(indexes)s.")
            raise TemplateParseException(msg % {'indexes': ', '.join(extra_translations)})

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

    def get_contents(self):
        return etree.tostring(self._doc, method='xml', xml_declaration=True, encoding="UTF-8", pretty_print=True)

    def get_resource_type(self):
        return self._info['type']

    def get_resource_name(self):
        return self._info['name']

    def get_resource_vendor(self):
        return self._info['vendor']

    def get_resource_version(self):
        return self._info['version']

    def get_resource_basic_info(self):
        return self._info

    def get_resource_info(self):
        if not self._parsed:
            self._parse_extra_info()

        return dict(self._info)
