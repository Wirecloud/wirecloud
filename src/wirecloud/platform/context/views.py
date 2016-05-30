# -*- coding: utf-8 -*-

# Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

import json

from django.http import HttpResponse

from wirecloud.commons.utils.encoding import LazyEncoder
from wirecloud.commons.baseviews import Resource
from wirecloud.platform.context.utils import get_platform_context, get_workspace_context_definitions


class PlatformContextCollection(Resource):

    def read(self, request):

        context = {
            'platform': get_platform_context(request.user),
            'workspace': get_workspace_context_definitions()
        }

        if 'theme' in request.GET:
            context['platform']['theme']['value'] = request.GET['theme']

        return HttpResponse(json.dumps(context, cls=LazyEncoder, sort_keys=True), content_type='application/json; charset=UTF-8')
