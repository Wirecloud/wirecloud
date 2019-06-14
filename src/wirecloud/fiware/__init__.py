# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

__version_info__ = (7, 7, 1)
__version__ = '.'.join(map(str, __version_info__))

FIWARE_LAB_PORTALS = (
    {'name': 'Cloud', 'url': 'https://cloud.lab.fiware.org', "logout_path": "/logout"},
    {'name': 'Store', 'url': 'https://store.lab.fiware.org', "logout_path": "/logout"},
    {'name': 'Mashup', 'url': 'https://mashup.lab.fiware.org', "logout_path": "/logout"},
    {'name': 'Data', 'url': 'https://data.lab.fiware.org', "logout_path": "/user/logout"},
    {'name': 'Account', 'url': 'https://account.lab.fiware.org', "logout_path": "/auth/logout/"},
    {'name': 'Help&info', 'url': 'http://help.lab.fiware.org'},
)

FIWARE_LAB_IDM_SERVER = 'https://account.lab.fiware.org'
FIWARE_LAB_CLOUD_SERVER = 'https://cloud.lab.fiware.org'

DEFAULT_FIWARE_HOME = 'https://lab.fiware.org'
