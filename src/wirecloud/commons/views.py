# -*- coding: utf-8 -*-

# Copyright 2012 Universidad Politécnica de Madrid

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

from django.shortcuts import render

from wirecloud.commons.utils.http import build_error_response


def server_error(request):

    extra_formatters = {
        'text/html': lambda msg: render(request, '500.html', status=500, content_type='text/html'),
        'application/xhtml+xml': lambda msg: render(request, '500.html', status=500, content_type='application/xhtml+xml'),
    }
    return build_error_response(request, 500, 'Internal Server Error', extra_formatters)
