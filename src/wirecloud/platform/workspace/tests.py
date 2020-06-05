# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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

import codecs
from collections import OrderedDict
import os
import rdflib
import json
from unittest import TestCase
from unittest.mock import Mock, create_autospec

from django.contrib.auth.models import AnonymousUser, User
from django.db.migrations.exceptions import IrreversibleError
from django.test import TransactionTestCase

from wirecloud.commons.utils.template import TemplateParser
from wirecloud.commons.utils.testcases import uses_extra_resources, WirecloudTestCase
from wirecloud.platform.iwidget.utils import SaveIWidget
from wirecloud.platform.models import IWidget, Tab, UserWorkspace, Workspace
from wirecloud.platform.preferences.views import update_workspace_preferences
from wirecloud.platform.workspace.mashupTemplateGenerator import build_json_template_from_workspace, build_xml_template_from_workspace, build_rdf_template_from_workspace
from wirecloud.platform.workspace.mashupTemplateParser import buildWorkspaceFromTemplate, fillWorkspaceUsingTemplate
from wirecloud.platform.workspace.utils import get_global_workspace_data, encrypt_value
from wirecloud.platform.workspace.views import createEmptyWorkspace
from wirecloud.platform.migration_utils import multiuser_variables_structure_forwards, multiuser_variables_structure_backwards


# Avoid nose to repeat these tests (they are run through wirecloud/tests/__init__.py)
__test__ = False


class WorkspaceMigrationsTestCase(TestCase):

    tags = ('wirecloud-migrations', 'wirecloud-platform-migrations', 'wirecloud-noselenium')

    def test_add_multiuser_support_forward_empty(self):

        apps_mock = Mock()
        apps_mock.get_model("platform", "workspace").objects.select_related('creator').all.return_value = [
        ]

        multiuser_variables_structure_forwards(apps_mock, None)

    def test_add_multiuser_support_forward(self):

        widget1_mock = Mock(
            variables={"varname": "varvalue", "varname2": "varvalue2"}
        )
        widget2_mock = Mock(
            variables={"varname": "hello", "varname2": "world"}
        )
        widget3_mock = Mock(
            variables={"varname": "varvalue", "varname2": "varvalue2"}
        )
        tab_mock = Mock()
        tab_mock.iwidget_set.all.return_value = [widget1_mock, widget2_mock]

        tab_mock2 = Mock()
        tab_mock2.iwidget_set.all.return_value = [widget3_mock]

        workspace_mock = Mock(
            wiringStatus={"operators": {
                "1": {"preferences": {"varname": {"value": "varvalue"}, "varname2": {"value": "varvalue2"}}},
                "2": {"preferences": {"varname": {"value": "hello"}, "wrongvar1": {}}},
                "3": {},
            }})
        workspace_mock.tab_set.all.return_value = [tab_mock, tab_mock2]
        workspace_mock.creator.id = "2"

        apps_mock = Mock()
        apps_mock.get_model("platform", "workspace").objects.select_related('creator').all.return_value = [workspace_mock]

        multiuser_variables_structure_forwards(apps_mock, None)

        widget1_mock.save.assert_called_with()
        self.assertEqual(widget1_mock.variables, {"varname": {"users": {"2": "varvalue"}}, "varname2": {"users": {"2": "varvalue2"}}})
        self.assertEqual(widget2_mock.variables, {"varname": {"users": {"2": "hello"}}, "varname2": {"users": {"2": "world"}}})
        self.assertEqual(widget3_mock.variables, {"varname": {"users": {"2": "varvalue"}}, "varname2": {"users": {"2": "varvalue2"}}})

        self.assertEqual(
            workspace_mock.wiringStatus,
            {
                "operators":
                    {
                        "1": {"properties": {}, "preferences": {"varname": {"value": {"users": {"2": "varvalue"}}}, "varname2": {"value": {"users": {"2": "varvalue2"}}}}},
                        "2": {"properties": {}, "preferences": {"varname": {"value": {"users": {"2": "hello"}}}, "wrongvar1": {"value": {"users": {"2": ""}}}}},
                        "3": {"properties": {}, "preferences": {}}
                    }
            }
        )

    def test_add_multiuser_support_backward_empty(self):

        apps_mock = Mock()
        apps_mock.get_model("platform", "workspace").objects.select_related('creator').all.return_value = []
        apps_mock.get_model("catalogue", "CatalogueResource").objects.filter(type__in=(0, 2)).all.return_value = []

        multiuser_variables_structure_backwards(apps_mock, None)

    def test_add_multiuser_support_backward_multiuser_components(self):
        multiuser_resource = Mock(
            vendor="testvendor",
            short_name="testname",
            version="testversion")
        multiuser_resource.json_description = {"properties": [{"multiuser": True}]}

        apps_mock = Mock()
        apps_mock.get_model("platform", "workspace").objects.select_related('creator').all.return_value = []
        apps_mock.get_model("catalogue", "CatalogueResource").objects.filter(type__in=(0, 2)).all.return_value = [multiuser_resource]

        self.assertRaises(IrreversibleError, multiuser_variables_structure_backwards, apps=apps_mock, schema_editor=None)

    def test_add_multiuser_support_backward(self):

        widget1_mock = Mock(
            variables={"varname": {"users": {"2": "varvalue"}}, "varname2": {"users": {"2": "varvalue2"}}}
        )
        widget2_mock = Mock(
            variables={"varname": {"users": {"2": "hello"}}, "varname2": {"users": {"2": "world"}}}
        )
        widget3_mock = Mock(
            variables={"varname": {"users": {"2": "varvalue"}}, "varname2": {"users": {"2": "varvalue2"}}}
        )
        tab_mock = Mock()
        tab_mock.iwidget_set.all.return_value = [widget1_mock, widget2_mock]

        tab_mock2 = Mock()
        tab_mock2.iwidget_set.all.return_value = [widget3_mock]

        workspace_mock = Mock(
            wiringStatus={"operators": {
                "1": {"properties": {}, "preferences": {"varname": {"value": {"users": {"2": "varvalue"}}}, "varname2": {"value": {"users": {"2": "varvalue2"}}}}},
                "2": {"properties": {}, "preferences": {"varname": {"value": {"users": {"2": "hello"}}}, "varname2": {"value": {"users": {"2": "world"}}}}}}
            })
        workspace_mock.tab_set.all.return_value = [tab_mock, tab_mock2]
        workspace_mock.creator.id = "2"

        apps_mock = Mock()
        apps_mock.get_model("platform", "workspace").objects.select_related('creator').all.return_value = [workspace_mock]
        apps_mock.get_model("catalogue", "CatalogueResource").objects.filter(type__in=(0, 2)).all.return_value = []

        multiuser_variables_structure_backwards(apps_mock, None)

        widget1_mock.save.assert_called_with()
        self.assertEqual(widget1_mock.variables, {"varname": "varvalue", "varname2": "varvalue2"})
        self.assertEqual(widget2_mock.variables, {"varname": "hello", "varname2": "world"})
        self.assertEqual(widget3_mock.variables, {"varname": "varvalue", "varname2": "varvalue2"})

        self.assertEqual(
            workspace_mock.wiringStatus,
            {
                "operators": {
                    "1": {"preferences": {"varname": {"value": "varvalue"}, "varname2": {"value": "varvalue2"}}},
                    "2": {"preferences": {"varname": {"value": "hello"}, "varname2": {"value": "world"}}}}
            }
        )


