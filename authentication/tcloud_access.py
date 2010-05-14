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
    
    TCLOUD_AUTH_URL = "http://192.168.8.46:8080/tcloud/resources/org/%s/users/validate?username=%s"

    def authenticate(self,username=None,password=None,request=None):
        (valid, tcloud_profile) = self.is_valid(username,password, request)
        
        if not valid:
            return None
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = User(username=username)
            user.save()
        
        profile, created = UserProfile.objects.get_or_create(user=user)
        
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

    def is_valid (self,username=None,password=None, request=None):
        if not username or not request:
            return (False, None)
        
        #ask TCLOUD about the authentication
        if hasattr(self,'TCLOUD_AUTH_URL'):
            urlBase=self.TCLOUD_AUTH_URL;
            
            org = None
            cookie = None
            
            # Getting user's organization
            if (request.REQUEST.has_key('org')):
              org = request.REQUEST.get('org')
            
            if (request.COOKIES.has_key('JSESSIONID')):
              cookie = 'JSESSIONID=' + request.COOKIES['JSESSIONID']
            
            if not org or not cookie:
              return (False, None)
            
            url = self.TCLOUD_AUTH_URL % (org, username)
            
            params = {}
            
            headers = {}
            headers['Cookie'] = cookie
            headers['Accept'] = 'application/json'
        
            try:
                result_json = download_http_content(url,params, None, headers)
                result = simplejson.loads(result_json)
                
                return (result['validateSession'], result_json)
            except Exception , e:
                return (False, None)
