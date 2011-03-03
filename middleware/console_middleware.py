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

import sys
import traceback

from django.contrib.auth.views import redirect_to_login


class SiteLogin:
    """ This middleware requires a login for every view """

    def process_request(self, request):
        path = request.path
        if path == '/':
            initialpath = '/'
        else:
            initialpath = path.split('/')[1]
        if not (request.user.is_authenticated() or initialpath in ('public', 'login', 'logout', 'rss', 'site_media') or "/projmember/activate/" in path):
            return redirect_to_login(request.path, login_url="/login/")


class ConsoleExceptionMiddleware:

    def process_exception(self, request, exception):
        exc_info = sys.exc_info()
        print "######################## Exception #############################"
        print '\n'.join(traceback.format_exception(*(exc_info or sys.exc_info())))
        print "################################################################"
        #print repr(request)
        #print "################################################################"