def check_secure_preferences(self, workspace, user):
    workspace.wiringStatus = {
        'operators': {
            '1': {
                'id': '1',
                'name': 'Wirecloud/TestOperatorSecure/1.0',
                'preferences': {
                    'pref_secure': {'hidden': True, 'secure': True, 'readonly': False, 'value': {"users": {"2": ''}}}
                },
            },
            '2': {
                'id': '2',
                'name': 'Wirecloud/TestOperatorSecure/1.0',
                'preferences': {
                    'pref_secure': {'hidden': True, 'secure': True, 'readonly': False, 'value': {"users": {"2": encrypt_value("test_password")}}}
                },
            },
        },
        'connections': [],
    }
    data = json.loads(get_global_workspace_data(workspace, user).get_data())
    self.assertEqual(len(data['tabs']), 1)

    tab = data['tabs'][0]
    preferences = tab['iwidgets'][0]['preferences']
    self.assertEqual(preferences['password']['value'], '')
    self.assertEqual(preferences['password']['secure'], True)

    tab = data['tabs'][0]
    preferences = tab['iwidgets'][1]['preferences']
    self.assertEqual(preferences['password']['value'], '********')
    self.assertEqual(preferences['password']['secure'], True)

    self.assertEqual(data["wiring"]["operators"]["1"]["preferences"]["pref_secure"]['secure'], True)
    self.assertEqual(data["wiring"]["operators"]["1"]["preferences"]["pref_secure"]["value"], "")

    self.assertEqual(data["wiring"]["operators"]["2"]["preferences"]["pref_secure"]['secure'], True)
    self.assertEqual(data["wiring"]["operators"]["2"]["preferences"]["pref_secure"]["value"], "********")


class WorkspaceTestCase(WirecloudTestCase, TransactionTestCase):

    fixtures = ('test_data',)
    tags = ('wirecloud-noselenium', 'wirecloud-workspace')
    populate = False
    use_search_indexes = False

    def setUp(self):
        super(WorkspaceTestCase, self).setUp()

        self.user = User.objects.get(username='test')

    def test_get_global_workspace_data(self):

        workspace = Workspace.objects.get(pk=1)
        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())
        self.assertEqual(len(data['tabs']), 1)

        tab = data['tabs'][0]
        preferences = tab['iwidgets'][0]['preferences']
        self.assertEqual(preferences['password']['value'], '********')
        self.assertEqual(preferences['password']['secure'], True)
        self.assertEqual(preferences['username']['value'], 'test_username')
        properties = tab['iwidgets'][0]['properties']
        self.assertEqual(properties['prop']['value'], 'test_data')

    def test_get_global_workspace_data_harvest_operator_properties(self):
        workspace = Workspace.objects.get(id=1)
        workspace.wiringStatus = {
            'operators': {
                '1': {
                    'id': '1',
                    'name': 'Wirecloud/TestOperatorMultiuser/1.0',
                    'preferences': {
                        'pref1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'default'}}}
                    },
                    'properties': {
                        'prop1': {'hidden': True, 'readonly': False, 'value': {"users": {"2": 'a'}}},
                        'prop3': {'hidden': True, 'readonly': False, 'value': {"users": {"2": encrypt_value("test_password")}}},
                    }
                },
            },
            'connections': [],
        }
        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())

        self.assertEqual(data["wiring"]["operators"]["1"]["properties"]["prop1"]["value"], "a")
        self.assertEqual(data["wiring"]["operators"]["1"]["properties"]["prop3"]["value"], "********")

    def test_secure_preferences_censor(self):
        workspace = Workspace.objects.get(pk=202)
        check_secure_preferences(self, workspace, self.user)

    def test_get_public_workspace_as_anonymous(self):
        workspace = Workspace.objects.get(pk=202)
        workspace.public = True
        user = AnonymousUser()
        check_secure_preferences(self, workspace, user)

    def test_get_public_workspace_as_user(self):
        workspace = Workspace.objects.get(pk=202)
        workspace.public = True
        user = User.objects.get(pk=4)
        check_secure_preferences(self, workspace, user)

    def test_create_empty_workspace(self):

        workspace = createEmptyWorkspace('Testing', self.user)

        user_workspace = UserWorkspace.objects.filter(user=self.user, workspace=workspace)
        self.assertEqual(user_workspace.count(), 1)

        workspace_tabs = Tab.objects.filter(workspace=workspace)
        self.assertEqual(workspace_tabs.count(), 1)

        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())
        self.assertEqual(data['owner'], self.user.username)
        self.assertFalse(data['shared'], False)


class WorkspaceCacheTestCase(WirecloudTestCase, TransactionTestCase):

    fixtures = ('test_data',)
    tags = ('wirecloud-workspace', 'wirecloud-noselenium')
    populate = False
    use_search_indexes = False

    def setUp(self):
        super(WorkspaceCacheTestCase, self).setUp()

        self.user = User.objects.get(username='test')
        self.workspace = Workspace.objects.get(pk=1)
        # Fill cache
        self.initial_info = get_global_workspace_data(self.workspace, self.user)

    def test_workspace_data_is_cached(self):
        workspace_info = get_global_workspace_data(self.workspace, self.user)
        self.assertEqual(self.initial_info.timestamp, workspace_info.timestamp)

    def test_updating_preferences_invalidates_cache(self):

        iwidget = self.workspace.tab_set.get(pk=1).iwidget_set.get(pk=1)
        iwidget.set_variable_value('username', 'new_username', self.user)
        iwidget.save()

        workspace_info = get_global_workspace_data(self.workspace, self.user)
        self.assertNotEqual(self.initial_info.timestamp, workspace_info.timestamp)

        data = json.loads(workspace_info.get_data())
        preferences = data['tabs'][0]['iwidgets'][0]['preferences']
        self.assertEqual(preferences['password']['value'], '********')
        self.assertEqual(preferences['password']['secure'], True)
        self.assertEqual(preferences['username']['value'], 'new_username')
        properties = data['tabs'][0]['iwidgets'][0]['properties']
        self.assertEqual(properties['prop']['value'], 'test_data')

    def test_updating_properties_invalidates_cache(self):

        iwidget = self.workspace.tab_set.get(pk=1).iwidget_set.get(pk=1)
        iwidget.set_variable_value('prop', 'new_data', self.user)
        iwidget.save()

        workspace_info = get_global_workspace_data(self.workspace, self.user)
        self.assertNotEqual(self.initial_info.timestamp, workspace_info.timestamp)

        data = json.loads(get_global_workspace_data(self.workspace, self.user).get_data())
        preferences = data['tabs'][0]['iwidgets'][0]['preferences']
        self.assertEqual(preferences['password']['value'], '********')
        self.assertEqual(preferences['password']['secure'], True)
        self.assertEqual(preferences['username']['value'], 'test_username')
        properties = data['tabs'][0]['iwidgets'][0]['properties']
        self.assertEqual(properties['prop']['value'], 'new_data')

    def test_widget_instantiation_invalidates_cache(self):
        tab = self.workspace.tab_set.get(pk=1)
        iwidget_data = {
            'widget': 'Test/Test Widget/1.0.0',
            'title': 'test',
            'top': 0,
            'left': 0,
            'width': 2,
            'height': 2,
            'zIndex': 1,
            'layout': 0,
            'icon_top': 0,
            'icon_left': 0
        }
        SaveIWidget(iwidget_data, self.user, tab, {})

        workspace_info = get_global_workspace_data(self.workspace, self.user)
        self.assertNotEqual(self.initial_info.timestamp, workspace_info.timestamp)

        data = json.loads(get_global_workspace_data(self.workspace, self.user).get_data())
        iwidget_list = data['tabs'][0]['iwidgets']
        self.assertEqual(len(iwidget_list), 3)

    def test_widget_deletion_invalidates_cache(self):

        self.workspace.tab_set.get(pk=1).iwidget_set.get(pk=1).delete()

        workspace_info = get_global_workspace_data(self.workspace, self.user)
        self.assertNotEqual(self.initial_info.timestamp, workspace_info.timestamp)

        data = json.loads(get_global_workspace_data(self.workspace, self.user).get_data())
        iwidget_list = data['tabs'][0]['iwidgets']
        self.assertEqual(len(iwidget_list), 1)


