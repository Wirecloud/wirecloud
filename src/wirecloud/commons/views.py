# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

import gettext as gettext_module
import importlib
import json
import os

from django.conf import settings
from django.contrib import auth
from django.contrib.auth.models import User
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils._os import upath
from django.utils.translation import check_for_language, get_language, to_locale, ugettext_lazy as _
from django.views.decorators.cache import cache_page
from django.views.i18n import render_javascript_catalog

from wirecloud.commons.baseviews import Resource, Service
from wirecloud.platform.plugins import get_plugins
from wirecloud.commons.utils.http import authentication_required, build_error_response, get_html_basic_error_response, consumes, parse_json_request, produces
from wirecloud.commons.search_indexes import get_search_engine, is_available
from wirecloud.platform.core.plugins import get_version_hash
from wirecloud.platform.themes import get_available_themes


LANGUAGE_QUERY_PARAMETER = 'language'

extra_formatters = {
    'text/html; charset=utf-8': get_html_basic_error_response,
    'application/xhtml+xml; charset=utf-8': get_html_basic_error_response,
}


def bad_request(request, exception=None):

    return build_error_response(request, 400, 'Bad Request', extra_formatters, context={'request_path': request.path})


def permission_denied(request, exception=None):

    return build_error_response(request, 403, 'Forbidden', extra_formatters, context={'request_path': request.path})


def page_not_found(request):

    return build_error_response(request, 404, 'Page Not Found', extra_formatters, context={'request_path': request.path})


def server_error(request):

    return build_error_response(request, 500, 'Internal Server Error', extra_formatters)


def get_javascript_catalog(locale, domain, packages):
    default_locale = to_locale(settings.LANGUAGE_CODE)
    t = {}
    paths = []
    en_selected = locale.startswith('en')
    en_catalog_missing = True
    # paths of requested packages
    for package in packages:
        p = importlib.import_module(package)
        path = os.path.join(os.path.dirname(upath(p.__file__)), 'locale')
        paths.append(path)
    # add the filesystem paths listed in the LOCALE_PATHS setting
    paths.extend(reversed(settings.LOCALE_PATHS))
    # first load all english languages files for defaults
    for path in paths:
        try:
            catalog = gettext_module.translation(domain, path, ['en'])
            t.update(catalog._catalog)
        except IOError:
            pass
        else:
            # 'en' is the selected language and at least one of the packages
            # listed in `packages` has an 'en' catalog
            if en_selected:
                en_catalog_missing = False
    # next load the settings.LANGUAGE_CODE translations if it isn't english
    if default_locale != 'en':
        for path in paths:
            try:
                catalog = gettext_module.translation(domain, path, [default_locale])
            except IOError:
                catalog = None
            if catalog is not None:
                t.update(catalog._catalog)
    # last load the currently selected language, if it isn't identical to the default.
    if locale != default_locale:
        # If the currently selected language is English but it doesn't have a
        # translation catalog (presumably due to being the language translated
        # from) then a wrong language catalog might have been loaded in the
        # previous step. It needs to be discarded.
        if en_selected and en_catalog_missing:
            t = {}
        else:
            locale_t = {}
            for path in paths:
                try:
                    catalog = gettext_module.translation(domain, path, [locale])
                except IOError:
                    catalog = None
                if catalog is not None:
                    locale_t.update(catalog._catalog)
            if locale_t:
                t = locale_t
    plural = None
    if '' in t:
        for l in t[''].split('\n'):
            if l.startswith('Plural-Forms:'):
                plural = l.split(':', 1)[1].strip()
    if plural is not None:
        # this should actually be a compiled function of a typical plural-form:
        # Plural-Forms: nplurals=3; plural=n%10==1 && n%100!=11 ? 0 :
        #               n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2;
        plural = [el.strip() for el in plural.split(';') if el.strip().startswith('plural=')][0].split('=', 1)[1]

    pdict = {}
    maxcnts = {}
    catalog = {}
    for k, v in t.items():
        if k == '':
            continue
        if isinstance(k, str):
            catalog[k] = v
        elif isinstance(k, tuple):
            msgid = k[0]
            cnt = k[1]
            maxcnts[msgid] = max(cnt, maxcnts.get(msgid, 0))
            pdict.setdefault(msgid, {})[cnt] = v
        else:
            raise TypeError(k)
    for k, v in pdict.items():
        catalog[k] = [v.get(i, '') for i in range(maxcnts[msgid] + 1)]

    return catalog, plural


@cache_page(60 * 60 * 24, key_prefix='js18n-%s' % get_version_hash())
def cached_javascript_catalog(request):

    language = request.GET.get(LANGUAGE_QUERY_PARAMETER)
    if not (language and check_for_language(language)):
        language = get_language()
    locale = to_locale(language)

    packages = ['wirecloud.commons', 'wirecloud.catalogue', 'wirecloud.platform']

    for plugin in get_plugins():
        packages.append(plugin.__module__.rsplit('.', 1)[0])

    for theme in get_available_themes():
        packages.append(theme)

    catalog, plural = get_javascript_catalog(locale, 'djangojs', packages)
    return render_javascript_catalog(catalog, plural)


class ResourceSearch(Resource):

    @produces(('application/json',))
    def read(self, request):

        querytext = request.GET.get('q', '')
        indexname = request.GET.get('namespace', '').strip()

        if indexname == '':
            message = _('Missing namespace GET parameter providing a search namespace')
            return build_error_response(request, 400, message)

        if not is_available(indexname):
            message = _('Invalid search namespace: %s' % indexname)
            return build_error_response(request, 422, message)

        try:
            pagenum = int(request.GET.get('pagenum', '1'))
        except ValueError:
            message = _('Invalid pagenum value: %s' % request.GET['pagenum'])
            return build_error_response(request, 422, message)

        try:
            maxresults = int(request.GET.get('maxresults', '30'))
        except ValueError:
            message = _('Invalid maxresults value: %s' % request.GET['maxresults'])
            return build_error_response(request, 422, message)

        orderby = tuple(entry.strip() for entry in request.GET.get('orderby', '').split(','))
        if orderby == ("",):
            orderby = None

        result = get_search_engine(indexname)(request, querytext, pagenum=pagenum, maxresults=maxresults, orderby=orderby)

        return HttpResponse(json.dumps(result, sort_keys=True), status=200, content_type='application/json; charset=utf-8')


class SwitchUserService(Service):

    @authentication_required
    @consumes(('application/json',))
    def process(self, request):

        if not request.user.is_superuser:
            return build_error_response(request, 403, _("You don't have permission to switch current session user"))

        user_info = parse_json_request(request)

        if "username" not in user_info:
            return build_error_response(request, 422, "Missing target user info")

        user_id = get_object_or_404(User, username=user_info['username']).id
        target_user = None
        for backend in auth.get_backends():
            try:
                target_user = backend.get_user(user_id)
            except:
                continue
            if target_user is None:
                continue
            # Annotate the user object with the path of the backend.
            target_user.backend = "%s.%s" % (backend.__module__, backend.__class__.__name__)
            break

        if target_user is None:
            raise Http404

        auth.login(request, target_user)

        return HttpResponse(status=204)
