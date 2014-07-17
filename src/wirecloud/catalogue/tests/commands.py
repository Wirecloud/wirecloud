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
import shutil
from tempfile import mkdtemp
import os

from django.core import management
from django.core.management.base import CommandError
from django.test import TestCase
from whoosh import fields, index


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

    def setUp(self):

        shutil.rmtree(self.new_index_dir, ignore_errors=True)

    def test_resetsearchindexes_command_using_args(self):

        args = ['invalid_arg']
        options = {
            "stdout": io.BytesIO(),
            "stderr": io.BytesIO()
        }

        with self.settings(WIRECLOUD_INDEX_DIR=self.inexistent_index_dir):
            with self.assertRaises((CommandError, SystemExit)):
                management.call_command('resetsearchindexes', *args, **options)

        options['stdout'].seek(0)
        self.assertEqual(options['stdout'].read(), '')
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')
        self.assertFalse(os.path.exists(self.inexistent_index_dir))

    def test_resetsearchindexes_command_new_dir(self):
        options = {
            "interactive": False,
            "stdout": io.BytesIO(),
            "stderr": io.BytesIO()
        }

        with self.settings(WIRECLOUD_INDEX_DIR=self.new_index_dir):
            try:
                management.call_command('resetsearchindexes', **options)
            except SystemExit:
                raise CommandError('')

        options['stdout'].seek(0)
        self.assertEqual(options['stdout'].read(), '')
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')
        self.assertTrue(os.path.exists(self.new_index_dir))
        self.assertTrue(index.exists_in(self.new_index_dir, indexname='catalogue_resources'))

    def test_resetsearchindexes_command_existing_dir(self):
        options = {
            "interactive": False,
            "stdout": io.BytesIO(),
            "stderr": io.BytesIO()
        }

        os.mkdir(self.new_index_dir)
        index.create_in(self.new_index_dir, fields.Schema(content = fields.TEXT), 'catalogue_resources')
        self.assertTrue(os.path.exists(self.new_index_dir))

        with self.settings(WIRECLOUD_INDEX_DIR=self.new_index_dir):
            try:
                management.call_command('resetsearchindexes', **options)
            except SystemExit:
                raise CommandError('')

        options['stdout'].seek(0)
        self.assertEqual(options['stdout'].read(), '')
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')
        self.assertTrue(os.path.exists(self.new_index_dir))
        self.assertTrue(index.exists_in(self.new_index_dir, indexname='catalogue_resources'))

    def test_resetsearchindexes_command_existing_dir_other_indexes(self):
        options = {
            "interactive": False,
            "stdout": io.BytesIO(),
            "stderr": io.BytesIO()
        }

        os.mkdir(self.new_index_dir)
        index.create_in(self.new_index_dir, fields.Schema(content = fields.TEXT), 'other_index')
        self.assertTrue(os.path.exists(self.new_index_dir))

        with self.settings(WIRECLOUD_INDEX_DIR=self.new_index_dir):
            try:
                management.call_command('resetsearchindexes', **options)
            except SystemExit:
                raise CommandError('')

        options['stdout'].seek(0)
        self.assertEqual(options['stdout'].read(), '')
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')
        self.assertTrue(os.path.exists(self.new_index_dir))
        self.assertTrue(index.exists_in(self.new_index_dir, indexname='catalogue_resources'))
        self.assertTrue(index.exists_in(self.new_index_dir, indexname='other_index'))
