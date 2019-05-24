# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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

import codecs
from lxml import etree
import os

from django.utils.translation import ugettext as _

from wirecloud.commons.utils.template.base import ObsoleteFormatError, parse_contacts_info, TemplateParseException
from wirecloud.commons.utils.translation import get_trans_index
from wirecloud.platform.wiring.utils import get_behaviour_skeleton, get_wiring_skeleton, parse_wiring_old_version


XMLSCHEMA_FILE = codecs.open(os.path.join(os.path.dirname(__file__), '../schemas/xml_schema.xsd'), 'rb')
XMLSCHEMA_DOC = etree.parse(XMLSCHEMA_FILE)
XMLSCHEMA_FILE.close()
XMLSCHEMA = etree.XMLSchema(XMLSCHEMA_DOC)

WIRECLOUD_TEMPLATE_NS = 'http://wirecloud.conwet.fi.upm.es/ns/macdescription/1'
OLD_TEMPLATE_NAMESPACES = ('http://wirecloud.conwet.fi.upm.es/ns/template#', 'http://morfeo-project.org/2007/Template')

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
ISSUETRACKER_XPATH = 't:issuetracker'

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

VISUALDESCRIPTION_XPATH = 't:visualdescription'
BEHAVIOUR_XPATH = 't:behaviour'

COMPONENT_XPATH = 't:component'
COMPONENTSOURCES_XPATH = 't:sources/t:endpoint'
COMPONENTTARGETS_XPATH = 't:targets/t:endpoint'
SOURCEHANDLE_XPATH = 't:sourcehandle'
TARGETHANDLE_XPATH = 't:targethandle'

TRANSLATIONS_XPATH = 't:translations'
TRANSLATION_XPATH = 't:translation'
MSG_XPATH = 't:msg'


