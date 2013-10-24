# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecluod.

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


import rdflib
import urllib2
from urllib2 import HTTPError

from django.utils.translation import ugettext as _

from wirecloud.commons.utils.template import TemplateParser
from wirecloud.proxy.views import MethodRequest

FOAF = rdflib.Namespace('http://xmlns.com/foaf/0.1/')
RDF = rdflib.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
RDFS = rdflib.Namespace('http://www.w3.org/2000/01/rdf-schema#')
MSM = rdflib.Namespace('http://cms-wg.sti2.org/ns/minimal-service-model#')
OWL = rdflib.Namespace('http://www.w3.org/2002/07/owl#')
DCTERMS = rdflib.Namespace('http://purl.org/dc/terms/')
USDL = rdflib.Namespace('http://www.linked-usdl.org/ns/usdl-core#')
LEGAL = rdflib.Namespace('http://www.linked-usdl.org/ns/usdl-legal#')
PRICE = rdflib.Namespace('http://www.linked-usdl.org/ns/usdl-pricing#')
SLA = rdflib.Namespace('http://www.linked-usdl.org/ns/usdl-sla#')
BLUEPRINT = rdflib.Namespace('http://bizweb.sap.com/TR/blueprint#')
VCARD = rdflib.Namespace('http://www.w3.org/2006/vcard/ns#')
XSD = rdflib.Namespace('http://www.w3.org/2001/XMLSchema#')
CTAG = rdflib.Namespace('http://commontag.org/ns#')
ORG = rdflib.Namespace('http://www.w3.org/ns/org#')
SKOS = rdflib.Namespace('http://www.w3.org/2004/02/skos/core#')
TIME = rdflib.Namespace('http://www.w3.org/2006/time#')
GR = rdflib.Namespace('http://purl.org/goodrelations/v1#')
DOAP = rdflib.Namespace('http://usefulinc.com/ns/doap#')
GEO = rdflib.Namespace('http://www.w3.org/2003/01/geo/wgs84_pos#')


class USDLParseException(Exception):

    def __init__(self, msg):
        self.msg = msg

    def __str__(self):
        return str(self.msg)

    def __unicode__(self):
        return unicode(self.msg)


