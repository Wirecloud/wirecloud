# -*- coding: utf-8 -*-

# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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

from unittest.mock import call, Mock, patch, PropertyMock

from django.test import TestCase
from parameterized import parameterized

from wirecloud.commons.models import Organization
from wirecloud.platform.preferences.views import PlatformPreferencesCollection, TabPreferencesCollection, WorkspacePreferencesCollection


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


@patch('wirecloud.platform.preferences.views.get_object_or_404')
@patch('wirecloud.platform.preferences.views.parse_json_request')
@patch('wirecloud.platform.preferences.views.cache')
@patch('wirecloud.platform.preferences.views.User')
@patch('wirecloud.platform.preferences.views.WorkspacePreference')
class WorkspacePreferencesTestCase(TestCase):

    tags = ('wirecloud-noselenium', 'wirecloud-preferences')

    @classmethod
    def setUpClass(cls):
        cls.restapi = WorkspacePreferencesCollection(permitted_methods=('GET', 'POST'))
        super(WorkspacePreferencesTestCase, cls).setUpClass()

    def test_workspace_preference_collection_post_empty(self, WorkspacePreference, User, cache, parse_json_request, get_object_or_404):
        workspace = get_object_or_404()
        workspace.is_editable_by.return_value = True
        parse_json_request.return_value = {}
        request = Mock(META={
            "CONTENT_TYPE": "application/json",
        })
        request.user.is_anonymous.return_value = False

        response = self.restapi.create(request, "1")

        workspace.save.assert_not_called()
        self.assertEqual(response.status_code, 204)

    @parameterized.expand([
        ({"value": '[{"username": "user1", "accessLevel": "read"}, {"username": "org1"}]'},),
        ('[{"username": "user1", "accessLevel": "read"}, {"username": "org1"}]',),
        ('[{"username": "user1", "accessLevel": "read"}, {"username": "org1"}, {"username": "inexistent"}, {"username": false}]',),
    ])
    def test_workspace_preference_collection_post_sharelist(self, WorkspacePreference, User, cache, parse_json_request, get_object_or_404, value):
        workspace = get_object_or_404()
        workspace.is_editable_by.return_value = True
        parse_json_request.return_value = {
            "sharelist": value
        }
        request = Mock(META={
            "CONTENT_TYPE": "application/json",
        })
        request.user.is_anonymous.return_value = False
        User.DoesNotExist = Exception
        user1 = Mock()
        org1 = Mock()
        User.objects.get.side_effect = (user1, org1, User.DoesNotExist)
        type(user1.organization).group = PropertyMock(side_effect=Organization.DoesNotExist)

        response = self.restapi.create(request, "1")

        self.assertEqual(workspace.userworkspace_set.create.call_args_list, [call(user=user1), call(user=org1)])
        self.assertEqual(workspace.groups.add.call_args_list, [call(org1.organization.group)])
        workspace.save.assert_not_called()
        self.assertEqual(response.status_code, 204)

    def test_workspace_preference_collection_post_sharelist_ignore_non_existing_users(self, WorkspacePreference, User, cache, parse_json_request, get_object_or_404):
        workspace = get_object_or_404()
        workspace.is_editable_by.return_value = True
        parse_json_request.return_value = {
            "sharelist": '[{"username": "user1", "accessLevel": "write"}]',
        }
        request = Mock(META={
            "CONTENT_TYPE": "application/json",
        })
        request.user.is_anonymous.return_value = False
        User.DoesNotExist = Exception
        User.objects.get.side_effect = User.DoesNotExist

        response = self.restapi.create(request, "1")

        workspace.userworkspace_set.create.assert_not_called()
        workspace.groups.add.assert_not_called()
        workspace.save.assert_not_called()
        self.assertEqual(response.status_code, 204)

    @parameterized.expand([
        ("true", True),
        ("false", False),
        ("1", False),
        ("null", False),
        ("{}", False),
        ({"value": "true"}, True),
        ({"value": "false"}, False),
        ({"value": "1"}, False),
        ({"value": "null"}, False),
        ({"value": "{}"}, False),
    ])
    def test_workspace_preference_collection_post_public(self, WorkspacePreference, User, cache, parse_json_request, get_object_or_404, payload, expected):
        workspace = get_object_or_404()
        workspace.is_editable_by.return_value = True
        parse_json_request.return_value = {
            "public": payload,
        }
        request = Mock(META={
            "CONTENT_TYPE": "application/json",
        })
        request.user.is_anonymous.return_value = False
        User.DoesNotExist = Exception
        User.objects.get.side_effect = User.DoesNotExist

        response = self.restapi.create(request, "1")

        workspace.userworkspace_set.create.assert_not_called()
        workspace.groups.add.assert_not_called()
        self.assertEqual(workspace.public, expected)
        workspace.save.assert_called_once_with()
        self.assertEqual(response.status_code, 204)

    @parameterized.expand([
        ("true", True),
        ("false", False),
        ("1", False),
        ("null", False),
        ("{}", False),
        ({"value": "true"}, True),
        ({"value": "false"}, False),
        ({"value": "1"}, False),
        ({"value": "null"}, False),
        ({"value": "{}"}, False),
    ])
    def test_workspace_preference_collection_post_requireauth(self, WorkspacePreference, User, cache, parse_json_request, get_object_or_404, payload, expected):
        workspace = get_object_or_404()
        workspace.is_editable_by.return_value = True
        parse_json_request.return_value = {
            "requireauth": payload,
        }
        request = Mock(META={
            "CONTENT_TYPE": "application/json",
        })
        request.user.is_anonymous.return_value = False
        User.DoesNotExist = Exception
        User.objects.get.side_effect = User.DoesNotExist

        response = self.restapi.create(request, "1")

        workspace.userworkspace_set.create.assert_not_called()
        workspace.groups.add.assert_not_called()
        self.assertEqual(workspace.requireauth, expected)
        workspace.save.assert_called_once_with()
        self.assertEqual(response.status_code, 204)

    @parameterized.expand([
        ("value",),
        ([],),
        (5,),
        (False,),
        (None,),
        ({"pref": []},),
        ({"pref": {'a': 5}},),
        ({"pref": []},),
        ({"pref": 5},),
        ({"pref": False},),
        ({"pref": None},),
        ({"pref": {"a": 5}},),
        ({"pref": {"value": 5}},),
        ({"pref1": "", "pref2": None},),
    ])
    def test_workspace_preference_collection_post_invalid_payload_values(self, WorkspacePreference, User, cache, parse_json_request, get_object_or_404, payload):
        workspace = get_object_or_404()
        workspace.is_editable_by.return_value = True
        parse_json_request.return_value = payload
        request = Mock(META={
            "CONTENT_TYPE": "application/json",
        })
        request.user.is_anonymous.return_value = False

        response = self.restapi.create(request, "1")

        workspace.save.assert_not_called()
        self.assertEqual(response.status_code, 422)

    @parameterized.expand([
        ({"pref1": "null"}, True, False, False),
        ({"pref1": "5"}, False, False, False),
        ({"pref2": "[]"}, False, True, False),
        ({"pref1": "false"}, True, False, False),
        ({"pref1": "true"}, True, False, False),
        ({"pref1": '"hellow world!"'}, True, False, False),
        ({"pref1": "5", "pref2": "{}"}, False, True, False),
        ({"newpref": '"new"'}, False, False, True),
        ({"pref1": {"value": "null"}}, True),
        ({"pref1": {"value": "5"}}, False),
        ({"pref1": {"value": "[]"}}, True),
        ({"pref1": {"value": "false"}}, True),
        ({"pref1": {"value": "true"}}, True),
        ({"pref1": {"value": '"hellow world!"'}}, True),
        ({"pref1": {"inherit": False, "value": "null"}}, True),
        ({"pref1": {"inherit": False, "value": "5"}}, False),
        ({"pref1": {"inherit": False, "value": "[]"}}, True),
        ({"pref1": {"inherit": False, "value": "false"}}, True),
        ({"pref1": {"inherit": False, "value": "true"}}, True),
        ({"pref1": {"inherit": False, "value": '"hellow world!"'}}, True),
        ({"pref1": {"inherit": True, "value": "null"}}, True),
        ({"pref1": {"inherit": True, "value": "5"}}, True),
        ({"pref1": {"inherit": True, "value": "[]"}}, True),
        ({"pref1": {"inherit": True, "value": "false"}}, True),
        ({"pref1": {"inherit": True, "value": "true"}}, True),
        ({"pref1": {"inherit": True, "value": '"hellow world!"'}}, True),
        ({"pref1": {"inherit": True}, "pref2": {"inherit": False}}, True, True, False),
        ({"pref1": {}, "pref2": {}}, False, False, False),
    ])
    def test_workspace_preference_collection_post_valid_payload_values(self, WorkspacePreference, User, cache, parse_json_request, get_object_or_404, payload, change1, change2=False, new=False):
        workspace = get_object_or_404()
        workspace.is_editable_by.return_value = True
        pref1 = Mock(value="5", inherit=False)
        pref1.name = "pref1"
        pref2 = Mock(value="[]", inherit=True)
        pref2.name = "pref2"
        workspace.workspacepreference_set.all.return_value = (pref1, pref2)
        WorkspacePreference.return_value = Mock(inherit=False, value="")

        parse_json_request.return_value = payload
        request = Mock(META={
            "CONTENT_TYPE": "application/json",
        })
        request.user.is_anonymous.return_value = False

        response = self.restapi.create(request, "1")

        pref1.save.assert_called_once_with() if change1 else pref1.save.assert_not_called()
        pref2.save.assert_called_once_with() if change2 else pref2.save.assert_not_called()
        self.assertGreater(WorkspacePreference.call_count, 0) if new else WorkspacePreference.assert_not_called()
        workspace.save.assert_called_once_with() if change1 or change2 or new else workspace.save.assert_not_called()
        self.assertEqual(response.status_code, 204)


