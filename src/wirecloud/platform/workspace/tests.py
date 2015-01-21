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

import codecs
import os
import rdflib
import json

from django.contrib.auth.models import User
from django.core.cache import cache

from wirecloud.commons.utils.testcases import WirecloudTestCase
from wirecloud.platform.iwidget.utils import SaveIWidget
from wirecloud.platform.models import Tab, UserWorkspace, Workspace
from wirecloud.platform.preferences.views import update_workspace_preferences
from wirecloud.platform.workspace.mashupTemplateGenerator import build_xml_template_from_workspace, build_rdf_template_from_workspace
from wirecloud.platform.workspace.mashupTemplateParser import buildWorkspaceFromTemplate, fillWorkspaceUsingTemplate
import wirecloud.platform.workspace.utils
from wirecloud.platform.workspace.utils import get_global_workspace_data, set_variable_value
from wirecloud.platform.workspace.views import createEmptyWorkspace


# Avoid nose to repeat these tests (they are run through wirecloud/tests/__init__.py)
__test__ = False


class CacheTestCase(WirecloudTestCase):

    @classmethod
    def setUpClass(cls):
        super(CacheTestCase, cls).setUpClass()
        cache.clear()

    def tearDown(self):
        super(CacheTestCase, self).tearDown()
        cache.clear()


class WorkspaceTestCase(CacheTestCase):

    fixtures = ('test_data',)

    def setUp(self):
        super(WorkspaceTestCase, self).setUp()

        self.user = User.objects.get(username='test')

    def test_get_global_workspace_data(self):

        workspace = Workspace.objects.get(pk=1)
        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())
        self.assertEqual(len(data['tabs']), 1)

        tab = data['tabs'][0]
        preferences = tab['iwidgets'][0]['preferences']
        self.assertEqual(preferences['password']['value'], '')
        self.assertEqual(preferences['password']['secure'], True)
        self.assertEqual(preferences['username']['value'], 'test_username')
        properties = tab['iwidgets'][0]['properties']
        self.assertEqual(properties['prop']['value'], 'test_data')
    test_get_global_workspace_data.tags = ('fiware-ut-3',)

    def test_create_empty_workspace(self):

        workspace = createEmptyWorkspace('Testing', self.user)

        user_workspace = UserWorkspace.objects.filter(user=self.user, workspace=workspace)
        self.assertEqual(user_workspace.count(), 1)
        self.assertEqual(user_workspace[0].active, True)

        workspace_tabs = Tab.objects.filter(workspace=workspace)
        self.assertEqual(workspace_tabs.count(), 1)

        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())
        self.assertEqual(data['owned'], True)
        self.assertEqual(data['shared'], False)
    test_create_empty_workspace.tags = ('fiware-ut-3',)


