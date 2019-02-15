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

import json
from unittest.mock import Mock, patch

from django.contrib.auth.models import Group, User
from django.core.urlresolvers import reverse
from django.test import TestCase

from wirecloud.commons.haystack_queryparser import NoMatchingBracketsFound, ParseSQ
from wirecloud.commons.search_indexes import cleanUserResults, cleanGroupResults, searchGroup, searchUser, GROUP_CONTENT_FIELDS, USER_CONTENT_FIELDS
from wirecloud.commons.utils.testcases import WirecloudTestCase


# Avoid nose to repeat these tests (they are run through wirecloud/commons/tests/__init__.py)
__test__ = False


def clean(query):
    return ("%s" % query).replace("u'", "'")


class SearchAPITestCase(WirecloudTestCase, TestCase):

    fixtures = ('user_search_test_data',)
    tags = ('wirecloud-search-api', 'wirecloud-noselenium')
    populate = False

    @classmethod
    def setUpClass(cls):
        super(SearchAPITestCase, cls).setUpClass()
        cls.url = reverse('wirecloud.search_service')

    def test_searh_without_query(self):
        response = self.client.get(self.url + '?namespace=user', HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(result_json['results']), 10)

    def test_simple_search(self):
        response = self.client.get(self.url + '?namespace=user&q=lin', HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(result_json['results']), 3)
        for user in result_json['results']:
            self.assertEqual(user['organization'], user['username'] == "filinberto")

    def test_ordered_search(self):
        response = self.client.get(self.url + '?namespace=user&orderby=username_orderby', HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        results = [result['username'] for result in result_json['results']]
        expected_results = list(results)
        expected_results.sort()
        self.assertEqual(results, expected_results)

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

    def test_invalid_pagenum_parameters(self):
        response = self.client.get(self.url + '?namespace=user&pagenum=invalid', HTTP_ACCEPT="application/json")

        self.assertEqual(response.status_code, 422)
        json.loads(response.content.decode('utf-8'))

    def test_invalid_maxresult_parameters(self):
        response = self.client.get(self.url + '?namespace=user&maxresults=invalid', HTTP_ACCEPT="application/json")

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
        self.assertEqual(clean(query), "(OR: ('fullname', 'normal'), ('username', 'normal'))")

    def test_field_query(self):
        parser = ParseSQ()
        query = parser.parse("fullname:normal", ["fullname", "username"])
        self.assertEqual(clean(query), "(AND: ('fullname', 'normal'))")

    # TODO
    #def test_field_query_injection(self):
    #    parser = ParseSQ()
    #    query = parser.parse("fullname__exact:normal", ["fullname", "username"])
    #    import ipdb; ipdb.sset_trace()
    #    self.assertEqual(clean(query), "(AND: ('fullname', 'normal'))")

    def test_field_query_exact(self):
        parser = ParseSQ()
        query = parser.parse('fullname:"normal"', ["fullname", "username"])
        self.assertEqual(clean(query), "(AND: ('fullname__exact', 'normal'))")

    def test_field_query_exact_single_quotes(self):
        parser = ParseSQ()
        query = parser.parse("fullname:'normal'", ["fullname", "username"])
        self.assertEqual(clean(query), "(AND: ('fullname__exact', 'normal'))")

    def test_field_query_double_quotes(self):
        parser = ParseSQ()
        query = parser.parse('"several words whitespace"', ["fullname", "username"])
        self.assertEqual(clean(query), "(AND: ('content__exact', 'several words whitespace'))")

    def test_field_query_single_quotes(self):
        parser = ParseSQ()
        query = parser.parse("'several words whitespace'", ["fullname", "username"])
        self.assertEqual(clean(query), "(AND: ('content__exact', 'several words whitespace'))")

    def test_field_query_not(self):
        parser = ParseSQ()
        query = parser.parse("NOT one", ["fullname", "username"])
        self.assertEqual(clean(query), "(AND: (NOT (AND: (OR: ('fullname', 'one'), ('username', 'one')))))")

    def test_field_query_not_is_monoargument(self):
        parser = ParseSQ()
        query = parser.parse("NOT one two", ["fullname", "username"])
        self.assertEqual(clean(query), "(AND: (NOT (AND: (OR: ('fullname', 'one'), ('username', 'one')))), (OR: ('fullname', 'two'), ('username', 'two')))")

    def test_field_query_and(self):
        parser = ParseSQ()
        query = parser.parse("one AND two", ["fullname", "username"])
        self.assertEqual(clean(query), "(AND: (OR: ('fullname', 'one'), ('username', 'one')), (OR: ('fullname', 'two'), ('username', 'two')))")

    def test_field_query_pyseudo_or(self):
        parser = ParseSQ()
        query = parser.parse("one ORtwo", ["fullname", "username"])
        self.assertEqual(clean(query), "(AND: (OR: ('fullname', 'one'), ('username', 'one')), (OR: ('fullname', 'ORtwo'), ('username', 'ORtwo')))")

    def test_field_query_or(self):
        parser = ParseSQ()
        query = parser.parse("one OR two", ["fullname", "username"])
        self.assertEqual(clean(query), "(OR: ('fullname', 'one'), ('username', 'one'), ('fullname', 'two'), ('username', 'two'))")

    def test_field_query_multiple_word(self):
        parser = ParseSQ()
        query = parser.parse("one two", ["fullname", "username"])
        self.assertEqual(clean(query), "(AND: (OR: ('fullname', 'one'), ('username', 'one')), (OR: ('fullname', 'two'), ('username', 'two')))")

    def test_field_query_brakets(self):
        parser = ParseSQ()
        query = parser.parse("(one OR two) AND three", ["fullname", "username"])
        self.assertEqual(clean(query), "(AND: (OR: ('fullname', 'one'), ('username', 'one'), ('fullname', 'two'), ('username', 'two')), (OR: ('fullname', 'three'), ('username', 'three')))")

    def test_field_query_nested_brakets(self):
        parser = ParseSQ()
        query = parser.parse("(one OR (two AND NOT four)) AND three", ["fullname", "username"])
        self.assertEqual(clean(query), "(AND: (OR: ('fullname', 'one'), ('username', 'one'), (AND: (OR: ('fullname', 'two'), ('username', 'two')), (NOT (AND: (OR: ('fullname', 'four'), ('username', 'four')))))), (OR: ('fullname', 'three'), ('username', 'three')))")

    def test_field_query_unbalanced_braket(self):
        parser = ParseSQ()
        with self.assertRaises(NoMatchingBracketsFound) as cm:
            parser.parse("(one OR two AND three", ["fullname", "username"])

        self.assertEqual("%s" % cm.exception, "Matching brackets were not found: (one OR two AND three")


@patch("wirecloud.commons.search_indexes.buildSearchResults")
@patch("wirecloud.commons.search_indexes.SearchQuerySet")
class UserIndexTestCase(WirecloudTestCase, TestCase):

    fixtures = ()
    tags = ('wirecloud-search-api', 'wirecloud-noselenium')
    populate = False

    def test_searchUser_emptyquery(self, sqs_mock, buildSearchResults_mock):
        request_mock = Mock()
        searchUser(request_mock, "", 1, 10)
        sqs_mock().models.assert_called_with(User)
        sqs_mock().models().all().filter.assert_not_called()
        buildSearchResults_mock.assert_called_with(sqs_mock().models().all(), 1, 10, cleanUserResults)

    @patch("wirecloud.commons.search_indexes.ParseSQ")
    def test_searchUser_query(self, ParseSQ_mock, sqs_mock, buildSearchResults_mock):
        request_mock = Mock()
        ParseSQ_mock().parse.return_value = "filter"

        searchUser(request_mock, "query", 1, 10)
        ParseSQ_mock().parse.assert_called_with("query", USER_CONTENT_FIELDS)
        sqs_mock().models.assert_called_with(User)
        sqs_mock().models().all().filter.assert_called_with("filter")
        buildSearchResults_mock.assert_called_with(sqs_mock().models().all().filter(), 1, 10, cleanUserResults)

    def test_cleanUserResults(self, sqs_mock, buildSearchResults_mock):
        self.assertEqual(
            cleanUserResults(
                Mock(get_stored_fields=Mock(return_value={
                    "fullname": "Full Name",
                    "fullname_orderby": "Full Name",
                    "username": "username",
                    "username_orderby": "username",
                    "organization": False,
                })),
                Mock()
            ),
            {
                "fullname": "Full Name",
                "username": "username",
                "organization": False
            }
        )

    def test_cleanUserResults_org(self, sqs_mock, buildSearchResults_mock):
        self.assertEqual(
            cleanUserResults(
                Mock(get_stored_fields=Mock(return_value={
                    "fullname": "Organization Name",
                    "fullname_orderby": "Organization Name",
                    "username": "username",
                    "username_orderby": "username",
                    "organization": True,
                })),
                Mock()
            ),
            {
                "fullname": "Organization Name",
                "username": "username",
                "organization": True
            }
        )


@patch("wirecloud.commons.search_indexes.buildSearchResults")
@patch("wirecloud.commons.search_indexes.SearchQuerySet")
class GroupIndexTestCase(WirecloudTestCase, TestCase):

    fixtures = ()
    tags = ('wirecloud-search-api', 'wirecloud-noselenium')
    populate = False

    def test_searchGroup_emptyquery(self, sqs_mock, buildSearchResults_mock):
        request_mock = Mock()
        searchGroup(request_mock, "", 1, 10)
        sqs_mock().models.assert_called_with(Group)
        sqs_mock().models().all().filter.assert_not_called()
        buildSearchResults_mock.assert_called_with(sqs_mock().models().all(), 1, 10, cleanGroupResults)

    @patch("wirecloud.commons.search_indexes.ParseSQ")
    def test_searchGroup_query(self, ParseSQ_mock, sqs_mock, buildSearchResults_mock):
        request_mock = Mock()
        ParseSQ_mock().parse.return_value = "filter"

        searchGroup(request_mock, "query", 1, 10)
        ParseSQ_mock().parse.assert_called_with("query", GROUP_CONTENT_FIELDS)
        sqs_mock().models.assert_called_with(Group)
        sqs_mock().models().all().filter.assert_called_with("filter")
        buildSearchResults_mock.assert_called_with(sqs_mock().models().all().filter(), 1, 10, cleanGroupResults)

    @patch("wirecloud.commons.search_indexes.ParseSQ")
    def test_searchGroup_ordered_query(self, ParseSQ_mock, sqs_mock, buildSearchResults_mock):
        request_mock = Mock()
        ParseSQ_mock().parse.return_value = "filter"

        searchGroup(request_mock, "query", 1, 10, orderby=('-name',))
        ParseSQ_mock().parse.assert_called_with("query", GROUP_CONTENT_FIELDS)
        sqs_mock().models.assert_called_with(Group)
        sqs_mock().models().all().filter.assert_called_with("filter")
        sqs_mock().models().all().filter().order_by.assert_called_with('-name')
        buildSearchResults_mock.assert_called_with(sqs_mock().models().all().filter().order_by(), 1, 10, cleanGroupResults)

    def test_cleanGroupResults(self, sqs_mock, buildSearchResults_mock):
        self.assertEqual(
            cleanGroupResults(
                Mock(get_stored_fields=Mock(return_value={"name": "group"})),
                Mock()
            ),
            {"name": "group"}
        )
