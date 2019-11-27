# -*- coding: utf-8 -*-

# Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

import unittest
from unittest.mock import Mock, patch

from django.contrib.auth.models import User, Group
from django.test import TestCase
from django.utils import timezone

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.testcases import WirecloudTestCase
from wirecloud.platform.models import CatalogueResource, Workspace
import wirecloud.live

try:  # pragma: no cover
    import channels  # noqa
    CHANNELS_INSTALLED = True

    # Those modules cannot be imported if the channels module is not installed
    from wirecloud.live.apps import WirecloudLiveConfig
    from wirecloud.live.signals.handlers import install_signals, mac_update, update_users_or_groups, notify, workspace_update
except ModuleNotFoundError:  # pragma: no cover
    CHANNELS_INSTALLED = False


@unittest.skipIf(not CHANNELS_INSTALLED, 'django channels package not installed')
@patch('wirecloud.live.signals.handlers.notify')
class LiveNotificationsTestCase(WirecloudTestCase, TestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-noselenium', 'wirecloud-live')
    populate = False
    use_search_indexes = False

    def setUp(self):
        self.normuser = User.objects.get(username="normuser")
        self.orggroup = Group.objects.get(name="org")

    def test_mac_install_by_user_are_notified(self, notify_mock):
        instance = Mock(speck=CatalogueResource)

        update_users_or_groups(
            sender=CatalogueResource.users.through,
            instance=instance,
            action="pre_add",
            reverse=False,
            model=User,
            pk_set={self.normuser.pk},
            using="default"
        )

        notify_mock.assert_called_once_with(
            {
                "component": instance.local_uri_part,
                "action": "install",
                "category": "component"
            },
            {"normuser"}
        )

    def test_mac_install_by_group_are_notified(self, notify_mock):
        instance = CatalogueResource(type=1, creation_date=timezone.now(), short_name="MyWidget", vendor="Wirecloud", version="1.0")

        update_users_or_groups(
            sender=CatalogueResource.groups.through,
            instance=instance,
            action="pre_add",
            reverse=False,
            model=Group,
            pk_set={self.orggroup.pk},
            using="default"
        )

        notify_mock.assert_called_once_with(
            {
                "component": "Wirecloud/MyWidget/1.0",
                "action": "install",
                "category": "component"
            },
            {"orguser", "org"}
        )

    def test_mac_groups_clear_are_notified(self, notify_mock):
        group = Mock()
        group.user_set.values_list.return_value = ("normuser",)
        instance = Mock(spec=CatalogueResource)
        instance.groups.all.return_value = (group,)

        update_users_or_groups(
            sender=CatalogueResource.groups.through,
            instance=instance,
            action="pre_clear",
            reverse=False,
            model=Group,
            pk_set={self.normuser.pk},
            using="default"
        )

        notify_mock.assert_called_once_with(
            {
                "component": instance.local_uri_part,
                "action": "uninstall",
                "category": "component"
            },
            {"normuser"}
        )

    def test_mac_user_clear_are_notified(self, notify_mock):
        instance = Mock(spec=CatalogueResource)
        instance.users.all().values_list.return_value = ("normuser",)

        update_users_or_groups(
            sender=CatalogueResource.users.through,
            instance=instance,
            action="pre_clear",
            reverse=False,
            model=User,
            pk_set={self.normuser.pk},
            using="default"
        )

        notify_mock.assert_called_once_with(
            {
                "component": instance.local_uri_part,
                "action": "uninstall",
                "category": "component"
            },
            {"normuser"}
        )

    def test_mac_uninstall_by_user_are_notified(self, notify_mock):
        instance = Mock(spec=CatalogueResource)

        update_users_or_groups(
            sender=CatalogueResource.users.through,
            instance=instance,
            action="pre_remove",
            reverse=False,
            model=User,
            pk_set={self.normuser.pk},
            using="default"
        )

        notify_mock.assert_called_once_with(
            {
                "component": instance.local_uri_part,
                "action": "uninstall",
                "category": "component"
            },
            {"normuser"}
        )

    def test_workspace_updates_are_notified(self, notify_mock):
        instance = Mock(spec=Workspace)
        instance.id = 2
        instance.public = False
        instance.users.values_list.return_value = ("user_with_workspaces",)
        instance.groups.all.return_value = ()

        workspace_update(
            sender=Workspace,
            instance=instance,
            created=False,
            raw={},
            using="default",
            update_fields=()
        )

        notify_mock.assert_called_once_with(
            {
                "workspace": "2",
                "action": "update",
                "category": "workspace"
            },
            {"user_with_workspaces"}
        )

    def test_workspace_update_support_empty_update_fields(self, notify_mock):
        instance = Mock(spec=Workspace)
        instance.id = 2
        instance.public = False
        instance.users.values_list.return_value = ()
        instance.groups.all.return_value = ()

        workspace_update(
            sender=Workspace,
            instance=instance,
            created=False,
            raw={},
            using="default",
            update_fields=None
        )

        notify_mock.assert_called_once_with(
            {
                "workspace": "%s" % instance.id,
                "action": "update",
                "category": "workspace",
            },
            set()
        )

    def test_workspace_simple_updates_are_notified(self, notify_mock):
        instance = Mock(spec=Workspace)
        instance.public = False
        instance.description = "New description"
        instance.last_modified = 123456000
        instance.users.values_list.return_value = ("user_with_workspaces",)
        instance.groups.all.return_value = ()

        workspace_update(
            sender=Workspace,
            instance=instance,
            created=False,
            raw={},
            using="default",
            update_fields=('description', 'last_modified')
        )

        notify_mock.assert_called_once_with(
            {
                "workspace": "%s" % instance.id,
                "action": "update",
                "category": "workspace",
                "description": "New description",
                "last_modified": 123456000,
            },
            {"user_with_workspaces"}
        )

    def test_workspace_simple_updates_are_notified_shared(self, notify_mock):
        instance = Mock(spec=Workspace)
        instance.id = 2
        instance.public = False
        instance.users.values_list.return_value = ("normuser", "user_with_workspaces")
        instance.groups.all.return_value = (self.orggroup,)
        instance.description = "New description"
        instance.last_modified = 123456000

        workspace_update(
            sender=Workspace,
            instance=instance,
            created=False,
            raw={},
            using="default",
            update_fields=('description', 'last_modified')
        )

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
        instance = Mock(spec=Workspace)
        instance.id = 4
        instance.public = True
        instance.description = "New description"
        instance.last_modified = 123456000

        workspace_update(
            sender=Workspace,
            instance=instance,
            created=False,
            raw={},
            using="default",
            update_fields=('description', 'last_modified')
        )

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

    def test_mac_install_should_be_ignored_post(self, notify_mock):
        instance = Mock(speck=CatalogueResource)

        update_users_or_groups(
            sender=CatalogueResource.users.through,
            instance=instance,
            action="post_add",
            reverse=False,
            model=User,
            pk_set={self.normuser.pk},
            using="default"
        )

        notify_mock.assert_not_called()

    def test_mac_update(self, notify_mock):
        instance = Mock(speck=CatalogueResource)
        instance.public = True

        mac_update(
            sender=CatalogueResource.users.through,
            instance=instance,
            created=False,
            raw=None
        )

        notify_mock.assert_called_once_with(
            {
                "component": instance.local_uri_part,
                "action": "update",
                "category": "component"
            },
            {"*"}
        )

    @patch("wirecloud.live.signals.handlers.channels")
    @patch("wirecloud.live.signals.handlers.async_to_sync")
    def test_notify(self, notify_mock, channels_mock, async_to_sync_mock):
        notify({}, ("a",))

    @patch("wirecloud.live.signals.handlers.m2m_changed")
    @patch("wirecloud.live.signals.handlers.post_save")
    def test_install_signals(self, notify_mock, channels_mock, async_to_sync_mock):
        install_signals()

    @patch("wirecloud.live.apps.install_signals")
    def test_live_app_ready(self, notify_mock, install_signals_mock):
        app = WirecloudLiveConfig("wirecloud.live", wirecloud.live)
        app.ready()

        install_signals_mock.toHaveBeenCalled()
