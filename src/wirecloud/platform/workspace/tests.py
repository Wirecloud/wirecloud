# -*- coding: utf-8 -*-

# Copyright 2012-2013 Universidad Politécnica de Madrid

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


# -*- coding: utf-8 -*-

import codecs
import os
import rdflib
from tempfile import mkdtemp
from shutil import rmtree
import json

from django.contrib.auth.models import User, Group
from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.test import Client
from django.utils import unittest

from wirecloud.catalogue import utils as catalogue
from wirecloud.commons.utils.testcases import WirecloudTestCase
from wirecloud.commons.utils.wgt import WgtDeployer, WgtFile
from wirecloud.platform.get_data import get_global_workspace_data
from wirecloud.platform.iwidget.utils import SaveIWidget, deleteIWidget
from wirecloud.platform.models import IWidget, Tab, UserWorkspace, Variable, VariableValue, Workspace
from wirecloud.platform.preferences.views import update_workspace_preferences
from wirecloud.platform.workspace.packageCloner import PackageCloner
from wirecloud.platform.workspace.mashupTemplateGenerator import build_template_from_workspace, build_rdf_template_from_workspace
from wirecloud.platform.workspace.mashupTemplateParser import buildWorkspaceFromTemplate, fillWorkspaceUsingTemplate
import wirecloud.platform.workspace.utils
from wirecloud.platform.workspace.utils import sync_base_workspaces
from wirecloud.platform.workspace.views import createEmptyWorkspace, linkWorkspace


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
        variables = tab['iwidgets'][0]['variables']
        self.assertEqual(variables['password']['value'], '')
        self.assertEqual(variables['password']['secure'], True)
        self.assertEqual(variables['username']['value'], 'test_username')
        self.assertEqual(variables['prop']['value'], 'test_data')
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

    def test_link_workspace(self):

        workspace = Workspace.objects.get(pk=1)

        alternative_user = User.objects.get(username='test2')
        new_workspace = linkWorkspace(alternative_user, workspace.id, self.user)

        all_variables = VariableValue.objects.filter(variable__iwidget__tab__workspace=workspace)
        initial_vars = all_variables.filter(user=self.user)
        cloned_vars = all_variables.filter(user=alternative_user)

        self.assertEqual(new_workspace.user, alternative_user)
        self.assertEqual(workspace.creator, self.user)
        self.assertEqual(new_workspace.workspace, workspace)
        self.assertEqual(initial_vars.count(), cloned_vars.count())

    def test_clone_workspace(self):

        workspace = Workspace.objects.get(pk=1)

        packageCloner = PackageCloner()
        cloned_workspace = packageCloner.clone_tuple(workspace)

        self.assertNotEqual(workspace, cloned_workspace)
        self.assertEqual(cloned_workspace.users.count(), 0)

        original_iwidgets = IWidget.objects.filter(tab__workspace=workspace)
        cloned_iwidgets = IWidget.objects.filter(tab__workspace=cloned_workspace)
        self.assertEqual(original_iwidgets.count(), cloned_iwidgets.count())
        self.assertNotEqual(original_iwidgets[0].id, cloned_iwidgets[0].id)

        original_variables = Variable.objects.filter(iwidget__tab__workspace=workspace)
        cloned_variables = Variable.objects.filter(iwidget__tab__workspace=cloned_workspace)

        self.assertEqual(original_variables.count(), cloned_variables.count())
        self.assertNotEqual(original_variables[0].id, cloned_variables[0].id)

    def test_merge_workspaces(self):

        workspace = Workspace.objects.get(pk=1)

        packageCloner = PackageCloner()
        cloned_workspace = packageCloner.clone_tuple(workspace)
        linkWorkspace(self.user, cloned_workspace.id, self.user)

        packageCloner = PackageCloner()
        packageCloner.merge_workspaces(cloned_workspace, workspace, self.user)

        # Check cache invalidation
        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())
        tab_list = data['tabs']

        self.assertEqual(len(tab_list), 2)

    def test_shared_workspace(self):

        from django.conf import settings
        if not hasattr(settings, 'WORKSPACE_MANAGERS') or 'wirecloud.platform.workspace.workspace_managers.OrganizationWorkspaceManager' not in settings.WORKSPACE_MANAGERS:
            raise unittest.SkipTest('OrganizationWorkspaceManager not enabled')

        workspace = Workspace.objects.get(pk=1)

        # Create a new group and share the workspace with it
        group = Group.objects.create(name='test_users')
        workspace.targetOrganizations.add(group)

        other_user = User.objects.get(username='test2')
        other_user.groups.add(group)
        other_user.save()

        # Sync shared workspaces
        sync_base_workspaces(other_user)

        # Check that other_user can access to the shared workspace
        data = json.loads(get_global_workspace_data(workspace, other_user).get_data())
        iwidget_list = data['tabs'][0]['iwidgets']
        self.assertEqual(len(iwidget_list), 2)

        # Add a new iWidget to the workspace
        tab = Tab.objects.get(pk=1)
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

        data = json.loads(get_global_workspace_data(workspace, other_user).get_data())
        iwidget_list = data['tabs'][0]['iwidgets']
        self.assertEqual(len(iwidget_list), 3)