@patch('wirecloud.platform.preferences.views.get_object_or_404')
@patch('wirecloud.platform.preferences.views.parse_json_request')
@patch('wirecloud.platform.preferences.views.cache')
@patch('wirecloud.platform.preferences.views.User')
class TabPreferencesTestCase(TestCase):

    tags = ('wirecloud-noselenium', 'wirecloud-preferences')

    @classmethod
    def setUpClass(cls):
        cls.restapi = TabPreferencesCollection(permitted_methods=('GET', 'POST'))
        super(TabPreferencesTestCase, cls).setUpClass()

    @parameterized.expand([
        ("value",),
        ([],),
        (5,),
        (False,),
        (None,),
        ({"pref": []},),
        ({"pref": {'a': 5}},),
        ({"pref": []},),
        ({"pref": 5},),
        ({"pref": False},),
        ({"pref": None},),
        ({"pref": {"value": 5}},),
        ({"pref": {"a": 5}},),
        ({"pref1": "", "pref2": None},),
    ])
    def test_tab_preference_collection_post_invalid_payload_values(self, User, cache, parse_json_request, get_object_or_404, payload):
        tab = get_object_or_404()
        tab.workspace.is_editable_by.return_value = True
        parse_json_request.return_value = payload
        request = Mock(META={
            "CONTENT_TYPE": "application/json",
        })
        request.user.is_anonymous.return_value = False

        response = self.restapi.create(request, "1", "1")

        tab.workspace.save.assert_not_called()
        self.assertEqual(response.status_code, 422)

    @parameterized.expand([
        ({"pref1": "null"}, True, False, False),
        ({"pref1": "5"}, False, False, False),
        ({"pref2": "[]"}, False, True, False),
        ({"pref1": "false"}, True, False, False),
        ({"pref1": "true"}, True, False, False),
        ({"pref1": '"hellow world!"'}, True, False, False),
        ({"pref1": "5", "pref2": "{}"}, False, True, False),
        ({"newpref": '"new"'}, False, False, True),
        ({"pref1": {"value": "null"}}, True, False, False),
        ({"pref1": {"value": "5"}}, False, False, False),
        ({"pref1": {"value": "[]"}}, True, False, False),
        ({"pref1": {"value": "false"}}, True, False, False),
        ({"pref1": {"value": "true"}}, True, False, False),
        ({"pref1": {"value": '"hellow world!"'}}, True, False, False),
        ({"pref1": {"inherit": False, "value": "null"}}, True, False, False),
        ({"pref1": {"inherit": False, "value": "5"}}, False, False, False),
        ({"pref1": {"inherit": False, "value": "[]"}}, True, False, False),
        ({"pref1": {"inherit": False, "value": "false"}}, True, False, False),
        ({"pref1": {"inherit": False, "value": "true"}}, True, False, False),
        ({"pref1": {"inherit": False, "value": '"hellow world!"'}}, True, False, False),
        ({"pref1": {"inherit": True, "value": "null"}}, True, False, False),
        ({"pref1": {"inherit": True, "value": "5"}}, True, False, False),
        ({"pref1": {"inherit": True, "value": "[]"}}, True, False, False),
        ({"pref1": {"inherit": True, "value": "false"}}, True, False, False),
        ({"pref1": {"inherit": True, "value": "true"}}, True, False, False),
        ({"pref1": {"inherit": True, "value": '"hellow world!"'}}, True, False, False),
        ({"pref1": {"inherit": True}, "pref2": {"inherit": False}}, True, True, False),
        ({"pref1": {}, "pref2": {}}, False, False, False),
    ])
    @patch("wirecloud.platform.preferences.views.TabPreference")
    def test_tab_preference_collection_post_valid_payload_values(self, payload, change1, change2, new, TabPreference, User, cache, parse_json_request, get_object_or_404):
        tab = get_object_or_404()
        workspace = tab.workspace
        workspace.is_editable_by.return_value = True
        pref1 = Mock(value="5", inherit=False)
        pref1.name = "pref1"
        pref2 = Mock(value="[]", inherit=True)
        pref2.name = "pref2"
        TabPreference.objects.filter.return_value = (pref1, pref2)
        TabPreference.return_value = Mock(inherit=False, value="")

        parse_json_request.return_value = payload
        request = Mock(META={
            "CONTENT_TYPE": "application/json",
        })
        request.user.is_anonymous.return_value = False

        response = self.restapi.create(request, "1", "1")

        pref1.save.assert_called_once_with() if change1 else pref1.save.assert_not_called()
        pref2.save.assert_called_once_with() if change2 else pref2.save.assert_not_called()
        self.assertGreater(TabPreference.call_count, 0) if new else TabPreference.assert_not_called()
        workspace.save.assert_called_once_with() if change1 or change2 or new else workspace.save.assert_not_called()
        self.assertEqual(response.status_code, 204)


