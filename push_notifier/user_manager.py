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

from push_notifier.channel_manager import ChannelManager

class UserManager:
    users = dict()
    
    def get_user(self, username):
        try:
            return UserManager.users[username]
        except KeyError:
            UserManager.users[username] = User(username)
            
            return UserManager.users[username]
    get_user = classmethod(get_user) 
    
class User:
    def __init__(self, username):
        self.username = username
        self.callback = None
        self.channels = dict()
        self.response = ''
    
    def reset(self):
        if (self.callback):
            #Finishing connection with no changes on channels!
            self.callback("[]")
            
        self.callback = None
        self.channels = dict()
        self.response = ''   
        
    def subscribe(self, channel_ids):
        for channel_id in channel_ids:
            channel = ChannelManager.get_channel(id)
            
            self.channels.append(channel)
            channel.subscribe(self)
            
    def unsubscribe(self):
        self.reset()
        
        channel_keys = self.channels.keys()
        
        for channel_key in channel_keys:
            channel = self.channels[channel_key]
            
            channel.unsubscribe_user(self)
        
        self.channels.clear()
    
    def set_callback(self, callback):
        self.reset()
        self.callback = callback
    
    def notify(self):
        self.callback(self.get_response_json())
        
    def merge_response(self, id, value):
        #Dealing with last comma problem!
        if (self.response):
            self.response = self.response + ', '

        self.response = self.response + '{"id": %s, "value": "%s"}' % (id, value)
            
    def get_response_json(self):
        return '[' + self.response + ']'

    def __str__(self):
        return self.username