# -*- coding: utf-8 -*-

# MORFEO Project 
# http://morfeo-project.org 
# 
# Component: EzWeb
# 
# (C) Copyright 2004 Telef�nica Investigaci�n y Desarrollo 
#     S.A.Unipersonal (Telef�nica I+D) 
# 
# Info about members and contributors of the MORFEO project 
# is available at: 
# 
#   http://morfeo-project.org/
# 
# This program is free software; you can redistribute it and/or modify 
# it under the terms of the GNU General Public License as published by 
# the Free Software Foundation; either version 2 of the License, or 
# (at your option) any later version. 
# 
# This program is distributed in the hope that it will be useful, 
# but WITHOUT ANY WARRANTY; without even the implied warranty of 
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
# GNU General Public License for more details. 
# 
# You should have received a copy of the GNU General Public License 
# along with this program; if not, write to the Free Software 
# Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA. 
# 
# If you want to use this software an plan to distribute a 
# proprietary application in any way, and you are not licensing and 
# distributing your source code under GPL, you probably need to 
# purchase a commercial license of the product.  More info about 
# licensing options is available at: 
# 
#   http://morfeo-project.org/
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