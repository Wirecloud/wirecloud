# -*- coding: utf-8 -*-

# Copyright (c) 2014-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from optparse import make_option, OptionParser
import sys
import traceback

from django.core.management.color import color_style
from django.utils.encoding import smart_str

import wirecloud.platform


def handle_default_options(options):
    """
    Include any default options that all commands should accept here
    so that ManagementUtility can handle them before searching for
    user commands.

    """
    if options.pythonpath:
        sys.path.insert(0, options.pythonpath)


class BaseCommand(object):

    # Metadata about this command.
    option_list = (
        make_option(
            '-v', '--verbosity', action='store', dest='verbosity', default='1',
            type='choice', choices=['0', '1', '2', '3'],
            help='Verbosity level; 0=minimal output, 1=normal output, 2=verbose output, 3=very verbose output'
        ),
        make_option(
            '--pythonpath',
            help='A directory to add to the Python path, e.g. "/home/djangoprojects/myproject".'
        ),
        make_option(
            '--traceback', action='store_true',
            help='Print traceback on exception'
        ),
    )
    help = ''
    args = ''

    def __init__(self):
        self.style = color_style()

    def get_version(self):
        return wirecloud.platform.__version__

    def usage(self, subcommand):
        """
        Return a brief description of how to use this command, by
        default from the attribute ``self.help``.

        """
        usage = '%%prog %s [options] %s' % (subcommand, self.args)
        if self.help:
            return '%s\n\n%s' % (usage, self.help)
        else:
            return usage

    def create_parser(self, prog_name, subcommand):
        """
        Create and return the ``OptionParser`` which will be used to
        parse the arguments to this command.

        """
        return OptionParser(prog=prog_name,
                            usage=self.usage(subcommand),
                            version=self.get_version(),
                            option_list=self.option_list)

    def print_help(self, prog_name, subcommand, file=sys.stdout):
        """
        Print the help message for this command, derived from
        ``self.usage()``.

        """
        parser = self.create_parser(prog_name, subcommand)

        if file is None:
            file = sys.stdout
        file.write(parser.format_help())

    def run_from_argv(self, argv, stdout=None, stderr=None):
        """
        Set up any environment changes requested (e.g., Python path
        and Django settings), then run this command.

        """
        parser = self.create_parser(argv[0], argv[1])
        options, args = parser.parse_args(argv[2:])
        handle_default_options(options)
        options = options.__dict__
        show_traceback = options.get('traceback', False)

        if stdout:
            options['stdout'] = stdout

        if stderr:
            options['stderr'] = stderr

        try:
            self.execute(*args, **options)
        except Exception as e:
            if show_traceback:
                traceback.print_exc()
            else:
                self.stderr.write(smart_str(self.style.ERROR('Error: %s\n' % e)))

            raise e

    def execute(self, *args, **options):
        """
        Try to execute this command. If the command raises a
        ``CommandError``, intercept it and print it sensibly to
        stderr.
        """
        self.stdout = options.get('stdout', sys.stdout)
        self.stderr = options.get('stderr', sys.stderr)
        output = self.handle(*args, **options)
        if output:
            self.stdout.write(output)

    def handle(self, *args, **options):
        """
        The actual logic of the command. Subclasses must implement
        this method.

        """
        raise NotImplementedError()
