# -*- coding: utf-8 -*-

# Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

import string
import random
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

UNICODE_ASCII_CHARACTERS = (str(string.ascii_letters) + str(string.digits))


def random_ascii_string(length):
    return ''.join([random.choice(UNICODE_ASCII_CHARACTERS) for x in range(length)])


def build_url(base, additional_params=None):
    """Construct a URL based off of base containing all parameters in
    the query portion of base plus any additional parameters.

    :param base: Base URL
    :type base: str
    ::param additional_params: Additional query parameters to include.
    :type additional_params: dict
    :rtype: str
    """
    url = urlparse(base)
    query_params = {}
    query_params.update(parse_qsl(url.query, True))
    if additional_params is not None:
        query_params.update(additional_params)
        for k, v in additional_params.items():
            if v is None:
                query_params.pop(k)

    return urlunparse((
        url.scheme,
        url.netloc,
        url.path,
        url.params,
        urlencode(query_params),
        url.fragment
    ))
