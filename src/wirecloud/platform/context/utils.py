# -*- coding: utf-8 -*-

# Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

import copy

from django.core.cache import cache

from wirecloud.platform.models import Constant
from wirecloud.platform.plugins import get_plugins

_wirecloud_platform_context_definitions = None
_wirecloud_workspace_context_definitions = None


def get_platform_context_definitions():

    global _wirecloud_platform_context_definitions

    if _wirecloud_platform_context_definitions is None:
        plugins = get_plugins()
        context = {}

        for plugin in plugins:
            context.update(plugin.get_platform_context_definitions())

        _wirecloud_platform_context_definitions = context

    return _wirecloud_platform_context_definitions


def get_platform_context_current_values(user):

    plugins = get_plugins()
    values = {}

    for plugin in plugins:
        values.update(plugin.get_platform_context_current_values(user))

    return values


def get_platform_context(user):

    context = copy.deepcopy(get_platform_context_definitions())
    values = get_platform_context_current_values(user)
    for key in values:
        context[key]['value'] = values[key]

    return context


def get_workspace_context_definitions():

    global _wirecloud_workspace_context_definitions

    if _wirecloud_workspace_context_definitions is None:
        plugins = get_plugins()
        context = {}

        for plugin in plugins:
            context.update(plugin.get_workspace_context_definitions())

        _wirecloud_workspace_context_definitions = context

    return _wirecloud_workspace_context_definitions


def get_workspace_context_current_values(workspace, user):

    plugins = get_plugins()
    values = {}

    for plugin in plugins:
        values.update(plugin.get_workspace_context_current_values(workspace, user))

    return values


def get_constant_context_values():
    res = {}

    constants = Constant.objects.all()
    for constant in constants:
        res[constant.concept.concept] = constant.value

    return res


def get_context_values(workspace, user):
    cache_key = 'constant_context/' + str(user.id)
    constant_context = cache.get(cache_key)
    if constant_context is None:
        constant_context = get_constant_context_values()
        cache.set(cache_key, constant_context)

    platform_context = constant_context
    platform_context.update(get_platform_context_current_values(user))

    return {
        'platform': platform_context,
        'workspace': get_workspace_context_current_values(workspace, user),
    }
