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
import rdflib

from django.utils.translation import ugettext as _
from lxml import etree

from commons.exceptions import TemplateParseException
from commons.translation_utils import get_trans_index


__all__ = ('TemplateParser',)

NAME_RE = re.compile(r'^[^/]+$')
VENDOR_RE = re.compile(r'^[^/]+$')
VERSION_RE = re.compile(r'^(?:[1-9]\d*\.|0\.)*(?:[1-9]\d*|0)$')

WIRECLOUD_TEMPLATE_NS = 'http://morfeo-project.org/2007/Template'

RESOURCE_DESCRIPTION_XPATH = '/t:Template/t:Catalog.ResourceDescription'
NAME_XPATH = 't:Name'
VENDOR_XPATH = 't:Vendor'
VERSION_XPATH = 't:Version'
DESCRIPTION_XPATH = 't:Description'
AUTHOR_XPATH = 't:Author'
ORGANIZATION_XPATH = 't:Organization'
IMAGE_URI_XPATH = 't:ImageURI'
IPHONE_IMAGE_URI_XPATH = 't:iPhoneImageURI'
MAIL_XPATH = 't:Mail'
DOC_URI_XPATH = 't:WikiURI'

DISPLAY_NAME_XPATH = 't:DisplayName'
CODE_XPATH = '/t:Template/t:Platform.Link/t:XHTML'
PREFERENCES_XPATH = '/t:Template/t:Platform.Preferences'
PREFERENCE_XPATH = 't:Preference'
OPTION_XPATH = 't:Option'
PROPERTY_XPATH = '/t:Template/t:Platform.StateProperties/t:Property'
WIRING_XPATH = '/t:Template/t:Platform.Wiring'
SLOT_XPATH = 't:Slot'
EVENT_XPATH = 't:Event'
CONTEXT_XPATH = '/t:Template/t:Platform.Context'
GADGET_CONTEXT_XPATH = 't:GadgetContext'
PLATFORM_CONTEXT_XPATH = 't:Context'
PLATFORM_RENDERING_XPATH = '/t:Template/t:Platform.Rendering'
MENUCOLOR_XPATH = '/t:Template/t:MenuColor'
REQUIRE_XPATH = 't:Require'

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

# Namespaces used by rdflib
WIRE = rdflib.Namespace("http://wirecloud.conwet.fi.upm.es/ns/widget#")
WIRE_M = rdflib.Namespace("http://wirecloud.conwet.fi.upm.es/ns/mashup#")
FOAF = rdflib.Namespace("http://xmlns.com/foaf/0.1/")
USDL = rdflib.Namespace("http://www.linked-usdl.org/ns/usdl-core#")
DCTERMS = rdflib.Namespace("http://purl.org/dc/terms/")
RDF = rdflib.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#")
RDFS = rdflib.Namespace("http://www.w3.org/2000/01/rdf-schema#")
VCARD = rdflib.Namespace("http://www.w3.org/2006/vcard/ns#")
BLUEPRINT = rdflib.Namespace("http://bizweb.sap.com/TR/blueprint#")


