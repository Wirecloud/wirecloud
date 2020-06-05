# -*- coding: utf-8 -*-

# Copyright (c) 2013-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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
import subprocess
import sys

import django
from django.core.management.base import CommandError
from django.core.management.commands.startproject import Command
from django.utils.safestring import mark_safe

import wirecloud.commons
from wirecloud.commons.utils.commands import BaseCommand


def exec_external_python_cmd(cmd):
    if sys.executable in ('', None):
        python_executable = 'python'
    else:
        python_executable = sys.executable
    result = subprocess.call(python_executable + ' ' + cmd, shell=True)
    if result:
        raise CommandError('Error executing external command')


class StartprojectCommand(BaseCommand):

    args = "[name] [optional destination directory]"
    option_list = BaseCommand.option_list + (
        make_option(
            '-t', '--type',
            action='store',
            dest='type',
            default='platform'
        ),
        make_option(
            '-q', '--quick-start',
            action='store_true',
            dest='quick_start'
        ),
    )

    def handle(self, project_name=None, target=None, *args, **options):
        if project_name is None:
            raise CommandError("you must provide a project name")

        if options['type'] not in ('platform', 'catalogue'):
            raise CommandError("invalid project type")

        template = os.path.join(os.path.dirname(wirecloud.commons.__file__), 'conf', options['type'] + '_project_template')
        internal_options = {
            'template': template,
            'extensions': ('py',),
            'files': [],
            'verbosity': int(options.get('verbosity')),
            'db_engine': mark_safe("'django.db.backends.'"),
            'db_name': mark_safe("''"),
        }

        if options['quick_start']:
            internal_options['db_engine'] = mark_safe("'django.db.backends.sqlite3'")
            internal_options['db_name'] = mark_safe("path.join(BASEDIR, '%s.db')" % project_name)

        command = Command()
        internal_options.update({"name": project_name, "directory": target})
        command.handle(**internal_options)

        if options['quick_start']:

            os.chdir(project_name)
            exec_external_python_cmd('manage.py migrate --noinput')
            exec_external_python_cmd('manage.py populate')
            exec_external_python_cmd('manage.py loaddata wirecloud_quick_start')
            exec_external_python_cmd('manage.py collectstatic --noinput')