class ApplicationMashupTemplateParser(object):

    _doc = None
    _component_description = None
    _parsed = False

    def __init__(self, template):
        self._info = {}
        self._translation_indexes = {}

        if isinstance(template, bytes):
            self._doc = etree.fromstring(template)
        elif isinstance(template, str):
            # Work around: ValueError: Unicode strings with encoding
            # declaration are not supported.
            self._doc = etree.fromstring(template.encode('utf-8'))
        else:
            self._doc = template

        root_element_qname = etree.QName(self._doc)
        xmlns = root_element_qname.namespace

        if xmlns is None:
            raise ValueError("Missing document namespace")
        elif xmlns in OLD_TEMPLATE_NAMESPACES:
            raise ObsoleteFormatError()
        elif xmlns != WIRECLOUD_TEMPLATE_NS:
            raise ValueError("Invalid namespace: " + xmlns)

        if root_element_qname.localname not in ('widget', 'operator', 'mashup'):
            raise TemplateParseException("Invalid root element (%s)" % root_element_qname.localname)

        self._info['type'] = root_element_qname.localname

    def _init(self):

        try:
            XMLSCHEMA.assertValid(self._doc)
        except Exception as e:
            raise TemplateParseException('%s' % e)

        self._component_description = self._xpath(RESOURCE_DESCRIPTION_XPATH, self._doc)[0]
        self._parse_basic_info()

    def _xpath(self, query, element):
        return element.xpath(query, namespaces={'t': WIRECLOUD_TEMPLATE_NS})

    def get_xpath(self, query, element, required=True):
        elements = self._xpath(query, element)

        if len(elements) == 0 and required:
            raise TemplateParseException('Missing %s element' % query.replace('t:', ''))
        elif len(elements) > 0:
            return elements[0]
        else:
            return None

    def _add_translation_index(self, value, **kwargs):
        index = get_trans_index(str(value))
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
        self._component_description = None

    def _get_field(self, xpath, element, required=True):

        elements = self._xpath(xpath, element)
        if len(elements) == 1 and elements[0].text and len(elements[0].text.strip()) > 0:
            return str(elements[0].text)
        elif not required:
            return ''
        else:
            msg = _('missing required field: %(field)s')
            raise TemplateParseException(msg % {'field': xpath})

    def _parse_basic_info(self):
        self._info['vendor'] = str(self._doc.get('vendor', '').strip())
        self._info['name'] = str(self._doc.get('name', '').strip())
        self._info['version'] = str(self._doc.get('version', '').strip())

        self._info['title'] = self._get_field(DISPLAY_NAME_XPATH, self._component_description, required=False)
        self._add_translation_index(self._info['title'], type='resource', field='title')

        self._info['description'] = self._get_field(DESCRIPTION_XPATH, self._component_description, required=False)
        self._add_translation_index(self._info['description'], type='resource', field='description')
        self._info['longdescription'] = self._get_field(LONG_DESCRIPTION_XPATH, self._component_description, required=False)

        self._info['authors'] = parse_contacts_info(self._get_field(AUTHORS_XPATH, self._component_description, required=False))
        self._info['contributors'] = parse_contacts_info(self._get_field(CONTRIBUTORS_XPATH, self._component_description, required=False))
        self._info['email'] = self._get_field(MAIL_XPATH, self._component_description, required=False)
        self._info['image'] = self._get_field(IMAGE_URI_XPATH, self._component_description, required=False)
        self._info['smartphoneimage'] = self._get_field(IPHONE_IMAGE_URI_XPATH, self._component_description, required=False)
        self._info['homepage'] = self._get_field(HOMEPAGE_XPATH, self._component_description, required=False)
        self._info['doc'] = self._get_field(DOC_URI_XPATH, self._component_description, required=False)
        self._info['license'] = self._get_field(LICENCE_XPATH, self._component_description, required=False)
        self._info['licenseurl'] = self._get_field(LICENCE_URL_XPATH, self._component_description, required=False)
        self._info['issuetracker'] = self._get_field(ISSUETRACKER_XPATH, self._component_description, required=False)
        self._info['changelog'] = self._get_field(CHANGELOG_XPATH, self._component_description, required=False)
        self._parse_requirements()

    def _parse_requirements(self):

        self._info['requirements'] = []
        requirements_elements = self._xpath(REQUIREMENTS_XPATH, self._doc)
        if len(requirements_elements) < 1:
            return

        for requirement in self._xpath(FEATURE_XPATH, requirements_elements[0]):
            self._info['requirements'].append({
                'type': u'feature',
                'name': str(requirement.get('name').strip())
            })

    def _parse_visualdescription_info(self, visualdescription_element):

        self._parse_wiring_component_view_info(self._info['wiring']['visualdescription'], visualdescription_element)
        self._parse_wiring_connection_view_info(self._info['wiring']['visualdescription'], visualdescription_element)
        self._parse_wiring_behaviour_view_info(self._info['wiring']['visualdescription'], visualdescription_element)

    def _parse_wiring_behaviour_view_info(self, target, behaviours_element):

        for behaviour in self._xpath(BEHAVIOUR_XPATH, behaviours_element):

            behaviour_info = get_behaviour_skeleton()
            behaviour_info['title'] = str(behaviour.get('title'))
            behaviour_info['description'] = str(behaviour.get('description'))

            self._parse_wiring_component_view_info(behaviour_info, behaviour)
            self._parse_wiring_connection_view_info(behaviour_info, behaviour)

            target['behaviours'].append(behaviour_info)

    def _parse_wiring_component_view_info(self, target, components_element):

        for component in self._xpath(COMPONENT_XPATH, components_element):
            component_info = {
                'collapsed': component.get('collapsed', 'false').strip().lower() == 'true',
                'endpoints': {
                    'source': [endpoint.text for endpoint in self._xpath(COMPONENTSOURCES_XPATH, component)],
                    'target': [endpoint.text for endpoint in self._xpath(COMPONENTTARGETS_XPATH, component)]
                }
            }

            position = self.get_xpath(POSITION_XPATH, component, required=False)
            if position is not None:
                component_info['position'] = {
                    'x': int(position.get('x')),
                    'y': int(position.get('y'))
                }

            target['components'][component.get('type')][component.get('id')] = component_info

    def _parse_wiring_connection_view_info(self, target, connections_element):

        for connection in self._xpath(CONNECTION_XPATH, connections_element):

            connection_info = {
                'sourcename': str(connection.get('sourcename')),
                'targetname': str(connection.get('targetname')),
            }

            sourcehandle_element = self.get_xpath(SOURCEHANDLE_XPATH, connection, required=False)
            targethandle_element = self.get_xpath(TARGETHANDLE_XPATH, connection, required=False)

            if sourcehandle_element is not None:
                connection_info['sourcehandle'] = {
                    'x': int(sourcehandle_element.get('x')),
                    'y': int(sourcehandle_element.get('y'))
                }
            else:
                connection_info['sourcehandle'] = u'auto'

            if targethandle_element is not None:
                connection_info['targethandle'] = {
                    'x': int(targethandle_element.get('x')),
                    'y': int(targethandle_element.get('y'))
                }
            else:
                connection_info['targethandle'] = u'auto'

            target['connections'].append(connection_info)

    def _parse_wiring_info(self):

        if self._info['type'] == 'mashup':
            self._info['wiring'] = get_wiring_skeleton()
        else:
            self._info['wiring'] = {}

        self._info['wiring']['inputs'] = []
        self._info['wiring']['outputs'] = []

        wiring_elements = self._xpath(WIRING_XPATH, self._doc)
        if len(wiring_elements) != 0:
            wiring_element = wiring_elements[0]

            for slot in self._xpath(INPUT_ENDPOINT_XPATH, wiring_element):
                self._add_translation_index(str(slot.get('label')), type='inputendpoint', variable=slot.get('name'))
                self._add_translation_index(str(slot.get('actionlabel', '')), type='inputendpoint', variable=slot.get('name'))
                self._add_translation_index(str(slot.get('description', '')), type='inputendpoint', variable=slot.get('name'))
                self._info['wiring']['inputs'].append({
                    'name': str(slot.get('name')),
                    'type': str(slot.get('type')),
                    'label': str(slot.get('label', '')),
                    'description': str(slot.get('description', '')),
                    'actionlabel': str(slot.get('actionlabel', '')),
                    'friendcode': str(slot.get('friendcode', '')),
                })

            for event in self._xpath(OUTPUT_ENDPOINT_XPATH, wiring_element):
                self._add_translation_index(str(event.get('label')), type='outputendpoint', variable=event.get('name'))
                self._add_translation_index(str(event.get('description', '')), type='outputendpoint', variable=event.get('name'))
                self._info['wiring']['outputs'].append({
                    'name': str(event.get('name')),
                    'type': str(event.get('type')),
                    'label': str(event.get('label', '')),
                    'description': str(event.get('description', '')),
                    'friendcode': str(event.get('friendcode', '')),
                })

        if self._info['type'] == "mashup":

            mashup_wiring_element = self.get_xpath(MASHUP_WIRING_XPATH, self._doc, required=False)
            if mashup_wiring_element is None:
                return

            self._info['wiring']['version'] = str(mashup_wiring_element.get('version', "1.0"))

            self._parse_wiring_connection_info(mashup_wiring_element)
            self._parse_wiring_operator_info(mashup_wiring_element)

            if self._info['wiring']['version'] == '1.0':
                # TODO: update to the new wiring format
                inputs = self._info['wiring']['inputs']
                outputs = self._info['wiring']['outputs']
                self._info['wiring'] = parse_wiring_old_version(self._info['wiring'])
                self._info['wiring']['inputs'] = inputs
                self._info['wiring']['outputs'] = outputs
                # END TODO
            elif self._info['wiring']['version'] == '2.0':
                visualdescription_element = self.get_xpath(VISUALDESCRIPTION_XPATH, mashup_wiring_element, required=False)
                if visualdescription_element is not None:
                    self._parse_visualdescription_info(visualdescription_element)
            else:
                # TODO raise unsupported version exception
                pass

    def _parse_wiring_connection_info(self, wiring_element):

        connections = []

        for connection in self._xpath(CONNECTION_XPATH, wiring_element):

            source_element = self._xpath(SOURCE_XPATH, connection)[0]
            target_element = self._xpath(TARGET_XPATH, connection)[0]

            connection_info = {
                'readonly': connection.get('readonly', 'false').lower() == 'true',
                'source': {
                    'type': str(source_element.get('type')),
                    'endpoint': str(source_element.get('endpoint')),
                    'id': str(source_element.get('id')),
                },
                'target': {
                    'type': str(target_element.get('type')),
                    'endpoint': str(target_element.get('endpoint')),
                    'id': str(target_element.get('id')),
                }
            }

            connections.append(connection_info)

        self._info['wiring']['connections'] = connections

    def _parse_wiring_operator_info(self, wiring_element):

        self._info['wiring']['operators'] = {}

        for operator in self._xpath(IOPERATOR_XPATH, wiring_element):
            operator_info = {
                'id': str(operator.get('id')),
                'name': str('/'.join((operator.get('vendor'), operator.get('name'), operator.get('version')))),
                'preferences': {},
            }

            for pref in self._xpath(PREFERENCE_VALUE_XPATH, operator):
                pref_value = pref.get('value')
                operator_info['preferences'][str(pref.get('name'))] = {
                    'readonly': pref.get('readonly', 'false').lower() == 'true',
                    'hidden': pref.get('hidden', 'false').lower() == 'true',
                    'value': str(pref_value) if pref_value is not None else None,
                }

            self._info['wiring']['operators'][operator_info['id']] = operator_info

    def _parse_widget_info(self):

        self._parse_component_preferences()
        self._parse_component_persistentvariables()
        self._parse_wiring_info()

        xhtml_element = self._xpath(CODE_XPATH, self._doc)[0]
        self._info['contents'] = {
            'src': str(xhtml_element.get('src')),
            'contenttype': str(xhtml_element.get('contenttype', 'text/html')),
            'charset': str(xhtml_element.get('charset', 'utf-8')),
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

        self._parse_component_preferences()
        self._parse_component_persistentvariables()
        self._parse_wiring_info()

        self._info['js_files'] = []
        for script in self._xpath(SCRIPT_XPATH, self._doc):
            self._info['js_files'].append(str(script.get('src')))

    def _parse_component_preferences(self):

        self._info['preferences'] = []
        for preference in self._xpath(PREFERENCES_XPATH, self._doc):
            self._add_translation_index(preference.get('label'), type='vdef', variable=preference.get('name'), field='label')
            self._add_translation_index(preference.get('description', ''), type='vdef', variable=preference.get('name'), field='description')
            preference_info = {
                'name': str(preference.get('name')),
                'type': str(preference.get('type')),
                'label': str(preference.get('label', '')),
                'description': str(preference.get('description', '')),
                'readonly': preference.get('readonly', 'false').lower() == 'true',
                'default': str(preference.get('default', '')),
                'value': preference.get('value'),
                'secure': preference.get('secure', 'false').lower() == 'true',
                'multiuser': False,
                'required': preference.get('required', 'false').lower() == 'true',
            }

            if preference_info['type'] == 'list':
                preference_info['options'] = []
                for option_index, option in enumerate(self._xpath(OPTION_XPATH, preference)):
                    option_label = option.get('label', option.get('name'))
                    self._add_translation_index(option_label, type='upo', variable=preference.get('name'), option=option_index)
                    preference_info['options'].append({
                        'label': str(option_label),
                        'value': option.get('value'),
                    })

            self._info['preferences'].append(preference_info)

    def _parse_component_persistentvariables(self):

        self._info['properties'] = []
        for prop in self._xpath(PROPERTY_XPATH, self._doc):
            self._add_translation_index(prop.get('label'), type='vdef', variable=prop.get('name'))
            self._add_translation_index(prop.get('description', ''), type='vdef', variable=prop.get('name'))
            self._info['properties'].append({
                'name': str(prop.get('name')),
                'type': str(prop.get('type')),
                'label': str(prop.get('label', '')),
                'description': str(prop.get('description', '')),
                'default': str(prop.get('default', '')),
                'secure': prop.get('secure', 'false').lower() == 'true',
                'multiuser': prop.get('multiuser', 'false').lower() == 'true'
            })

    def _parse_preference_values(self, element):
        values = {}

        for preference in self._xpath(PREFERENCE_VALUE_XPATH, element):
            pref_value = preference.get('value')
            values[str(preference.get('name'))] = str(pref_value) if pref_value is not None else None

        return values

    def _parse_workspace_info(self):

        workspace_structure = self._xpath(INCLUDED_RESOURCES_XPATH, self._doc)[0]

        self._info['preferences'] = self._parse_preference_values(workspace_structure)

        self._info['params'] = []
        for param in self._xpath(PARAM_XPATH, self._doc):
            self._info['params'].append({
                'name': str(param.get('name')),
                'type': str(param.get('type')),
                'label': str(param.get('label', '')),
                'description': str(param.get('description', '')),
                'readonly': param.get('readonly', 'false').lower() == 'true',
                'default': str(param.get('default', '')),
                'value': param.get('value'),
                'required': param.get('required', 'true').lower() == 'true',
            })

        self._info['embedded'] = []
        for component in self._xpath(EMBEDDEDRESOURCE_XPATH, self._doc):
            self._info['embedded'].append({
                'vendor': str(component.get('vendor')),
                'name': str(component.get('name')),
                'version': str(component.get('version')),
                'src': str(component.get('src'))
            })

        tabs = []
        for tab in self._xpath(TAB_XPATH, workspace_structure):
            tab_info = {
                'name': str(tab.get('name')),
                'title': str(tab.get('title', '')),
                'preferences': self._parse_preference_values(tab),
                'resources': [],
            }

            for widget in self._xpath(RESOURCE_XPATH, tab):
                position = self.get_xpath(POSITION_XPATH, widget)
                rendering = self.get_xpath(RENDERING_XPATH, widget)

                widget_info = {
                    'id': str(widget.get('id')),
                    'name': str(widget.get('name')),
                    'vendor': str(widget.get('vendor')),
                    'version': str(widget.get('version')),
                    'title': str(widget.get('title')),
                    'readonly': widget.get('readonly', '').lower() == 'true',
                    'properties': {},
                    'preferences': {},
                    'position': {
                        'x': str(position.get('x')),
                        'y': str(position.get('y')),
                        'z': str(position.get('z')),
                    },
                    'rendering': {
                        'fulldragboard': rendering.get('fulldragboard', 'false').lower() == 'true',
                        'minimized': rendering.get('minimized', 'false').lower() == 'true',
                        'width': str(rendering.get('width')),
                        'height': str(rendering.get('height')),
                        'layout': str(rendering.get('layout')),
                        'titlevisible': rendering.get('titlevisible', 'true').lower() == 'true',
                    },
                }

                for prop in self._xpath(PROPERTIES_XPATH, widget):
                    prop_value = prop.get('value')
                    widget_info['properties'][str(prop.get('name'))] = {
                        'readonly': prop.get('readonly', 'false').lower() == 'true',
                        'value': str(prop_value) if prop_value is not None else None,
                    }
                for pref in self._xpath(PREFERENCE_VALUE_XPATH, widget):
                    pref_value = pref.get('value')
                    widget_info['preferences'][str(pref.get('name'))] = {
                        'readonly': pref.get('readonly', 'false').lower() == 'true',
                        'hidden': pref.get('hidden', 'false').lower() == 'true',
                        'value': str(pref_value) if pref_value is not None else None,
                    }

                tab_info['resources'].append(widget_info)

            tabs.append(tab_info)

        self._info['tabs'] = tabs
        self._parse_wiring_info()

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
        self._info['default_lang'] = str(translations.get('default'))

        for translation in self._xpath(TRANSLATION_XPATH, translations):
            current_catalogue = {}

            for msg in self._xpath(MSG_XPATH, translation):
                if msg.get('name') not in self._translation_indexes:
                    extra_translations.add(msg.get('name'))

                current_catalogue[msg.get('name')] = str(msg.text)

            self._info['translations'][translation.get('lang')] = current_catalogue

        if self._info['default_lang'] not in self._info['translations']:
            raise TemplateParseException(_("There isn't a translation element for the default translation language: (%(default_lang)s)") % {'default_lang': self._info['default_lang']})

        for index in self._translation_indexes:
            if index not in self._info['translations'][self._info['default_lang']]:
                missing_translations.append(index)

        if len(missing_translations) > 0:
            msg = _("The following translation indexes need a default value: %(indexes)s.")
            raise TemplateParseException(msg % {'indexes': ', '.join(missing_translations)})

        if len(extra_translations) > 0:
            msg = _("The following translation indexes are not used: %(indexes)s.")
            raise TemplateParseException(msg % {'indexes': ', '.join(extra_translations)})

        self._info['translation_index_usage'] = self._translation_indexes

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
