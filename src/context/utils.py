from django.utils.importlib import import_module
from django.core.exceptions import ImproperlyConfigured


_ezweb_user_context_providers = None


class UserContextProvider:

    def get_concepts(self):
        pass

    def get_context_values(self, user):
        pass


def get_user_context_providers():
    from django.conf import settings
    global _ezweb_user_context_providers

    if _ezweb_user_context_providers is None:
        if hasattr(settings, 'USER_CONTEXT_PROVIDERS') and settings.USER_CONTEXT_PROVIDERS != None:
            providers = settings.USER_CONTEXT_PROVIDERS
        else:
            providers = ()

        processors = []
        for path in providers:
            i = path.rfind('.')
            module, attr = path[:i], path[i + 1:]
            try:
                mod = import_module(module)
            except ImportError, e:
                raise ImproperlyConfigured('Error importing user context provider module %s: "%s"' % (module, e))

            try:
                provider = getattr(mod, attr)()
            except AttributeError:
                raise ImproperlyConfigured('Module "%s" does not define a "%s" instanciable user context provider' % (module, attr))

            processors.append(provider)

        _ezweb_user_context_providers = tuple(processors)

    return _ezweb_user_context_providers
