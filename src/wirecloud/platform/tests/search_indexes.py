# -*- coding: utf-8 -*-

# Copyright (c) 2018-2019 Future Internet Consulting and Development Solutions S.L.

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

from django.test import Client, TestCase
from django.urls import reverse

from wirecloud.platform.models import Workspace
from wirecloud.platform.search_indexes import cleanResults, searchWorkspace, CONTENT_FIELDS
from wirecloud.commons.utils.testcases import WirecloudTestCase


@patch("wirecloud.platform.search_indexes.buildSearchResults")
@patch("wirecloud.platform.search_indexes.Q")
@patch("wirecloud.platform.search_indexes.SearchQuerySet")
class WorkspaceIndexTestCase(TestCase):

    tags = ('wirecloud-search-api', 'wirecloud-noselenium')

    def test_searchWorkspace_emptyquery(self, sqs_mock, q_mock, buildSearchResults_mock):
        request_mock = Mock(user=Mock(is_authenticated=True))
        request_mock.user.groups.values_list.return_value = ("onegroup",)
        searchWorkspace(request_mock, "", 1, 10)
        sqs_mock().models.assert_called_with(Workspace)
        sqs_mock().models().all().filter.assert_called_with(searchable=1)
        self.assertEqual(q_mock.call_args_list, [({"public": True},), ({"users": request_mock.user.id},), ({"groups": "onegroup"},)])
        buildSearchResults_mock.assert_called_with(sqs_mock().models().all().filter().filter(), 1, 10, cleanResults)

    @patch("wirecloud.platform.search_indexes.ParseSQ")
    def test_searchWorkspace_query(self, ParseSQ_mock, sqs_mock, q_mock, buildSearchResults_mock):
        request_mock = Mock(user=Mock(groups=Mock(values_list=Mock(return_value=())), is_authenticated=True))
        ParseSQ_mock().parse.return_value = "filter"

        searchWorkspace(request_mock, "query", 1, 10)
        ParseSQ_mock().parse.assert_called_with("query", CONTENT_FIELDS)
        sqs_mock().models.assert_called_with(Workspace)
        sqs_mock().models().all().filter.assert_called_with(searchable=1)
        sqs_mock().models().all().filter().filter.assert_called_with("filter")
        self.assertEqual(q_mock.call_args_list, [({"public": True},), ({"users": request_mock.user.id},)])
        buildSearchResults_mock.assert_called_with(sqs_mock().models().all().filter().filter().filter(), 1, 10, cleanResults)

    @patch("wirecloud.platform.search_indexes.ParseSQ")
    def test_searchWorkspace_query_anonymous(self, ParseSQ_mock, sqs_mock, q_mock, buildSearchResults_mock):
        request_mock = Mock(user=Mock(groups=Mock(values_list=Mock(return_value=())), is_authenticated=False))
        ParseSQ_mock().parse.return_value = "filter"

        searchWorkspace(request_mock, "query", 1, 10)
        ParseSQ_mock().parse.assert_called_with("query", CONTENT_FIELDS)
        sqs_mock().models.assert_called_with(Workspace)
        sqs_mock().models().all().filter.assert_called_with(searchable=1)
        sqs_mock().models().all().filter().filter.assert_called_with("filter")
        self.assertEqual(q_mock.call_args_list, [({"public": True},)])
        buildSearchResults_mock.assert_called_with(sqs_mock().models().all().filter().filter().filter(), 1, 10, cleanResults)

    @patch("wirecloud.platform.search_indexes.ParseSQ")
    def test_searchWorkspace_ordered_query(self, ParseSQ_mock, sqs_mock, q_mock, buildSearchResults_mock):
        request_mock = Mock(user=Mock(groups=Mock(values_list=Mock(return_value=())), is_authenticated=True))
        ParseSQ_mock().parse.return_value = "filter"

        searchWorkspace(request_mock, "query", 1, 10, orderby=('title',))
        ParseSQ_mock().parse.assert_called_with("query", CONTENT_FIELDS)
        sqs_mock().models.assert_called_with(Workspace)
        sqs_mock().models().all().filter.assert_called_with(searchable=1)
        sqs_mock().models().all().filter().filter.assert_called_with("filter")
        self.assertEqual(q_mock.call_args_list, [({"public": True},), ({"users": request_mock.user.id},)])
        sqs_mock().models().all().filter().filter().filter().order_by.assert_called_with('title')
        buildSearchResults_mock.assert_called_with(sqs_mock().models().all().filter().filter().filter().order_by(), 1, 10, cleanResults)

    def test_cleanWorkspaceResults(self, sqs_mock, q_mock, buildSearchResults_mock):
        self.assertEqual(
            cleanResults(
                Mock(get_stored_fields=Mock(return_value={"name": "workspace"})),
                Mock()
            ),
            {"name": "workspace"}
        )


class WorkspaceSearchTestCase(WirecloudTestCase, TestCase):

    fixtures = ('workspace_search_data',)
    tags = ('wirecloud-search-api', 'wirecloud-noselenium')
    populate = False

    @classmethod
    def setUpClass(cls):

        super(WorkspaceSearchTestCase, cls).setUpClass()
        cls.base_url = reverse('wirecloud.search_service')

    def setUp(self):

        super(WorkspaceSearchTestCase, self).setUp()
        self.client = Client()

    def test_search_by_emptyuser(self):

        self.client.login(username='emptyuser', password='admin')

        response = self.client.get(self.base_url + '?namespace=workspace')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))

        workspaces = set(result['name'] for result in result_json['results'])
        self.assertEqual(workspaces, {"public-workspace"})

    def test_search_by_normuser(self):

        self.client.login(username='normuser', password='admin')

        response = self.client.get(self.base_url + '?namespace=workspace')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))

        workspaces = set(result['name'] for result in result_json['results'])
        self.assertEqual(workspaces, {"public-workspace", "org-workspace"})

    def test_search_by_user_with_workspaces(self):

        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(self.base_url + '?namespace=workspace')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))

        workspaces = set(result['name'] for result in result_json['results'])
        self.assertEqual(workspaces, {"public-workspace", "org-workspace", "priv-workspace"})
