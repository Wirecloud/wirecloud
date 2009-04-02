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

from django.utils.translation import ugettext as _

from commons.logs_exception import TracedServerError

from django.utils.translation import ugettext as _

class Http403(Exception):
    pass

def user_authentication(request, user_name):
    user = request.user
    if not user.is_authenticated():
        raise Http403 (_("You must be logged"))

    if user_name and user.username != user_name:
        raise Http403 (_("You do not have permission"))

    return user

def get_user_authentication(request):
    user = request.user
    if not user.is_authenticated():
        raise Http403 (_("You must be logged"))

    return user
