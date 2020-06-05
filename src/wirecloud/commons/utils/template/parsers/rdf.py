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

import rdflib

from django.utils.translation import ugettext as _
from lxml import etree

from wirecloud.commons.utils.mimeparser import parse_mime_type
from wirecloud.commons.utils.template.base import is_valid_name, is_valid_vendor, is_valid_version, TemplateParseException
from wirecloud.platform.wiring.utils import parse_wiring_old_version, get_wiring_skeleton

# Namespaces used by rdflib
WIRE = rdflib.Namespace("http://wirecloud.conwet.fi.upm.es/ns/widget#")
WIRE_M = rdflib.Namespace("http://wirecloud.conwet.fi.upm.es/ns/mashup#")
FOAF = rdflib.Namespace("http://xmlns.com/foaf/0.1/")
USDL = rdflib.Namespace("http://www.linked-usdl.org/ns/usdl-core#")
DCTERMS = rdflib.Namespace("http://purl.org/dc/terms/")
RDF_NS = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
RDF = rdflib.Namespace(RDF_NS)
RDFS = rdflib.Namespace("http://www.w3.org/2000/01/rdf-schema#")
VCARD = rdflib.Namespace("http://www.w3.org/2006/vcard/ns#")
BLUEPRINT = rdflib.Namespace("http://bizweb.sap.com/TR/blueprint#")
DOAP = rdflib.Namespace('http://usefulinc.com/ns/doap#')


def possible_int(value):
    try:
        return int(value)
    except:
        return value


