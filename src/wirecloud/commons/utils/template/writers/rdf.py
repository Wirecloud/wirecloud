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

import rdflib

from wirecloud.commons.utils.translation import replace_trans_index


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


def add_translated_nodes(graph, parent_node, namespace, element_name, value, usage, template_info):

    used_translation_vars = []
    for translation_var_name, translation_var_usage in template_info['translation_index_usage'].iteritems():
        if usage in translation_var_usage:
            used_translation_vars.append(translation_var_name)

    if len(used_translation_vars) > 0:
        for lang, catalogue in template_info['translations'].iteritems():
            msg = value
            for translation_var_name in used_translation_vars:
                msg = replace_trans_index(translation_var_name, catalogue[translation_var_name], msg)

            graph.add((parent_node, namespace[element_name], rdflib.Literal(msg, lang=lang)))
    else:
        graph.add((parent_node, namespace[element_name], rdflib.Literal(value)))


def write_wiring_views_graph(graph, wiring, template_info):

    for view in template_info['wiring']['views']:
        wiring_view = rdflib.BNode()
        graph.add((wiring_view, rdflib.RDF.type, WIRE_M['WiringView']))
        graph.add((wiring, WIRE_M['hasWiringView'], wiring_view))
        graph.add((wiring_view, RDFS['label'], rdflib.Literal(view['label'])))

        for key, widget in view['iwidgets'].iteritems():
            widget_view = rdflib.BNode()
            graph.add((widget_view, rdflib.RDF.type, WIRE_M['View']))
            graph.add((widget_view, WIRE['type'], rdflib.Literal('widget')))
            graph.add((wiring_view, WIRE_M['hasView'], widget_view))
            graph.add((widget_view, WIRE['id'], rdflib.Literal(str(key))))
            position = rdflib.BNode()
            graph.add((position, rdflib.RDF.type, WIRE_M['Position']))
            graph.add((widget_view, WIRE_M['hasPosition'], position))
            graph.add((position, WIRE_M['x'], rdflib.Literal(str(widget['position']['posX']))))
            graph.add((position, WIRE_M['y'], rdflib.Literal(str(widget['position']['posY']))))
            for index, source in enumerate(widget['endPointsInOuts']['sources']):
                source_element = rdflib.BNode()
                graph.add((source_element, rdflib.RDF.type, WIRE_M['Source']))
                graph.add((widget_view, WIRE_M['hasSource'], source_element))
                graph.add((source_element, RDFS['label'], rdflib.Literal(source)))
                graph.add((source_element, WIRE['index'], rdflib.Literal(str(index))))

            for index, target in enumerate(widget['endPointsInOuts']['targets']):
                target_element = rdflib.BNode()
                graph.add((target_element, rdflib.RDF.type, WIRE_M['Target']))
                graph.add((widget_view, WIRE_M['hasTarget'], target_element))
                graph.add((target_element, RDFS['label'], rdflib.Literal(target)))
                graph.add((target_element, WIRE['index'], rdflib.Literal(str(index))))

        for key, operator in view['operators'].iteritems():
            operator_view = rdflib.BNode()
            graph.add((operator_view, rdflib.RDF.type, WIRE_M['View']))
            graph.add((operator_view, WIRE['type'], rdflib.Literal('operator')))
            graph.add((wiring_view, WIRE_M['hasView'], operator_view))
            graph.add((operator_view, WIRE['id'], rdflib.Literal(str(key))))
            position = rdflib.BNode()
            graph.add((position, rdflib.RDF.type, WIRE_M['Position']))
            graph.add((operator_view, WIRE_M['hasPosition'], position))
            graph.add((position, WIRE_M['x'], rdflib.Literal(str(operator['position']['posX']))))
            graph.add((position, WIRE_M['y'], rdflib.Literal(str(operator['position']['posY']))))

            for index, source in enumerate(operator['endPointsInOuts']['sources']):
                source_element = rdflib.BNode()
                graph.add((source_element, rdflib.RDF.type, WIRE_M['Source']))
                graph.add((operator_view, WIRE_M['hasSource'], source_element))
                graph.add((source_element, RDFS['label'], rdflib.Literal(source)))
                graph.add((source_element, WIRE['index'], rdflib.Literal(str(index))))

            for index, target in enumerate(operator['endPointsInOuts']['targets']):
                target_element = rdflib.BNode()
                graph.add((target_element, rdflib.RDF.type, WIRE_M['Target']))
                graph.add((operator_view, WIRE_M['hasTarget'], target_element))
                graph.add((target_element, RDFS['label'], rdflib.Literal(target)))
                graph.add((target_element, WIRE['index'], rdflib.Literal(str(index))))


