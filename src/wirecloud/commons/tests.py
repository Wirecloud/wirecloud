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
            'context': [],
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
                    'secure': False,
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
            'context': [],
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
            'params': {},
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
            'params': {},
            'preferences': {},
            'tabs': [
                {
                    'name': u'Tab 1',
                    'preferences': {},
                    'resources': []
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
            'context': [],
            'wiring': {
                'inputs': [],
                'outputs': [],
            },
            'code_url': 'http://example.com/code.html',
            'code_content_type': 'application/xhtml+xml',
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
                    'default_value': 'value',
                    'value': None
                },
                {
                    'name': 'pref2',
                    'type': 'text',
                    'secure': False,
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
            'context': [],
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
            'code_content_type': 'application/xhtml+xml',
            'code_cacheable': False,
            'code_uses_platform_style': True,
            'default_lang': 'en',
            'widget_width': '8',
            'widget_height': '30',
            'translations': {},
            'translation_index_usage': {},
        }

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

    def test_rdf_parser_writer_basic_mashup(self):

        rdf_description = write_rdf_description(self.basic_mashup_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        self.assertEqual(processed_info, self.basic_mashup_info)

    def test_rdf_parser_writer_mashup(self):

        rdf_description = write_rdf_description(self.mashup_info)
        template = TemplateParser(rdf_description)
        processed_info = template.get_resource_info()

        mashup_info = copy.deepcopy(self.mashup_info)

        self.assertItemsEqual(processed_info['wiring']['connections'], mashup_info['wiring']['connections'])
        del processed_info['wiring']['connections']
        del mashup_info['wiring']['connections']

        self.assertItemsEqual(processed_info['requirements'], mashup_info['requirements'])
        del processed_info['requirements']
        del mashup_info['requirements']

        self.assertEqual(processed_info, mashup_info)

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

        mashup_info = copy.deepcopy(self.mashup_info)

        self.assertItemsEqual(processed_info['wiring']['connections'], mashup_info['wiring']['connections'])
        del processed_info['wiring']['connections']
        del mashup_info['wiring']['connections']

        self.assertItemsEqual(processed_info['requirements'], mashup_info['requirements'])
        del processed_info['requirements']
        del mashup_info['requirements']

        self.assertEqual(processed_info, mashup_info)

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
