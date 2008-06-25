# -*- coding: utf-8 -*-

# MORFEO Project 
# http://morfeo-project.org 
# 
# Component: EzWeb
# 
# (C) Copyright 2004 Telefónica Investigación y Desarrollo 
#     S.A.Unipersonal (Telefónica I+D) 
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

import sys
import traceback

from commons.logs import log
from commons.utils import get_xml_error

from django.http import Http404, HttpResponse, HttpResponseNotAllowed, HttpResponseServerError, QueryDict
from django.utils import datastructures

class HttpMethodNotAllowed(Exception):
    """
    Signals that request.method was not part of
    the list of permitted methods.
    """    

class Resource:
    def __init__(self, authentication=None, permitted_methods=None, mimetype=None):
        
        if not permitted_methods:
            permitted_methods = ["GET"]
        
        self.permitted_methods = [m.upper() for m in permitted_methods]
        
        self.mimetype = mimetype
    
    def __call__(self, request, *args, **kwargs):      
        try:
            return self.dispatch(request, self, *args, **kwargs)
        except HttpMethodNotAllowed:
            response = HttpResponseNotAllowed(self.permitted_methods)
            response.mimetype = self.mimetype
            return response
        except:
            exc_info = sys.exc_info()
            msg_array = traceback.format_exception(exc_info[0], exc_info[1], exc_info[2])
            msg = ""
            for line in msg_array:
              msg += line
            log(msg, request)

            msg = "[" + unicode(exc_info[0]) + "] " + unicode(exc_info[1])
            return HttpResponseServerError(get_xml_error(msg), mimetype='application/xml; charset=UTF-8')
    
    def adaptRequest(self, request):
        request._post, request._files = QueryDict(request.raw_post_data, encoding=request._encoding), datastructures.MultiValueDict()
        
        return request
    
    def dispatch(self, request, target, *args, **kwargs):
        request_method = request.method.upper()
        if request_method not in self.permitted_methods:
            raise HttpMethodNotAllowed
        
        if request_method == 'GET':
            return target.read(request, *args, **kwargs)
        elif request_method == 'POST':
            #PUT and DELETE request are wrapped in a POST request
            #Asking about request type it's needed here!
            if request.POST.has_key('_method'):
                _method = request.POST['_method'].upper()
                if _method == 'DELETE':
                    request = self.adaptRequest(request)
                    return target.delete(request, *args, **kwargs)
                elif _method == 'PUT':
                    request = self.adaptRequest(request)
                    return target.update(request, *args, **kwargs)
            
            #It's a real POST request!
            return target.create(request, *args, **kwargs)
        elif request_method == 'PUT':
            request = self.adaptRequest(request)
            return target.update(request, *args, **kwargs)
        elif request_method == 'DELETE':
            request = self.adaptRequest(request)
            return target.delete(request, *args, **kwargs)
        else:
            raise Http404
    