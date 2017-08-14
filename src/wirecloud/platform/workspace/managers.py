from importlib import import_module

from django.core.exceptions import ImproperlyConfigured


_ezweb_workspace_managers = None


def get_workspace_managers():
    from django.conf import settings
    global _ezweb_workspace_managers

    if _ezweb_workspace_managers is None:
        if hasattr(settings, 'WORKSPACE_MANAGERS') and settings.WORKSPACE_MANAGERS is not None:
            managers = settings.WORKSPACE_MANAGERS
        else:
            managers = ()

        processors = []
        for path in managers:
            i = path.rfind('.')
            module, attr = path[:i], path[i + 1:]
            try:
                mod = import_module(module)
            except ImportError as e:
                raise ImproperlyConfigured('Error importing workspace manager module %s: "%s"' % (module, e))

            try:
                manager = getattr(mod, attr)()
            except AttributeError:
                raise ImproperlyConfigured('Module "%s" does not define a "%s" instanciable workspace manager' % (module, attr))

            processors.append(manager)

        _ezweb_workspace_managers = tuple(processors)

    return _ezweb_workspace_managers
