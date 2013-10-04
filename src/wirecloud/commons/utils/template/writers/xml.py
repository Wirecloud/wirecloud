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


def write_mashup_tree(resources, options):

    # Params
    for param in options['params']:
        etree.SubElement(resources, 'Param', name=param['name'], label=param['label'], type=param['type'])

    # Tabs & resources
    for tab_index, tab in enumerate(options['tabs']):
        tabElement = etree.SubElement(resources, 'Tab', name=tab['name'], id=str(tab_index))

        for preference_name, preference_value in tab['preferences'].iteritems():
            etree.SubElement(tabElement, 'Preference', name=preference_name, value=preference_value)

        for iwidget in tab['resources']:
            resource = etree.SubElement(tabElement, 'Resource', id=iwidget['id'], vendor=iwidget['vendor'], name=iwidget['name'], version=iwidget['version'], title=iwidget['title'])

            if iwidget.get('readonly', False):
                resource.set('readonly', 'true')

            etree.SubElement(resource, 'Position', x=str(iwidget['position']['x']), y=str(iwidget['position']['y']), z=str(iwidget['position']['z']))
            etree.SubElement(resource, 'Rendering', height=str(iwidget['rendering']['height']),
                width=str(iwidget['rendering']['height']), minimized=str(iwidget['rendering']['minimized']),
                fulldragboard=str(iwidget['rendering']['fulldragboard']), layout=str(iwidget['rendering']['layout']))

            for pref_name, pref in iwidget['preferences'].iteritems():
                element = etree.SubElement(resource, 'Preference', name=pref_name, value=pref['value'])

                if pref.get('readonly', False):
                    element.set('readonly', 'true')

                if pref.get('hidden', False):
                    element.set('hidden', 'true')

            for prop_name, prop in iwidget.get('properties', {}).iteritems():
                element = etree.SubElement(resource, 'Property', name=prop_name, value=prop['value'])

                if prop.get('readonly', False):
                    element.set('readonly', 'true')


def write_mashup_wiring_tree(wiring, options):

    for op_id, operator in options['wiring']['operators'].iteritems():
        operator_element = etree.SubElement(wiring, 'Operator', id=op_id, name=operator['name'])

        for pref_name, pref in operator['preferences'].iteritems():
            element = etree.SubElement(operator_element, 'Preference', name=pref_name, value=pref['value'])

            if pref.get('readonly', False):
                element.set('readonly', 'true')

            if pref.get('hidden', False):
                element.set('hidden', 'true')

    for connection in options['wiring']['connections']:
        element = etree.SubElement(wiring, 'Connection')
        if connection.get('readonly', False):
            element.set('readonly', 'true')

        etree.SubElement(element, 'Source', type=connection['source']['type'], id=str(connection['source']['id']), endpoint=connection['source']['endpoint'])
        etree.SubElement(element, 'Target', type=connection['target']['type'], id=str(connection['target']['id']), endpoint=connection['target']['endpoint'])


def build_xml_document(options):

    template = etree.Element('Template', xmlns="http://wirecloud.conwet.fi.upm.es/ns/template#")
    desc = etree.Element('Catalog.ResourceDescription')
    template.append(desc)
    etree.SubElement(desc, 'Vendor').text = options.get('vendor')
    etree.SubElement(desc, 'Name').text = options.get('name')
    etree.SubElement(desc, 'Version').text = options.get('version')
    etree.SubElement(desc, 'DisplayName').text = options.get('display_name')
    etree.SubElement(desc, 'Author').text = options.get('author')
    etree.SubElement(desc, 'Mail').text = options.get('email')
    etree.SubElement(desc, 'Description').text = options.get('description')
    etree.SubElement(desc, 'ImageURI').text = options.get('image_uri', '')
    etree.SubElement(desc, 'iPhoneImageURI').text = options.get('iphone_image_uri', '')
    etree.SubElement(desc, 'WikiURI').text = options.get('doc_uri', '')

    if len(options['requirements']) > 0:
        requirements = etree.SubElement(desc, 'Requirements')
        for requirement in options['requirements']:
            etree.SubElement(requirements, 'Feature', name=requirement['name'])

    if options['type'] == 'mashup':
        resources = etree.SubElement(desc, 'IncludedResources')
        for pref_name, pref_value in options['preferences'].iteritems():
            etree.SubElement(resources, 'Preference', name=pref_name, value=pref_value)
    else:

        if len(options['preferences']) > 0:

            preferences_element = etree.SubElement(template, 'Platform.Preferences')
            for pref in options['preferences']:
                pref_element = etree.SubElement(preferences_element, 'Preference',
                    name=pref['name'],
                    type=pref['type'],
                    label=pref['label'],
                    description=pref['description'],
                    readonly=str(pref['readonly']).lower(),
                    default=pref['default_value'])

                if pref['secure']:
                    pref_element.set('secure', 'true')

                if pref['type'] == 'list':
                    for option in pref['options']:
                        etree.SubElement(pref_element, 'Option', label=option['label'], value=option['value'])

                if pref['value'] is not None:
                    pref_element.set('value', pref['value'])

        if len(options['properties']) > 0:

            properties_element = etree.SubElement(template, 'Platform.StateProperties')
            for prop in options['properties']:
                etree.SubElement(properties_element, 'Property',
                    name=prop['name'],
                    type=prop['type'],
                    label=prop['label'],
                    description=prop['description'],
                    default=prop['default_value'],
                    secure=str(prop['secure']).lower())

    if options['type'] == 'mashup':
        write_mashup_tree(resources, options)

    # Wiring info
    wiring = etree.SubElement(template, 'Platform.Wiring')

    for output_endpoint in options['wiring']['outputs']:
        etree.SubElement(wiring, 'OutputEndpoint',
                name=output_endpoint['name'],
                type=output_endpoint['type'],
                label=output_endpoint['label'],
                description=output_endpoint['description'],
                friendcode=output_endpoint['friendcode'])

    for input_endpoint in options['wiring']['inputs']:
        etree.SubElement(wiring, 'InputEndpoint',
                name=input_endpoint['name'],
                type=input_endpoint['type'],
                label=input_endpoint['label'],
                description=input_endpoint['description'],
                actionlabel=input_endpoint['actionlabel'],
                friendcode=input_endpoint['friendcode'])

    if options['type'] == 'mashup':
        write_mashup_wiring_tree(wiring, options)
    else:
        # Widget code
        link = etree.SubElement(template, 'Platform.Link')
        xhtml = etree.SubElement(link, 'XHTML', href=options['code_url'])
        xhtml.set('content-type', options['code_content_type'])
        xhtml.set('charset', options['code_charset'])
        if options['code_cacheable'] is False:
            xhtml.set('cacheable', 'false')
        if options['code_uses_platform_style']:
            xhtml.set('use-platform-style', 'true')

        # Widget rendering
        etree.SubElement(template, 'Platform.Rendering', width=options['widget_width'], height=options['widget_height'])

    # Translations
    if len(options['translations']) > 0:

        translations_element = etree.SubElement(template, 'Translations', default=options['default_lang'])

        for lang, catalogue in options['translations'].iteritems():
            catalogue_element = etree.SubElement(translations_element, 'Translation', lang=lang)

            for msg_name, msg in catalogue.iteritems():
                msg_element = etree.SubElement(catalogue_element, 'msg', name=msg_name)
                msg_element.text = msg

    return template


def write_xml_description(options):

    doc = build_xml_document(options)
    return etree.tostring(doc, method='xml', xml_declaration=True, encoding="UTF-8", pretty_print=True)