class WorkspaceCacheTestCase(CacheTestCase):

    fixtures = ('test_data',)
    tags = ('fiware-ut-3',)

    def setUp(self):
        super(WorkspaceCacheTestCase, self).setUp()

        self.user = User.objects.get(username='test')
        self.workspace = Workspace.objects.get(pk=1)

        # Fill cache
        get_global_workspace_data(self.workspace, self.user)

    def test_variable_updating_invalidates_cache(self):

        client = Client()
        put_data = [
            {'id': 1, 'value': 'new_password'},
            {'id': 2, 'value': 'new_username'},
            {'id': 4, 'value': 'new_data'},
        ]

        put_data = json.dumps(put_data, ensure_ascii=False).encode('utf-8')
        client.login(username='test', password='test')
        result = client.post(reverse('wirecloud.variable_collection', kwargs={'workspace_id': 1}), put_data, content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(result.status_code, 204)

        data = json.loads(get_global_workspace_data(self.workspace, self.user).get_data())
        variables = data['tabs'][0]['iwidgets'][0]['variables']
        self.assertEqual(variables['password']['value'], '')
        self.assertEqual(variables['password']['secure'], True)
        self.assertEqual(variables['username']['value'], 'new_username')
        self.assertEqual(variables['prop']['value'], 'new_data')

    def test_widget_instantiation_invalidates_cache(self):

        tab = Tab.objects.get(pk=1)
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

        data = json.loads(get_global_workspace_data(self.workspace, self.user).get_data())

        iwidget_list = data['tabs'][0]['iwidgets']
        self.assertEqual(len(iwidget_list), 3)

    def test_widget_deletion_invalidates_cache(self):

        deleteIWidget(IWidget.objects.get(pk=1), self.user)
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
        cls.old_HAS_AES = wirecloud.platform.workspace.utils.HAS_AES
        wirecloud.platform.workspace.utils.HAS_AES = False

    @classmethod
    def tearDownClass(cls):

        super(ParameterizedWorkspaceGenerationTestCase, cls).tearDownClass()
        wirecloud.platform.workspace.utils.HAS_AES = cls.old_HAS_AES

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

    def check_empty_xml_wiring_info(self, template):

        self.assertXPathCount(template, '/Template/Platform.Wiring/Connection', 0)
        self.assertXPathCount(template, '/Template/Platform.Wiring/Operator', 0)

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

        self.assertRDFElement(graph, mashup_uri, self.DCTERMS, 'title', u'Test Mashup')
        self.assertRDFElement(graph, mashup_uri, self.USDL, 'versionInfo', u'1')

        vendor = graph.objects(mashup_uri, self.USDL['hasProvider']).next()
        self.assertRDFElement(graph, vendor, self.FOAF, 'name', u'Wirecloud Test Suite')

        addr = graph.objects(mashup_uri, self.VCARD['addr']).next()
        self.assertRDFElement(graph, addr, self.VCARD, 'email', u'a@b.com')

        author = graph.objects(mashup_uri, self.DCTERMS['creator']).next()
        self.assertRDFElement(graph, author, self.FOAF, 'name', u'test')

    def check_empty_rdf_wiring_info(self, graph, mashup_uri):

        wiring = graph.objects(mashup_uri, self.WIRE_M['hasMashupWiring']).next()
        self.assertRDFCount(graph, wiring, self.WIRE_M, 'hasConnection', 0)
        self.assertRDFCount(graph, wiring, self.WIRE_M, 'hasiOperator', 0)
        self.assertRDFCount(graph, wiring, self.WIRE_M, 'hasWiringView', 0)

    def test_build_template_from_workspace(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'author': 'test',
            'email': 'a@b.com',
        }
        template = build_template_from_workspace(options, self.workspace, self.user)

        self.check_basic_xml_workspace_template_info(template)
        self.check_empty_xml_wiring_info(template)

        # IWidgets
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab', 1)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]', 'name', 'Tab')
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/IWidget', 0)

        # Workspace with iwidgets
        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'author': 'test',
            'email': 'a@b.com',
            'doc_uri': 'http://example.com/test-mashup/docs/index.html',
            'readOnlyWidgets': False,
        }
        template = build_template_from_workspace(options, self.workspace_with_iwidgets, self.user)

        self.check_basic_xml_workspace_template_info(template)

        # IWidgets
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab', 1)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]', 'name', 'tab')
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource', 2)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[1]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[2]', 'readonly', 'false', optional=True)

        self.check_empty_xml_wiring_info(template)

    def test_build_template_from_workspace_read_only_widgets(self):

        # Workspace with iwidgets
        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'author': 'test',
            'email': 'a@b.com',
            'doc_uri': 'http://example.com/test-mashup/docs/index.html',
            'readOnlyWidgets': True,
        }
        template = build_template_from_workspace(options, self.workspace_with_iwidgets, self.user)

        self.check_basic_xml_workspace_template_info(template)

        # IWidgets
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab', 1)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]', 'name', 'tab')
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource', 2)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[1]', 'readonly', 'true')
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[2]', 'readonly', 'true')

        self.check_empty_xml_wiring_info(template)

    test_build_template_from_workspace_read_only_widgets.tags = ('next',)

    def test_build_template_from_workspace_forced_values(self):

        # Workspace with iwidgets
        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'author': 'test',
            'email': 'a@b.com',
            'readOnlyWidgets': False,
            'parametrization': {
                'iwidgets': {
                    '1': {
                        'username': {'source': 'current', 'status': 'readonly', 'value': 'default'},
                        'password': {'source': 'current', 'status': 'hidden', 'value': 'initial text'},
                    }
                },
                'ioperators': {}
            },
        }
        template = build_template_from_workspace(options, self.workspace_with_iwidgets, self.user)
        self.check_basic_xml_workspace_template_info(template)

        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[1]/Preference[@name="username"]', 'readonly', 'true')
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[1]/Preference[@name="username"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[1]/Preference[@name="username"]', 'value', 'default')
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[1]/Preference[@name="password"]', 'readonly', 'true')
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[1]/Preference[@name="password"]', 'hidden', 'true')
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[1]/Preference[@name="password"]', 'value', 'initial text')

        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[2]/Preference[@name="username"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[2]/Preference[@name="username"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[2]/Preference[@name="username"]', 'value', 'test_username')
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[2]/Preference[@name="password"]', 'readonly', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[2]/Preference[@name="password"]', 'hidden', 'false', optional=True)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource[2]/Preference[@name="password"]', 'value', 'test_password')

        self.check_empty_xml_wiring_info(template)

    test_build_template_from_workspace_forced_values.tags = ('next',)

    def test_build_rdf_template_from_workspace(self):

        options = {
            'vendor': u'Wirecloud Test Suite',
            'name': u'Test Mashup',
            'version': u'1',
            'author': u'test',
            'email': u'a@b.com',
        }
        # Basic info
        graph = build_rdf_template_from_workspace(options, self.workspace, self.user)
        mashup_uri = graph.subjects(self.RDF['type'], self.WIRE_M['Mashup']).next()
        self.check_basic_rdf_workspace_template_info(graph, mashup_uri)

        self.assertRDFCount(graph, mashup_uri, self.WIRE_M, 'hasTab', 1)

        tab = graph.objects(mashup_uri, self.WIRE_M['hasTab']).next()
        self.assertRDFElement(graph, tab, self.DCTERMS, 'title', u'Tab')

        self.check_empty_rdf_wiring_info(graph, mashup_uri)

        # Workspace with iwidgets
        options = {
            'vendor': u'Wirecloud Test Suite',
            'name': u'Test Mashup',
            'version': u'1',
            'author': u'test',
            'email': u'a@b.com',
            'readOnlyWidgets': False,
        }
        graph = build_rdf_template_from_workspace(options, self.workspace_with_iwidgets, self.user)
        mashup_uri = graph.subjects(self.RDF['type'], self.WIRE_M['Mashup']).next()
        self.check_basic_rdf_workspace_template_info(graph, mashup_uri)

        self.assertRDFCount(graph, mashup_uri, self.WIRE_M, 'hasTab', 1)

        tab = graph.objects(mashup_uri, self.WIRE_M['hasTab']).next()
        self.assertRDFElement(graph, tab, self.DCTERMS, 'title', u'tab')
        self.assertRDFCount(graph, tab, self.WIRE_M, 'hasiWidget', 2)
        for iwidget in graph.objects(tab, self.WIRE_M['hasiWidget']):
            self.assertRDFElement(graph, iwidget, self.WIRE_M, 'readonly', 'false', optional=True)
            self.assertRDFCount(graph, iwidget, self.WIRE_M, 'hasiWidgetPreference', 2)
            username_found = password_found = False
            for preference in graph.objects(iwidget, self.WIRE_M['hasiWidgetPreference']):
                self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', u'false', optional=True)
                self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', u'false', optional=True)
                name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                if unicode(name) == u'username':
                    username_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', u'test_username')
                elif unicode(name) == u'password':
                    password_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', u'test_password')
                else:
                    self.fail()

            self.assertTrue(username_found and password_found)

        self.check_empty_rdf_wiring_info(graph, mashup_uri)

    def test_build_rdf_template_from_workspace_read_only_widgets(self):

        # Workspace with iwidgets
        options = {
            'vendor': u'Wirecloud Test Suite',
            'name': u'Test Mashup',
            'version': u'1',
            'author': u'test',
            'email': u'a@b.com',
            'readOnlyWidgets': True,
        }
        graph = build_rdf_template_from_workspace(options, self.workspace_with_iwidgets, self.user)
        mashup_uri = graph.subjects(self.RDF['type'], self.WIRE_M['Mashup']).next()
        self.check_basic_rdf_workspace_template_info(graph, mashup_uri)

        self.assertRDFCount(graph, mashup_uri, self.WIRE_M, 'hasTab', 1)

        tab = graph.objects(mashup_uri, self.WIRE_M['hasTab']).next()
        self.assertRDFElement(graph, tab, self.DCTERMS, 'title', u'tab')
        self.assertRDFCount(graph, tab, self.WIRE_M, 'hasiWidget', 2)
        for iwidget in graph.objects(tab, self.WIRE_M['hasiWidget']):
            self.assertRDFElement(graph, iwidget, self.WIRE_M, 'readonly', 'true')
            self.assertRDFCount(graph, iwidget, self.WIRE_M, 'hasiWidgetPreference', 2)
            username_found = password_found = False
            for preference in graph.objects(iwidget, self.WIRE_M['hasiWidgetPreference']):
                self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', u'false', optional=True)
                self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', u'false', optional=True)
                name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                if unicode(name) == u'username':
                    username_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', u'test_username')
                elif unicode(name) == u'password':
                    password_found = True
                    self.assertRDFElement(graph, preference, self.WIRE, 'value', u'test_password')
                else:
                    self.fail()

            self.assertTrue(username_found and password_found)

        self.check_empty_rdf_wiring_info(graph, mashup_uri)
    test_build_rdf_template_from_workspace_read_only_widgets.tags = ('next',)

    def test_build_rdf_template_from_workspace_forced_values(self):

        # Workspace with iwidgets
        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'author': 'test',
            'email': 'a@b.com',
            'readOnlyWidgets': False,
            'parametrization': {
                'iwidgets': {
                    '1': {
                        'username': {'source': 'current', 'status': 'readonly', 'value': 'default'},
                        'password': {'source': 'current', 'status': 'hidden', 'value': 'initial text'},
                    }
                },
                'ioperators': {}
            },
        }
        graph = build_rdf_template_from_workspace(options, self.workspace_with_iwidgets, self.user)
        mashup_uri = graph.subjects(self.RDF['type'], self.WIRE_M['Mashup']).next()
        self.check_basic_rdf_workspace_template_info(graph, mashup_uri)

        tab = graph.objects(mashup_uri, self.WIRE_M['hasTab']).next()
        self.assertRDFCount(graph, tab, self.WIRE_M, 'hasiWidget', 2)
        for iwidget in graph.objects(tab, self.WIRE_M['hasiWidget']):

            name = unicode(self.get_rdf_element(graph, iwidget, self.DCTERMS, 'title'))

            self.assertRDFCount(graph, iwidget, self.WIRE_M, 'hasiWidgetPreference', 2)
            preferences = graph.objects(iwidget, self.WIRE_M['hasiWidgetPreference'])

            username_found = password_found = False

            if name == 'Test Widget':

                for preference in preferences:
                    self.assertRDFElement(graph, preference, self.WIRE_M, 'readonly', u'true')
                    name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                    if unicode(name) == u'username':
                        username_found = True
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', u'false', optional=True)
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', u'default')
                    elif unicode(name) == u'password':
                        password_found = True
                        self.assertRDFElement(graph, preference, self.WIRE_M, 'hidden', u'true')
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', u'initial text')
                    else:
                        self.fail()

            elif name == 'Test Widget 2':

                for preference in preferences:
                    name = self.get_rdf_element(graph, preference, self.DCTERMS, 'title')
                    if unicode(name) == u'username':
                        username_found = True
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', u'test_username')
                    elif unicode(name) == u'password':
                        password_found = True
                        self.assertRDFElement(graph, preference, self.WIRE, 'value', u'test_password')
                    else:
                        self.fail()

            self.assertTrue(username_found and password_found)
    test_build_rdf_template_from_workspace_forced_values.tags = ('next',)

    def test_build_rdf_template_from_workspace_utf8_char(self):
        options = {
            'vendor': u'Wirecloud Test Suite',
            'name': u'Test Mashup with ñ',
            'version': u'1',
            'author': u'author with é',
            'email': u'a@b.com',
            'readOnlyWidgets': True,
        }

        graph = build_rdf_template_from_workspace(options, self.workspace, self.user)
        mashup_uri = graph.subjects(self.RDF['type'], self.WIRE_M['Mashup']).next()

        self.assertRDFElement(graph, mashup_uri, self.DCTERMS, 'title', u'Test Mashup with ñ')
        self.assertRDFElement(graph, mashup_uri, self.USDL, 'versionInfo', u'1')

        vendor = graph.objects(mashup_uri, self.USDL['hasProvider']).next()
        self.assertRDFElement(graph, vendor, self.FOAF, 'name', u'Wirecloud Test Suite')

        addr = graph.objects(mashup_uri, self.VCARD['addr']).next()
        self.assertRDFElement(graph, addr, self.VCARD, 'email', u'a@b.com')

        author = graph.objects(mashup_uri, self.DCTERMS['creator']).next()
        self.assertRDFElement(graph, author, self.FOAF, 'name', u'author with é')


class ParameterizedWorkspaceParseTestCase(CacheTestCase):

    fixtures = ('selenium_test_data',)
    tags = ('fiware-ut-2',)

    @classmethod
    def setUpClass(cls):

        super(ParameterizedWorkspaceParseTestCase, cls).setUpClass()

        # catalogue deployer
        cls.old_catalogue_deployer = catalogue.wgt_deployer
        cls.catalogue_tmp_dir = mkdtemp()
        catalogue.wgt_deployer = WgtDeployer(cls.catalogue_tmp_dir)

        cls.widget_wgt_file = open(os.path.join(cls.shared_test_data_dir, 'Wirecloud_Test_1.0.wgt'))
        cls.widget_wgt = WgtFile(cls.widget_wgt_file)
        catalogue.add_widget_from_wgt(cls.widget_wgt_file, None, wgt_file=cls.widget_wgt, deploy_only=True)

        cls.operator_wgt_file = open(os.path.join(cls.shared_test_data_dir, 'Wirecloud_TestOperator_1.0.zip'), 'rb')
        cls.operator_wgt = WgtFile(cls.operator_wgt_file)
        catalogue.add_widget_from_wgt(cls.operator_wgt_file, None, wgt_file=cls.operator_wgt, deploy_only=True)

    @classmethod
    def tearDownClass(cls):

        catalogue.wgt_deployer = cls.old_catalogue_deployer
        rmtree(cls.catalogue_tmp_dir, ignore_errors=True)

        cls.widget_wgt_file.close()
        cls.operator_wgt_file.close()

        super(ParameterizedWorkspaceParseTestCase, cls).tearDownClass()

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

        iwidget1_vars = iwidget1['variables']

        self.assertEqual(iwidget1_vars['list']['value'], 'default')
        self.assertEqual(iwidget1_vars['list']['hidden'], True)
        self.assertEqual(iwidget1_vars['list']['readonly'], True)

        self.assertEqual(iwidget1_vars['text']['value'], 'initial text')
        self.assertEqual(iwidget1_vars['text']['hidden'], False)
        self.assertEqual(iwidget1_vars['text']['readonly'], True)

        # Check iwidget 2 data
        self.assertEqual(iwidget1.get('readonly', False), False)

        iwidget2_vars = iwidget2['variables']

        self.assertEqual(iwidget2_vars['list']['value'], 'value1')
        self.assertEqual(iwidget2_vars['list'].get('hidden', False), False)
        self.assertEqual(iwidget2_vars['list'].get('readonly', False), False)

        self.assertEqual(iwidget2_vars['text']['value'], 'value2')
        self.assertEqual(iwidget2_vars['text'].get('hidden', False), False)
        self.assertEqual(iwidget2_vars['text'].get('readonly', False), False)

    def check_workspace_with_params(self, workspace):

        workspace_data = json.loads(get_global_workspace_data(workspace, self.user).get_data())
        self.assertEqual(workspace_data['extra_prefs'], {'param': {'type': 'text', 'inheritable': False, 'label': u'Parameter'}})

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
        iwidget1_vars = iwidget1['variables']

        self.assertEqual(iwidget1_vars['text']['value'], 'initial world')
        self.assertEqual(iwidget1_vars['text'].get('hidden', False), False)
        self.assertEqual(iwidget1_vars['text']['readonly'], True)

        # Check iwidget 2 data
        iwidget2_vars = iwidget2['variables']

        self.assertEqual(iwidget2_vars['text']['value'], 'initial world')
        self.assertEqual(iwidget2_vars['text']['hidden'], True)
        self.assertEqual(iwidget2_vars['text']['readonly'], True)

        # Check iwidget 3 data
        iwidget3_vars = iwidget3['variables']

        self.assertEqual(iwidget3_vars['text']['value'], 'initial %(params.param)')
        self.assertEqual(iwidget3_vars['text'].get('hidden', False), False)
        self.assertEqual(iwidget3_vars['text'].get('readonly', False), False)

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
            self.assertEqual(t['name'][0:7], u'Pestaña')

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

    def test_complex_workspaces(self):
        template3 = self.read_template('wt3.xml')

        workspace, _junk = buildWorkspaceFromTemplate(template3, self.user)
        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())

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
        self.assertEqual(len(wiring_status['connections']), 1)
        self.assertEqual(wiring_status['connections'][0]['source']['type'], 'iwidget')
        self.assertEqual(wiring_status['connections'][0]['source']['endpoint'], 'event')
        self.assertEqual(wiring_status['connections'][0]['target']['type'], 'iwidget')
        self.assertEqual(wiring_status['connections'][0]['target']['endpoint'], 'slot')

    def test_complex_workspaces_rdf(self):
        template = self.read_template('wt3.rdf')
        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)

        data = json.loads(get_global_workspace_data(workspace, self.user).get_data())

        self.assertEqual(len(data['tabs']), 4)
        self.assertEqual(data['tabs'][0]['name'], u'Tab')
        self.assertEqual(len(data['tabs'][0]['iwidgets']), 1)
        self.assertEqual(data['tabs'][1]['name'], u'Tab 2')
        self.assertEqual(len(data['tabs'][1]['iwidgets']), 1)
        self.assertEqual(data['tabs'][2]['name'], u'Tab 3')
        self.assertEqual(len(data['tabs'][2]['iwidgets']), 0)
        self.assertEqual(data['tabs'][3]['name'], u'Tab 4')
        self.assertEqual(len(data['tabs'][3]['iwidgets']), 0)

        wiring = data['wiring']
        self.assertEqual(len(wiring['connections']), 1)
        self.assertEqual(wiring['connections'][0]['source']['type'], 'iwidget')
        self.assertEqual(wiring['connections'][0]['source']['endpoint'], 'event')
        self.assertEqual(wiring['connections'][0]['target']['type'], 'iwidget')
        self.assertEqual(wiring['connections'][0]['target']['endpoint'], 'slot')

    def test_workspace_with_params(self):
        template = self.read_template('wt5.xml')

        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)
        self.check_workspace_with_params(workspace)

    def test_workspace_with_params_rdf(self):
        template = self.read_template('wt5.rdf')

        workspace, _junk = buildWorkspaceFromTemplate(template, self.user)
        self.check_workspace_with_params(workspace)
