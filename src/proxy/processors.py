from django.utils.importlib import import_module
from django.core.exceptions import ImproperlyConfigured


_ezweb_proxy_processors = None


def get_proxy_processors():
    from django.conf import settings
    global _ezweb_proxy_processors

    if _ezweb_proxy_processors is None:
        if hasattr(settings, 'PROXY_PROCESSORS') and settings.PROXY_PROCESSORS != None:
            modules = settings.PROXY_PROCESSORS
        else:
            modules = ()

        processors = []
        for path in modules:
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


class FixServletBugsProcessor(object):

    def process_request(self, request):

        method = request['method']
        if method == 'POST' or method == 'PUT' and not 'content-type' in request['headers']:
            # Add Content-Type (Servlets bug)
            request['headers']['content-type'] = "application/x-www-form-urlencoded"

        # Remote user header
        if not request['user'].is_anonymous():
            request['headers']['Remote-User'] = request['user'].username
