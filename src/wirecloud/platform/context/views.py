# -*- coding: utf-8 -*-

# Copyright 2013 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import json

from django.http import HttpResponse
from wirecloud.commons.utils.encoding import LazyEncoder
from wirecloud.commons.utils.http import authentication_required
from wirecloud.commons.baseviews import Resource
from wirecloud.platform.context.utils import get_platform_context, get_workspace_context


class PlatformContextCollection(Resource):

    @authentication_required
    def read(self, request):

        context = get_platform_context(request.user)
        return HttpResponse(json.dumps(context, cls=LazyEncoder), mimetype='application/json; charset=UTF-8')
