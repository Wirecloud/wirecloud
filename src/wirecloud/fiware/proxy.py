# -*- coding: utf-8 -*-

# Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

class IDMTokenProcessor(object):

    def process_request(self, request):

        if 'x-fi-ware-oauth-token' not in request['headers']:
            return

        header_name = 'X-Auth-Token'
        if 'x-fi-ware-oauth-header-name' in request['headers']:
            header_name = request['headers']['x-fi-ware-oauth-header-name']
            del request['headers']['x-fi-ware-oauth-header-name']

        request['headers'][header_name] = request['user'].social_auth.filter(provider='fiware').select_related('tokens').get().tokens['access_token']
        del request['headers']['x-fi-ware-oauth-token']
