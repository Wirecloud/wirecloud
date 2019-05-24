# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

from django.utils.translation import ugettext as _
from lxml import etree

from wirecloud.commons.utils.template.base import stringify_contact_info


def processOption(options, field, required=False, type='string'):
    if options.get(field, None) is None:
        if required:
            raise Exception(_('Missing %s option') % field)
        else:
            return None
    else:
        if type == 'string':
            return str(options[field])
        elif type == 'boolean':
            return 'true' if options[field] else 'false'
        elif type == 'people':
            return stringify_contact_info(options[field])


def addAttribute(options, element, field, attr_name=None, default='', ignore_default=True, **other_options):
    if attr_name is None:
        attr_name = field

    value = processOption(options, field, **other_options)
    if ignore_default and value == default:
        return
    elif value is not None:
        element.set(attr_name, value)


def addAttributes(options, element, attrs, **other_options):
    for attr in attrs:
        addAttribute(options, element, attr, **other_options)


def addElement(options, element, field, attr_name=None, default='', ignore_default=True, **other_options):
    if attr_name is None:
        attr_name = field

    value = processOption(options, field, **other_options)
    if ignore_default and value == default:
        return
    elif value is not None:
        new_element = etree.SubElement(element, attr_name)
        new_element.text = value


def addElements(options, element, attrs, **other_options):
    for attr in attrs:
        addElement(options, element, attr, **other_options)


def addPreferenceValues(resource, preferences):
    for pref_name, pref in preferences.items():
        element = etree.SubElement(resource, 'preferencevalue', name=pref_name)
        addAttribute(pref, element, 'value', type='string', default=None, required=False)
        addAttributes(pref, element, ('readonly', 'hidden'), default='false', type='boolean')


def write_mashup_tree(doc, resources, options):

    # Params
    if len(options['params']) > 0:
        preferences = etree.SubElement(doc, 'preferences')
        for pref in options['params']:
            pref_element = etree.SubElement(preferences, 'preference', name=pref['name'])
            addAttributes(pref, pref_element, ('type', 'label', 'description', 'default'))
            addAttribute(pref, pref_element, 'readonly', default='false', type='boolean')
            addAttribute(pref, pref_element, 'required', default='true', type='boolean')

            if pref['value'] is not None:
                pref_element.set('value', pref['value'])

    # Embedded resources
    if len(options['embedded']) > 0:
        embedded_element = etree.SubElement(doc, 'embedded')
        for resource in options['embedded']:
            etree.SubElement(
                embedded_element, 'resource',
                vendor=resource['vendor'],
                name=resource['name'],
                version=resource['version'],
                src=resource['src']
            )

    # Tabs & resources
    for tab_index, tab in enumerate(options['tabs']):
        tabElement = etree.SubElement(resources, 'tab', name=tab['name'], id=str(tab_index))

        tabTitle = tab.get('title', '')
        if tabTitle is not None and tabTitle.strip() != "":
            tabElement.set('title', tabTitle.strip())

        for preference_name, preference_value in tab['preferences'].items():
            etree.SubElement(tabElement, 'preferencevalue', name=preference_name, value=preference_value)

        for iwidget in tab['resources']:
            resource = etree.SubElement(tabElement, 'resource', id=iwidget['id'], vendor=iwidget['vendor'], name=iwidget['name'], version=iwidget['version'], title=iwidget['title'])

            if iwidget.get('readonly', False):
                resource.set('readonly', 'true')

            etree.SubElement(resource, 'position', x=str(iwidget['position']['x']), y=str(iwidget['position']['y']), z=str(iwidget['position']['z']))
            rendering = etree.SubElement(resource, 'rendering')
            addAttributes(iwidget['rendering'], rendering, ('height', 'width', 'layout'), required=True)
            addAttributes(iwidget['rendering'], rendering, ('minimized', 'fulldragboard'), default='false', type='boolean')
            addAttributes(iwidget['rendering'], rendering, ('titlevisible',), default='true', type='boolean')

            addPreferenceValues(resource, iwidget['preferences'])

            for prop_name, prop in iwidget.get('properties', {}).items():
                element = etree.SubElement(resource, 'variablevalue', name=prop_name)

                if prop.get('value', None) is not None:
                    element.set('value', prop['value'])

                if prop.get('readonly', False):
                    element.set('readonly', 'true')


