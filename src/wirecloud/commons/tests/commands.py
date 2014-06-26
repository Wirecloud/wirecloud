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

import shutil
from tempfile import mkdtemp

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase


class ConvertCommandTestCase(TestCase):

    tags = ('current',)

    @classmethod
    def setUpClass(cls):

        cls.tmp_dir = mkdtemp()

    @classmethod
    def tearDownClass(cls):

        shutil.rmtree(cls.tmp_dir, ignore_errors=True)

    def setUp(self):

        from wirecloud.commons.commands.convert import ConvertCommand
        self.command = ConvertCommand()

    def test_no_args(self):

        args = []
        options = {
            "dest_format": "rdf"
        }
        self.assertRaises(CommandError, self.command.execute, *args, **options)

    def test_non_existent_file(self):

        args = ['/tmp/nonexistent_file.xml']
        options = {
            "dest_format": "rdf"
        }
        self.assertRaises(CommandError, self.command.execute, *args, **options)

    def test_invalid_dest_format(self):

        args = ['/tmp/nonexistent_file.xml']
        options = {
            "dest_format": "invalid"
        }
        self.assertRaises(CommandError, self.command.execute, *args, **options)
