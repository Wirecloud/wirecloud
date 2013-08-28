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


def build_xml_document(options):

    template = etree.Element('Template', xmlns="http://morfeo-project.org/2007/Template")
    desc = etree.Element('Catalog.ResourceDescription')
    template.append(desc)
    etree.SubElement(desc, 'Vendor').text = options.get('vendor')
    etree.SubElement(desc, 'Name').text = options.get('name')
    etree.SubElement(desc, 'Version').text = options.get('version')
    etree.SubElement(desc, 'Author').text = options.get('author')
    etree.SubElement(desc, 'Mail').text = options.get('email')
    etree.SubElement(desc, 'Description').text = options.get('description')
    etree.SubElement(desc, 'ImageURI').text = options.get('imageURI', '')
    etree.SubElement(desc, 'WikiURI').text = options.get('doc_uri', '')

    resources = etree.SubElement(desc, 'IncludedResources')

    if options['type'] == 'mashup':
        for pref in options['preferences']:
            etree.SubElement(resources, 'Preference', name=pref['name'], value=pref['value'])

    # Tabs & resources
    for tab_index, tab in enumerate(options['tabs']):
        tabElement = etree.SubElement(resources, 'Tab', name=tab['name'], id=str(tab_index))

        for preference in tab['preferences']:
            etree.SubElement(tabElement, 'Preference', name=preference['name'], value=preference['value'])

        for iwidget in tab['resources']:
            resource = etree.SubElement(tabElement, 'Resource', id=iwidget['id'], vendor=iwidget['vendor'], name=iwidget['name'], version=iwidget['version'], title=iwidget['title'])

            if iwidget.get('readonly', False):
                resource.set('readonly', 'true')

            etree.SubElement(resource, 'Position', x=str(iwidget['position']['x']), y=str(iwidget['position']['y']), z=str(iwidget['position']['z']))
            etree.SubElement(resource, 'Rendering', height=str(iwidget['rendering']['height']),
                width=str(iwidget['rendering']['height']), minimized=str(iwidget['rendering']['minimized']),
                fulldragboard=str(iwidget['rendering']['fulldragboard']), layout=str(iwidget['rendering']['layout']))

            for pref_name, pref in iwidget.get('preferences', {}).iteritems():
                element = etree.SubElement(resource, 'Preference', name=pref_name, value=pref['value'])

                if pref.get('readonly', False):
                    element.set('readonly', 'true')

                if pref.get('hidden', False):
                    element.set('hidden', 'true')

            for prop_name, prop in iwidget.get('properties', {}).iteritems():
                element = etree.SubElement(resource, 'Property', name=prop_name, value=prop['value'])

                if prop.get('readonly', False):
                    element.set('readonly', 'true')

                if prop.get('hidden', False):
                    element.set('hidden', 'true')

    # Wiring info
    wiring = etree.SubElement(template, 'Platform.Wiring')

    for output_endpoint in options['wiring']['outputs']:
        etree.SubElement(wiring, 'OutputEndpoint', name=output_endpoint['name'], type=output_endpoint['type'], label=output_endpoint['label'], friendcode=output_endpoint['friendcode'])

    for input_endpoint in options['wiring']['inputs']:
        etree.SubElement(wiring, 'OutputEndpoint', name=input_endpoint['name'], type=input_endpoint['type'], label=input_endpoint['label'], friendcode=input_endpoint['friendcode'])


    for op_id, operator in enumerate(options['wiring']['operators']):
        etree.SubElement(wiring, 'Operator', id=op_id, name=operator['name'])

    for connection in options['wiring']['connections']:
        element = etree.SubElement(wiring, 'Connection')
        if connection.get('readonly', False):
            element.set('readonly', 'true')

        etree.SubElement(element, 'Source', type=connection['source']['type'], id=str(connection['source']['id']), endpoint=connection['source']['endpoint'])
        etree.SubElement(element, 'Target', type=connection['target']['type'], id=str(connection['target']['id']), endpoint=connection['target']['endpoint'])

    return template
