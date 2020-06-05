# -*- coding: utf-8 -*-

# Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

from io import BytesIO

from django.conf import settings
from django.template import Context, loader, Template
from lxml import etree

from wirecloud.commons.utils.http import get_absolute_static_url, get_current_domain
from wirecloud.platform.plugins import get_operator_api_extensions


def remove_widget_from_wiring_status(id, status):

    def has_model_widget(connection):

        def check_endpoint(endpoint):
            return endpoint['type'] == 'widget' and ("%s" % endpoint['id']) == id

        return check_endpoint(connection['source']) or check_endpoint(connection['target'])

    def has_view_widget(connection):

        def check_endpoint(endpoint):
            c_type, c_id, e_name = tuple(endpoint.split('/'))
            return c_type == 'widget' and c_id == id

        return check_endpoint(connection['sourcename']) or check_endpoint(connection['targetname'])

    def remove_references(description, has_widget):

        if 'components' in description and id in description['components']['widget']:
            del description['components']['widget'][id]

        for connection in [c for c in description['connections'] if has_widget(c)]:
            description['connections'].remove(connection)

    remove_references(status, has_model_widget)

    if 'visualdescription' in status:
        remove_references(status['visualdescription'], has_view_widget)

        for behaviour in status['visualdescription']['behaviours']:
            remove_references(behaviour, has_view_widget)

    return status


def get_operator_cache_key(operator, domain, mode):
    return '_operator_xhtml/%s/%s/%s?mode=%s' % (operator.cache_version, domain, operator.id, mode)


def get_operator_api_files(request):

    from django.core.cache import cache
    from wirecloud.platform.core.plugins import get_version_hash

    key = 'operator_api_files/%s?v=%s' % (get_current_domain(request), get_version_hash())
    operator_api_files = cache.get(key)

    if operator_api_files is None or settings.DEBUG is True:
        code = '''{% load compress %}{% load static from staticfiles %}{% compress js %}
        <script type="text/javascript" src="{% static "js/WirecloudAPI/WirecloudAPIBootstrap.js" %}"></script>
        <script type="text/javascript" src="{% static "js/WirecloudAPI/WirecloudOperatorAPI.js" %}"></script>
        <script type="text/javascript" src="{% static "js/WirecloudAPI/WirecloudAPICommon.js" %}"></script>
        {% endcompress %}'''

        result = Template(code).render(Context())
        doc = etree.parse(BytesIO(('<files>' + result + '</files>').encode('utf-8')), etree.XMLParser())

        files = [script.get('src') for script in doc.getroot()]
        operator_api_files = tuple([get_absolute_static_url(file, request=request, versioned=True) for file in files])
        cache.set(key, operator_api_files)

    return list(operator_api_files)


def generate_xhtml_operator_code(js_files, base_url, request, requirements, mode):

    api_closure_url = get_absolute_static_url('js/WirecloudAPI/WirecloudAPIClosure.js', request=request, versioned=True)
    extra_api_js_files = [get_absolute_static_url(url, request=request, versioned=True) for url in get_operator_api_extensions(mode, requirements)]
    api_js = get_operator_api_files(request) + extra_api_js_files + [api_closure_url]

    template = loader.get_template('wirecloud/operator_xhtml.html')
    context = {'base_url': base_url, 'js_files': api_js + js_files}

    xhtml = template.render(context)

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
