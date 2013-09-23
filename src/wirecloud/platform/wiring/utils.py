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

from django.template import loader, Context

from wirecloud.commons.utils.http import get_absolute_static_url
from wirecloud.platform.plugins import get_operator_api_extensions


def remove_related_iwidget_connections(wiring, iwidget):

    connections_to_remove = []

    for index, connection in enumerate(wiring['connections']):
        if (connection['source']['type'] == 'iwidget' and connection['source']['id'] == iwidget.id) or (connection['target']['type'] == 'iwidget' and connection['target']['id'] == iwidget.id):
            connection['index'] = index
            connections_to_remove.append(connection)

    view_available = 'views' in wiring and len(wiring['views']) > 0
    if view_available and ('iwidgets' in wiring['views'][0]) and (iwidget.id in wiring['views'][0]['iwidgets']):
        del wiring['views'][0]['iwidgets'][iwidget.id]

    connection_view_available = view_available and 'connections' in wiring['views'][0]
    for connection in connections_to_remove:
        wiring['connections'].remove(connection)
        if connection_view_available and len(wiring['views'][0]['connections']) > connection['index']:
            del wiring['views'][0]['connections'][connection['index']]


def generate_xhtml_operator_code(js_files, base_url, request):

    api_url = get_absolute_static_url('js/WirecloudAPI/WirecloudOperatorAPI.js', request=request)
    api_common_url = get_absolute_static_url('js/WirecloudAPI/WirecloudAPICommon.js', request=request)
    api_closure_url = get_absolute_static_url('js/WirecloudAPI/WirecloudAPIClosure.js', request=request)
    api_js_files = [get_absolute_static_url(url, request=request) for url in get_operator_api_extensions('index')]
    api_js = [api_url, api_common_url] + api_js_files + [api_closure_url]

    t = loader.get_template('wirecloud/operator_xhtml.html')
    c = Context({'base_url': base_url, 'js_files': api_js + js_files})

    xhtml = t.render(c)

    return xhtml
