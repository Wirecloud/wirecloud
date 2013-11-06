# -*- coding: utf-8 -*-

# Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid

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

import copy

from django.utils.unittest import TestCase

from wirecloud.commons.utils.template.parsers import TemplateParser
from wirecloud.commons.utils.template.writers.json import write_json_description
from wirecloud.commons.utils.template.writers.rdf import write_rdf_description
from wirecloud.commons.utils.template.writers.xml import write_xml_description


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
            'display_name': 'Template Test Operator',
            'description': '',
            'author': '',
            'email': 'email@example.com',
            'image_uri': '',
            'iphone_image_uri': '',
            'doc_uri': '',
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
            'display_name': 'Template Test Operator',
            'description': 'test',
            'author': 'author_test',
            'email': 'test@example.com',
            'image_uri': 'images/catalogue.png',
            'iphone_image_uri': 'images/smartphone.png',
            'doc_uri': 'docs/index.html',
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
                    'default_value': 'value',
                    'value': None
                },
                {
                    'name': 'pref2',
                    'type': 'text',
                    'secure': True,
                    'readonly': True,
                    'label': 'Preference label',
                    'description': 'Preference description',
                    'default_value': '',
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
                    'default_value': 'value1',
                },
                {
                    'name': 'prop2',
                    'type': 'text',
                    'secure': True,
                    'label': 'Prop2',
                    'description': 'description 2',
                    'default_value': 'value2',
                }
            ],
            'wiring': {
                'inputs': [
                    {
                        'name': u'input1',
                        'type': 'text',
                        'label': u'Input label 1',
                        'description': u'Input description 1',
                        'actionlabel': u'a',
                        'friendcode': u'friendcode 1'
                    },
                    {
                        'name': u'input2',
                        'type': 'text',
                        'label': u'Input label 2',
                        'description': u'Input description 2',
                        'actionlabel': '',
                        'friendcode': u'friendcode 2'
                    },
                    {
                        'name': u'input3',
                        'type': 'text',
                        'label': u'Input label 3',
                        'description': u'Input description 3',
                        'actionlabel': 'action label 3',
                        'friendcode': u'friendcode 3'
                    }
                ],
                'outputs': [
                    {
                        'name': u'output1',
                        'type': 'text',
                        'label': u'Output label 1',
                        'description': u'Output description 1',
                        'friendcode': u'friendcode 1'
                    },
                    {
                        'name': u'output2',
                        'type': 'text',
                        'label': u'Output label 2',
                        'description': u'Output description 2',
                        'friendcode': u'friendcode 2'
                    },
                    {
                        'name': u'output3',
                        'type': 'text',
                        'label': u'Output label 3',
                        'description': u'Output description 3',
                        'friendcode': u'friendcode 3'
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
            'display_name': '__MSG_display_name__',
            'description': '__MSG_description__',
            'author': 'author_test',
            'email': 'test@example.com',
            'image_uri': 'images/catalogue.png',
            'iphone_image_uri': 'images/smartphone.png',
            'doc_uri': 'docs/index.html',
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
                    'default_value': 'value',
                    'value': None
                },
                {
                    'name': 'pref2',
                    'type': 'text',
                    'secure': True,
                    'readonly': True,
                    'label': '__MSG_pref2_label__',
                    'description': '__MSG_pref2_description__',
                    'default_value': '',
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
                    'default_value': 'value1',
                },
                {
                    'name': 'prop2',
                    'type': 'text',
                    'secure': True,
                    'label': '__MSG_prop2_label__',
                    'description': '__MSG_prop2_description__',
                    'default_value': 'value2',
                }
            ],
            'wiring': {
                'inputs': [
                    {
                        'name': u'input1',
                        'type': 'text',
                        'label': u'__MSG_input1_label__',
                        'description': u'__MSG_input1_description__',
                        'actionlabel': u'__MSG_input1_actionlabel__',
                        'friendcode': u'friendcode 1'
                    },
                    {
                        'name': u'input2',
                        'type': 'text',
                        'label': u'__MSG_input2_label__',
                        'description': u'__MSG_input2_description__',
                        'actionlabel': u'__MSG_input2_actionlabel__',
                        'friendcode': u'friendcode 2'
                    },
                    {
                        'name': u'input3',
                        'type': 'text',
                        'label': u'__MSG_input3_label__',
                        'description': u'__MSG_input3_description__',
                        'actionlabel': u'__MSG_input3_actionlabel__',
                        'friendcode': u'friendcode 3'
                    }
                ],
                'outputs': [
                    {
                        'name': u'output1',
                        'type': 'text',
                        'label': u'__MSG_output1_label__',
                        'description': u'__MSG_output1_description__',
                        'friendcode': u'friendcode 1'
                    },
                    {
                        'name': u'output2',
                        'type': 'text',
                        'label': u'__MSG_output2_label__',
                        'description': u'__MSG_output2_description__',
                        'friendcode': u'friendcode 2'
                    },
                    {
                        'name': u'output3',
                        'type': 'text',
                        'label': u'__MSG_output3_label__',
                        'description': u'__MSG_output3_description__',
                        'friendcode': u'friendcode 3'
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
                    'display_name': 'Template Test Operator',
                    'description': 'description',
                    'pref1_option0_label': 'Option1 label',
                    'pref1_option1_label': 'Option2 label',
                    'pref1_label': 'Pref1 label',
                    'pref1_description': 'Pref1 description',
                    'pref2_label': 'Pref2 label',
                    'pref2_description': 'Pref2 description',
                    'prop1_label': 'Prop1 label',
                    'prop1_description': u'Prop1 description',
                    'prop2_label': 'Prop2 label',
                    'prop2_description': u'Prop2 description',
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
                    'display_name': 'Operador de prueba',
                    'description': u'descripción',
                    'pref1_option0_label': u'Etiqueta de la opción 1',
                    'pref1_option1_label': u'Etiqueta de la opción 2',
                    'pref1_label': 'Etiqueta de la pref1',
                    'pref1_description': u'Descripción de la pref1',
                    'pref2_label': 'Etiqueta de la pref2',
                    'pref2_description': u'Descripción de la pref2',
                    'prop1_label': 'Etiqueta de la propiedad 1',
                    'prop1_description': u'Descripción de la propiedad 1',
                    'prop2_label': 'Etiqueta de la propiedad 2',
                    'prop2_description': u'Descripción de la propiedad 2',
                    'input1_label': 'Etiqueta del input 1',
                    'input1_description': u'Descripción del input 1',
                    'input1_actionlabel': u'Etiqueta de acción del input 1',
                    'input2_label': 'Etiqueta del input 2',
                    'input2_description': u'Descripción del input 2',
                    'input2_actionlabel': u'Etiqueta de acción del input 2',
                    'input3_label': 'Etiqueta del input 3',
                    'input3_description': u'Descripción del input 3',
                    'input3_actionlabel': u'Etiqueta de acción del input 3',
                    'output1_label': 'Etiqueta del output 1',
                    'output1_description': u'Descripción del output 1',
                    'output2_label': 'Etiqueta del output 2',
                    'output2_description': u'Descripción del output 2',
                    'output3_label': 'Etiqueta del output 3',
                    'output3_description': u'Descripción del output 3',
                }
            },
            'translation_index_usage': {
                'display_name': [{'type': 'resource', 'field': 'display_name'}],
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
                'input1_label': [{'type': 'vdef', 'variable': 'input1', 'field': 'label'}],
                'input1_description': [{'type': 'vdef', 'variable': 'input1', 'field': 'description'}],
                'input1_actionlabel': [{'type': 'vdef', 'variable': 'input1', 'field': 'actionlabel'}],
                'input2_label': [{'type': 'vdef', 'variable': 'input2', 'field': 'label'}],
                'input2_actionlabel': [{'type': 'vdef', 'variable': 'input2', 'field': 'actionlabel'}],
                'input2_description': [{'type': 'vdef', 'variable': 'input2', 'field': 'description'}],
                'input3_label': [{'type': 'vdef', 'variable': 'input3', 'field': 'label'}],
                'input3_actionlabel': [{'type': 'vdef', 'variable': 'input3', 'field': 'actionlabel'}],
                'input3_description': [{'type': 'vdef', 'variable': 'input3', 'field': 'description'}],
                'output1_label': [{'type': 'vdef', 'variable': 'output1', 'field': 'label'}],
                'output1_description': [{'type': 'vdef', 'variable': 'output1', 'field': 'description'}],
                'output2_label': [{'type': 'vdef', 'variable': 'output2', 'field': 'label'}],
                'output2_description': [{'type': 'vdef', 'variable': 'output2', 'field': 'description'}],
                'output3_label': [{'type': 'vdef', 'variable': 'output3', 'field': 'label'}],
                'output3_description': [{'type': 'vdef', 'variable': 'output3', 'field': 'description'}]
            }
        }

        cls.basic_mashup_info = {
            'type': 'mashup',
            'vendor': u'Wirecloud',
            'name': u'TemplateTestMashup',
            'version': u'1.0',
            'display_name': u'Template Test Mashup',
            'description': u'',
            'author': u'',
            'email': u'email@example.com',
            'image_uri': u'',
            'iphone_image_uri': u'',
            'doc_uri': '',
            'requirements': [],
            'params': [],
            'preferences': {},
            'tabs': [],
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
            'vendor': u'Wirecloud',
            'name': u'TemplateTestMashup',
            'version': u'1.0',
            'display_name': u'Template Test Mashup',
            'description': u'test',
            'author': u'author_test',
            'email': u'test@example.com',
            'image_uri': u'images/catalogue.png',
            'iphone_image_uri': u'images/smartphone.png',
            'doc_uri': u'docs/index.html',
            'requirements': [
                {'type': 'feature', 'name': u'Wirecloud'},
                {'type': 'feature', 'name': u'PubSub'}
            ],
            'params': [],
            'preferences': {
                'columns': '8'
            },
            'tabs': [
                {
                    'name': u'Tab 1',
                    'preferences': {
                        'columns': '9',
                        'smart': 'false'
                    },
                    'resources': [
                        {
                            'id': u'1',
                            'vendor': u'Wirecloud',
                            'name': u'TestWidget',
                            'version': u'1.0',
                            'title': u'Widget title',
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
                                'x': u'0',
                                'y': u'1',
                                'z': u'2',
                            },
                            'rendering': {
                                'width': u'10',
                                'height': u'10',
                                'layout': u'0',
                                'fulldragboard': False,
                                'minimized': False
                            }
                        },
                        {
                            'id': u'2',
                            'vendor': u'Wirecloud',
                            'name': u'TestWidget',
                            'version': u'2.0',
                            'readonly': True,
                            'title': u'Widget title',
                            'properties': {
                                'prop1': {'value': 'value1', 'readonly': False}
                            },
                            'preferences': {
                                'text': {'value': 'other value', 'readonly': True, 'hidden': True}
                            },
                            'position': {
                                'x': u'10',
                                'y': u'1',
                                'z': u'2',
                            },
                            'rendering': {
                                'width': u'10',
                                'height': u'10',
                                'layout': u'0',
                                'fulldragboard': True,
                                'minimized': True
                            }
                        }
                    ]
                },
                {
                    'name': u'Tab 2',
                    'preferences': {
                        u'pref1': u'pref value',
                    },
                    'resources': []
                },
            ],
            'wiring': {
                'inputs': [
                    {
                        'name': u'input1',
                        'type': 'text',
                        'label': u'Input label 1',
                        'description': u'Input description 1',
                        'actionlabel': u'a',
                        'friendcode': u'friendcode 1'
                    },
                    {
                        'name': u'input2',
                        'type': 'text',
                        'label': u'Input label 2',
                        'description': u'Input description 2',
                        'actionlabel': '',
                        'friendcode': u'friendcode 2'
                    },
                    {
                        'name': u'input3',
                        'type': 'text',
                        'label': u'Input label 3',
                        'description': u'Input description 3',
                        'actionlabel': 'action label 3',
                        'friendcode': u'friendcode 3'
                    }
                ],
                'outputs': [
                    {
                        'name': u'output1',
                        'type': 'text',
                        'label': u'Output label 1',
                        'description': u'Output description 1',
                        'friendcode': u'friendcode 1'
                    },
                    {
                        'name': u'output2',
                        'type': 'text',
                        'label': u'Output label 2',
                        'description': u'Output description 2',
                        'friendcode': u'friendcode 2'
                    },
                    {
                        'name': u'output3',
                        'type': 'text',
                        'label': u'Output label 3',
                        'description': u'Output description 3',
                        'friendcode': u'friendcode 3'
                    }
                ],
                'operators': {
                    u'1': {
                        "id": u'1',
                        "name": u"Wirecloud/TestOperator/1.0",
                        "preferences": {}
                    },
                    u'2': {
                        "id": u'2',
                        "name": u"Wirecloud/TestOperator/2.0",
                        "preferences": {
                            u'pref1': {'value': u'op2 pref1 value', 'hidden': False, 'readonly': False},
                            u'pref2': {'value': u'op2 pref2 value', 'hidden': False, 'readonly': True}
                        },
                    },
                    u'3': {
                        "id": u'3',
                        "name": u"Wirecloud/TestOperator/2.0",
                        "preferences": {
                            u'pref1': {'value': u'op3 pref1 value', 'hidden': True, 'readonly': True}
                        },
                    }
                },
                'connections': [
                    {
                        "source": {"type": u"operator", 'id': u'1', 'endpoint': u'output1'},
                        "target": {"type": u"operator", 'id': u'2', 'endpoint': u'input1'},
                        "readonly": True
                    },
                    {
                        "source": {"type": u"iwidget", 'id': u'1', 'endpoint': u'output1'},
                        "target": {"type": u"operator", 'id': u'1', 'endpoint': u'input1'},
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
            'vendor': u'Wirecloud',
            'name': u'TemplateTestMashup',
            'version': u'1.0',
            'display_name': u'__MSG_display_name__',
            'description': u'__MSG_description__',
            'author': u'author_test',
            'email': u'test@example.com',
            'image_uri': u'images/catalogue.png',
            'iphone_image_uri': u'images/smartphone.png',
            'doc_uri': u'docs/index.html',
            'requirements': [
                {'type': 'feature', 'name': u'Wirecloud'},
                {'type': 'feature', 'name': u'PubSub'}
            ],
            'params': [],
            'preferences': {
                'columns': '8'
            },
            'tabs': [
                {
                    'name': u'Tab 1',
                    'preferences': {
                        'columns': '9',
                        'smart': 'false'
                    },
                    'resources': [
                        {
                            'id': u'1',
                            'vendor': u'Wirecloud',
                            'name': u'TestWidget',
                            'version': u'1.0',
                            'title': u'Widget title',
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
                                'x': u'0',
                                'y': u'1',
                                'z': u'2',
                            },
                            'rendering': {
                                'width': u'10',
                                'height': u'10',
                                'layout': u'0',
                                'fulldragboard': False,
                                'minimized': False
                            }
                        },
                        {
                            'id': u'2',
                            'vendor': u'Wirecloud',
                            'name': u'TestWidget',
                            'version': u'2.0',
                            'title': u'Widget title',
                            'readonly': True,
                            'properties': {
                                'prop1': {'value': 'value1', 'readonly': False}
                            },
                            'preferences': {
                                'text': {'value': 'other value', 'readonly': True, 'hidden': True}
                            },
                            'position': {
                                'x': u'10',
                                'y': u'1',
                                'z': u'2',
                            },
                            'rendering': {
                                'width': u'10',
                                'height': u'10',
                                'layout': u'0',
                                'fulldragboard': True,
                                'minimized': True
                            }
                        }
                    ]
                },
                {
                    'name': u'Tab 2',
                    'preferences': {
                        u'pref1': u'pref value',
                    },
                    'resources': []
                },
            ],
            'wiring': {
                'inputs': [
                    {
                        'name': u'input1',
                        'type': 'text',
                        'label': u'Input label 1',
                        'description': u'Input description 1',
                        'actionlabel': u'a',
                        'friendcode': u'friendcode 1'
                    },
                    {
                        'name': u'input2',
                        'type': 'text',
                        'label': u'Input label 2',
                        'description': u'Input description 2',
                        'actionlabel': '',
                        'friendcode': u'friendcode 2'
                    },
                    {
                        'name': u'input3',
                        'type': 'text',
                        'label': u'Input label 3',
                        'description': u'Input description 3',
                        'actionlabel': 'action label 3',
                        'friendcode': u'friendcode 3'
                    }
                ],
                'outputs': [
                    {
                        'name': u'output1',
                        'type': 'text',
                        'label': u'Output label 1',
                        'description': u'Output description 1',
                        'friendcode': u'friendcode 1'
                    },
                    {
                        'name': u'output2',
                        'type': 'text',
                        'label': u'Output label 2',
                        'description': u'Output description 2',
                        'friendcode': u'friendcode 2'
                    },
                    {
                        'name': u'output3',
                        'type': 'text',
                        'label': u'Output label 3',
                        'description': u'Output description 3',
                        'friendcode': u'friendcode 3'
                    }
                ],
                'operators': {
                    u'1': {
                        "id": u'1',
                        "name": u"Wirecloud/TestOperator/1.0",
                        "preferences": {}
                    },
                    u'2': {
                        "id": u'2',
                        "name": u"Wirecloud/TestOperator/2.0",
                        "preferences": {
                            u'pref1': {'value': u'op2 pref1 value', 'hidden': False, 'readonly': False},
                            u'pref2': {'value': u'op2 pref2 value', 'hidden': False, 'readonly': True}
                        },
                    },
                    u'3': {
                        "id": u'3',
                        "name": u"Wirecloud/TestOperator/2.0",
                        "preferences": {
                            u'pref1': {'value': u'op3 pref1 value', 'hidden': True, 'readonly': True}
                        },
                    }
                },
                'connections': [
                    {
                        "source": {"type": u"operator", 'id': u'1', 'endpoint': u'output1'},
                        "target": {"type": u"operator", 'id': u'2', 'endpoint': u'input1'},
                        "readonly": True
                    },
                    {
                        "source": {"type": u"iwidget", 'id': u'1', 'endpoint': u'output1'},
                        "target": {"type": u"operator", 'id': u'1', 'endpoint': u'input1'},
                        "readonly": False
                    }
                ],
                'views': []
            },
            'default_lang': 'en',
            'translations': {
                'en': {
                    'display_name': 'Template Test Operator',
                    'description': 'description'
                },
                'es': {
                    'display_name': 'Operador de prueba',
                    'description': u'descripción'
                }
            },
            'translation_index_usage': {
                'display_name': [{'type': 'resource', 'field': 'display_name'}],
                'description': [{'type': 'resource', 'field': 'description'}]
            },
        }

        cls.mashup_with_params = {
            'type': 'mashup',
            'vendor': u'Wirecloud',
            'name': u'TemplateTestMashup',
            'version': u'1.0',
            'display_name': u'Template Test Mashup',
            'description': u'test',
            'author': u'author_test',
            'email': u'test@example.com',
            'image_uri': u'images/catalogue.png',
            'iphone_image_uri': u'images/smartphone.png',
            'doc_uri': u'docs/index.html',
            'requirements': [
                {'type': 'feature', 'name': u'Wirecloud'},
                {'type': 'feature', 'name': u'PubSub'}
            ],
            'params': [
                {'name': 'param1', 'label': 'Param 1', 'type': 'text'},
                {'name': 'param2', 'label': 'Param 2', 'type': 'password'}
            ],
            'preferences': {
                'columns': '8'
            },
            'tabs': [
                {
                    'name': u'Tab 1',
                    'preferences': {
                        'columns': '9',
                        'smart': 'false'
                    },
                    'resources': [
                        {
                            'id': u'1',
                            'vendor': u'Wirecloud',
                            'name': u'TestWidget',
                            'version': u'1.0',
                            'title': u'Widget title',
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
                                'x': u'0',
                                'y': u'1',
                                'z': u'2',
                            },
                            'rendering': {
                                'width': u'10',
                                'height': u'10',
                                'layout': u'0',
                                'fulldragboard': False,
                                'minimized': False
                            }
                        },
                        {
                            'id': u'2',
                            'vendor': u'Wirecloud',
                            'name': u'TestWidget',
                            'version': u'2.0',
                            'title': u'Widget title',
                            'readonly': True,
                            'properties': {
                                'prop1': {'value': 'value1', 'readonly': False}
                            },
                            'preferences': {
                                'text': {'value': 'other value', 'readonly': True, 'hidden': True}
                            },
                            'position': {
                                'x': u'10',
                                'y': u'1',
                                'z': u'2',
                            },
                            'rendering': {
                                'width': u'10',
                                'height': u'10',
                                'layout': u'0',
                                'fulldragboard': True,
                                'minimized': True
                            }
                        }
                    ]
                },
                {
                    'name': u'Tab 2',
                    'preferences': {
                        u'pref1': u'pref value',
                    },
                    'resources': []
                },
            ],
            'wiring': {
                'inputs': [],
                'outputs': [],
                'operators': {
                    u'1': {
                        "id": u'1',
                        "name": u"Wirecloud/TestOperator/1.0",
                        "preferences": {}
                    },
                    u'2': {
                        "id": u'2',
                        "name": u"Wirecloud/TestOperator/2.0",
                        "preferences": {
                            u'pref1': {'value': u'op2 pref1 value', 'hidden': False, 'readonly': False},
                            u'pref2': {'value': u'%(param.param1)', 'hidden': False, 'readonly': True}
                        },
                    },
                    u'3': {
                        "id": u'3',
                        "name": u"Wirecloud/TestOperator/2.0",
                        "preferences": {
                            u'pref1': {'value': u'%(param.param2)', 'hidden': True, 'readonly': True}
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
            'display_name': 'TemplateTest',
            'description': '',
            'author': '',
            'email': 'email@example.com',
            'image_uri': '',
            'iphone_image_uri': '',
            'doc_uri': '',
            'requirements': [],
            'preferences': [],
            'properties': [],
            'wiring': {
                'inputs': [],
                'outputs': [],
            },
            'code_url': 'http://example.com/code.html',
            'code_charset': 'utf-8',
            'code_content_type': 'text/html',
            'code_cacheable': True,
            'code_uses_platform_style': False,
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
            'display_name': 'Template Test',
            'description': 'test',
            'author': 'author_test',
            'email': 'test@example.com',
            'image_uri': 'images/catalogue.png',
            'iphone_image_uri': 'images/smartphone.png',
            'doc_uri': 'docs/index.html',
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
                    'default_value': '',
                    'value': None
                },
                {
                    'name': 'pref2',
                    'type': 'text',
                    'secure': True,
                    'readonly': True,
                    'label': 'Preference label',
                    'description': 'Preference description',
                    'default_value': 'value',
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
                    'default_value': 'value1',
                },
                {
                    'name': 'prop2',
                    'type': 'text',
                    'secure': True,
                    'label': 'Prop2',
                    'description': 'description 2',
                    'default_value': 'value2',
                }
            ],
            'wiring': {
                'inputs': [
                    {
                        'name': u'input1',
                        'type': 'text',
                        'label': u'Input label 1',
                        'description': u'Input description 1',
                        'actionlabel': u'a',
                        'friendcode': u'friendcode 1'
                    },
                    {
                        'name': u'input2',
                        'type': 'text',
                        'label': u'Input label 2',
                        'description': u'Input description 2',
                        'actionlabel': '',
                        'friendcode': u'friendcode 2'
                    },
                    {
                        'name': u'input3',
                        'type': 'text',
                        'label': u'Input label 3',
                        'description': u'Input description 3',
                        'actionlabel': 'action label 3',
                        'friendcode': u'friendcode 3'
                    }
                ],
                'outputs': [
                    {
                        'name': u'output1',
                        'type': 'text',
                        'label': u'Output label 1',
                        'description': u'Output description 1',
                        'friendcode': u'friendcode 1'
                    },
                    {
                        'name': u'output2',
                        'type': 'text',
                        'label': u'Output label 2',
                        'description': u'Output description 2',
                        'friendcode': u'friendcode 2'
                    },
                    {
                        'name': u'output3',
                        'type': 'text',
                        'label': u'Output label 3',
                        'description': u'Output description 3',
                        'friendcode': u'friendcode 3'
                    }
                ]
            },
            'code_url': 'http://example.com/code.html',
            'code_charset': 'utf-8',
            'code_content_type': 'application/xhtml+xml',
            'code_cacheable': False,
            'code_uses_platform_style': True,
            'default_lang': 'en',
            'widget_width': '8',
            'widget_height': '30',
            'translations': {},
            'translation_index_usage': {},
        }

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

    def test_rdf_parser_writer_basic_operator(self):

        rdf_description = write_rdf_description(self.basic_operator_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_operator_info)

    def test_rdf_parser_writer_operator(self):

        rdf_description = write_rdf_description(self.operator_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.operator_info)

    def test_rdf_parser_writer_operator_with_translations(self):

        rdf_description = write_rdf_description(self.operator_with_translation_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.operator_with_translation_info)

    def test_rdf_parser_writer_basic_mashup(self):

        rdf_description = write_rdf_description(self.basic_mashup_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_mashup_info)

    def test_rdf_parser_writer_mashup(self):

        rdf_description = write_rdf_description(self.mashup_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_info)

    def test_rdf_parser_writer_mashup_with_translations(self):

        rdf_description = write_rdf_description(self.mashup_with_translations_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_with_translations_info)

    def test_rdf_parser_writer_mashup_with_params(self):

        rdf_description = write_rdf_description(self.mashup_with_params)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_with_params)

    def test_rdf_parser_writer_basic_widget(self):

        rdf_description = write_rdf_description(self.basic_widget_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_widget_info)

    def test_rdf_parser_writer_widget(self):

        rdf_description = write_rdf_description(self.widget_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.widget_info)

    def test_xml_parser_writer_basic_mashup(self):

        xml_description = write_xml_description(self.basic_mashup_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_mashup_info)

    def test_xml_parser_writer_mashup(self):

        xml_description = write_xml_description(self.mashup_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_info)

    def test_xml_parser_writer_mashup_with_translations(self):

        xml_description = write_xml_description(self.mashup_with_translations_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_with_translations_info)

    def test_xml_parser_writer_mashup_with_params(self):

        xml_description = write_xml_description(self.mashup_with_params)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.check_full_mashup(processed_info, self.mashup_with_params)

    def test_xml_parser_writer_basic_widget(self):

        xml_description = write_xml_description(self.basic_widget_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_widget_info)

    def test_xml_parser_writer_widget(self):

        xml_description = write_xml_description(self.widget_info)
        template = TemplateParser(xml_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.widget_info)
