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
from urllib import quote, unquote

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
                user_info = unquote(user_info)
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
                #user_info = "{'session_id':" + request.session.session_key +"/"+"anonymous_id:" + request.anonymous_id
                user_info = unicode({'session_id': request.session.session_key, 'anonymous_id': request.anonymous_id})

                user_info = quote(user_info)

                response.set_cookie(settings.SESSION_COOKIE_NAME,
                        user_info, max_age=max_age,
                        expires=expires, domain=settings.SESSION_COOKIE_DOMAIN,
                        path=settings.SESSION_COOKIE_PATH,
                        secure=settings.SESSION_COOKIE_SECURE or None)
        return response
