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

from wirecloud.platform.models import Workspace
from wirecloud.platform.workspace.utils import create_workspace


INITIAL_HOME_DASHBOARD_FILE = os.path.join(os.path.dirname(__file__), 'initial_home_dashboard.wgt')


class Command(BaseCommand):
    help = 'Adds one or more packaged mashable application components into the catalogue'

    def _handle(self, *args, **options):
        if len(args) > 0:
            raise CommandError(_('Wrong number of arguments'))

        self.verbosity = int(options.get('verbosity', 1))

        with atomic():
            wirecloud_user, created = User.objects.get_or_create(username='wirecloud', defaults={'password': '!'})

            if not Workspace.objects.filter(creator__username="wirecloud", name="home").exists():
                with open(INITIAL_HOME_DASHBOARD_FILE, 'rb') as f:
                    workspace = create_workspace(wirecloud_user, f)
                    workspace.public = True
                    workspace.save()

    def handle(self, *args, **options):
        try:
            default_locale = locale.getdefaultlocale()[0][:2]
        except TypeError:
            default_locale = None

        with override(default_locale):
            return self._handle(*args, **options)

    def log(self, msg, level=2):
        """
        Small log helper
        """
        if self.verbosity >= level:
            self.stdout.write(msg)
