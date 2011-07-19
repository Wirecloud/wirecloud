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
import os
import time
import urlparse
try:
    from functools import wraps
except ImportError:
    from django.utils.functional import wraps  # Python 2.4 fallback.

from django.conf import settings
#from django.contrib.auth import REDIRECT_FIELD_NAME
from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseServerError
from django.shortcuts import render_to_response
from django.template.defaultfilters import filesizeformat
from django.utils.translation import ugettext as _
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.utils.decorators import available_attrs

from commons.resource import Resource
from commons.utils import accepts, json_encode


def user_passes_test(test_func, login_url=None, redirect_field_name=REDIRECT_FIELD_NAME):
    """
    Decorator for views that checks that the user passes the given test,
    redirecting to the log-in page if necessary. The test should be a callable
    that takes the user object and returns True if the user passes.
    """

    def decorator(view_func):
        @wraps(view_func, assigned=available_attrs(view_func))
        def _wrapped_view(obj, request, *args, **kwargs):
            if test_func(request.user):
                return view_func(obj, request, *args, **kwargs)
            path = request.build_absolute_uri()
            # If the login url is the same scheme and net location then just
            # use the path as the "next" url.
            login_scheme, login_netloc = urlparse.urlparse(login_url or
                                                        settings.LOGIN_URL)[:2]
            current_scheme, current_netloc = urlparse.urlparse(path)[:2]
            if ((not login_scheme or login_scheme == current_scheme) and
                (not login_netloc or login_netloc == current_netloc)):
                path = request.get_full_path()
            from django.contrib.auth.views import redirect_to_login
            return redirect_to_login(path, login_url, redirect_field_name)
        return _wrapped_view
    return decorator


def method_login_required(function=None, redirect_field_name=REDIRECT_FIELD_NAME, login_url=None):
    """
    Decorator for views that checks that the user is logged in, redirecting
    to the log-in page if necessary.
    """
    actual_decorator = user_passes_test(
        lambda u: u.is_authenticated(),
        login_url=login_url,
        redirect_field_name=redirect_field_name
    )
    if function:
        return actual_decorator(function)
    return actual_decorator


class FileCollection(Resource):

    dir_name = 'uploads'
    dir_path = os.path.join(settings.GADGETS_ROOT, dir_name)
    MAX_UPLOAD_SIZE = 2621440  # 2'5MB
    CONTENT_TYPES = ['image']

    def check_file(self, file):
        """check the file content-type and the size"""

        content_type = file.content_type.split('/')[0]

        if content_type in self.CONTENT_TYPES:
            if file.size < self.MAX_UPLOAD_SIZE:
                return None
            else:
                return _('Please keep the file size under %(format)s. The current file size is %(size)s') % \
                        {"format": filesizeformat(self.MAX_UPLOAD_SIZE), "size": filesizeformat(file.size)}
        return _('The %s file type is not supported') % content_type

    def store_file(self, file, directory, newname=None):

        if not os.path.isdir(directory):
            os.makedirs(directory)

        try:
            if newname is None:
                dest_path = os.path.join(directory.encode("utf8"), file.name.encode("utf8"))
            else:
                dest_path = os.path.join(directory.encode("utf8"), newname.encode("utf8"))

            destination = open(dest_path, 'wb+')
            for chunk in file.chunks():
                destination.write(chunk)
            destination.close()
            return None

        except Exception, e:
            return _("Problem storing the file: %(errorMsg)s") % {'errorMsg': str(e)}

    @method_login_required
    def read(self, request):
        template = 'upload_file.html'
        sizeMB = filesizeformat(self.MAX_UPLOAD_SIZE)
        context = {'content_types': self.CONTENT_TYPES, 'max_size': sizeMB}
        return render_to_response(template, context)

    @method_login_required
    def create(self, request):

        #check params
        if 'file' not in request.FILES:
            msg = _("Missing file parameter")
        else:
            file = request.FILES['file']
            msg = self.check_file(file)  # check content-type and size

        # param errors
        if msg:
            if accepts(request, 'application/json'):
                mimetype = 'application/json; charset=UTF-8'
                msg = json_encode({"message": msg, "result": "error"})
            else:
                mimetype = 'text/html; charset=UTF-8'
            return HttpResponseBadRequest(msg, mimetype=mimetype)

        #store files ordering by user
        user_path = os.path.join(self.dir_path, request.user.username)
        #avoid rewriting files: change the filename
        basename, ext = os.path.splitext(file.name)
        filename = basename + '_' + unicode(int(time.time())) + ext

        msg = self.store_file(request.FILES['file'], user_path, filename)

        #errors
        if msg:
            if accepts(request, 'application/json'):
                mimetype = 'application/json; charset=UTF-8'
                msg = json_encode({"message": msg, "result": "error"})
                return HttpResponseServerError(msg, mimetype)
            else:
                mimetype = 'text/html; charset=UTF-8'
                return HttpResponse(msg, mimetype)

        #generate the url
        from deployment.urls import deployment as basePath
        if (request.META['SERVER_PROTOCOL'].lower().find('https') >= 0):
            protocol = "https://"
        else:
            protocol = "http://"

        url = os.path.join(protocol, request.get_host(), basePath, self.dir_name, request.user.username, filename)

        if accepts(request, 'application/json'):
            mimetype = 'application/json; charset=UTF-8'
            msg = json_encode({"message": url, 'result': 'error'})
            return HttpResponse(msg, mimetype=mimetype)
        else:
            mimetype = 'text/html; charset=UTF-8'
            template = 'upload_success.html'
            context = {'url': url}
            return render_to_response(template, context)
