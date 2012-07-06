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

from django.conf import settings
from django.contrib.sites.models import get_current_site
from django.template import loader, Context


def generate_xhtml_operator_code(js_files, xhtml_url, request):

    api_url = "//" + get_current_site(request).domain + settings.STATIC_URL + 'js/WirecloudAPI/WirecloudOperatorAPI.js'

    t = loader.get_template('wirecloud/operator_xhtml.html')
    c = Context({'base_url': xhtml_url, 'js_files': [api_url] + js_files})

    xhtml = t.render(c)

    return xhtml
