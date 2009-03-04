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

import StringIO

import sys
import traceback

from datetime import datetime

from django.conf import settings
from django.utils.translation import ugettext as _

from commons.log_file_manager import FileLogManager

#Logging = 2, default value
logging = 2
if ('LOGGING_LEVEL' in dir(settings)):
    if settings.LOGGING_LEVEL >= 0 and settings.LOGGING_LEVEL <=3:
        logging = settings.LOGGING_LEVEL

log_file_manager = FileLogManager(logging)

def log(message, request, file_name='error'):
    log_file_manager.write_log_header(request, None, file_name)
    log_file_manager.write_text(message, file_name)

def log_exception(request, exception, file_name='error'):
    if logging >= 1:
        return
    
    exc_type, exc_value, exc_tb = sys.exc_info()
    info_array = traceback.format_exception(exc_type, exc_value, exc_tb)
    
    info = "\n"
    for line in info_array:
        info += line

    log_file_manager.write_file(info, request, file_name)

    exc_name = unicode(exc_type.__name__)
    exc_desc = str(exc_value).decode("utf-8")

    msg = "[%(exc_name)s] %(exc_desc)s" % {"exc_name": exc_name, "exc_desc": exc_desc}
    return msg

def log_detailed_exception(request, traced_exception, file_name='error'):
    msg_for_tracing = None
    msg_to_user = traced_exception.get_inner_exception_message()
    
    if logging == 1:
        msg_for_tracing = traced_exception.get_inner_exception_info()
    else:
        msg_for_tracing = traced_exception.print_full_trace()

    log_file_manager.write_log_header(request, None, 'error')
    log_file_manager.write_text(msg_for_tracing, 'error')

    return msg_to_user

def get_full_request_data(request):  
    arguments = StringIO.StringIO()
    
    dict_pairs = [(request.GET, 'GET'), (request.POST, 'POST')]
    
    for (dict, name) in dict_pairs: 
        keys = dict.keys()
        
        arguments.write('\n %s arguments:' % (name))
        for key in keys:
            arguments.write('\n   - "%s": %s' % (key, dict[key]))
    
    arguments.write('\n')
    
    return arguments.getvalue()
    

def log_request(request, response, file_name='access'):    
    if logging >=1 and logging <=3:
        log_file_manager.write_log_header(request, response, file_name)
    
    if logging == 3:
        msg = get_full_request_data(request)
        
        log_file_manager.write_log_header(request, response, 'debug')
        log_file_manager.write_text(msg, 'debug')   