class USDLParser(object):

    _usdl_document = None
    _info = None
    _graph = None
    _service_list = None
    _service_number = None

    def __init__(self, usdl_document, mime_type):
        self._usdl_document = usdl_document
        self._info = {}
        self._service_list = []
        self._service_number = 0
        self._graph = rdflib.Graph()

        #Check rdf format
        if mime_type == 'application/rdf+xml':
            self._graph.parse(data=usdl_document, format="application/rdf+xml")
        elif mime_type == 'text/n3' or mime_type == 'text/turtle' or mime_type == 'text/plain':
            self._graph.parse(data=usdl_document, format='n3')
        else:
            msg = _('Error the document has not a valid rdf format')
            raise USDLParseException(msg)

        # take all the services in the document
        for ser in self._graph.subjects(RDF['type'], USDL['Service']):
            self._service_list.append(ser)
            self._service_number = self._service_number + 1

        if self._service_number == 0:
            msg = _('Error the document is not a valid usdl document')
            raise USDLParseException(msg)

    def _get_field(self, namespace, element, predicate, id_=False):

        result = []

        for e in self._graph.objects(element, namespace[predicate]):
            if not id_:
                result.append(unicode(e))
            else:
                #If id = True means that the uri will be used so it is necesary to return the class
                result.append(e)

        if len(result) == 0:
            result.append('')

        return result

    def _parse_basic_info(self, service_uri):

        count = 0

        for t in self._graph.predicate_objects(service_uri):
            count = count + 1

        if count < 3:
            self._info['part_ref'] = True
            return

        self._info['part_ref'] = False
        vendor = self._get_field(USDL, service_uri, 'hasProvider', id_=True)[0]
        self._info['vendor'] = self._get_field(FOAF, vendor, 'name')[0]

        # provider vCard
        vcard = self._get_field(VCARD, vendor, 'adr', id_=True)[0]

        if vcard != '':
            self._info['vcard'] = {
                'BEGIN': [{
                    'properties': {},
                    'value':'VCARD',
                }],
                'FN': [{
                    'properties': {},
                    'value': self._info['vendor']
                }],
                'ADR': [{
                    'properties': {},
                    'value': self._get_field(VCARD, vcard, 'street-address')[0] + ';' + self._get_field(VCARD, vcard, 'postal-code')[0] + ';' + self._get_field(VCARD, vcard, 'locality')[0] + ';' + self._get_field(VCARD, vcard, 'country-name')[0]
                }],
                'TEL': [{
                    'properties': {},
                    'value': self._get_field(VCARD, vcard, 'tel')[0]
                }],
                'EMAIL': [{
                    'properties': {},
                    'value': self._get_field(VCARD, vcard, 'email')[0]
                }],
                'END': [{
                    'properties': {},
                    'value': "VCARD"
                }]
            }

        self._info['name'] = self._get_field(DCTERMS, service_uri, 'title')[0]

        artefact = self._get_field(USDL, service_uri, 'utilizedResource', id_=True)[0]
        uri_template = self._get_field(BLUEPRINT, artefact, 'location')[0]
        version = self._get_field(USDL, service_uri, 'versionInfo')[0]

        self._info.update({
            'shortDescription': self._get_field(DCTERMS, service_uri, 'abstract')[0],
            'longDescription': self._get_field(DCTERMS, service_uri, 'description')[0],
            'uriImage': self._get_field(FOAF, service_uri, 'depiction')[0],
            'version': version,
            'uriTemplate': uri_template,
            'page': self._get_field(FOAF, service_uri, 'page')[0],
            'displayName': self._info['name'],
        })

    def _parse_legal_info(self, service_uri):
        self._info['legal'] = []
        legal_conditions = self._get_field(USDL, service_uri, 'hasLegalCondition', id_=True)

        # If legal doest not exist the method does nothing
        if len(legal_conditions) == 1 and legal_conditions[0] == '':
            return

        for legal in legal_conditions:
            legal_condition = {
                'type': self._get_field(RDF, legal, 'type')[0],
                'label': self._get_field(DCTERMS, legal, 'title')[0],
                'description': self._get_field(DCTERMS, legal, 'description')[0],
                'clauses': [],
            }
            clauses = self._get_field(LEGAL, legal, 'hasClause', id_=True)

            for c in clauses:
                clause = {}
                clause['name'] = self._get_field(LEGAL, c, 'name')[0]
                clause['text'] = self._get_field(LEGAL, c, 'text')[0]
                legal_condition['clauses'].append(clause)

            legal_condition['clauses'] = sorted(legal_condition['clauses'], key=lambda clause: clause['name'].lower())
            self._info['legal'].append(legal_condition)

    def _parse_sla_info(self, service_uri):
        self._info['sla'] = []
        service_level_profile = self._get_field(USDL, service_uri, 'hasServiceLevelProfile', id_=True)[0]

        #If sla does not exist the mothod does nothing
        if service_level_profile != '':
            service_levels = self._get_field(SLA, service_level_profile, 'hasServiceLevel', id_=True)

            for sla in service_levels:
                service_level = {
                    'type': self._get_field(RDF, sla, 'type')[0],
                    'name': self._get_field(DCTERMS, sla, 'title')[0],
                    'description': self._get_field(DCTERMS, sla, 'description')[0],
                    'obligatedParty': self._get_field(SLA, sla, 'obligatedParty')[0],
                    'slaExpresions': [],
                }

                sla_expresions = self._get_field(SLA, sla, 'serviceLevelExpression', id_=True)

                for exp in sla_expresions:
                    expresion = {
                        'name': self._get_field(DCTERMS, exp, 'title')[0],
                        'description': self._get_field(DCTERMS, exp, 'description')[0],
                        'variables': [],
                    }

                    variables = self._get_field(SLA, exp, 'hasVariable', id_=True)

                    for var in variables:
                        # The sla variables may defines service availibility or location, defined
                        # by a point in utm coodinates plus a radius, in this case this property is
                        # set in the sla expresion.
                        radius = False
                        default_value = self._get_field(SLA, var, 'hasDefault', id_=True)[0]

                        if default_value == '':
                            default_value = self._get_field(SLA, var, 'hasServiceRadius', id_=True)[0]
                            if default_value != '':
                                radius = True
                                if 'location' not in expresion:
                                    expresion['location'] = {}

                        type_ = self._get_field(RDF, default_value, 'type', id_=True)[0]

                        # The sla variable may contains a location, i.e service availability
                        if type_ == GR['QualitativeValue']:
                            location = self._get_field(GEO, default_value, 'location', id_=True)[0]
                            if location != '':
                                if 'location' not in expresion:
                                    expresion['location'] = {}

                                expresion['location']['coordinates'] = {
                                    'lat': self._get_field(GEO, location, 'lat')[0],
                                    'long': self._get_field(GEO, location, 'long')[0],
                                }
                        else:
                            variable_info = {
                                'label': self._get_field(RDFS, var, 'label')[0],
                                'type': self._get_field(RDF, default_value, 'type')[0],
                                'value': self._get_field(GR, default_value, 'hasValue')[0],
                                'unit': self._get_field(GR, default_value, 'hasUnitOfMeasurement')[0],
                            }

                            expresion['variables'].append(variable_info)
                            if radius:
                                expresion['location']['radius'] = variable_info

                    service_level['slaExpresions'].append(expresion)

                self._info['sla'].append(service_level)

    def _parse_pricing_info(self, service_uri):
        self._info['pricing'] = []
        current_pricing = None

        for ofering in self._graph.subjects(RDF['type'], USDL['ServiceOffering']):
            found = False

            for included_service in self._get_field(USDL, ofering, 'includes', id_=True):
                if included_service == service_uri:
                    current_pricing = ofering
                    found = True
                    break
            if found:
                break

        if current_pricing:

            price_plans = self._get_field(USDL, current_pricing, 'hasPricePlan', id_=True)

            for price in price_plans:
                price_plan = {}
                price_plan['label'] = self._get_field(DCTERMS, price, 'title')[0]
                price_plan['description'] = self._get_field(DCTERMS, price, 'description')[0]

                # TODO add price components and taxes, is necesary to create an usdl document
                # using the available tool in order to see real property names used in pricing

                price_components = self._get_field(PRICE, price, 'hasPriceComponent', id_=True)

                if len(price_components) > 1 or price_components[0] != '':
                    price_plan['priceComponents'] = []

                    for pc in price_components:
                        price_component = {
                            'title': self._get_field(DCTERMS, pc, 'title')[0],
                            'description': self._get_field(DCTERMS, pc, 'description')[0],
                            'currency': self._get_field(GR, pc, 'hasCurrency')[0],
                        }
                        value = self._get_field(GR, pc, 'hasCurrencyValue')

                        if not value:
                            price_component['value'] = self._get_field(GR, pc, 'hasValueFloat')[0]
                        else:
                            price_component['value'] = value[0]

                        price_component['unit'] = self._get_field(GR, pc, 'hasUnitOfMeasurement')[0]
                        price_plan['priceComponents'].append(price_component)

                    price_plan['priceComponents'] = sorted(price_plan['priceComponents'], key=lambda component: component['title'].lower())

                taxes = self._get_field(PRICE, price, 'hasTax', id_=True)

                if len(taxes) > 1 or taxes[0] != '':
                    price_plan['taxes'] = []

                    for pc in taxes:
                        tax = {
                            'title': self._get_field(DCTERMS, pc, 'title')[0],
                            'description': self._get_field(DCTERMS, pc, 'description')[0],
                            'currency': self._get_field(GR, pc, 'hasCurrency')[0],
                        }
                        value = self._get_field(GR, pc, 'hasCurrencyValue')

                        if not value:
                            tax['value'] = value[0]
                        else:
                            tax['value'] = self._get_field(GR, pc, 'hasValueFloat')[0]

                        tax['unit'] = self._get_field(GR, pc, 'hasUnitOfMeasurement')[0]
                        price_plan['taxes'].append(tax)

                    price_plan['taxes'] = sorted(price_plan['taxes'], key=lambda tax: tax['title'].lower())

                self._info['pricing'].append(price_plan)

    def parse(self):

        result = []
        for service_uri in self._service_list:
            self._parse_basic_info(service_uri)
            if not self._info['part_ref']:
                self._parse_legal_info(service_uri)
                self._parse_sla_info(service_uri)
                self._parse_pricing_info(service_uri)
                del(self._info['part_ref'])

                if self._service_number > 1:
                    result.append(self._info)
                    self._info = {}
            else:
                self._info = {}

        if self._service_number == 1:
            return self._info
        else:
            return result
