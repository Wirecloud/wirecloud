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

from __future__ import unicode_literals

import copy
import json
import os

from django.utils.unittest import TestCase

from wirecloud.commons.utils.template.parsers import TemplateParser
from wirecloud.commons.utils.template.writers.json import write_json_description
from wirecloud.commons.utils.template.writers.rdf import write_rdf_description
from wirecloud.commons.utils.template.writers.xml import write_xml_description
from wirecloud.commons.utils.template.writers.next_xml import write_xml_description as write_next_xml_description


class TemplateUtilsTestCase(TestCase):

    tags = ('template',)
    maxDiff = None

    @classmethod
    def setUpClass(cls):

        super(TemplateUtilsTestCase, cls).setUpClass()

        cls.basic_operator_info = {
            'type': 'operator',
            'vendor': 'Wirecloud',
            'name': 'TemplateTestOperator',
            'version': '1.0',
            'title': '',
            'description': '',
            'longdescription': '',
            'authors': [],
            'contributors': [],
            'email': '',
            'image': '',
            'smartphoneimage': '',
            'homepage': '',
            'doc': '',
            'license': '',
            'licenseurl': '',
            'changelog': '',
            'requirements': [],
            'preferences': [],
            'properties': [],
            'wiring': {
                'inputs': [],
                'outputs': [],
            },
            'js_files': [
                'js/example.js',
            ],
            'default_lang': 'en',
            'translations': {},
            'translation_index_usage': {},
        }

        cls.operator_info = {
            'type': 'operator',
            'vendor': 'Wirecloud',
            'name': 'TemplateTestOperator',
            'version': '2.0',
            'title': 'Template Test Operator',
            'description': 'test',
            'longdescription': 'README.md',
            'authors': [{'name': 'author_test'}],
            'contributors': [{'name': 'contributor1'}],
            'email': 'test@example.com',
            'image': 'images/catalogue.png',
            'smartphoneimage': 'images/smartphone.png',
            'homepage': 'http://homepage.example.com',
            'doc': 'docs/index.html',
            'license': 'Apache License 2',
            'licenseurl': 'http://www.apache.org/licenses/LICENSE-2.0.html',
            'changelog': 'log/change.html',
            'requirements': [
                {'type': 'feature', 'name': 'Wirecloud'},
            ],
            'preferences': [
                {
                    'name': 'pref1',
                    'type': 'list',
                    'options': [
                        {'label': 'Option 1', 'value': '1'},
                        {'label': 'Option 2', 'value': '2'}
                    ],
                    'secure': False,
                    'readonly': False,
                    'label': 'Preference label',
                    'description': 'Preference description',
                    'default': 'value',
                    'value': None
                },
                {
                    'name': 'pref2',
                    'type': 'text',
                    'secure': True,
                    'readonly': True,
                    'label': 'Preference label',
                    'description': 'Preference description',
                    'default': '',
                    'value': '5'
                }
            ],
            'properties': [
                {
                    'name': 'prop1',
                    'type': 'text',
                    'secure': False,
                    'label': 'Prop1',
                    'description': 'description 1',
                    'default': 'value1',
                },
                {
                    'name': 'prop2',
                    'type': 'text',
                    'secure': True,
                    'label': 'Prop2',
                    'description': 'description 2',
                    'default': 'value2',
                }
            ],
            'wiring': {
                'inputs': [
                    {
                        'name': 'input1',
                        'type': 'text',
                        'label': 'Input label 1',
                        'description': 'Input description 1',
                        'actionlabel': 'a',
                        'friendcode': 'friendcode 1'
                    },
                    {
                        'name': 'input2',
                        'type': 'text',
                        'label': 'Input label 2',
                        'description': 'Input description 2',
                        'actionlabel': '',
                        'friendcode': 'friendcode 2'
                    },
                    {
                        'name': 'input3',
                        'type': 'text',
                        'label': 'Input label 3',
                        'description': 'Input description 3',
                        'actionlabel': 'action label 3',
                        'friendcode': 'friendcode 3'
                    }
                ],
                'outputs': [
                    {
                        'name': 'output1',
                        'type': 'text',
                        'label': 'Output label 1',
                        'description': 'Output description 1',
                        'friendcode': 'friendcode 1'
                    },
                    {
                        'name': 'output2',
                        'type': 'text',
                        'label': 'Output label 2',
                        'description': 'Output description 2',
                        'friendcode': 'friendcode 2'
                    },
                    {
                        'name': 'output3',
                        'type': 'text',
                        'label': 'Output label 3',
                        'description': 'Output description 3',
                        'friendcode': 'friendcode 3'
                    }
                ]
            },
            'js_files': [
                'js/lib1.js',
                'js/lib2.js',
                'js/example.js',
            ],
            'default_lang': 'en',
            'translations': {},
            'translation_index_usage': {},
        }

        cls.operator_with_translation_info = {
            'type': 'operator',
            'vendor': 'Wirecloud',
            'name': 'TemplateTestOperator',
            'version': '2.0',
            'title': '__MSG_title__',
            'description': '__MSG_description__',
            'longdescription': 'README.md',
            'authors': [{'name': 'author_test'}],
            'contributors': [{'name': 'contributor1'}, {'name': 'contributor2', 'email': 'contributor2@example.com', 'url': 'http://example.com/contributor2'}],
            'email': 'test@example.com',
            'image': 'images/catalogue.png',
            'smartphoneimage': 'images/smartphone.png',
            'homepage': 'http://homepage.example.com',
            'doc': 'docs/index.html',
            'license': 'Apache License 2',
            'licenseurl': 'http://www.apache.org/licenses/LICENSE-2.0.html',
            'changelog': 'log/change.html',
            'requirements': [
                {'type': 'feature', 'name': 'Wirecloud'},
            ],
            'preferences': [
                {
                    'name': 'pref1',
                    'type': 'list',
                    'options': [
                        {'label': '__MSG_pref1_option0_label__', 'value': '1'},
                        {'label': '__MSG_pref1_option1_label__', 'value': '2'}
                    ],
                    'secure': False,
                    'readonly': False,
                    'label': '__MSG_pref1_label__',
                    'description': '__MSG_pref1_description__',
                    'default': 'value',
                    'value': None
                },
                {
                    'name': 'pref2',
                    'type': 'text',
                    'secure': True,
                    'readonly': True,
                    'label': '__MSG_pref2_label__',
                    'description': '__MSG_pref2_description__',
                    'default': '',
                    'value': '5'
                }
            ],
            'properties': [
                {
                    'name': 'prop1',
                    'type': 'text',
                    'secure': False,
                    'label': '__MSG_prop1_label__',
                    'description': '__MSG_prop1_description__',
                    'default': 'value1',
                },
                {
                    'name': 'prop2',
                    'type': 'text',
                    'secure': True,
                    'label': '__MSG_prop2_label__',
                    'description': '__MSG_prop2_description__',
                    'default': 'value2',
                }
            ],
            'wiring': {
                'inputs': [
                    {
                        'name': 'input1',
                        'type': 'text',
                        'label': '__MSG_input1_label__',
                        'description': '__MSG_input1_description__',
                        'actionlabel': '__MSG_input1_actionlabel__',
                        'friendcode': 'friendcode 1'
                    },
                    {
                        'name': 'input2',
                        'type': 'text',
                        'label': '__MSG_input2_label__',
                        'description': '__MSG_input2_description__',
                        'actionlabel': '__MSG_input2_actionlabel__',
                        'friendcode': 'friendcode 2'
                    },
                    {
                        'name': 'input3',
                        'type': 'text',
                        'label': '__MSG_input3_label__',
                        'description': '__MSG_input3_description__',
                        'actionlabel': '__MSG_input3_actionlabel__',
                        'friendcode': 'friendcode 3'
                    }
                ],
                'outputs': [
                    {
                        'name': 'output1',
                        'type': 'text',
                        'label': '__MSG_output1_label__',
                        'description': '__MSG_output1_description__',
                        'friendcode': 'friendcode 1'
                    },
                    {
                        'name': 'output2',
                        'type': 'text',
                        'label': '__MSG_output2_label__',
                        'description': '__MSG_output2_description__',
                        'friendcode': 'friendcode 2'
                    },
                    {
                        'name': 'output3',
                        'type': 'text',
                        'label': '__MSG_output3_label__',
                        'description': '__MSG_output3_description__',
                        'friendcode': 'friendcode 3'
                    }
                ]
            },
            'js_files': [
                'js/lib1.js',
                'js/lib2.js',
                'js/example.js',
            ],
            'default_lang': 'en',
            'translations': {
                'en': {
                    'title': 'Template Test Operator',
                    'description': 'description',
                    'pref1_option0_label': 'Option1 label',
                    'pref1_option1_label': 'Option2 label',
                    'pref1_label': 'Pref1 label',
                    'pref1_description': 'Pref1 description',
                    'pref2_label': 'Pref2 label',
                    'pref2_description': 'Pref2 description',
                    'prop1_label': 'Prop1 label',
                    'prop1_description': 'Prop1 description',
                    'prop2_label': 'Prop2 label',
                    'prop2_description': 'Prop2 description',
                    'input1_label': 'Input1 label',
                    'input1_description': 'Input1 description',
                    'input1_actionlabel': 'Input1 action label',
                    'input2_label': 'Input2 label',
                    'input2_description': 'Input2 description',
                    'input2_actionlabel': 'Input2 action label',
                    'input3_label': 'Input3 label',
                    'input3_description': 'Input3 description',
                    'input3_actionlabel': 'Input3 action label',
                    'output1_label': 'Output1 label',
                    'output1_description': 'Output1 description',
                    'output2_label': 'Output2 label',
                    'output2_description': 'Output2 description',
                    'output3_label': 'Output3 label',
                    'output3_description': 'Output3 description',
                },
                'es': {
                    'title': 'Operador de prueba',
                    'description': 'descripción',
                    'pref1_option0_label': 'Etiqueta de la opción 1',
                    'pref1_option1_label': 'Etiqueta de la opción 2',
                    'pref1_label': 'Etiqueta de la pref1',
                    'pref1_description': 'Descripción de la pref1',
                    'pref2_label': 'Etiqueta de la pref2',
                    'pref2_description': 'Descripción de la pref2',
                    'prop1_label': 'Etiqueta de la propiedad 1',
                    'prop1_description': 'Descripción de la propiedad 1',
                    'prop2_label': 'Etiqueta de la propiedad 2',
                    'prop2_description': 'Descripción de la propiedad 2',
                    'input1_label': 'Etiqueta del input 1',
                    'input1_description': 'Descripción del input 1',
                    'input1_actionlabel': 'Etiqueta de acción del input 1',
                    'input2_label': 'Etiqueta del input 2',
                    'input2_description': 'Descripción del input 2',
                    'input2_actionlabel': 'Etiqueta de acción del input 2',
                    'input3_label': 'Etiqueta del input 3',
                    'input3_description': 'Descripción del input 3',
                    'input3_actionlabel': 'Etiqueta de acción del input 3',
                    'output1_label': 'Etiqueta del output 1',
                    'output1_description': 'Descripción del output 1',
                    'output2_label': 'Etiqueta del output 2',
                    'output2_description': 'Descripción del output 2',
                    'output3_label': 'Etiqueta del output 3',
                    'output3_description': 'Descripción del output 3',
                }
            },
            'translation_index_usage': {
                'title': [{'type': 'resource', 'field': 'title'}],
                'description': [{'type': 'resource', 'field': 'description'}],
                'pref1_option0_label': [{'type': 'upo', 'variable': 'pref1', 'option': 0}],
                'pref1_option1_label': [{'type': 'upo', 'variable': 'pref1', 'option': 1}],
                'pref1_label': [{'type': 'vdef', 'variable': 'pref1', 'field': 'label'}],
                'pref1_description': [{'type': 'vdef', 'variable': 'pref1', 'field': 'description'}],
                'pref2_label': [{'type': 'vdef', 'variable': 'pref2', 'field': 'label'}],
                'pref2_description': [{'type': 'vdef', 'variable': 'pref2', 'field': 'description'}],
                'prop1_label': [{'type': 'vdef', 'variable': 'prop1', 'field': 'label'}],
                'prop1_description': [{'type': 'vdef', 'variable': 'prop1', 'field': 'description'}],
                'prop2_label': [{'type': 'vdef', 'variable': 'prop2', 'field': 'label'}],
                'prop2_description': [{'type': 'vdef', 'variable': 'prop2', 'field': 'description'}],
                'input1_label': [{'type': 'inputendpoint', 'variable': 'input1', 'field': 'label'}],
                'input1_description': [{'type': 'inputendpoint', 'variable': 'input1', 'field': 'description'}],
                'input1_actionlabel': [{'type': 'inputendpoint', 'variable': 'input1', 'field': 'actionlabel'}],
                'input2_label': [{'type': 'inputendpoint', 'variable': 'input2', 'field': 'label'}],
                'input2_actionlabel': [{'type': 'inputendpoint', 'variable': 'input2', 'field': 'actionlabel'}],
                'input2_description': [{'type': 'inputendpoint', 'variable': 'input2', 'field': 'description'}],
                'input3_label': [{'type': 'inputendpoint', 'variable': 'input3', 'field': 'label'}],
                'input3_actionlabel': [{'type': 'inputendpoint', 'variable': 'input3', 'field': 'actionlabel'}],
                'input3_description': [{'type': 'inputendpoint', 'variable': 'input3', 'field': 'description'}],
                'output1_label': [{'type': 'outputendpoint', 'variable': 'output1', 'field': 'label'}],
                'output1_description': [{'type': 'outputendpoint', 'variable': 'output1', 'field': 'description'}],
                'output2_label': [{'type': 'outputendpoint', 'variable': 'output2', 'field': 'label'}],
                'output2_description': [{'type': 'outputendpoint', 'variable': 'output2', 'field': 'description'}],
                'output3_label': [{'type': 'outputendpoint', 'variable': 'output3', 'field': 'label'}],
                'output3_description': [{'type': 'outputendpoint', 'variable': 'output3', 'field': 'description'}]
            }
        }

        cls.basic_mashup_info = {
            'type': 'mashup',
            'vendor': 'Wirecloud',
            'name': 'TemplateTestMashup',
            'version': '1.0',
            'title': '',
            'description': '',
            'longdescription': '',
            'authors': [],
            'contributors': [],
            'email': '',
            'image': '',
            'smartphoneimage': '',
            'homepage': '',
            'doc': '',
            'license': '',
            'licenseurl': '',
            'changelog': '',
            'requirements': [],
            'params': [],
            'preferences': {},
            'embedded': [],
            'tabs': [
                {
                    'name': 'Tab 1',
                    'preferences': {},
                    'resources': []
                }
            ],
            'wiring': {
                'inputs': [],
                'outputs': [],
                'operators': {},
                'connections': [],
                'views': []
            },
            'default_lang': 'en',
            'translations': {},
            'translation_index_usage': {},
        }

        cls.mashup_info = {
            'type': 'mashup',
            'vendor': 'Wirecloud',
            'name': 'TemplateTestMashup',
            'version': '1.0',
            'title': 'Template Test Mashup',
            'description': 'test',
            'longdescription': 'README.md',
            'authors': [{'name': 'author_test'}],
            'contributors': [],
            'email': '',
            'image': 'images/catalogue.png',
            'smartphoneimage': 'images/smartphone.png',
            'homepage': 'http://homepage.example.com',
            'doc': 'docs/index.html',
            'license': 'Apache License 2',
            'licenseurl': 'http://www.apache.org/licenses/LICENSE-2.0.html',
            'changelog': 'log/change.html',
            'requirements': [
                {'type': 'feature', 'name': 'Wirecloud'},
                {'type': 'feature', 'name': 'PubSub'}
            ],
            'params': [],
            'preferences': {
                'columns': '8'
            },
            'embedded': [
                {'vendor': 'Wirecloud', 'name': 'TestOperator', 'version': '1.0', 'src': 'macs/Wirecloud_TestOperator_1.0.wgt'},
                {'vendor': 'Wirecloud', 'name': 'TestOperator', 'version': '2.0', 'src': 'https://macs.example.com/macs/Wirecloud_TestOperator_2.0.wgt'}
            ],
            'tabs': [
                {
                    'name': 'Tab 1',
                    'preferences': {
                        'columns': '9',
                        'smart': 'false'
                    },
                    'resources': [
                        {
                            'id': '1',
                            'vendor': 'Wirecloud',
                            'name': 'TestWidget',
                            'version': '1.0',
                            'title': 'Widget title',
                            'readonly': False,
                            'properties': {
                                'prop1': {'value': 'value1', 'readonly': False},
                                'prop2': {'value': 'value 2', 'readonly': True}
                            },
                            'preferences': {
                                'list': {'value': 'default', 'readonly': True, 'hidden': False},
                                'text': {'value': 'other value', 'readonly': True, 'hidden': True}
                            },
                            'position': {
                                'x': '0',
                                'y': '1',
                                'z': '2',
                            },
                            'rendering': {
                                'width': '10',
                                'height': '10',
                                'layout': '0',
                                'fulldragboard': False,
                                'minimized': False
                            }
                        },
                        {
                            'id': '2',
                            'vendor': 'Wirecloud',
                            'name': 'TestWidget',
                            'version': '2.0',
                            'readonly': True,
                            'title': 'Widget title',
                            'properties': {
                                'prop1': {'value': 'value1', 'readonly': False}
                            },
                            'preferences': {
                                'text': {'value': 'other value', 'readonly': True, 'hidden': True}
                            },
                            'position': {
                                'x': '10',
                                'y': '1',
                                'z': '2',
                            },
                            'rendering': {
                                'width': '10',
                                'height': '10',
                                'layout': '0',
                                'fulldragboard': True,
                                'minimized': True
                            }
                        }
                    ]
                },
                {
                    'name': 'Tab 2',
                    'preferences': {
                        'pref1': 'pref value',
                    },
                    'resources': []
                },
            ],
            'wiring': {
                'inputs': [
                    {
                        'name': 'input1',
                        'type': 'text',
                        'label': 'Input label 1',
                        'description': 'Input description 1',
                        'actionlabel': 'a',
                        'friendcode': 'friendcode 1'
                    },
                    {
                        'name': 'input2',
                        'type': 'text',
                        'label': 'Input label 2',
                        'description': 'Input description 2',
                        'actionlabel': '',
                        'friendcode': 'friendcode 2'
                    },
                    {
                        'name': 'input3',
                        'type': 'text',
                        'label': 'Input label 3',
                        'description': 'Input description 3',
                        'actionlabel': 'action label 3',
                        'friendcode': 'friendcode 3'
                    }
                ],
                'outputs': [
                    {
                        'name': 'output1',
                        'type': 'text',
                        'label': 'Output label 1',
                        'description': 'Output description 1',
                        'friendcode': 'friendcode 1'
                    },
                    {
                        'name': 'output2',
                        'type': 'text',
                        'label': 'Output label 2',
                        'description': 'Output description 2',
                        'friendcode': 'friendcode 2'
                    },
                    {
                        'name': 'output3',
                        'type': 'text',
                        'label': 'Output label 3',
                        'description': 'Output description 3',
                        'friendcode': 'friendcode 3'
                    }
                ],
                'operators': {
                    '1': {
                        "id": '1',
                        "name": "Wirecloud/TestOperator/1.0",
                        "preferences": {}
                    },
                    '2': {
                        "id": '2',
                        "name": "Wirecloud/TestOperator/2.0",
                        "preferences": {
                            'pref1': {'value': 'op2 pref1 value', 'hidden': False, 'readonly': False},
                            'pref2': {'value': 'op2 pref2 value', 'hidden': False, 'readonly': True}
                        },
                    },
                    '3': {
                        "id": '3',
                        "name": "Wirecloud/TestOperator/2.0",
                        "preferences": {
                            'pref1': {'value': 'op3 pref1 value', 'hidden': True, 'readonly': True}
                        },
                    }
                },
                'connections': [
                    {
                        "source": {"type": "operator", 'id': '1', 'endpoint': 'output1'},
                        "target": {"type": "operator", 'id': '2', 'endpoint': 'input1'},
                        "readonly": True
                    },
                    {
                        "source": {"type": "iwidget", 'id': '1', 'endpoint': 'output1'},
                        "target": {"type": "operator", 'id': '1', 'endpoint': 'input1'},
                        "readonly": False
                    }
                ],
                'views': []
            },
            'default_lang': 'en',
            'translations': {},
            'translation_index_usage': {},
        }

        cls.mashup_with_translations_info = {
            'type': 'mashup',
            'vendor': 'Wirecloud',
            'name': 'TemplateTestMashup',
            'version': '1.0',
            'title': '__MSG_title__',
            'description': '__MSG_description__',
            'longdescription': 'README.md',
            'authors': [{'name': 'author_test'}],
            'contributors': [],
            'email': 'test@example.com',
            'image': 'images/catalogue.png',
            'smartphoneimage': 'images/smartphone.png',
            'homepage': 'http://homepage.example.com',
            'doc': 'docs/index.html',
            'license': 'Apache License 2',
            'licenseurl': 'http://www.apache.org/licenses/LICENSE-2.0.html',
            'changelog': 'log/change.html',
            'requirements': [
                {'type': 'feature', 'name': 'Wirecloud'},
                {'type': 'feature', 'name': 'PubSub'}
            ],
            'params': [],
            'preferences': {
                'columns': '8'
            },
            'embedded': [],
            'tabs': [
                {
                    'name': 'Tab 1',
                    'preferences': {
                        'columns': '9',
                        'smart': 'false'
                    },
                    'resources': [
                        {
                            'id': '1',
                            'vendor': 'Wirecloud',
                            'name': 'TestWidget',
                            'version': '1.0',
                            'title': 'Widget title',
                            'readonly': False,
                            'properties': {
                                'prop1': {'value': 'value1', 'readonly': False},
                                'prop2': {'value': 'value 2', 'readonly': True}
                            },
                            'preferences': {
                                'list': {'value': 'default', 'readonly': True, 'hidden': False},
                                'text': {'value': 'other value', 'readonly': True, 'hidden': True}
                            },
                            'position': {
                                'x': '0',
                                'y': '1',
                                'z': '2',
                            },
                            'rendering': {
                                'width': '10',
                                'height': '10',
                                'layout': '0',
                                'fulldragboard': False,
                                'minimized': False
                            }
                        },
                        {
                            'id': '2',
                            'vendor': 'Wirecloud',
                            'name': 'TestWidget',
                            'version': '2.0',
                            'title': 'Widget title',
                            'readonly': True,
                            'properties': {
                                'prop1': {'value': 'value1', 'readonly': False}
                            },
                            'preferences': {
                                'text': {'value': 'other value', 'readonly': True, 'hidden': True}
                            },
                            'position': {
                                'x': '10',
                                'y': '1',
                                'z': '2',
                            },
                            'rendering': {
                                'width': '10',
                                'height': '10',
                                'layout': '0',
                                'fulldragboard': True,
                                'minimized': True
                            }
                        }
                    ]
                },
                {
                    'name': 'Tab 2',
                    'preferences': {
                        'pref1': 'pref value',
                    },
                    'resources': []
                },
            ],
            'wiring': {
                'inputs': [
                    {
                        'name': 'input1',
                        'type': 'text',
                        'label': 'Input label 1',
                        'description': 'Input description 1',
                        'actionlabel': 'a',
                        'friendcode': 'friendcode 1'
                    },
                    {
                        'name': 'input2',
                        'type': 'text',
                        'label': 'Input label 2',
                        'description': 'Input description 2',
                        'actionlabel': '',
                        'friendcode': 'friendcode 2'
                    },
                    {
                        'name': 'input3',
                        'type': 'text',
                        'label': 'Input label 3',
                        'description': 'Input description 3',
                        'actionlabel': 'action label 3',
                        'friendcode': 'friendcode 3'
                    }
                ],
                'outputs': [
                    {
                        'name': 'output1',
                        'type': 'text',
                        'label': 'Output label 1',
                        'description': 'Output description 1',
                        'friendcode': 'friendcode 1'
                    },
                    {
                        'name': 'output2',
                        'type': 'text',
                        'label': 'Output label 2',
                        'description': 'Output description 2',
                        'friendcode': 'friendcode 2'
                    },
                    {
                        'name': 'output3',
                        'type': 'text',
                        'label': 'Output label 3',
                        'description': 'Output description 3',
                        'friendcode': 'friendcode 3'
                    }
                ],
                'operators': {
                    '1': {
                        "id": '1',
                        "name": "Wirecloud/TestOperator/1.0",
                        "preferences": {}
                    },
                    '2': {
                        "id": '2',
                        "name": "Wirecloud/TestOperator/2.0",
                        "preferences": {
                            'pref1': {'value': 'op2 pref1 value', 'hidden': False, 'readonly': False},
                            'pref2': {'value': 'op2 pref2 value', 'hidden': False, 'readonly': True}
                        },
                    },
                    '3': {
                        "id": '3',
                        "name": "Wirecloud/TestOperator/2.0",
                        "preferences": {
                            'pref1': {'value': 'op3 pref1 value', 'hidden': True, 'readonly': True}
                        },
                    }
                },
                'connections': [
                    {
                        "source": {"type": "operator", 'id': '1', 'endpoint': 'output1'},
                        "target": {"type": "operator", 'id': '2', 'endpoint': 'input1'},
                        "readonly": True
                    },
                    {
                        "source": {"type": "iwidget", 'id': '1', 'endpoint': 'output1'},
                        "target": {"type": "operator", 'id': '1', 'endpoint': 'input1'},
                        "readonly": False
                    }
                ],
                'views': []
            },
            'default_lang': 'en',
            'translations': {
                'en': {
                    'title': 'Template Test Operator',
                    'description': 'description'
                },
                'es': {
                    'title': 'Operador de prueba',
                    'description': 'descripción'
                }
            },
            'translation_index_usage': {
                'title': [{'type': 'resource', 'field': 'title'}],
                'description': [{'type': 'resource', 'field': 'description'}]
            },
        }

        cls.mashup_with_params = {
            'type': 'mashup',
            'vendor': 'Wirecloud',
            'name': 'TemplateTestMashup',
            'version': '1.0',
            'title': 'Template Test Mashup',
            'description': 'test',
            'longdescription': 'README.md',
            'authors': [{'name': 'author_test'}, {'name': 'author2', 'email': 'author2@example.com', 'url': 'http://example.com/author2'}],
            'contributors': [{'name': 'contributor1'}],
            'email': 'test@example.com',
            'image': 'images/catalogue.png',
            'smartphoneimage': 'images/smartphone.png',
            'homepage': 'http://homepage.example.com',
            'doc': 'docs/index.html',
            'license': 'Apache License 2',
            'licenseurl': 'http://www.apache.org/licenses/LICENSE-2.0.html',
            'changelog': 'log/change.html',
            'requirements': [
                {'type': 'feature', 'name': 'Wirecloud'},
                {'type': 'feature', 'name': 'PubSub'}
            ],
            'params': [
                {'name': 'param1', 'label': 'Param 1', 'type': 'text'},
                {'name': 'param2', 'label': 'Param 2', 'type': 'password'}
            ],
            'preferences': {
                'columns': '8'
            },
            'embedded': [],
            'tabs': [
                {
                    'name': 'Tab 1',
                    'preferences': {
                        'columns': '9',
                        'smart': 'false'
                    },
                    'resources': [
                        {
                            'id': '1',
                            'vendor': 'Wirecloud',
                            'name': 'TestWidget',
                            'version': '1.0',
                            'title': 'Widget title',
                            'readonly': False,
                            'properties': {
                                'prop1': {'value': 'value1', 'readonly': False},
                                'prop2': {'value': '%(param.param1)', 'readonly': True}
                            },
                            'preferences': {
                                'list': {'value': '%(param.param1)', 'readonly': True, 'hidden': False},
                                'text': {'value': '%(param.param2)', 'readonly': True, 'hidden': True}
                            },
                            'position': {
                                'x': '0',
                                'y': '1',
                                'z': '2',
                            },
                            'rendering': {
                                'width': '10',
                                'height': '10',
                                'layout': '0',
                                'fulldragboard': False,
                                'minimized': False
                            }
                        },
                        {
                            'id': '2',
                            'vendor': 'Wirecloud',
                            'name': 'TestWidget',
                            'version': '2.0',
                            'title': 'Widget title',
                            'readonly': True,
                            'properties': {
                                'prop1': {'value': 'value1', 'readonly': False}
                            },
                            'preferences': {
                                'text': {'value': 'other value', 'readonly': True, 'hidden': True}
                            },
                            'position': {
                                'x': '10',
                                'y': '1',
                                'z': '2',
                            },
                            'rendering': {
                                'width': '10',
                                'height': '10',
                                'layout': '0',
                                'fulldragboard': True,
                                'minimized': True
                            }
                        }
                    ]
                },
                {
                    'name': 'Tab 2',
                    'preferences': {
                        'pref1': 'pref value',
                    },
                    'resources': []
                },
            ],
            'wiring': {
                'inputs': [],
                'outputs': [],
                'operators': {
                    '1': {
                        "id": '1',
                        "name": "Wirecloud/TestOperator/1.0",
                        "preferences": {}
                    },
                    '2': {
                        "id": '2',
                        "name": "Wirecloud/TestOperator/2.0",
                        "preferences": {
                            'pref1': {'value': 'op2 pref1 value', 'hidden': False, 'readonly': False},
                            'pref2': {'value': '%(param.param1)', 'hidden': False, 'readonly': True}
                        },
                    },
                    '3': {
                        "id": '3',
                        "name": "Wirecloud/TestOperator/2.0",
                        "preferences": {
                            'pref1': {'value': '%(param.param2)', 'hidden': True, 'readonly': True}
                        },
                    }
                },
                'connections': [],
                'views': []
            },
            'default_lang': 'en',
            'translations': {},
            'translation_index_usage': {},
        }

        cls.basic_widget_info = {
            'type': 'widget',
            'vendor': 'Wirecloud',
            'name': 'TemplateTest',
            'version': '1.0',
            'title': '',
            'description': '',
            'longdescription': '',
            'authors': [],
            'contributors': [],
            'email': '',
            'image': '',
            'smartphoneimage': '',
            'homepage': '',
            'doc': '',
            'license': '',
            'licenseurl': '',
            'changelog': '',
            'requirements': [],
            'preferences': [],
            'properties': [],
            'wiring': {
                'inputs': [],
                'outputs': [],
            },
            'contents': {
                'src': 'http://example.com/code.html',
                'charset': 'utf-8',
                'contenttype': 'text/html',
                'cacheable': True,
                'useplatformstyle': False
            },
            'altcontents': [],
            'default_lang': 'en',
            'widget_width': '8',
            'widget_height': '30',
            'translations': {},
            'translation_index_usage': {},
        }

        cls.widget_info = {
            'type': 'widget',
            'vendor': 'Wirecloud',
            'name': 'TemplateTest',
            'version': '2.0',
            'title': 'Template Test',
            'description': 'test',
            'longdescription': 'README.md',
            'authors': [{'name': 'author_test'}],
            'contributors': [],
            'email': 'test@example.com',
            'image': 'images/catalogue.png',
            'smartphoneimage': 'images/smartphone.png',
            'homepage': 'http://homepage.example.com',
            'doc': 'docs/index.html',
            'license': 'Apache License 2',
            'licenseurl': 'http://www.apache.org/licenses/LICENSE-2.0.html',
            'changelog': 'log/change.html',
            'requirements': [
                {'type': 'feature', 'name': 'Wirecloud'},
            ],
            'preferences': [
                {
                    'name': 'pref1',
                    'type': 'list',
                    'options': [
                        {'label': 'Option 1', 'value': '1'},
                        {'label': 'Option 2', 'value': '2'}
                    ],
                    'secure': False,
                    'readonly': False,
                    'label': 'Preference label',
                    'description': 'Preference description',
                    'default': '',
                    'value': None
                },
                {
                    'name': 'pref2',
                    'type': 'text',
                    'secure': True,
                    'readonly': True,
                    'label': 'Preference label',
                    'description': 'Preference description',
                    'default': 'value',
                    'value': '5'
                }
            ],
            'properties': [
                {
                    'name': 'prop1',
                    'type': 'text',
                    'secure': False,
                    'label': 'Prop1',
                    'description': 'description 1',
                    'default': 'value1',
                },
                {
                    'name': 'prop2',
                    'type': 'text',
                    'secure': True,
                    'label': 'Prop2',
                    'description': 'description 2',
                    'default': 'value2',
                }
            ],
            'wiring': {
                'inputs': [
                    {
                        'name': 'input1',
                        'type': 'text',
                        'label': 'Input label 1',
                        'description': 'Input description 1',
                        'actionlabel': 'a',
                        'friendcode': 'friendcode 1'
                    },
                    {
                        'name': 'input2',
                        'type': 'text',
                        'label': 'Input label 2',
                        'description': 'Input description 2',
                        'actionlabel': '',
                        'friendcode': 'friendcode 2'
                    },
                    {
                        'name': 'input3',
                        'type': 'text',
                        'label': 'Input label 3',
                        'description': 'Input description 3',
                        'actionlabel': 'action label 3',
                        'friendcode': 'friendcode 3'
                    }
                ],
                'outputs': [
                    {
                        'name': 'output1',
                        'type': 'text',
                        'label': 'Output label 1',
                        'description': 'Output description 1',
                        'friendcode': 'friendcode 1'
                    },
                    {
                        'name': 'output2',
                        'type': 'text',
                        'label': 'Output label 2',
                        'description': 'Output description 2',
                        'friendcode': 'friendcode 2'
                    },
                    {
                        'name': 'output3',
                        'type': 'text',
                        'label': 'Output label 3',
                        'description': 'Output description 3',
                        'friendcode': 'friendcode 3'
                    }
                ]
            },
            'contents': {
                'src': 'code.html',
                'charset': 'utf-8',
                'contenttype': 'application/xhtml+xml',
                'cacheable': False,
                'useplatformstyle': True
            },
            'altcontents': [
                {'scope': 'yaast', 'src': 'native.html', 'contenttype': 'application/xhtml+xml', 'charset': 'utf-8'}
            ],
            'default_lang': 'en',
            'widget_width': '8',
            'widget_height': '30',
            'translations': {},
            'translation_index_usage': {},
        }

        cls.minimal_endpoint_info = {
            'type': 'widget',
            'vendor': 'Wirecloud',
            'name': 'TemplateTest',
            'version': '1.0',
            'title': '',
            'description': '',
            'longdescription': '',
            'authors': [],
            'contributors': [],
            'email': '',
            'image': '',
            'smartphoneimage': '',
            'homepage': '',
            'doc': '',
            'license': '',
            'licenseurl': '',
            'changelog': '',
            'requirements': [],
            'preferences': [],
            'properties': [],
            'wiring': {
                'inputs': [
                    {
                        'name': 'input1',
                        'type': 'text',
                        'label': '',
                        'description': '',
                        'actionlabel': '',
                        'friendcode': ''
                    },
                    {
                        'name': 'input2',
                        'type': 'text',
                        'label': '',
                        'description': '',
                        'actionlabel': '',
                        'friendcode': ''
                    },
                ],
                'outputs': [
                    {
                        'name': 'output1',
                        'type': 'text',
                        'label': '',
                        'description': '',
                        'friendcode': ''
                    },
                    {
                        'name': 'output2',
                        'type': 'text',
                        'label': '',
                        'description': '',
                        'friendcode': ''
                    },
                ],
            },
            'contents': {
                'src': 'http://example.com/code.html',
                'charset': 'utf-8',
                'contenttype': 'text/html',
                'cacheable': True,
                'useplatformstyle': False
            },
            'altcontents': [],
            'default_lang': 'en',
            'widget_width': '8',
            'widget_height': '30',
            'translations': {},
            'translation_index_usage': {},
        }

        cls.minimal_preference_info = {
            'type': 'operator',
            'vendor': 'Wirecloud',
            'name': 'TemplateTest',
            'version': '1.0',
            'title': '',
            'description': '',
            'longdescription': '',
            'authors': [],
            'contributors': [],
            'email': '',
            'image': '',
            'smartphoneimage': '',
            'homepage': '',
            'doc': '',
            'license': '',
            'licenseurl': '',
            'changelog': '',
            'requirements': [],
            'preferences': [
                {
                    'name': 'pref1',
                    'type': 'text',
                    'secure': False,
                    'readonly': False,
                    'label': '',
                    'description': '',
                    'default': '',
                    'value': None
                },
                {
                    'name': 'pref2',
                    'type': 'text',
                    'secure': False,
                    'readonly': False,
                    'label': '',
                    'description': '',
                    'default': '',
                    'value': None
                },
            ],
            'properties': [],
            'wiring': {
                'inputs': [],
                'outputs': [],
            },
            'js_files': ['js/main.js'],
            'default_lang': 'en',
            'translations': {},
            'translation_index_usage': {},
        }

        cls.minimal_property_info = {
            'type': 'widget',
            'vendor': 'Wirecloud',
            'name': 'TemplateTest',
            'version': '1.0',
            'title': '',
            'description': '',
            'longdescription': '',
            'authors': [],
            'contributors': [],
            'email': '',
            'image': '',
            'smartphoneimage': '',
            'homepage': '',
            'doc': '',
            'license': '',
            'licenseurl': '',
            'changelog': '',
            'requirements': [],
            'preferences': [],
            'properties': [
                {
                    'name': 'prop1',
                    'type': 'text',
                    'secure': False,
                    'label': '',
                    'description': '',
                    'default': '',
                },
                {
                    'name': 'prop2',
                    'type': 'text',
                    'secure': False,
                    'label': '',
                    'description': '',
                    'default': '',
                },
            ],
            'wiring': {
                'inputs': [],
                'outputs': [],
            },
            'contents': {
                'src': 'http://example.com/code.html',
                'charset': 'utf-8',
                'contenttype': 'text/html',
                'cacheable': True,
                'useplatformstyle': False
            },
            'altcontents': [],
            'default_lang': 'en',
            'widget_width': '8',
            'widget_height': '30',
            'translations': {},
            'translation_index_usage': {},
        }

    def read_template(self, *filename):
        f = open(os.path.join(os.path.dirname(__file__), '..', 'test-data', *filename), 'rb')
        contents = f.read()
        f.close()

        return contents

    def check_full_mashup(self, processed_info, expected_result):

        mashup_info = copy.deepcopy(expected_result)

        self.assertEqual(len(processed_info['tabs']), len(mashup_info['tabs']))
        for tab_index, tab in enumerate(processed_info['tabs']):
            self.assertItemsEqual(tab['resources'], mashup_info['tabs'][tab_index]['resources'])
            del tab['resources']
            del mashup_info['tabs'][tab_index]['resources']

        self.assertItemsEqual(processed_info['wiring']['connections'], mashup_info['wiring']['connections'])
        del processed_info['wiring']['connections']
        del mashup_info['wiring']['connections']

        self.assertItemsEqual(processed_info['requirements'], mashup_info['requirements'])
        del processed_info['requirements']
        del mashup_info['requirements']

        self.assertItemsEqual(processed_info['embedded'], mashup_info['embedded'])
        del processed_info['embedded']
        del mashup_info['embedded']

        self.assertEqual(processed_info, mashup_info)

    def test_json_parser_writer_basic_operator(self):

        json_description = write_json_description(self.basic_operator_info)
        template = TemplateParser(json_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_operator_info)

    def test_json_parser_writer_operator(self):

        json_description = write_json_description(self.operator_info)
        template = TemplateParser(json_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.operator_info)

    def test_json_parser_writer_operator_with_translations(self):

        json_description = write_json_description(self.operator_with_translation_info)
        template = TemplateParser(json_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.operator_with_translation_info)

    def test_json_parser_writer_basic_mashup(self):

        json_description = write_json_description(self.basic_mashup_info)
        template = TemplateParser(json_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_mashup_info)

    def test_json_parser_writer_mashup(self):

        json_description = write_json_description(self.mashup_info)
        template = TemplateParser(json_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_info)

    def test_json_parser_writer_mashup_with_translations(self):

        json_description = write_json_description(self.mashup_with_translations_info)
        template = TemplateParser(json_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_with_translations_info)

    def test_json_parser_writer_mashup_with_params(self):

        json_description = write_json_description(self.mashup_with_params)
        template = TemplateParser(json_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_with_params)

    def test_json_parser_writer_basic_widget(self):

        json_description = write_json_description(self.basic_widget_info)
        template = TemplateParser(json_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_widget_info)

    def test_json_parser_writer_widget(self):

        json_description = write_json_description(self.widget_info)
        template = TemplateParser(json_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.widget_info)

    def test_json_parser_minimal_endpoint_info(self):

        json_description = self.read_template('minimal_endpoint_info.json')
        template = TemplateParser(json_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.minimal_endpoint_info)

    def test_json_parser_minimal_preference_info(self):

        json_description = self.read_template('minimal_preference_info.json')
        template = TemplateParser(json_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.minimal_preference_info)

    def test_json_parser_minimal_property_info(self):

        json_description = self.read_template('minimal_property_info.json')
        template = TemplateParser(json_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.minimal_property_info)

    def test_rdf_parser_writer_basic_operator(self):

        rdf_description = write_rdf_description(self.basic_operator_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_operator_info)
    test_rdf_parser_writer_basic_operator.tags = ('template', 'fiware-ut-14')

    def test_rdf_parser_writer_operator(self):

        rdf_description = write_rdf_description(self.operator_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.operator_info)
    test_rdf_parser_writer_operator.tags = ('template', 'fiware-ut-14')

    def test_rdf_parser_writer_operator_with_translations(self):

        rdf_description = write_rdf_description(self.operator_with_translation_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.operator_with_translation_info)
    test_rdf_parser_writer_operator_with_translations.tags = ('template', 'fiware-ut-14')

    def test_rdf_parser_writer_basic_mashup(self):

        rdf_description = write_rdf_description(self.basic_mashup_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_mashup_info)
    test_rdf_parser_writer_basic_mashup.tags = ('template', 'fiware-ut-14')

    def test_rdf_parser_writer_mashup(self):

        rdf_description = write_rdf_description(self.mashup_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_info)
    test_rdf_parser_writer_mashup.tags = ('template', 'fiware-ut-14')

    def test_rdf_parser_writer_mashup_with_translations(self):

        rdf_description = write_rdf_description(self.mashup_with_translations_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_with_translations_info)
    test_rdf_parser_writer_mashup_with_translations.tags = ('template', 'fiware-ut-14')

    def test_rdf_parser_writer_mashup_with_params(self):

        rdf_description = write_rdf_description(self.mashup_with_params)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_with_params)
    test_rdf_parser_writer_mashup_with_params.tags = ('template', 'fiware-ut-14')

    def test_rdf_parser_writer_basic_widget(self):

        rdf_description = write_rdf_description(self.basic_widget_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_widget_info)
    test_rdf_parser_writer_basic_widget.tags = ('template', 'fiware-ut-14')

    def test_rdf_parser_writer_widget(self):

        rdf_description = write_rdf_description(self.widget_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.widget_info)
    test_rdf_parser_writer_widget.tags = ('template', 'fiware-ut-14')

    def test_rdf_parser_minimal_endpoint_info(self):

        xml_description = self.read_template('minimal_endpoint_info.rdf')
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.minimal_endpoint_info)

    def test_rdf_parser_minimal_preference_info(self):

        rdf_description = self.read_template('minimal_preference_info.rdf')
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.minimal_preference_info)

    def test_rdf_parser_minimal_property_info(self):

        rdf_description = self.read_template('minimal_property_info.rdf')
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.minimal_property_info)

    def test_xml_parser_writer_basic_mashup(self):

        xml_description = write_xml_description(self.basic_mashup_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_mashup_info)
    test_xml_parser_writer_basic_mashup.tags = ('template', 'fiware-ut-14')

    def test_xml_parser_writer_mashup(self):

        xml_description = write_xml_description(self.mashup_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_info)
    test_xml_parser_writer_mashup.tags = ('template', 'fiware-ut-14')

    def test_xml_parser_writer_mashup_with_translations(self):

        xml_description = write_xml_description(self.mashup_with_translations_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_with_translations_info)
    test_xml_parser_writer_mashup_with_translations.tags = ('template', 'fiware-ut-14')

    def test_xml_parser_writer_mashup_with_params(self):

        xml_description = write_xml_description(self.mashup_with_params)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_with_params)
    test_xml_parser_writer_mashup_with_params.tags = ('template', 'fiware-ut-14')

    def test_xml_parser_writer_basic_widget(self):

        xml_description = write_xml_description(self.basic_widget_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_widget_info)
    test_xml_parser_writer_basic_widget.tags = ('template', 'fiware-ut-14')

    def test_xml_parser_writer_widget(self):

        xml_description = write_xml_description(self.widget_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.widget_info)
    test_xml_parser_writer_widget.tags = ('template', 'fiware-ut-14')

    def test_next_xml_parser_writer_basic_operator(self):

        xml_description = write_next_xml_description(self.basic_operator_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_operator_info)

    def test_next_xml_parser_writer_operator(self):

        xml_description = write_next_xml_description(self.operator_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.operator_info)

    def test_next_xml_parser_writer_operator_with_translations(self):

        xml_description = write_json_description(self.operator_with_translation_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.operator_with_translation_info)

    def test_next_xml_parser_writer_basic_mashup(self):

        xml_description = write_next_xml_description(self.basic_mashup_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_mashup_info)

    def test_next_xml_parser_writer_mashup(self):

        xml_description = write_next_xml_description(self.mashup_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_info)

    def test_next_xml_parser_writer_mashup_with_translations(self):

        xml_description = write_next_xml_description(self.mashup_with_translations_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_with_translations_info)

    def test_next_xml_parser_writer_mashup_with_params(self):

        xml_description = write_next_xml_description(self.mashup_with_params)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_with_params)

    def test_next_xml_parser_writer_basic_widget(self):

        xml_description = write_next_xml_description(self.basic_widget_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_widget_info)

    def test_next_xml_parser_writer_widget(self):

        xml_description = write_next_xml_description(self.widget_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.widget_info)

    def test_next_xml_parser_minimal_endpoint_info(self):

        xml_description = self.read_template('minimal_endpoint_info.xml')
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.minimal_endpoint_info)

    def test_next_xml_parser_minimal_preference_info(self):

        xml_description = self.read_template('minimal_preference_info.xml')
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.minimal_preference_info)

    def test_next_xml_parser_minimal_property_info(self):

        xml_description = self.read_template('minimal_property_info.xml')
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.minimal_property_info)

    def test_get_resource_processed_info(self):

        json_description = json.dumps(self.widget_info)
        template = TemplateParser(json_description)
        processed_info = template.get_resource_processed_info(base='https://example.com/')
        self.assertEqual(processed_info['image'], 'https://example.com/images/catalogue.png')
        self.assertEqual(processed_info['smartphoneimage'], 'https://example.com/images/smartphone.png')
        self.assertEqual(processed_info['contents']['src'], 'https://example.com/code.html')
        self.assertEqual(processed_info['altcontents'][0]['src'], 'https://example.com/native.html')

    def test_get_resource_processed_info_no_process_urls(self):

        json_description = json.dumps(self.widget_info)
        template = TemplateParser(json_description)
        processed_info = template.get_resource_processed_info(base='https://example.com/', process_urls=False)
        self.assertEqual(processed_info['image'], 'images/catalogue.png')
        self.assertEqual(processed_info['smartphoneimage'], 'images/smartphone.png')
        self.assertEqual(processed_info['contents']['src'], 'code.html')
        self.assertEqual(processed_info['altcontents'][0]['src'], 'native.html')
