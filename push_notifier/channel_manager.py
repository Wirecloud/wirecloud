# -*- coding: utf-8 -*-

#...............................licence...........................................
#
#     (C) Copyright 2008 Telefonica Investigacion y Desarrollo
#     S.A.Unipersonal (Telefonica I+D)
#
#     This file is part of Morfeo EzWeb Platform.
#
#     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
#     it under the terms of the GNU Affero General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU Affero General Public License for more details.
#
#     You should have received a copy of the GNU Affero General Public License
#     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
#
#     Info about members and contributors of the MORFEO project
#     is available at
#
#     http://morfeo-project.org
#
#...............................licence...........................................#

import logging


class ChannelManager:

    channels = dict()

    def print_channels_status(self):
        channel_ids = ChannelManager.channels.keys()

        for channel_id in channel_ids:
            channel = ChannelManager.get_channel(channel_id)

            channel.print_status()
    print_channels_status = classmethod(print_channels_status)

    def get_channel(self, id):
        try:
            return ChannelManager.channels[id]
        except KeyError:
            ChannelManager.channels[id] = Channel(id)

            return ChannelManager.channels[id]
    get_channel = classmethod(get_channel)


class Channel:

    def __init__(self, id):
        self.users = []
        self.id = id

    def subscribe_user(self, user):
        self.users.append(user)

    def print_status(self):
        logging.info('###### CHANNEL: %s' % self.id)
        for user in self.users:
            logging.info('  # USER: %s' % user)

    def get_users(self):
        return self.users

    def reset(self):
        self.users = []

    def unsubscribe_user(self, user):
        try:
            self.users.remove(user)
        except ValueError:
            pass
