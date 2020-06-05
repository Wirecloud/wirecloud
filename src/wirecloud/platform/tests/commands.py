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

import io
import sys
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings, TransactionTestCase

from wirecloud.commons.utils.testcases import WirecloudTestCase
from wirecloud.platform.plugins import clear_cache


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


@override_settings(WIRECLOUD_PLUGINS=())
@patch('wirecloud.platform.management.commands.populate.locale.getdefaultlocale', return_value=("en_US",))
class PopuplateCommandTestCase(WirecloudTestCase, TransactionTestCase):

    tags = ('wirecloud-commands', 'wirecloud-command-populate', 'wirecloud-noselenium')
    populate = False

    @classmethod
    def setUpClass(cls):
        clear_cache()
        super(PopuplateCommandTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):
        super(PopuplateCommandTestCase, cls).tearDownClass()
        clear_cache()

    def setUp(self):

        super(PopuplateCommandTestCase, self).setUp()

        if sys.version_info > (3, 0):
            self.options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        else:
            self.options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}

    def test_populate_command_wrong_number_of_arguments(self, getdefaultlocale_mock):

        args = ['1', '2', '3']

        with self.assertRaises((CommandError, SystemExit)):
            call_command('populate', *args, **self.options)

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def check_populate_command_empty_db(self):

        args = []

        call_command('populate', *args, **self.options)

        self.options['stdout'].seek(0)
        self.assertNotEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_populate_command_empty_db(self, getdefaultlocale_mock):

        self.check_populate_command_empty_db()

    def test_populate_command_empty_db_broken_locale_env(self, getdefaultlocale_mock):

        getdefaultlocale_mock.side_effect = TypeError
        self.check_populate_command_empty_db()

    def check_populate_command_is_idempotent(self):

        args = []
        call_command('populate', *args, **self.options)

        # Reset stdout and stderr
        self.options['stdout'].seek(0)
        self.options['stdout'].truncate(0)
        self.options['stderr'].seek(0)
        self.options['stderr'].truncate(0)

        call_command('populate', *args, **self.options)

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), 'Already up-to-date.\n')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_populate_command_is_idempotent(self, getdefaultlocale_mock):

        self.check_populate_command_is_idempotent()

    def test_populate_command_is_idempotent_broken_locale_env(self, getdefaultlocale_mock):

        getdefaultlocale_mock.side_effect = TypeError
        self.check_populate_command_is_idempotent()

    def check_populate_command_empty_db_quiet(self):

        self.options['verbosity'] = '0'
        args = []

        call_command('populate', *args, **self.options)

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_populate_command_empty_db_quiet(self, getdefaultlocale_mock):

        getdefaultlocale_mock.side_effect = TypeError
        self.check_populate_command_empty_db_quiet()

    def test_populate_command_empty_db_quiet_broken_locale_env(self, getdefaultlocale_mock):

        getdefaultlocale_mock.side_effect = TypeError
        self.check_populate_command_empty_db_quiet()
