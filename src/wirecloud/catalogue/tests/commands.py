# -*- coding: utf-8 -*-

# Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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
import sys
from unittest.mock import ANY, Mock, patch, DEFAULT

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase


# Avoid nose to repeat these tests (they are run through wirecloud/catalogue/tests/__init__.py)
__test__ = False


@patch('wirecloud.catalogue.management.commands.addtocatalogue.locale.getdefaultlocale', return_value=("en_US",))
class AddToCatalogueCommandTestCase(TestCase):

    tags = ('wirecloud-commands', 'wirecloud-command-addtocatalogue', 'wirecloud-noselenium')

    def setUp(self):

        if sys.version_info > (3, 0):
            self.options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        else:
            self.options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}

    def test_addtocatalogue_command_no_args(self, getdefaultlocale_mock):

        args = []

        with self.assertRaises((CommandError, SystemExit)):
            call_command('addtocatalogue', *args, **self.options)

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_addtocatalogue_command_simplewgt_user(self, getdefaultlocale_mock):

        args = ['file.wgt']
        self.options['users'] = 'admin'

        try:
            with patch('wirecloud.catalogue.management.commands.addtocatalogue.open', create=True):
                with patch.multiple(
                        'wirecloud.catalogue.management.commands.addtocatalogue',
                        add_packaged_resource=DEFAULT, install_component=DEFAULT,
                        WgtFile=DEFAULT, TemplateParser=DEFAULT, User=DEFAULT, Group=DEFAULT, autospec=True) as context:
                    parser = Mock()
                    parser.get_resource_processed_info.return_value = {'title': "Mashable Application Component1"}
                    context['TemplateParser'].return_value = parser

                    # Make the call to addtocatalogue
                    call_command('addtocatalogue', *args, **self.options)

                    # Basic assert code
                    self.assertEqual(context['add_packaged_resource'].call_count, 0)
                    self.assertEqual(context['install_component'].call_count, 1)
                    context['User'].objects.get.assert_called_with(username="admin")
                    context['install_component'].assert_called_with(ANY, public=False, users=[context['User'].objects.get()], groups=[])

        except SystemExit:
            raise CommandError('')

        self.options['stdout'].seek(0)
        self.assertTrue("Mashable Application Component1" in self.options['stdout'].read())
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_addtocatalogue_command_simplewgt_group(self, getdefaultlocale_mock):

        args = ['file.wgt']
        self.options['groups'] = 'group1'

        try:
            with patch('wirecloud.catalogue.management.commands.addtocatalogue.open', create=True):
                with patch.multiple(
                        'wirecloud.catalogue.management.commands.addtocatalogue',
                        add_packaged_resource=DEFAULT, install_component=DEFAULT,
                        WgtFile=DEFAULT, TemplateParser=DEFAULT, User=DEFAULT, Group=DEFAULT, autospec=True) as context:
                    parser = Mock()
                    parser.get_resource_processed_info.return_value = {'title': "Mashable Application Component1"}
                    context['TemplateParser'].return_value = parser

                    # Make the call to addtocatalogue
                    call_command('addtocatalogue', *args, **self.options)

                    # Basic assert code
                    self.assertEqual(context['add_packaged_resource'].call_count, 0)
                    self.assertEqual(context['install_component'].call_count, 1)
                    context['Group'].objects.get.assert_called_with(name="group1")
                    context['install_component'].assert_called_with(ANY, public=False, users=[], groups=[context['Group'].objects.get()])

        except SystemExit:
            raise CommandError('')

        self.options['stdout'].seek(0)
        self.assertTrue("Mashable Application Component1" in self.options['stdout'].read())
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def check_addtocatalogue_command_simplewgt_public(self):

        args = ['file.wgt']
        self.options['public'] = True

        try:
            with patch('wirecloud.catalogue.management.commands.addtocatalogue.open', create=True):
                with patch.multiple(
                        'wirecloud.catalogue.management.commands.addtocatalogue',
                        add_packaged_resource=DEFAULT, install_component=DEFAULT,
                        WgtFile=DEFAULT, TemplateParser=DEFAULT, User=DEFAULT, Group=DEFAULT, autospec=True) as context:
                    parser = Mock()
                    parser.get_resource_processed_info.return_value = {'title': "Mashable Application Component1"}
                    context['TemplateParser'].return_value = parser

                    # Make the call to addtocatalogue
                    call_command('addtocatalogue', *args, **self.options)

                    # Basic assert code
                    self.assertEqual(context['add_packaged_resource'].call_count, 0)
                    self.assertEqual(context['install_component'].call_count, 1)
                    context['install_component'].assert_called_with(ANY, public=True, users=[], groups=[])

        except SystemExit:
            raise CommandError('')

        self.options['stdout'].seek(0)
        self.assertTrue("Mashable Application Component1" in self.options['stdout'].read())
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_addtocatalogue_command_simplewgt_public(self, getdefaultlocale_mock):
        self.check_addtocatalogue_command_simplewgt_public()

    def test_addtocatalogue_command_simplewgt_no_action(self, getdefaultlocale_mock):

        args = ['file.wgt']

        with patch('wirecloud.catalogue.management.commands.addtocatalogue.open', create=True):
            with patch.multiple(
                    'wirecloud.catalogue.management.commands.addtocatalogue',
                    add_packaged_resource=DEFAULT, install_component=DEFAULT,
                    WgtFile=DEFAULT, TemplateParser=DEFAULT, User=DEFAULT, Group=DEFAULT, autospec=True) as context:

                # Make the call to addtocatalogue
                self.assertRaises((CommandError, SystemExit), call_command, 'addtocatalogue', *args, **self.options)

                # Basic assert code
                self.assertEqual(context['add_packaged_resource'].call_count, 0)
                self.assertEqual(context['install_component'].call_count, 0)

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_addtocatalogue_command_deploy_only(self, getdefaultlocale_mock):

        self.options['redeploy'] = True

        args = ['file1.wgt', 'file2.wgt']
        try:
            with patch('wirecloud.catalogue.management.commands.addtocatalogue.open', create=True):
                with patch.multiple('wirecloud.catalogue.management.commands.addtocatalogue', add_packaged_resource=DEFAULT, WgtFile=DEFAULT, TemplateParser=DEFAULT, autospec=True) as context:
                    call_command('addtocatalogue', *args, **self.options)
                    self.assertEqual(context['add_packaged_resource'].call_count, 2)
                    self.assertEqual(context['add_packaged_resource'].call_args_list[0][1]['deploy_only'], True)
                    self.assertEqual(context['add_packaged_resource'].call_args_list[1][1]['deploy_only'], True)
        except SystemExit:
            raise CommandError('')

    def check_addtocatalogue_command_error_reading_file(self):

        self.options['redeploy'] = True

        args = ['file1.wgt', 'file2.wgt']
        try:
            with patch('wirecloud.catalogue.management.commands.addtocatalogue.open', create=True) as open_mock:
                def open_mock_side_effect(file_name, mode):
                    if file_name == 'file1.wgt':
                        raise Exception
                open_mock.side_effect = open_mock_side_effect
                with patch.multiple('wirecloud.catalogue.management.commands.addtocatalogue', add_packaged_resource=DEFAULT, WgtFile=DEFAULT, TemplateParser=DEFAULT, autospec=True) as context:
                    call_command('addtocatalogue', *args, **self.options)
                    self.assertEqual(context['add_packaged_resource'].call_count, 1)
                    self.assertEqual(context['add_packaged_resource'].call_args_list[0][1]['deploy_only'], True)
        except SystemExit:
            raise CommandError('')

        self.options['stdout'].seek(0)
        self.assertNotEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_addtocatalogue_command_error_reading_file(self, getdefaultlocale_mock):
        self.check_addtocatalogue_command_error_reading_file()

    def test_addtocatalogue_command_error_installing_mac(self, getdefaultlocale_mock):

        self.options['redeploy'] = True

        args = ['file1.wgt', 'file2.wgt']
        try:
            with patch('wirecloud.catalogue.management.commands.addtocatalogue.open', create=True):
                with patch.multiple('wirecloud.catalogue.management.commands.addtocatalogue', add_packaged_resource=DEFAULT, WgtFile=DEFAULT, TemplateParser=DEFAULT, autospec=True) as context:

                    context['TemplateParser'].side_effect = (Exception, None)

                    call_command('addtocatalogue', *args, **self.options)
                    self.assertEqual(context['add_packaged_resource'].call_count, 1)
                    self.assertEqual(context['add_packaged_resource'].call_args_list[0][1]['deploy_only'], True)
        except SystemExit:
            raise CommandError('')

        self.options['stdout'].seek(0)
        self.assertNotEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_addtocatalogue_command_error_installing_mac_quiet(self, getdefaultlocale_mock):

        self.options['verbosity'] = '0'
        self.options['redeploy'] = True

        args = ['file1.wgt', 'file2.wgt']
        try:
            with patch('wirecloud.catalogue.management.commands.addtocatalogue.open', create=True):
                with patch.multiple('wirecloud.catalogue.management.commands.addtocatalogue', add_packaged_resource=DEFAULT, WgtFile=DEFAULT, TemplateParser=DEFAULT, autospec=True) as context:

                    context['TemplateParser'].side_effect = (Exception, None)

                    call_command('addtocatalogue', *args, **self.options)
                    self.assertEqual(context['add_packaged_resource'].call_count, 1)
                    self.assertEqual(context['add_packaged_resource'].call_args_list[0][1]['deploy_only'], True)
        except SystemExit:
            raise CommandError('')

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_addtocatalogue_command_error_reading_file_broken_locale_env(self, getdefaultlocale_mock):

        getdefaultlocale_mock.side_effect = TypeError
        self.check_addtocatalogue_command_error_reading_file()

    def test_addtocatalogue_command_simplewgt_public_broken_locale_env(self, getdefaultlocale_mock):

        getdefaultlocale_mock.side_effect = TypeError
        self.check_addtocatalogue_command_simplewgt_public()
