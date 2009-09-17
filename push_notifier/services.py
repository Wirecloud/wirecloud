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

import simplejson

import tornado.web

from push_notifier.external_channel import ChannelCollection
from push_notifier.client_response import ClientResponse

class NotifyClientsHandler(tornado.web.RequestHandler):
    def get(self):
        channel_values_json = self.get_argument('channels', None)

        if (not channel_values_json):
            return

        channel_values = simplejson.loads(channel_values_json)

        clients_to_notify = dict()

        for channel_dict in channel_values:
            channel_id = channel_dict['id']
            channel_value = channel_dict['value']

            channel = ChannelCollection.get_external_channel(channel_id)

            channel_clients = channel.get_clients()
            channel.reset_clients()

            for client in channel_clients:
                try:
                    client_response = clients_to_notify[client]
                except KeyError:
                    client_response = ClientResponse()

                #Merging response
                client_response.merge(channel_id, channel_value)

                #Storing response
                clients_to_notify[client] = client_response
                    
        clients = clients_to_notify.keys()

        for client_callback in clients:
            client_response = clients_to_notify[client_callback]

            #Deleting client callback from all channels!
            ChannelCollection.unsubscribe_client(client_callback)

            client_callback(client_response.get_json())

class RegisterSubscriptionHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        channel_json = self.get_argument('channels', None)

        channel_ids = simplejson.loads(channel_json)

        channel = ChannelCollection.subscribe_channels(self.async_callback(self.on_subscription_change), channel_ids)

        ChannelCollection.print_channels_status()

    def on_subscription_change(self, json_value):
        #Connection closed by client
        if self.request.connection.stream.closed():
            return

        self.finish(json_value)