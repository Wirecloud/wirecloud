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

from push_notifier.channel_manager import ChannelManager
from push_notifier.user_manager import UserManager

class NotifyUsersRequestHandler(tornado.web.RequestHandler):
    def get(self):
        channel_values_json = self.get_argument('channels', None)

        if (not channel_values_json):
            self.write("Missing channels! Error!")
            self.finish()
            return

        channel_values = simplejson.loads(channel_values_json)
        
        print channel_values

        users_to_notify = dict()

        for channel_dict in channel_values:
            channel_id = channel_dict['id']
            channel_value = channel_dict['value']

            channel = ChannelManager.get_channel(channel_id)

            channel_users = channel.get_users()
            
            #Deleting users assotiated with channel!
            channel.reset()

            for user in channel_users:
                #Merging response
                user.merge_response(channel_id, channel_value)

                #Storing users to be notified!
                users_to_notify[user.username] = user
                    
        user_keys = users_to_notify.keys()

        for user_key in user_keys:
            user = users_to_notify[user_key]

            #Deleting user subscriptions from all channels!
            user.unsubscribe()
            
            user.notify()

class UserSubscriptionRequestHandler(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def get(self):
        channel_json = self.get_argument('channels', None)
        
        if (not channel_json):
            self.write("Missing channels! Error!")
            self.finish()
            return
        
        channel_ids = simplejson.loads(channel_json)
        
        username = self.get_argument('user', None)

        if (not username):
            self.write("Missing username! Error!")
            self.finish()
            return
        
        user = UserManager.get_user(username)
        
        user.set_callback(self.async_callback(self.on_subscription_change))
        
        for channel_id in channel_ids:
            channel = ChannelManager.get_channel(channel_id)

            channel.subscribe_user(user)

        ChannelManager.print_channels_status()

    def on_subscription_change(self, json_value):
        #Connection closed by client
        if self.request.connection.stream.closed():
            return

        self.finish(json_value)