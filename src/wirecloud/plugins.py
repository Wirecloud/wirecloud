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


from django.utils.importlib import import_module
from django.core.exceptions import ImproperlyConfigured
from django.core.urlresolvers import get_callable, get_script_prefix, get_resolver, NoReverseMatch
from django.utils.encoding import force_unicode
from django.utils.regex_helper import normalize

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

        def add_plugin(module, plugin):

            plugin_features = plugin.get_features()
            for feature_name in plugin_features:
                if feature_name in features:
                    raise ImproperlyConfigured('Feature already declared by wirecloud plugin %s' % features[feature_name]['module'])

                features[feature_name] = {
                    'module': module,
                    'version': plugin_features[feature_name],
                }

            plugins.append(plugin)

        from wirecloud.core.plugins import WirecloudCorePlugin
        add_plugin('wirecloud.WirecloudCorePlugin', WirecloudCorePlugin())

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

            add_plugin(module, plugin)

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


def get_wirecloud_ajax_endpoints(view):
    plugins = get_plugins()
    endpoints = []

    for plugin in plugins:
        endpoints += plugin.get_ajax_endpoints(view)

    return endpoints


def get_extra_javascripts(view):
    plugins = get_plugins()
    files = []

    for plugin in plugins:
        files += plugin.get_scripts(view)

    return files


def get_gadget_api_extensions(view):
    plugins = get_plugins()
    files = []

    for plugin in plugins:
        files += plugin.get_gadget_api_extensions(view)

    return files


def build_url_template(viewname, kwargs=[], urlconf=None, prefix=None):
    resolver = get_resolver(urlconf)

    if prefix is None:
        prefix = get_script_prefix()

    kwargs = list(kwargs)

    try:
        lookup_view = get_callable(viewname, True)
    except (ImportError, AttributeError), e:
        raise NoReverseMatch("Error importing '%s': %s." % (lookup_view, e))
    possibilities = resolver.reverse_dict.getlist(lookup_view)
    prefix_norm, prefix_args = normalize(prefix)[0]
    for possibility, pattern, defaults in possibilities:
        for result, params in possibility:
            if set(kwargs + defaults.keys()) != set(params + defaults.keys() + prefix_args):
                continue

            unicode_kwargs = dict([(k, u'#{' + force_unicode(k) + u'}') for k in kwargs])
            unicode_kwargs.update(defaults)
            return (prefix_norm + result) % unicode_kwargs

    # lookup_view can be URL label, or dotted path, or callable, Any of
    # these can be passed in at the top, but callables are not friendly in
    # error messages.
    m = getattr(lookup_view, '__module__', None)
    n = getattr(lookup_view, '__name__', None)
    if m is not None and n is not None:
        lookup_view_s = "%s.%s" % (m, n)
    else:
        lookup_view_s = lookup_view
    raise NoReverseMatch("Reverse for '%s' with keyword arguments '%s' not "
            "found." % (lookup_view_s, kwargs))


class WirecloudPlugin(object):

    features = {}

    def get_market_classes(self):
        return {}

    def get_features(self):
        return self.features

    def get_scripts(self, views):
        return ()

    def get_ajax_endpoints(self, views):
        return ()

    def get_gadget_api_extensions(self, views):
        return ()
