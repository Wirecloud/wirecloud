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

from copy import deepcopy
import urlparse

from wirecloud.commons.utils.template.base import TemplateParseException
from wirecloud.commons.utils.template.parsers.xml import WirecloudTemplateParser
from wirecloud.commons.utils.template.parsers.json import JSONTemplateParser
from wirecloud.commons.utils.template.parsers.rdf import RDFTemplateParser


__all__ = ('TemplateParseException', 'TemplateParser')


BASIC_URL_FIELDS = ['doc_uri', 'image_uri', 'iphone_image_uri']


def absolutize_url_field(value, base_url):
    value = value.strip()
    if value != '':
        value = urlparse.urljoin(base_url, value)

    return value


class TemplateParser(object):

    _doc = None
    _parser = None
    parsers = (WirecloudTemplateParser, JSONTemplateParser, RDFTemplateParser)

    def __init__(self, template, base=None):

        self.base = base

        for parser in self.parsers:
            try:
                self._parser = parser(template)
                break
            except:
                pass

        if self._parser is None:
            raise TemplateParseException('No valid parser found')

        self._parser._init()

    def typeText2typeCode(self, typeText):
        return self._parser.typeText2typeCode(typeText)

    def set_base(self, base):
        self.base = base

    def get_contents(self):
        return self._parser.get_contents()

    def get_resource_type(self):
        return self._parser.get_resource_type()

    def get_resource_uri(self):
        return self._parser.get_resource_uri()

    def get_resource_name(self):
        return self._parser.get_resource_name()

    def get_resource_vendor(self):
        return self._parser.get_resource_vendor()

    def get_resource_version(self):
        return self._parser.get_resource_version()

    def get_resource_basic_info(self):
        return self._parser.get_resource_basic_info()

    def get_resource_info(self):

        return self._parser.get_resource_info()

    def get_absolute_url(self, url, base=None):

        if base is None:
            base = self.base

        return urlparse.urljoin(base, url)

    def get_resource_processed_info(self, base=None, lang=None):
        info = deepcopy(self.get_resource_info())

        if base is None:
            base = self.base

        if lang is None:
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
        if len(info['translations']) > 0:

            translation = info['translations'][info['default_lang']]
            if lang in info['translations']:
                translation.update(info['translations'][lang])

            for index in translation:
                value = translation[index]
                usages = info['translation_index_usage'][index]
                for use in usages:
                    if use['type'] == 'resource':
                        info[use['field']] = info[use['field']].replace('__MSG_' + index + '__', value)
                    elif use['type'] == 'vdef':
                        variable = variables[use['variable']]
                        for field in variable:
                            if isinstance(variable[field], basestring):
                                variable[field] = variable[field].replace('__MSG_' + index + '__', value)
                    elif use['type'] == 'upo':
                        variable = variables[use['variable']]
                        for option in variable['options']:
                            for field in option:
                                if isinstance(option[field], basestring):
                                    option[field] = option[field].replace('__MSG_' + index + '__', value)
        del info['translations']
        del info['translation_index_usage']

        # process url fields
        for field in BASIC_URL_FIELDS:
            info[field] = absolutize_url_field(info[field], base)

        if info['type'] == 'widget':
            info['code_url'] = absolutize_url_field(info['code_url'], base)
        elif info['type'] == 'operator':
            info['js_files'] = [absolutize_url_field(js_file, base) for js_file in info['js_files']]

        return info
