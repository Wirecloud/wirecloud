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




import os
import codecs
from datetime import datetime

from django.conf import settings

from django.utils.translation import ugettext as _

def log(exception, request, file_name='logs'):
    """Prints msg to file_name log file"""
    try:
        log_file = os.path.join(settings.LOG_PATH, file_name + '.log')
    except Exception:
        log_file = os.path.join(settings.MEDIA_ROOT, 'logs', file_name + '.log')

    try:
        f = codecs.open(log_file, "a+", "utf-8")
        if request.user.username == "":
            user = "[" + _("Anonymous") + "]"
        else:
            user = request.user.username

        line = unicode('ERROR: %s %s %s\n' % (request.method, request.path, user))
        f.write(line)
        line = '[%s] %s\n' % (datetime.today().strftime('%d/%m/%Y %H:%M:%S'), exception)
        f.write(line)
        f.close()
    except IOError:
        pass
