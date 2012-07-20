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

import json
import rdflib
from lxml import etree

from django.conf import settings

from datetime import datetime
from workspace.models import Tab
from wirecloud.models import IGadget, WorkSpacePreference, TabPreference


#definition of namespaces that will be used in rdf documents
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


def typeCode2typeText(typeCode):
    if typeCode == 'S':
            return 'text'
    elif typeCode == 'N':
            return 'number'
    elif typeCode == 'D':
            return 'date'
    elif typeCode == 'B':
            return 'boolean'
    elif typeCode == 'L':
            return 'list'
    elif typeCode == 'P':
            return 'password'

    return None


def get_igadgets_description(included_igadgets):
    description = "Wirecloud Mashup composed of: "

    for igadget in included_igadgets:
        description += igadget.gadget.name + ', '

    return description[:-2]


def get_workspace_description(workspace):
    included_igadgets = IGadget.objects.filter(tab__workspace=workspace)

    return get_igadgets_description(included_igadgets)


def build_template_from_workspace(options, workspace, user):

    # process
    vendor = options.get('vendor')
    name = options.get('name')
    version = options.get('version')
    email = options.get('email')

    description = options.get('description')
    if description:
        description = description + " \n " + get_workspace_description(workspace)
    else:
        description = get_workspace_description(workspace)

    author = options.get('author')
    if not author:
        author = user.username

    imageURI = options.get('imageURI')
    if not imageURI:
        imageURI = settings.MEDIA_URL + 'images/headshot_mashup.jpg'

    wikiURI = options.get('wikiURI')
    if not wikiURI:
        wikiURI = 'http://trac.morfeo-project.org/trac/ezwebplatform/wiki/options'

    organization = options.get('organization')
    if not organization:
        organization = ''

    readOnlyGadgets = options.get('readOnlyGadgets', False)
    readOnlyConnectables = options.get('readOnlyConnectables', False)

    parametrization = options.get('parametrization')
    if not parametrization:
        parametrization = {}

    # Build the template
    workspace_tabs = Tab.objects.filter(workspace=workspace).order_by('position')
    included_igadgets = IGadget.objects.filter(tab__workspace=workspace)

    template = etree.Element('Template', xmlns="http://morfeo-project.org/2007/Template")
    desc = etree.Element('Catalog.ResourceDescription')
    template.append(desc)
    etree.SubElement(desc, 'Vendor').text = vendor
    etree.SubElement(desc, 'Name').text = name
    etree.SubElement(desc, 'Version').text = version
    etree.SubElement(desc, 'Author').text = author
    etree.SubElement(desc, 'Mail').text = email
    etree.SubElement(desc, 'Description').text = description
    etree.SubElement(desc, 'ImageURI').text = imageURI
    etree.SubElement(desc, 'WikiURI').text = wikiURI
    etree.SubElement(desc, 'Organization').text = organization

    resources = etree.SubElement(desc, 'IncludedResources')

    # Workspace preferences
    preferences = WorkSpacePreference.objects.filter(workspace=workspace)
    for preference in preferences:
        if not preference.inherit:
            etree.SubElement(resources, 'Preference', name=preference.name, value=preference.value)

    # Tabs and their preferences
    tabs = {}
    for tab in workspace_tabs:
        tabElement = etree.SubElement(resources, 'Tab', name=tab.name, id=str(tab.id))
        tabs[tab.id] = tabElement
        preferences = TabPreference.objects.filter(tab=tab.pk)
        for preference in preferences:
            if not preference.inherit:
                etree.SubElement(tabElement, 'Preference', name=preference.name, value=preference.value)

    wiring = etree.SubElement(template, 'Platform.Wiring')

    # iGadgets
    for igadget in included_igadgets:
        gadget = igadget.gadget
        igadget_id = str(igadget.id)
        igadget_params = {}
        if igadget_id in parametrization:
            igadget_params = parametrization[igadget_id]

        resource = etree.SubElement(tabs[igadget.tab.id], 'Resource', id=igadget_id, vendor=gadget.vendor, name=gadget.name, version=gadget.version, title=igadget.name)
        if readOnlyGadgets:
            resource.set('readonly', 'true')

        position = igadget.position
        etree.SubElement(resource, 'Position', x=str(position.posX), y=str(position.posY), z=str(position.posZ))
        etree.SubElement(resource, 'Rendering', height=str(position.height),
            width=str(position.width), minimized=str(position.minimized),
            fulldragboard=str(position.fulldragboard), layout=str(igadget.layout))

        gadget_preferences = gadget.get_related_preferences()
        for pref in gadget_preferences:
            status = 'normal'
            if pref.name in igadget_params:
                igadget_param_desc = igadget_params[pref.name]
                if igadget_param_desc['source'] == 'default':
                    # Do not issue a Preference element for this preference
                    continue
                value = igadget_param_desc['value']
                status = igadget_param_desc['status']
            else:
                value = igadget.get_var_value(pref, workspace.creator)

            element = etree.SubElement(resource, 'Preference', name=pref.name, value=value)
            if status != 'normal':
                element.set('readonly', 'true')
                if status != 'readonly':
                    element.set('hidden', 'true')

        gadget_properties = gadget.get_related_properties()
        for prop in gadget_properties:
            status = 'normal'
            if prop.name in igadget_params:
                igadget_param_desc = igadget_params[prop.name]
                if igadget_param_desc['source'] == 'default':
                    # Do not issue a Property element for this property
                    continue
                value = igadget_param_desc['value']
                status = igadget_param_desc['status']
            else:
                value = igadget.get_var_value(prop, workspace.creator)

            element = etree.SubElement(resource, 'Property', name=prop.name, value=value)
            if status != 'normal':
                element.set('readonly', 'true')

        events = gadget.get_related_events()

        for event in events:
            wiring.append(etree.Element('Event', name=event.name, type=typeCode2typeText(event.type), label=event.label, friendcode=event.friend_code))

        slots = gadget.get_related_slots()

        for slot in slots:
            wiring.append(etree.Element('Slot', name=slot.name, type=typeCode2typeText(slot.type), label=slot.label, friendcode=slot.friend_code))

    # wiring
    try:
        wiring_status = json.loads(workspace.wiringStatus)
    except:
        wiring_status = {
            "operators": {},
            "connections": [],
        }

    for id_, operator in wiring_status['operators'].iteritems():
        etree.SubElement(wiring, 'Operator', id=id_, name=operator['name'])

    for connection in wiring_status['connections']:
        element = etree.SubElement(wiring, 'Connection')
        if readOnlyConnectables:
            element.set('readonly', 'true')

        etree.SubElement(element, 'Source', type=connection['source']['type'], id=str(connection['source']['id']), endpoint=connection['source']['endpoint'])
        etree.SubElement(element, 'Target', type=connection['target']['type'], id=str(connection['target']['id']), endpoint=connection['target']['endpoint'])

    return template


