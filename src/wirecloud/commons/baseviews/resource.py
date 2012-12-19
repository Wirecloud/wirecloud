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

from django.http import Http404, HttpResponseNotAllowed, HttpResponseForbidden

from wirecloud.commons.exceptions import Http403, HttpMethodNotAllowed


class Resource(object):

    def __init__(self, authentication=None, permitted_methods=None, mimetype=None):

        if not permitted_methods:
            permitted_methods = ["GET"]

        self.permitted_methods = [m.upper() for m in permitted_methods]

        self.mimetype = mimetype

    def __call__(self, request, *args, **kwargs):
        try:
            response = self.dispatch(request, self, *args, **kwargs)

            return response
        except Http404:
            raise
        except Http403:
            return HttpResponseForbidden()
        except HttpMethodNotAllowed:
            return HttpResponseNotAllowed(self.permitted_methods)
        except:
            raise

    def adaptRequest(self, request):
        if request.META.get('CONTENT_LENGTH', '') != '':
            real_method = request.method
            request.method = 'POST'
            request._load_post_and_files()
            request.method = real_method

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
            if '_method' in request.POST:
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
