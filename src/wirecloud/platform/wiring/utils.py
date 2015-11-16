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

from __future__ import unicode_literals

from django.template import loader, Context

from wirecloud.commons.utils.http import get_absolute_static_url
from wirecloud.platform.plugins import get_operator_api_extensions


def has_component(endpoint, component_id, component_type):
    c_type, c_id, e_name = tuple(endpoint.split('/'))

    return c_type == component_type and c_id == component_id


def is_component(connection, endpoint_type, component_type, component_id):
    return connection[endpoint_type]['type'] == component_type and connection[endpoint_type]['id'] == component_id


def remove_related_iwidget_connections(wiring, iwidget):

    removed_connections = []

    for i, connection in enumerate(wiring['connections']):
        if is_component(connection, 'source', 'widget', iwidget.id) or is_component(connection, 'target', 'widget', iwidget.id):
            removed_connections.append(connection)

    if 'visualdescription' in wiring:
        if 'connections' in wiring['visualdescription']:
            removed_visual_connections = []

            for connection in wiring['visualdescription']['connections']:
                if has_component(connection['sourcename'], iwidget.id, 'widget') or has_component(connection['targetname'], iwidget.id, 'widget'):
                    removed_visual_connections.append(connection)

            for connection in removed_visual_connections:
                wiring['visualdescription']['connections'].remove(connection)

    for connection in removed_connections:
        wiring['connections'].remove(connection)


def get_operator_cache_key(operator, domain, mode):
    return '_operator_xhtml/%s/%s/%s?mode=%s' % (operator.cache_version, domain, operator.id, mode)


def generate_xhtml_operator_code(js_files, base_url, request, requirements, mode):

    api_bootstrap = get_absolute_static_url('js/WirecloudAPI/WirecloudAPIBootstrap.js', request=request, versioned=True)
    api_url = get_absolute_static_url('js/WirecloudAPI/WirecloudOperatorAPI.js', request=request, versioned=True)
    api_common_url = get_absolute_static_url('js/WirecloudAPI/WirecloudAPICommon.js', request=request, versioned=True)
    api_closure_url = get_absolute_static_url('js/WirecloudAPI/WirecloudAPIClosure.js', request=request, versioned=True)
    api_js_files = [get_absolute_static_url(url, request=request, versioned=True) for url in get_operator_api_extensions(mode, requirements)]
    api_js = [api_bootstrap, api_url, api_common_url] + api_js_files + [api_closure_url]

    t = loader.get_template('wirecloud/operator_xhtml.html')
    c = Context({'base_url': base_url, 'js_files': api_js + js_files})

    xhtml = t.render(c)

    return xhtml


def get_endpoint_name(endpoint):
    return "%s/%s/%s" % (endpoint['type'], endpoint['id'], endpoint['endpoint'])


def rename_component_type(component_type):
    return component_type[1:] if component_type in ['iwidget', 'ioperator'] else "not_supported"


def get_behaviour_skeleton():
    return {
        'title': None,
        'description': None,
        'components': {
            'operator': {},
            'widget': {}
        },
        'connections': []
    }


def get_wiring_skeleton():
    return {
        'version': "2.0",
        'connections': [],
        'operators': {},
        'visualdescription': {
            'behaviours': [],
            'components': {
                'operator': {},
                'widget': {}
            },
            'connections': []
        }
    }


def is_empty_wiring(visualInfo):
    return len(visualInfo['connections']) == 0 and len(visualInfo['components']['operator']) == 0 and len(visualInfo['components']['widget']) == 0


def parse_wiring_old_version(wiring_status):

    # set the structure for version 2.0
    new_version = get_wiring_skeleton()

    # set up business description
    for operator_id, operator in wiring_status.get('operators', {}).items():
        for preference_id, preference in operator.get('preferences', {}).items():
            if 'readOnly' in preference and 'readonly' not in preference:
                preference['readonly'] = preference['readOnly']
            if 'readOnly' in preference:
                del preference['readOnly']

        new_version['operators'][operator_id] = operator

    for connection in wiring_status.get('connections', []):
        new_version['connections'].append({
            'readonly': connection.get('readonly', connection.get('readOnly', False)),
            'source': {
                'type': rename_component_type(connection['source']['type']),
                'id': connection['source']['id'],
                'endpoint': connection['source']['endpoint']
            },
            'target': {
                'type': rename_component_type(connection['target']['type']),
                'id': connection['target']['id'],
                'endpoint': connection['target']['endpoint']
            }
        })

    # set up visual description
    if 'views' in wiring_status and len(wiring_status['views']) > 0:
        old_view = wiring_status['views'][0]

        # rebuild connections
        connections_length = len(new_version['connections'])
        for connection_index, connection_view in enumerate(old_view.get('connections', [])):
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
                visualInfo['collapsed'] = operator.get('minimized', False)
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
