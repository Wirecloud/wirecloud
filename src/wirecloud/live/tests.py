# -*- coding: utf-8 -*-

# Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

import datetime
import unittest
from unittest.mock import patch

from django.conf import settings
from django.contrib.auth.models import User, Group
from django.test import TransactionTestCase

from wirecloud.commons.utils.testcases import WirecloudTestCase
from wirecloud.platform.models import CatalogueResource, Workspace


@unittest.skipIf('wirecloud.live' not in settings.INSTALLED_APPS, 'wirecloud.live not installed')
@patch('wirecloud.live.signals.handlers.notify')
class LiveNotificationsTestCase(WirecloudTestCase, TransactionTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-noselenium', 'wirecloud-live')

    def setUp(self):
        self.normuser = User.objects.get(username="normuser")

    def test_mac_install_by_user_are_notified(self, notify_mock):
        instance = CatalogueResource.objects.create(type=1, creation_date=datetime.datetime.now(), short_name="MyWidget", vendor="Wirecloud", version="1.0")
        instance.users.add(self.normuser)
        notify_mock.assert_called_once_with(
            {
                "component": "Wirecloud/MyWidget/1.0",
                "action": "install",
                "category": "component"
            },
            {"normuser"}
        )

    def test_mac_user_clear_are_notified(self, notify_mock):
        instance = CatalogueResource.objects.create(type=1, creation_date=datetime.datetime.now(), short_name="MyWidget", vendor="Wirecloud", version="1.0")
        instance.users.add(self.normuser)
        notify_mock.reset_mock()

        instance.users.clear()

        notify_mock.assert_called_once_with(
            {
                "component": "Wirecloud/MyWidget/1.0",
                "action": "uninstall",
                "category": "component"
            },
            {"normuser"}
        )

    def test_mac_uninstall_by_user_are_notified(self, notify_mock):
        instance = CatalogueResource.objects.create(type=1, creation_date=datetime.datetime.now(), short_name="MyWidget", vendor="Wirecloud", version="1.0")
        instance.users.add(self.normuser)
        notify_mock.reset_mock()

        instance.users.remove(self.normuser)

        notify_mock.assert_called_once_with(
            {
                "component": "Wirecloud/MyWidget/1.0",
                "action": "uninstall",
                "category": "component"
            },
            {"normuser"}
        )

    def test_workspace_updates_are_notified(self, notify_mock):
        instance = Workspace.objects.get(pk="2")
        instance.save()
        notify_mock.assert_called_once_with(
            {
                "workspace": "2",
                "action": "update",
                "category": "workspace"
            },
            {"user_with_workspaces"}
        )

    def test_workspace_simple_updates_are_notified(self, notify_mock):
        instance = Workspace.objects.get(pk="2")
        instance.description = "New description"
        with patch("time.time", return_value=123456):
            instance.save(update_fields=("description",))
        notify_mock.assert_called_once_with(
            {
                "workspace": "2",
                "action": "update",
                "category": "workspace",
                "description": "New description",
                "last_modified": 123456000,
            },
            {"user_with_workspaces"}
        )

    def test_workspace_simple_updates_are_notified_shared(self, notify_mock):
        instance = Workspace.objects.get(pk="2")
        instance.userworkspace_set.create(user=User.objects.get(username="normuser"))
        instance.groups.add(Group.objects.get(name="org"))
        instance.description = "New description"
        with patch("time.time", return_value=123456):
            instance.save(update_fields=("description",))
        notify_mock.assert_called_once_with(
            {
                "workspace": "2",
                "action": "update",
                "category": "workspace",
                "description": "New description",
                "last_modified": 123456000,
            },
            {"user_with_workspaces", "org", "orguser", "normuser"}
        )

    def test_workspace_public_updates_are_notified(self, notify_mock):
        instance = Workspace.objects.get(pk="4")
        instance.description = "New description"
        with patch("time.time", return_value=123456):
            instance.save(update_fields=("description",))
        notify_mock.assert_called_once_with(
            {
                "workspace": "4",
                "action": "update",
                "category": "workspace",
                "description": "New description",
                "last_modified": 123456000,
            },
            {"*"}
        )
