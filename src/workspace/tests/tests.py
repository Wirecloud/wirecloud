# -*- coding: utf-8 -*-

import codecs
import os

from lxml import etree
from django.contrib.auth.models import User, Group
from django.core.cache import cache
from django.test import Client, TestCase
from django.utils import simplejson

from commons.get_data import get_global_workspace_data
from connectable.models import InOut
from gadget.models import Gadget
from igadget.models import IGadget, Variable
from igadget.utils import SaveIGadget, deleteIGadget
from workspace.packageCloner import PackageCloner
from workspace.mashupTemplateGenerator import build_template_from_workspace
from workspace.mashupTemplateParser import buildWorkspaceFromTemplate, fillWorkspaceUsingTemplate
from workspace.models import WorkSpace, UserWorkSpace, Tab, VariableValue
from workspace.utils import sync_base_workspaces
from workspace.views import createEmptyWorkSpace, linkWorkspace


# Avoid nose to repeat these tests (they are runned through __init__.py)
__test__ = False


class CacheTestCase(TestCase):

    def setUp(self):
        super(CacheTestCase, self).setUp()
        cache.clear()


class WorkspaceTestCase(CacheTestCase):
    fixtures = ['test_data']

    def setUp(self):
        super(WorkspaceTestCase, self).setUp()

        self.user = User.objects.get(username='test')

    def testGetGlobalWorkspaceData(self):

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

    def testCreateEmptyWorkspace(self):

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

    def testVariableValuesCacheInvalidation(self):

        workspace = WorkSpace.objects.get(pk=1)
        # Fill cache
        data = get_global_workspace_data(workspace, self.user)

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
        result = client.put('/workspace/1/variables', put_data, content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')
        self.assertEqual(result.status_code, 200)

        data = get_global_workspace_data(workspace, self.user).get_data()
        variables = data['workspace']['tabList'][0]['igadgetList'][0]['variables']
        self.assertEqual(variables['password']['value'], '')
        self.assertEqual(variables['password']['secure'], True)
        self.assertEqual(variables['username']['value'], 'new_username')
        self.assertEqual(variables['prop']['value'], 'new_data')

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
        created_igadget = SaveIGadget(igadget_data, self.user, tab, {})

        data = get_global_workspace_data(workspace, self.user).get_data()

        igadget_list = data['workspace']['tabList'][0]['igadgetList']
        self.assertEqual(len(igadget_list), 2)

        # Remove the igadget
        deleteIGadget(created_igadget, self.user)
        data = get_global_workspace_data(workspace, self.user).get_data()
        igadget_list = data['workspace']['tabList'][0]['igadgetList']
        self.assertEqual(len(igadget_list), 1)

    def testLinkWorkspace(self):

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

    def testCloneWorkspace(self):

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

    def testMergeWorkspaces(self):

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
        self.assertEqual(len(igadget_list), 1)

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
        self.assertEqual(len(igadget_list), 2)


class ParamatrizedWorkspaceGenerationTestCase(TestCase):
    fixtures = ['test_workspace']

    def setUp(self):

        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.workspace = createEmptyWorkSpace('Testing', self.user)

    def testBuildTemplateFromWorkspace(self):

        options = {
            'vendor': 'EzWeb Test Suite',
            'name': 'Test Workspace',
            'version': '1',
            'author': 'test',
            'email': 'a@b.com',
            'readOnlyGadgets': True,
        }
        template = build_template_from_workspace(options, self.workspace, self.user)
        etree.fromstring(template)


class ParametrizedWorkspaceParseTestCase(TestCase):

    def setUp(self):

        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.workspace = createEmptyWorkSpace('Testing', self.user)

        f = codecs.open(os.path.join(os.path.dirname(__file__), 'wt1.xml'), 'rb')
        self.template1 = f.read()
        f.close()

        f = codecs.open(os.path.join(os.path.dirname(__file__), 'wt2.xml'), 'rb')
        self.template2 = f.read()
        f.close()

    def testFillWorkspaceUsingTemplate(self):
        fillWorkspaceUsingTemplate(self.workspace, self.template1)
        data = get_global_workspace_data(self.workspace, self.user).get_data()
        self.assertEqual(self.workspace.name, 'Testing')
        self.assertEqual(len(data['workspace']['tabList']), 1)

        # Workspace template 2 adds a new Tab
        fillWorkspaceUsingTemplate(self.workspace, self.template2)
        data = get_global_workspace_data(self.workspace, self.user).get_data()
        self.assertEqual(len(data['workspace']['tabList']), 2)

        # Check that we handle the case where there are 2 tabs with the same name
        fillWorkspaceUsingTemplate(self.workspace, self.template2)
        data = get_global_workspace_data(self.workspace, self.user).get_data()
        self.assertEqual(len(data['workspace']['tabList']), 3)

    def testBuildWorkspaceFromTemplate(self):
        workspace, _junk = buildWorkspaceFromTemplate(self.template1, self.user)
        get_global_workspace_data(self.workspace, self.user)

        channels = InOut.objects.filter(workspace=workspace)
        self.assertEqual(channels.count(), 1)
        self.assertEqual(channels[0].readOnly, False)

    def testBlockedChannels(self):
        workspace, _junk = buildWorkspaceFromTemplate(self.template2, self.user)

        connectables = InOut.objects.filter(workspace=workspace)
        self.assertEqual(connectables.count(), 1)
        self.assertEqual(connectables[0].readOnly, True)
