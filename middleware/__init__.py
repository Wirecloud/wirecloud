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
import time

from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate, login, load_backend

SESSION_KEY = '_auth_user_id'
BACKEND_SESSION_KEY = '_auth_user_backend'

ANONYMOUS_PWD = 'anonymous'
ANONYMOUS_NAME = 'anonymous'
ANONYMOUS_SESSION_COOKIE = 'anonymousid'

def get_anonymous_user(request):
    anonymous_id = request.anonymous_id
    
    if anonymous_id:
        user = User.objects.get(id=anonymous_id)
    else:
        user_name = ANONYMOUS_NAME + unicode(time.time())
        user_name = user_name.replace(".","1")
        user = User(username=user_name)
        user.set_password(ANONYMOUS_PWD)
        user.save()
        #user.groups.add(Group.objects.get(name=ANONYMOUS_GROUP))
        request.anonymous_id = user.id
    
    user = authenticate(username=user.username, password=ANONYMOUS_PWD)
    login(request, user)
    
    return user

def get_user(request):
    try:
        user_id = request.session[SESSION_KEY]
        backend_path = request.session[BACKEND_SESSION_KEY]
        backend = load_backend(backend_path)
        user = backend.get_user(user_id) or get_anonymous_user(request)
    except KeyError, e:
        user = get_anonymous_user(request)
    return user