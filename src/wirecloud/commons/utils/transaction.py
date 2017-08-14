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

from django.http import HttpResponse
from django.db.transaction import atomic, set_rollback


def commit_on_http_success(func, using=None):

    def wrapped_func(*args, **kwargs):

        with atomic(using=using):
            res = func(*args, **kwargs)

            if not isinstance(res, HttpResponse) or res.status_code < 200 or res.status_code >= 400:
                set_rollback(True, using=using)

        return res

    return wrapped_func
