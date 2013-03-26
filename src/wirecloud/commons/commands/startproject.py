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
import os

from django.core.management.base import CommandError
from django.core.management.commands.startproject import Command

import wirecloud.commons
from wirecloud.commons.utils.commands import BaseCommand

class StartprojectCommand(BaseCommand):

    args = "[name] [optional destination directory]"
    option_list = BaseCommand.option_list + (
        make_option('-t', '--type',
            action='store',
            dest='type',
            default='platform'),
    )

    def handle(self, project_name=None, target=None, *args, **options):
        if project_name is None:
            raise CommandError("you must provide a project name")

        if options['type'] not in ('platform', 'catalogue'):
            raise CommandError("invalid project type")

        template = os.path.join(os.path.dirname(wirecloud.commons.__file__), 'conf', options['type']  + '_project_template')
        internal_options = {
            'template': template,
            'extensions': ('py',),
            'files': [],
            'verbosity': options.get('verbosity'),
        }
        command = Command()
        return command.handle(project_name, target, *(), **internal_options)