class USDLTemplateParser(object):

    _graph = None
    _parsed = False
    _rootURI = None

    def __init__(self, graph, base=None):
        self.base = base
        self._info = {}
        self._translation_indexes = {}
        self._translations = {}
        self._url_fields = []

        self._graph = graph
        # check if is a mashup, a widget or an operator
        for type_ in self._graph.subjects(RDF['type'], WIRE['Widget']):
            self._info['type'] = 'gadget'
            break
        else:
            for t in self._graph.subjects(RDF['type'], WIRE['Operator']):
                self._info['type'] = 'operator'
                break
            else:
                self._info['type'] = 'mashup'

        self._parse_basic_info()

    def _add_translation_index(self, value, **kwargs):

        if value not in self._translation_indexes:
            self._translation_indexes[value] = []
            self._translation_indexes[value].append(kwargs)

    def _get_translation_field(self, namespace, element, subject, translation_name, required=True, **kwargs):

        element_num = 0
        translations = {}

        for field_element in self._graph.objects(subject, namespace[element]):
            element_num = element_num + 1
            if field_element.language:
                translations[unicode(field_element.language)] = field_element.title()
                #This field is necesary in order to prevent a problem in case only existed 1 field but it had a language tag
                translations['no_translation'] = field_element.title()
            else:
                translations['no_translation'] = unicode(field_element)

        if element_num == 1:
            return translations['no_translation']

        elif element_num > 1:
            self._add_translation_index(translation_name, **kwargs)
            for k, v in translations.iteritems():
                if k not in self._translations:
                    self._translations[k] = {}
                self._translations[k][translation_name] = v
            return '__MSG_' + translation_name + '__'

        elif element_num == 0 and required:
            msg = _('missing required field: %(field)s')
            raise TemplateParseException(msg % {'field': element})

        else:
            return ''

    def _get_field(self, namespace, element, subject, required=True, id_=False):

        fields = self._graph.objects(subject, namespace[element])
        for field_element in fields:
            if not id_:
                result = unicode(field_element)
                break
            else:
                result = field_element
                break
        else:
            if required:
                msg = _('missing required field: %(field)s')
                raise TemplateParseException(msg % {'field': element})
            else:
                result = ''
        return result

    def _get_url_field(self, field, *args, **kwargs):

        self._url_fields.append(field)
        return self._get_field(*args, **kwargs)

    def _parse_extra_info(self):

        if self._info['type'] == 'gadget' or self._info['type'] == 'operator':
            self._parse_widget_info()
        elif self._info['type'] == 'mashup':
            self._parse_workspace_info()

        self._parse_translation_catalogue()
        self._parsed = True
        # self._graph = None

    def _parse_basic_info(self):

        # Missing organization
        self._info['translations'] = {}

        # ------------------------------------------
        if self._info['type'] == 'gadget':
            self._rootURI = self._graph.subjects(RDF['type'], WIRE['Widget']).next()
        elif self._info['type'] == 'mashup':
            self._rootURI = self._graph.subjects(RDF['type'], WIRE_M['Mashup']).next()
        elif self._info['type'] == 'operator':
            self._rootURI = self._graph.subjects(RDF['type'], WIRE['Operator']).next()

        self._info['version'] = self._get_field(USDL, 'versionInfo', self._rootURI)
        if not re.match(VERSION_RE, self._info['version']):
            raise TemplateParseException(_('ERROR: the format of the version number is invalid. Format: X.X.X where X is an integer. Ex. "0.1", "1.11" NOTE: "1.01" should be changed to "1.0.1" or "1.1"'))

        self._info['name'] = self._get_field(DCTERMS, 'title', self._rootURI)
        if not re.match(NAME_RE, self._info['name']):
            raise TemplateParseException(_('ERROR: the format of the name is invalid.'))

        self._info['description'] = self._get_translation_field(DCTERMS, 'description', self._rootURI, 'description', type='resource', field='description')

        vendor = self._get_field(USDL, 'hasProvider', self._rootURI, id_=True)

        self._info['vendor'] = self._get_field(FOAF, 'name', vendor)
        if not re.match(NAME_RE, self._info['vendor']):
            raise TemplateParseException(_('ERROR: the format of the vendor is invalid.'))

        author = self._get_field(DCTERMS, 'creator', self._rootURI, id_=True)
        self._info['author'] = self._get_field(FOAF, 'name', author)

        self._info['image_uri'] = self._get_url_field('image_uri', WIRE, 'hasImageUri', self._rootURI)

        self._info['doc_uri'] = self._get_field(FOAF, 'page', self._rootURI, required=False)

        self._info['display_name'] = self._get_translation_field(WIRE, 'displayName', self._rootURI, 'display_name', required=False, type='resource', field='display_name')

        addr_element = self._get_field(VCARD, 'addr', self._rootURI, id_=True)
        self._info['mail'] = self._get_field(VCARD, 'email', addr_element)
        self._info['requirements'] = []

    def _parse_wiring_info(self, wiring_property='hasPlatformWiring', parse_connections=False):

        self._info['wiring'] = {
            'slots': [],
            'events': [],
        }

        # method self._graph.objects always returns an iterable object not subscriptable,
        # althought only exits one instance
        wiring_type = WIRE

        if self._info['type'] == 'mashup':
            wiring_type = WIRE_M

        wiring_element = self._get_field(wiring_type, wiring_property, self._rootURI, id_=True, required=False)

        for slot in self._graph.objects(wiring_element, WIRE['hasSlot']):
            self._info['wiring']['slots'].append({
                'name': self._get_field(DCTERMS, 'title', slot, required=False),
                'type': self._get_field(WIRE, 'type', slot, required=False),
                'label': self._get_translation_field(RDFS, 'label', slot, 'slotLabel', required=False, type='vdef', variable=self._get_field(DCTERMS, 'title', slot, required=False)),
                'description': self._get_translation_field(DCTERMS, 'description', slot, 'slotDescription', required=False, type='vdef', variable=self._get_field(DCTERMS, 'title', slot, required=False)),
                'action_label': self._get_translation_field(WIRE, 'slotActionLabel', slot, 'slotActionLabel', required=False, type='vdef', variable=self._get_field(DCTERMS, 'title', slot, required=False)),
                'friendcode': self._get_field(WIRE, 'slotFriendcode', slot, required=False),
            })

        for event in self._graph.objects(wiring_element, WIRE['hasEvent']):
            self._info['wiring']['events'].append({
                'name': self._get_field(DCTERMS, 'title', event, required=False),
                'type': self._get_field(WIRE, 'type', event, required=False),
                'label': self._get_translation_field(RDFS, 'label', event, 'eventLabel', required=False, type='vdef', variable=self._get_field(DCTERMS, 'title', event, required=False)),
                'description': self._get_translation_field(DCTERMS, 'description', event, 'eventDescription', required=False, type='vdef', variable=self._get_field(DCTERMS, 'title', event, required=False)),
                'friendcode': self._get_field(WIRE, 'eventFriendcode', event, required=False),
            })

        if parse_connections:
            self._parse_wiring_connection_info(wiring_element)
            self._parse_wiring_operator_info(wiring_element)

    def _parse_wiring_connection_info(self, wiring_element):

        connections = []

        for connection in self._graph.objects(wiring_element, WIRE_M['hasConnection']):
            connection_info = {
                'readonly': self._get_field(WIRE_M, 'readonly', connection, required=False).lower() == 'true',
                'source': {},
                'target': {},
            }
            for source in self._graph.objects(connection, WIRE_M['hasSource']):
                connection_info['source'] = {
                    'id': self._get_field(WIRE_M, 'sourceId', source),
                    'endpoint': self._get_field(WIRE_M, 'endpoint', source),
                    'type': self._get_field(WIRE, 'type', source),
                }
                break
            else:
                raise TemplateParseException(_('missing required field: source'))

            for target in self._graph.objects(connection, WIRE_M['hasTarget']):
                connection_info['target'] = {
                    'id': self._get_field(WIRE_M, 'targetId', target),
                    'endpoint': self._get_field(WIRE_M, 'endpoint', target),
                    'type': self._get_field(WIRE, 'type', target),
                }
                break
            else:
                raise TemplateParseException(_('missing required field: target'))

            connections.append(connection_info)

        self._info['wiring']['connections'] = connections

    def _parse_wiring_operator_info(self, wiring_element):

        self._info['wiring']['operators'] = {}

        for operator in self._graph.objects(wiring_element, WIRE_M['hasiOperator']):
            operator_info = {
               'id': unicode(operator)[1:],
               'name': self._get_field(DCTERMS, 'title', operator, required=False),
            }
            self._info['wiring']['operators'][operator_info['id']] = operator_info

    def _parse_widget_info(self):

        self._info['iphone_image_uri'] = self._get_url_field('iphone_image_uri', WIRE, 'hasiPhoneImageUri', self._rootURI, required=False)
        # Preference info
        self._info['preferences'] = []

        for preference in self._graph.objects(self._rootURI, WIRE['hasPlatformPreference']):
            preference_info = {
                'name': self._get_field(DCTERMS, 'title', preference, required=False),
                'type': self._get_field(WIRE, 'type', preference, required=False),
                'label': self._get_translation_field(RDFS, 'label', preference, 'prefLabel', required=False, type='vdef', variable=self._get_field(DCTERMS, 'title', preference, required=False)),
                'description': self._get_translation_field(DCTERMS, 'description', preference, 'prefDescription', required=False, type='vdef', variable=self._get_field(DCTERMS, 'title', preference, required=False)),
                'default_value': self._get_field(WIRE, 'default', preference, required=False),
                'secure': self._get_field(WIRE, 'secure', preference, required=False).lower() == 'true',
            }
            if preference_info['type'] == 'list':
                preference_info['options'] = []

                for option in self._graph.objects(preference, WIRE['hasOption']):
                    preference_info['options'].append({
                        'label': self._get_translation_field(DCTERMS, 'title', option, 'optionName', required=False, type='upo', variable=preference_info['name'], option='__MSG_optionName__'),
                        'value': self._get_field(WIRE, 'value', option, required=False),
                    })

            self._info['preferences'].append(preference_info)

        # State properties info
        self._info['properties'] = []

        for prop in self._graph.objects(self._rootURI, WIRE['hasPlatformStateProperty']):
            self._info['properties'].append({
                'name': self._get_field(DCTERMS, 'title', prop, required=False),
                'type': self._get_field(WIRE, 'type', prop, required=False),
                'label': self._get_translation_field(RDFS, 'label', prop, 'propLabel', required=False, type='vdef', variable=self._get_field(DCTERMS, 'title', prop, required=False)),
                'description': self._get_translation_field(DCTERMS, 'description', prop, 'propDescription', required=False, type='vdef', variable=self._get_field(DCTERMS, 'title', prop, required=False)),
                'default_value': self._get_field(WIRE, 'default', prop, required=False),
                'secure': self._get_field(WIRE, 'secure', prop, required=False).lower() == 'true',
            })

        self._parse_wiring_info()

        self._info['context'] = []

        context_element = self._get_field(WIRE, 'hasContext', self._rootURI, id_=True, required=False)

        for gcontext in self._graph.objects(context_element, WIRE['hasWidgetContext']):
            self._info['context'].append({
                'name': self._get_field(DCTERMS, 'title', gcontext, required=False),
                'type': self._get_field(WIRE, 'type', gcontext, required=False),
                'concept': self._get_field(WIRE, 'widgetContextConcept', gcontext, required=False),
                'aspect': 'GCTX',
            })
        for pcontext in self._graph.objects(context_element, WIRE['hasPlatformContext']):
            self._info['context'].append({
                'name': self._get_field(DCTERMS, 'title', pcontext, required=False),
                'type': self._get_field(WIRE, 'type', pcontext, required=False),
                'concept': self._get_field(WIRE, 'platformContextConcept', pcontext, required=False),
                'aspect': 'ECTX',
            })

        if self._info['type'] == 'gadget':
            # It contains the widget code
            xhtml_element = self._get_field(USDL, 'utilizedResource', self._rootURI, id_=True)

            self._info['code_url'] = unicode(xhtml_element)
            self._info['code_content_type'] = self._get_field(DCTERMS, 'format', xhtml_element, required=False)
            if self._info['code_content_type'] == '':
                self._info['code_content_type'] = 'text/html'

            self._info['code_cacheable'] = self._get_field(WIRE, 'codeCacheable', xhtml_element, required=False).lower() == 'true'

        elif self._info['type'] == 'operator':
            # The tamplate has 1-n javascript elements

            self._info['js_files'] = []
            for js_element in self._graph.objects(self._rootURI, USDL['utilizedResource']):
                self._info['js_files'].append(unicode(js_element))

            self._info['code_content_type'] = 'text/javascript'

        rendering_element = self._get_field(WIRE, 'hasPlatformRendering', self._rootURI, id_=True, required=False)

        self._info['gadget_width'] = self._get_field(WIRE, 'renderingWidth', rendering_element, required=False)
        self._info['gadget_height'] = self._get_field(WIRE, 'renderingHeight', rendering_element, required=False)

        self._info['gadget_menucolor'] = self._get_field(WIRE, 'hasPlatformMenucolor', self._rootURI, required=False)

    def _parse_translation_catalogue(self):
        self._info['default_lang'] = 'en'
        self._info['translations'] = self._translations
        self._info['translation_index_usage'] = self._translation_indexes

    def _parse_workspace_info(self):

        self._info['readonly'] = self._get_field(WIRE_M, 'readonly', self._rootURI, required=False)
        preferences = {}

        for preference in self._graph.objects(self._rootURI, WIRE_M['hasWorkspacePreference']):
            preferences[self._get_field(DCTERMS, 'title', preference)] = self._get_field(WIRE, 'value', preference)

        self._info['preferences'] = preferences

        params = {}
        for param in self._graph.objects(self._rootURI, WIRE_M['hasWorkspaceParam']):
            params[self._get_field(DCTERMS, 'title', param)] = {
               'label': self._get_field(RDFS, 'label', param),
               'type': self._get_field(WIRE, 'type', param),
            }
        self._info['params'] = params

        tabs = []
        for tab in self._graph.objects(self._rootURI, WIRE_M['hasTab']):
            tab_info = {
                'name': self._get_field(DCTERMS, 'title', tab),
                'preferences': {},
                'resources': [],
            }

            for preference in self._graph.objects(tab, WIRE_M['hasTabPreference']):
                tab_info['preferences'][self._get_field(DCTERMS, 'title', preference)] = self._get_field(WIRE, 'value', preference)

            for resource in self._graph.objects(tab, WIRE_M['hasiWidget']):
                position = self._get_field(WIRE_M, 'hasPosition', resource, id_=True, required=False)
                rendering = self._get_field(WIRE_M, 'hasiWidgetRendering', resource, id_=True, required=False)
                vendor = self._get_field(USDL, 'hasProvider', resource, id_=True, required=False)

                resource_info = {
                    'id': self._get_field(WIRE_M, 'iWidgetId', resource),
                    'name': self._get_field(RDFS, 'label', resource),
                    'vendor': self._get_field(FOAF, 'name', vendor),
                    'version': self._get_field(USDL, 'versionInfo', resource),
                    'title': self._get_field(DCTERMS, 'title', resource),
                    'properties': {},
                    'preferences': {},
                    'position': {
                        'x': self._get_field(WIRE_M, 'x', position),
                        'y': self._get_field(WIRE_M, 'y', position),
                        'z': self._get_field(WIRE_M, 'z', position),
                    },
                    'rendering': {
                        'width': self._get_field(WIRE, 'renderingWidth', rendering),
                        'height': self._get_field(WIRE, 'renderingHeight', rendering),
                        'layout': self._get_field(WIRE_M, 'layout', rendering),
                        'fulldragboard': self._get_field(WIRE_M, 'fullDragboard', rendering).lower() == 'true',
                        'minimized': self._get_field(WIRE_M, 'minimized', rendering).lower() == 'true',
                    },
                }

                for prop in self._graph.objects(resource, WIRE_M['hasiWidgetProperty']):
                    resource_info['properties'][self._get_field(DCTERMS, 'title', prop)] = {
                        'readonly': self._get_field(WIRE_M, 'readonly', prop, required=False).lower() == 'true',
                        'value': self._get_field(WIRE, 'value', prop, required=False),
                    }

                for pref in self._graph.objects(resource, WIRE_M['hasiWidgetPreference']):
                    resource_info['preferences'][self._get_field(DCTERMS, 'title', pref)] = {
                        'readonly': self._get_field(WIRE_M, 'readonly', pref, required=False).lower() == 'true',
                        'hidden': self._get_field(WIRE_M, 'hidden', pref, required=False).lower() == 'true',
                        'value': self._get_field(WIRE, 'value', pref, required=False),
                    }

                tab_info['resources'].append(resource_info)

            tabs.append(tab_info)

        self._info['tabs'] = tabs

        self._parse_wiring_info(wiring_property='hasMashupWiring', parse_connections=True)
        #wiring_element = self._xpath(WIRING_XPATH, self._doc)[0]

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

    def set_base(self, base):
        self.base = base

    def get_contents(self):
        return unicode(self._graph.serialize(), 'UTF-8')

    def get_resource_type(self):
        return self._info['type']

    def get_resource_uri(self):
        return '/'.join((
            '',
            self._info['type'] + 's',
            self._info['vendor'],
            self._info['name'],
            self._info['version'],
        ))

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

    def get_absolute_url(self, url, base=None):
        if base is None:
            base = self.base

        return urlparse.urljoin(base, url)

    def get_resource_processed_info(self, base=None):
        info = self.get_resource_info()

        if base is None:
            base = self.base

        # process url fields
        for field in self._url_fields:
            value = info[field]
            if value.strip() != '':
                info[field] = urlparse.urljoin(base, value)

        return info