@patch('wirecloud.platform.preferences.views.parse_json_request')
@patch('wirecloud.platform.preferences.views.PlatformPreference')
class PlatformPreferencesTestCase(TestCase):

    tags = ('wirecloud-noselenium', 'wirecloud-preferences', 'current')

    @classmethod
    def setUpClass(cls):
        cls.restapi = PlatformPreferencesCollection(permitted_methods=('GET', 'POST'))
        super(PlatformPreferencesTestCase, cls).setUpClass()

    @parameterized.expand([
        ("value",),
        ([],),
        (5,),
        (False,),
        (None,),
        ({"pref": []},),
        ({"pref": {'a': 5}},),
        ({"pref": []},),
        ({"pref": 5},),
        ({"pref": False},),
        ({"pref": None},),
        ({"pref": {"a": 5}},),
        ({"pref": {"value": 5}},),
        ({"pref": {"value": "true", "a": 5}},),
        ({"pref1": "", "pref2": None},),
    ])
    def test_platform_preference_collection_post_invalid_payload_values(self, PlatformPreference, parse_json_request, payload):
        parse_json_request.return_value = payload
        request = Mock(META={
            "CONTENT_TYPE": "application/json",
        })
        request.user.is_anonymous.return_value = False

        response = self.restapi.create(request)

        self.assertEqual(response.status_code, 422)

    @parameterized.expand([
        ({"pref1": "null"}, True, False, False),
        ({"pref1": "5"}, False, False, False),
        ({"pref1": "[]"}, True, False, False),
        ({"pref1": "false"}, True, False, False),
        ({"pref2": "true"}, False, True, False),
        ({"pref1": '"hellow world!"'}, True, False, False),
        ({"pref1": "5", "pref2": "{}"}, False, True, False),
        ({"newpref": '"new"'}, False, False, True),
        ({"pref1": {"value": "null"}}, True, False, False),
        ({"pref1": {"value": "5"}}, False, False, False),
        ({"pref1": {"value": "[]"}}, True, False, False),
        ({"pref1": {"value": "false"}}, True, False, False),
        ({"pref1": {"value": "true"}}, True, False, False),
        ({"pref1": {"value": '"hellow world!"'}}, True, False, False),
    ])
    def test_platform_preference_collection_post_valid_payload_values(self, PlatformPreference, parse_json_request, payload, change1, change2, new):
        pref1 = Mock(value="5")
        pref1.name = "pref1"
        pref2 = Mock(value="[]")
        pref2.name = "pref2"
        PlatformPreference.objects.filter.return_value = (pref1, pref2)
        PlatformPreference.return_value = Mock(value="")

        parse_json_request.return_value = payload
        request = Mock(META={
            "CONTENT_TYPE": "application/json",
        })
        request.user.is_anonymous.return_value = False

        response = self.restapi.create(request)

        pref1.save.assert_called_once_with() if change1 else pref1.save.assert_not_called()
        pref2.save.assert_called_once_with() if change2 else pref2.save.assert_not_called()
        self.assertGreater(PlatformPreference.call_count, 0) if new else PlatformPreference.assert_not_called()
        self.assertEqual(response.status_code, 204)
