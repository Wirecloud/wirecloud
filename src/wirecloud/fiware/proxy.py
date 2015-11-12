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

from django.utils.http import urlquote_plus
from django.utils.translation import ugettext as _

from wirecloud.fiware.plugins import IDM_SUPPORT_ENABLED
from wirecloud.proxy.utils import ValidationError


def get_access_token(user, error_msg):
    "Gets the access_token of a user using python-social-auth"
    try:
        oauth_info = user.social_auth.get(provider='fiware')
        if oauth_info.access_token is None:
            raise Exception
        return oauth_info.access_token
    except:
        raise ValidationError(error_msg)


class IDMTokenProcessor(object):

    def process_request(self, request):

        if 'x-fi-ware-oauth-token' not in request['headers']:
            return

        if not IDM_SUPPORT_ENABLED:
            raise ValidationError(_('IdM support not enabled'))
        elif request['workspace'] is None:
            raise ValidationError(_('IdM tokens can only be inyected on Ajax requests coming from authorized widgets'))

        header_name = None
        source = 'user'
        if 'x-fi-ware-oauth-source' in request['headers']:
            source = request['headers']['x-fi-ware-oauth-source']
            del request['headers']['x-fi-ware-oauth-source']

        if source == 'user':
            token = get_access_token(request['user'], _('Current user has not an active FIWARE profile'))
        elif source == 'workspaceowner':
            token = get_access_token(request['workspace'].creator, _('Workspace owner has not an active FIWARE profile'))
        else:
            raise ValidationError(_('Invalid FIWARE OAuth token source'))

        if 'x-fi-ware-oauth-get-parameter' in request['headers']:
            header_name = request['headers']['x-fi-ware-oauth-get-parameter']
            url = request['url']
            if '?' in url:
                url += '&'
            else:
                url += '?'

            url += urlquote_plus(request['headers']['x-fi-ware-oauth-get-parameter']) + '=' + urlquote_plus(token)
            request['url'] = url
            del request['headers']['x-fi-ware-oauth-get-parameter']

        if 'x-fi-ware-oauth-header-name' in request['headers']:
            header_name = request['headers']['x-fi-ware-oauth-header-name']

            if header_name == "Authorization":
                token_pattern = "Bearer {token}"
            else:
                token_pattern = "{token}"
            request['headers'][header_name] = token_pattern.format(token=token)
            del request['headers']['x-fi-ware-oauth-header-name']

        if 'x-fi-ware-oauth-token-body-pattern' in request['headers']:
            pattern = request['headers']['x-fi-ware-oauth-token-body-pattern']
            new_body = request['data'].read().replace(pattern.encode('utf8'), token.encode('utf8'))
            request['headers']['content-length'] = "%s" % len(new_body)
            request['data'] = BytesIO(new_body)
            del request['headers']['x-fi-ware-oauth-token-body-pattern']

        del request['headers']['x-fi-ware-oauth-token']
