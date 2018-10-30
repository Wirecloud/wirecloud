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

import regex


def cmp(a, b):
    return (a > b) - (a < b)


class Version(object):

    version_re = regex.compile(r'^([1-9]\d*|0)((?:\.(?:[1-9]\d*|0))*)(?:(a|b|rc)([1-9]\d*))?(-dev.*)?$')

    def __init__(self, vstring, reverse=False):

        self.vstring = vstring
        match = self.version_re.match(vstring)

        if not match:
            raise ValueError("invalid version number '%s'" % vstring)

        (major, patch, prerelease, prerelease_num, dev) = match.group(1, 2, 3, 4, 5)

        if patch:
            self.version = tuple(map(int, [major] + patch[1:].split('.')))
        else:
            self.version = (int(major),)

        if prerelease:
            self.prerelease = (prerelease, int(prerelease_num))
        else:
            self.prerelease = None

        if dev:
            self.dev = True
        else:
            self.dev = False

        self.reverse = reverse

    def __cmp__(self, other):

        if isinstance(other, str):
            other = Version(other)

        if not isinstance(other, Version):
            raise ValueError("invalid version number '%s'" % other)

        maxlen = max(len(self.version), len(other.version))
        compare = cmp(self.version + (0,) * (maxlen - len(self.version)), other.version + (0,) * (maxlen - len(other.version)))

        if compare == 0:

            # First check if only one of them is a development version
            if self.dev != other.dev:
                compare = 1 if other.dev else -1

            # case 1: neither has prerelease; they're equal
            elif not self.prerelease and not other.prerelease:
                compare = 0

            # case 2: self has prerelease, other doesn't; other is greater
            elif self.prerelease and not other.prerelease:
                compare = -1

            # case 3: self doesn't have prerelease, other does: self is greater
            elif not self.prerelease and other.prerelease:
                compare = 1

            # case 4: both have prerelease: must compare them!
            else:
                compare = cmp(self.prerelease, other.prerelease)

        return compare if not self.reverse else (compare * -1)

    def __eq__(self, other):
        return self.__cmp__(other) == 0

    def __ge__(self, other):
        return self.__cmp__(other) >= 0

    def __gt__(self, other):
        return self.__cmp__(other) > 0

    def __le__(self, other):
        return self.__cmp__(other) <= 0

    def __lt__(self, other):
        return self.__cmp__(other) < 0

    def __ne__(self, other):
        return self.__cmp__(other) != 0
