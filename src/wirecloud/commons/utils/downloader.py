# -*- coding: utf-8 -*-

# Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

import codecs
from django.utils.translation import ugettext as _
import platform
import requests
from urllib.parse import urlparse

import wirecloud.platform


VERSIONS = {
    'wirecloud_version': wirecloud.platform.__version__,
    'system': platform.system(),
    'machine': platform.machine(),
    'requests_version': requests.__version__,
}


def download_local_file(path):

    with codecs.open(path, 'rb') as f:
        return f.read()


def download_http_content(url, user=None):

    parsed_url = urlparse(url)
    if parsed_url.scheme not in ('http', 'https'):
        raise requests.exceptions.InvalidSchema(_('Invalid schema: %(schema)s') % {"schema": parsed_url.scheme})

    headers = {
        'User-Agent': 'Mozilla/5.0 (%(system)s %(machine)s;U) Wirecloud/%(wirecloud_version)s python-requests/%(requests_version)s' % VERSIONS,
        'Accept': '*/*',
        'Accept-Language': 'en-gb,en;q=0.8,*;q=0.7',
        'Accept-Charset': 'utf-8;q=1,*;q=0.2',
    }

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.content
