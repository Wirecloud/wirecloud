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


from django.utils.importlib import import_module
from django.core.exceptions import ImproperlyConfigured

_wirecloud_plugins = None
_wirecloud_features = None


def get_plugins():
    from django.conf import settings
    global _wirecloud_plugins
    global _wirecloud_features

    if _wirecloud_plugins is None:
        modules = getattr(settings, 'WIRECLOUD_PLUGINS', None)
        if modules is None:
            modules = ()

        plugins = []
        features = {}

        for path in modules:
            i = path.rfind('.')
            module, attr = path[:i], path[i + 1:]
            try:
                mod = import_module(module)
            except ImportError, e:
                raise ImproperlyConfigured('Error importing wirecloud plugin module %s: "%s"' % (module, e))

            try:
                plugin = getattr(mod, attr)()
            except AttributeError:
                raise ImproperlyConfigured('Module "%s" does not define a "%s" instanciable Wirecloud plugin' % (module, attr))

            plugin_features = plugin.get_features()
            for feature_name in plugin_features:
                if feature_name in features:
                    raise ImproperlyConfigured('Feature already declared by wirecloud plugin %s' % features[feature_name]['module'])

                features[feature_name] = {
                    'module': module,
                    'version': plugin_features[feature_name],
                }

            plugins.append(plugin)

        _wirecloud_plugins = tuple(plugins)
        _wirecloud_features = features

    return _wirecloud_plugins


def get_active_features():

    global _wirecloud_plugins
    global _wirecloud_features

    if _wirecloud_plugins is None:
        get_plugins()

    return _wirecloud_features


def clear_cache():
    global _wirecloud_plugins
    global _wirecloud_features

    _wirecloud_plugins = None
    _wirecloud_features = None


class WirecloudPlugin(object):

    features = {}

    def get_features(self):
        return self.features