def write_mashup_params(graph, resource_uri, template_info):

    if len(template_info['params']) > 0:
        for param_index, param in enumerate(template_info['params']):
            param_node = rdflib.BNode()
            graph.add((param_node, DCTERMS['title'], rdflib.Literal(param['name'])))
            graph.add((param_node, WIRE['index'], rdflib.Literal(str(param_index))))
            graph.add((param_node, RDFS['label'], rdflib.Literal(param['label'])))
            graph.add((param_node, WIRE['type'], rdflib.Literal(param['type'])))
            graph.add((resource_uri, WIRE_M['hasMashupParam'], param_node))

def write_mashup_resources_graph(graph, resource_uri, template_info):

    # Tabs & resources
    for tab_index, tab in enumerate(template_info.get('tabs')):
        tab_element = rdflib.BNode()
        graph.add((tab_element, rdflib.RDF.type, WIRE_M['Tab']))
        graph.add((resource_uri, WIRE_M['hasTab'], tab_element))
        graph.add((tab_element, DCTERMS['title'], rdflib.Literal(tab['name'])))
        graph.add((tab_element, WIRE['index'], rdflib.Literal(str(tab_index))))

        for preference_name in tab['preferences']:
            pref = rdflib.BNode()
            graph.add((pref, rdflib.RDF.type, WIRE_M['TabPreference']))
            graph.add((tab_element, WIRE_M['hasTabPreference'], pref))
            graph.add((pref, DCTERMS['title'], rdflib.Literal(preference_name)))
            graph.add((pref, WIRE['value'], rdflib.Literal(tab['preferences'][preference_name])))

        for iwidget in tab['resources']:
            resource = rdflib.BNode()
            graph.add((resource, WIRE_M['iWidgetId'], rdflib.Literal(str(iwidget['id']))))
            graph.add((resource, rdflib.RDF.type, WIRE_M['iWidget']))
            graph.add((tab_element, WIRE_M['hasiWidget'], resource))
            provider = rdflib.BNode()
            graph.add((provider, rdflib.RDF.type, GR['BussisnessEntity']))
            graph.add((provider, FOAF['name'], rdflib.Literal(iwidget['vendor'])))
            graph.add((resource, USDL['hasProvider'], provider))
            graph.add((resource, RDFS['label'], rdflib.Literal(iwidget['name'])))
            graph.add((resource, USDL['versionInfo'], rdflib.Literal(iwidget['version'])))
            graph.add((resource, DCTERMS['title'], rdflib.Literal(iwidget['title'])))

            if iwidget.get('readonly', False):
                graph.add((resource, WIRE_M['readonly'], rdflib.Literal('true')))

            # iWidget position
            pos = rdflib.BNode()
            graph.add((pos, rdflib.RDF.type, WIRE_M['Position']))
            graph.add((resource, WIRE_M['hasPosition'], pos))
            graph.add((pos, WIRE_M['x'], rdflib.Literal(iwidget['position']['x'])))
            graph.add((pos, WIRE_M['y'], rdflib.Literal(iwidget['position']['y'])))
            graph.add((pos, WIRE_M['z'], rdflib.Literal(iwidget['position']['z'])))

            # iWidget rendering
            rend = rdflib.BNode()
            graph.add((rend, rdflib.RDF.type, WIRE_M['iWidgetRendering']))
            graph.add((resource, WIRE_M['hasiWidgetRendering'], rend))
            graph.add((rend, WIRE['renderingWidth'], rdflib.Literal(str(iwidget['rendering']['width']))))
            graph.add((rend, WIRE['renderingHeight'], rdflib.Literal(str(iwidget['rendering']['height']))))
            graph.add((rend, WIRE_M['layout'], rdflib.Literal(str(iwidget['rendering']['layout']))))
            graph.add((rend, WIRE_M['fullDragboard'], rdflib.Literal(str(iwidget['rendering']['fulldragboard']))))
            graph.add((rend, WIRE_M['minimized'], rdflib.Literal(str(iwidget['rendering']['minimized']))))

            # iWidget preferences
            for pref_name, pref in iwidget.get('preferences', {}).iteritems():
                element = rdflib.BNode()
                graph.add((element, rdflib.RDF.type, WIRE_M['iWidgetPreference']))
                graph.add((resource, WIRE_M['hasiWidgetPreference'], element))
                graph.add((element, DCTERMS['title'], rdflib.Literal(pref_name)))
                graph.add((element, WIRE['value'], rdflib.Literal(pref['value'])))
                if pref.get('readonly', False):
                    graph.add((element, WIRE_M['readonly'], rdflib.Literal('true')))
                if pref.get('hidden', False):
                    graph.add((element, WIRE_M['hidden'], rdflib.Literal('true')))

            for prop_name, prop in iwidget.get('properties', ()).iteritems():
                element = rdflib.BNode()
                graph.add((element, rdflib.RDF.type, WIRE_M['iWidgetProperty']))
                graph.add((resource, WIRE_M['hasiWidgetProperty'], element))
                graph.add((element, DCTERMS['title'], rdflib.Literal(prop_name)))
                graph.add((element, WIRE['value'], rdflib.Literal(prop['value'])))
                if prop.get('readonly', False):
                    graph.add((element, WIRE_M['readonly'], rdflib.Literal('true')))


