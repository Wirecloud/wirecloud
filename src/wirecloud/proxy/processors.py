# -*- coding: utf-8 -*-

# Copyright (c) 2011-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import unicode_literals

import base64
from io import BytesIO
import re
from six.moves.urllib.parse import unquote

from django.utils.http import urlquote
from django.utils.translation import ugettext as _

from wirecloud.platform.workspace.utils import get_variable_value_from_varname
from wirecloud.proxy.utils import ValidationError


WIRECLOUD_SECURE_DATA_COOKIE = str('X-WireCloud-Secure-Data')
WIRECLOUD_SECURE_DATA_HEADER = 'x-wirecloud-secure-data'
VAR_REF_RE = re.compile(r'^(?P<iwidget_id>[1-9]\d*|c)/(?P<var_name>.+)$', re.S)


def get_variable_value_by_ref(ref, user):

    result = VAR_REF_RE.match(ref)
    try:
        if result.group('iwidget_id') == 'c':
            return result.group('var_name')
        else:
            return get_variable_value_from_varname(user, result.group('iwidget_id'), result.group('var_name'))
    except:
        raise ValueError('Invalid variable reference: %s' % ref)


def check_empty_params(**kargs):
    missing_params = []

    for param_name in kargs:
        if kargs[param_name] == '':
            missing_params.append(param_name)

    if len(missing_params) > 0:
        msg = _('X-WireCloud-Secure-Data: The following required parameters are missing: %(params)s')
        raise ValidationError(msg % {'params': ', '.join(missing_params)})


def check_invalid_refs(**kargs):
    invalid_params = []

    for param_name in kargs:
        if kargs[param_name] is None:
            invalid_params.append(param_name)

    if len(invalid_params) > 0:
        msg = _('X-WireCloud-Secure-Data: The following required parameters are invalid: %(params)s')
        raise ValidationError(msg % {'params': ', '.join(invalid_params)})


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
                option_name = unquote(tokens[0].strip())
                options[option_name] = unquote(tokens[1].strip())

            action = options.get('action', 'data')
            if action == 'data':
                substr = options.get('substr', '')
                var_ref = options.get('var_ref', '')
                check_empty_params(substr=substr, var_ref=var_ref)

                value = get_variable_value_by_ref(var_ref, request['user'])
                check_invalid_refs(var_ref=value)

                encoding = options.get('encoding', 'none')
                substr = substr.encode('utf8')
                if encoding == 'url':
                    value = urlquote(value).encode('utf8')
                elif encoding == 'base64':
                    value = base64.b64encode(value.encode('utf8'))[:-1]
                else:
                    value = value.encode('utf8')

                new_body = request['data'].read().replace(substr, value)
                request['headers']['content-length'] = "%s" % len(new_body)
                request['data'] = BytesIO(new_body)

            elif action == 'basic_auth':
                user_ref = options.get('user_ref', '')
                password_ref = options.get('pass_ref', '')
                check_empty_params(user_ref=user_ref, password_ref=password_ref)

                user_value = get_variable_value_by_ref(user_ref, request['user'])
                password_value = get_variable_value_by_ref(password_ref, request['user'])
                check_invalid_refs(user_ref=user_value, password_ref=password_value)

                token = base64.b64encode((user_value + ':' + password_value).encode('utf8'))[:-1]
                request['headers']['Authorization'] = 'Basic ' + token.decode('ascii')

        except ValidationError:

            if not ignore_errors:
                raise

        except Exception as e:
            # TODO logging?
            if not ignore_errors:
                raise ValidationError("%s" % e)


class SecureDataProcessor(object):

    def process_request(self, request):

        # Process secure data from the X-WireCloud-Secure-Data header
        if WIRECLOUD_SECURE_DATA_HEADER in request['headers']:
            secure_data_value = request['headers'][WIRECLOUD_SECURE_DATA_HEADER]
            process_secure_data(secure_data_value, request, ignore_errors=False)
            del request['headers'][WIRECLOUD_SECURE_DATA_HEADER]

        # Process secure data cookie
        cookie_parser = request['cookies']

        if cookie_parser is not None and WIRECLOUD_SECURE_DATA_COOKIE in cookie_parser:
            process_secure_data(cookie_parser[WIRECLOUD_SECURE_DATA_COOKIE].value, request, ignore_errors=True)
            del cookie_parser[WIRECLOUD_SECURE_DATA_COOKIE]
