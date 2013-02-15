# -*- coding: utf-8 -*-

# Copyright 2012-2013 Universidad Politécnica de Madrid

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

import rdflib

WIRE = rdflib.Namespace("http://wirecloud.conwet.fi.upm.es/ns/widget#")
WIRE_M = rdflib.Namespace("http://wirecloud.conwet.fi.upm.es/ns/mashup#")
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


def write_rdf_description(template_info, format='xml'):

    graph = rdflib.Graph()
    graph.bind('dcterms', DCTERMS)
    graph.bind('foaf', FOAF)
    graph.bind('usdl', USDL)
    graph.bind('vcard', VCARD)
    graph.bind('wire', WIRE)

    widget_uri = rdflib.URIRef(WIRE[template_info.get('vendor') + '/' + template_info.get('name') + '/' + template_info.get('version')])

    if template_info['type'] == 'widget':
        graph.add((widget_uri, rdflib.RDF.type, WIRE['Widget']))
    elif template_info['type'] == 'operator':
        graph.add((widget_uri, rdflib.RDF.type, WIRE['Operator']))
    else:
        raise Exception('This script is not valid to generate mashup templates use mashupTemplateGenerator')

    # Create basic info
    provider = rdflib.BNode()
    graph.add((provider, rdflib.RDF.type, GR['BusinessEntity']))
    graph.add((widget_uri, USDL['hasProvider'], provider))
    graph.add((provider, FOAF['name'], rdflib.Literal(template_info.get('vendor'))))
    graph.add((widget_uri, USDL['versionInfo'], rdflib.Literal(template_info.get('version'))))
    graph.add((widget_uri, DCTERMS['title'], rdflib.Literal(template_info.get('name'))))
    graph.add((widget_uri, DCTERMS['description'], rdflib.Literal(template_info.get('description'))))

    author = rdflib.BNode()
    graph.add((author, rdflib.RDF.type, FOAF['Person']))
    graph.add((widget_uri, DCTERMS['creator'], author))
    graph.add((author, FOAF['name'], rdflib.Literal(template_info.get('author'))))

    graph.add((widget_uri, WIRE['hasImageUri'], rdflib.URIRef(template_info.get('image_uri'))))

    if template_info.get('doc_uri'):
        graph.add((widget_uri, FOAF['page'], rdflib.URIRef(template_info.get('doc_uri'))))

    graph.add((widget_uri, WIRE['displayName'], rdflib.Literal(template_info.get('display_name'))))

    addr = rdflib.BNode()
    graph.add((addr, rdflib.RDF.type, VCARD['Work']))
    graph.add((widget_uri, VCARD['addr'], addr))
    graph.add((addr, VCARD['email'], rdflib.Literal(template_info.get('mail'))))

    # Create wiring
    wiring = rdflib.BNode()
    graph.add((wiring, rdflib.RDF.type, WIRE['PlatformWiring']))
    graph.add((widget_uri, WIRE['hasPlatformWiring'], wiring))

    # Output endpoints
    for output_endpoint in template_info['wiring']['events']:
        output_node = rdflib.BNode()
        graph.add((output_node, rdflib.RDF.type, WIRE['OutputEndpoint']))
        graph.add((wiring, WIRE['hasOutputEndpoint'], output_node))
        graph.add((output_node, DCTERMS['title'], rdflib.Literal(output_endpoint.get('name'))))
        graph.add((output_node, RDFS['label'], rdflib.Literal(output_endpoint.get('label'))))
        graph.add((output_node, WIRE['type'], rdflib.Literal(output_endpoint.get('type'))))
        graph.add((output_node, WIRE['friendcode'], rdflib.Literal(output_endpoint.get('friendcode'))))
        graph.add((output_node, DCTERMS['description'], rdflib.Literal(output_endpoint.get('description'))))

    # Input endpoints
    for input_endpoint in template_info['wiring']['slots']:
        input_node = rdflib.BNode()
        graph.add((input_node, rdflib.RDF.type, WIRE['InputEndpoint']))
        graph.add((wiring, WIRE['hasInputEndpoint'], input_node))
        graph.add((input_node, DCTERMS['title'], rdflib.Literal(input_endpoint.get('name'))))
        graph.add((input_node, RDFS['label'], rdflib.Literal(input_endpoint.get('label'))))
        graph.add((input_node, WIRE['type'], rdflib.Literal(input_endpoint.get('type'))))
        graph.add((input_node, WIRE['friendcode'], rdflib.Literal(input_endpoint.get('friendcode'))))
        graph.add((input_node, DCTERMS['description'], rdflib.Literal(input_endpoint.get('description'))))
        graph.add((input_node, WIRE['inputActionLabel'], rdflib.Literal(input_endpoint.get('action_label'))))

    if template_info.get('iphone_image_uri'):
        graph.add((widget_uri, WIRE['hasiPhoneImageUri'], rdflib.URIRef(template_info.get('iphone_image_uri'))))

    # Platform preferences
    index = 0
    for pref in template_info['preferences']:
        pref_node = rdflib.BNode()
        graph.add((pref_node, rdflib.RDF.type, WIRE['PlatformPreference']))
        graph.add((widget_uri, WIRE['hasPlatformPreference'], pref_node))
        graph.add((pref_node, WIRE['index'], rdflib.Literal(str(index))))
        index = index + 1
        graph.add((pref_node, DCTERMS['title'], rdflib.Literal(pref.get('name'))))
        graph.add((pref_node, WIRE['type'], rdflib.Literal(pref.get('type'))))
        graph.add((pref_node, RDFS['label'], rdflib.Literal(pref.get('label'))))
        graph.add((pref_node, DCTERMS['description'], rdflib.Literal(pref.get('description'))))

        if pref.get('default_value'):
            graph.add((pref_node, WIRE['default'], rdflib.Literal(pref.get('default_value'))))

        if pref.get('secure'):
            graph.add((pref_node, WIRE['secure'], rdflib.Literal(pref.get('secure'))))

        if pref.get('options'):
            for option in pref['options']:
                option_node = rdflib.BNode()
                graph.add((option_node, rdflib.RDF.type, WIRE['Option']))
                graph.add((pref_node, WIRE['hasOption'], option_node))
                graph.add((option_node, DCTERMS['title'], rdflib.Literal(option.get('label'))))
                graph.add((option_node, WIRE['value'], rdflib.Literal(option.get('value'))))

    # Platform state properties
    for prop in template_info['properties']:
        prop_node = rdflib.BNode()
        graph.add((prop_node, rdflib.RDF.type, WIRE['PlatformStateProperty']))
        graph.add((widget_uri, WIRE['hasPlatformStateProperty'], prop_node))
        graph.add((prop_node, DCTERMS['title'], rdflib.Literal(prop.get('name'))))
        graph.add((prop_node, WIRE['type'], rdflib.Literal(prop.get('type'))))
        graph.add((prop_node, RDFS['label'], rdflib.Literal(prop.get('label'))))
        graph.add((prop_node, WIRE['description'], rdflib.Literal(prop.get('description'))))

        if prop.get('default_value'):
            graph.add((prop_node, WIRE['default'], rdflib.Literal(prop.get('default_value'))))

        if prop.get('secure'):
            graph.add((prop_node, WIRE['secure'], rdflib.Literal(prop.get('secure'))))

    # Code
    if template_info['type'] == 'widget':
        xhtml_element = rdflib.URIRef(template_info.get('code_url'))
        graph.add((xhtml_element, rdflib.RDF.type, USDL['Resource']))
        graph.add((widget_uri, USDL['utilizedResource'], xhtml_element))

        if template_info['code_content_type'] != 'text/html':
            graph.add((xhtml_element, DCTERMS['format'], rdflib.Literal(template_info.get('code_content_type'))))

        graph.add((xhtml_element, WIRE['codeCacheable'], rdflib.Literal(str(template_info.get('code_cacheable')))))

    else:
        index = 0
        for js_file in template_info['js_files']:
            js_node = rdflib.URIRef(js_file)
            graph.add((js_node, rdflib.RDF.type, USDL['Resource']))
            graph.add((js_node, WIRE['index'], rdflib.Literal(str(index))))
            index = index + 1
            graph.add((widget_uri, USDL['utilizedResource'], js_node))

    # Rendering
    rendering = rdflib.BNode()
    graph.add((rendering, rdflib.RDF.type, WIRE['PlatformRendering']))
    graph.add((widget_uri, WIRE['hasPlatformRendering'], rendering))
    graph.add((rendering, WIRE['renderingWidth'], rdflib.Literal(template_info.get('widget_width'))))
    graph.add((rendering, WIRE['renderingHeight'], rdflib.Literal(template_info.get('widget_height'))))

    return graph.serialize(format=format)
