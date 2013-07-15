# -*- coding: utf-8 -*-

# Copyright 2013 Universidad Politécnica de Madrid

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


import json

from django.http import HttpResponse
from django.template import RequestContext
from django.template.loader import get_template
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from wirecloud.commons.baseviews.resource import Resource
from wirecloud.platform.plugins import get_plugins

_wirecloud_templates = {}

def get_templates(view):

    global _wirecloud_templates

    if view not in _wirecloud_templates:
        plugins = get_plugins()
        templates = {}

        for plugin in plugins:
            templates.update(plugin.get_templates(view))

        _wirecloud_templates[view] = templates

    return _wirecloud_templates[view]


class ThemeEntry(Resource):

    @method_decorator(cache_page(60 * 60 * 24 * 365))
    def read(self, request, name):

        context = RequestContext(request)
        templates = {}
        template_descriptions = get_templates('index')
        for template_id in template_descriptions:
            template = get_template(template_descriptions[template_id])
            templates[template_id] = template.render(context)

        return HttpResponse(json.dumps(templates), 'application/json')
