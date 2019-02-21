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

from datetime import datetime
import json
import os
from urllib.parse import urlparse, urlunparse, parse_qs

from django.conf import settings
from django.contrib.auth.views import redirect_to_login as django_redirect_to_login
from django.core import urlresolvers
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.template import TemplateDoesNotExist
from django.utils.encoding import force_text
from django.utils.functional import Promise
from django.utils.http import urlencode
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_safe
from user_agents import parse as ua_parse

from wirecloud.commons.utils.cache import patch_cache_headers
from wirecloud.commons.utils.git import get_git_info
from wirecloud.commons.utils.http import build_error_response
import wirecloud.platform
from wirecloud.platform.core.plugins import get_version_hash
from wirecloud.platform.plugins import get_active_features_info
from wirecloud.platform.models import Workspace
from wirecloud.platform.themes import get_active_theme_name, get_available_themes
from wirecloud.platform.workspace.utils import get_workspace_list

START_TIME = datetime.now()


@cache_page(60 * 60 * 24, key_prefix='wirecloud-features-%s' % get_version_hash())
@require_safe
def feature_collection(request):
    features = get_active_features_info()

    response = HttpResponse(json.dumps(features, sort_keys=True), content_type='application/json; charset=UTF-8')
    return patch_cache_headers(response)


@require_safe
def version_entry(request):
    # git hash and release_date is only available on released versions
    # but we can retrieve it using get_git_info
    if not hasattr(wirecloud.platform, "__git_hash__"):
        wirecloud.platform.__git_hash__, wirecloud.platform.__release_date__, wirecloud.platform.__git_dirty__ = get_git_info()

    td = datetime.now() - START_TIME
    info = {
        "version": wirecloud.platform.__version__,
        "uptime": "%d d, %d h, %d m, %d s" % (td.days, td.seconds // 3600, (td.seconds // 60) % 60, td.seconds % 60),
        "version_hash": get_version_hash(),
        "doc": "https://wirecloud.github.io/wirecloud/restapi/v%s/" % wirecloud.platform.__application_mashup_version__,
        "userDoc": "https://wirecloud.readthedocs.io/en/%s/" % wirecloud.platform.__version__,
        "git_hash": wirecloud.platform.__git_hash__,
        "git_dirty": wirecloud.platform.__git_dirty__,
        "release_date": wirecloud.platform.__release_date__,
    }

    return HttpResponse(json.dumps(info), content_type='application/json; charset=UTF-8')


def resolve_url(to, *args, **kwargs):  # pragma: no cover
    """
    Return a URL appropriate for the arguments passed.
    The arguments could be:
        * A model: the model's `get_absolute_url()` function will be called.
        * A view name, possibly with arguments: `urlresolvers.reverse()` will
          be used to reverse-resolve the name.
        * A URL, which will be returned as-is.

    > Copied from django for workaround versions of django not including this patch:
    > https://code.djangoproject.com/ticket/24097
    """
    # If it's a model, use get_absolute_url()
    if hasattr(to, 'get_absolute_url'):
        return to.get_absolute_url()

    if isinstance(to, Promise):
        # Expand the lazy instance, as it can cause issues when it is passed
        # further to some Python functions like urlparse.
        to = force_text(to)

    if isinstance(to, str):
        # Handle relative URLs
        if to.startswith(('./', '../')):
            return to

    # Next try a reverse URL resolution.
    try:
        return urlresolvers.reverse(to, args=args, kwargs=kwargs)
    except urlresolvers.NoReverseMatch:
        # If this is a callable, re-raise.
        if callable(to):
            raise
        # If this doesn't "feel" like a URL, re-raise.
        if '/' not in to and '.' not in to:
            raise

    # Finally, fall back and assume it's a URL
    return to


def redirect_to_login(*args, **kwargs):
    kwargs['login_url'] = resolve_url(kwargs.get('login_url') or settings.LOGIN_URL)
    return django_redirect_to_login(*args, **kwargs)


def render_root_page(request):
    return auto_select_workspace(request, request.GET.get('mode', None))


def auto_select_workspace(request, mode=None):

    if settings.ALLOW_ANONYMOUS_ACCESS is False and request.user.is_authenticated() is False:
        return redirect_to_login(request.get_full_path())

    if request.user.is_authenticated():
        url = urlresolvers.reverse('wirecloud.workspace_view', kwargs={
            'owner': 'wirecloud',
            'name': 'home'
        })

        parameters = {}
        if mode:
            parameters['mode'] = mode

        if 'theme' in request.GET:
            parameters['theme'] = request.GET['theme']

        if len(parameters) > 0:
            url += '?' + urlencode(parameters)

        return HttpResponseRedirect(url)
    else:
        return render_workspace_view(request, "wirecloud", "landing")


def render_workspace_view(request, owner, name):

    if settings.ALLOW_ANONYMOUS_ACCESS is False and request.user.is_authenticated() is False:
        return redirect_to_login(request.get_full_path())

    get_workspace_list(request.user)

    workspace = get_object_or_404(Workspace, creator__username=owner, name=name)
    if not workspace.is_available_for(request.user):
        if request.user.is_authenticated():
            return build_error_response(request, 403, 'forbidden')
        else:
            return redirect_to_login(request.get_full_path())
    elif not request.user.is_authenticated():
        # Ensure user has a session
        request.session[settings.LANGUAGE_COOKIE_NAME] = request.session.get(settings.LANGUAGE_COOKIE_NAME, None)

    return render_wirecloud(request, title=workspace.name, description=workspace.description)


def get_default_view(request):

    if 'default_mode' not in request.session:
        user_agent = ua_parse(request.META.get('HTTP_USER_AGENT', ''))
        if user_agent.is_mobile:
            mode = 'smartphone'
        else:
            mode = 'classic'

        request.session['default_mode'] = mode

    return request.session['default_mode']


def remove_query_parameter(request, parameter):
    url = urlparse(request.build_absolute_uri())
    query_params = parse_qs(url.query, True)
    del query_params[parameter]
    return HttpResponseRedirect(urlunparse((
        url.scheme,
        url.netloc,
        url.path,
        url.params,
        urlencode(query_params, True),
        url.fragment
    )))


def render_wirecloud(request, view_type=None, title=None, description=None):

    if view_type is None:
        if 'mode' in request.GET:
            view_type = request.GET['mode']
        else:
            view_type = get_default_view(request)

    theme = request.GET.get('theme', get_active_theme_name())
    if theme not in get_available_themes():
        return remove_query_parameter(request, 'theme')

    context = {
        'title': title,
        'description': description,
        'THEME': theme,
        'VIEW_MODE': view_type,
        'WIRECLOUD_VERSION_HASH': get_version_hash(),
        'environ': os.environ
    }

    try:

        return render(request, theme + ':wirecloud/views/%s.html' % view_type, context=context, content_type="application/xhtml+xml; charset=UTF-8")

    except TemplateDoesNotExist:

        if 'mode' in request.GET:
            return remove_query_parameter(request, 'mode')
        else:
            view_type = get_default_view(request)
            return render_wirecloud(request, view_type, title, description)
