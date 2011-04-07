# -*- coding: utf-8 -*-

import codecs
import os

from lxml import etree
from django.contrib.auth.models import User
from django.test import Client, TestCase

from commons.get_data import get_global_workspace_data
from commons.test import LocalizedTestCase
from connectable.models import InOut
from workspace.mashupTemplateGenerator import build_template_from_workspace
from workspace.mashupTemplateParser import buildWorkspaceFromTemplate, fillWorkspaceUsingTemplate
from workspace.models import WorkSpace, UserWorkSpace, Tab, WorkSpaceVariable
from workspace.views import createEmptyWorkSpace


class WorkspaceTestCase(LocalizedTestCase):
    fixtures = ['test_data']

    def setUp(self):
        super(WorkspaceTestCase, self).setUp()

        self.user = User.objects.get(username='test')

    def testGetGlobalWorkspaceData(self):

        workspace = WorkSpace.objects.get(pk=1)
        data = get_global_workspace_data(workspace, self.user)
        self.assertEqual('workspace' in data, True)
        self.assertEqual(len(data['workspace']['tabList']), 1)

    def testCreateEmptyWorkspace(self):

        workspace = createEmptyWorkSpace('Testing', self.user)

        user_workspace = UserWorkSpace.objects.filter(user=self.user, workspace=workspace)
        self.assertEqual(user_workspace.count(), 1)
        self.assertEqual(user_workspace[0].active, True)

        workspace_tabs = Tab.objects.filter(workspace=workspace)
        self.assertEqual(workspace_tabs.count(), 1)

        data = get_global_workspace_data(workspace, self.user)
        self.assertEqual('workspace' in data, True)

    def vars_by_name(self, igadget_data):
        variables = {}

        for var in igadget_data['variables']:
            variables[var['name']] = var

        return variables

    def testTranslations(self):

        workspace = WorkSpace.objects.get(pk=1)

        self.changeLanguage('en')
        data = get_global_workspace_data(workspace, self.user)

        igadget_data = data['workspace']['tabList'][0]['igadgetList'][0]
        igadget_vars = self.vars_by_name(igadget_data)
        self.assertEqual(igadget_vars['password']['label'], 'Password Pref')
        #self.assertEqual(igadget_vars['slot']['action_label'], 'Slot Action Label')

        self.changeLanguage('es')
        data = get_global_workspace_data(workspace, self.user)

        igadget_data = data['workspace']['tabList'][0]['igadgetList'][0]
        igadget_vars = self.vars_by_name(igadget_data)
        self.assertEqual(igadget_vars['password']['label'], u'Contraseña')
        #self.assertEqual(igadget_vars['slot']['action_label'], 'Etiqueta de acción del slot')

    def testVariableValuesCacheInvalidation(self):

        workspace = WorkSpace.objects.get(pk=1)
        # Fill cache
        data = get_global_workspace_data(workspace, self.user)

        c = Client()
        put_data = {
            'igadgetVars': {'id': 1, 'value': 'new_value'},
        }
        c.put('workspace/1/variables', put_data, HTTP_HOST='localhost', HTTP_REFERER='http://localhost')

        data = get_global_workspace_data(workspace, self.user)
        variables = data['workspace']['tabList'][0]['igadgetList'][0]['variables']
        for variable in variables:
            if variable['id'] == 1:
                self.assertEqual(variable['value'], 'new_value')
                break


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
