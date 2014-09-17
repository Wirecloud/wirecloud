# -*- coding: utf-8 -*-

# Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

import os
from optparse import make_option

from django.core.management.base import CommandError, NoArgsCommand
from django.utils.six.moves import input
from django.utils.translation import ugettext_lazy as _

from wirecloud.commons.searchers import get_available_search_engines, get_search_engine, is_available


class Command(NoArgsCommand):

    help = 'Resets search indexes'
    option_list = NoArgsCommand.option_list + (
        make_option('--indexes',
            action='store', dest='indexes', default='', type="string",
            help="Indexes to reset. All by default"),
        make_option('--noinput',
            action='store_false', dest='interactive', default=True,
            help="Do NOT prompt the user for input of any kind."),
    )

    update_start_message = _('Reseting "%s" index')
    update_success_message = _('The "%s" index was updated successfully')
    nonavailable_indexes_message = _('The following indexes are not available: %s')

    def handle_noargs(self, **options):

        self.interactive = options['interactive']
        self.verbosity = int(options.get('verbosity', 1))

        from django.conf import settings

        dirname = settings.WIRECLOUD_INDEX_DIR
        if options['indexes'] == '':
            indexes = [search_engine.indexname for search_engine in get_available_search_engines()]
        else:
            indexes = options['indexes'].split(',')

            nonavailable_indexes = []
            for index in indexes:
                if not is_available(index):
                    nonavailable_indexes.append(index)

            if len(nonavailable_indexes) > 0:
                raise CommandError(self.nonavailable_indexes_message % nonavailable_indexes)

        if os.path.exists(dirname):
            message = ['\n']
            message.append(
                'You have requested to reset indexes found in the location\n'
                'specified in your settings:\n\n'
                '    %s\n\n' % dirname
            )
            message.append('This will DELETE EXISTING FILES!\n')
            message.append(
                'Are you sure you want to do this?\n\n'
                "Type 'yes' to continue, or 'no' to cancel: "
            )

            if self.interactive and input(''.join(message)) != 'yes':
                raise CommandError("Reset search indexes cancelled.")

        else:
            os.mkdir(dirname)

        for indexname in indexes:

            self.log(self.update_start_message % indexname)

            search_engine = get_search_engine(indexname)
            search_engine.clear_index()

            for resource in search_engine.get_model().objects.all():
                self.log('    ' + _('Adding %s\n') % resource)
                search_engine.add_resource(resource)

            self.log(self.update_success_message % indexname)


    def log(self, msg, level=2):
        """
        Small log helper
        """
        if self.verbosity >= level:
            self.stdout.write(msg)
