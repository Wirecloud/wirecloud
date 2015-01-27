# -*- coding: utf-8 -*-

# Copyright (c) 2014-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from io import BytesIO

from django.utils.translation import ugettext as _

from wirecloud.fiware.plugins import IDM_SUPPORT_ENABLED
from wirecloud.proxy.utils import ValidationError


class IDMTokenProcessor(object):

    def process_request(self, request):

        if 'x-fi-ware-oauth-token' not in request['headers']:
            return

        if not IDM_SUPPORT_ENABLED:
            raise ValidationError(_('IDM support not enabled'))

        header_name = None
        try:
            token = request['user'].social_auth.get(provider='fiware').tokens['access_token']
        except:
            raise ValidationError(_('Current user has not an active FIWARE profile'))

        if 'x-fi-ware-oauth-header-name' in request['headers']:
            header_name = request['headers']['x-fi-ware-oauth-header-name']
            request['headers'][header_name] = token
            del request['headers']['x-fi-ware-oauth-header-name']

        if 'x-fi-ware-oauth-token-body-pattern' in request['headers']:
            pattern = request['headers']['x-fi-ware-oauth-token-body-pattern']
            new_body = request['data'].read().replace(pattern.encode('utf8'), token.encode('utf8'))
            request['headers']['content-length'] = "%s" % len(new_body)
            request['data'] = BytesIO(new_body)
            del request['headers']['x-fi-ware-oauth-token-body-pattern']

        del request['headers']['x-fi-ware-oauth-token']