def write_mashup_wiring_graph(graph, wiring, template_info):

    for id_, operator in template_info['wiring']['operators'].iteritems():
        op = rdflib.BNode()
        graph.add((op, rdflib.RDF.type, WIRE_M['iOperator']))
        graph.add((wiring, WIRE_M['hasiOperator'], op))
        graph.add((op, DCTERMS['title'], rdflib.Literal(operator['name'])))
        graph.add((op, WIRE_M['iOperatorId'], rdflib.Literal(str(id_))))

        for pref_name, pref in operator['preferences'].iteritems():
            element = rdflib.BNode()
            graph.add((element, rdflib.RDF.type, WIRE_M['iOperatorPreference']))
            graph.add((op, WIRE_M['hasiOperatorPreference'], element))
            graph.add((element, DCTERMS['title'], rdflib.Literal(pref_name)))
            graph.add((element, WIRE['value'], rdflib.Literal(pref['value'])))
            if pref.get('readonly', False):
                graph.add((element, WIRE_M['readonly'], rdflib.Literal('true')))
            if pref.get('hidden', False):
                graph.add((element, WIRE_M['hidden'], rdflib.Literal('true')))

    for connection in template_info['wiring']['connections']:
        element = rdflib.BNode()
        graph.add((element, rdflib.RDF.type, WIRE_M['Connection']))
        graph.add((wiring, WIRE_M['hasConnection'], element))

        if connection.get('readonly', False):
            graph.add((element, WIRE_M['readonly'], rdflib.Literal('true')))

        source = rdflib.BNode()
        graph.add((source, rdflib.RDF.type, WIRE_M['Source']))
        graph.add((element, WIRE_M['hasSource'], source))
        graph.add((source, WIRE['type'], rdflib.Literal(connection['source']['type'])))
        graph.add((source, WIRE_M['sourceId'], rdflib.Literal(str(connection['source']['id']))))
        graph.add((source, WIRE_M['endpoint'], rdflib.Literal(connection['source']['endpoint'])))

        target = rdflib.BNode()
        graph.add((target, rdflib.RDF.type, WIRE_M['Target']))
        graph.add((element, WIRE_M['hasTarget'], target))
        graph.add((target, WIRE['type'], rdflib.Literal(connection['target']['type'])))
        graph.add((target, WIRE_M['targetId'], rdflib.Literal(str(connection['target']['id']))))
        graph.add((target, WIRE_M['endpoint'], rdflib.Literal(connection['target']['endpoint'])))

    write_wiring_views_graph(graph, wiring, template_info)


