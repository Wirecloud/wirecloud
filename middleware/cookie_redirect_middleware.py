# -*- coding: utf-8 -*-
from hashlib import sha1

from django.conf import settings

from authentication import logout


class CookieRedirectMiddleware(object):

    def process_view(self, request, view_func, view_args, view_kwargs):
        if (hasattr(settings, 'AUTHENTICATION_SERVER_URL')
            and hasattr(settings, 'HTTP_REFERER')
            and view_func == logout):
            auth_server = getattr(settings, 'AUTHENTICATION_SERVER_URL')
            next_page = view_kwargs.get('next_page', settings.LOGOUT_URL)
            view_kwargs['next_page'] = "%s/api/logout/?next=%s" % (auth_server,
                                                                   next_page)
            return view_func(request, *view_args, **view_kwargs)

    def process_response(self, request, response):
        domain = settings.SESSION_COOKIE_DOMAIN
        if (request.user and request.user.is_authenticated() and
            request.user.username != getattr(request, 'anonymous_id', '')):
            cookie = {'key': 'username',
                      'value': request.user.username,
                      'domain': domain}
            token = self._get_hash(cookie)
            response.set_cookie('token', token, domain=domain)
            # 302: Status for redirect response
            if response.status_code == 302:
                response.set_cookie(**cookie)
            else:
                response.delete_cookie('username', domain=domain)
        else:
            response.delete_cookie('username', domain=domain)
            response.delete_cookie('token', domain=domain)
        return response

    def _get_sorted_cookies(self, cookies):
        cookie_list = []
        cookie_keys = sorted(cookies.keys())
        for cookie in cookie_keys:
            cookie_list.append("%s=%s" % (cookie, cookies[cookie]))
        return "; ".join(cookie_list)

    def _get_hash(self, cookies):
        if cookies:
            if isinstance(cookies, dict):
                return sha1(self._get_sorted_cookies(cookies)).hexdigest()
            else:
                return sha1(cookies).hexdigest()
        return None
