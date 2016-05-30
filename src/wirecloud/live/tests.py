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

from __future__ import unicode_literals

import datetime

from django.contrib.auth.models import User
from mock import patch

from wirecloud.commons.utils.testcases import WirecloudTestCase
from wirecloud.platform.models import CatalogueResource, Workspace

@patch('wirecloud.live.models.notify')
class LiveNotificationsTestCase(WirecloudTestCase):

    fixtures = ('selenium_test_data',)
    tags = ('wirecloud-noselenium', 'wirecloud-live')

    def setUp(self):
        self.normuser = User.objects.get(username="normuser")

    def test_new_macs_are_notified(self, notify_mock):
        instance = CatalogueResource.objects.create(type=1, creation_date=datetime.datetime.now(), short_name="MyWidget", vendor="Wirecloud", version="1.0")
        instance.users.add(self.normuser)
        notify_mock.assert_called_once_with(
            {
                "component": "Wirecloud/MyWidget/1.0",
                "action": "installed"
            },
            "normuser"
        )

    def test_workspace_updates_are_notified(self, notify_mock):
        instance = Workspace.objects.get(pk="2")
        instance.description = "New description"
        instance.save()
        notify_mock.assert_called_once_with(
            {
                "workspace": 2,
                "action": "update"
            },
            "user_with_workspaces"
        )
