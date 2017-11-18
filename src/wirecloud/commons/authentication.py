# -*- coding: utf-8 -*-

# Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.utils.translation import LANGUAGE_SESSION_KEY, ugettext as _
from django.conf import settings


def logout(request, next_page=getattr(settings, 'LOGOUT_REDIRECT_URL', None), template_name='registration/logged_out.html'):

    old_lang = request.session.get(LANGUAGE_SESSION_KEY, None)

    # Django removes session cookie when calling request.session.flush()
    # and do not allow to create a new session id
    request.session.clear()
    request.session.cycle_key()

    if old_lang is not None:
        request.session[LANGUAGE_SESSION_KEY] = old_lang

    if next_page is None:
        return render(request, template_name, {'title': _('Logged out')})
    else:
        # Go to the next page
        return HttpResponseRedirect(next_page)
