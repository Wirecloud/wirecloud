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
import subprocess

from django.core.management.base import CommandError
from django.core.management.commands.startproject import Command
from django.utils.safestring import mark_safe

import wirecloud.commons
from wirecloud.commons.utils.commands import BaseCommand


def exec_external_cmd(cmd):
    result = subprocess.call(cmd, shell=True)
    if result:
        raise CommandError('Error executing external command')


class StartprojectCommand(BaseCommand):

    args = "[name] [optional destination directory]"
    option_list = BaseCommand.option_list + (
        make_option('-t', '--type',
            action='store',
            dest='type',
            default='platform'),
        make_option('-q', '--quick-start',
            action='store_true',
            dest='quick_start'),
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
            'db_engine': mark_safe("'django.db.backends.'"),
            'db_name': mark_safe("''"),
        }

        if options['quick_start']:
            internal_options['db_engine'] = mark_safe("'django.db.backends.sqlite3'")
            internal_options['db_name'] = mark_safe("path.join(BASEDIR, '%s.db')" % project_name)

        command = Command()
        command.handle(project_name, target, *(), **internal_options)

        if options['quick_start']:

            os.chdir(project_name)
            exec_external_cmd('python manage.py syncdb --migrate --noinput')
            exec_external_cmd('python manage.py loaddata wirecloud_quick_start')
            exec_external_cmd('python manage.py collectstatic --noinput')
            exec_external_cmd('python manage.py compress --force')
