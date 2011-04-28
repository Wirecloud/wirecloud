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

import tarfile
import os


class Command(BaseCommand):
    args = '<target_file.tar.gz>'
    help = 'Export the deployment directory in a tar.gz file'

    def handle(self, *args, **options):
        if len(args) != 1:
            raise CommandError('Wrong number of arguments')

        if not args[0].endswith('tar.gz'):
            raise CommandError('The target file must be a tar.gz file')

        deployment_path = settings.GADGETS_DEPLOYMENT_DIR

        if not(os.access(deployment_path, os.R_OK)):
            raise CommandError('Can\'t read ' + deployment_path)

        if deployment_path.endswith(os.sep):
            deployment_path = deployment_path[:-1]
        deployment_path = deployment_path[:deployment_path.rindex(os.sep)]
        deployment_path = settings.GADGETS_DEPLOYMENT_DIR[
            len(deployment_path) + 1:]

        tar = tarfile.open(args[0], "w:gz")
        tar.add(settings.GADGETS_DEPLOYMENT_DIR, arcname=deployment_path)
        tar.close()

        print 'Successfully exported deployment as "%s"\n' % args[0]
