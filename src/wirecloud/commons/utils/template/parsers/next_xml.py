# -*- coding: utf-8 -*-

# Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

import codecs
from lxml import etree
import os

from django.utils.translation import ugettext as _
from six import text_type

from wirecloud.commons.utils.template.base import parse_contacts_info, TemplateParseException
from wirecloud.commons.utils.translation import get_trans_index


XMLSCHEMA_FILE = codecs.open(os.path.join(os.path.dirname(__file__), '../schemas/xml_schema.xsd'), 'rb')
XMLSCHEMA_DOC = etree.parse(XMLSCHEMA_FILE)
XMLSCHEMA_FILE.close()
XMLSCHEMA = etree.XMLSchema(XMLSCHEMA_DOC)

WIRECLOUD_TEMPLATE_NS = 'http://wirecloud.conwet.fi.upm.es/ns/macdescription/1'

RESOURCE_DESCRIPTION_XPATH = 't:details'
DISPLAY_NAME_XPATH = 't:title'
DESCRIPTION_XPATH = 't:description'
LONG_DESCRIPTION_XPATH = 't:longdescription'
AUTHORS_XPATH = 't:authors'
CONTRIBUTORS_XPATH = 't:contributors'
IMAGE_URI_XPATH = 't:image'
IPHONE_IMAGE_URI_XPATH = 't:smartphoneimage'
MAIL_XPATH = 't:email'
HOMEPAGE_XPATH = 't:homepage'
DOC_URI_XPATH = 't:doc'
LICENCE_XPATH = 't:license'
LICENCE_URL_XPATH = 't:licenseurl'
CHANGELOG_XPATH = 't:changelog'
REQUIREMENTS_XPATH = 't:requirements'

FEATURE_XPATH = 't:feature'
CODE_XPATH = 't:contents'
ALTCONTENT_XPATH = 't:altcontents'
PREFERENCE_XPATH = 't:preference'
PREFERENCE_VALUE_XPATH = 't:preferencevalue'
PREFERENCES_XPATH = 't:preferences/t:preference'
OPTION_XPATH = 't:option'
PROPERTY_XPATH = 't:persistentvariables/t:variable'
WIRING_XPATH = 't:wiring'
MASHUP_WIRING_XPATH = 't:structure/t:wiring'
INPUT_ENDPOINT_XPATH = 't:inputendpoint'
OUTPUT_ENDPOINT_XPATH = 't:outputendpoint'
SCRIPT_XPATH = 't:scripts/t:script'
PLATFORM_RENDERING_XPATH = 't:rendering'

INCLUDED_RESOURCES_XPATH = 't:structure'
TAB_XPATH = 't:tab'
RESOURCE_XPATH = 't:resource'
POSITION_XPATH = 't:position'
RENDERING_XPATH = 't:rendering'
PARAM_XPATH = 't:preferences/t:preference'
EMBEDDEDRESOURCE_XPATH = 't:embedded/t:resource'
PROPERTIES_XPATH = 't:variablevalue'
CONNECTION_XPATH = 't:connection'
IOPERATOR_XPATH = 't:operator'
SOURCE_XPATH = 't:source'
TARGET_XPATH = 't:target'

TRANSLATIONS_XPATH = 't:translations'
TRANSLATION_XPATH = 't:translation'
MSG_XPATH = 't:msg'


