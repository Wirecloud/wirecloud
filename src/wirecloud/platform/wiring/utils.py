# -*- coding: utf-8 -*-

# Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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


def get_operator_cache_key(operator, domain, mode):
    return '_operator_xhtml/%s/%s/%s?mode=%s' % (operator.cache_version, domain, operator.id, mode)


def generate_xhtml_operator_code(js_files, base_url, request, requirements, mode):

    api_url = get_absolute_static_url('js/WirecloudAPI/WirecloudOperatorAPI.js', request=request)
    api_common_url = get_absolute_static_url('js/WirecloudAPI/WirecloudAPICommon.js', request=request)
    api_closure_url = get_absolute_static_url('js/WirecloudAPI/WirecloudAPIClosure.js', request=request)
    api_js_files = [get_absolute_static_url(url, request=request) for url in get_operator_api_extensions(mode, requirements)]
    api_js = [api_url, api_common_url] + api_js_files + [api_closure_url]

    t = loader.get_template('wirecloud/operator_xhtml.html')
    c = Context({'base_url': base_url, 'js_files': api_js + js_files})

    xhtml = t.render(c)

    return xhtml

def get_endpoint_name(endpoint):
    return "%s/%s/%s" % (endpoint['type'], endpoint['id'], endpoint['name'])

def rename_component_type(component_type):
    return component_type[1:] if component_type in ['iwidget', 'ioperator'] else "not_supported"

def get_wiring_skeleton():
    return {
        'version': "2.0",
        'connections': [],
        'operators': {},
        'visualdescription': {
            'behavioursenabled': False,
            'behaviours': [],
            'components': {
                'operator': {},
                'widget': {}
            },
            'connections': []
        }
    }

def parse_wiring_old_version(wiring_status):

    # set the structure for version 2.0
    new_version = get_wiring_skeleton()

    # set up business description

    if 'operators' in wiring_status:
        for operator_id, operator in wiring_status['operators'].items():
            new_version['operators'][operator_id] = operator

    if 'connections' in wiring_status:
        for connection in wiring_status['connections']:
            new_version['connections'].append({
                'readonly': connection['readOnly'] if 'readOnly' in connection else False,
                'source': {
                    'type': rename_component_type(connection['source']['type']),
                    'id': connection['source']['id'],
                    'name': connection['source']['endpoint']
                },
                'target': {
                    'type': rename_component_type(connection['target']['type']),
                    'id': connection['target']['id'],
                    'name': connection['target']['endpoint']
                }
            })

    # set up visual description

    if 'views' in wiring_status and len(wiring_status['views']) > 0:
        old_view = wiring_status['views'][0]

        # rebuild connections
        connections_length = len(new_version['connections'])
        for connection_index, connection_view in enumerate(old_view['connections']):
            if connection_index < connections_length:
                # get connection info from business part
                connection = new_version['connections'][connection_index]
                # set info into global behaviour
                new_version['visualdescription']['connections'].append({
                    'sourcename': get_endpoint_name(connection['source']),
                    'sourcehandle': {
                        'x': connection_view['pullerStart']['posX'],
                        'y': connection_view['pullerStart']['posY']
                    },
                    'targetname': get_endpoint_name(connection['target']),
                    'targethandle': {
                        'x': connection_view['pullerEnd']['posX'],
                        'y': connection_view['pullerEnd']['posY']
                    },
                })

        # rebuild operators
        for operator_id, operator in old_view['operators'].items():
            if operator_id in new_version['operators']:
                # set info into global behaviour
                visualInfo = {}
                visualInfo['collapsed'] = operator['minimized'] if 'minimized' in operator else False
                visualInfo['position'] = {
                    'x': operator['position']['posX'],
                    'y': operator['position']['posY']
                }
                if 'endPointsInOuts' in operator:
                    visualInfo['endpoints'] = {
                        'source': operator['endPointsInOuts']['sources'],
                        'target': operator['endPointsInOuts']['targets']
                    }
                new_version['visualdescription']['components']['operator'][operator_id] = visualInfo

        # rebuild widgets
        for widget_id, widget in old_view['iwidgets'].items():
            # set info into global behaviour
            new_version['visualdescription']['components']['widget'][widget_id] = {
                'endpoints': {
                    'source': widget['endPointsInOuts']['sources'],
                    'target': widget['endPointsInOuts']['targets']
                },
                'position': {
                    'x': widget['position']['posX'],
                    'y': widget['position']['posY']
                }
            }

            if 'name' in widget:
                new_version['visualdescription']['components']['widget'][widget_id]['name'] = widget['name']

    return new_version
