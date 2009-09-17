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

class ExternalChannel(object):
    def __init__(self, channel_id):
        self.blocked_clients = []
        self.channel_id = channel_id

    def subscribe_client(self, callback):
        self.blocked_clients.append(callback)

    def print_channel_status(self):
        logging.info('###### CHANNEL: %s' % self.channel_id)
        for client in self.blocked_clients:
            logging.info('  # CLIENT: %s' % client)

    def get_clients(self):
        return self.blocked_clients

    def reset_clients(self):
        self.blocked_clients = []

    def unsubscribe_client(self, client):
        try:
            self.blocked_clients.remove(client)
        except ValueError:
            pass

class ChannelCollection:
    channels = dict()

    def subscribe_channels(self, callback, channel_ids):
        for channel_id in channel_ids:
            channel = ChannelCollection.get_external_channel(channel_id)

            channel.subscribe_client(callback)
    subscribe_channels = classmethod(subscribe_channels)

    def print_channels_status(self):
        channel_ids = ChannelCollection.channels.keys()

        for channel_id in channel_ids: 
            channel = ChannelCollection.get_external_channel(channel_id)

            channel.print_channel_status()
    print_channels_status = classmethod(print_channels_status)

    def unsubscribe_client(self, client_callback):
        channel_ids = ChannelCollection.channels.keys()

        for channel_id in channel_ids: 
            channel = ChannelCollection.get_external_channel(channel_id)

            channel.unsubscribe_client(client_callback)
    unsubscribe_client = classmethod(unsubscribe_client)

    def get_external_channel(self, id):
        try:
            return ChannelCollection.channels[id]
        except KeyError:
            ChannelCollection.channels[id] = ChannelCollection._create_channel(id)

            return ChannelCollection.channels[id]
    get_external_channel = classmethod(get_external_channel) 

    def _create_channel(self, id):
        ChannelCollection.channels[id] = ExternalChannel(id)

        return ChannelCollection.channels[id]
    _create_channel = classmethod(_create_channel) 