def write_mashup_wiring_tree(mashup, options):

    wiring = etree.SubElement(mashup, 'wiring')

    wiring.set('version', options['wiring']['version'])

    for op_id, operator in options['wiring']['operators'].items():
        (vendor, name, version) = operator['name'].split('/')
        operator_element = etree.SubElement(wiring, 'operator', id=op_id, vendor=vendor, name=name, version=version)
        addPreferenceValues(operator_element, operator['preferences'])

    for connection in options['wiring']['connections']:
        element = etree.SubElement(wiring, 'connection')
        if connection.get('readonly', False):
            element.set('readonly', 'true')

        etree.SubElement(element, 'source', type=connection['source']['type'], id=str(connection['source']['id']), endpoint=connection['source']['endpoint'])
        etree.SubElement(element, 'target', type=connection['target']['type'], id=str(connection['target']['id']), endpoint=connection['target']['endpoint'])

    visual_description = etree.SubElement(wiring, 'visualdescription')
    write_mashup_wiring_visualdescription_tree(visual_description, options['wiring']['visualdescription'])


def write_mashup_wiring_visualdescription_tree(target, visualdescription):

    write_mashup_wiring_components_tree(target, 'operator', visualdescription['components'])
    write_mashup_wiring_components_tree(target, 'widget', visualdescription['components'])
    write_mashup_wiring_connections_tree(target, visualdescription['connections'])
    write_mashup_wiring_behaviours_tree(target, visualdescription['behaviours'])


def write_mashup_wiring_behaviours_tree(target, behaviours):

    for behaviour in behaviours:
        behaviour_element = etree.SubElement(target, 'behaviour', title=behaviour['title'], description=behaviour['description'])

        write_mashup_wiring_components_tree(behaviour_element, 'operator', behaviour['components'])
        write_mashup_wiring_components_tree(behaviour_element, 'widget', behaviour['components'])
        write_mashup_wiring_connections_tree(behaviour_element, behaviour['connections'])


def write_mashup_wiring_connections_tree(target, connections):

    for connection in connections:
        connectionview = etree.SubElement(target, 'connection', sourcename=connection['sourcename'], targetname=connection['targetname'])

        if connection.get('sourcehandle', 'auto') != 'auto':
            etree.SubElement(connectionview, 'sourcehandle', x=str(connection['sourcehandle']['x']), y=str(connection['sourcehandle']['y']))

        if connection.get('targethandle', 'auto') != 'auto':
            etree.SubElement(connectionview, 'targethandle', x=str(connection['targethandle']['x']), y=str(connection['targethandle']['y']))


def write_mashup_wiring_components_tree(target, type, components):

    for c_id, component in components[type].items():
        componentview = etree.SubElement(target, 'component', id=str(c_id), type=type)

        if component.get('collapsed', False):
            componentview.set('collapsed', 'true')

        if 'position' in component:
            etree.SubElement(componentview, 'position', x=str(component['position']['x']), y=str(component['position']['y']))

        if 'endpoints' in component:
            sources = etree.SubElement(componentview, 'sources')

            for endpointname in component['endpoints']['source']:
                endpoint = etree.SubElement(sources, 'endpoint')
                endpoint.text = endpointname

            targets = etree.SubElement(componentview, 'targets')

            for endpointname in component['endpoints']['target']:
                endpoint = etree.SubElement(targets, 'endpoint')
                endpoint.text = endpointname


