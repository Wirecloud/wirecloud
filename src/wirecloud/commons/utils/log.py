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

import logging

from django.conf import settings
from django.http import UnreadablePostError


class RequireDebugTrue(logging.Filter):

    def filter(self, record):
        return settings.DEBUG


class SkipUnreadablePosts(logging.Filter):

    def filter(self, record):
        if record.exc_info:
            exc_type, exc_value = record.exc_info[:2]
            if isinstance(exc_value, UnreadablePostError):
                return False
        return True
