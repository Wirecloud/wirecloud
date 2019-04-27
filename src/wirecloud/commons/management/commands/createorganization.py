# -*- coding: utf-8 -*-

# Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.

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

from django.core.management.base import CommandError, BaseCommand
from django.utils.translation import override, ugettext_lazy as _

from wirecloud.commons.models import Organization


class Command(BaseCommand):

    help = 'Creates new Organizations'

    update_success_message = _('Organization "%s" created successfully')

    def add_arguments(self, parser):
        parser.add_argument(
            'name',
            action='store', default='',
            help="Organization Name"
        )

    def _handle(self, *args, **options):

        self.verbosity = int(options.get('verbosity', 2))

        org_name = options['name']
        if not Organization.objects.is_available(org_name):
            raise CommandError(_("Orgranization Name is already taken."))

        Organization.objects.create_organization(org_name)
        self.log(self.update_success_message % org_name)

    def handle(self, *args, **options):
        try:
            default_locale = locale.getdefaultlocale()[0][:2]
        except TypeError:
            default_locale = None

        with override(default_locale):
            self._handle(*args, **options)

    def log(self, msg, level=1):
        """
        Small log helper
        """
        if self.verbosity >= level:
            self.stdout.write(msg)