class WirecloudTemplateParser(object):

    _doc = None
    _resource_description = None
    _parsed = False

    def __init__(self, template, base=None):

        self.base = base
        self._info = {}
        self._translation_indexes = {}
        self._url_fields = []
        self._doc = template

        prefix = self._doc.prefix
        xmlns = None
        if prefix in self._doc.nsmap:
            xmlns = self._doc.nsmap[prefix]

        self._uses_namespace = xmlns is not None

        self._resource_description = self._xpath(RESOURCE_DESCRIPTION_XPATH, self._doc)[0]
        self._parse_basic_info()

        included_resources_elements = self._xpath(INCLUDED_RESOURCES_XPATH, self._resource_description)
        if len(included_resources_elements) == 1:
            self._info['type'] = 'mashup'
        else:
            self._info['type'] = 'gadget'

    def _xpath(self, query, element):
        if self._uses_namespace:
            return element.xpath(query, namespaces={'t': WIRECLOUD_TEMPLATE_NS})
        else:
            query = query.replace('t:', '')
            return element.xpath(query)

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

    def _get_url_field(self, field, *args, **kwargs):

        value = self._get_field(*args, **kwargs)
        self._url_fields.append(field)
        self._info[field] = value

    def _parse_basic_info(self):

        self._info['name'] = self._get_field(NAME_XPATH, self._resource_description).strip()
        if not re.match(NAME_RE, self._info['name']):
            raise TemplateParseException(_('ERROR: the format of the name is invalid.'))

        self._info['vendor'] = self._get_field(VENDOR_XPATH, self._resource_description).strip()
        if not re.match(NAME_RE, self._info['vendor']):
            raise TemplateParseException(_('ERROR: the format of the vendor is invalid.'))

        self._info['version'] = self._get_field(VERSION_XPATH, self._resource_description).strip()
        if not re.match(VERSION_RE, self._info['version']):
            raise TemplateParseException(_('ERROR: the format of the version number is invalid. Format: X.X.X where X is an integer. Ex. "0.1", "1.11" NOTE: "1.01" should be changed to "1.0.1" or "1.1"'))

        self._info['display_name'] = self._get_field(DISPLAY_NAME_XPATH, self._resource_description, required=False)
        self._add_translation_index(self._info['display_name'], type='resource', field='display_name')
        self._info['description'] = self._get_field(DESCRIPTION_XPATH, self._resource_description)
        self._add_translation_index(self._info['description'], type='resource', field='description')

        self._info['author'] = self._get_field(AUTHOR_XPATH, self._resource_description)
        self._info['mail'] = self._get_field(MAIL_XPATH, self._resource_description)
        self._info['organization'] = self._get_field(ORGANIZATION_XPATH, self._resource_description, required=False)
        self._get_url_field('image_uri', IMAGE_URI_XPATH, self._resource_description)
        self._get_url_field('doc_uri', DOC_URI_XPATH, self._resource_description, required=False)
        self._parse_requirements()

    def _parse_requirements(self):

        self._info['requirements'] = []
        for requirement in self._xpath(REQUIRE_XPATH, self._resource_description):
            self._info['requirements'].append({
                'feature': requirement.get('feature'),
                'version': requirement.get('version'),
            })

    def _parse_wiring_info(self, parse_connections=False):

        self._info['wiring'] = {
            'slots': [],
            'events': [],
        }

        wiring_element = self._xpath(WIRING_XPATH, self._doc)[0]

        for slot in self._xpath(SLOT_XPATH, wiring_element):
            self._add_translation_index(slot.get('label'), type='vdef', variable=slot.get('name'))
            self._add_translation_index(slot.get('action_label', ''), type='vdef', variable=slot.get('name'))
            self._add_translation_index(slot.get('description', ''), type='vdef', variable=slot.get('name'))
            self._info['wiring']['slots'].append({
                'name': slot.get('name'),
                'type': slot.get('type'),
                'label': slot.get('label'),
                'description': slot.get('description', ''),
                'action_label': slot.get('action_label', ''),
                'friendcode': slot.get('friendcode'),
            })

        for event in self._xpath(EVENT_XPATH, wiring_element):
            self._add_translation_index(event.get('label'), type='vdef', variable=event.get('name'))
            self._add_translation_index(event.get('description', ''), type='vdef', variable=event.get('name'))
            self._info['wiring']['events'].append({
                'name': event.get('name'),
                'type': event.get('type'),
                'label': event.get('label'),
                'description': event.get('description', ''),
                'friendcode': event.get('friendcode'),
            })

        if parse_connections:
            self._parse_wiring_connection_info(wiring_element)
            self._parse_wiring_operator_info(wiring_element)

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
            }
            self._info['wiring']['operators'][operator_info['id']] = operator_info

    def _parse_gadget_info(self):

        self._get_url_field('iphone_image_uri', IPHONE_IMAGE_URI_XPATH, self._resource_description, required=False)

        preferences = self._xpath(PREFERENCES_XPATH, self._doc)[0]
        self._info['preferences'] = []
        for preference in self._xpath(PREFERENCE_XPATH, preferences):
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
                for option in self._xpath(OPTION_XPATH, preference):
                    option_label = option.get('label', option.get('name'))
                    self._add_translation_index(option_label, type='upo', variable=preference.get('name'), option=option_label)
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

        self._info['context'] = []

        context_elements = self._xpath(CONTEXT_XPATH, self._doc)
        if len(context_elements) == 1:

            context_element = context_elements[0]

            for gcontext in self._xpath(GADGET_CONTEXT_XPATH, context_element):
                self._info['context'].append({
                    'name': gcontext.get('name'),
                    'type': gcontext.get('type'),
                    'concept': gcontext.get('concept'),
                    'aspect': 'GCTX',
                })
            for pcontext in self._xpath(PLATFORM_CONTEXT_XPATH, context_element):
                self._info['context'].append({
                    'name': pcontext.get('name'),
                    'type': pcontext.get('type'),
                    'concept': pcontext.get('concept'),
                    'aspect': 'ECTX',
                })

        xhtml_elements = self._xpath(CODE_XPATH, self._doc)
        if len(xhtml_elements) == 1 and xhtml_elements[0].get('href', '') != '':
            xhtml_element = xhtml_elements[0]
            self._info['code_url'] = xhtml_element.get('href')
        else:
            msg = _('missing required attribute in Platform.Link: href')
            raise TemplateParseException(msg)

        self._info['code_content_type'] = xhtml_element.get('content-type', 'text/html')
        self._info['code_cacheable'] = xhtml_element.get('cacheable', 'true').lower() == 'true'

        rendering_element = self._xpath(PLATFORM_RENDERING_XPATH, self._doc)[0]
        self._info['gadget_width'] = rendering_element.get('width')
        self._info['gadget_height'] = rendering_element.get('height')

        self._info['gadget_menucolor'] = self._get_field(MENUCOLOR_XPATH, self._doc, required=False)

    def _parse_workspace_info(self):

        workspace_structure = self._xpath(INCLUDED_RESOURCES_XPATH, self._resource_description)[0]
        self._info['readonly'] = workspace_structure.get('readonly', 'false').lower() == 'true'

        preferences = {}
        for preference in self._xpath(PREFERENCE_XPATH, workspace_structure):
            preferences[preference.get('name')] = preference.get('value')
        self._info['preferences'] = preferences

        params = {}
        for param in self._xpath(PARAM_XPATH, workspace_structure):
            params[param.get('name')] = {
               'label': param.get('label'),
               'type': param.get('type'),
            }
        self._info['params'] = params

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
                position = self._xpath(POSITION_XPATH, resource)[0]
                rendering = self._xpath(RENDERING_XPATH, resource)[0]

                resource_info = {
                    'id': resource.get('id'),
                    'name': resource.get('name'),
                    'vendor': resource.get('vendor'),
                    'version': resource.get('version'),
                    'title': resource.get('title'),
                    'properties': {},
                    'preferences': {},
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

    def set_base(self, base):
        self.base = base

    def get_contents(self):
        return etree.tostring(self._doc, method='xml', xml_declaration=True, encoding="UTF-8", pretty_print=True)

    def get_resource_type(self):
        return self._info['type']

    def get_resource_uri(self):
        return '/'.join((
            '',
            self._info['type'] + 's',
            self._info['vendor'],
            self._info['name'],
            self._info['version'],
        ))

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

    def get_absolute_url(self, url, base=None):
        if base is None:
            base = self.base

        return urlparse.urljoin(base, url)

    def get_resource_processed_info(self, base=None):
        info = self.get_resource_info()

        if base is None:
            base = self.base

        # TODO translate fields

        # process url fields
        for field in self._url_fields:
            value = info[field]
            if value.strip() != '':
                info[field] = urlparse.urljoin(base, value)

        return info


class TemplateParser(object):

    _doc = None
    # This could be an instance of WirecloudTemplateParser
    # or USDLTemplateParser depending on the type of the document
    _parser = None

    def __init__(self, template, base=None):

        xml_document = False
        graph = rdflib.Graph()
        # It is necesary to check if template is a n3/turtle document before
        # any other format because it is not a xml based document so etree
        # function would raise an exeption
        try:
            graph.parse(data=template, format='n3')
        except:
            graph = rdflib.Graph()
            xml_document = True

        if xml_document:
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
                try:
                    graph.parse(data=template)
                except:
                    raise TemplateParseException(_('The document is not valid'))
                self._parser = USDLTemplateParser(graph, base)

            else:
                # The document is a Wirecloud Template so WirecloudTemplateParser is Used
                self._parser = WirecloudTemplateParser(self._doc, base)
        else:
            self._parser = USDLTemplateParser(graph, base)

    def typeText2typeCode(self, typeText):
        return self._parser.typeText2typeCode(typeText)

    def set_base(self, base):
        self._parser.set_base(base)

    def get_contents(self):
        return self._parser.get_contents()

    def get_resource_type(self):
        return self._parser.get_resource_type()

    def get_resource_uri(self):
        return self._parser.get_resource_uri()

    def get_resource_name(self):
        return self._parser.get_resource_name()

    def get_resource_vendor(self):
        return self._parser.get_resource_vendor()

    def get_resource_version(self):
        return self._parser.get_resource_version()

    def get_resource_basic_info(self):
        return self._parser.get_resource_basic_info()

    def get_resource_info(self):
        return self._parser.get_resource_info()

    def get_absolute_url(self, url, base=None):
        return self._parser.get_absolute_url(url, base)

    def get_resource_processed_info(self, base=None):
        return self._parser.get_resource_processed_info(base)
