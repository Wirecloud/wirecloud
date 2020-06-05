# -*- coding: utf-8 -*-

# Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from optparse import make_option
import os

from django.core.management.base import CommandError

from wirecloud.commons.utils.commands import BaseCommand
from wirecloud.commons.utils.template.parsers import TemplateParser
from wirecloud.commons.utils.template.writers import json, rdf, xml


class ConvertCommand(BaseCommand):
    args = '<source_widget_descriptor> [dest_file]'
    help = 'Converts a widget description from one format to another'

    option_list = BaseCommand.option_list + (
        make_option(
            '-d', '--dest-format',
            action='store',
            dest='dest_format',
            default='rdf',
            help='Specifies the output serialization format for the mashable application component description. Available options are: xml and rdf. Default: rdf.'
        ),
        make_option(
            '', '--rdf-format',
            action='store',
            dest='rdf_format',
            default='pretty-xml',
            help='Specifies the output rdf serialization format fo the mashable application component description. This option only will take effect if the output serialization format is rdf. Available options are: pretty-xml, xml, turtle and n3. Default: pretty-xml.'
        ),
    )

    def handle(self, *args, **options):
        if len(args) < 1 or len(args) > 2:
            raise CommandError('Wrong number of arguments')

        if options['dest_format'] not in ('json', 'rdf', 'xml'):
            raise CommandError('Invalid dest format: %s' % options['dest_format'])

        try:
            template_file = open(args[0], "rb")
            template_contents = template_file.read()
            template_file.close()
            parsed_template = TemplateParser(template_contents)
            template_info = parsed_template.get_resource_info()
        except IOError as e:
            msg = 'Error opening description file: %s' % os.strerror(e.errno)
            raise CommandError(msg)

        if options['dest_format'] == 'rdf':
            converted_template = rdf.write_rdf_description(template_info, format=options['rdf_format'])
        elif options['dest_format'] == 'json':
            converted_template = json.write_json_description(template_info)
        else:  # if options['dest_format'] == 'xml':
            converted_template = xml.write_xml_description(template_info)

        if len(args) == 2:
            with open(args[1], "wb") as output_file:
                output_file.write(converted_template.encode('utf-8'))
        else:
            self.stdout.write(converted_template)