class RDFTemplateParser(object):

    _graph = None
    _parsed = False
    _rootURI = None

    def __init__(self, template):

        if isinstance(template, rdflib.Graph):
            self._graph = template
        else:
            try:
                self._graph = rdflib.Graph()
                self._graph.parse(data=template, format='n3')
            except:
                if isinstance(template, bytes):
                    doc = etree.fromstring(template)
                elif isinstance(template, str):
                    # Work around: ValueError: Unicode strings with encoding
                    # declaration are not supported.
                    doc = etree.fromstring(template.encode('utf-8'))

                root_element_qname = etree.QName(doc)

                if root_element_qname.namespace is None:
                    raise ValueError("XML document does not contain a valid rdf namespace")

                if root_element_qname.namespace != RDF_NS:
                    raise ValueError("Invalid namespace: " + root_element_qname.namespace)

                if root_element_qname.localname != 'RDF':
                    raise ValueError("Invalid root element: " + root_element_qname.localname)

                self._graph = rdflib.Graph()
                self._graph.parse(data=template, format='xml')

    def _init(self):

        self._info = {}
        self._translation_indexes = {}
        self._translations = {}

        # check if is a mashup, a widget or an operator
        for type_ in self._graph.subjects(RDF['type'], WIRE['Widget']):
            self._info['type'] = 'widget'
            break
        else:
            for t in self._graph.subjects(RDF['type'], WIRE['Operator']):
                self._info['type'] = 'operator'
                break
            else:
                for t in self._graph.subjects(RDF['type'], WIRE_M['Mashup']):
                    self._info['type'] = 'mashup'
                    break
                else:
                    raise TemplateParseException('RDF document does not describe a widget, operator or mashup component')

        self._parse_basic_info()

    def _add_translation_index(self, value, **kwargs):

        if value not in self._translation_indexes:
            self._translation_indexes[str(value)] = []
            self._translation_indexes[str(value)].append(kwargs)

    def _get_translation_field(self, namespace, element, subject, translation_name, required=True, **kwargs):

        translated = False
        base_value = None

        for field_element in self._graph.objects(subject, namespace[element]):

            if not isinstance(field_element, rdflib.Literal):
                msg = _('invalid content for field: %(field)s')
                raise TemplateParseException(msg % {'field': element})

            if field_element.language:
                translated = True

                if field_element.language not in self._translations:
                    self._translations[str(field_element.language)] = {}

                self._translations[str(field_element.language)][translation_name] = str(field_element)
            else:
                base_value = str(field_element)

        if base_value is not None and translated is True:
            if 'en' not in self._translations:
                self._translations['en'] = {}

            self._translations['en'][translation_name] = base_value

        if translated is True:
            self._add_translation_index(translation_name, **kwargs)
            return '__MSG_' + translation_name + '__'

        elif base_value is None and required:

            msg = _('missing required field: %(field)s')
            raise TemplateParseException(msg % {'field': element})

        elif base_value is not None:

            return base_value

        else:

            return ''

    def _get_field(self, namespace, element, subject, required=True, id_=False, default=''):

        fields = self._graph.objects(subject, namespace[element])
        for field_element in fields:
            if not id_:
                result = str(field_element)
                break
            else:
                result = field_element
                break
        else:
            if required:
                msg = _('missing required field: %(field)s')
                raise TemplateParseException(msg % {'field': element})
            else:
                result = default
        return result

    def _parse_people_field(self, namespace, element, subject):

        people = []
        sorted_people = sorted(self._graph.objects(subject, namespace[element]), key=lambda person: possible_int(self._get_field(WIRE, 'index', person, required=False)))
        for person in sorted_people:
            name = self._get_field(FOAF, 'name', person, required=False)
            if name == '':
                continue

            person_info = {'name': name}

            email = self._get_field(FOAF, 'mbox', person, required=False)
            if email != '':
                person_info['email'] = email

            homepage = self._get_field(FOAF, 'homepage', person, required=False)
            if homepage != '':
                person_info['url'] = homepage

            people.append(person_info)

        return people

    def _parse_extra_info(self):

        if self._info['type'] == 'widget' or self._info['type'] == 'operator':
            self._parse_component_info()
        elif self._info['type'] == 'mashup':
            self._parse_workspace_info()

        self._parse_translation_catalogue()
        self._parsed = True
        # self._graph = None

    def _parse_basic_info(self):

        self._info['translations'] = {}

        # ------------------------------------------
        if self._info['type'] == 'widget':
            self._rootURI = next(self._graph.subjects(RDF['type'], WIRE['Widget']))
        elif self._info['type'] == 'mashup':
            self._rootURI = next(self._graph.subjects(RDF['type'], WIRE_M['Mashup']))
        elif self._info['type'] == 'operator':
            self._rootURI = next(self._graph.subjects(RDF['type'], WIRE['Operator']))

        vendor = self._get_field(USDL, 'hasProvider', self._rootURI, id_=True)
        self._info['vendor'] = self._get_field(FOAF, 'name', vendor)
        if not is_valid_vendor(self._info['vendor']):
            raise TemplateParseException(_('The format of the vendor is invalid.'))

        self._info['name'] = self._get_field(DCTERMS, 'title', self._rootURI)
        if not is_valid_name(self._info['name']):
            raise TemplateParseException(_('The format of the name is invalid.'))

        self._info['version'] = self._get_field(USDL, 'versionInfo', self._rootURI)
        if not is_valid_version(self._info['version']):
            raise TemplateParseException(_('The format of the version number is invalid. Format: X.X.X where X is an integer. Ex. "0.1", "1.11" NOTE: "1.01" should be changed to "1.0.1" or "1.1"'))

        license = self._get_field(DCTERMS, 'license', self._rootURI, required=False, default=None, id_=True)
        if license is not None:
            self._info['licenseurl'] = str(license)
            self._info['license'] = self._get_field(RDFS, 'label', license, required=False)
        else:
            self._info['licenseurl'] = ''
            self._info['license'] = ''

        longdescription = self._get_field(DCTERMS, 'description', self._rootURI, id_=True, required=False)
        if longdescription != '' and isinstance(longdescription, rdflib.Literal):
            # Old and deprecated behaviour
            self._info['description'] = self._get_translation_field(DCTERMS, 'description', self._rootURI, 'description', required=False, type='resource', field='description')
            self._info['longdescription'] = ''
        else:
            self._info['longdescription'] = '%s' % longdescription
            self._info['description'] = self._get_translation_field(DCTERMS, 'abstract', self._rootURI, 'description', required=False, type='resource', field='description')

        self._info['authors'] = self._parse_people_field(DCTERMS, 'creator', self._rootURI)
        self._info['contributors'] = self._parse_people_field(DCTERMS, 'contributor', self._rootURI)

        self._info['image'] = self._get_field(WIRE, 'hasImageUri', self._rootURI, required=False)
        self._info['smartphoneimage'] = self._get_field(WIRE, 'hasiPhoneImageUri', self._rootURI, required=False)

        self._info['changelog'] = self._get_field(WIRE, 'hasChangeLog', self._rootURI, required=False)
        self._info['homepage'] = self._get_field(FOAF, 'homepage', self._rootURI, required=False)
        self._info['issuetracker'] = self._get_field(DOAP, 'bug-database', self._rootURI, required=False)
        self._info['doc'] = self._get_field(FOAF, 'page', self._rootURI, required=False)

        self._info['title'] = self._get_translation_field(WIRE, 'displayName', self._rootURI, 'title', required=False, type='resource', field='title')

        self._info['email'] = ''
        addr_element = self._get_field(VCARD, 'addr', self._rootURI, id_=True, default=None, required=False)
        if addr_element is not None:
            self._info['email'] = self._get_field(VCARD, 'email', addr_element, required=False)

        self._parse_requirements()

    def _parse_requirements(self):
        self._info['requirements'] = []

        for wrequirement in self._graph.objects(self._rootURI, WIRE['hasRequirement']):
            if next(self._graph.objects(wrequirement, RDF['type'])) == WIRE['Feature']:
                self._info['requirements'].append({
                    'type': 'feature',
                    'name': self._get_field(RDFS, 'label', wrequirement, required=True),
                })

    def _parse_wiring_info(self, wiring_property='hasPlatformWiring'):

        if self._info['type'] == 'mashup':
            self._info['wiring'] = get_wiring_skeleton()
        else:
            self._info['wiring'] = {}

        self._info['wiring']['inputs'] = []
        self._info['wiring']['outputs'] = []

        # method self._graph.objects always returns an iterable object not subscriptable,
        # althought only exits one instance
        wiring_type = WIRE_M if self._info['type'] == 'mashup' else WIRE
        wiring_element = self._get_field(wiring_type, wiring_property, self._rootURI, id_=True, required=False)

        if self._info['type'] == 'mashup':
            self._info['wiring']['version'] = self._get_field(USDL, 'versionInfo', wiring_element, default="1.0", required=False)

        sorted_inputs = sorted(self._graph.objects(wiring_element, WIRE['hasInputEndpoint']), key=lambda source: possible_int(self._get_field(WIRE, 'index', source, required=False)))

        for input_endpoint in sorted_inputs:
            var_name = self._get_field(DCTERMS, 'title', input_endpoint, required=True)
            self._info['wiring']['inputs'].append({
                'name': var_name,
                'type': self._get_field(WIRE, 'type', input_endpoint, required=True),
                'label': self._get_translation_field(RDFS, 'label', input_endpoint, var_name + '_label', required=False, type='inputendpoint', variable=var_name, field='label'),
                'description': self._get_translation_field(DCTERMS, 'description', input_endpoint, var_name + '_description', required=False, type='inputendpoint', variable=var_name, field='description'),
                'actionlabel': self._get_translation_field(WIRE, 'inputActionLabel', input_endpoint, var_name + '_actionlabel', required=False, type='inputendpoint', variable=var_name, field='actionlabel'),
                'friendcode': self._get_field(WIRE, 'friendcode', input_endpoint, required=False),
            })

        sorted_outputs = sorted(self._graph.objects(wiring_element, WIRE['hasOutputEndpoint']), key=lambda output: possible_int(self._get_field(WIRE, 'index', output, required=False)))

        for output_endpoint in sorted_outputs:
            var_name = self._get_field(DCTERMS, 'title', output_endpoint, required=True)
            self._info['wiring']['outputs'].append({
                'name': var_name,
                'type': self._get_field(WIRE, 'type', output_endpoint, required=True),
                'label': self._get_translation_field(RDFS, 'label', output_endpoint, var_name + '_label', required=False, type='outputendpoint', variable=var_name, field='label'),
                'description': self._get_translation_field(DCTERMS, 'description', output_endpoint, var_name + '_description', required=False, type='outputendpoint', variable=var_name, field='description'),
                'friendcode': self._get_field(WIRE, 'friendcode', output_endpoint, required=False),
            })

        if self._info['type'] == 'mashup':
            self._parse_wiring_connection_info(wiring_element)
            self._parse_wiring_operator_info(wiring_element)

            if self._info['wiring']['version'] == '1.0':
                self._parse_wiring_views(wiring_element)
            else:
                self._parse_wiring_behaviours(wiring_element)

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
                'id': self._get_field(WIRE_M, 'iOperatorId', operator),
                'name': self._get_field(DCTERMS, 'title', operator),
                'preferences': {},
            }

            for pref in self._graph.objects(operator, WIRE_M['hasiOperatorPreference']):
                operator_info['preferences'][self._get_field(DCTERMS, 'title', pref)] = {
                    'readonly': self._get_field(WIRE_M, 'readonly', pref, required=False).lower() == 'true',
                    'hidden': self._get_field(WIRE_M, 'hidden', pref, required=False).lower() == 'true',
                    'value': self._get_field(WIRE, 'value', pref, default=None, required=False),
                }

            self._info['wiring']['operators'][operator_info['id']] = operator_info

    def _parse_wiring_components(self, element, behaviour):

        behaviour['components'] = {
            'operator': {},
            'widget': {}
        }

        for entity_view in self._graph.objects(element, WIRE_M['hasComponentView']):

            type_ = self._get_field(WIRE, 'type', entity_view)
            id_ = self._get_field(WIRE, 'id', entity_view)

            component_view_description = behaviour['components'][type_][id_] = {}

            component_view_description['collapsed'] = self._get_field(WIRE_M, 'collapsed', entity_view, required=False).lower() == 'true'

            sorted_sources = sorted(self._graph.objects(entity_view, WIRE_M['hasSource']), key=lambda source: possible_int(self._get_field(WIRE, 'index', source, required=False)))
            sorted_targets = sorted(self._graph.objects(entity_view, WIRE_M['hasTarget']), key=lambda target: possible_int(self._get_field(WIRE, 'index', target, required=False)))

            component_view_description['endpoints'] = {}
            component_view_description['endpoints']['source'] = [self._get_field(RDFS, 'label', sourc) for sourc in sorted_sources]
            component_view_description['endpoints']['target'] = [self._get_field(RDFS, 'label', targ) for targ in sorted_targets]

            position = self._parse_position(entity_view)
            if position is not None:
                component_view_description['position'] = position

    def _parse_position(self, node, relation_name='hasPosition', default=None):
            position_node = self._get_field(WIRE_M, relation_name, node, id_=True, default=None, required=False)
            if position_node is not None:
                return {
                    'x': int(self._get_field(WIRE_M, 'x', position_node)),
                    'y': int(self._get_field(WIRE_M, 'y', position_node))
                }

            return default

    def _join_endpoint_name(self, endpointView):
        endpoint = {
            'id': self._get_field(WIRE_M, 'id', endpointView),
            'endpoint': self._get_field(WIRE_M, 'endpoint', endpointView),
            'type': self._get_field(WIRE, 'type', endpointView),
        }

        return "%s/%s/%s" % (endpoint['type'], endpoint['id'], endpoint['endpoint'])

    def _parse_wiring_connections(self, element, behaviour):

        behaviour['connections'] = []

        for connection in self._graph.objects(element, WIRE_M['hasConnectionView']):
            connection_info = {}

            for source in self._graph.objects(connection, WIRE_M['hasSourceEndpoint']):
                connection_info['sourcename'] = self._join_endpoint_name(source)
                break
            else:
                raise TemplateParseException(_('missing required field: hasSourceEndpoint'))

            connection_info['sourcehandle'] = self._parse_position(connection, relation_name='hasSourceHandlePosition', default="auto")

            for target in self._graph.objects(connection, WIRE_M['hasTargetEndpoint']):
                connection_info['targetname'] = self._join_endpoint_name(target)
                break
            else:
                raise TemplateParseException(_('missing required field: hasTargetEndpoint'))

            connection_info['targethandle'] = self._parse_position(connection, relation_name='hasTargetHandlePosition', default="auto")

            behaviour['connections'].append(connection_info)

    def _parse_wiring_behaviours(self, wiring_element):

        visualdescription = {
            'behaviours': [],
        }

        self._parse_wiring_components(wiring_element, visualdescription)
        self._parse_wiring_connections(wiring_element, visualdescription)

        sorted_behaviours = sorted(self._graph.objects(wiring_element, WIRE_M['hasBehaviour']), key=lambda behaviour: possible_int(self._get_field(WIRE, 'index', behaviour, required=False)))
        for view in sorted_behaviours:
            behaviour = {
                'title': self._get_field(RDFS, 'label', view),
                'description': self._get_field(DCTERMS, 'description', view),
            }

            self._parse_wiring_components(view, behaviour)
            self._parse_wiring_connections(view, behaviour)

            visualdescription['behaviours'].append(behaviour)

        self._info['wiring']['visualdescription'] = visualdescription

    def _parse_wiring_views(self, wiring_element):

        wiring_views = []

        for view in self._graph.objects(wiring_element, WIRE_M['hasWiringView']):
            element_view = {
                'label': self._get_field(RDFS, 'label', view),
                'iwidgets': {},
                'operators': {},
                'connections': []
            }

            for entity_view in self._graph.objects(view, WIRE_M['hasView']):

                type_ = self._get_field(WIRE, 'type', entity_view)
                id_ = self._get_field(WIRE, 'id', entity_view)
                position = self._get_field(WIRE_M, 'hasPosition', entity_view, id_=True)
                pos = {
                    'posX': self._get_field(WIRE_M, 'x', position),
                    'posY': self._get_field(WIRE_M, 'y', position)
                }
                endPointOut = {}
                sorted_sources = sorted(self._graph.objects(entity_view, WIRE_M['hasSource']), key=lambda source: possible_int(self._get_field(WIRE, 'index', source, required=False)))
                source = []
                for sourc in sorted_sources:
                    source.append(self._get_field(RDFS, 'label', sourc))

                endPointOut['sources'] = source

                sorted_targets = sorted(self._graph.objects(entity_view, WIRE_M['hasTarget']), key=lambda target: possible_int(self._get_field(WIRE, 'index', target, required=False)))
                target = []
                for targ in sorted_targets:
                    target.append(self._get_field(RDFS, 'label', targ))

                endPointOut['targets'] = target

                if type_ == 'widget':
                    element_view['iwidgets'][id_] = {
                        'position': pos,
                        'endPointsInOuts': endPointOut
                    }
                elif type_ == 'operator':
                    element_view['operators'][id_] = {
                        'position': pos,
                        'endPointsInOuts': endPointOut
                    }

            wiring_views.append(element_view)
        self._info['wiring']['views'] = wiring_views

        # TODO: update to the new wiring format
        inputs = self._info['wiring']['inputs']
        outputs = self._info['wiring']['outputs']
        self._info['wiring'] = parse_wiring_old_version(self._info['wiring'])
        self._info['wiring']['inputs'] = inputs
        self._info['wiring']['outputs'] = outputs
        # END TODO

    def _parse_component_info(self):

        # Preference info
        self._info['preferences'] = []

        # Platform preferences must be sorted
        sorted_preferences = sorted(self._graph.objects(self._rootURI, WIRE['hasPlatformPreference']), key=lambda pref: possible_int(self._get_field(WIRE, 'index', pref, required=False)))

        for preference in sorted_preferences:
            var_name = self._get_field(DCTERMS, 'title', preference, required=True)
            preference_info = {
                'name': var_name,
                'type': self._get_field(WIRE, 'type', preference, required=False),
                'label': self._get_translation_field(RDFS, 'label', preference, var_name + '_label', required=False, type='vdef', variable=var_name, field='label'),
                'description': self._get_translation_field(DCTERMS, 'description', preference, var_name + '_description', required=False, type='vdef', variable=var_name, field='description'),
                'readonly': self._get_field(WIRE, 'readonly', preference, required=False).lower() == 'true',
                'default': self._get_field(WIRE, 'default', preference, required=False),
                'value': self._get_field(WIRE, 'value', preference, required=False, default=None),
                'secure': self._get_field(WIRE, 'secure', preference, required=False).lower() == 'true',
                'multiuser': False,
                'required': self._get_field(WIRE, 'required', preference, required=False).lower() == 'true',
            }
            if preference_info['type'] == 'list':
                preference_info['options'] = []

                sorted_options = sorted(self._graph.objects(preference, WIRE['hasOption']), key=lambda option: possible_int(self._get_field(WIRE, 'index', option, required=False)))
                for option_index, option in enumerate(sorted_options):
                    preference_info['options'].append({
                        'label': self._get_translation_field(DCTERMS, 'title', option, var_name + '_option' + str(option_index) + '_label', required=False, type='upo', variable=preference_info['name'], option=option_index),
                        'value': self._get_field(WIRE, 'value', option, required=False),
                    })

            self._info['preferences'].append(preference_info)

        # State properties info
        self._info['properties'] = []

        sorted_properties = sorted(self._graph.objects(self._rootURI, WIRE['hasPlatformStateProperty']), key=lambda prop: possible_int(self._get_field(WIRE, 'index', prop, required=False)))
        for prop in sorted_properties:
            var_name = self._get_field(DCTERMS, 'title', prop, required=True)
            self._info['properties'].append({
                'name': var_name,
                'type': self._get_field(WIRE, 'type', prop, required=False),
                'label': self._get_translation_field(RDFS, 'label', prop, var_name + '_label', required=False, type='vdef', variable=var_name, field='label'),
                'description': self._get_translation_field(DCTERMS, 'description', prop, var_name + '_description', required=False, type='vdef', variable=var_name, field='description'),
                'default': self._get_field(WIRE, 'default', prop, required=False),
                'secure': self._get_field(WIRE, 'secure', prop, required=False).lower() == 'true',
                'multiuser': self._get_field(WIRE, 'multiuser', prop, required=False).lower() == 'true',
            })

        self._parse_wiring_info()

        if self._info['type'] == 'widget':
            # It contains the widget code
            self._info['altcontents'] = []
            sorted_contents = sorted(self._graph.objects(self._rootURI, USDL['utilizedResource']), key=lambda contents: possible_int(self._get_field(WIRE, 'index', contents, required=False)))

            for contents_node in sorted_contents:
                contents_info = {
                    'src': str(contents_node),
                }
                contents_info['scope'] = self._get_field(WIRE, 'contentsScope', contents_node, required=False)
                contents_info['contenttype'] = 'text/html'
                contents_info['charset'] = 'utf-8'

                contents_format = self._get_field(DCTERMS, 'format', contents_node, required=False)

                if contents_format.strip() != '':
                    try:
                        contenttype, parameters = parse_mime_type(contents_format)
                    except:
                        raise TemplateParseException('Invalid code content type: %s' % contents_format)

                    contents_info['contenttype'] = contenttype
                    if 'charset' in parameters:
                        contents_info['charset'] = parameters['charset'].lower()
                        del parameters['charset']

                    if len(parameters) > 0:
                        raise TemplateParseException('Invalid code content type: %s' % contents_format)

                if contents_info['scope'] == '':
                    del contents_info['scope']
                    contents_info['useplatformstyle'] = self._get_field(WIRE, 'usePlatformStyle', contents_node, required=False).lower() == 'true'
                    contents_info['cacheable'] = self._get_field(WIRE, 'codeCacheable', contents_node, required=False, default='true').lower() == 'true'
                    self._info['contents'] = contents_info
                else:
                    self._info['altcontents'].append(contents_info)

            rendering_element = self._get_field(WIRE, 'hasPlatformRendering', self._rootURI, id_=True, required=False)

            self._info['widget_width'] = self._get_field(WIRE, 'renderingWidth', rendering_element, required=False)
            self._info['widget_height'] = self._get_field(WIRE, 'renderingHeight', rendering_element, required=False)

        elif self._info['type'] == 'operator':
            # The tamplate has 1-n javascript elements

            # Javascript files must be sorted
            sorted_js_files = sorted(self._graph.objects(self._rootURI, USDL['utilizedResource']), key=lambda js_file: possible_int(self._get_field(WIRE, 'index', js_file, required=True)))

            self._info['js_files'] = []
            for js_element in sorted_js_files:
                self._info['js_files'].append(str(js_element))

            if not len(self._info['js_files']) > 0:
                raise TemplateParseException(_('Missing required field: Javascript files'))

    def _parse_translation_catalogue(self):
        self._info['default_lang'] = 'en'
        self._info['translations'] = self._translations
        self._info['translation_index_usage'] = self._translation_indexes

    def _parse_workspace_info(self):

        preferences = {}

        for preference in self._graph.objects(self._rootURI, WIRE_M['hasMashupPreference']):
            preferences[self._get_field(DCTERMS, 'title', preference)] = self._get_field(WIRE, 'value', preference)

        self._info['preferences'] = preferences

        ordered_params = sorted(self._graph.objects(self._rootURI, WIRE_M['hasMashupParam']), key=lambda raw_param: possible_int(self._get_field(WIRE, 'index', raw_param, required=False)))
        self._info['params'] = []
        for param in ordered_params:
            var_name = self._get_field(DCTERMS, 'title', param, required=True)
            self._info['params'].append({
                'name': var_name,
                'label': self._get_translation_field(RDFS, 'label', param, var_name + '_label', required=True, type='vdef', variable=var_name, field='label'),
                'type': self._get_field(WIRE, 'type', param),
                'description': self._get_translation_field(DCTERMS, 'description', param, var_name + '_description', required=False, type='vdef', variable=var_name, field='description'),
                'readonly': self._get_field(WIRE, 'readonly', param, required=False).lower() == 'true',
                'default': self._get_field(WIRE, 'default', param, required=False),
                'value': self._get_field(WIRE, 'value', param, required=False, default=None),
                'required': self._get_field(WIRE, 'required', param, required=False, default="true").lower() == 'true',
            })

        self._info['embedded'] = []
        for component in self._graph.objects(self._rootURI, WIRE_M['hasEmbeddedResource']):
            vendor = self._get_field(USDL, 'hasProvider', component, id_=True, required=True)

            self._info['embedded'].append({
                'vendor': self._get_field(FOAF, 'name', vendor),
                'name': self._get_field(RDFS, 'label', component),
                'version': self._get_field(USDL, 'versionInfo', component),
                'src': str(component)
            })

        ordered_tabs = sorted(self._graph.objects(self._rootURI, WIRE_M['hasTab']), key=lambda raw_tab: possible_int(self._get_field(WIRE, 'index', raw_tab, required=False)))

        tabs = []
        for tab in ordered_tabs:
            tab_info = {
                'name': self._get_field(DCTERMS, 'title', tab),
                'title': self._get_field(WIRE, 'displayName', tab, required=False),
                'preferences': {},
                'resources': [],
            }

            for preference in self._graph.objects(tab, WIRE_M['hasTabPreference']):
                tab_info['preferences'][self._get_field(DCTERMS, 'title', preference)] = self._get_field(WIRE, 'value', preference)

            for widget in self._graph.objects(tab, WIRE_M['hasiWidget']):
                position = self._get_field(WIRE_M, 'hasPosition', widget, id_=True, required=False)
                rendering = self._get_field(WIRE_M, 'hasiWidgetRendering', widget, id_=True, required=False)
                vendor = self._get_field(USDL, 'hasProvider', widget, id_=True, required=True)

                widget_info = {
                    'id': self._get_field(WIRE_M, 'iWidgetId', widget),
                    'vendor': self._get_field(FOAF, 'name', vendor),
                    'name': self._get_field(RDFS, 'label', widget),
                    'version': self._get_field(USDL, 'versionInfo', widget),
                    'title': self._get_field(DCTERMS, 'title', widget),
                    'readonly': self._get_field(WIRE_M, 'readonly', widget, required=False).lower() == 'true',
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
                        'fulldragboard': self._get_field(WIRE_M, 'fullDragboard', rendering, required=False).lower() == 'true',
                        'minimized': self._get_field(WIRE_M, 'minimized', rendering, required=False).lower() == 'true',
                        'titlevisible': self._get_field(WIRE_M, 'titlevisible', rendering, default="true", required=False).lower() == 'true',
                    },
                }

                for prop in self._graph.objects(widget, WIRE_M['hasiWidgetProperty']):
                    widget_info['properties'][self._get_field(DCTERMS, 'title', prop)] = {
                        'readonly': self._get_field(WIRE_M, 'readonly', prop, required=False).lower() == 'true',
                        'value': self._get_field(WIRE, 'value', prop, default=None, required=False),
                    }

                for pref in self._graph.objects(widget, WIRE_M['hasiWidgetPreference']):
                    widget_info['preferences'][self._get_field(DCTERMS, 'title', pref)] = {
                        'readonly': self._get_field(WIRE_M, 'readonly', pref, required=False).lower() == 'true',
                        'hidden': self._get_field(WIRE_M, 'hidden', pref, required=False).lower() == 'true',
                        'value': self._get_field(WIRE, 'value', pref, default=None, required=False),
                    }

                tab_info['resources'].append(widget_info)

            tabs.append(tab_info)

        self._info['tabs'] = tabs
        self._parse_wiring_info(wiring_property='hasMashupWiring')

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
