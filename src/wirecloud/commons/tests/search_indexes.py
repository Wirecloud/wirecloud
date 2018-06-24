# -*- coding: utf-8 -*-

# Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

from __future__ import unicode_literals

import json

from django.core.urlresolvers import reverse
from django.test import TestCase

from wirecloud.commons.haystack_queryparser import NoMatchingBracketsFound, ParseSQ
from wirecloud.commons.utils.testcases import WirecloudTestCase


# Avoid nose to repeat these tests (they are run through wirecloud/commons/tests/__init__.py)
__test__ = False


class SearchAPITestCase(WirecloudTestCase, TestCase):

    fixtures = ('user_search_test_data',)
    tags = ('wirecloud-search-api', 'wirecloud-noselenium')
    populate = False

    @classmethod
    def setUpClass(cls):
        super(SearchAPITestCase, cls).setUpClass()
        cls.url = reverse('wirecloud.search_service')

    def test_simple_search(self):
        response = self.client.get(self.url + '?namespace=user&q=lin', HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(result_json['results']), 3)

    def test_searches_are_cached(self):

        response = self.client.get(self.url + '?namespace=user&q=lin', HTTP_ACCEPT="application/json")
        self.assertIn('ETag', response)
        initial_etag = response['ETag']

        self.assertEqual(response.status_code, 200)

        # New request without changing nothing in the server side
        response = self.client.get(self.url + '?namespace=user&q=lin', HTTP_ACCEPT="application/json", HTTP_IF_NONE_MATCH=initial_etag)
        self.assertEqual(response.status_code, 304)

    def test_missing_namespace_parameters(self):
        response = self.client.get(self.url, HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 400)
        json.loads(response.content.decode('utf-8'))

    def test_invalid_namespace_parameters(self):
        response = self.client.get(self.url + '?namespace=invalid', HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 422)
        json.loads(response.content.decode('utf-8'))


class QueryParserTestCase(WirecloudTestCase, TestCase):

    fixtures = ()
    tags = ('wirecloud-search-api', 'wirecloud-noselenium')
    populate = False

    def test_searchUser_emptyquery(self):
        parser = ParseSQ()
        query = parser.parse("", ["fullname", "username"])

    def test_normal_query(self):
        parser = ParseSQ()
        query = parser.parse("normal", ["fullname", "username"])
        self.assertEqual("%s" % query, "(OR: ('fullname', 'normal'), ('username', 'normal'))")

    def test_field_query(self):
        parser = ParseSQ()
        query = parser.parse("fullname:normal", ["fullname", "username"])
        self.assertEqual("%s" % query, "(AND: ('fullname', 'normal'))")

    # TODO
    #def test_field_query_injection(self):
    #    parser = ParseSQ()
    #    query = parser.parse("fullname__exact:normal", ["fullname", "username"])
    #    import ipdb; ipdb.sset_trace()
    #    self.assertEqual("%s" % query, "(AND: ('fullname', 'normal'))")

    def test_field_query_exact(self):
        parser = ParseSQ()
        query = parser.parse('fullname:"normal"', ["fullname", "username"])
        self.assertEqual("%s" % query, "(AND: ('fullname__exact', 'normal'))")

    def test_field_query_exact_single_quotes(self):
        parser = ParseSQ()
        query = parser.parse("fullname:'normal'", ["fullname", "username"])
        self.assertEqual("%s" % query, "(AND: ('fullname__exact', 'normal'))")

    def test_field_query_double_quotes(self):
        parser = ParseSQ()
        query = parser.parse('"several words whitespace"', ["fullname", "username"])
        self.assertEqual("%s" % query, "(AND: ('content__exact', 'several words whitespace'))")

    def test_field_query_single_quotes(self):
        parser = ParseSQ()
        query = parser.parse("'several words whitespace'", ["fullname", "username"])
        self.assertEqual("%s" % query, "(AND: ('content__exact', 'several words whitespace'))")

    def test_field_query_not(self):
        parser = ParseSQ()
        query = parser.parse("NOT one", ["fullname", "username"])
        self.assertEqual("%s" % query, "(AND: (NOT (AND: (OR: ('fullname', 'one'), ('username', 'one')))))")

    def test_field_query_not_is_monoargument(self):
        parser = ParseSQ()
        query = parser.parse("NOT one two", ["fullname", "username"])
        self.assertEqual("%s" % query, "(AND: (NOT (AND: (OR: ('fullname', 'one'), ('username', 'one')))), (OR: ('fullname', 'two'), ('username', 'two')))")

    def test_field_query_and(self):
        parser = ParseSQ()
        query = parser.parse("one AND two", ["fullname", "username"])
        self.assertEqual("%s" % query, "(AND: (OR: ('fullname', 'one'), ('username', 'one')), (OR: ('fullname', 'two'), ('username', 'two')))")

    def test_field_query_pyseudo_or(self):
        parser = ParseSQ()
        query = parser.parse("one ORtwo", ["fullname", "username"])
        self.assertEqual("%s" % query, "(AND: (OR: ('fullname', 'one'), ('username', 'one')), (OR: ('fullname', 'ORtwo'), ('username', 'ORtwo')))")

    def test_field_query_or(self):
        parser = ParseSQ()
        query = parser.parse("one OR two", ["fullname", "username"])
        self.assertEqual("%s" % query, "(OR: ('fullname', 'one'), ('username', 'one'), ('fullname', 'two'), ('username', 'two'))")

    def test_field_query_multiple_word(self):
        parser = ParseSQ()
        query = parser.parse("one two", ["fullname", "username"])
        self.assertEqual("%s" % query, "(AND: (OR: ('fullname', 'one'), ('username', 'one')), (OR: ('fullname', 'two'), ('username', 'two')))")

    def test_field_query_brakets(self):
        parser = ParseSQ()
        query = parser.parse("(one OR two) AND three", ["fullname", "username"])
        self.assertEqual("%s" % query, "(AND: (OR: ('fullname', 'one'), ('username', 'one'), ('fullname', 'two'), ('username', 'two')), (OR: ('fullname', 'three'), ('username', 'three')))")

    def test_field_query_nested_brakets(self):
        parser = ParseSQ()
        query = parser.parse("(one OR (two AND NOT four)) AND three", ["fullname", "username"])
        self.assertEqual("%s" % query, "(AND: (OR: ('fullname', 'one'), ('username', 'one'), (AND: (OR: ('fullname', 'two'), ('username', 'two')), (NOT (AND: (OR: ('fullname', 'four'), ('username', 'four')))))), (OR: ('fullname', 'three'), ('username', 'three')))")

    def test_field_query_unbalanced_braket(self):
        parser = ParseSQ()
        with self.assertRaises(NoMatchingBracketsFound) as cm:
            parser.parse("(one OR two AND three", ["fullname", "username"])

        self.assertEqual("%s" % cm.exception, "Matching brackets were not found: (one OR two AND three")