class ParameterizedWorkspaceGenerationTestCase(WirecloudTestCase, TransactionTestCase):

    WIRE = rdflib.Namespace('http://wirecloud.conwet.fi.upm.es/ns/widget#')
    WIRE_M = rdflib.Namespace('http://wirecloud.conwet.fi.upm.es/ns/mashup#')
    FOAF = rdflib.Namespace('http://xmlns.com/foaf/0.1/')
    RDF = rdflib.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
    DCTERMS = rdflib.Namespace('http://purl.org/dc/terms/')
    USDL = rdflib.Namespace('http://www.linked-usdl.org/ns/usdl-core#')
    VCARD = rdflib.Namespace('http://www.w3.org/2006/vcard/ns#')

    fixtures = ('test_data',)
    tags = ('wirecloud-workspace', 'wirecloud-template', 'wirecloud-workspace-write', 'wirecloud-noselenium')
    populate = False
    use_search_indexes = False

    @classmethod
    def setUpClass(cls):

        super(ParameterizedWorkspaceGenerationTestCase, cls).setUpClass()

        cls.forced_value_options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'authors': 'test',
            'email': 'a@b.com',
            'readOnlyWidgets': False,
            'parametrization': {
                'iwidgets': {
                    '1': {
                        'username': {'source': 'custom', 'status': 'readonly', 'value': 'default'},
                        'password': {'source': 'custom', 'status': 'hidden', 'value': 'initial text'},
                    },
                    '2': {
                        'username': {'source': 'default', 'status': 'readonly'},
                        'password': {'source': 'current', 'status': 'hidden'},
                        'list': {'source': 'default', 'status': 'normal'},
                    },
                },
                'ioperators': {
                    '1': {
                        'pref_with_val': {'source': 'custom', 'status': 'normal', 'value': 'new_value1'},
                        'readonly_pref': {'source': 'custom', 'status': 'readonly', 'value': 'new_value2'},
                        'hidden_pref': {'source': 'custom', 'status': 'hidden', 'value': 'new_value3'},
                        'empty_pref': {'source': 'custom', 'status': 'normal', 'value': ''},
                    },
                    '2': {
                        'pref_with_val': {'source': 'default', 'status': 'normal'},
                        'readonly_pref': {'source': 'current', 'status': 'readonly'},
                        'hidden_pref': {'source': 'default', 'status': 'hidden'},
                    },
                }
            },
        }

    def setUp(self):

        super(ParameterizedWorkspaceGenerationTestCase, self).setUp()

        self.user = User.objects.get(username='test')
        self.workspace_with_iwidgets = Workspace.objects.get(pk=1)
        self.workspace = createEmptyWorkspace('Testing', self.user)

        # password variables must be encrypted
        iwidget = IWidget.objects.get(pk=1)
        iwidget.set_variable_value('password', 'test_password', self.user)
        iwidget.save()
        iwidget = IWidget.objects.get(pk=2)
        iwidget.set_variable_value('password', 'test_password', self.user)
        iwidget.save()

    def assertXPathText(self, root_element, xpath, content):
        elements = root_element.xpath(xpath)
        self.assertEqual(len(elements), 1)
        self.assertEqual(elements[0].text, content)

    def assertXPathMissingAttr(self, root_element, xpath, attr):
        elements = root_element.xpath(xpath)
        self.assertEqual(len(elements), 1)

        self.assertNotIn(attr, elements[0], "Attribute %(attr)s is present in %(xpath)s" % {"attr": attr, "xpath": xpath})

    def assertXPathAttr(self, root_element, xpath, attr, content, optional=False):
        elements = root_element.xpath(xpath)
        self.assertEqual(len(elements), 1)

        if optional and elements[0].get(attr) is None:
            return

        self.assertEqual(elements[0].get(attr), content)

    def assertXPathCount(self, root_element, xpath, count):
        elements = root_element.xpath(xpath)
        self.assertEqual(len(elements), count)

    def check_basic_xml_workspace_template_info(self, template):

        self.assertXPathAttr(template, '/mashup', 'vendor', 'Wirecloud Test Suite')
        self.assertXPathAttr(template, '/mashup', 'name', 'Test Mashup')
        self.assertXPathAttr(template, '/mashup', 'version', '1')
        self.assertXPathText(template, '/mashup/details/authors', 'test')
        self.assertXPathText(template, '/mashup/details/email', 'a@b.com')

    def check_workspace_xml_wiring(self, template):

        self.assertXPathCount(template, '/mashup/structure/wiring/connection', 0)
        self.assertXPathCount(template, '/mashup/structure/wiring/operator', 2)

        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]', 'vendor', 'Wirecloud')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]', 'name', 'TestOperator')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]', 'version', '1.0')
        self.assertXPathCount(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue', 4)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="pref_with_val"]', 'value', 'value1')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="pref_with_val"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="pref_with_val"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="readonly_pref"]', 'value', 'value2')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="readonly_pref"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="readonly_pref"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="hidden_pref"]', 'value', 'value3')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="hidden_pref"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="hidden_pref"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="empty_pref"]', 'value', 'value4')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="empty_pref"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="empty_pref"]', 'hidden', 'false', optional=True)

        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]', 'vendor', 'Wirecloud')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]', 'name', 'TestOperator')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]', 'version', '1.0')
        self.assertXPathCount(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue', 4)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="pref_with_val"]', 'value', 'value1')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="pref_with_val"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="pref_with_val"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="readonly_pref"]', 'value', 'value2')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="readonly_pref"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="readonly_pref"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="hidden_pref"]', 'value', 'value3')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="hidden_pref"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="hidden_pref"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="empty_pref"]', 'value', '')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="empty_pref"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="empty_pref"]', 'hidden', 'false', optional=True)

    def get_rdf_element(self, graph, base, ns, predicate):
        element = None

        for e in graph.objects(base, ns[predicate]):

            if element is not None:
                raise Exception()

            element = e

        return element

    def assertRDFElement(self, graph, element, ns, predicate, content, optional=False, caseinsensitive=False):
        element = self.get_rdf_element(graph, element, ns, predicate)
        if optional and element is None:
            return
        element_content = str(element).lower() if caseinsensitive else str(element)
        self.assertEqual(element_content, content)

    def assertRDFCount(self, graph, element, ns, predicate, count):
        num = 0
        for e in graph.objects(element, ns[predicate]):
            num = num + 1

        self.assertEqual(num, count)

    def check_basic_rdf_workspace_template_info(self, graph, mashup_uri):

        self.assertRDFElement(graph, mashup_uri, self.DCTERMS, 'title', 'Test Mashup')
        self.assertRDFElement(graph, mashup_uri, self.USDL, 'versionInfo', '1')

        vendor = next(graph.objects(mashup_uri, self.USDL['hasProvider']))
        self.assertRDFElement(graph, vendor, self.FOAF, 'name', 'Wirecloud Test Suite')

        addr = next(graph.objects(mashup_uri, self.VCARD['addr']))
        self.assertRDFElement(graph, addr, self.VCARD, 'email', 'a@b.com')

        authors = next(graph.objects(mashup_uri, self.DCTERMS['creator']))
        self.assertRDFElement(graph, authors, self.FOAF, 'name', 'test')

    def check_workspace_rdf_wiring(self, graph, mashup_uri):
        wiring = next(graph.objects(mashup_uri, self.WIRE_M['hasMashupWiring']))
        self.assertRDFCount(graph, wiring, self.WIRE_M, 'hasConnection', 0)
        self.assertRDFCount(graph, wiring, self.WIRE_M, 'hasiOperator', 2)
        for ioperator in graph.objects(wiring, self.WIRE_M['hasiOperator']):
            self.assertRDFCount(graph, ioperator, self.WIRE_M, 'hasiOperatorPreference', 4)
            pref_with_val_found = readonly_pref_found = hidden_pref_found = empty_pref_found = False
            for preference in graph.objects(ioperator, self.WIRE_M['hasiOperatorPreference']):
                self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'false', optional=True)
                self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'false', optional=True)
                name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                if str(name) == 'pref_with_val':
                    pref_with_val_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'value1')
                elif str(name) == 'readonly_pref':
                    readonly_pref_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'value2')
                elif str(name) == 'hidden_pref':
                    hidden_pref_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'value3')
                elif str(name) == 'empty_pref':
                    empty_pref_found = True
                    content = str(self.get_rdf_element(graph, preference, self.WIRE, 'value'))
                    self.assertIn(content, ('', 'value4'))
                else:
                    self.fail()

            self.assertTrue(pref_with_val_found and readonly_pref_found and hidden_pref_found and empty_pref_found)

    def test_build_xml_template_from_empty_workspace(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'authors': 'test',
            'email': 'a@b.com',
        }
        template = build_xml_template_from_workspace(options, self.workspace, self.user, raw=True)

        self.check_basic_xml_workspace_template_info(template)
        self.assertXPathCount(template, '/mashup/structure/wiring/connection', 0)
        self.assertXPathCount(template, '/mashup/structure/wiring/operator', 0)

        # IWidgets
        self.assertXPathCount(template, '/mashup/structure/tab', 1)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]', 'name', 'tab')
        self.assertXPathAttr(template, '/mashup/structure/tab[1]', 'title', 'Tab')
        self.assertXPathCount(template, '/mashup/structure/tab[1]/resource', 0)

    def test_build_xml_template_from_basic_workspace(self):

        # Workspace with iwidgets
        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'authors': 'test',
            'email': 'a@b.com',
            'doc': 'http://example.com/test-mashup/docs/index.html',
            'readOnlyWidgets': False,
        }
        template = build_xml_template_from_workspace(options, self.workspace_with_iwidgets, self.user, raw=True)

        self.check_basic_xml_workspace_template_info(template)

        # IWidgets
        self.assertXPathCount(template, '/mashup/structure/tab', 1)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]', 'name', 'tab')
        self.assertXPathCount(template, '/mashup/structure/tab[1]/resource', 2)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[1]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[1]/rendering', 'minimized', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[1]/rendering', 'fulldragboard', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[2]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[2]/rendering', 'minimized', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[2]/rendering', 'fulldragboard', 'false', optional=True)

        self.check_workspace_xml_wiring(template)

    def test_build_xml_template_from_workspace_minimized_and_fulldragboard(self):

        # Workspace with iwidgets
        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'authors': 'test',
            'email': 'a@b.com',
            'doc': 'http://example.com/test-mashup/docs/index.html',
            'readOnlyWidgets': False,
        }

        # Minimize the first iwidget
        iwidget = IWidget.objects.get(pk=1)
        iwidget.positions['widget']['minimized'] = True
        iwidget.save()

        # Set the fulldragboard flag on the second iwidget
        iwidget = IWidget.objects.get(pk=2)
        iwidget.positions['widget']['fulldragboard'] = True
        iwidget.save()

        template = build_xml_template_from_workspace(options, self.workspace_with_iwidgets, self.user, raw=True)

        self.check_basic_xml_workspace_template_info(template)

        # IWidgets
        self.assertXPathCount(template, '/mashup/structure/tab', 1)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]', 'name', 'tab')
        self.assertXPathCount(template, '/mashup/structure/tab[1]/resource', 2)

        # Hash widgets by id so we don't depend on the order (serialization
        # order depends on the database backend)
        widgets = {widget.get('id'): widget for widget in template.xpath('/mashup/structure/tab[1]/resource')}
        self.assertXPathAttr(widgets["1"], '.', 'readonly', 'false', optional=True)
        self.assertXPathAttr(widgets["1"], 'rendering', 'minimized', 'true')
        self.assertXPathAttr(widgets["1"], 'rendering', 'fulldragboard', 'false', optional=True)
        self.assertXPathAttr(widgets["2"], '.', 'readonly', 'false', optional=True)
        self.assertXPathAttr(widgets["2"], 'rendering', 'minimized', 'false', optional=True)
        self.assertXPathAttr(widgets["2"], 'rendering', 'fulldragboard', 'true')

        self.check_workspace_xml_wiring(template)

    def test_build_xml_template_from_workspace_read_only_widgets(self):

        # Workspace with iwidgets
        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'authors': 'test',
            'email': 'a@b.com',
            'doc': 'http://example.com/test-mashup/docs/index.html',
            'readOnlyWidgets': True,
        }
        template = build_xml_template_from_workspace(options, self.workspace_with_iwidgets, self.user, raw=True)

        self.check_basic_xml_workspace_template_info(template)

        # IWidgets
        self.assertXPathCount(template, '/mashup/structure/tab', 1)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]', 'name', 'tab')
        self.assertXPathCount(template, '/mashup/structure/tab[1]/resource', 2)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[1]', 'readonly', 'true')
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[1]/rendering', 'minimized', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[1]/rendering', 'fulldragboard', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[2]', 'readonly', 'true')
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[2]/rendering', 'minimized', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[2]/rendering', 'fulldragboard', 'false', optional=True)

        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="username"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="username"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="username"]', 'value', 'test_username')
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="password"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="password"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="password"]', 'value', 'test_password')

        self.check_workspace_xml_wiring(template)

    def test_build_xml_template_from_workspace_forced_values(self):

        # Workspace with iwidgets
        template = build_xml_template_from_workspace(self.forced_value_options, self.workspace_with_iwidgets, self.user, raw=True)
        self.check_basic_xml_workspace_template_info(template)

        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="1"]/preferencevalue[@name="username"]', 'readonly', 'true')
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="1"]/preferencevalue[@name="username"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="1"]/preferencevalue[@name="username"]', 'value', 'default')
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="1"]/preferencevalue[@name="password"]', 'readonly', 'true')
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="1"]/preferencevalue[@name="password"]', 'hidden', 'true')
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="1"]/preferencevalue[@name="password"]', 'value', 'initial text')
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="1"]/preferencevalue[@name="list"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="1"]/preferencevalue[@name="list"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="1"]/preferencevalue[@name="list"]', 'value', 'default')
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="1"]/preferencevalue[@name="boolean"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="1"]/preferencevalue[@name="boolean"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="1"]/preferencevalue[@name="boolean"]', 'value', 'false')

        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="username"]', 'readonly', 'true')
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="username"]', 'hidden', 'false', optional=True)
        self.assertXPathMissingAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="username"]', 'value')
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="password"]', 'readonly', 'true', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="password"]', 'hidden', 'true', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="password"]', 'value', 'test_password')
        self.assertXPathCount(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="list"]', 0)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="boolean"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="boolean"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/tab[1]/resource[@id="2"]/preferencevalue[@name="boolean"]', 'value', 'false')

        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="pref_with_val"]', 'value', 'new_value1')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="pref_with_val"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="pref_with_val"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="readonly_pref"]', 'value', 'new_value2')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="readonly_pref"]', 'readonly', 'true')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="readonly_pref"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="hidden_pref"]', 'value', 'new_value3')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="hidden_pref"]', 'readonly', 'true')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="hidden_pref"]', 'hidden', 'true')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="empty_pref"]', 'value', '')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="empty_pref"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="1"]/preferencevalue[@name="empty_pref"]', 'hidden', 'false', optional=True)

        self.assertXPathCount(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="pref_with_val"]', 0)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="readonly_pref"]', 'value', 'value2')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="readonly_pref"]', 'readonly', 'true')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="readonly_pref"]', 'hidden', 'false', optional=True)
        self.assertXPathMissingAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="hidden_pref"]', 'value')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="hidden_pref"]', 'readonly', 'true')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="hidden_pref"]', 'hidden', 'true')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="empty_pref"]', 'value', '')
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="empty_pref"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/mashup/structure/wiring/operator[@id="2"]/preferencevalue[@name="empty_pref"]', 'hidden', 'false', optional=True)

    def test_build_rdf_template_from_workspace(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'authors': 'test',
            'email': 'a@b.com',
        }
        # Basic info
        graph = build_rdf_template_from_workspace(options, self.workspace, self.user)
        mashup_uri = next(graph.subjects(self.RDF['type'], self.WIRE_M['Mashup']))
        self.check_basic_rdf_workspace_template_info(graph, mashup_uri)

        self.assertRDFCount(graph, mashup_uri, self.WIRE_M, 'hasTab', 1)

        tab = next(graph.objects(mashup_uri, self.WIRE_M['hasTab']))
        self.assertRDFElement(graph, tab, self.DCTERMS, 'title', 'tab')
        self.assertRDFElement(graph, tab, self.WIRE, 'displayName', 'Tab')

        wiring = next(graph.objects(mashup_uri, self.WIRE_M['hasMashupWiring']))
        self.assertRDFCount(graph, wiring, self.WIRE_M, 'hasConnection', 0)
        self.assertRDFCount(graph, wiring, self.WIRE_M, 'hasiOperator', 0)
        self.assertRDFCount(graph, wiring, self.WIRE_M, 'hasWiringView', 0)

        # Workspace with iwidgets
        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'authors': 'test',
            'email': 'a@b.com',
            'readOnlyWidgets': False,
        }
        graph = build_rdf_template_from_workspace(options, self.workspace_with_iwidgets, self.user)
        mashup_uri = next(graph.subjects(self.RDF['type'], self.WIRE_M['Mashup']))
        self.check_basic_rdf_workspace_template_info(graph, mashup_uri)

        self.assertRDFCount(graph, mashup_uri, self.WIRE_M, 'hasTab', 1)

        tab = next(graph.objects(mashup_uri, self.WIRE_M['hasTab']))
        self.assertRDFElement(graph, tab, self.DCTERMS, 'title', 'tab')
        self.assertRDFCount(graph, tab, self.WIRE_M, 'hasiWidget', 2)
        for iwidget in graph.objects(tab, self.WIRE_M['hasiWidget']):
            self.assertRDFElement(graph, iwidget, self.WIRE_M, 'readonly', 'false', optional=True)
            self.assertRDFCount(graph, iwidget, self.WIRE_M, 'hasiWidgetPreference', 4)
            username_found = password_found = False
            for preference in graph.objects(iwidget, self.WIRE_M['hasiWidgetPreference']):
                self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'false', optional=True)
                self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'false', optional=True)
                name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                if str(name) == 'username':
                    username_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'test_username')
                elif str(name) == 'password':
                    password_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'test_password')
                elif str(name) in ('boolean', 'list'):
                    # Ignore boolean and list preferences
                    pass
                else:
                    self.fail()

            self.assertTrue(username_found and password_found)

        self.check_workspace_rdf_wiring(graph, mashup_uri)

    def test_build_rdf_template_from_workspace_read_only_widgets(self):

        # Workspace with iwidgets
        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'authors': 'test',
            'email': 'a@b.com',
            'readOnlyWidgets': True,
        }
        graph = build_rdf_template_from_workspace(options, self.workspace_with_iwidgets, self.user)
        mashup_uri = next(graph.subjects(self.RDF['type'], self.WIRE_M['Mashup']))
        self.check_basic_rdf_workspace_template_info(graph, mashup_uri)

        self.assertRDFCount(graph, mashup_uri, self.WIRE_M, 'hasTab', 1)

        tab = next(graph.objects(mashup_uri, self.WIRE_M['hasTab']))
        self.assertRDFElement(graph, tab, self.DCTERMS, 'title', 'tab')
        self.assertRDFCount(graph, tab, self.WIRE_M, 'hasiWidget', 2)
        for iwidget in graph.objects(tab, self.WIRE_M['hasiWidget']):
            self.assertRDFElement(graph, iwidget, self.WIRE_M, 'readonly', 'true')
            self.assertRDFCount(graph, iwidget, self.WIRE_M, 'hasiWidgetPreference', 4)
            username_found = password_found = False
            for rendering in graph.objects(iwidget, self.WIRE_M['hasiWidgetRendering']):
                self.assertRDFElement(graph, rendering, self.WIRE_M, 'minimized', 'false', optional=True, caseinsensitive=True)
                self.assertRDFElement(graph, rendering, self.WIRE_M, 'fulldragboard', 'false', optional=True, caseinsensitive=True)

            for preference in graph.objects(iwidget, self.WIRE_M['hasiWidgetPreference']):
                self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'false', optional=True)
                self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'false', optional=True)
                name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                if str(name) == 'username':
                    username_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'test_username')
                elif str(name) == 'password':
                    password_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'test_password')
                elif str(name) in ('boolean', 'list'):
                    # Ignore boolean and list preferences
                    pass
                else:
                    self.fail()

            self.assertTrue(username_found and password_found)

    def test_build_rdf_template_from_workspace_forced_values(self):

        # Workspace with iwidgets
        graph = build_rdf_template_from_workspace(self.forced_value_options, self.workspace_with_iwidgets, self.user)
        mashup_uri = next(graph.subjects(self.RDF['type'], self.WIRE_M['Mashup']))
        self.check_basic_rdf_workspace_template_info(graph, mashup_uri)

        tab = next(graph.objects(mashup_uri, self.WIRE_M['hasTab']))
        self.assertRDFCount(graph, tab, self.WIRE_M, 'hasiWidget', 2)
        for iwidget in graph.objects(tab, self.WIRE_M['hasiWidget']):

            name = str(self.get_rdf_element(graph, iwidget, self.DCTERMS, 'title'))

            preferences = graph.objects(iwidget, self.WIRE_M['hasiWidgetPreference'])

            username_count = password_count = list_count = boolean_count = 0

            if name == 'Test Widget':

                for preference in preferences:
                    name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                    if str(name) == 'username':
                        username_count += 1
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'true')
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'false', optional=True)
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', 'default')
                    elif str(name) == 'password':
                        password_count += 1
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'true')
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'true')
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', 'initial text')
                    elif str(name) == 'list':
                        list_count += 1
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'false', optional=True)
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'false', optional=True)
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', 'default')
                    elif str(name) == 'boolean':
                        boolean_count += 1
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'false', optional=True)
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'false', optional=True)
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', 'false')
                    else:
                        self.fail()

                self.assertTrue(username_count == 1 and password_count == 1 and boolean_count == 1 and list_count == 1)

            elif name == 'Test Widget 2':

                for preference in preferences:
                    name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                    if str(name) == 'username':
                        username_count += 1
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'true')
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'false', optional=True)
                        self.assertRDFCount(graph, preference, self.WIRE, 'value', 0)
                    elif str(name) == 'password':
                        password_count += 1
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'true')
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'true')
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', 'test_password')
                    elif str(name) == 'boolean':
                        boolean_count += 1
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'false', optional=True)
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'false', optional=True)
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', 'false')
                    else:
                        self.fail()

                self.assertTrue(username_count == 1 and password_count == 1 and boolean_count == 1 and list_count == 0)

    def test_build_rdf_template_from_workspace_utf8_char(self):
        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup with ñ',
            'version': '1',
            'authors': 'author with é',
            'email': 'a@b.com',
            'readOnlyWidgets': True,
        }

        graph = build_rdf_template_from_workspace(options, self.workspace, self.user)
        mashup_uri = next(graph.subjects(self.RDF['type'], self.WIRE_M['Mashup']))

        self.assertRDFElement(graph, mashup_uri, self.DCTERMS, 'title', 'Test Mashup with ñ')
        self.assertRDFElement(graph, mashup_uri, self.USDL, 'versionInfo', '1')

        vendor = next(graph.objects(mashup_uri, self.USDL['hasProvider']))
        self.assertRDFElement(graph, vendor, self.FOAF, 'name', 'Wirecloud Test Suite')

        addr = next(graph.objects(mashup_uri, self.VCARD['addr']))
        self.assertRDFElement(graph, addr, self.VCARD, 'email', 'a@b.com')

        authors = next(graph.objects(mashup_uri, self.DCTERMS['creator']))
        self.assertRDFElement(graph, authors, self.FOAF, 'name', 'author with é')

    def test_build_template_from_workspace_invalid_widget_pref_source(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'parametrization': {
                'iwidgets': {
                    '1': {
                        'username': {'source': 'invalid'},
                    },
                },
            },
        }
        self.assertRaises(Exception, build_json_template_from_workspace, options, self.workspace_with_iwidgets, self.user)

    def test_build_template_from_workspace_invalid_widget_prop_source(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'parametrization': {
                'iwidgets': {
                    '1': {
                        'prop': {'source': 'invalid'},
                    },
                },
            },
        }
        self.assertRaises(Exception, build_json_template_from_workspace, options, self.workspace_with_iwidgets, self.user)

    def test_build_template_from_workspace_invalid_operator_pref_source(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'parametrization': {
                'ioperators': {
                    '1': {
                        'pref_with_val': {'source': 'invalid'},
                    },
                },
            },
        }
        self.assertRaises(Exception, build_json_template_from_workspace, options, self.workspace_with_iwidgets, self.user)

    def test_build_template_from_workspace_contributors(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'contributors': [{'url': 'http://example.com', 'name': 'user1', 'email': 'a@b.com'}, {'name': 'user2'}]
        }
        template = build_json_template_from_workspace(options, self.workspace_with_iwidgets, self.user)
        self.assertEqual(template['contributors'], [{'url': 'http://example.com', 'name': 'user1', 'email': 'a@b.com'}, {'name': 'user2'}])

    def test_build_template_from_workspace_contributors_string(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'contributors': 'user1 <a@b.com> (http://example.com), user2'
        }
        template = build_json_template_from_workspace(options, self.workspace_with_iwidgets, self.user)
        self.assertEqual(template['contributors'], [{'url': 'http://example.com', 'name': 'user1', 'email': 'a@b.com'}, {'name': 'user2'}])

    def test_build_template_from_workspace_empty_wiring_status(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1'
        }
        self.workspace_with_iwidgets.wiringStatus = {}
        template = build_json_template_from_workspace(options, self.workspace_with_iwidgets, self.user)
        self.assertEqual(template['wiring']['version'], '2.0')

    def test_build_template_from_workspace_with_preferences(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1'
        }
        self.workspace_with_iwidgets.workspacepreference_set.create(inherit=True, name='ignoreme', value='ignoreme')
        self.workspace_with_iwidgets.workspacepreference_set.create(inherit=False, name='pref1', value='value1')
        tab = self.workspace_with_iwidgets.tab_set.all()[0]
        tab.tabpreference_set.create(inherit=True, name='ignoreme', value='ignoreme')
        tab.tabpreference_set.create(inherit=False, name='pref2', value='value2')
        template = build_json_template_from_workspace(options, self.workspace_with_iwidgets, self.user)
        self.assertEqual(template['preferences'], {'pref1': 'value1'})
        self.assertEqual(template['tabs'][0]['preferences'], {'pref2': 'value2'})

    def test_build_template_from_workspace_stateproperties_parametrization(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'parametrization': {
                'iwidgets': {
                    '1': {
                        'prop': {'source': 'custom', 'status': 'readonly', 'value': 'new_value'},
                        'prop2': {'source': 'default', 'status': 'normal'}
                    },
                    '2': {
                        'prop': {'source': 'current', 'status': 'normal'},
                        'prop2': {'source': 'default', 'status': 'readonly'}
                    }
                }
            }
        }
        template = build_json_template_from_workspace(options, self.workspace_with_iwidgets, self.user)
        # Hash widgets by id se we don't depend on the order (serialization
        # order depends on the database backend)
        widgets = {widget['id']: widget for widget in template['tabs'][0]['resources']}
        self.assertEqual(widgets["1"]['properties'], {'prop': {'readonly': True, 'value': 'new_value'}})
        self.assertEqual(widgets["2"]['properties'], {'prop': {'readonly': False, 'value': 'test_data'}, 'prop2': {'readonly': True, 'value': None}})

    def test_build_template_from_public_workspace_owned(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1'
        }

        # Make workspace_with_iwidgets public
        self.workspace_with_iwidgets.public = True
        self.workspace_with_iwidgets.save()

        template = build_json_template_from_workspace(options, self.workspace_with_iwidgets, self.user)
        self.assertNotIn("public", template.get("preferences", {}))

    def test_build_template_from_public_workspace(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1'
        }

        # Make workspace_with_iwidgets public
        self.workspace_with_iwidgets.public = True
        self.workspace_with_iwidgets.save()

        other_user = User.objects.get(username='test2')

        # TODO check passwords are not serialized
        template = build_json_template_from_workspace(options, self.workspace_with_iwidgets, other_user)
        self.assertNotIn("public", template.get("preferences", {}))


