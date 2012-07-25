# -*- coding: utf-8 -*-

import codecs
import os
import rdflib
import json

from django.contrib.auth.models import User, Group
from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.test import Client, TransactionTestCase
from django.utils import simplejson

from commons.get_data import get_global_workspace_data
from wirecloud.models import Gadget, IGadget, Tab, UserWorkSpace, Variable, VariableValue, WorkSpace
from wirecloud.iwidget.utils import SaveIGadget, deleteIGadget
from wirecloud.workspace.packageCloner import PackageCloner
from wirecloud.workspace.mashupTemplateGenerator import build_template_from_workspace, build_rdf_template_from_workspace, build_usdl_from_workspace
from wirecloud.workspace.mashupTemplateParser import buildWorkspaceFromTemplate, fillWorkspaceUsingTemplate
from wirecloud.workspace.utils import sync_base_workspaces
from wirecloud.workspace.views import createEmptyWorkSpace, linkWorkspace


# Avoid nose to repeat these tests (they are run through wirecloud/tests/__init__.py)
__test__ = False


class CacheTestCase(TransactionTestCase):

    def setUp(self):
        super(CacheTestCase, self).setUp()
        cache.clear()


class WorkspaceTestCase(CacheTestCase):

    fixtures = ('test_data',)

    def setUp(self):
        super(WorkspaceTestCase, self).setUp()

        self.user = User.objects.get(username='test')

    def test_get_global_workspace_data(self):

        workspace = WorkSpace.objects.get(pk=1)
        data = get_global_workspace_data(workspace, self.user).get_data()
        self.assertEqual('workspace' in data, True)
        self.assertEqual(len(data['workspace']['tabList']), 1)

        tab = data['workspace']['tabList'][0]
        variables = tab['igadgetList'][0]['variables']
        self.assertEqual(variables['password']['value'], '')
        self.assertEqual(variables['password']['secure'], True)
        self.assertEqual(variables['username']['value'], 'test_username')
        self.assertEqual(variables['prop']['value'], 'test_data')
    test_get_global_workspace_data.tags = ('fiware-ut-3',)

    def test_create_empty_workspace(self):

        workspace = createEmptyWorkSpace('Testing', self.user)

        user_workspace = UserWorkSpace.objects.filter(user=self.user, workspace=workspace)
        self.assertEqual(user_workspace.count(), 1)
        self.assertEqual(user_workspace[0].active, True)

        workspace_tabs = Tab.objects.filter(workspace=workspace)
        self.assertEqual(workspace_tabs.count(), 1)

        data = get_global_workspace_data(workspace, self.user).get_data()
        self.assertEqual('workspace' in data, True)
        self.assertEqual(data['workspace']['owned'], True)
        self.assertEqual(data['workspace']['shared'], False)
    test_create_empty_workspace.tags = ('fiware-ut-3',)

    def test_link_workspace(self):

        workspace = WorkSpace.objects.get(pk=1)

        alternative_user = User.objects.get(username='test2')
        new_workspace = linkWorkspace(alternative_user, workspace.id, self.user)

        all_variables = VariableValue.objects.filter(variable__igadget__tab__workspace=workspace)
        initial_vars = all_variables.filter(user=self.user)
        cloned_vars = all_variables.filter(user=alternative_user)

        self.assertEqual(new_workspace.user, alternative_user)
        self.assertEqual(workspace.creator, self.user)
        self.assertEqual(new_workspace.workspace, workspace)
        self.assertEqual(initial_vars.count(), cloned_vars.count())

    def test_clone_workspace(self):

        workspace = WorkSpace.objects.get(pk=1)

        packageCloner = PackageCloner()
        cloned_workspace = packageCloner.clone_tuple(workspace)

        self.assertNotEqual(workspace, cloned_workspace)
        self.assertEqual(cloned_workspace.users.count(), 0)

        original_igadgets = IGadget.objects.filter(tab__workspace=workspace)
        cloned_igadgets = IGadget.objects.filter(tab__workspace=cloned_workspace)
        self.assertEqual(original_igadgets.count(), cloned_igadgets.count())
        self.assertNotEqual(original_igadgets[0].id, cloned_igadgets[0].id)

        original_variables = Variable.objects.filter(igadget__tab__workspace=workspace)
        cloned_variables = Variable.objects.filter(igadget__tab__workspace=cloned_workspace)

        self.assertEqual(original_variables.count(), cloned_variables.count())
        self.assertNotEqual(original_variables[0].id, cloned_variables[0].id)

    def test_merge_workspaces(self):

        workspace = WorkSpace.objects.get(pk=1)

        packageCloner = PackageCloner()
        cloned_workspace = packageCloner.clone_tuple(workspace)
        linkWorkspace(self.user, cloned_workspace.id, self.user)

        packageCloner = PackageCloner()
        packageCloner.merge_workspaces(cloned_workspace, workspace, self.user)

        # Check cache invalidation
        data = get_global_workspace_data(workspace, self.user).get_data()
        tab_list = data['workspace']['tabList']

        self.assertEqual(len(tab_list), 2)

    def test_shared_workspace(self):

        workspace = WorkSpace.objects.get(pk=1)

        # Create a new group and share the workspace with it
        group = Group.objects.create(name='test_users')
        workspace.targetOrganizations.add(group)

        other_user = User.objects.get(username='test2')
        other_user.groups.add(group)
        other_user.save()

        # Sync shared workspaces
        sync_base_workspaces(other_user)

        # Check that other_user can access to the shared workspace
        data = get_global_workspace_data(workspace, other_user).get_data()
        igadget_list = data['workspace']['tabList'][0]['igadgetList']
        self.assertEqual(len(igadget_list), 2)

        # Add a new iGadget to the workspace
        tab = Tab.objects.get(pk=1)
        igadget_data = {
            'gadget': '/Test/Test Gadget/1.0.0',
            'name': 'test',
            'top': 0,
            'left': 0,
            'width': 2,
            'height': 2,
            'zIndex': 1,
            'layout': 0,
            'icon_top': 0,
            'icon_left': 0,
            'menu_color': '',
        }
        Gadget.objects.get(pk=1).users.add(self.user)
        SaveIGadget(igadget_data, self.user, tab, {})

        data = get_global_workspace_data(workspace, other_user).get_data()
        igadget_list = data['workspace']['tabList'][0]['igadgetList']
        self.assertEqual(len(igadget_list), 3)