class ApplicationMashupTemplateParser(object):

    _doc = None
    _resource_description = None
    _parsed = False

    def __init__(self, template):

        self._info = {}
        self._translation_indexes = {}

        if isinstance(template, bytes):
            self._doc = etree.fromstring(template)
        elif isinstance(template, text_type):
            # Work around: ValueError: Unicode strings with encoding
            # declaration are not supported.
            self._doc = etree.fromstring(template.encode('utf-8'))
        else:
            self._doc = template

        root_element_qname = etree.QName(self._doc)
        xmlns = root_element_qname.namespace

        if xmlns is not None and xmlns != WIRECLOUD_TEMPLATE_NS:
            raise TemplateParseException("Invalid namespace: " + xmlns)

        if root_element_qname.localname not in ('widget', 'operator', 'mashup'):
            raise TemplateParseException("Invalid root element: " + root_element_qname.localname)

        self._namespace = xmlns
        self._info['type'] = root_element_qname.localname

    def _init(self):

        try:
            XMLSCHEMA.assertValid(self._doc)
        except Exception as e:
            raise TemplateParseException('%s' % e)

        self._resource_description = self._xpath(RESOURCE_DESCRIPTION_XPATH, self._doc)[0]
        self._parse_basic_info()

    def _xpath(self, query, element):
        return element.xpath(query, namespaces={'t': self._namespace})

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
        elif self._info['type'] == 'operator':
            self._parse_operator_info()
        elif self._info['type'] == 'mashup':
            self._parse_workspace_info()

        self._parse_translation_catalogue()
        self._parsed = True
        self._doc = None
        self._resource_description = None

    def _get_field(self, xpath, element, required=True):

        elements = self._xpath(xpath, element)
        if len(elements) == 1 and elements[0].text and len(elements[0].text.strip()) > 0:
            return text_type(elements[0].text)
        elif not required:
            return ''
        else:
            msg = _('missing required field: %(field)s')
            raise TemplateParseException(msg % {'field': xpath})

    def _parse_basic_info(self):

        self._info['vendor'] = self._doc.get('vendor', '').strip()
        self._info['name'] = self._doc.get('name', '').strip()
        self._info['version'] = self._doc.get('version', '').strip()

        self._info['title'] = self._get_field(DISPLAY_NAME_XPATH, self._resource_description, required=False)
        self._add_translation_index(self._info['title'], type='resource', field='title')

        self._info['description'] = self._get_field(DESCRIPTION_XPATH, self._resource_description, required=False)
        self._add_translation_index(self._info['description'], type='resource', field='description')
        self._info['longdescription'] = self._get_field(LONG_DESCRIPTION_XPATH, self._resource_description, required=False)

        self._info['authors'] = parse_contacts_info(self._get_field(AUTHORS_XPATH, self._resource_description, required=False))
        self._info['contributors'] = parse_contacts_info(self._get_field(CONTRIBUTORS_XPATH, self._resource_description, required=False))
        self._info['email'] = self._get_field(MAIL_XPATH, self._resource_description, required=False)
        self._info['image'] = self._get_field(IMAGE_URI_XPATH, self._resource_description, required=False)
        self._info['smartphoneimage'] = self._get_field(IPHONE_IMAGE_URI_XPATH, self._resource_description, required=False)
        self._info['homepage'] = self._get_field(HOMEPAGE_XPATH, self._resource_description, required=False)
        self._info['doc'] = self._get_field(DOC_URI_XPATH, self._resource_description, required=False)
        self._info['license'] = self._get_field(LICENCE_XPATH, self._resource_description, required=False)
        self._info['licenseurl'] = self._get_field(LICENCE_URL_XPATH, self._resource_description, required=False)
        self._info['changelog'] = self._get_field(CHANGELOG_XPATH, self._resource_description, required=False)
        self._parse_requirements()

    def _parse_requirements(self):

        self._info['requirements'] = []
        requirements_elements = self._xpath(REQUIREMENTS_XPATH, self._doc)
        if len(requirements_elements) < 1:
            return

        for requirement in self._xpath(FEATURE_XPATH, requirements_elements[0]):
            self._info['requirements'].append({
                'type': 'feature',
                'name': requirement.get('name').strip()
            })

    def _parse_wiring_info(self, parse_connections=False):

        self._info['wiring'] = {
            'inputs': [],
            'outputs': [],
        }

        wiring_elements = self._xpath(WIRING_XPATH, self._doc)
        if len(wiring_elements) != 0:
            wiring_element = wiring_elements[0]

            for slot in self._xpath(INPUT_ENDPOINT_XPATH, wiring_element):
                self._add_translation_index(slot.get('label'), type='inputendpoint', variable=slot.get('name'))
                self._add_translation_index(slot.get('actionlabel', ''), type='inputendpoint', variable=slot.get('name'))
                self._add_translation_index(slot.get('description', ''), type='inputendpoint', variable=slot.get('name'))
                self._info['wiring']['inputs'].append({
                    'name': slot.get('name'),
                    'type': slot.get('type'),
                    'label': slot.get('label', ''),
                    'description': slot.get('description', ''),
                    'actionlabel': slot.get('actionlabel', ''),
                    'friendcode': slot.get('friendcode', ''),
                })

            for event in self._xpath(OUTPUT_ENDPOINT_XPATH, wiring_element):
                self._add_translation_index(event.get('label'), type='outputendpoint', variable=event.get('name'))
                self._add_translation_index(event.get('description', ''), type='outputendpoint', variable=event.get('name'))
                self._info['wiring']['outputs'].append({
                    'name': event.get('name'),
                    'type': event.get('type'),
                    'label': event.get('label', ''),
                    'description': event.get('description', ''),
                    'friendcode': event.get('friendcode', ''),
                })

        if parse_connections:
            self._info['wiring']['connections'] = []
            self._info['wiring']['operators'] = []
            self._info['wiring']['views'] = []

            mashup_wiring_elements = self._xpath(MASHUP_WIRING_XPATH, self._doc)
            if len(mashup_wiring_elements) == 0:
                return

            self._parse_wiring_connection_info(mashup_wiring_elements[0])
            self._parse_wiring_operator_info(mashup_wiring_elements[0])

    def _parse_wiring_connection_info(self, wiring_element):

        connections = []

        for connection in self._xpath(CONNECTION_XPATH, wiring_element):

            source_element = self._xpath(SOURCE_XPATH, connection)[0]
            target_element = self._xpath(TARGET_XPATH, connection)[0]

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
                'name': '/'.join((operator.get('vendor'), operator.get('name'), operator.get('version'))),
                'preferences': {},
            }

            for pref in self._xpath(PREFERENCE_VALUE_XPATH, operator):
                operator_info['preferences'][pref.get('name')] = {
                    'readonly': pref.get('readonly', 'false').lower() == 'true',
                    'hidden': pref.get('hidden', 'false').lower() == 'true',
                    'value': pref.get('value'),
                }

            self._info['wiring']['operators'][operator_info['id']] = operator_info

    def _parse_widget_info(self):

        self._parse_resource_preferences()
        self._parse_resource_persistentvariables()
        self._parse_wiring_info()

        xhtml_element = self._xpath(CODE_XPATH, self._doc)[0]
        self._info['contents'] = {
            'src': xhtml_element.get('src'),
            'contenttype': xhtml_element.get('contenttype', 'text/html'),
            'charset': xhtml_element.get('charset', 'utf-8'),
            'useplatformstyle': xhtml_element.get('useplatformstyle', 'false').lower() == 'true',
            'cacheable': xhtml_element.get('cacheable', 'true').lower() == 'true'
        }

        self._info['altcontents'] = []
        for altcontents in self._xpath(ALTCONTENT_XPATH, xhtml_element):
            self._info['altcontents'].append({
                'scope': altcontents.get('scope'),
                'src': altcontents.get('src'),
                'contenttype': altcontents.get('contenttype', 'text/html'),
                'charset': altcontents.get('charset', 'utf-8')
            })

        rendering_element = self.get_xpath(PLATFORM_RENDERING_XPATH, self._doc)
        self._info['widget_width'] = rendering_element.get('width')
        self._info['widget_height'] = rendering_element.get('height')

    def _parse_operator_info(self):

        self._parse_resource_preferences()
        self._parse_resource_persistentvariables()
        self._parse_wiring_info()

        self._info['js_files'] = []
        for script in self._xpath(SCRIPT_XPATH, self._doc):
            self._info['js_files'].append(script.get('src'))

    def _parse_resource_preferences(self):

        self._info['preferences'] = []
        for preference in self._xpath(PREFERENCES_XPATH, self._doc):
            self._add_translation_index(preference.get('label'), type='vdef', variable=preference.get('name'), field='label')
            self._add_translation_index(preference.get('description', ''), type='vdef', variable=preference.get('name'), field='description')
            preference_info = {
                'name': preference.get('name'),
                'type': preference.get('type'),
                'label': preference.get('label', ''),
                'description': preference.get('description', ''),
                'readonly': preference.get('readonly', 'false').lower() == 'true',
                'default': preference.get('default', ''),
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

    def _parse_resource_persistentvariables(self):

        self._info['properties'] = []
        for prop in self._xpath(PROPERTY_XPATH, self._doc):
            self._add_translation_index(prop.get('label'), type='vdef', variable=prop.get('name'))
            self._add_translation_index(prop.get('description', ''), type='vdef', variable=prop.get('name'))
            self._info['properties'].append({
                'name': prop.get('name'),
                'type': prop.get('type'),
                'label': prop.get('label', ''),
                'description': prop.get('description', ''),
                'default': prop.get('default', ''),
                'secure': prop.get('secure', 'false').lower() == 'true',
            })

    def _parse_preference_values(self, element):
        values = {}

        for preference in self._xpath(PREFERENCE_VALUE_XPATH, element):
            values[preference.get('name')] = preference.get('value')

        return values

    def _parse_workspace_info(self):

        workspace_structure = self._xpath(INCLUDED_RESOURCES_XPATH, self._doc)[0]

        self._info['preferences'] = self._parse_preference_values(workspace_structure)

        self._info['params'] = []
        for param in self._xpath(PARAM_XPATH, self._doc):
            self._info['params'].append({
                'name': param.get('name'),
                'label': param.get('label'),
                'type': param.get('type'),
            })

        self._info['embedded'] = []
        for resource in self._xpath(EMBEDDEDRESOURCE_XPATH, self._doc):
            self._info['embedded'].append({
                'vendor': resource.get('vendor'),
                'name': resource.get('name'),
                'version': resource.get('version'),
                'src': resource.get('src')
            })

        tabs = []
        for tab in self._xpath(TAB_XPATH, workspace_structure):
            tab_info = {
                'name': tab.get('name'),
                'preferences': self._parse_preference_values(tab),
                'resources': [],
            }

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

                for pref in self._xpath(PREFERENCE_VALUE_XPATH, resource):
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
            raise TemplateParseException(_("ERROR: There isn't a translation element for the default translation language: (%(default_lang)s)") % {'default_lang': self._info['default_lang']})

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
            raise TemplateParseException(_("ERROR: unkown TEXT TYPE ") + typeText)

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

    def get_resource_info(self):
        if not self._parsed:
            self._parse_extra_info()

        return dict(self._info)