class WorkspaceCacheTestCase(CacheTestCase):

    fixtures = ('test_data',)
    tags = ('fiware-ut-3',)

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

        variable = self.workspace.tab_set.get(pk=1).iwidget_set.get(pk=1).variable_set.select_related('vardef').get(
            vardef__name='username',
            vardef__aspect='PREF'
        )
        variable.set_variable_value('new_username')
        variable.save()

        workspace_info = get_global_workspace_data(self.workspace, self.user)
        self.assertNotEqual(self.initial_info.timestamp, workspace_info.timestamp)

        data = json.loads(workspace_info.get_data())
        preferences = data['tabs'][0]['iwidgets'][0]['preferences']
        self.assertEqual(preferences['password']['value'], '')
        self.assertEqual(preferences['password']['secure'], True)
        self.assertEqual(preferences['username']['value'], 'new_username')
        properties = data['tabs'][0]['iwidgets'][0]['properties']
        self.assertEqual(properties['prop']['value'], 'test_data')

    def test_updating_properties_invalidates_cache(self):

        variable = self.workspace.tab_set.get(pk=1).iwidget_set.get(pk=1).variable_set.select_related('vardef').get(
            vardef__name='prop',
            vardef__aspect='PROP'
        )
        variable.set_variable_value('new_data')
        variable.save()

        workspace_info = get_global_workspace_data(self.workspace, self.user)
        self.assertNotEqual(self.initial_info.timestamp, workspace_info.timestamp)

        data = json.loads(get_global_workspace_data(self.workspace, self.user).get_data())
        preferences = data['tabs'][0]['iwidgets'][0]['preferences']
        self.assertEqual(preferences['password']['value'], '')
        self.assertEqual(preferences['password']['secure'], True)
        self.assertEqual(preferences['username']['value'], 'test_username')
        properties = data['tabs'][0]['iwidgets'][0]['properties']
        self.assertEqual(properties['prop']['value'], 'new_data')

    def test_widget_instantiation_invalidates_cache(self):

        tab = self.workspace.tab_set.get(pk=1)
        iwidget_data = {
            'widget': 'Test/Test Widget/1.0.0',
            'name': 'test',
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


class ParameterizedWorkspaceGenerationTestCase(WirecloudTestCase):

    WIRE = rdflib.Namespace('http://wirecloud.conwet.fi.upm.es/ns/widget#')
    WIRE_M = rdflib.Namespace('http://wirecloud.conwet.fi.upm.es/ns/mashup#')
    FOAF = rdflib.Namespace('http://xmlns.com/foaf/0.1/')
    RDF = rdflib.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
    DCTERMS = rdflib.Namespace('http://purl.org/dc/terms/')
    USDL = rdflib.Namespace('http://www.linked-usdl.org/ns/usdl-core#')
    VCARD = rdflib.Namespace('http://www.w3.org/2006/vcard/ns#')

    fixtures = ('test_data',)
    tags = ('fiware-ut-1',)

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
                    }
                },
                'ioperators': {
                    '1': {
                        'pref_with_val': {'source': 'custom', 'status': 'normal', 'value': 'new_value1'},
                        'readonly_pref': {'source': 'custom', 'status': 'readonly', 'value': 'new_value2'},
                        'hidden_pref': {'source': 'custom', 'status': 'hidden', 'value': 'new_value3'},
                    }
                }
            },
        }

    def setUp(self):

        super(ParameterizedWorkspaceGenerationTestCase, self).setUp()

        self.user = User.objects.get(username='test')
        self.workspace_with_iwidgets = Workspace.objects.get(pk=1)
        self.workspace = createEmptyWorkspace('Testing', self.user)

    def assertXPathText(self, root_element, xpath, content):
        elements = root_element.xpath(xpath)
        self.assertEqual(len(elements), 1)
        self.assertEqual(elements[0].text, content)

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

        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Vendor', 'Wirecloud Test Suite')
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Name', 'Test Mashup')
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Version', '1')
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Author', 'test')
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Mail', 'a@b.com')

    def check_workspace_xml_wiring(self, template):

        self.assertXPathCount(template, '/Template/Platform.Wiring/Connection', 0)
        self.assertXPathCount(template, '/Template/Platform.Wiring/Operator', 1)
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]', 'name', 'Wirecloud/TestOperator/1.0')
        self.assertXPathCount(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference', 3)
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="pref_with_val"]', 'value', 'value1')
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="pref_with_val"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="pref_with_val"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="readonly_pref"]', 'value', 'value2')
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="readonly_pref"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="readonly_pref"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="hidden_pref"]', 'value', 'value3')
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="hidden_pref"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="hidden_pref"]', 'hidden', 'false', optional=True)

    def get_rdf_element(self, graph, base, ns, predicate):
        element = None

        for e in graph.objects(base, ns[predicate]):

            if element is not None:
                raise Exception()

            element = e

        return element

    def assertRDFElement(self, graph, element, ns, predicate, content, optional=False):
        element = self.get_rdf_element(graph, element, ns, predicate)
        if optional and element is None:
            return
        self.assertEqual(unicode(element), content)

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
        self.assertRDFCount(graph, wiring, self.WIRE_M, 'hasiOperator', 1)
        for ioperator in graph.objects(wiring, self.WIRE_M['hasiOperator']):
            self.assertRDFCount(graph, ioperator, self.WIRE_M, 'hasiOperatorPreference', 3)
            pref_with_val_found = readonly_pref_found = hidden_pref_found = False
            for preference in graph.objects(ioperator, self.WIRE_M['hasiOperatorPreference']):
                self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'false', optional=True)
                self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'false', optional=True)
                name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                if unicode(name) == 'pref_with_val':
                    pref_with_val_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'value1')
                elif unicode(name) == 'readonly_pref':
                    readonly_pref_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'value2')
                elif unicode(name) == 'hidden_pref':
                    hidden_pref_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'value3')
                else:
                    self.fail()

            self.assertTrue(pref_with_val_found and readonly_pref_found and hidden_pref_found)

    def test_build_xml_template_from_workspace(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'authors': 'test',
            'email': 'a@b.com',
        }
        template = build_xml_template_from_workspace(options, self.workspace, self.user)

        self.check_basic_xml_workspace_template_info(template)
        self.assertXPathCount(template, '/Template/Platform.Wiring/Connection', 0)
        self.assertXPathCount(template, '/Template/Platform.Wiring/Operator', 0)

        # IWidgets
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab', 1)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]', 'name', 'Tab')
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/IWidget', 0)

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
        template = build_xml_template_from_workspace(options, self.workspace_with_iwidgets, self.user)

        self.check_basic_xml_workspace_template_info(template)

        # IWidgets
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab', 1)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]', 'name', 'tab')
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource', 2)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[1]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[2]', 'readonly', 'false', optional=True)

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
        template = build_xml_template_from_workspace(options, self.workspace_with_iwidgets, self.user)

        self.check_basic_xml_workspace_template_info(template)

        # IWidgets
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab', 1)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]', 'name', 'tab')
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource', 2)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[1]', 'readonly', 'true')
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[2]', 'readonly', 'true')

        self.check_workspace_xml_wiring(template)

    def test_build_xml_template_from_workspace_forced_values(self):

        set_variable_value(1, 'test_password')
        set_variable_value(6, 'test_password')

        # Workspace with iwidgets
        template = build_xml_template_from_workspace(self.forced_value_options, self.workspace_with_iwidgets, self.user)
        self.check_basic_xml_workspace_template_info(template)

        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[@id="1"]/Preference[@name="username"]', 'readonly', 'true')
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[@id="1"]/Preference[@name="username"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[@id="1"]/Preference[@name="username"]', 'value', 'default')
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[@id="1"]/Preference[@name="password"]', 'readonly', 'true')
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[@id="1"]/Preference[@name="password"]', 'hidden', 'true')
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[@id="1"]/Preference[@name="password"]', 'value', 'initial text')

        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[@id="2"]/Preference[@name="username"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[@id="2"]/Preference[@name="username"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[@id="2"]/Preference[@name="username"]', 'value', 'test_username')
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[@id="2"]/Preference[@name="password"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[@id="2"]/Preference[@name="password"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[@id="2"]/Preference[@name="password"]', 'value', 'test_password')

        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="pref_with_val"]', 'value', 'new_value1')
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="pref_with_val"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="pref_with_val"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="readonly_pref"]', 'value', 'new_value2')
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="readonly_pref"]', 'readonly', 'true')
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="readonly_pref"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="hidden_pref"]', 'value', 'new_value3')
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="hidden_pref"]', 'readonly', 'true')
        self.assertXPathAttr(template, '/Template/Platform.Wiring/Operator[@id="1"]/Preference[@name="hidden_pref"]', 'hidden', 'true')

    def test_build_rdf_template_from_workspace(self):

        set_variable_value(1, 'test_password')
        set_variable_value(6, 'test_password')

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
        self.assertRDFElement(graph, tab, self.DCTERMS, 'title', 'Tab')

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
            self.assertRDFCount(graph, iwidget, self.WIRE_M, 'hasiWidgetPreference', 2)
            username_found = password_found = False
            for preference in graph.objects(iwidget, self.WIRE_M['hasiWidgetPreference']):
                self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'false', optional=True)
                self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'false', optional=True)
                name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                if unicode(name) == 'username':
                    username_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'test_username')
                elif unicode(name) == 'password':
                    password_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'test_password')
                else:
                    self.fail()

            self.assertTrue(username_found and password_found)

        self.check_workspace_rdf_wiring(graph, mashup_uri)

    def test_build_rdf_template_from_workspace_read_only_widgets(self):

        set_variable_value(1, 'test_password')
        set_variable_value(6, 'test_password')

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
            self.assertRDFCount(graph, iwidget, self.WIRE_M, 'hasiWidgetPreference', 2)
            username_found = password_found = False
            for preference in graph.objects(iwidget, self.WIRE_M['hasiWidgetPreference']):
                self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'false', optional=True)
                self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'false', optional=True)
                name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                if unicode(name) == 'username':
                    username_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'test_username')
                elif unicode(name) == 'password':
                    password_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', 'test_password')
                else:
                    self.fail()

            self.assertTrue(username_found and password_found)

    def test_build_rdf_template_from_workspace_forced_values(self):

        set_variable_value(1, 'test_password')
        set_variable_value(6, 'test_password')

        # Workspace with iwidgets
        graph = build_rdf_template_from_workspace(self.forced_value_options, self.workspace_with_iwidgets, self.user)
        mashup_uri = next(graph.subjects(self.RDF['type'], self.WIRE_M['Mashup']))
        self.check_basic_rdf_workspace_template_info(graph, mashup_uri)

        tab = next(graph.objects(mashup_uri, self.WIRE_M['hasTab']))
        self.assertRDFCount(graph, tab, self.WIRE_M, 'hasiWidget', 2)
        for iwidget in graph.objects(tab, self.WIRE_M['hasiWidget']):

            name = unicode(self.get_rdf_element(graph, iwidget, self.DCTERMS, 'title'))

            self.assertRDFCount(graph, iwidget, self.WIRE_M, 'hasiWidgetPreference', 2)
            preferences = graph.objects(iwidget, self.WIRE_M['hasiWidgetPreference'])

            username_found = password_found = False

            if name == 'Test Widget':

                for preference in preferences:
                    self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', 'true')
                    name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                    if unicode(name) == 'username':
                        username_found = True
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'false', optional=True)
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', 'default')
                    elif unicode(name) == 'password':
                        password_found = True
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', 'true')
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', 'initial text')
                    else:
                        self.fail()

            elif name == 'Test Widget 2':

                for preference in preferences:
                    name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                    if unicode(name) == 'username':
                        username_found = True
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', 'test_username')
                    elif unicode(name) == 'password':
                        password_found = True
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', 'test_password')
                    else:
                        self.fail()

            self.assertTrue(username_found and password_found)

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


