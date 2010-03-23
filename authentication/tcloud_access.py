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


#

from django.contrib.auth.models import User
from user.models import UserProfile

from commons.http_utils import download_http_content
from django.utils import simplejson

class TCloudBackend:
    
    TCLOUD_AUTH_URL = "http://192.168.8.46:8080/TCloud/resources/validate/user/"

    def authenticate(self,username=None,password=None):
        (valid, tcloud_profile) = self.is_valid(username,password)
        
        if not valid:
            return None
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = User(username=username)
            user.save()
        
        profile, None = UserProfile.objects.get_or_create(user=user)
        
        profile.create_load_script(tcloud_profile)
        profile.save()
        
        user.set_password(password)
        user.save()

        return user

    def get_user(self,user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

    def is_valid (self,username=None,password=None):
        if not username or not password:
            return (False, None)
        
        #ask TCLOUD about the authentication
        if hasattr(self,'TCLOUD_AUTH_URL'):
            urlBase=self.TCLOUD_AUTH_URL;
            
            url = urlBase + username + "/"
            params = {}
        
            try:
                result_json = download_http_content(url,params)
                result = simplejson.loads(result_json)
                
                return (result['validateSession'], result_json)
            except Exception:
                return (False, None)
