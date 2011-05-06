# Copyright 2011 Yaco Sistemas <lgs@yaco.es>
#
# This file is part of EzWeb.

# EzWeb is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# EzWeb is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with EzWeb.  If not, see <http://www.gnu.org/licenses/>.

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from optparse import make_option
from shutil import rmtree

import tarfile
import os


class Command(BaseCommand):
    args = '<file.tar.gz>'
    help = 'Import a deployment directory from a tar file'
    option_list = BaseCommand.option_list + (make_option('-r', '--remove-old',
                                                         action='store_true',
                                                         dest='remove-old',
                                                         default=False),)

    def handle(self, *args, **options):
        if len(args) != 1:
            raise CommandError('Wrong number of arguments')

        deployment_path = settings.GADGETS_DEPLOYMENT_DIR

        if options['remove-old']:
            if os.access(deployment_path, os.W_OK):
                rmtree(deployment_path)
            else:
                raise CommandError('Can\'t remove old deployment at '
                                   + deployment_path)

        if deployment_path.endswith(os.sep):
            deployment_path = deployment_path[:-1]
        deployment_path = deployment_path[:deployment_path.rindex(os.sep)]
        deployment_path = settings.GADGETS_DEPLOYMENT_DIR[:len(deployment_path)]

        if not(os.access(deployment_path, os.W_OK)):
            raise CommandError('Can\'t write in ' + deployment_path)

        tar = tarfile.open(args[0], "r")
        tar.extractall(deployment_path)
        tar.close()

        print 'Successfully imported deployment from "%s"\n' % args[0]
