# -*- coding: utf-8 -*-

# Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.contrib.auth.models import User, Group
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError
from django.utils.translation import ugettext as _

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.catalogue.utils import delete_resource
from wirecloud.catalogue.views import add_packaged_resource
from wirecloud.commons.utils.template import TemplateParser
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.localcatalogue.utils import install_resource_to_user, install_resource_to_group, install_resource_to_all_users


class Command(BaseCommand):
    args = '<file.wgt>...'
    help = 'Adds a packaged resource into the catalogue'
    option_list = BaseCommand.option_list + (
        make_option('-d', '--deploy-only',
            action='store_true',
            dest='deploy_only',
            default=False),
        make_option('-u', '--users',
            action='store',
            type='string',
            dest='users',
            default=''),
        make_option('-g', '--groups',
            action='store',
            type='string',
            dest='groups',
            default=''),
        make_option('-p', '--public',
            action='store_true',
            dest='public',
            default=False),
    )

    def handle(self, *args, **options):
        if len(args) < 1:
            raise CommandError(_('Wrong number of arguments'))

        self.verbosity = int(options.get('verbosity', 1))

        users = []
        groups = []
        public = options['public']
        if not options['deploy_only']:

            users_string = options['users'].strip()
            if users_string != '':
                for username in users_string.split(','):
                    users.append(User.objects.get(username=username))

            groups_string = options['groups'].strip()
            if groups_string != '':
                for groupname in groups_string.split(','):
                    groups.append(Group.objects.get(name=groupname))

        for file_name in args:
            try:
                f = open(file_name, 'rb')
                wgt_file = WgtFile(f)
            except:
                self.log(_('Failed to read from %(file_name)s') % {'file_name': file_name}, level=1)
                continue

            try:
                template_contents = wgt_file.get_template()
                template = TemplateParser(template_contents)
                if options['deploy_only']:
                    add_packaged_resource(f, None, wgt_file=wgt_file, template=template, deploy_only=True)
                else:
                    for user in users:
                        install_resource_to_user(user, file_contents=wgt_file)

                    for group in groups:
                        install_resource_to_group(group, file_contents=wgt_file)

                    if public:
                        install_resource_to_all_users(file_contents=wgt_file)

                wgt_file.close()
                f.close()
                self.log(_('Successfully imported %(name)s widget') % {'name': template.get_resource_name()}, level=1)
            except IntegrityError:
                self.log(_('Version %(version)s of the %(name)s widget (from %(vendor)s) already exists') % {
                    'name': template.get_resource_name(),
                    'version': template.get_resource_version(),
                    'vendor': template.get_resource_vendor(),
                }, level=1)
            except:
                self.log(_('Failed to import widget from %(file_name)s') % {'file_name': file_name}, level=1)

    def log(self, msg, level=2):
        """
        Small log helper
        """
        if self.verbosity >= level:
            self.stdout.write(msg)