class ParameterizedWorkspaceParseTestCase(CacheTestCase):

    fixtures = ('selenium_test_data',)
    tags = ('fiware-ut-2',)

    base_resources = ('Wirecloud_TestOperator_1.0.zip', 'Wirecloud_Test_1.0.wgt')

    def setUp(self):

        super(ParameterizedWorkspaceParseTestCase, self).setUp()

        self.user = User.objects.get(username='normuser')
        self.workspace = createEmptyWorkspace('Testing', self.user)

    def read_template(self, filename):
        f = codecs.open(os.path.join(os.path.dirname(__file__), 'test-data', filename), 'rb')
        contents = f.read()
        f.close()

        return contents

    def check_basic_workspace_structure(self, workspace):

        wiring_status = json.loads(workspace.wiringStatus)

        self.assertEqual(len(wiring_status['connections']), 1)
        self.assertEqual(wiring_status['connections'][0]['readOnly'], False)

        workspace_data = json.loads(get_global_workspace_data(workspace, self.user).get_data())
        self.assertEqual(workspace.name, 'Test Mashup')
        self.assertEqual(len(workspace_data['tabs']), 1)

        if workspace_data['tabs'][0]['iwidgets'][0]['name'] == 'Test (1)':

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

    def check_workspace_with_params(self, workspace):

        workspace_data = json.loads(get_global_workspace_data(workspace, self.user).get_data())
        self.assertEqual(workspace_data['extra_prefs'], [{'name': 'param', 'type': 'text', 'inheritable': False, 'label': 'Parameter'}])

        update_workspace_preferences(workspace, {'param': {'value': 'world'}});
        workspace_data = json.loads(get_global_workspace_data(workspace, self.user).get_data())

        iwidget1 = None
        iwidget2 = None
        iwidget3 = None
        for iwidget in workspace_data['tabs'][0]['iwidgets']:

            if iwidget['name'] == 'Test (1)':
                iwidget1 = iwidget
            elif iwidget['name'] == 'Test (2)':
                iwidget2 = iwidget
            else:
                iwidget3 = iwidget

        # Check iwidget 1 data
        iwidget1_preferences = iwidget1['preferences']

        self.assertEqual(iwidget1_preferences['text']['value'], 'initial world')
        self.assertEqual(iwidget1_preferences['text'].get('hidden', False), False)
        self.assertEqual(iwidget1_preferences['text']['readonly'], True)

        # Check iwidget 2 data
        iwidget2_preferences = iwidget2['preferences']

        self.assertEqual(iwidget2_preferences['text']['value'], 'initial world')
        self.assertEqual(iwidget2_preferences['text']['hidden'], True)
        self.assertEqual(iwidget2_preferences['text']['readonly'], True)

        # Check iwidget 3 data
        iwidget3_preferences = iwidget3['preferences']

        self.assertEqual(iwidget3_preferences['text']['value'], 'initial %(params.param)')
        self.assertEqual(iwidget3_preferences['text'].get('hidden', False), False)
        self.assertEqual(iwidget3_preferences['text'].get('readonly', False), False)

    def test_fill_workspace_using_template(self):
        template = self.read_template('wt1.xml')
        fillWorkspaceUsingTemplate(self.workspace, template)
        data = json.loads(get_global_workspace_data(self.workspace, self.user).get_data())
        self.assertEqual(self.workspace.name, 'Testing')
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

    def test_build_workspace_from_template(self):
        template = self.read_template('wt1.xml')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)

        self.check_basic_workspace_structure(workspace)

    def test_build_workspace_from_rdf_template(self):
        template = self.read_template('wt1.rdf')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)

        self.check_basic_workspace_structure(workspace)

    def test_build_workspace_from_rdf_template_utf8_char(self):
        template = self.read_template('wt4.rdf')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)
        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())

        for t in data['tabs']:
            self.assertEqual(t['name'][0:7], 'Pestaña')

    def test_read_only_widgets(self):
        template = self.read_template('wt6.xml')

        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)
        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())

        self.assertEqual(len(data['tabs'][0]['iwidgets']), 3)
        self.assertEqual(data['tabs'][0]['iwidgets'][0]['readOnly'], True)

    def test_blocked_connections(self):
        template = self.read_template('wt2.xml')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)

        wiring_status = json.loads(workspace.wiringStatus)
        self.assertEqual(len(wiring_status['connections']), 1)
        self.assertEqual(wiring_status['connections'][0]['readOnly'], True)

    def test_bloqued_connections_rdf(self):
        template = self.read_template('wt2.rdf')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)

        wiring_status = json.loads(workspace.wiringStatus)
        self.assertEqual(len(wiring_status['connections']), 1)
        self.assertEqual(wiring_status['connections'][0]['readOnly'], True)

    def check_complex_workspace_data(self, data):

        self.assertEqual(len(data['tabs']), 4)
        self.assertEqual(data['tabs'][0]['name'], 'Tab')
        self.assertEqual(len(data['tabs'][0]['iwidgets']), 1)
        self.assertEqual(data['tabs'][1]['name'], 'Tab 2')
        self.assertEqual(len(data['tabs'][1]['iwidgets']), 1)
        self.assertEqual(data['tabs'][2]['name'], 'Tab 3')
        self.assertEqual(len(data['tabs'][2]['iwidgets']), 0)
        self.assertEqual(data['tabs'][3]['name'], 'Tab 4')
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
        self.assertEqual(wiring_status['connections'][0]['source']['type'], 'iwidget')
        self.assertEqual(wiring_status['connections'][0]['source']['endpoint'], 'event')
        self.assertEqual(wiring_status['connections'][0]['target']['type'], 'iwidget')
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

    def test_workspace_with_params(self):
        template = self.read_template('wt5.xml')

        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)
        self.check_workspace_with_params(workspace)

    def test_workspace_with_params_rdf(self):
        template = self.read_template('wt5.rdf')

        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)
        self.check_workspace_with_params(workspace)
