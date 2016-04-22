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

import json

from django.http import Http404, HttpResponse
from django.template import RequestContext, TemplateDoesNotExist
from django.template.loader import get_template
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from wirecloud.commons.baseviews.resource import Resource
from wirecloud.commons.utils.encoding import LazyEncoder
from wirecloud.commons.utils.http import get_absolute_static_url
from wirecloud.platform.plugins import get_plugins
from wirecloud.platform.themes import get_theme_metadata


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
        try:
            theme_info = get_theme_metadata(name)
        except ValueError:
            raise Http404

        desc = {
            "name": name,
            "label": theme_info.label,
            "baseurl": get_absolute_static_url("theme/%s/" % name, request),
            "templates": {}
        }

        template_descriptions = get_templates('classic')
        for template_id in template_descriptions:
            try:
                template = get_template("%s:%s" % (name, template_descriptions[template_id]))
            except TemplateDoesNotExist:
                template = get_template(template_descriptions[template_id])
            desc["templates"][template_id] = template.render(context)

        return HttpResponse(json.dumps(desc, cls=LazyEncoder, sort_keys=True), 'application/json')
