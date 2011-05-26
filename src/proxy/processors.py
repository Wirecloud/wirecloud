from django.utils.importlib import import_module
from django.core.exceptions import ImproperlyConfigured


_ezweb_proxy_processors = None


def get_proxy_processors():
    from django.conf import settings
    global _ezweb_proxy_processors

    if _ezweb_proxy_processors is None:
        if hasattr(settings, 'PROXY_PROCESSORS') and settings.PROXY_PROCESSORS != None:
            processors = settings.PROXY_PROCESSORS
        else:
            processors = ()

        processors = []
        for path in processors:
            i = path.rfind('.')
            module, attr = path[:i], path[i + 1:]
            try:
                mod = import_module(module)
            except ImportError, e:
                raise ImproperlyConfigured('Error importing proxy processor module %s: "%s"' % (module, e))

            try:
                processor = getattr(mod, attr)()
            except AttributeError:
                raise ImproperlyConfigured('Module "%s" does not define a "%s" instanciable processor processor' % (module, attr))

            processors.append(processor)

        _ezweb_proxy_processors = tuple(processors)

    return _ezweb_proxy_processors
