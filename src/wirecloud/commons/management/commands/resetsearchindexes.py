# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

from django.core.management.base import CommandError, BaseCommand
from django.core.management import call_command
from django.utils.translation import ugettext_lazy as _


class Command(BaseCommand):

    help = 'Resets WireCloud search indexes (deprecated, please use rebuild_index instead)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--indexes',
            action='store', dest='indexes', default='',
            help="Indexes to reset. All by default (No supported by haystack, available only for giving an error message about this backward incompatible change)."
        )
        parser.add_argument(
            '--noinput',
            action='store_false', dest='interactive',
            help="Do NOT prompt the user for input of any kind."
        )

    def handle(self, *args, **options):
        if options['indexes'] != '':
            raise CommandError(_("The indexes argument is not supported anymore."))

        call_command("rebuild_index", interactive=options['interactive'])