def build_rdf_graph(template_info):

    graph = rdflib.Graph()
    graph.bind('dcterms', DCTERMS)
    graph.bind('foaf', FOAF)
    graph.bind('usdl', USDL)
    graph.bind('vcard', VCARD)
    graph.bind('wire', WIRE)
    graph.bind('wire-m', WIRE_M)
    graph.bind('gr', GR)

    uri = template_info.get('vendor') + '/' + template_info.get('name') + '/' + template_info.get('version')
    if template_info['type'] == 'widget':
        resource_uri = rdflib.URIRef(WIRE[uri])
        graph.add((resource_uri, rdflib.RDF.type, WIRE['Widget']))
    elif template_info['type'] == 'operator':
        resource_uri = rdflib.URIRef(WIRE[uri])
        graph.add((resource_uri, rdflib.RDF.type, WIRE['Operator']))
    elif template_info['type'] == 'mashup':
        resource_uri = rdflib.URIRef(WIRE_M[uri])
        graph.add((resource_uri, rdflib.RDF.type, WIRE_M['Mashup']))
    else:
        raise Exception('Unsupported resource type: %s' % template_info['type'])

    # Create basic info
    provider = rdflib.BNode()
    graph.add((provider, rdflib.RDF.type, GR['BusinessEntity']))
    graph.add((resource_uri, USDL['hasProvider'], provider))
    graph.add((provider, FOAF['name'], rdflib.Literal(template_info.get('vendor'))))
    graph.add((resource_uri, USDL['versionInfo'], rdflib.Literal(template_info.get('version'))))
    graph.add((resource_uri, DCTERMS['title'], rdflib.Literal(template_info.get('name'))))
    add_translated_nodes(graph, resource_uri, DCTERMS, 'description', template_info.get('description'), {'type': 'resource', 'field': 'description'}, template_info)

    author = rdflib.BNode()
    graph.add((author, rdflib.RDF.type, FOAF['Person']))
    graph.add((resource_uri, DCTERMS['creator'], author))
    graph.add((author, FOAF['name'], rdflib.Literal(template_info.get('author'))))

    graph.add((resource_uri, WIRE['hasImageUri'], rdflib.URIRef(template_info.get('image_uri', ''))))

    if template_info.get('doc_uri'):
        graph.add((resource_uri, FOAF['page'], rdflib.URIRef(template_info.get('doc_uri'))))

    add_translated_nodes(graph, resource_uri, WIRE, 'displayName', template_info.get('display_name', ''), {'type': 'resource', 'field': 'display_name'}, template_info)

    addr = rdflib.BNode()
    graph.add((addr, rdflib.RDF.type, VCARD['Work']))
    graph.add((resource_uri, VCARD['addr'], addr))
    graph.add((addr, VCARD['email'], rdflib.Literal(template_info.get('email'))))

    # Requirements
    for requirement in template_info['requirements']:
        requirement_node = rdflib.BNode()
        graph.add((requirement_node, rdflib.RDF.type, WIRE['Feature']))
        graph.add((requirement_node, RDFS['label'], rdflib.Literal(requirement['name'])))
        graph.add((resource_uri, WIRE['hasRequirement'], requirement_node))

    if template_info['type'] == 'mashup':
        write_mashup_resources_graph(graph, resource_uri, template_info)

    # Params
    if template_info['type'] == 'mashup':
        write_mashup_params(graph, resource_uri, template_info)

    # Create wiring
    wiring = rdflib.BNode()
    graph.add((wiring, rdflib.RDF.type, WIRE['PlatformWiring']))
    if template_info['type'] == 'mashup':
        graph.add((resource_uri, WIRE_M['hasMashupWiring'], wiring))
    else:
        graph.add((resource_uri, WIRE['hasPlatformWiring'], wiring))

    # Output endpoints
    for output_index, output_endpoint in enumerate(template_info['wiring']['outputs']):
        output_node = rdflib.BNode()
        graph.add((output_node, rdflib.RDF.type, WIRE['OutputEndpoint']))
        graph.add((wiring, WIRE['hasOutputEndpoint'], output_node))
        graph.add((output_node, WIRE['index'], rdflib.Literal(str(output_index))))
        graph.add((output_node, DCTERMS['title'], rdflib.Literal(output_endpoint.get('name'))))
        add_translated_nodes(graph, output_node, RDFS, 'label', output_endpoint.get('label'), {'type': 'vdef', 'variable': output_endpoint.get('name'), 'field': 'label'}, template_info)
        add_translated_nodes(graph, output_node, DCTERMS, 'description', output_endpoint.get('description'), {'type': 'vdef', 'variable': output_endpoint.get('name'), 'field': 'description'}, template_info)
        graph.add((output_node, WIRE['type'], rdflib.Literal(output_endpoint.get('type'))))
        graph.add((output_node, WIRE['friendcode'], rdflib.Literal(output_endpoint.get('friendcode'))))

    # Input endpoints
    for input_index, input_endpoint in enumerate(template_info['wiring']['inputs']):
        input_node = rdflib.BNode()
        graph.add((input_node, rdflib.RDF.type, WIRE['InputEndpoint']))
        graph.add((wiring, WIRE['hasInputEndpoint'], input_node))
        graph.add((input_node, WIRE['index'], rdflib.Literal(str(input_index))))
        graph.add((input_node, DCTERMS['title'], rdflib.Literal(input_endpoint.get('name'))))
        add_translated_nodes(graph, input_node, RDFS, 'label', input_endpoint.get('label'), {'type': 'vdef', 'variable': input_endpoint.get('name'), 'field': 'label'}, template_info)
        add_translated_nodes(graph, input_node, DCTERMS, 'description', input_endpoint.get('description'), {'type': 'vdef', 'variable': input_endpoint.get('name'), 'field': 'description'}, template_info)
        graph.add((input_node, WIRE['type'], rdflib.Literal(input_endpoint.get('type'))))
        graph.add((input_node, WIRE['friendcode'], rdflib.Literal(input_endpoint.get('friendcode'))))
        add_translated_nodes(graph, input_node, WIRE, 'inputActionLabel', input_endpoint.get('actionlabel'), {'type': 'vdef', 'variable': input_endpoint.get('name'), 'field': 'actionlabel'}, template_info)

    if template_info['type'] == 'mashup':
        write_mashup_wiring_graph(graph, wiring, template_info)

    if template_info.get('iphone_image_uri'):
        graph.add((resource_uri, WIRE['hasiPhoneImageUri'], rdflib.URIRef(template_info.get('iphone_image_uri', ''))))

    if template_info['type'] == 'mashup':
        # Mashup preferences
        for pref_name, pref_value in template_info['preferences'].iteritems():
            pref = rdflib.BNode()
            graph.add((pref, rdflib.RDF.type, WIRE_M['MashupPreference']))
            graph.add((resource_uri, WIRE_M['hasMashupPreference'], pref))
            graph.add((pref, DCTERMS['title'], rdflib.Literal(pref_name)))
            graph.add((pref, WIRE['value'], rdflib.Literal(pref_value)))
    else:
        # Platform preferences
        for pref_index, pref in enumerate(template_info['preferences']):
            pref_node = rdflib.BNode()
            graph.add((pref_node, rdflib.RDF.type, WIRE['PlatformPreference']))
            graph.add((resource_uri, WIRE['hasPlatformPreference'], pref_node))
            graph.add((pref_node, WIRE['index'], rdflib.Literal(str(pref_index))))
            graph.add((pref_node, DCTERMS['title'], rdflib.Literal(pref.get('name'))))
            graph.add((pref_node, WIRE['type'], rdflib.Literal(pref.get('type'))))
            add_translated_nodes(graph, pref_node, RDFS, 'label', pref.get('label'), {'type': 'vdef', 'variable': pref.get('name'), 'field': 'label'}, template_info)
            add_translated_nodes(graph, pref_node, DCTERMS, 'description', pref.get('description'), {'type': 'vdef', 'variable': pref.get('name'), 'field': 'description'}, template_info)

            if pref.get('readonly', False) is True:
                graph.add((pref_node, WIRE['readonly'], rdflib.Literal('true')))

            if pref.get('default_value') not in (None, ''):
                graph.add((pref_node, WIRE['default'], rdflib.Literal(pref.get('default_value'))))

            if pref.get('value'):
                graph.add((pref_node, WIRE['value'], rdflib.Literal(pref['value'])))

            if pref.get('secure'):
                graph.add((pref_node, WIRE['secure'], rdflib.Literal(pref.get('secure'))))

            if pref.get('options'):
                for option_index, option in enumerate(pref['options']):
                    option_node = rdflib.BNode()
                    graph.add((option_node, rdflib.RDF.type, WIRE['Option']))
                    graph.add((pref_node, WIRE['hasOption'], option_node))
                    graph.add((option_node, WIRE['index'], rdflib.Literal(str(option_index))))
                    add_translated_nodes(graph, option_node, DCTERMS, 'title', option.get('label'), {'type': 'upo', 'variable': pref.get('name'), 'option': option_index}, template_info)
                    graph.add((option_node, WIRE['value'], rdflib.Literal(option.get('value'))))

        # Platform state properties
        for prop_index, prop in enumerate(template_info['properties']):
            prop_node = rdflib.BNode()
            graph.add((prop_node, rdflib.RDF.type, WIRE['PlatformStateProperty']))
            graph.add((resource_uri, WIRE['hasPlatformStateProperty'], prop_node))
            graph.add((prop_node, WIRE['index'], rdflib.Literal(str(prop_index))))
            graph.add((prop_node, DCTERMS['title'], rdflib.Literal(prop.get('name'))))
            graph.add((prop_node, WIRE['type'], rdflib.Literal(prop.get('type'))))
            add_translated_nodes(graph, prop_node, RDFS, 'label', prop.get('label'), {'type': 'vdef', 'variable': prop.get('name'), 'field': 'label'}, template_info)
            add_translated_nodes(graph, prop_node, DCTERMS, 'description', prop.get('description'), {'type': 'vdef', 'variable': prop.get('name'), 'field': 'description'}, template_info)

            if prop.get('default_value') not in (None, ''):
                graph.add((prop_node, WIRE['default'], rdflib.Literal(prop.get('default_value'))))

            if prop.get('secure'):
                graph.add((prop_node, WIRE['secure'], rdflib.Literal(prop.get('secure'))))

    # Code
    if template_info['type'] == 'widget':
        xhtml_element = rdflib.URIRef(template_info.get('code_url'))
        graph.add((xhtml_element, rdflib.RDF.type, USDL['Resource']))
        graph.add((resource_uri, USDL['utilizedResource'], xhtml_element))

        if template_info['code_content_type'] != 'text/html' or template_info['code_charset'] != 'utf-8':
            content_type = template_info.get('code_content_type', 'text/html') + '; charset=' + template_info.get('code_charset', 'utf-8').upper()
            graph.add((xhtml_element, DCTERMS['format'], rdflib.Literal(content_type)))

        if template_info['code_cacheable'] is False:
            graph.add((xhtml_element, WIRE['codeCacheable'], rdflib.Literal('false')))

        if template_info['code_uses_platform_style']:
            graph.add((xhtml_element, WIRE['usePlatformStyle'], rdflib.Literal('true')))

    elif template_info['type'] == 'operator':
        for index, js_file in enumerate(template_info['js_files']):
            js_node = rdflib.URIRef(js_file)
            graph.add((js_node, rdflib.RDF.type, USDL['Resource']))
            graph.add((js_node, WIRE['index'], rdflib.Literal(str(index))))
            graph.add((resource_uri, USDL['utilizedResource'], js_node))

    # Rendering
    if template_info['type'] == 'widget':
        rendering = rdflib.BNode()
        graph.add((rendering, rdflib.RDF.type, WIRE['PlatformRendering']))
        graph.add((resource_uri, WIRE['hasPlatformRendering'], rendering))
        graph.add((rendering, WIRE['renderingWidth'], rdflib.Literal(template_info.get('widget_width'))))
        graph.add((rendering, WIRE['renderingHeight'], rdflib.Literal(template_info.get('widget_height'))))

    return graph


def write_rdf_description(template_info, format='pretty-xml'):
    graph = build_rdf_graph(template_info)
    return graph.serialize(format=format)
