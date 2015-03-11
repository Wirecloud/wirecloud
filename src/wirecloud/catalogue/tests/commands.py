# -*- coding: utf-8 -*-

# Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

import io
import os
import shutil
from tempfile import mkdtemp

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from mock import Mock, patch, DEFAULT
from whoosh import fields, index

from wirecloud.commons.searchers import get_available_search_engines


class AddToCatalogueCommandTestCase(TestCase):

    tags = ('wirecloud-commands', 'wirecloud-command-addtocatalogue')

    def setUp(self):

        self.options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}

    def test_addtocatalogue_command_no_args(self):

        args = []

        with self.assertRaises((CommandError, SystemExit)):
            call_command('addtocatalogue', *args, **self.options)

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_addtocatalogue_command_simplewgt_user(self):

        args = ['file.wgt']
        self.options['users'] = 'admin'

        try:
            with patch('__builtin__.open'):
                with patch.multiple('wirecloud.catalogue.management.commands.addtocatalogue',
                        add_packaged_resource=DEFAULT, install_resource_to_user=DEFAULT, install_resource_to_group=DEFAULT, install_resource_to_all_users=DEFAULT,
                        WgtFile=DEFAULT, TemplateParser=DEFAULT, User=DEFAULT, Group=DEFAULT, autospec=True) as context:
                    parser = Mock()
                    parser.get_resource_name.return_value = "MashableApplicationComponent1"
                    context['TemplateParser'].return_value = parser

                    # Make the call to addtocatalogue
                    call_command('addtocatalogue', *args, **self.options)

                    # Basic assert code
                    self.assertEqual(context['add_packaged_resource'].call_count, 0)
                    self.assertEqual(context['install_resource_to_user'].call_count, 1)
                    self.assertEqual(context['install_resource_to_group'].call_count, 0)
                    self.assertEqual(context['install_resource_to_all_users'].call_count, 0)

        except SystemExit:
            raise CommandError('')

        self.options['stdout'].seek(0)
        self.assertTrue("MashableApplicationComponent1" in self.options['stdout'].read())
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_addtocatalogue_command_simplewgt_group(self):

        args = ['file.wgt']
        self.options['groups'] = 'group1'

        try:
            with patch('__builtin__.open'):
                with patch.multiple('wirecloud.catalogue.management.commands.addtocatalogue',
                        add_packaged_resource=DEFAULT, install_resource_to_user=DEFAULT, install_resource_to_group=DEFAULT, install_resource_to_all_users=DEFAULT,
                        WgtFile=DEFAULT, TemplateParser=DEFAULT, User=DEFAULT, Group=DEFAULT, autospec=True) as context:
                    parser = Mock()
                    parser.get_resource_name.return_value = "MashableApplicationComponent1"
                    context['TemplateParser'].return_value = parser

                    # Make the call to addtocatalogue
                    call_command('addtocatalogue', *args, **self.options)

                    # Basic assert code
                    self.assertEqual(context['add_packaged_resource'].call_count, 0)
                    self.assertEqual(context['install_resource_to_user'].call_count, 0)
                    self.assertEqual(context['install_resource_to_group'].call_count, 1)
                    self.assertEqual(context['install_resource_to_all_users'].call_count, 0)

        except SystemExit:
            raise CommandError('')

        self.options['stdout'].seek(0)
        self.assertTrue("MashableApplicationComponent1" in self.options['stdout'].read())
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_addtocatalogue_command_simplewgt_public(self):

        args = ['file.wgt']
        self.options['public'] = True

        try:
            with patch('__builtin__.open'):
                with patch.multiple('wirecloud.catalogue.management.commands.addtocatalogue',
                        add_packaged_resource=DEFAULT, install_resource_to_user=DEFAULT, install_resource_to_group=DEFAULT, install_resource_to_all_users=DEFAULT,
                        WgtFile=DEFAULT, TemplateParser=DEFAULT, User=DEFAULT, Group=DEFAULT, autospec=True) as context:
                    parser = Mock()
                    parser.get_resource_name.return_value = "MashableApplicationComponent1"
                    context['TemplateParser'].return_value = parser

                    # Make the call to addtocatalogue
                    call_command('addtocatalogue', *args, **self.options)

                    # Basic assert code
                    self.assertEqual(context['add_packaged_resource'].call_count, 0)
                    self.assertEqual(context['install_resource_to_user'].call_count, 0)
                    self.assertEqual(context['install_resource_to_group'].call_count, 0)
                    self.assertEqual(context['install_resource_to_all_users'].call_count, 1)

        except SystemExit:
            raise CommandError('')

        self.options['stdout'].seek(0)
        self.assertTrue("MashableApplicationComponent1" in self.options['stdout'].read())
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_addtocatalogue_command_deploy_only(self):

        self.options['deploy_only'] = True

        args = ['file1.wgt', 'file2.wgt']
        try:
            with patch('__builtin__.open'):
                with patch.multiple('wirecloud.catalogue.management.commands.addtocatalogue', add_packaged_resource=DEFAULT, WgtFile=DEFAULT, TemplateParser=DEFAULT, autospec=True) as context:
                    call_command('addtocatalogue', *args, **self.options)
                    self.assertEqual(context['add_packaged_resource'].call_count, 2)
                    self.assertEqual(context['add_packaged_resource'].call_args_list[0][1]['deploy_only'], True)
                    self.assertEqual(context['add_packaged_resource'].call_args_list[1][1]['deploy_only'], True)
        except SystemExit:
            raise CommandError('')
