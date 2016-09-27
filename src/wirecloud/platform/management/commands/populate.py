# -*- coding: utf-8 -*-

# Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import unicode_literals

import locale
import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.db.transaction import atomic
from django.utils.translation import override, ugettext as _

from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.localcatalogue.utils import install_resource_to_user
from wirecloud.platform.models import CatalogueResource, Workspace
from wirecloud.platform.workspace.utils import create_workspace

BASE_PATH = os.path.dirname(__file__)
WORKSPACE_BROWSER = os.path.join(BASE_PATH, 'WireCloud_workspace-browser_0.1.1.wgt')
INITIAL_HOME_DASHBOARD_FILE = os.path.join(BASE_PATH, 'initial_home_dashboard.wgt')


class Command(BaseCommand):
    help = 'Populates WireCloud db providing the default dashboards and components'

    def _handle(self, *args, **options):

        updated = False
        self.verbosity = int(options.get('verbosity', 1))

        with atomic():
            wirecloud_user, created = User.objects.get_or_create(username='wirecloud', defaults={'password': '!'})
            if created:
                updated = True
                self.log('Creating a wirecloud user... DONE', 1)

            if not CatalogueResource.objects.filter(vendor="WireCloud", short_name="workspace-browser", version="0.1.1").exists():
                updated = True
                self.log('Installing the workspace-browser widget... ', 1, ending='')
                install_resource_to_user(wirecloud_user, file_contents=WgtFile(WORKSPACE_BROWSER))
                self.log('DONE', 1)

            if not Workspace.objects.filter(creator__username="wirecloud", name="home").exists():
                updated = True
                self.log('Creating a initial version of the wirecloud/home workspace... ', 1, ending='')
                with open(INITIAL_HOME_DASHBOARD_FILE, 'rb') as f:
                    workspace = create_workspace(wirecloud_user, f)
                    workspace.public = True
                    workspace.save()
                self.log('DONE', 1)

        if not updated:
            self.log('Already up-to-date.', 1)

    def handle(self, *args, **options):
        try:
            default_locale = locale.getdefaultlocale()[0][:2]
        except TypeError:
            default_locale = None

        with override(default_locale):
            return self._handle(*args, **options)

    def log(self, msg, level=2, **kwargs):
        """
        Small log helper
        """
        if self.verbosity >= level:
            self.stdout.write(msg, **kwargs)
            self.stdout.flush()
