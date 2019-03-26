# -*- coding: utf-8 -*-

# Copyright (c) 2014-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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
import time

from django.conf import settings
from django.utils.http import urlquote_plus
from django.utils.translation import ugettext as _

from wirecloud.fiware import FIWARE_LAB_CLOUD_SERVER
from wirecloud.fiware.openstack_token_manager import OpenstackTokenManager
from wirecloud.fiware.plugins import IDM_SUPPORT_ENABLED
from wirecloud.proxy.utils import ValidationError


if IDM_SUPPORT_ENABLED:

    from social_django.utils import load_strategy

    STRATEGY = load_strategy()

else:

    STRATEGY = None


def get_access_token(user, error_msg):
    "Gets the access_token of a user using python-social-auth"

    try:
        oauth_info = user.social_auth.get(provider='fiware')
        if oauth_info.access_token is None:
            raise Exception

        # Refresh the token if expired
        if oauth_info.access_token_expired():
            oauth_info.refresh_token(STRATEGY)

        return oauth_info.access_token
    except:
        raise ValidationError(error_msg)


def replace_get_parameter(request, gets, token):
    for get in gets:
        if get not in request['headers']:
            continue

        parameter_name = request['headers'][get]
        del request['headers'][get]

        url = request['url']
        if '?' in url:
            url += "&"
        else:
            url += "?"

        url += "{}={}".format(urlquote_plus(parameter_name), urlquote_plus(token))
        request['url'] = url

        return


def replace_header_name(request, headers, token):
    for header in headers:
        if header in request['headers']:
            header_name = request['headers'][header]
            del request['headers'][header]

            if header_name == "Authorization":
                token_pattern = "Bearer {token}"
            else:
                token_pattern = "{token}"

            request['headers'][header_name] = token_pattern.format(token=token)


def replace_body_pattern(request, bodies, token):
    for body in bodies:
        if body not in request['headers']:
            continue

        pattern = request['headers'][body]
        del request['headers'][body]

        new_body = request['data'].read().replace(pattern.encode('utf8'), token.encode('utf8'))
        request['headers']['content-length'] = "{}".format(len(new_body))
        request['data'] = BytesIO(new_body)

        return


class IDMTokenProcessor(object):
    def __init__(self):
        if IDM_SUPPORT_ENABLED:
            self.openstack_manager = OpenstackTokenManager(getattr(settings, 'FIWARE_CLOUD_SERVER', FIWARE_LAB_CLOUD_SERVER))

    def process_request(self, request):
        headers = ['fiware-oauth-token', 'fiware-openstack-token']
        filtered = [header for header in headers if header in request['headers']]

        if len(filtered) == 0:
            return

        for header in filtered:
            del request['headers'][header]

        if not IDM_SUPPORT_ENABLED:
            raise ValidationError(_('IdM support not enabled'))
        elif request['workspace'] is None:
            raise ValidationError(_('IdM tokens can only be inyected on Ajax requests coming from authorized widgets'))

        tenantid = request['headers'].get("fiware-openstack-tenant-id")

        source = 'user'
        if 'fiware-oauth-source' in request['headers']:
            source = request['headers']['fiware-oauth-source']
            del request['headers']['fiware-oauth-source']

        if source == 'user':
            token = get_access_token(request['user'], _('Current user has not an active FIWARE profile'))
            if 'fiware-openstack-token' in filtered:
                openstacktoken = self.openstack_manager.get_token(request['user'], tenantid)
        elif source == 'workspaceowner':
            token = get_access_token(request['workspace'].creator, _('Workspace owner has not an active FIWARE profile'))
            if 'fiware-openstack-token' in filtered:
                openstacktoken = self.openstack_manager.get_token(request['workspace'].creator, tenantid)
        else:
            raise ValidationError(_('Invalid FIWARE OAuth token source'))

        if 'fiware-oauth-token' in filtered:
            replace_get_parameter(request, ["fiware-oauth-get-parameter"], token)
            replace_header_name(request, ["fiware-oauth-header-name"], token)
            replace_body_pattern(request, ["fiware-oauth-body-pattern"], token)

        if 'fiware-openstack-token' in filtered:
            replace_get_parameter(request, ["fiware-openstack-get-parameter"], openstacktoken)
            replace_header_name(request, ["fiware-openstack-header-name"], openstacktoken)
            replace_body_pattern(request, ["fiware-openstack-body-pattern"], openstacktoken)
