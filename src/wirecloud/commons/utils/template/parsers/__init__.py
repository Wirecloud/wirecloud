# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from copy import deepcopy
from urllib.parse import urljoin

from wirecloud.commons.utils.template.base import ObsoleteFormatError, TemplateFormatError, TemplateParseException
from wirecloud.commons.utils.template.parsers.json import JSONTemplateParser
from wirecloud.commons.utils.template.parsers.xml import ApplicationMashupTemplateParser
from wirecloud.commons.utils.template.parsers.rdf import RDFTemplateParser


__all__ = ('ObsoleteFormatError', 'TemplateFormatError', 'TemplateParseException', 'TemplateParser')


BASIC_URL_FIELDS = ['doc', 'image', 'smartphoneimage']


def absolutize_url_field(value, base_url):
    value = value.strip()
    if value != '':
        value = urljoin(base_url, value)

    return value


class TemplateParser(object):

    _doc = None
    _parser = None
    parsers = (ApplicationMashupTemplateParser, JSONTemplateParser, RDFTemplateParser)

    def __init__(self, template, base=None):

        self.base = base

        for parser in self.parsers:
            try:
                self._parser = parser(template)
                # We have found a valid parser for this document, stop
                # searching
                break
            except TemplateParseException:
                # A TemplateParseException means that the document uses the
                # format associated with the parser (except when the
                # ObsoleteFormatError is raised), but that something is not
                # correct
                raise
            except:
                # Any other exception means that the document cannot be read
                # by the current parser, try the next one
                pass

        if self._parser is None:
            raise TemplateFormatError('No valid parser found')

        self._parser._init()

    def set_base(self, base):
        self.base = base

    def get_resource_type(self):
        return self._parser.get_resource_type()

    def get_resource_name(self):
        return self._parser.get_resource_name()

    def get_resource_vendor(self):
        return self._parser.get_resource_vendor()

    def get_resource_version(self):
        return self._parser.get_resource_version()

    def get_resource_info(self):

        return self._parser.get_resource_info()

    def get_absolute_url(self, url, base=None):

        if base is None:
            base = self.base

        return urljoin(base, url)

    def get_resource_processed_info(self, base=None, lang=None, process_urls=True, translate=True, process_variables=False):
        info = deepcopy(self.get_resource_info())

        if translate and lang is None:
            from django.utils import translation
            lang = translation.get_language()

        variables = {}
        if info['type'] in ('widget', 'operator'):
            for pref in info['preferences']:
                variables[pref['name']] = pref
            for prop in info['properties']:
                variables[prop['name']] = prop
            for inputendpoint in info['wiring']['inputs']:
                variables[inputendpoint['name']] = inputendpoint
            for outputendpoint in info['wiring']['outputs']:
                variables[outputendpoint['name']] = outputendpoint

        # process translations
        if translate and len(info['translations']) > 0:

            translation = info['translations'][info['default_lang']]
            if lang in info['translations']:
                translation.update(info['translations'][lang])

            for index in translation:
                value = translation[index]
                usages = info['translation_index_usage'][index]
                for use in usages:
                    if use['type'] == 'resource':
                        info[use['field']] = info[use['field']].replace('__MSG_' + index + '__', value)
                    elif use['type'] in ('vdef', 'inputendpoint', 'outputendpoint'):
                        variable = variables[use['variable']]
                        for field in variable:
                            if isinstance(variable[field], str):
                                variable[field] = variable[field].replace('__MSG_' + index + '__', value)
                    elif use['type'] == 'upo':
                        variable = variables[use['variable']]
                        for option in variable['options']:
                            for field in option:
                                if isinstance(option[field], str):
                                    option[field] = option[field].replace('__MSG_' + index + '__', value)
        del info['translations']
        del info['translation_index_usage']

        # Provide a fallback for the title
        if info['title'] == '':
            info['title'] = info['name']

        # Process resource variables
        if process_variables and info['type'] in ('widget', 'operator'):

            info['variables'] = {
                'all': {},
                'preferences': {},
                'properties': {},
            }

            for vardef in info['preferences']:
                info['variables']['all'][vardef['name']] = vardef
                info['variables']['preferences'][vardef['name']] = vardef

            for vardef in info['properties']:
                info['variables']['all'][vardef['name']] = vardef
                info['variables']['properties'][vardef['name']] = vardef

        if process_urls is False:
            return info

        if base is None:
            base = self.base

        # process url fields
        for field in BASIC_URL_FIELDS:
            info[field] = absolutize_url_field(info[field], base)

        if info['type'] == 'widget':
            info['contents']['src'] = absolutize_url_field(info['contents']['src'], base)
            for altcontent in info['altcontents']:
                altcontent['src'] = absolutize_url_field(altcontent['src'], base)
        elif info['type'] == 'operator':
            info['js_files'] = [absolutize_url_field(js_file, base) for js_file in info['js_files']]

        return info

    def get_resource_dependencies(self):

        dependencies = set()

        info = self.get_resource_info()
        if info['type'] != 'mashup':
            return dependencies

        for tab_entry in info['tabs']:
            for resource in tab_entry['resources']:
                dependencies.add('/'.join([resource['vendor'], resource['name'], resource['version']]))

        for id_, op in info['wiring']['operators'].items():
            dependencies.add(op['name'])

        return dependencies
