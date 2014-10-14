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

from django.core.management.base import CommandError
from django.test import TestCase


from wirecloud.commons.wirecloud_admin import CommandLineUtility
from wirecloud.commons.utils.testcases import cleartree
import wirecloud.platform


class BaseAdminCommandTestCase(TestCase):

    tags = ('wirecloud-commands', 'wirecloud-command-base')

    @classmethod
    def setUpClass(cls):

        from wirecloud.commons.commands.convert import ConvertCommand
        from wirecloud.commons.commands.startproject import StartprojectCommand
        from wirecloud.fiware.commands.passintegrationtests import IntegrationTestsCommand
        cls.command_utility = CommandLineUtility({
            "convert": ConvertCommand(),
            "startproject": StartprojectCommand(),
            "passintegrationtests": IntegrationTestsCommand(),
        }, prog_name='wirecloud-admin')
        cls.test_data_dir = os.path.join(os.path.dirname(__file__), '../test-data')

    def test_general_help(self):

        options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}
        self.command_utility.execute(['wirecloud-admin'], **options)
        options['stdout'].seek(0)
        first_output = options['stdout'].read()
        self.assertIn('Available subcommands', first_output)

        options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}
        self.command_utility.execute(['wirecloud-admin', '--help'], **options)
        options['stdout'].seek(0)
        second_output = options['stdout'].read()

        self.assertEqual(first_output, second_output)

    def test_command_help(self):

        options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}
        self.command_utility.execute(['wirecloud-admin', 'help', 'convert'], **options)
        options['stdout'].seek(0)
        first_output = options['stdout'].read()

        options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}
        self.command_utility.execute(['wirecloud-admin', 'convert', '--help'], **options)
        options['stdout'].seek(0)
        second_output = options['stdout'].read()

        self.assertEqual(first_output, second_output)

    def test_version(self):

        options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}
        self.command_utility.execute(['wirecloud-admin', 'version'], **options)
        options['stdout'].seek(0)
        self.assertEqual(wirecloud.platform.__version__ + '\n', options['stdout'].read())

    def test_command_list(self):

        options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}
        self.command_utility.execute(['wirecloud-admin', 'help', '--commands'], **options)
        options['stdout'].seek(0)
        first_output = options['stdout'].read()
        self.assertNotIn('Available subcommands', first_output)

    def test_basic_command_call(self):

        args = ['wirecloud-admin', 'convert', '-d', 'xml', os.path.join(self.test_data_dir, 'minimal_endpoint_info.json')]
        options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}
        self.command_utility.execute(args, **options)

        options['stdout'].seek(0)
        self.assertNotEqual(options['stdout'].read(), '')
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')

    def test_invalid_command(self):

        # Calling directly to an inexistent command
        args = ['wirecloud-admin', 'inexistentcommand', 'option1']
        options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}
        self.command_utility.execute(args, **options)

        options['stdout'].seek(0)
        first_output = options['stdout'].read()
        self.assertNotEqual(first_output, '')
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')

        # Requesting help for an inexistent command
        args = ['wirecloud-admin', 'help', 'inexistentcommand']
        options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}
        self.command_utility.execute(args, **options)

        options['stdout'].seek(0)
        second_output = options['stdout'].read()
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')

        # Requesting help for an inexistent command (alternative way)
        args = ['wirecloud-admin', 'inexistentcommand', '--help']
        options = {"stdout": io.BytesIO(), "stderr": io.BytesIO()}
        self.command_utility.execute(args, **options)

        options['stdout'].seek(0)
        third_output = options['stdout'].read()
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')

        self.assertEqual(first_output, second_output)
        self.assertEqual(second_output, third_output)


class ConvertCommandTestCase(TestCase):

    tags = ('wirecloud-commands', 'wirecloud-command-convert')

    @classmethod
    def setUpClass(cls):

        cls.tmp_dir = mkdtemp()
        cls.test_data_dir = os.path.join(os.path.dirname(__file__), '../test-data')

    @classmethod
    def tearDownClass(cls):

        shutil.rmtree(cls.tmp_dir, ignore_errors=True)

    def setUp(self):

        from wirecloud.commons.commands.convert import ConvertCommand
        self.command = ConvertCommand()

    def tearDown(self):
        cleartree(self.tmp_dir)

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

    def test_minimal_info_conversion_stdout(self):

        for format in ('json', 'xml', 'rdf', 'old_xml'):
            args = [os.path.join(self.test_data_dir, 'minimal_endpoint_info.json')]
            options = {"dest_format": format, "rdf_format": "n3", "stdout": io.BytesIO(), "stderr": io.BytesIO()}
            self.command.execute(*args, **options)

            options['stdout'].seek(0)
            self.assertNotEqual(options['stdout'].read(), '')
            options['stderr'].seek(0)
            self.assertEqual(options['stderr'].read(), '')

    def test_minimal_info_conversion_outputfile(self):

        dest_file = os.path.join(self.tmp_dir, 'new_file.xml')
        args = [os.path.join(self.test_data_dir, 'minimal_endpoint_info.json'), dest_file]
        options = {"dest_format": 'rdf', "rdf_format": "pretty-xml", "stdout": io.BytesIO(), "stderr": io.BytesIO()}
        self.command.execute(*args, **options)

        options['stdout'].seek(0)
        self.assertEqual(options['stdout'].read(), '')
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')

        with open(dest_file, 'rb') as f:
            self.assertNotEqual(f.read(), '')
