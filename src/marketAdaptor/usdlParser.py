# -*- coding: utf-8 -*-

#...............................licence...........................................
#
#     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
#     S.A.Unipersonal (Telefonica I+D)
#
#     This file is part of Morfeo EzWeb Platform.
#
#     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
#
#     You should have received a copy of the GNU Affero General Public License
#     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
#
#     Info about members and contributors of the MORFEO project
#     is available at
#
#     http://morfeo-project.org
#
#...............................licence...........................................#
import rdflib

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
XSD= rdflib.Namespace('http://www.w3.org/2001/XMLSchema#') 
CTAG = rdflib.Namespace('http://commontag.org/ns#') 
ORG = rdflib.Namespace('http://www.w3.org/ns/org#') 
SKOS = rdflib.Namespace('http://www.w3.org/2004/02/skos/core#') 
TIME = rdflib.Namespace('http://www.w3.org/2006/time#') 
GR =rdflib.Namespace('http://purl.org/goodrelations/v1#') 
DOAP = rdflib.Namespace('http://usefulinc.com/ns/doap#')

#

class USDLParser(object):

    _usdl_document= None
    _info = None
    _graph = None
    _service_uri = None

    def __init__(self,usdl_document):
        #import ipdb;ipdb.set_trace()
        self._usdl_document=usdl_document
        self._info = {}
        self._graph = rdflib.Graph()

        #Check rdf format
        try:
            self._graph.parse(data=usdl_document,format="application/rdf+xml")
        except:
            self._graph.parse(data=usdl_document,format='n3')

        # Only a usdl service is permited in the document
        # TODO check if exist a composite service or more services
        for ser in self._graph.subjects(RDF['type'],USDL['Service']):
             self._service_uri = ser
             break
        else:
            msg =_('Error the document is not a valid usdl document')
            raise Exception(msg)

    def _get_field(self,namespace, element, predicate, id_ = False):
        
        result = []
        
        for e in self._graph.objects(element,namespace[predicate]):
            if not id_:
                result.append(unicode(e))
            else:
                #If id = True means that the uri will be used so it is necesary to return the class
                result.append(e)

        if len(result) == 0:
            result.append('')

        return result

    def _parse_basic_info(self):
        vendor = self._get_field(USDL,self._service_uri,'hasProvider',id_ = True)[0]
        self._info['vendor']=self._get_field(FOAF,vendor,'name')[0]
        self._info['name']=self._get_field(DCTERMS,self._service_uri,'title')[0]
        self._info['versions']=[]
        self._info['versions'].append({})
        self._info['versions'][0]['shortDescription']=self._get_field(DCTERMS,self._service_uri,'abstract')[0]
        self._info['versions'][0]['longDescription']=self._get_field(DCTERMS,self._service_uri,'description')[0]
        self._info['versions'][0]['created']=self._get_field(DCTERMS,self._service_uri,'created')[0]
        self._info['versions'][0]['modified']=self._get_field(DCTERMS,self._service_uri,'modified')[0]
        self._info['versions'][0]['uriImage']=self._get_field(FOAF,self._service_uri,'depiction')[0]
        self._info['versions'][0]['version']=self._get_field(USDL,self._service_uri,'versionInfo')[0]
        artefact=self._get_field(USDL,self._service_uri,'utilizedResource',id_=True)[0]
        self._info['versions'][0]['uriTemplate']=self._get_field(BLUEPRINT,artefact,'location')[0]
        self._info['versions'][0]['page']=self._get_field(FOAF,self._service_uri,'page')[0]

    def _parse_legal_info(self):
        self._info['versions'][0]['legal']=[]
        legal_conditions = self._get_field(USDL,self._service_uri,'hasLegalCondition',id_=True)

        for legal in legal_conditions:
            legal_condition = {}
            legal_condition['type']=self._get_field(RDF,legal,'type')[0]
            legal_condition['label']=self._get_field(DCTERMS,legal,'title')[0]
            legal_condition['descripion']=self._get_field(DCTERMS,legal,'description')[0]
            legal_condition['clauses']=[]
            clauses = self._get_field(LEGAL,legal,'hasClause', id_ = True)

            for c in clauses:
                clause = {}
                clause['name']=self._get_field(LEGAL,c,'name')[0]
                clause['text']=self._get_field(LEGAL,c,'text')[0]
                legal_condition['clauses'].append(clause)

            self._info['versions'][0]['legal'].append(legal_condition)
        

    def _parse_sla_info(self):
        #import ipdb;ipdb.set_trace()
        self._info['versions'][0]['sla']=[]
        service_level_profile = self._get_field(USDL,self._service_uri,'hasServiceLevelProfile',id_=True)[0]
        service_levels = self._get_field(SLA,service_level_profile,'hasServiceLevel',id_=True)

        for sla in service_levels:
            service_level = {}
            service_level['type']=self._get_field(RDF,sla,'type')[0]
            service_level['name']=self._get_field(DCTERMS,sla,'title')[0]
            service_level['description']=self._get_field(DCTERMS,sla,'description')[0]
            service_level['obligatedParty']=self._get_field(SLA,sla,'obligatedParty')[0]
            service_level['slaExpresions']=[]

            sla_expresions = self._get_field(SLA,sla,'serviceLevelExpression',id_=True)
            
            for exp in sla_expresions:
                expresion = {}
                expresion['name']=self._get_field(DCTERMS,exp,'title')[0]
                expresion['description']=self._get_field(DCTERMS,exp,'description')[0]
                expresion['variables']=[]

                variables = self._get_field(SLA,exp,'hasVariable',id_=True)

                for var in variables:
                    variable = {}
                    variable['label']=self._get_field(RDFS,var,'label')[0]
                    default_value = self._get_field(SLA,var,'hasDefault',id_=True)[0]
                    variable['type']=self._get_field(RDF,default_value,'type')[0]
                    variable['value']=self._get_field(GR,default_value,'hasValue')[0]
                    variable['unit']=self._get_field(GR,default_value,'hasUnitOfMeasurement')[0]

                    expresion['variables'].append(variable)

                service_level['slaExpresions'].append(expresion)

            self._info['versions'][0]['sla'].append(service_level)


    def _parse_pricing_info(self):
        self._info['versions'][0]['pricing']=[]
        current_pricing = None

        for ofering in self._graph.subjects(RDF['type'],USDL['ServiceOffering']):
            found = False

            for included_service in self._get_field(USDL,ofering,'includes',id_=True):
                if included_service == self._service_uri:
                    current_pricing = ofering
                    found = True
                    break
            if found:
                break

    
        if current_pricing:
            
            price_plans = self._get_field(USDL,current_pricing,'hasPricePlan',id_=True)

            for price in price_plans:
                price_plan = {}
                price_plan['label']=self._get_field(DCTERMS,price,'title')[0]
                price_plan['description']=self._get_field(DCTERMS,price,'description')[0]
            
                # TODO add price components and taxes, is necesary to create an usdl document
                # using the available tool in order to see real property names used in pricing
                price_plan['priceComponents']=[]
                price_plan['taxes']=[]

                for pc in self._get_field(PRICE,price,'hasPriceComponent',id_=True):
                    price_component = {}
                    price_component['title']=self._get_field(DCTERMS,pc,'title')[0]
                    price_component['description']=self._get_field(DCTERMS,pc,'description')[0]
                    price_component['currency']=self._get_field(GR,pc,'hasCurrency')[0]
                    value = self._get_field(GR,pc,'hasCurrencyValue')

                    if not value:
                        price_component['value']=self._get_field(GR,pc,'hasValueFloat')[0]
                    else:
                        price_component['value']= value[0]

                    price_component['unit']=self._get_field(GR,pc,'hasUnitOfMeasurement')[0]
                    price_plan['priceComponents'].append(price_component)
                
                for pc in self._get_field(PRICE,price,'hasTax',id_=True):
                    tax = {}
                    tax['title']=self._get_field(DCTERMS,pc,'title')[0]
                    tax['description']=self._get_field(DCTERMS,pc,'description')[0]
                    tax['currency']=self._get_field(GR,pc,'hasCurrency')[0]
                    value = self._get_field(GR,pc,'hasCurrencyValue')

                    if not value:
                        tax['value']= value[0]
                    else:
                        tax['value']=self._get_field(GR,pc,'hasValueFloat')[0]

                    tax['unit']=self._get_field(GR,pc,'hasUnitOfMeasurement')[0]
                    price_plan['taxes'].append(tax)

                self._info['versions'][0]['pricing'].append(price_plan)
                

    def parse(self):
        self._parse_basic_info()
        self._parse_legal_info()
        self._parse_sla_info()
        self._parse_pricing_info()
        return self._info
        
