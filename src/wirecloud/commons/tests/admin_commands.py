# -*- coding: utf-8 -*-

# Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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
from unittest.mock import DEFAULT, Mock, patch

import django
from django.core.management.base import CommandError
from django.test import TestCase

from wirecloud.commons.wirecloud_admin import CommandLineUtility
from wirecloud.commons.utils.testcases import cleartree, WirecloudTestCase
import wirecloud.platform


# Avoid nose to repeat these tests (they are run through wirecloud/commons/tests/__init__.py)
__test__ = False


class BaseAdminCommandTestCase(TestCase):

    tags = ('wirecloud-commands', 'wirecloud-command-base', 'wirecloud-noselenium')

    @classmethod
    def setUpClass(cls):

        from wirecloud.commons.commands.convert import ConvertCommand
        from wirecloud.commons.commands.startproject import StartprojectCommand
        cls.command_utility = CommandLineUtility({
            "convert": ConvertCommand(),
            "startproject": StartprojectCommand(),
        }, prog_name='wirecloud-admin')
        cls.test_data_dir = os.path.join(os.path.dirname(__file__), 'test-data')

        super(BaseAdminCommandTestCase, cls).setUpClass()

    def test_general_help(self):

        options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command_utility.execute(['wirecloud-admin'], **options)
        options['stdout'].seek(0)
        first_output = options['stdout'].read()
        self.assertIn('Available subcommands', first_output)

        options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command_utility.execute(['wirecloud-admin', '-h'], **options)
        options['stdout'].seek(0)
        second_output = options['stdout'].read()

        options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command_utility.execute(['wirecloud-admin', '--help'], **options)
        options['stdout'].seek(0)
        third_output = options['stdout'].read()

        self.assertEqual(first_output, second_output)
        self.assertEqual(second_output, third_output)

    def test_command_help(self):

        options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command_utility.execute(['wirecloud-admin', 'help', 'convert'], **options)
        options['stdout'].seek(0)
        first_output = options['stdout'].read()

        options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command_utility.execute(['wirecloud-admin', 'convert', '-h'], **options)
        options['stdout'].seek(0)
        second_output = options['stdout'].read()

        options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command_utility.execute(['wirecloud-admin', 'convert', '--help'], **options)
        options['stdout'].seek(0)
        third_output = options['stdout'].read()

        self.assertEqual(first_output, second_output)
        self.assertEqual(second_output, third_output)

    def test_version(self):

        options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command_utility.execute(['wirecloud-admin', 'version'], **options)
        options['stdout'].seek(0)
        self.assertEqual(wirecloud.platform.__version__ + '\n', options['stdout'].read())

    def test_version_as_long_flag(self):

        options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command_utility.execute(['wirecloud-admin', '--version'], **options)
        options['stdout'].seek(0)
        self.assertEqual(wirecloud.platform.__version__ + '\n', options['stdout'].read())

    def test_command_list(self):

        options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command_utility.execute(['wirecloud-admin', 'help', '--commands'], **options)
        options['stdout'].seek(0)
        first_output = options['stdout'].read()
        self.assertNotIn('Available subcommands', first_output)

    def test_basic_command_call(self):

        args = ['wirecloud-admin', 'convert', '-d', 'xml', os.path.join(self.test_data_dir, 'minimal_endpoint_info.json')]
        options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command_utility.execute(args, **options)

        options['stdout'].seek(0)
        self.assertNotEqual(options['stdout'].read(), '')
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')

    def test_invalid_command(self):

        # Calling directly to an inexistent command
        args = ['wirecloud-admin', 'inexistentcommand', 'option1']
        options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command_utility.execute(args, **options)

        options['stdout'].seek(0)
        first_output = options['stdout'].read()
        self.assertNotEqual(first_output, '')
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')

        # Requesting help for an inexistent command
        args = ['wirecloud-admin', 'help', 'inexistentcommand']
        options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command_utility.execute(args, **options)

        options['stdout'].seek(0)
        second_output = options['stdout'].read()
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')

        # Requesting help for an inexistent command (alternative way)
        args = ['wirecloud-admin', 'inexistentcommand', '--help']
        options = {"stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command_utility.execute(args, **options)

        options['stdout'].seek(0)
        third_output = options['stdout'].read()
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')

        self.assertEqual(first_output, second_output)
        self.assertEqual(second_output, third_output)


class ConvertCommandTestCase(WirecloudTestCase, TestCase):

    tags = ('wirecloud-commands', 'wirecloud-command-convert', 'wirecloud-noselenium')
    fixtures = ()
    populate = False
    user_search_indexes = False

    @classmethod
    def setUpClass(cls):

        cls.tmp_dir = mkdtemp()
        cls.test_data_dir = os.path.join(os.path.dirname(__file__), 'test-data')

        super(ConvertCommandTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):

        shutil.rmtree(cls.tmp_dir, ignore_errors=True)

        super(ConvertCommandTestCase, cls).tearDownClass()

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

        for format in ('json', 'xml', 'rdf'):
            args = [os.path.join(self.test_data_dir, 'minimal_endpoint_info.json')]
            options = {"dest_format": format, "rdf_format": "n3", "stdout": io.StringIO(), "stderr": io.StringIO()}
            self.command.execute(*args, **options)

            options['stdout'].seek(0)
            self.assertNotEqual(options['stdout'].read(), '')
            options['stderr'].seek(0)
            self.assertEqual(options['stderr'].read(), '')

    def test_minimal_info_conversion_outputfile(self):

        dest_file = os.path.join(self.tmp_dir, 'new_file.xml')
        args = [os.path.join(self.test_data_dir, 'minimal_endpoint_info.json'), dest_file]
        options = {"dest_format": 'rdf', "rdf_format": "pretty-xml", "stdout": io.StringIO(), "stderr": io.StringIO()}
        self.command.execute(*args, **options)

        options['stdout'].seek(0)
        self.assertEqual(options['stdout'].read(), '')
        options['stderr'].seek(0)
        self.assertEqual(options['stderr'].read(), '')

        with open(dest_file, 'rb') as f:
            self.assertNotEqual(f.read(), '')


class StartprojectCommandTestCase(WirecloudTestCase, TestCase):

    tags = ('wirecloud-commands', 'wirecloud-command-startproject', 'wirecloud-noselenium')
    fixtures = ()
    populate = False
    user_search_indexes = False

    @classmethod
    def setUpClass(cls):

        cls.tmp_dir = mkdtemp()
        cls.test_data_dir = os.path.join(os.path.dirname(__file__), 'test-data')

        super(StartprojectCommandTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):

        shutil.rmtree(cls.tmp_dir, ignore_errors=True)

        super(StartprojectCommandTestCase, cls).tearDownClass()

    def setUp(self):

        from wirecloud.commons.commands.startproject import StartprojectCommand
        self.command = StartprojectCommand()

    def tearDown(self):
        cleartree(self.tmp_dir)

    def test_no_args(self):

        args = []
        options = {
            "type": "platform",
            "quick_start": False,
            "verbosity": "1",
        }
        with patch.multiple('wirecloud.commons.commands.startproject', Command=DEFAULT, subprocess=DEFAULT) as mocks:
            self.assertRaises(CommandError, self.command.execute, *args, **options)
            self.assertEqual(mocks['Command'].call_count, 0)

    def test_invalid_project_type(self):

        args = ['wirecloud_instance']
        options = {
            "type": "invalid",
            "quick_start": False,
            "verbosity": "1",
        }
        with patch.multiple('wirecloud.commons.commands.startproject', Command=DEFAULT, subprocess=DEFAULT) as mocks:
            self.assertRaises(CommandError, self.command.execute, *args, **options)
            self.assertEqual(mocks['Command'].call_count, 0)

    def assertHandleCall(self, handle_mock, values={}):
        call_args, call_kwargs = handle_mock.call_args_list[0]
        options = {
            "name": 'wirecloud_instance',
            "directory": None,
            "verbosity": 1
        }
        options.update(values)

        for key in options:
            self.assertEqual(call_kwargs.get(key), options[key])

    def test_platform_creation(self):

        args = ['wirecloud_instance']
        options = {
            "type": "platform",
            "quick_start": False,
            "verbosity": "1",
        }
        with patch.multiple('wirecloud.commons.commands.startproject', Command=DEFAULT, subprocess=DEFAULT) as mocks:
            command_instance_mock = Mock()
            mocks['Command'].return_value = command_instance_mock

            self.command.execute(*args, **options)

            self.assertEqual(command_instance_mock.handle.call_count, 1)
            self.assertHandleCall(command_instance_mock.handle)
            self.assertEqual(mocks['subprocess'].call.call_count, 0)

    def test_platform_creation_quick_start(self):

        args = ['wirecloud_instance']
        options = {
            "type": "platform",
            "quick_start": True,
            "verbosity": "1",
        }
        with patch.multiple('wirecloud.commons.commands.startproject', Command=DEFAULT, subprocess=DEFAULT, os=DEFAULT, sys=DEFAULT) as mocks:
            command_instance_mock = Mock()
            mocks['Command'].return_value = command_instance_mock
            mocks['subprocess'].call.return_value = None
            mocks['sys'].executable = 'python-interpreter'

            self.command.execute(*args, **options)

            self.assertEqual(command_instance_mock.handle.call_count, 1)
            call_args, call_kwargs = command_instance_mock.handle.call_args_list[0]
            self.assertHandleCall(command_instance_mock.handle)
            self.assertGreaterEqual(mocks['subprocess'].call.call_count, 1)
            for (call_args, call_kwargs) in mocks['subprocess'].call.call_args_list:
                self.assertTrue(call_args[0].startswith('python-interpreter '))

    def test_platform_creation_quick_start_no_executable_info(self):

        args = ['wirecloud_instance']
        options = {
            "type": "platform",
            "quick_start": True,
            "verbosity": "1",
        }
        with patch.multiple('wirecloud.commons.commands.startproject', Command=DEFAULT, subprocess=DEFAULT, os=DEFAULT, sys=DEFAULT) as mocks:
            command_instance_mock = Mock()
            mocks['Command'].return_value = command_instance_mock
            mocks['subprocess'].call.return_value = None
            mocks['sys'].executable = None

            self.command.execute(*args, **options)

            self.assertEqual(command_instance_mock.handle.call_count, 1)
            self.assertHandleCall(command_instance_mock.handle)
            self.assertGreaterEqual(mocks['subprocess'].call.call_count, 1)
            for (call_args, call_kwargs) in mocks['subprocess'].call.call_args_list:
                self.assertTrue(call_args[0].startswith('python '))

    def test_platform_creation_quick_start_external_cmd_error(self):

        args = ['wirecloud_instance']
        options = {
            "type": "platform",
            "quick_start": True,
            "verbosity": "1",
        }
        with patch.multiple('wirecloud.commons.commands.startproject', Command=DEFAULT, subprocess=DEFAULT, os=DEFAULT, sys=DEFAULT) as mocks:
            command_instance_mock = Mock()
            mocks['Command'].return_value = command_instance_mock
            mocks['subprocess'].call.return_value = 1
            mocks['sys'].executable = 'python-interpreter'

            self.assertRaises(CommandError, self.command.execute, *args, **options)

            self.assertEqual(command_instance_mock.handle.call_count, 1)
            self.assertHandleCall(command_instance_mock.handle)
            self.assertEqual(mocks['subprocess'].call.call_count, 1)
