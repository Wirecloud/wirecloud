# -*- coding: utf-8 -*-

# Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import absolute_import

import json
import urlparse

from django.utils.translation import ugettext as _

from wirecloud.commons.utils.template.base import is_valid_name, is_valid_vendor, is_valid_version, TemplateParseException


class JSONTemplateParser(object):

    def __init__(self, template, base=None):

        self.base = base
        self._info = json.loads(template)

    def _init(self):

        self._url_fields = ['doc_uri', 'image_uri', 'iphone_image_uri']
        for field in ['doc_uri', 'image_uri', 'iphone_image_uri']:
            if field not in self._info:
                self._info[field] = ''

    def get_resource_info(self):

        if not is_valid_vendor(self._info['vendor']):
            raise TemplateParseException(_('ERROR: the format of the vendor is invalid.'))

        if not is_valid_name(self._info['name']):
            raise TemplateParseException(_('ERROR: the format of the name is invalid.'))

        if not is_valid_version(self._info['version']):
            raise TemplateParseException(_('ERROR: the format of the version number is invalid. Format: X.X.X where X is an integer. Ex. "0.1", "1.11" NOTE: "1.01" should be changed to "1.0.1" or "1.1"'))

        return dict(self._info)
