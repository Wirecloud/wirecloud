# -*- coding: utf-8 -*-

# Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

import os
import sys

import wirecloud.platform


class CommandLineUtility(object):

    def __init__(self, commands, prog_name=None):

        self.commands = commands
        if prog_name is None:
            self.prog_name = os.path.basename(sys.argv[0])
        else:
            self.prog_name = prog_name

    def main_help_text(self, commands_only=False):
        """
        Returns the script's main help text, as a string.
        """

        if commands_only:
            usage = sorted(self.commands.keys())
        else:
            usage = [
                "",
                "Type '%s help <subcommand>' for help on a specific subcommand." % self.prog_name,
                "",
                "Available subcommands:",
            ]
            for name in sorted(self.commands):
                usage.append("    %s" % name)
        return '\n'.join(usage)

    def unknown_command_text(self, command):
        """
        Returns the unknown command help text, as a string.
        """
        return "'%(command)s' is not a %(prog_name)s command. See '%(prog_name)s help'." % {
            "command": command,
            "prog_name": self.prog_name,
        }

    def fetch_command(self, command):
        if command in self.commands:
            return self.commands[command]
        else:
            return None

    def execute(self, argv=None, stdout=None, stderr=None):

        from django.core.management.base import CommandParser

        if argv is None:
            argv = sys.argv

        if stdout is None:
            stdout = sys.stdout

        if stderr is None:
            stderr = sys.stderr

        parser = CommandParser(
            None,
            usage="%(prog)s subcommand [options] [args]",
            add_help=False
        )
        parser.add_argument('--version', action='store_true', help="show program's version number and exit")
        parser.add_argument('-h', '--help', action='store_true', help="show this help message and exit")

        try:
            options, argv = parser.parse_known_args(argv)
        except:
            pass  # Ignore any option errors at this point.

        if len(argv) > 1:
            subcommand = argv[1]
        else:
            subcommand = 'help'  # Display help if no arguments were given.

        if options.help:

            if subcommand == 'help':
                parser.print_help(stdout)
                stdout.write(self.main_help_text() + '\n')
            else:
                command = self.fetch_command(subcommand)
                if command is not None:
                    command.print_help(self.prog_name, subcommand, file=stdout)
                else:
                    stdout.write(self.unknown_command_text(subcommand) + '\n')

        elif subcommand == 'version' or options.version:

            stdout.write(wirecloud.platform.__version__ + '\n')

        elif subcommand == 'help':

            if len(argv) <= 2:
                parser.print_help(stdout)
                stdout.write(self.main_help_text() + '\n')
            elif argv[2] == '--commands':
                stdout.write(self.main_help_text(commands_only=True) + '\n')
            else:
                command = self.fetch_command(argv[2])
                if command is not None:
                    command.print_help(self.prog_name, argv[2], file=stdout)
                else:
                    stdout.write(self.unknown_command_text(argv[2]) + '\n')

        else:
            command = self.fetch_command(subcommand)
            if command is not None:
                command.run_from_argv(argv, stdout=stdout, stderr=stderr)
            else:
                stdout.write(self.unknown_command_text(subcommand) + '\n')


def execute_from_command_line():
    from wirecloud.commons.commands.convert import ConvertCommand
    from wirecloud.commons.commands.startproject import StartprojectCommand
    utility = CommandLineUtility({
        "convert": ConvertCommand(),
        "startproject": StartprojectCommand()
    })
    try:
        utility.execute()
    except:
        sys.exit(1)


if __name__ == "__main__":
    execute_from_command_line()
