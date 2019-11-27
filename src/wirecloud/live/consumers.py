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

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from wirecloud.live.utils import build_group_name, WIRECLOUD_BROADCAST_GROUP


class LiveConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        user_group = build_group_name("live-%s" % self.scope["user"].username)
        await self.channel_layer.group_add(
            user_group,
            self.channel_name
        )
        await self.channel_layer.group_add(
            WIRECLOUD_BROADCAST_GROUP,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        user_group = build_group_name("live-%s" % self.scope["user"].username)
        await self.channel_layer.group_discard(
            user_group,
            self.channel_name
        )
        await self.channel_layer.group_discard(
            WIRECLOUD_BROADCAST_GROUP,
            self.channel_name
        )

    async def notification(self, event):
        await self.send_json(event['data'])