def build_rdf_template_from_workspace(options, workspace, user):

    graph = rdflib.Graph()
    # build the root node
    mashup_uri = WIRE_M[options.get('vendor') + '/' + options.get('name') + '/' + options.get('version')]
    graph.add((mashup_uri, rdflib.RDF.type, WIRE_M['Mashup']))

    # add basic info
    provider = rdflib.BNode()
    graph.add((provider, rdflib.RDF.type, GR['BussisnessEntity']))
    graph.add((mashup_uri, USDL['hasProvider'], provider))
    graph.add((provider, FOAF['name'], rdflib.Literal(options.get('vendor'))))
    graph.add((mashup_uri, USDL['versionInfo'], rdflib.Literal(options.get('version'))))
    graph.add((mashup_uri, DCTERMS['title'], rdflib.Literal(options.get('name'))))

    author = rdflib.BNode()
    graph.add((author, rdflib.RDF.type, FOAF['Person']))
    graph.add((mashup_uri, DCTERMS['creator'], author))

    if options.get('author'):
        graph.add((author, FOAF['name'], rdflib.Literal(options.get('author'))))
    else:
        graph.add((author, FOAF['name'], rdflib.Literal(user)))

    if options.get('description'):
        description = options.get('description') + '\n' + get_workspace_description(workspace)
    else:
        description = get_workspace_description(workspace)

    graph.add((mashup_uri, DCTERMS['description'], rdflib.Literal(description)))
    graph.add((mashup_uri, WIRE['hasImageUri'], rdflib.URIRef(options.get('imageURI'))))

    if options.get('wikiURI'):
        graph.add((mashup_uri, FOAF['page'], rdflib.URIRef(options.get('wikiURI'))))

    addr = rdflib.BNode()
    graph.add((addr, rdflib.RDF.type, VCARD['Work']))
    graph.add((mashup_uri, VCARD['addr'], addr))
    graph.add((addr, VCARD['email'], rdflib.Literal(options.get('email'))))

    read_only = options.get('readOnlyGadgets', False)
    graph.add((mashup_uri, WIRE_M['readonly'], rdflib.Literal(str(read_only))))

    # add preferences and tabs
    preferences = WorkSpacePreference.objects.filter(workspace=workspace)
    workspace_tabs = Tab.objects.filter(workspace=workspace).order_by('position')

    # Workspace preferences
    for preference in preferences:
        if not preference.inherit:
            pref = rdflib.BNode()
            graph.add((pref, rdflib.RDF.type, WIRE_M['MashupPreference']))
            graph.add((mashup_uri, WIRE_M['hasMashupPreference'], pref))
            graph.add((pref, DCTERMS['title'], rdflib.Literal(preference.name)))
            graph.add((pref, WIRE['value'], rdflib.Literal(preference.value)))

    # Tabs and their preferences
    tabs = {}
    tab_index = 0  # This variable is used to know tab order in rdf
    for tab in workspace_tabs:
        tab_element = rdflib.BNode()
        graph.add((tab_element, rdflib.RDF.type, WIRE_M['Tab']))
        graph.add((mashup_uri, WIRE_M['hasTab'], tab_element))
        graph.add((tab_element, DCTERMS['title'], rdflib.Literal(tab.name)))
        graph.add((tab_element, WIRE['index'], rdflib.Literal(str(tab_index))))
        tab_index = tab_index + 1

        tabs[tab.id] = tab_element
        preferences = TabPreference.objects.filter(tab=tab.pk)
        for preference in preferences:
            if not preference.inherit:
                pref = rdflib.BNode()
                graph.add((pref, rdflib.RDF.type, WIRE_M['TabPreference']))
                graph.add((tab_element, WIRE_M['hasTabPreference'], pref))
                graph.add((pref, DCTERMS['title'], rdflib.Literal(preference.name)))
                graph.add((pref, WIRE['value'], rdflib.Literal(preference.value)))

    #Create wiring node
    wiring = rdflib.BNode()
    graph.add((wiring, rdflib.RDF.type, WIRE['PlatformWiring']))
    graph.add((mashup_uri, WIRE_M['hasMashupWiring'], wiring))

    readOnlyGadgets = options.get('readOnlyGadgets', False)
    parametrization = options.get('parametrization')
    if not parametrization:
        parametrization = {}

    included_iwidgets = IGadget.objects.filter(tab__workspace=workspace)
    # iWidgets
    iwidgets = {}
    for iwidget in included_iwidgets:
        widget = iwidget.gadget
        iwidget_id = str(iwidget.id)
        iwidget_params = {}
        if iwidget_id in parametrization:
            iwidget_params = parametrization[iwidget_id]

        resource = rdflib.BNode()
        iwidgets[iwidget_id] = resource
        graph.add((resource, WIRE_M['iWidgetId'], rdflib.Literal(str(resource))))
        graph.add((resource, rdflib.RDF.type, WIRE_M['iWidget']))
        graph.add((tabs[iwidget.tab.id], WIRE_M['hasiWidget'], resource))
        provider = rdflib.BNode()
        graph.add((provider, rdflib.RDF.type, GR['BussisnessEntity']))
        graph.add((provider, FOAF['name'], rdflib.Literal(widget.vendor)))
        graph.add((resource, USDL['hasProvider'], provider))
        graph.add((resource, DCTERMS['title'], rdflib.Literal(iwidget.name)))
        graph.add((resource, USDL['versionInfo'], rdflib.Literal(widget.version)))
        graph.add((resource, RDFS['label'], rdflib.Literal(widget.name)))

        if readOnlyGadgets:
            graph.add((resource, WIRE['readonly'], rdflib.Literal('true')))

        # iWidget position
        position = iwidget.position
        pos = rdflib.BNode()
        graph.add((pos, rdflib.RDF.type, WIRE_M['Position']))
        graph.add((resource, WIRE_M['hasPosition'], pos))
        graph.add((pos, WIRE_M['x'], rdflib.Literal(str(position.posX))))
        graph.add((pos, WIRE_M['y'], rdflib.Literal(str(position.posY))))
        graph.add((pos, WIRE_M['z'], rdflib.Literal(str(position.posZ))))

        # iWidget rendering
        rend = rdflib.BNode()
        graph.add((rend, rdflib.RDF.type, WIRE_M['iWidgetRendering']))
        graph.add((resource, WIRE_M['hasiWidgetRendering'], rend))
        graph.add((rend, WIRE['renderingHeight'], rdflib.Literal(str(position.height))))
        graph.add((rend, WIRE['renderingWidth'], rdflib.Literal(str(position.width))))
        graph.add((rend, WIRE_M['minimized'], rdflib.Literal(str(position.minimized))))
        graph.add((rend, WIRE_M['fullDragboard'], rdflib.Literal(str(position.fulldragboard))))
        graph.add((rend, WIRE_M['layout'], rdflib.Literal(str(iwidget.layout))))

        # iWidget preferences
        widget_preferences = widget.get_related_preferences()
        for pref in widget_preferences:
            status = 'normal'
            if pref.name in iwidget_params:
                iwidget_param_desc = iwidget_params[pref.name]
                if iwidget_param_desc['source'] == 'default':
                    # Do not issue a Preference element for this preference
                    continue
                value = iwidget_param_desc['value']
                status = iwidget_param_desc['status']
            else:
                value = iwidget.get_var_value(pref, workspace.creator)

            element = rdflib.BNode()
            graph.add((element, rdflib.RDF.type, WIRE_M['iWidgetPreference']))
            graph.add((resource, WIRE_M['hasiWidgetPreference'], element))
            graph.add((element, DCTERMS['title'], rdflib.Literal(pref.name)))
            graph.add((element, WIRE['value'], rdflib.Literal(value)))

            if status != 'normal':
                graph.add((element, WIRE_M['readonly'], rdflib.Literal('true')))
                if status != 'readonly':
                    graph.add((element, WIRE_M['hiden'], rdflib.Literal('true')))

        # iWidget properties
        widget_properties = widget.get_related_properties()
        for prop in widget_properties:
            status = 'normal'
            if prop.name in iwidget_params:
                iwidget_param_desc = iwidget_params[prop.name]
                if iwidget_param_desc['source'] == 'default':
                    # Do not issue a Property element for this property
                    continue
                value = iwidget_param_desc['value']
                status = iwidget_param_desc['status']
            else:
                value = iwidget.get_var_value(prop, workspace.creator)

            element = rdflib.BNode()
            graph.add((element, rdflib.RDF.type, WIRE_M['iWidgetProperty']))
            graph.add((resource, WIRE_M['hasiWidgetProperty'], element))
            graph.add((element, DCTERMS['title'], rdflib.Literal(prop.name)))
            graph.add((element, WIRE['value'], rdflib.Literal(value)))

            if status != 'normal':
                graph.add((element, WIRE_M['readonly'], rdflib.Literal('true')))

        # slots and events
        events = widget.get_related_events()

        for event in events:
            ev = rdflib.BNode()
            graph.add((ev, rdflib.RDF.type, WIRE['Event']))
            graph.add((wiring, WIRE['hasEvent'], ev))
            graph.add((ev, DCTERMS['title'], rdflib.Literal(event.name)))
            graph.add((ev, WIRE['type'], rdflib.Literal(typeCode2typeText(event.type))))
            graph.add((ev, RDFS['label'], rdflib.Literal(event.label)))
            graph.add((ev, WIRE['friendcode'], rdflib.Literal(event.friend_code)))

        slots = widget.get_related_slots()

        for slot in slots:
            sl = rdflib.BNode()
            graph.add((sl, rdflib.RDF.type, WIRE['Slot']))
            graph.add((wiring, WIRE['hasSlot'], sl))
            graph.add((sl, DCTERMS['title'], rdflib.Literal(slot.name)))
            graph.add((sl, WIRE['type'], rdflib.Literal(typeCode2typeText(slot.type))))
            graph.add((sl, RDFS['label'], rdflib.Literal(slot.label)))
            graph.add((sl, WIRE['frindcode'], rdflib.Literal(slot.friend_code)))

    # wiring conections and operators
    readOnlyConnectables = options.get('readOnlyConnectables', False)
    try:
        wiring_status = json.loads(workspace.wiringStatus)
    except:
        wiring_status = {
            "operators": {},
            "connections": [],
        }

    operators = {}
    for id_, operator in wiring_status['operators'].iteritems():
        op = rdflib.BNode()
        operators[id_] = op
        graph.add((op, rdflib.RDF.type, WIRE_M['iOperator']))
        graph.add((wiring, WIRE_M['hasiOperator'], op))
        graph.add((op, DCTERMS['title'], rdflib.Literal(operator['name'])))
        graph.add((op, WIRE_M['iOperatorId'], rdflib.Literal(str(op))))

    for connection in wiring_status['connections']:
        element = rdflib.BNode()
        graph.add((element, rdflib.RDF.type, WIRE_M['Connection']))
        graph.add((wiring, WIRE_M['hasConnection'], element))

        if readOnlyConnectables:
            graph.add((element, WIRE_M['readonly'], rdflib.Literal('true')))

        source = rdflib.BNode()
        graph.add((source, rdflib.RDF.type, WIRE_M['Source']))
        graph.add((element, WIRE_M['hasSource'], source))
        graph.add((source, WIRE['type'], rdflib.Literal(connection['source']['type'])))

        id_ = str(iwidgets[str(connection['source']['id'])])

        if connection['source']['type'] == 'ioperator':
            id_ = str(operators[str(connection['source']['id'])])

        graph.add((source, WIRE_M['sourceId'], rdflib.Literal(id_)))
        graph.add((source, WIRE_M['endpoint'], rdflib.Literal(connection['source']['endpoint'])))

        target = rdflib.BNode()
        graph.add((target, rdflib.RDF.type, WIRE_M['Target']))
        graph.add((element, WIRE_M['hasTarget'], target))
        graph.add((target, WIRE['type'], rdflib.Literal(connection['target']['type'])))

        id_ = str(iwidgets[str(connection['target']['id'])])

        if connection['target']['type'] == 'ioperator':
            id_ = str(operators[str(connection['target']['id'])])

        graph.add((target, WIRE_M['targetId'], rdflib.Literal(id_)))
        graph.add((target, WIRE_M['endpoint'], rdflib.Literal(connection['target']['endpoint'])))

    return graph


