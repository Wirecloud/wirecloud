# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

from optparse import make_option

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError
from django.utils.translation import ugettext as _

from wirecloud.platform.models import Widget
from wirecloud.platform.widget.utils import create_widget_from_wgt
from wirecloud.platform.widget.views import deleteWidget
from wirecloud.commons.utils.template import TemplateParser
from wirecloud.commons.utils.wgt import WgtFile


class FakeUser():

    def __init__(self, username):
        self.username = username


class Command(BaseCommand):
    args = '<file.wgt>...'
    help = 'Adds a packaged widget into the showcase'
    option_list = BaseCommand.option_list + (
        make_option('-d', '--deploy-only',
            action='store_true',
            dest='deploy_only',
            default=False),
        make_option('-r', '--reinstall',
            action='store_true',
            dest='reinstall',
            default=False),
    )

    def handle(self, *args, **options):
        if len(args) < 1:
            raise CommandError(_('Wrong number of arguments'))

        if not options['deploy_only']:
            user = User.objects.get(pk=1)
        else:
            user = FakeUser('admin')

        for file_name in args:
            try:
                wgt_file = WgtFile(file_name)
            except:
                print _('Failed to parse %(file_name)s') % {'file_name': file_name}
                continue

            try:
                template_contents = wgt_file.get_template()
                template = TemplateParser(template_contents)
                try:
                    create_widget_from_wgt(wgt_file, user, deploy_only=options['deploy_only'])
                except IntegrityError:
                    if not options['reinstall']:
                        raise
                    else:
                        deleteWidget(user, template.get_resource_name(),
                            template.get_resource_vendor(),
                            template.get_resource_version()
                        )
                        create_widget_from_wgt(wgt_file, user)

                wgt_file.close()
                print _('Successfully imported %(name)s widget') % {'name': template.get_resource_name()}
            except IntegrityError:
                print _('Version %(version)s of the %(name)s widget (from %(vendor)s) already exists') % {
                    'name': template.get_resource_name(),
                    'version': template.get_resource_version(),
                    'vendor': template.get_resource_vendor(),
                }
            except:
                print _('Failed to import widget from %(file_name)s') % {'file_name': file_name}