class ParameterizedWorkspaceParseTestCase(WirecloudTestCase, TransactionTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-workspace', 'wirecloud-template', 'wirecloud-workspace-parse', 'wirecloud-noselenium')

    base_resources = ('Wirecloud_TestOperator_1.0.zip', 'Wirecloud_Test_1.0.wgt')
    populate = False
    use_search_indexes = False

    def setUp(self):

        super(ParameterizedWorkspaceParseTestCase, self).setUp()

        self.user = User.objects.get(username='normuser')
        self.workspace = createEmptyWorkspace('Testing', self.user)
        self.workspace_with_iwidgets = Workspace.objects.get(pk=2)

    def read_template(self, filename):
        f = codecs.open(os.path.join(os.path.dirname(__file__), 'test-data', filename), 'rb')
        contents = f.read()
        f.close()

        return contents

    def check_basic_workspace_structure(self, workspace):

        self.assertFalse(workspace.public)
        self.assertFalse(workspace.workspacepreference_set.filter(name="public").exists())

        self.assertEqual(len(workspace.wiringStatus['connections']), 1)
        self.assertEqual(workspace.wiringStatus['connections'][0]['readonly'], False)

        workspace_data = json.loads(get_global_workspace_data(workspace, self.user).get_data())
        self.assertEqual(workspace.name, 'test-mashup')
        self.assertEqual(workspace.title, 'Test Mashup')
        self.assertEqual(len(workspace_data['tabs']), 1)

        if workspace_data['tabs'][0]['iwidgets'][0]['title'] == 'Test (1)':

            iwidget1 = workspace_data['tabs'][0]['iwidgets'][0]
            iwidget2 = workspace_data['tabs'][0]['iwidgets'][1]

        else:

            iwidget1 = workspace_data['tabs'][0]['iwidgets'][1]
            iwidget2 = workspace_data['tabs'][0]['iwidgets'][0]

        # Check iwidget 1 data
        self.assertEqual(iwidget1.get('readonly', False), False)

        iwidget1_preferences = iwidget1['preferences']

        self.assertEqual(iwidget1_preferences['list']['value'], 'default')
        self.assertEqual(iwidget1_preferences['list']['hidden'], True)
        self.assertEqual(iwidget1_preferences['list']['readonly'], True)

        self.assertEqual(iwidget1_preferences['text']['value'], 'initial text')
        self.assertEqual(iwidget1_preferences['text']['hidden'], False)
        self.assertEqual(iwidget1_preferences['text']['readonly'], True)

        # Check iwidget 2 data
        self.assertEqual(iwidget1.get('readonly', False), False)

        iwidget2_preferences = iwidget2['preferences']

        self.assertEqual(iwidget2_preferences['list']['value'], 'value1')
        self.assertEqual(iwidget2_preferences['list'].get('hidden', False), False)
        self.assertEqual(iwidget2_preferences['list'].get('readonly', False), False)

        self.assertEqual(iwidget2_preferences['text']['value'], 'value2')
        self.assertEqual(iwidget2_preferences['text'].get('hidden', False), False)
        self.assertEqual(iwidget2_preferences['text'].get('readonly', False), False)

    def check_workspace_structure_with_old_mashup_wiring(self, workspace):

        iwidgets = set(map(str, workspace.tab_set.all()[0].iwidget_set.values_list('pk', flat=True)))
        self.assertEqual(workspace.wiringStatus['version'], '2.0')

        self.assertEqual(len(workspace.wiringStatus['connections']), 2)
        self.assertEqual(workspace.wiringStatus['connections'][0]['readonly'], False)
        self.assertEqual(workspace.wiringStatus['connections'][1]['readonly'], False)

        self.assertEqual(set(workspace.wiringStatus['visualdescription']['components']['operator']), {'1'})
        self.assertEqual(set(workspace.wiringStatus['visualdescription']['components']['widget']), iwidgets)

    def check_workspace_with_params(self, workspace):

        workspace_data = json.loads(get_global_workspace_data(workspace, self.user).get_data())
        self.assertEqual(workspace_data['extra_prefs'], [
            {
                'name': 'param',
                'type': 'text',
                'inheritable': False,
                'label': 'Parameter',
                'description': 'Parameter description',
                'required': True,
            },
            {
                'name': 'optional_param',
                'type': 'number',
                'inheritable': False,
                'label': 'Optional Parameter',
                'description': 'Parameter description',
                'required': False,
            },
        ])

        update_workspace_preferences(workspace, {'param': {'value': 'world'}, 'optional_param': {'value': ''}})
        workspace_data = json.loads(get_global_workspace_data(workspace, self.user).get_data())

        iwidget1 = None
        iwidget2 = None
        iwidget3 = None
        for iwidget in workspace_data['tabs'][0]['iwidgets']:

            if iwidget['title'] == 'Test (1)':
                iwidget1 = iwidget
            elif iwidget['title'] == 'Test (2)':
                iwidget2 = iwidget
            else:
                iwidget3 = iwidget

        # Check iwidget 1 data
        iwidget1_preferences = iwidget1['preferences']

        self.assertEqual(iwidget1_preferences['text']['value'], 'initial world')
        self.assertEqual(iwidget1_preferences['text'].get('hidden', False), False)
        self.assertEqual(iwidget1_preferences['text']['readonly'], True)
        self.assertEqual(iwidget1['properties'], {})

        # Check iwidget 2 data
        iwidget2_preferences = iwidget2['preferences']

        self.assertEqual(iwidget2_preferences['text']['value'], 'initial world')
        self.assertEqual(iwidget2_preferences['text']['hidden'], True)
        self.assertEqual(iwidget2_preferences['text']['readonly'], True)
        self.assertEqual(iwidget2['properties'], {})

        # Check iwidget 3 data
        iwidget3_preferences = iwidget3['preferences']

        self.assertEqual(iwidget3_preferences['text']['value'], 'initial %(params.param)')
        self.assertEqual(iwidget3_preferences['text'].get('hidden', False), False)
        self.assertEqual(iwidget3_preferences['text'].get('readonly', False), False)

        # Check operator data
        operator_preferences = workspace_data['wiring']['operators']['1']['preferences']

        # Check pref1
        self.assertEqual(operator_preferences['pref1']['value'], 'initial world')
        self.assertEqual(operator_preferences['pref1'].get('hidden', False), False)
        self.assertEqual(operator_preferences['pref1']['readonly'], True)

        # Check pref2
        self.assertEqual(operator_preferences['pref2']['value'], 'initial world')
        self.assertEqual(operator_preferences['pref2']['hidden'], True)
        self.assertEqual(operator_preferences['pref2']['readonly'], True)

        # Check pref3
        self.assertEqual(operator_preferences['pref3']['value'], 'initial %(params.param)')
        self.assertEqual(operator_preferences['pref3'].get('hidden', False), False)
        self.assertEqual(operator_preferences['pref3'].get('readonly', False), False)

        return workspace_data

    def test_fill_workspace_using_template(self):
        template = self.read_template('wt1.xml')
        fillWorkspaceUsingTemplate(self.workspace, template)
        data = json.loads(get_global_workspace_data(self.workspace, self.user).get_data())
        self.assertEqual(self.workspace.name, 'testing')
        self.assertEqual(self.workspace.title, 'Testing')
        self.assertEqual(len(data['tabs']), 2)

        template = self.read_template('wt2.xml')
        # Workspace template 2 adds a new Tab
        fillWorkspaceUsingTemplate(self.workspace, template)
        data = json.loads(get_global_workspace_data(self.workspace, self.user).get_data())
        self.assertEqual(len(data['tabs']), 3)

        # Check that we handle the case where there are 2 tabs with the same name
        fillWorkspaceUsingTemplate(self.workspace, template)
        data = json.loads(get_global_workspace_data(self.workspace, self.user).get_data())
        self.assertEqual(len(data['tabs']), 4)
        self.assertNotEqual(data['tabs'][2]['name'], data['tabs'][3]['name'])

    def test_fill_workspace_using_behaviours_template_with_missing_references(self):

        def check_description(description):
            self.assertEqual(len(description['connections']), 1)
            self.assertFalse(description['connections'][0]['sourcename'].endswith('missing_outputendpoint'))
            self.assertEqual(len(description['components']['widget']), 1)
            widget_id = list(description['components']['widget'])[0]
            self.assertFalse('missing_outputendpoint' in description['components']['widget'][widget_id]['endpoints']['source'])

        template = self.read_template('wt_missing_references_in_behaviours.xml')
        fillWorkspaceUsingTemplate(self.workspace, template)

        wiring = json.loads(get_global_workspace_data(self.workspace, self.user).get_data())['wiring']
        self.assertEqual(len(wiring['connections']), 1)
        self.assertNotEqual(wiring['connections'][0]['source']['endpoint'], 'missing_outputendpoint')

        check_description(wiring['visualdescription'])
        check_description(wiring['visualdescription']['behaviours'][0])

    def test_build_workspace_from_template(self):
        template = self.read_template('wt1.xml')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)

        self.check_basic_workspace_structure(workspace)

    def test_build_workspace_from_rdf_template(self):
        template = self.read_template('wt1.rdf')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)

        self.check_basic_workspace_structure(workspace)

    def test_build_workspace_from_template_with_public_and_sharelist_preferences(self):
        # WireCloud should ignore public and sharelist preferences provided by mashups
        # Old versions of WireCloud serialized those preferences, so we need to support
        # mashups with those preferences, but ignoring them
        template = self.read_template('wt-with-public-and-sharelist-preferences.xml')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)

        self.check_basic_workspace_structure(workspace)

    def test_build_workspace_from_rdf_template_utf8_char(self):
        template = self.read_template('wt4.rdf')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)
        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())

        for t in data['tabs']:
            self.assertEqual(t['name'][0:7], 'pestaña')
            self.assertEqual(t['title'][0:7], 'Pestaña')

    def test_build_workspace_from_rdf_old_mashup_with_views(self):
        template = self.read_template('wt7.rdf')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)

        self.check_workspace_structure_with_old_mashup_wiring(workspace)

    def test_read_only_widgets_rdf(self):
        template = self.read_template('wt6.rdf')

        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)
        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())

        self.assertEqual(len(data['tabs'][0]['iwidgets']), 3)
        self.assertEqual(data['tabs'][0]['iwidgets'][0]['readonly'], True)

    def test_read_only_widgets(self):
        template = self.read_template('wt6.xml')

        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)
        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())

        self.assertEqual(len(data['tabs'][0]['iwidgets']), 3)
        self.assertEqual(data['tabs'][0]['iwidgets'][0]['readonly'], True)

    def test_blocked_connections(self):
        template = self.read_template('wt2.xml')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)

        self.assertEqual(len(workspace.wiringStatus['connections']), 1)
        self.assertEqual(workspace.wiringStatus['connections'][0]['readonly'], True)

    def test_blocked_connections_rdf(self):
        template = self.read_template('wt2.rdf')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)

        self.assertEqual(len(workspace.wiringStatus['connections']), 1)
        self.assertEqual(workspace.wiringStatus['connections'][0]['readonly'], True)

    def check_complex_workspace_data(self, data):

        self.assertEqual(len(data['tabs']), 4)
        self.assertEqual(data['tabs'][0]['name'], 'tab')
        self.assertEqual(data['tabs'][0]['title'], 'Tab')
        self.assertEqual(len(data['tabs'][0]['iwidgets']), 1)
        self.assertEqual(data['tabs'][1]['name'], 'tab-2')
        self.assertEqual(data['tabs'][1]['title'], 'Tab 2')
        self.assertEqual(len(data['tabs'][1]['iwidgets']), 1)
        self.assertEqual(data['tabs'][2]['name'], 'tab-3')
        self.assertEqual(data['tabs'][2]['title'], 'Tab 3')
        self.assertEqual(len(data['tabs'][2]['iwidgets']), 0)
        self.assertEqual(data['tabs'][3]['name'], 'tab-4')
        self.assertEqual(data['tabs'][3]['title'], 'Tab 4')
        self.assertEqual(len(data['tabs'][3]['iwidgets']), 0)

        wiring_status = data['wiring']
        self.assertEqual(len(wiring_status['operators']), 1)
        self.assertEqual(wiring_status['operators']['1']['preferences']['pref_with_val']['readonly'], False)
        self.assertEqual(wiring_status['operators']['1']['preferences']['pref_with_val']['hidden'], False)
        self.assertEqual(wiring_status['operators']['1']['preferences']['pref_with_val']['value'], 'value1')
        self.assertEqual(wiring_status['operators']['1']['preferences']['readonly_pref']['readonly'], True)
        self.assertEqual(wiring_status['operators']['1']['preferences']['readonly_pref']['hidden'], False)
        self.assertEqual(wiring_status['operators']['1']['preferences']['readonly_pref']['value'], 'value2')
        self.assertEqual(wiring_status['operators']['1']['preferences']['hidden_pref']['readonly'], True)
        self.assertEqual(wiring_status['operators']['1']['preferences']['hidden_pref']['hidden'], True)
        self.assertEqual(wiring_status['operators']['1']['preferences']['hidden_pref']['value'], 'value3')

        self.assertEqual(len(wiring_status['connections']), 1)
        self.assertEqual(wiring_status['connections'][0]['source']['type'], 'widget')
        self.assertEqual(wiring_status['connections'][0]['source']['endpoint'], 'event')
        self.assertEqual(wiring_status['connections'][0]['target']['type'], 'widget')
        self.assertEqual(wiring_status['connections'][0]['target']['endpoint'], 'slot')

    def test_complex_workspaces(self):
        template3 = self.read_template('wt3.xml')

        workspace, _junk = buildWorkspaceFromTemplate(template3, self.user)
        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())

        self.check_complex_workspace_data(data)

    def test_complex_workspaces_rdf(self):
        template = self.read_template('wt3.rdf')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)

        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())

        self.check_complex_workspace_data(data)

    @uses_extra_resources(('Wirecloud_api-test_0.9.wgt',), shared=True)
    def test_workspace_with_params(self):
        template = self.read_template('wt5.xml')

        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)
        workspace_data = self.check_workspace_with_params(workspace)

        iwidget1 = workspace_data['tabs'][1]['iwidgets'][0]
        self.assertEqual(iwidget1['properties'], {'prop': {'readonly': False, 'secure': False, 'hidden': False, 'value': 'initial_data', 'name': 'prop'}})

        iwidget2 = workspace_data['tabs'][1]['iwidgets'][1]
        self.assertEqual(iwidget2['properties'], {'prop': {'readonly': True, 'secure': False, 'hidden': False, 'value': '', 'name': 'prop'}})

    def test_workspace_with_params_rdf(self):
        template = self.read_template('wt5.rdf')

        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)
        self.check_workspace_with_params(workspace)

    def test_build_workspace_from_widget_template(self):
        template = Mock(spec=TemplateParser)
        template.get_resource_type.return_value = 'operator'
        self.assertRaises(TypeError, buildWorkspaceFromTemplate, template, self.user)
        self.assertEqual(template.get_resource_type.call_count, 2)

    def test_fill_workspace_using_widget_template(self):
        template = Mock(spec=TemplateParser)
        template.get_resource_type.return_value = 'operator'
        self.assertRaises(TypeError, fillWorkspaceUsingTemplate, self.workspace, template)
        self.assertEqual(template.get_resource_type.call_count, 2)

    def test_fill_workspace_using_template_invalid_forced_values(self):
        template = self.read_template('wt-with-behaviours.xml')
        self.workspace.forcedValues = {}
        fillWorkspaceUsingTemplate(self.workspace, template)
        self.assertEqual(self.workspace.forcedValues, {
            'extra_prefs': [],
            'iwidget': {},
            'ioperator': {},
        })

    def test_fill_workspace_using_widget_template_inverse_operator_key_list(self):
        template = self.read_template('wt-with-behaviours.xml')
        self.workspace.wiringStatus['operators'] = OrderedDict([
            ("2", {"preferences": {}, 'name': "Wirecloud/TestOperator/1.0"}),
            ("1", {"preferences": {}, 'name': "Wirecloud/TestOperator/1.0"}),
        ])
        fillWorkspaceUsingTemplate(self.workspace, template)
        self.assertEqual(set(self.workspace.wiringStatus['operators'].keys()), {"1", "2", "3", "4"})

    def test_fill_workspace_target_without_behaviours_template_with_behaviours(self):
        template = self.read_template('wt-with-behaviours.xml')
        fillWorkspaceUsingTemplate(self.workspace_with_iwidgets, template)
        # wt-with-behaviours provides 2 behaviours
        # self.workspace_with_iwidgets initial wiring should be transformed into 1 behaviour
        wiring = self.workspace_with_iwidgets.wiringStatus
        self.assertEqual(len(wiring['visualdescription']['behaviours']), 3)

    def enable_workspace_behaviours(self, workspace):
        workspace.wiringStatus['visualdescription']['behaviours'].append({
            "title": "Initial behaviour",
            "description": "autogenerated behaviour",
            "components": {
                "operator": {"0": {}},
                "widget": {}
            },
            "connections": []
        })

    def test_fill_workspace_target_with_behaviours_template_without_behaviours(self):
        self.enable_workspace_behaviours(self.workspace_with_iwidgets)
        template = self.read_template('wt-without-behaviours.xml')
        fillWorkspaceUsingTemplate(self.workspace_with_iwidgets, template)
        wiring = self.workspace_with_iwidgets.wiringStatus
        self.assertEqual(len(wiring['visualdescription']['behaviours']), 2)
        new_widgets = {str(widget_id): {} for widget_id in self.workspace_with_iwidgets.tab_set.all().order_by('id')[1].iwidget_set.values_list('id', flat=True)}
        self.assertEqual(wiring['visualdescription']['behaviours'][1]['components'], {'operator': {'1': {}}, 'widget': new_widgets})

    def test_fill_workspace_target_with_behaviours_template_with_behaviours(self):
        self.enable_workspace_behaviours(self.workspace_with_iwidgets)
        template = self.read_template('wt-with-behaviours.xml')
        fillWorkspaceUsingTemplate(self.workspace_with_iwidgets, template)
        # wt-with-behaviours provides 2 behaviours
        # self.workspace_with_iwidgets initial wiring should be transformed into 1 behaviour
        wiring = self.workspace_with_iwidgets.wiringStatus
        self.assertEqual(len(wiring['visualdescription']['behaviours']), 3)
        self.assertEqual(wiring['visualdescription']['behaviours'][0]['title'], 'Initial behaviour')
        self.assertEqual(wiring['visualdescription']['behaviours'][1]['title'], 'Behaviour 1')
        self.assertEqual(wiring['visualdescription']['behaviours'][2]['title'], 'Behaviour 2')
