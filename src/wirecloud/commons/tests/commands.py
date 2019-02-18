# -*- coding: utf-8 -*-

# Copyright (c) 2014-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

import io
import sys
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase


# Avoid nose to repeat these tests (they are run through wirecloud/commons/tests/__init__.py)
__test__ = False


@patch('wirecloud.commons.management.commands.createorganization.locale.getdefaultlocale', return_value=("en_US",))
class CreateOrganizationCommandTestCase(TestCase):

    tags = ('wirecloud-commands', 'wirecloud-command-createorganization', 'wirecloud-noselenium')

    def setUp(self):
        if sys.version_info > (3, 0):
            self.options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        else:
            self.options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}

    @patch('wirecloud.commons.management.commands.createorganization.Organization.objects.is_available', return_value=True)
    @patch('wirecloud.commons.management.commands.createorganization.Organization.objects.create_organization')
    def test_createorganization_avilable(self, is_available, create_organization_mock, getdefaultlocale_mock):
        call_command('createorganization', 'org', **self.options)
        create_organization_mock.assert_called_with('org')

        self.options['stdout'].seek(0)
        self.assertNotEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    @patch('wirecloud.commons.management.commands.createorganization.Organization.objects.is_available', return_value=True)
    @patch('wirecloud.commons.management.commands.createorganization.Organization.objects.create_organization')
    def test_createorganization_avilable_quiet(self, is_available, create_organization_mock, getdefaultlocale_mock):
        self.options['verbosity'] = 0
        call_command('createorganization', 'org', **self.options)
        create_organization_mock.assert_called_with('org')

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    @patch('wirecloud.commons.management.commands.createorganization.Organization.objects.is_available', return_value=False)
    def test_createorganization_non_avilable(self, is_available_mock, getdefaultlocale_mock):

        with self.assertRaises(CommandError):
            call_command('createorganization', 'existing')

    @patch('wirecloud.commons.management.commands.createorganization.Organization.objects.is_available', return_value=True)
    @patch('wirecloud.commons.management.commands.createorganization.Organization.objects.create_organization')
    def test_createorganization_command_individual_index_broken_locale_env(self, is_available_mock, create_organization_mock, getdefaultlocale_mock):
        getdefaultlocale_mock.side_effect = TypeError
        call_command('createorganization', 'org')
        create_organization_mock.assert_called_with('org')

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')
