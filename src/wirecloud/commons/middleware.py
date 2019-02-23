# -*- coding: utf-8 -*-

# Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

from importlib import import_module

from django.contrib.auth.middleware import get_user
from django.core.urlresolvers import reverse
from django.utils.functional import SimpleLazyObject
from django.utils.http import http_date, parse_http_date_safe
from django.utils.translation import ugettext as _

from wirecloud.commons.exceptions import HttpBadCredentials


class URLMiddleware(object):

    _middleware = {}
    _path_mapping = None

    def load_middleware(self, group):
        """
        Populate middleware lists from settings.URL_MIDDLEWARE_CLASSES.
        """
        from django.conf import settings
        from django.core import exceptions

        middleware = {
            'process_request': [],
            'process_view': [],
            'process_template_response': [],
            'process_response': [],
            'process_exception': [],
        }
        for middleware_path in settings.URL_MIDDLEWARE_CLASSES[group]:
            try:
                mw_module, mw_classname = middleware_path.rsplit('.', 1)
            except ValueError:
                raise exceptions.ImproperlyConfigured('%s isn\'t a middleware module' % middleware_path)
            try:
                mod = import_module(mw_module)
            except ImportError as e:
                raise exceptions.ImproperlyConfigured('Error importing middleware %s: "%s"' % (mw_module, e))
            try:
                mw_class = getattr(mod, mw_classname)
            except AttributeError:
                raise exceptions.ImproperlyConfigured('Middleware module "%s" does not define a "%s" class' % (mw_module, mw_classname))
            try:
                mw_instance = mw_class()
            except exceptions.MiddlewareNotUsed:
                continue

            if hasattr(mw_instance, 'process_request'):
                middleware['process_request'].append(mw_instance.process_request)
            if hasattr(mw_instance, 'process_view'):
                middleware['process_view'].append(mw_instance.process_view)
            if hasattr(mw_instance, 'process_template_response'):
                middleware['process_template_response'].insert(0, mw_instance.process_template_response)
            if hasattr(mw_instance, 'process_response'):
                middleware['process_response'].insert(0, mw_instance.process_response)
            if hasattr(mw_instance, 'process_exception'):
                middleware['process_exception'].insert(0, mw_instance.process_exception)

        # We only assign to this when initialization is complete as it is used
        # as a flag for initialization being complete.
        self._middleware[group] = middleware

    def get_matched_middleware(self, path, middleware_method):

        if self._path_mapping is None:

            from django.conf import settings

            self._path_mapping = {
                '/api/': 'api'
            }

            if 'wirecloud.platform' in settings.INSTALLED_APPS:
                proxy_path = reverse('wirecloud|proxy', kwargs={'protocol': 'a', 'domain': 'a', 'path': ''})[:-len('a/a')]
                self._path_mapping[proxy_path] = 'proxy'

        group = 'default'
        for path_mapping in self._path_mapping:
            if path.startswith(path_mapping):
                group = self._path_mapping[path_mapping]
                break

        if group not in self._middleware:
            self.load_middleware(group)

        return self._middleware[group][middleware_method]

    def process_request(self, request):
        matched_middleware = self.get_matched_middleware(request.path, 'process_request')
        for middleware in matched_middleware:
            response = middleware(request)
            if response:
                return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        matched_middleware = self.get_matched_middleware(request.path, 'process_view')
        for middleware in matched_middleware:
            response = middleware(request, view_func, view_args, view_kwargs)
            if response:
                return response

    def process_template_response(self, request, response):
        matched_middleware = self.get_matched_middleware(request.path, 'process_template_response')
        for middleware in matched_middleware:
            response = middleware(request, response)
        return response

    def process_response(self, request, response):
        matched_middleware = self.get_matched_middleware(request.path, 'process_response')
        for middleware in matched_middleware:
            response = middleware(request, response)
        return response

    def process_exception(self, request, exception):
        matched_middleware = self.get_matched_middleware(request.path, 'process_exception')
        for middleware in matched_middleware:
            response = middleware(request, exception)
            if response:
                return response


def get_api_user(request):

    from wirecloud.platform.plugins import get_api_auth_backends

    parts = request.META['HTTP_AUTHORIZATION'].split(' ', 1)
    if len(parts) != 2:
        raise HttpBadCredentials(_('Bad credentials'))

    (auth_type, token) = parts
    backends = get_api_auth_backends()
    try:
        return backends[auth_type](auth_type, token)
    except HttpBadCredentials:
        raise
    except:
        raise HttpBadCredentials(_('Bad credentials'), '%(auth_type)s realm="WireCloud", error="invalid_token", error_description="bad credentials"' % {"auth_type": auth_type})


class AuthenticationMiddleware(object):

    def process_request(self, request):

        if 'HTTP_AUTHORIZATION' in request.META:
            request.user = SimpleLazyObject(lambda: get_api_user(request))
        else:
            request.user = SimpleLazyObject(lambda: get_user(request))


class ConditionalGetMiddleware(object):
    """
    Handles conditional GET operations. If the response has a ETag or
    Last-Modified header, and the request has If-None-Match or
    If-Modified-Since, the response is replaced by an HttpNotModified.

    Also sets the Date and Content-Length response-headers.
    """
    def process_response(self, request, response):
        response['Date'] = http_date()
        if not response.has_header('Content-Length') and not response.streaming:
            response['Content-Length'] = str(len(response.content))

        if response.has_header('ETag'):
            if_none_match = request.META.get('HTTP_IF_NONE_MATCH')
            if if_none_match == response['ETag']:
                # Setting the status is enough here. The response handling path
                # automatically removes content for this status code (in
                # http.conditional_content_removal()).
                response.status_code = 304
                return response

        if response.has_header('Last-Modified'):
            if_modified_since = request.META.get('HTTP_IF_MODIFIED_SINCE')
            if if_modified_since is not None:
                try:
                    # IE adds a length attribute to the If-Modified-Since header
                    separator = if_modified_since.index(';')
                    if_modified_since = if_modified_since[0:separator]
                except:
                    pass
                if_modified_since = parse_http_date_safe(if_modified_since)
            if if_modified_since is not None:
                last_modified = parse_http_date_safe(response['Last-Modified'])
                if last_modified is not None and last_modified <= if_modified_since:
                    # Setting the status code is enough here (same reasons as
                    # above).
                    response.status_code = 304

        return response
