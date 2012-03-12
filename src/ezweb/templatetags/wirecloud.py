# -*- coding: utf-8 -*-

# Copyright 2011 Universidad Politécnica de Madrid

# This file is part of EzWeb.

# EzWeb is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# EzWeb is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with EzWeb.  If not, see <http://www.gnu.org/licenses/>.

from django import template
from django.utils.safestring import mark_safe

from ezweb.plugins import get_extra_javascripts


register = template.Library()

def extra_javascripts(context, view):
    files = get_extra_javascripts(view)

    return {'files': files, 'STATIC_URL': context['STATIC_URL']}
register.inclusion_tag('js_includes.html', takes_context=True)(extra_javascripts)

