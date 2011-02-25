import codecs
import os

from lxml import etree
from django.contrib.auth.models import User
from django.test import TestCase

from commons.get_data import get_global_workspace_data
from connectable.models import InOut
from workspace.mashupTemplateGenerator import build_template_from_workspace
from workspace.mashupTemplateParser import buildWorkspaceFromTemplate, fillWorkspaceUsingTemplate
from workspace.models import UserWorkSpace, Tab, WorkSpaceVariable
from workspace.views import createEmptyWorkSpace


class WorkspaceTestCase(TestCase):

    def setUp(self):

        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.workspace = createEmptyWorkSpace('Testing', self.user)

    def testCreateEmptyWorkspace(self):

        user_workspace = UserWorkSpace.objects.filter(user=self.user, workspace=self.workspace)
        self.assertEqual(user_workspace.count(), 1)
        self.assertEqual(user_workspace[0].active, True)

        workspace_tabs = Tab.objects.filter(workspace=self.workspace)
        self.assertEqual(workspace_tabs.count(), 1)

    def testGetGlobalWorkspaceData(self):

        data = get_global_workspace_data(self.workspace, self.user)
        self.assertEqual('workspace' in data, True)


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
        workspace = buildWorkspaceFromTemplate(self.template1, self.user)
        get_global_workspace_data(self.workspace, self.user)

        channel_vars = WorkSpaceVariable.objects.filter(workspace=workspace, aspect='CHANNEL')
        self.assertEqual(channel_vars.count(), 1)

        connectable = InOut.objects.get(workspace_variable=channel_vars[0])
        self.assertEqual(connectable.readOnly, False)

    def testBlockedChannels(self):
        workspace = buildWorkspaceFromTemplate(self.template2, self.user)

        channel_vars = WorkSpaceVariable.objects.filter(workspace=workspace, aspect='CHANNEL')
        self.assertEqual(channel_vars.count(), 1)

        connectable = InOut.objects.get(workspace_variable=channel_vars[0])
        self.assertEqual(connectable.readOnly, True)
