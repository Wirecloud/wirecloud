# -*- coding: utf-8 -*-

# Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid

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
from whoosh import fields, index

from wirecloud.commons.searchers import get_available_search_engines


class ResetSearchIndexesCommandTestCase(TestCase):

    tags = ('wirecloud-commands', 'wirecloud-command-resetsearchindexes')

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
        self.options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}
        shutil.rmtree(self.new_index_dir, ignore_errors=True)

    def test_resetsearchindexes_command_using_args(self):

        args = ['invalid_arg']

        with self.settings(WIRECLOUD_INDEX_DIR=self.inexistent_index_dir):
            with self.assertRaises((CommandError, SystemExit)):
                call_command('resetsearchindexes', *args, **self.options)

        self.options['stdout'].seek(0)
        self.assertEqual(self.options['stdout'].read(), '')
        self.options['stderr'].seek(0)
        self.assertEqual(self.options['stderr'].read(), '')
        self.assertFalse(os.path.exists(self.inexistent_index_dir))

    def test_resetsearchindexes_command_existing_dir(self):
        self.options["interactive"] = False

        os.mkdir(self.new_index_dir)
        index.create_in(self.new_index_dir, fields.Schema(content = fields.TEXT), 'resource')
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

    def test_resetsearchindexes_command_existing_dir_other_indexes(self):
        self.options["interactive"] = False

        os.mkdir(self.new_index_dir)
        index.create_in(self.new_index_dir, fields.Schema(content = fields.TEXT), 'other_index')
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

    def test_resetsearchindexes_command_individual_index(self):
        self.options['indexes'] = 'user'

        with self.settings(WIRECLOUD_INDEX_DIR=self.new_index_dir):
            call_command('resetsearchindexes', **self.options)

        self.options['stdout'].seek(0)
        self.options['stderr'].seek(0)

        for search_index in get_available_search_engines():
            if search_index.indexname != 'user':
                self.assertFalse(index.exists_in(self.new_index_dir, indexname=search_index.indexname))

        self.assertTrue(index.exists_in(self.new_index_dir, indexname='user'))

    def test_resetsearchindexes_command_multiple_index(self):
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
