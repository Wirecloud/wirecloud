# -*- coding: utf-8 -*-

# Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django import template
from django.contrib.staticfiles import finders
from django.template import TemplateSyntaxError
from django.template.loader_tags import do_extends as django_do_extends, do_include as django_do_include
from django.utils.html import conditional_escape
from django.utils.safestring import mark_safe

from wirecloud.platform.plugins import get_constants, get_extra_javascripts, get_platform_css, get_wirecloud_ajax_endpoints
from wirecloud.platform.themes import get_active_theme_name


register = template.Library()


@register.tag('extends')
def do_extends(parser, token):
    """
    Signal that this template extends a parent template.

    This tag may be used in two ways: ``{% extends "base" %}`` (with quotes)
    uses the literal value "base" as the name of the parent template to extend,
    or ``{% extends variable %}`` uses the value of ``variable`` as either the
    name of the parent template to extend (if it evaluates to a string) or as
    the parent template itself (if it evaluates to a Template object).
    """
    bits = token.split_contents()
    if len(bits) != 2:
        raise TemplateSyntaxError("'%s' takes one argument" % bits[0])
    bits = token.split_contents()
    bits[1] = bits[1] + "|_wirecloud_theme_template:THEME"
    token.contents = " ".join(bits)
    return django_do_extends(parser, token)


@register.tag('include')
def do_include(parser, token):
    """
    Loads a template and renders it with the current context. You can pass
    additional context using keyword arguments.

    Example::

        {% include "foo/some_include" %}
        {% include "foo/some_include" with bar="BAZZ!" baz="BING!" %}

    Use the ``only`` argument to exclude the current context when rendering
    the included template::

        {% include "foo/some_include" only %}
        {% include "foo/some_include" with bar="1" only %}
    """
    bits = token.split_contents()
    if len(bits) < 2:
        raise TemplateSyntaxError(
            "%r tag takes at least one argument: the name of the template to "
            "be included." % bits[0]
        )

    bits[1] = bits[1] + "|_wirecloud_theme_template:THEME"
    token.contents = " ".join(bits)
    return django_do_include(parser, token)


@register.inclusion_tag('wirecloud/js_includes.html', takes_context=True)
def extra_javascripts(context, view):

    theme = context.get('THEME', get_active_theme_name())
    files = get_extra_javascripts(view)

    header_js = 'theme/%s/js/wirecloud/ui/WirecloudHeader.js' % theme
    found = finders.find(header_js)
    if found:
        for i, file in enumerate(files):
            if file == 'js/wirecloud/ui/WirecloudHeader.js':
                files[i] = header_js

    return {'files': files}


@register.inclusion_tag('wirecloud/css_includes.html', takes_context=True)
def platform_css(context, view):

    theme = context.get('THEME', get_active_theme_name())
    prefix = 'theme/%s/' % theme
    files = [{'path': prefix + filename, 'type': 'text/css' if filename.endswith('.css') else 'text/x-scss'} for filename in get_platform_css(view)]

    return {'files': files}


@register.inclusion_tag('wirecloud/bootstrap.html', takes_context=True)
def wirecloud_bootstrap(context, view):

    theme = context.get('THEME', get_active_theme_name())

    endpoints = get_wirecloud_ajax_endpoints(view)
    script = 'Wirecloud.URLs = {\n'
    for endpoint in endpoints:
        script += '    "' + endpoint['id'] + '": '
        if '%(' in endpoint['url']:
            script += "new Wirecloud.Utils.Template('" + endpoint['url'] + "'),\n"
        else:
            script += "'" + endpoint['url'] + "',\n"

    script += '};'

    constants_def = get_constants()
    constants = []
    for constant in constants_def:
        constants.append({'key': constant['key'], 'value': mark_safe(constant['value'])})
    constants.append({'key': 'CURRENT_MODE', 'value': mark_safe('"' + view + '"')})
    constants.append({'key': 'CURRENT_THEME', 'value': mark_safe('"' + theme + '"')})

    return {
        'script': mark_safe(script),
        'constants': constants,
    }


@register.filter
def _wirecloud_theme_template(template_name, theme):
    return "%s:%s" % (theme, template_name)


@register.filter
def wirecloud_breadcrum(value):
    components = value[1:].split('/')
    result = ' / '.join(['<span>%s</span>' % conditional_escape(component) for component in components])
    return mark_safe(result)
