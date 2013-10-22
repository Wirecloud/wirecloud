# -*- coding: utf-8 -*-

# Copyright 2013 Universidad Politécnica de Madrid

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

from optparse import make_option

from django.core.management.base import CommandError

from wirecloud.commons.utils.commands import BaseCommand
from wirecloud.commons.utils.template.parsers import TemplateParser
from wirecloud.commons.utils.template.writers import json, rdf

class ConvertCommand(BaseCommand):
    args = '<source_widget_descriptor> [dest_file]'
    help = 'Converts a widget description from one format to another'

    option_list = BaseCommand.option_list + (
        make_option('-d', '--dest-format',
            action='store',
            dest='dest_format',
            default='rdf'),
        make_option('', '--rdf-format',
            action='store',
            dest='rdf_format',
            default='pretty-xml'),
    )

    def handle(self, *args, **options):
        if len(args) < 1 or len(args) > 2:
            raise CommandError('Wrong number of arguments')

        if options['dest_format'] not in ('json', 'rdf'):
            raise CommandError('Invalid dest format: %s' % options['dest_format'])

        template_file = open(args[0], "rb")
        template_contents = template_file.read()
        template_file.close()
        parsed_template = TemplateParser(template_contents)
        template_info = parsed_template.get_resource_info()

        if options['dest_format'] == 'rdf':
            converted_template = rdf.write_rdf_description(template_info, format=options['rdf_format'])
        elif options['dest_format'] == 'json':
            converted_template = json.write_json_description(template_info)

        if len(args) == 2:
            output_file = open(args[1], "wb")
            output_file.write(converted_template)
            output_file.close()
        else:
            print(converted_template)
