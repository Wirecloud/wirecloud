# -*- coding: utf-8 -*-

# Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2018 Future Internet Consulting and Development Solutions S.L.

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
import operator

from haystack.query import SQ
from django.conf import settings


PATTERN_FIELD_QUERY = re.compile(r"^(\w+):", re.U)
PATTERN_NORMAL_QUERY = re.compile(r"^(\w+)\s*", re.U)
PATTERN_OPERATOR = re.compile(r"^(AND|OR|NOT|\-|\+)\b\s*", re.U)
PATTERN_QUOTED_Text = re.compile(r"^(?:\"([^\"]*)\"|'([^']*)')\s*", re.U)

HAYSTACK_DEFAULT_OPERATOR = getattr(settings, 'HAYSTACK_DEFAULT_OPERATOR', 'AND')
DEFAULT_OPERATOR = ''
OP = {
    'AND': operator.and_,
    'OR': operator.or_,
    'NOT': operator.inv,
    '+': operator.and_,
    '-': operator.inv,
}


class NoMatchingBracketsFound(Exception):

    def __init__(self, value=''):
        self.value = value

    def __str__(self):
        return "Matching brackets were not found: " + self.value


def head(string):
    return string.split()[0]


def tail(string):
    return " ".join(string.split()[1:])


class ParseSQ(object):

    def __init__(self, use_default=HAYSTACK_DEFAULT_OPERATOR):
        self.Default_Operator = use_default

    @property
    def current(self):
        return self._current

    @current.setter
    def current(self, current):
        self._prev = self._current if current in ['-', 'NOT'] else None
        self._current = current

    def apply_operand(self, new_sq):
        if self.current in ['-', 'NOT']:
            new_sq = OP[self.current](new_sq)
            self.current = self._prev
        if self.sq:
            return OP[self.current](self.sq, new_sq)
        return new_sq

    def handle_field_query(self):
        mat = re.search(PATTERN_FIELD_QUERY, self.query)
        search_field = mat.group(1)
        self.query, n = re.subn(PATTERN_FIELD_QUERY, '', self.query, 1)
        mat = re.search(PATTERN_QUOTED_Text, self.query)
        if mat:
            self.sq = self.apply_operand(SQ(**{search_field + "__exact": mat.group(2) if mat.group(1) is None else mat.group(1)}))
            self.query, n = re.subn(PATTERN_QUOTED_Text, '', self.query, 1)
        else:
            word = head(self.query)
            self.sq = self.apply_operand(SQ(**{search_field: word}))
            self.query = tail(self.query)

        self.current = self.Default_Operator

    def handle_brackets(self):
        no_brackets = 1
        i = 1
        while no_brackets and i < len(self.query):
            if self.query[i] == ")":
                no_brackets -= 1
                if no_brackets == 0:
                    break
            elif self.query[i] == "(":
                no_brackets += 1
            i += 1

        if no_brackets != 0:
            raise NoMatchingBracketsFound(self.query)

        parser = ParseSQ(self.Default_Operator)
        self.sq = self.apply_operand(parser.parse(self.query[1: i], self.contentFields))
        self.query, self.current = self.query[i:], self.Default_Operator

    def handle_normal_query(self):
        word = head(self.query)

        sq = None
        for field in self.contentFields:
            if sq is None:
                sq = SQ(**{field: word})
            else:
                sq |= SQ(**{field: word})

        self.sq = self.apply_operand(sq)
        self.current = self.Default_Operator
        self.query = tail(self.query)

    def handle_operator_query(self):
        self.current = re.search(PATTERN_OPERATOR, self.query).group(1)
        self.query, n = re.subn(PATTERN_OPERATOR, '', self.query, 1)

    def handle_quoted_query(self):
        mat = re.search(PATTERN_QUOTED_Text, self.query)
        query_temp = mat.group(2) if mat.group(1) is None else mat.group(1)
        self.sq = self.apply_operand(SQ(content__exact=query_temp))
        self.query, n = re.subn(PATTERN_QUOTED_Text, '', self.query, 1)
        self.current = self.Default_Operator

    def parse(self, query, contentFields):
        self.query = query.strip()

        self.sq = SQ()
        self.contentFields = contentFields
        self.current = self.Default_Operator
        while self.query:
            self.query = self.query.lstrip()
            if self.query[0] == "(":
                self.handle_brackets()
            elif re.search(PATTERN_FIELD_QUERY, self.query):
                self.handle_field_query()
            elif re.search(PATTERN_QUOTED_Text, self.query):
                self.handle_quoted_query()
            elif re.search(PATTERN_OPERATOR, self.query):
                self.handle_operator_query()
            elif re.search(PATTERN_NORMAL_QUERY, self.query):
                self.handle_normal_query()
            else:
                self.query = self.query[1:]

        return self.sq
