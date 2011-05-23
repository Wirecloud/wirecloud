# -*- coding: utf-8 -*-

import codecs
import os

from lxml import etree
from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.utils import simplejson

from commons.get_data import get_global_workspace_data
from connectable.models import InOut
from gadget.models import Gadget
from igadget.utils import SaveIGadget, deleteIGadget
from workspace.mashupTemplateGenerator import build_template_from_workspace
from workspace.mashupTemplateParser import buildWorkspaceFromTemplate, fillWorkspaceUsingTemplate
from workspace.models import WorkSpace, UserWorkSpace, Tab, VariableValue
from workspace.views import createEmptyWorkSpace, linkWorkspace


class WorkspaceTestCase(TestCase):
    fixtures = ['test_data']

    def setUp(self):
        super(WorkspaceTestCase, self).setUp()

        self.user = User.objects.get(username='test')

    def testGetGlobalWorkspaceData(self):

        workspace = WorkSpace.objects.get(pk=1)
        data = get_global_workspace_data(workspace, self.user)
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

        data = get_global_workspace_data(workspace, self.user)
        self.assertEqual('workspace' in data, True)

    def testVariableValuesCacheInvalidation(self):

        workspace = WorkSpace.objects.get(pk=1)
        # Fill cache
        data = get_global_workspace_data(workspace, self.user)

        client = Client()
        put_data = {
            'igadgetVars': [
                {'id': 1, 'value': 'new_password'},
                {'id': 2, 'value': 'new_username'},
                {'id': 3, 'value': 'new_data'}
            ]
        }
        put_data = simplejson.dumps(put_data, ensure_ascii=False)
        client.login(username='test', password='test')
        client.put('/workspace/1/variables', put_data, content_type='application/json', HTTP_HOST='localhost', HTTP_REFERER='http://localhost')

        data = get_global_workspace_data(workspace, self.user)
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

        data = get_global_workspace_data(workspace, self.user)

        igadget_list = data['workspace']['tabList'][0]['igadgetList']
        self.assertEqual(len(igadget_list), 2)

        # Remove the igadget
        deleteIGadget(created_igadget, self.user)
        data = get_global_workspace_data(workspace, self.user)
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
        get_global_workspace_data(self.workspace, self.user)
        self.assertEqual(self.workspace.name, 'Testing')

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
