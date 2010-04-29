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

from django.contrib.auth.models import User, Group
from django.conf import settings
from commons.http_utils import download_http_content
from django.utils import simplejson


class EzSteroidsBackend:

    def authenticate(self, username=None, password=None):
        is_valid = self.is_valid(username, password)
        if not is_valid:
            return None
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = User(username=username)
            user.set_password(password)
            user.save()
        return user

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

    def is_valid(self, username=None, password=None):
        if username == None or password == '':
            return None
        # Ask PBUMS about the authentication
        if hasattr(settings, 'AUTHENTICATION_SERVER_URL'):
            urlBase = settings.AUTHENTICATION_SERVER_URL
            url = urlBase + "/api/login"
            params = {'username': username.encode('utf-8'), 'password': password.encode('utf-8')}
            try:
                result = download_http_content(url, params)
                result = simplejson.loads(result)
                return result['isValid']
            except Exception:
                return (False, None)

