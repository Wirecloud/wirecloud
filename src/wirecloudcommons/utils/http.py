# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import socket
from urlparse import urljoin

from django.conf import settings
from django.contrib.sites.models import get_current_site
from django.core.urlresolvers import reverse


def get_current_domain(request=None):
    try:
        return get_current_site(request).domain
    except:
        return socket.gethostbyaddr(socket.gethostname())[0]


def get_current_scheme():
    return 'http'


def get_absolute_reverse_url(viewname, request=None, **kwargs):
    path = reverse(viewname, **kwargs)
    scheme = get_current_scheme()
    return urljoin(scheme + '://' + get_current_domain(request) + '/', path)


def get_absolute_static_url(url, request=None):
    scheme = get_current_scheme()
    base = scheme + '://' + get_current_domain(request) + '/' + settings.STATIC_URL
    return urljoin(base, url)