def build_xml_document(options):

    if options.get('type') not in ('widget', 'operator', 'mashup'):
        raise Exception(_('Unsupported resource type: %s') % options.get('type'))

    template = etree.Element(options['type'], xmlns="http://wirecloud.conwet.fi.upm.es/ns/macdescription/1")
    template.set('vendor', options.get('vendor'))
    template.set('name', options.get('name'))
    template.set('version', options.get('version'))

    desc = etree.SubElement(template, 'details')
    addElements(options, desc, ('title', 'email', 'image', 'smartphoneimage', 'description', 'longdescription', 'homepage', 'doc', 'license', 'licenseurl', 'changelog', 'issuetracker'))
    addElements(options, desc, ('authors', 'contributors'), type='people')

    if len(options['requirements']) > 0:
        requirements = etree.SubElement(template, 'requirements')
        for requirement in options['requirements']:
            etree.SubElement(requirements, 'feature', name=requirement['name'])

    if options['type'] == 'mashup':
        resources = etree.SubElement(template, 'structure')
        for pref_name, pref_value in options['preferences'].items():
            etree.SubElement(resources, 'preferencevalue', name=pref_name, value=pref_value)
    else:

        if len(options['preferences']) > 0:

            preferences_element = etree.SubElement(template, 'preferences')
            for pref in options['preferences']:
                pref_element = etree.SubElement(preferences_element, 'preference', name=pref['name'])
                addAttributes(pref, pref_element, ('type', 'label', 'description', 'default'))
                addAttributes(pref, pref_element, ('readonly', 'secure'), default='false', type='boolean')

                if pref['type'] == 'list':
                    for option in pref['options']:
                        etree.SubElement(pref_element, 'option', label=option['label'], value=option['value'])

                if pref['value'] is not None:
                    pref_element.set('value', pref['value'])

        if len(options['properties']) > 0:

            properties_element = etree.SubElement(template, 'persistentvariables')
            for prop in options['properties']:
                prop_element = etree.SubElement(properties_element, 'variable', name=prop['name'])
                addAttributes(prop, prop_element, ('type', 'label', 'description', 'description', 'default'))
                addAttributes(prop, prop_element, ('secure', 'multiuser'), default='false', type='boolean')

    if options['type'] == 'mashup':
        write_mashup_tree(template, resources, options)

    # Wiring info
    wiring = etree.SubElement(template, 'wiring')

    for output_endpoint in options['wiring']['outputs']:
        endpoint = etree.SubElement(wiring, 'outputendpoint', name=output_endpoint['name'])
        addAttributes(output_endpoint, endpoint, ('type', 'label', 'description', 'friendcode'))

    for input_endpoint in options['wiring']['inputs']:
        endpoint = etree.SubElement(wiring, 'inputendpoint', name=input_endpoint['name'])
        addAttributes(input_endpoint, endpoint, ('type', 'label', 'description', 'actionlabel', 'friendcode'))

    if options['type'] == 'mashup':
        # Mashup
        write_mashup_wiring_tree(resources, options)
    elif options['type'] == 'widget':
        # Widget code
        xhtml = etree.SubElement(template, 'contents', src=options['contents']['src'])
        addAttribute(options['contents'], xhtml, 'contenttype', default='text/html')
        addAttribute(options['contents'], xhtml, 'charset', default='utf-8')
        addAttribute(options['contents'], xhtml, 'cacheable', default='true', type='boolean')
        addAttribute(options['contents'], xhtml, 'useplatformstyle', default='false', type='boolean')

        for altcontents in options.get('altcontents', ()):
            altcontents_element = etree.SubElement(xhtml, 'altcontents', scope=altcontents['scope'], src=altcontents['src'])
            addAttribute(altcontents, altcontents_element, 'contenttype', default='text/html')
            addAttribute(altcontents, altcontents_element, 'charset', default='utf-8')

        # Widget rendering
        etree.SubElement(template, 'rendering', width=options['widget_width'], height=options['widget_height'])
    else:
        # Operator
        scripts = etree.SubElement(template, 'scripts')
        for script in options['js_files']:
            etree.SubElement(scripts, 'script', src=script)

    # Translations
    if len(options['translations']) > 0:

        translations_element = etree.SubElement(template, 'translations', default=options['default_lang'])

        for lang, catalogue in options['translations'].items():
            catalogue_element = etree.SubElement(translations_element, 'translation', lang=lang)

            for msg_name, msg in catalogue.items():
                msg_element = etree.SubElement(catalogue_element, 'msg', name=msg_name)
                msg_element.text = msg

    return template


def write_xml_description(options, raw=False):

    if options['type'] not in ('widget', 'operator', 'mashup'):
        raise Exception('Unsupported resource type: ' + options['type'])

    doc = build_xml_document(options)
    return doc if raw is True else etree.tostring(doc, method='xml', xml_declaration=True, encoding="UTF-8", pretty_print=True).decode('utf-8')
