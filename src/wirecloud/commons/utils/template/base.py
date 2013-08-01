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

import re


__all__ = ('is_valid_name', 'is_valid_vendor', 'is_valid_version')


NAME_RE = re.compile(r'^[^/]+$')
VENDOR_RE = re.compile(r'^[^/]+$')
VERSION_RE = re.compile(r'^(?:[1-9]\d*\.|0\.)*(?:[1-9]\d*|0)$')


class TemplateParseException(Exception):

    def __init__(self, msg):
        self.msg = msg

    def __str__(self):
        return str(self.msg)

    def __unicode__(self):
        return unicode(self.msg)


def is_valid_name(name):

    return re.match(NAME_RE, name)


def is_valid_vendor(vendor):

    return re.match(VENDOR_RE, vendor)


def is_valid_version(version):

    return re.match(VERSION_RE, version)