class WorkspaceCacheTestCase(CacheTestCase):

    fixtures = ('test_data',)
    tags = ('fiware-ut-3',)

    def setUp(self):
        super(WorkspaceCacheTestCase, self).setUp()

        self.user = User.objects.get(username='test')
        self.workspace = WorkSpace.objects.get(pk=1)

        # Fill cache
        get_global_workspace_data(self.workspace, self.user)

    def test_variable_updating_invalidates_cache(self):

        client = Client()
        put_data = {
            'igadgetVars': [
                {'id': 1, 'value': 'new_password'},
                {'id': 2, 'value': 'new_username'},
                {'id': 4, 'value': 'new_data'},
            ],
        }
        put_data = simplejson.dumps(put_data, ensure_ascii=False).encode('utf-8')
        client.login(username='test', password='test')
        result = client.put(reverse('wirecloud.variable_collection', kwargs={'workspace_id': 1}), put_data, content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(result.status_code, 200)

        data = get_global_workspace_data(self.workspace, self.user).get_data()
        variables = data['workspace']['tabList'][0]['igadgetList'][0]['variables']
        self.assertEqual(variables['password']['value'], '')
        self.assertEqual(variables['password']['secure'], True)
        self.assertEqual(variables['username']['value'], 'new_username')
        self.assertEqual(variables['prop']['value'], 'new_data')

    def test_widget_instantiation_invalidates_cache(self):

        tab = Tab.objects.get(pk=1)
        igadget_data = {
            'gadget': '/Test/Test Gadget/1.0.0',
            'name': 'test',
            'top': 0,
            'left': 0,
            'width': 2,
            'height': 2,
            'zIndex': 1,
            'layout': 0,
            'icon_top': 0,
            'icon_left': 0,
            'menu_color': '',
        }
        Gadget.objects.get(pk=1).users.add(self.user)
        SaveIGadget(igadget_data, self.user, tab, {})

        data = get_global_workspace_data(self.workspace, self.user).get_data()

        igadget_list = data['workspace']['tabList'][0]['igadgetList']
        self.assertEqual(len(igadget_list), 3)

    def test_widget_deletion_invalidates_cache(self):

        deleteIGadget(IGadget.objects.get(pk=1), self.user)
        data = get_global_workspace_data(self.workspace, self.user).get_data()
        igadget_list = data['workspace']['tabList'][0]['igadgetList']
        self.assertEqual(len(igadget_list), 1)


class ParamatrizedWorkspaceGenerationTestCase(TransactionTestCase):

    WIRE_M = rdflib.Namespace('http://wirecloud.conwet.fi.upm.es/ns/mashup#')
    FOAF = rdflib.Namespace('http://xmlns.com/foaf/0.1/')
    RDF = rdflib.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#')
    DCTERMS = rdflib.Namespace('http://purl.org/dc/terms/')
    USDL = rdflib.Namespace('http://www.linked-usdl.org/ns/usdl-core#')
    VCARD = rdflib.Namespace('http://www.w3.org/2006/vcard/ns#')

    fixtures = ['test_data']
    tags = ('fiware-ut-1',)

    def setUp(self):

        self.user = User.objects.get(username='test')
        self.workspace_with_iwidgets = WorkSpace.objects.get(pk=1)
        self.workspace = createEmptyWorkSpace('Testing', self.user)

    def assertXPathText(self, root_element, xpath, content):
        elements = root_element.xpath(xpath)
        self.assertEquals(len(elements), 1)
        self.assertEquals(elements[0].text, content)

    def assertXPathAttr(self, root_element, xpath, attr, content):
        elements = root_element.xpath(xpath)
        self.assertEquals(len(elements), 1)
        self.assertEquals(elements[0].get(attr), content)

    def assertXPathCount(self, root_element, xpath, count):
        elements = root_element.xpath(xpath)
        self.assertEquals(len(elements), count)

    def assertRDFElement(self, graph, element, ns, predicate, content):
        elements = graph.objects(element, ns[predicate])
        for e in elements:
            self.assertEquals(unicode(e), content)

    def assertRDFCount(self, graph, element, ns, predicate, count):
        num = 0
        for e in graph.objects(element, ns[predicate]):
            num = num + 1

        self.assertEquals(num, count)

    def testBuildTemplateFromWorkspace(self):

        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'author': 'test',
            'email': 'a@b.com',
            'readOnlyGadgets': True,
        }
        template = build_template_from_workspace(options, self.workspace, self.user)

        # Basic info
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Vendor', 'Wirecloud Test Suite')
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Name', 'Test Mashup')
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Version', '1')
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Author', 'test')
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Mail', 'a@b.com')

        # IWidgets
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab', 1)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]', 'name', 'Tab')
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/IGadget', 0)

        # Workspace with iwidgets
        options = {
            'vendor': 'Wirecloud Test Suite',
            'name': 'Test Mashup',
            'version': '1',
            'author': 'test',
            'email': 'a@b.com',
            'readOnlyGadgets': True,
        }
        template = build_template_from_workspace(options, self.workspace_with_iwidgets, self.user)

        # Basic info
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Vendor', 'Wirecloud Test Suite')
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Name', 'Test Mashup')
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Version', '1')
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Author', 'test')
        self.assertXPathText(template, '/Template/Catalog.ResourceDescription/Mail', 'a@b.com')

        # IWidgets
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab', 1)
        self.assertXPathAttr(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]', 'name', 'tab')
        self.assertXPathCount(template, '/Template/Catalog.ResourceDescription/IncludedResources/Tab[1]/Resource', 2)

    def testBuildRdfTemplateFromWorkspace(self):

        options = {
            'vendor': u'Wirecloud Test Suite',
            'name': u'Test Mashup',
            'version': u'1',
            'author': u'test',
            'email': u'a@b.com',
            'readOnlyGadgets': True,
        }
        # Basic info
        graph = build_rdf_template_from_workspace(options, self.workspace, self.user)
        mashup_uri = graph.subjects(self.RDF['type'], self.WIRE_M['Mashup']).next()

        self.assertRDFElement(graph, mashup_uri, self.DCTERMS, 'title', u'Test Mashup')
        self.assertRDFElement(graph, mashup_uri, self.USDL, 'versionInfo', u'1')

        vendor = graph.objects(mashup_uri, self.USDL['hasProvider']).next()
        self.assertRDFElement(graph, vendor, self.FOAF, 'name', u'Wirecloud Test Suite')

        addr = graph.objects(mashup_uri, self.VCARD['addr']).next()
        self.assertRDFElement(graph, addr, self.VCARD, 'email', u'a@b.com')

        author = graph.objects(mashup_uri, self.DCTERMS['creator']).next()
        self.assertRDFElement(graph, author, self.FOAF, 'name', u'test')

        self.assertRDFCount(graph, mashup_uri, self.WIRE_M, 'hasTab', 1)

        tab = graph.objects(mashup_uri, self.WIRE_M['hasTab']).next()
        self.assertRDFElement(graph, tab, self.DCTERMS, 'title', u'Tab')

        # Workspace with iwidgets
        options = {
            'vendor': u'Wirecloud Test Suite',
            'name': u'Test Mashup',
            'version': u'1',
            'author': u'test',
            'email': u'a@b.com',
            'readOnlyGadgets': True,
        }
        graph = build_rdf_template_from_workspace(options, self.workspace_with_iwidgets, self.user)
        mashup_uri = graph.subjects(self.RDF['type'], self.WIRE_M['Mashup']).next()

        self.assertRDFElement(graph, mashup_uri, self.DCTERMS, 'title', u'Test Mashup')
        self.assertRDFElement(graph, mashup_uri, self.USDL, 'versionInfo', u'1')

        vendor = graph.objects(mashup_uri, self.USDL['hasProvider']).next()
        self.assertRDFElement(graph, vendor, self.FOAF, 'name', u'Wirecloud Test Suite')

        addr = graph.objects(mashup_uri, self.VCARD['addr']).next()
        self.assertRDFElement(graph, addr, self.VCARD, 'email', u'a@b.com')

        author = graph.objects(mashup_uri, self.DCTERMS['creator']).next()
        self.assertRDFElement(graph, author, self.FOAF, 'name', u'test')

        self.assertRDFCount(graph, mashup_uri, self.WIRE_M, 'hasTab', 1)

        tab = graph.objects(mashup_uri, self.WIRE_M['hasTab']).next()
        self.assertRDFElement(graph, tab, self.DCTERMS, 'title', u'tab')
        self.assertRDFCount(graph, tab, self.WIRE_M, 'hasiWidget', 2)

    def testBuildRdfTemplateFromWorkspaceUtf8Char(self):
        options = {
            'vendor': u'Wirecloud Test Suite',
            'name': u'Test Mashup with ñ',
            'version': u'1',
            'author': u'author with é',
            'email': u'a@b.com',
            'readOnlyGadgets': True,
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

    def testBuildUSDLFromWorkspace(self):

        options = {
            'vendor': u'Wirecloud Test Suite',
            'name': u'Test Workspace',
            'version': u'1',
            'author': u'test',
            'email': u'a@b.com',
            'readOnlyGadgets': True,
        }
        graph = build_usdl_from_workspace(options, self.workspace, self.user, 'http://wirecloud.conwet.fi.upm.es/ns/mashup#/Wirecloud%20Test%20Suite/Test%20Workspace/1')
        services = graph.subjects(self.RDF['type'], self.USDL['Service'])

        for service in services:
            if str(service) == str(self.WIRE_M[options['vendor'] + '/' + options['name'] + '/' + options['version']]):
                service_uri = service
                break
        else:
            raise Exception

        self.assertRDFElement(graph, service_uri, self.DCTERMS, 'title', u'Test Workspace')
        self.assertRDFElement(graph, service_uri, self.USDL, 'versionInfo', u'1')
        vendor = graph.objects(service_uri, self.USDL['hasProvider']).next()
        self.assertRDFElement(graph, vendor, self.FOAF, 'name', u'Wirecloud Test Suite')


class ParametrizedWorkspaceParseTestCase(CacheTestCase):

    fixtures = ('selenium_test_data',)
    tags = ('fiware-ut-2',)

    def setUp(self):

        super(ParametrizedWorkspaceParseTestCase, self).setUp()
        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.workspace = createEmptyWorkSpace('Testing', self.user)
        self.template1 = self.read_template('wt1.xml')
        self.template2 = self.read_template('wt2.xml')
        self.rdfTemplate1 = self.read_template('wt1.rdf')
        self.rdfTemplate2 = self.read_template('wt2.rdf')
        self.rdfTemplate3 = self.read_template('wt3.rdf')
        self.rdfTemplate4 = self.read_template('wt4.rdf')

    def read_template(self, filename):
        f = codecs.open(os.path.join(os.path.dirname(__file__), 'test-data', filename), 'rb')
        contents = f.read()
        f.close()

        return contents

    def testFillWorkspaceUsingTemplate(self):
        fillWorkspaceUsingTemplate(self.workspace, self.template1)
        data = get_global_workspace_data(self.workspace, self.user).get_data()
        self.assertEqual(self.workspace.name, 'Testing')
        self.assertEqual(len(data['workspace']['tabList']), 2)

        # Workspace template 2 adds a new Tab
        fillWorkspaceUsingTemplate(self.workspace, self.template2)
        data = get_global_workspace_data(self.workspace, self.user).get_data()
        self.assertEqual(len(data['workspace']['tabList']), 3)

        # Check that we handle the case where there are 2 tabs with the same name
        fillWorkspaceUsingTemplate(self.workspace, self.template2)
        data = get_global_workspace_data(self.workspace, self.user).get_data()
        self.assertEqual(len(data['workspace']['tabList']), 4)
        self.assertNotEqual(data['workspace']['tabList'][2]['name'],
            data['workspace']['tabList'][3]['name'])

    def testBuildWorkspaceFromTemplate(self):
        workspace, _junk = buildWorkspaceFromTemplate(self.template1, self.user)
        get_global_workspace_data(self.workspace, self.user)

        wiring_status = json.loads(workspace.wiringStatus)
        self.assertEqual(len(wiring_status['connections']), 1)
        self.assertEqual(wiring_status['connections'][0]['readonly'], False)

    def testBuildWorkspaceFromRdfTemplate(self):
        workspace, _junk = buildWorkspaceFromTemplate(self.rdfTemplate1, self.user)
        get_global_workspace_data(self.workspace, self.user)

        wiring_status = json.loads(workspace.wiringStatus)
        self.assertEqual(len(wiring_status['connections']), 1)
        self.assertEqual(wiring_status['connections'][0]['readonly'], False)

    def testBuildWorkspaceFromRdfTemplateUtf8Char(self):
        workspace, _junk = buildWorkspaceFromTemplate(self.rdfTemplate4, self.user)
        data = get_global_workspace_data(workspace, self.user).get_data()

        for t in data['workspace']['tabList']:
            self.assertEqual(t['name'][0:7], u'Pestaña')

    def testBlockedConnections(self):
        workspace, _junk = buildWorkspaceFromTemplate(self.template2, self.user)

        wiring_status = json.loads(workspace.wiringStatus)
        self.assertEqual(len(wiring_status['connections']), 1)
        self.assertEqual(wiring_status['connections'][0]['readonly'], True)

    def testBloquedConnectionsRdf(self):
        workspace, _junk = buildWorkspaceFromTemplate(self.rdfTemplate2, self.user)

        wiring_status = json.loads(workspace.wiringStatus)
        self.assertEqual(len(wiring_status['connections']), 1)
        self.assertEqual(wiring_status['connections'][0]['readonly'], True)

    def test_complex_workspaces(self):
        template3 = self.read_template('wt3.xml')

        workspace, _junk = buildWorkspaceFromTemplate(template3, self.user)
        data = get_global_workspace_data(workspace, self.user).get_data()

        self.assertEqual(len(data['workspace']['tabList']), 4)
        self.assertEqual(data['workspace']['tabList'][0]['name'], 'Tab')
        self.assertEqual(len(data['workspace']['tabList'][0]['igadgetList']), 1)
        self.assertEqual(data['workspace']['tabList'][1]['name'], 'Tab 2')
        self.assertEqual(len(data['workspace']['tabList'][1]['igadgetList']), 1)
        self.assertEqual(data['workspace']['tabList'][2]['name'], 'Tab 3')
        self.assertEqual(len(data['workspace']['tabList'][2]['igadgetList']), 0)
        self.assertEqual(data['workspace']['tabList'][3]['name'], 'Tab 4')
        self.assertEqual(len(data['workspace']['tabList'][3]['igadgetList']), 0)

    def testComplexWorkspacesRdf(self):
        workspace, _junk = buildWorkspaceFromTemplate(self.rdfTemplate3, self.user)

        data = get_global_workspace_data(workspace, self.user).get_data()

        self.assertEqual(len(data['workspace']['tabList']), 4)
        self.assertEqual(data['workspace']['tabList'][0]['name'], u'Tab')
        self.assertEqual(len(data['workspace']['tabList'][0]['igadgetList']), 1)
        self.assertEqual(data['workspace']['tabList'][1]['name'], u'Tab 2')
        self.assertEqual(len(data['workspace']['tabList'][1]['igadgetList']), 1)
        self.assertEqual(data['workspace']['tabList'][2]['name'], u'Tab 3')
        self.assertEqual(len(data['workspace']['tabList'][2]['igadgetList']), 0)
        self.assertEqual(data['workspace']['tabList'][3]['name'], u'Tab 4')
        self.assertEqual(len(data['workspace']['tabList'][3]['igadgetList']), 0)

        wiring = json.loads(data['workspace']['wiring'])
        self.assertEqual(len(wiring['connections']), 1)
        self.assertEqual(wiring['connections'][0]['source']['type'], 'iwidget')
        self.assertEqual(wiring['connections'][0]['source']['endpoint'], 'event')
        self.assertEqual(wiring['connections'][0]['target']['type'], 'iwidget')
        self.assertEqual(wiring['connections'][0]['target']['endpoint'], 'slot')
