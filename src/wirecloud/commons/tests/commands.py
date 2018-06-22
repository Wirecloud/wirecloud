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

from __future__ import unicode_literals

import io
import os
import shutil
import sys
from tempfile import mkdtemp

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase
from mock import patch
from whoosh import fields, index

from wirecloud.commons.searchers import get_available_search_engines


# Avoid nose to repeat these tests (they are run through wirecloud/commons/tests/__init__.py)
__test__ = False


@patch('wirecloud.commons.management.commands.resetsearchindexes.locale.getdefaultlocale', return_value=("en_US",))
class ResetSearchIndexesCommandTestCase(TestCase):

    tags = ('wirecloud-commands', 'wirecloud-command-resetsearchindexes', 'wirecloud-noselenium')

    @classmethod
    def setUpClass(cls):

        cls.tmp_dir = mkdtemp()
        cls.inexistent_index_dir = os.path.join(cls.tmp_dir, 'inexistent_dir')
        cls.new_index_dir = os.path.join(cls.tmp_dir, 'new_dir')

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.tmp_dir, ignore_errors=True)
        for searcher in get_available_search_engines():
            searcher.clear_cache()

    def setUp(self):
        if sys.version_info > (3, 0):
            self.options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        else:
            self.options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}
        shutil.rmtree(self.new_index_dir, ignore_errors=True)

    def test_resetsearchindexes_command_using_args(self, getdefaultlocale_mock):

        args = ['invalid_arg']

        with self.settings(WIRECLOUD_INDEX_DIR=self.inexistent_index_dir):
            with self.assertRaises((CommandError, SystemExit)):
                call_command('resetsearchindexes', *args, **self.options)

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')
        self.assertFalse(os.path.exists(self.inexistent_index_dir))

    def test_resetsearchindexes_command_existing_dir(self, getdefaultlocale_mock):
        self.options["interactive"] = False

        os.mkdir(self.new_index_dir)
        index.create_in(self.new_index_dir, fields.Schema(content=fields.TEXT), 'resource')
        self.assertTrue(os.path.exists(self.new_index_dir))

        with self.settings(WIRECLOUD_INDEX_DIR=self.new_index_dir):
            try:
                call_command('resetsearchindexes', **self.options)
            except SystemExit:
                raise CommandError('')

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')
        self.assertTrue(os.path.exists(self.new_index_dir))
        for search_index in get_available_search_engines():
            self.assertTrue(index.exists_in(self.new_index_dir, indexname=search_index.indexname))

    def test_resetsearchindexes_command_existing_dir_other_indexes(self, getdefaultlocale_mock):
        self.options["interactive"] = False

        os.mkdir(self.new_index_dir)
        index.create_in(self.new_index_dir, fields.Schema(content=fields.TEXT), 'other_index')
        self.assertTrue(os.path.exists(self.new_index_dir))

        with self.settings(WIRECLOUD_INDEX_DIR=self.new_index_dir):
            try:
                call_command('resetsearchindexes', **self.options)
            except SystemExit:
                raise CommandError('')

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')
        self.assertTrue(os.path.exists(self.new_index_dir))
        self.assertTrue(index.exists_in(self.new_index_dir, indexname='other_index'))
        for search_index in get_available_search_engines():
            self.assertTrue(index.exists_in(self.new_index_dir, indexname=search_index.indexname))

    def check_resetsearchindexes_command_individual_index(self):
        self.options['indexes'] = 'user'

        with patch('wirecloud.commons.management.commands.resetsearchindexes.get_search_engine') as get_search_engine_mock:
            get_search_engine_mock().get_model().objects.all.return_value = ("indexentry1", "indexentry2")
            get_search_engine_mock.reset_mock()

            with self.settings(WIRECLOUD_INDEX_DIR=self.new_index_dir):
                call_command('resetsearchindexes', **self.options)

            get_search_engine_mock.assert_called_once_with('user')
            get_search_engine_mock().clear_index.assert_called_once_with()
            get_search_engine_mock().clear_index.assert_called_once_with()

    def test_resetsearchindexes_command_individual_index(self, getdefaultlocale_mock):
        self.options['verbosity'] = 1

        self.check_resetsearchindexes_command_individual_index()

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_resetsearchindexes_command_individual_index_verbose(self, getdefaultlocale_mock):
        self.options['verbosity'] = 2

        self.check_resetsearchindexes_command_individual_index()

        self.options['stdout'].seek(0)
        stdout = self.options['stdout'].read()
        self.assertIn("indexentry1", stdout)
        self.assertIn("indexentry2", stdout)
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_resetsearchindexes_command_multiple_index(self, getdefaultlocale_mock):
        self.options['indexes'] = 'user,group'

        with self.settings(WIRECLOUD_INDEX_DIR=self.new_index_dir):
            call_command('resetsearchindexes', **self.options)

        self.options['stdout'].seek(0)
        self.options['stderr'].seek(0)

        for search_index in get_available_search_engines():
            if search_index.indexname not in ('user', 'group'):
                self.assertFalse(index.exists_in(self.new_index_dir, indexname=search_index.indexname))

        self.assertTrue(index.exists_in(self.new_index_dir, indexname='user'))
        self.assertTrue(index.exists_in(self.new_index_dir, indexname='group'))

    def test_resetsearchindexes_command_nonavailable_index(self, getdefaultlocale_mock):
        self.options['indexes'] = 'user,nonavailable'

        with self.assertRaises(CommandError):
            with self.settings(WIRECLOUD_INDEX_DIR=self.new_index_dir):
                call_command('resetsearchindexes', **self.options)

        self.options['stdout'].seek(0)
        self.options['stderr'].seek(0)

        for search_index in get_available_search_engines():
            self.assertFalse(index.exists_in(self.new_index_dir, indexname=search_index.indexname))

        self.assertFalse(index.exists_in(self.new_index_dir, indexname='nonavailable'))

    def check_resetsearchindexes_command_interactive_cancel(self):
        self.options["interactive"] = True

        os.mkdir(self.new_index_dir)
        self.assertTrue(os.path.exists(self.new_index_dir))

        with patch('wirecloud.commons.management.commands.resetsearchindexes.input', return_value='no'):
            with self.settings(WIRECLOUD_INDEX_DIR=self.new_index_dir):
                with self.assertRaises(CommandError):
                    call_command('resetsearchindexes', **self.options)

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')
        self.assertTrue(os.path.exists(self.new_index_dir))
        for search_index in get_available_search_engines():
            self.assertFalse(index.exists_in(self.new_index_dir, indexname=search_index.indexname))

    def test_resetsearchindexes_command_interactive_cancel(self, getdefaultlocale_mock):
        self.check_resetsearchindexes_command_interactive_cancel()

    def test_resetsearchindexes_command_individual_index_broken_locale_env(self, getdefaultlocale_mock):
        getdefaultlocale_mock.side_effect = TypeError
        self.check_resetsearchindexes_command_individual_index()

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')

    def test_resetsearchindexes_command_interactive_cancel_broken_locale_env(self, getdefaultlocale_mock):
        getdefaultlocale_mock.side_effect = TypeError
        self.check_resetsearchindexes_command_interactive_cancel()


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
