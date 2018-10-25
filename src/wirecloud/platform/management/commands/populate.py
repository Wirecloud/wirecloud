# -*- coding: utf-8 -*-

# Copyright (c) 2016-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

import locale

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db.transaction import atomic
from django.utils.translation import override

from wirecloud.platform.plugins import get_plugins


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

            for plugin in get_plugins():
                result = plugin.populate(wirecloud_user, self.log)
                updated = updated or result

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
