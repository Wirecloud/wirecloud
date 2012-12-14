import re
import urllib2

from django.utils.http import urlquote
from django.utils.importlib import import_module
from django.core.exceptions import ImproperlyConfigured

from wirecloud.platform.get_data import get_variable_value_from_varname
from wirecloud.proxy.utils import check_empty_params, check_invalid_refs


_wirecloud_proxy_processors = None
_wirecloud_request_proxy_processors = []
_wirecloud_response_proxy_processors = []


def get_proxy_processors():
    from django.conf import settings
    global _wirecloud_proxy_processors
    global _wirecloud_request_proxy_processors
    global _wirecloud_response_proxy_processors

    if _wirecloud_proxy_processors is None:
        if getattr(settings, 'PROXY_PROCESSORS', None) is not None:
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

            if hasattr(processor, 'process_request'):
                _wirecloud_request_proxy_processors.append(processor)
            if hasattr(processor, 'process_response'):
                _wirecloud_response_proxy_processors.insert(0, processor)

            processors.append(processor)

        _wirecloud_proxy_processors = tuple(processors)
        _wirecloud_request_proxy_processors = tuple(_wirecloud_request_proxy_processors)
        _wirecloud_response_proxy_processors = tuple(_wirecloud_response_proxy_processors)

    return _wirecloud_proxy_processors


def get_request_proxy_processors():
    if _wirecloud_proxy_processors is None:
        get_proxy_processors()

    return _wirecloud_request_proxy_processors


def get_response_proxy_processors():
    if _wirecloud_proxy_processors is None:
        get_proxy_processors()

    return _wirecloud_response_proxy_processors


class FixServletBugsProcessor(object):

    def process_request(self, request):

        method = request['method']
        if method == 'POST' or method == 'PUT' and not 'content-type' in request['headers']:
            # Add Content-Type (Servlets bug)
            request['headers']['content-type'] = "application/x-www-form-urlencoded"

        # Remote user header
        if not request['user'].is_anonymous():
            request['headers']['Remote-User'] = request['user'].username


VAR_REF_RE = re.compile(r'^(?P<iwidget_id>[1-9]\d*|c)/(?P<var_name>.+)$', re.S)


def get_variable_value_by_ref(ref, user):

    result = VAR_REF_RE.match(ref)
    if result:
        if result.group('iwidget_id') == 'c':
            return result.group('var_name')
        else:
            return get_variable_value_from_varname(user, result.group('iwidget_id'), result.group('var_name'))


def process_secure_data(text, request, ignore_errors=False):

    definitions = text.split('&')
    for definition in definitions:
        try:
            params = definition.split(',')
            if len(params) == 0:
                continue

            options = {}
            for pair in params:
                tokens = pair.split('=')
                option_name = urllib2.unquote(tokens[0].strip())
                options[option_name] = urllib2.unquote(tokens[1].strip())

            action = options.get('action', 'data')
            if action == 'data':
                substr = options.get('substr', '')
                var_ref = options.get('var_ref', '')
                check_empty_params(substr=substr, var_ref=var_ref)

                value = get_variable_value_by_ref(var_ref, request['user'])
                check_invalid_refs(var_ref=value)

                encoding = options.get('encoding', 'none')
                if encoding == 'url':
                    value = urlquote(value)
                elif encoding == 'base64':
                    value = value.encode('base64')[:-1]
                request['data'] = request['data'].replace(substr, value)

            elif action == 'basic_auth':
                user_ref = options.get('user_ref', '')
                password_ref = options.get('pass_ref', '')
                check_empty_params(user_ref=user_ref, password_ref=password_ref)

                user_value = get_variable_value_by_ref(user_ref, request['user'])
                password_value = get_variable_value_by_ref(password_ref, request['user'])
                check_invalid_refs(user_ref=user_value, password_ref=password_value)

                request['headers']['Authorization'] = 'Basic ' + (user_value + ':' + password_value).encode('base64')[:-1]
        except:
            # TODO logging?
            if not ignore_errors:
                raise


class SecureDataProcessor(object):

    def process_request(self, request):

        # Process secure data from the X-EzWeb-Secure-Data header
        if 'x-ezweb-secure-data' in request['headers']:
            secure_data_value = request['headers']['x-ezweb-secure-data']
            process_secure_data(secure_data_value, request, ignore_errors=False)

            del request['headers']['x-ezweb-secure-data']

        # Process secure data cookie
        cookie_parser = request['cookies']

        if cookie_parser is not None and 'X-EzWeb-Secure-Data' in cookie_parser:
            process_secure_data(cookie_parser['X-EzWeb-Secure-Data'].value, request, ignore_errors=True)
            del cookie_parser['X-EzWeb-Secure-Data']
