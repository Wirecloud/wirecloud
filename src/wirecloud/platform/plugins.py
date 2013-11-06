# -*- coding: utf-8 -*-

# Copyright (c) 2011-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

import inspect

from django.utils.importlib import import_module
try:
    from django.conf.urls import patterns
except ImportError:  # pragma: no cover
    # for Django version less than 1.4
    from django.conf.urls.defaults import patterns
from django.core.exceptions import ImproperlyConfigured
from django.core.urlresolvers import get_ns_resolver, get_resolver, get_script_prefix, NoReverseMatch
from django.utils.encoding import force_unicode
from django.utils.regex_helper import normalize

_wirecloud_plugins = None
_wirecloud_features = None

def find_wirecloud_plugins():

    from django.conf import settings

    modules = []

    for app in settings.INSTALLED_APPS:

        if app == 'wirecloud.platform':
            continue

        try:
            mod = import_module('%s.plugins' % app)
        except:
            continue

        mod_plugins = [cls for name, cls in mod.__dict__.items() if inspect.isclass(cls) and cls != WirecloudPlugin and issubclass(cls, WirecloudPlugin)]
        modules += mod_plugins

    return modules

def get_plugins():
    from django.conf import settings
    global _wirecloud_plugins
    global _wirecloud_features

    if _wirecloud_plugins is None:
        modules = getattr(settings, 'WIRECLOUD_PLUGINS', None)
        if modules is None:
            modules = find_wirecloud_plugins()

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

        from wirecloud.platform.core.plugins import WirecloudCorePlugin
        add_plugin('wirecloud.platform.WirecloudCorePlugin', WirecloudCorePlugin())

        for entry in modules:
            if isinstance(entry, basestring):
                i = entry.rfind('.')
                module, attr = entry[:i], entry[i + 1:]
                try:
                    mod = import_module(module)
                except ImportError, e:
                    raise ImproperlyConfigured('Error importing wirecloud plugin module %s: "%s"' % (module, e))

                try:
                    plugin = getattr(mod, attr)()
                except AttributeError:
                    raise ImproperlyConfigured('Module "%s" does not define a "%s" instanciable Wirecloud plugin' % (module, attr))
            elif inspect.isclass(entry):
                plugin = entry()
            else:
                raise ImproperlyConfigured('Error importing wirecloud plugin %s: "%s"' % entry)

            add_plugin(plugin.__module__, plugin)

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


def get_plugin_urls():
    plugins = get_plugins()

    urls = patterns('',)

    for plugin in plugins:
        urls += plugin.get_urls()

    return urls


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


def get_widget_api_extensions(view):
    plugins = get_plugins()
    files = []

    for plugin in plugins:
        files += plugin.get_widget_api_extensions(view)

    return files


def get_operator_api_extensions(view):
    plugins = get_plugins()
    files = []

    for plugin in plugins:
        files += plugin.get_operator_api_extensions(view)

    return files


def get_platform_css(view):
    plugins = get_plugins()
    files = []

    for plugin in plugins:
        files += plugin.get_platform_css(view)

    return files


def build_url_template(viewname, kwargs=[], urlconf=None, prefix=None, current_app=None):
    resolver = get_resolver(urlconf)

    if prefix is None:
        prefix = get_script_prefix()

    kwargs = list(kwargs)

    parts = viewname.split(':')
    parts.reverse()
    view = parts[0]
    path = parts[1:]

    resolved_path = []
    ns_pattern = ''
    while path:
        ns = path.pop()

        # Lookup the name to see if it could be an app identifier
        try:
            app_list = resolver.app_dict[ns]
            # Yes! Path part matches an app in the current Resolver
            if current_app and current_app in app_list:
                # If we are reversing for a particular app,
                # use that namespace
                ns = current_app
            elif ns not in app_list:
                # The name isn't shared by one of the instances
                # (i.e., the default) so just pick the first instance
                # as the default.
                ns = app_list[0]
        except KeyError:
            pass

        try:
            extra, resolver = resolver.namespace_dict[ns]
            resolved_path.append(ns)
            ns_pattern = ns_pattern + extra
        except KeyError, key:
            if resolved_path:
                raise NoReverseMatch(
                    "%s is not a registered namespace inside '%s'" %
                    (key, ':'.join(resolved_path)))
            else:
                raise NoReverseMatch("%s is not a registered namespace" %
                                     key)
    if ns_pattern:
        resolver = get_ns_resolver(ns_pattern, resolver)

    possibilities = resolver.reverse_dict.getlist(view)
    prefix_norm, prefix_args = normalize(prefix)[0]
    for entry in possibilities:
        if len(entry) == 3:
            possibility, pattern, defaults = entry
        else:
            possibility, pattern = entry
            defaults = {}

        for result, params in possibility:
            if set(kwargs + defaults.keys()) != set(params + defaults.keys() + prefix_args):
                continue

            unicode_kwargs = dict([(k, u'#{' + force_unicode(k) + u'}') for k in kwargs])
            unicode_kwargs.update(defaults)
            return (prefix_norm + result) % unicode_kwargs

    raise NoReverseMatch("Reverse for '%s' with keyword arguments '%s' not "
            "found." % (viewname, kwargs))


class WirecloudPlugin(object):

    features = {}
    urls = patterns('',)

    def get_market_classes(self):
        return {}

    def get_features(self):
        return self.features

    def get_platform_context_definitions(self):
        return {}

    def get_platform_context_current_values(self, user):
        return {}

    def get_workspace_context_definitions(self):
        return {}

    def get_workspace_context_current_values(self, user_workspace):
        return {}

    def get_scripts(self, view):
        return ()

    def get_templates(self, view):
        return {}

    def get_urls(self):
        return self.urls

    def get_ajax_endpoints(self, view):
        return ()

    def get_widget_api_extensions(self, view):
        return ()

    def get_operator_api_extensions(self, view):
        return ()

    def get_platform_css(self, view):
        return ()
