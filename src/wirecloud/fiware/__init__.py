# -*- coding: utf-8 -*-

# Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

__version_info__ = (3, 4)
__version__ = '.'.join(map(str, __version_info__))

DEFAULT_FIWARE_PORTALS = (
    {'name': 'Cloud', 'url': 'http://cloud.lab.fi-ware.org', "logout_path": "/logout"},
    {'name': 'Store', 'url': 'https://store.lab.fi-ware.org', "logout_path": "/logout"},
    {'name': 'Mashup', 'url': 'https://mashup.lab.fi-ware.org', "logout_path": "/logout", "active": True},
    {'name': 'Account', 'url': 'https://account.lab.fi-ware.org', "logout_path": "/users/sign_out"},
    {'name': 'Help&Info', 'url': 'http://help.lab.fi-ware.org'},
)

DEFAULT_FIWARE_HOME = 'https://lab.fi-ware.org';
