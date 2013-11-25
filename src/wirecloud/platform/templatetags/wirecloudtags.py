# -*- coding: utf-8 -*-

# Copyright 2011-2012 Universidad Politécnica de Madrid

# This file is part of Wirecluod.

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


from django import template
from django.utils.html import conditional_escape
from django.utils.safestring import mark_safe

from wirecloud.platform.plugins import get_extra_javascripts, get_platform_css, get_wirecloud_ajax_endpoints


register = template.Library()


@register.inclusion_tag('wirecloud/js_includes.html', takes_context=True)
def extra_javascripts(context, view):
    files = get_extra_javascripts(view)

    return {'files': files, 'STATIC_URL': context['STATIC_URL']}


@register.inclusion_tag('wirecloud/css_includes.html', takes_context=True)
def platform_css(context, view):
    files = get_platform_css(view)

    return {'files': files, 'STATIC_URL': context['STATIC_URL']}


@register.inclusion_tag('wirecloud/bootstrap.html', takes_context=True)
def wirecloud_bootstrap(context, view):
    endpoints = get_wirecloud_ajax_endpoints(view)
    script = 'Wirecloud.URLs = {\n'
    for endpoint in endpoints:
        script += '    "' + endpoint['id'] + '": '
        if '%(' in endpoint['url']:
            script += "new Wirecloud.Utils.Template('" + endpoint['url'] + "'),\n"
        else:
            script += "'" + endpoint['url'] + "',\n"

    script += '};'
    return {'script': mark_safe(script), 'STATIC_URL': context['STATIC_URL']}


@register.filter
def wirecloud_breadcrum(value):
    components = value[1:].split('/')
    result = ' / '.join(['<span>%s</span>' % conditional_escape(component) for component in components])
    return mark_safe(result)
