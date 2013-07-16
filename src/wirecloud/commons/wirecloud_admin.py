# -*- coding: utf-8 -*-

# Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.core.management import LaxOptionParser

import wirecloud.platform


class CommandLineUtility(object):

    def __init__(self, commands, argv=None):

        self.commands = commands
        self.argv = argv or sys.argv[:]
        self.prog_name = os.path.basename(self.argv[0])

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

    def execute(self):

        parser = LaxOptionParser(usage="%prog subcommand [options] [args]",
            version=wirecloud.platform.__version__,
            option_list=())

        try:
            options, args = parser.parse_args(self.argv)
        except:
            pass  # Ignore any option errors at this point.

        try:
            subcommand = self.argv[1]
        except IndexError:
            subcommand = 'help'  # Display help if no arguments were given.

        if subcommand == 'help':
            if len(args) <= 2:
                parser.print_lax_help()
                sys.stdout.write(self.main_help_text() + '\n')
            elif args[2] == '--commands':
                sys.stdout.write(self.main_help_text(commands_only=True) + '\n')
            else:
                command = self.fetch_command(args[2])
                if command is not None:
                    command.print_help(self.prog_name, args[2])
                else:
                    sys.stdout.write(self.unknown_command_text(args[2]) + '\n')

        elif subcommand == 'version':
            sys.stdout.write(parser.get_version() + '\n')
        elif '--version' in self.argv[1:]:
            # LaxOptionParser already takes care of printing the version.
            pass
        elif '--help' in self.argv[1:] or '-h' in self.argv[1:]:
            parser.print_lax_help()
            sys.stdout.write(self.main_help_text() + '\n')
        else:
            command = self.fetch_command(subcommand)
            if command is not None:
                command.run_from_argv(self.argv)
            else:
                sys.stdout.write(self.unknown_command_text(subcommand) + '\n')


def execute_from_command_line():
    from wirecloud.commons.commands.convert import ConvertCommand
    from wirecloud.commons.commands.startproject import StartprojectCommand
    from wirecloud.fiware.commands.passintegrationtests import IntegrationTestsCommand
    utility = CommandLineUtility({
        "convert": ConvertCommand(),
        "startproject": StartprojectCommand(),
        "passintegrationtests": IntegrationTestsCommand(),
    })
    utility.execute()

if __name__ == "__main__":
    execute_from_command_line()
