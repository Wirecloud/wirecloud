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

from django.conf import settings
from django.utils.cache import patch_vary_headers
from django.utils.http import cookie_date

class SessionMiddleware(object):
    
    def process_request(self, request):
        engine = __import__(settings.SESSION_ENGINE, {}, {}, [''])
        user_info = request.COOKIES.get(settings.SESSION_COOKIE_NAME, None)
        
        session_key = None
        request.anonymous_id = None
        
        if user_info:
            try:
                user_info = eval(user_info)
                request.anonymous_id = user_info['anonymous_id']
                session_key = user_info['session_id']
            except Exception:
                pass
        
        request.session = engine.SessionStore(session_key)

    def process_response(self, request, response):
        """
        If request.session was modified, or if the configuration is to save the
        session every time, save the changes and set a session cookie.
        """
        try:
            accessed = request.session.accessed
            modified = request.session.modified
        except AttributeError:
            pass
        else:
            if accessed:
                patch_vary_headers(response, ('Cookie',))
            if True or settings.SESSION_SAVE_EVERY_REQUEST:
                if request.session.get_expire_at_browser_close():
                    max_age = None
                    expires = None
                else:
                    max_age = request.session.get_expiry_age()
                    expires_time = time.time() + max_age
                    expires = cookie_date(expires_time)
                # Save the session data and refresh the client cookie.
                request.session.save()
                
                #saving the user id in the cookie
                user_info = {'session_id': request.session.session_key, 'anonymous_id': request.anonymous_id}
                
                response.set_cookie(settings.SESSION_COOKIE_NAME,
                        user_info, max_age=max_age,
                        expires=expires, domain=settings.SESSION_COOKIE_DOMAIN,
                        path=settings.SESSION_COOKIE_PATH,
                        secure=settings.SESSION_COOKIE_SECURE or None)
        return response   