def build_usdl_from_workspace(options, workspace, user, template_url):

    usdl_uri = WIRE_M[options.get('vendor') + '/' + options.get('name') + '/' + options.get('version')]
    graph = rdflib.Graph()

    graph.add((usdl_uri, rdflib.RDF.type, USDL['Service']))
    graph.add((usdl_uri, DCTERMS['title'], rdflib.Literal(options.get('name'))))
    graph.add((usdl_uri, USDL['versionInfo'], rdflib.Literal(options.get('version'))))

    vendor = rdflib.BNode()
    graph.add((vendor, rdflib.RDF.type, GR['BussisnessEntity']))
    graph.add((usdl_uri, USDL['hasProvider'], vendor))
    graph.add((vendor, FOAF['name'], rdflib.Literal(options.get('vendor'))))

    description = get_workspace_description(workspace)

    if options.get('description'):
        graph.add((usdl_uri, DCTERMS['abstract'], rdflib.Literal(options.get('description'))))
        description = options.get('description') + '\n' + description

    graph.add((usdl_uri, DCTERMS['description'], rdflib.Literal(description)))

    graph.add((usdl_uri, FOAF['page'], rdflib.URIRef(options.get('wikiURI'))))
    graph.add((usdl_uri, FOAF['depiction'], rdflib.URIRef(options.get('imageURI'))))

    date = datetime.today()
    graph.add((usdl_uri, DCTERMS['created'], rdflib.Literal(str(date))))
    graph.add((usdl_uri, DCTERMS['modified'], rdflib.Literal(str(date))))

    abstract = rdflib.URIRef(template_url)
    graph.add((abstract, rdflib.RDF.type, BLUEPRINT['Artefact']))
    graph.add((usdl_uri, USDL['utilizedResource'], abstract))
    graph.add((abstract, BLUEPRINT['location'], abstract))

    #Mashup parts
    included_iwidgets = IGadget.objects.filter(tab__workspace=workspace)
    for iwidget in included_iwidgets:
        widget = iwidget.gadget
        part = WIRE_M[widget.vendor + '/' + widget.name + '/' + widget.version]
        graph.add((part, rdflib.RDF.type, USDL['Service']))
        graph.add((usdl_uri, USDL['hasPartMandatory'], part))
        graph.add((part, DCTERMS['title'], rdflib.Literal(widget.name)))

    return graph
