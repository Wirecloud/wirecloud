# -*- coding: utf-8 -*-

# Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid

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


import json
import os
import shutil

from django.core.urlresolvers import reverse
from django.test import Client

from wirecloud.catalogue import utils as catalogue
from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.testcases import WirecloudTestCase
from wirecloud.platform.models import IWidget, Tab, VariableValue, Workspace, UserWorkspace


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


def check_get_requires_permission(self, url):

    # Authenticate
    self.client.login(username='emptyuser', password='admin')

    response = self.client.get(url, HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 403)


def check_get_requires_authentication(self, url, test_after_request=None):

    response = self.client.get(url, HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 401)
    self.assertTrue('WWW-Authenticate' in response)

    # Error response should be a dict
    self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
    response_data = json.loads(response.content)
    self.assertTrue(isinstance(response_data, dict))

    if test_after_request is not None:
        test_after_request(self)

    # Check using Accept: text/html
    response = self.client.get(url, HTTP_ACCEPT='text/html')
    self.assertEqual(response.status_code, 401)
    self.assertTrue('WWW-Authenticate' in response)

    # Content type of the response should be text/html
    self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    if test_after_request is not None:
        test_after_request(self)


def check_post_requires_authentication(self, url, data, test_after_request=None):

    response = self.client.post(url, data, content_type='application/json', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 401)
    self.assertTrue('WWW-Authenticate' in response)

    # Error response should be a dict
    self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
    response_data = json.loads(response.content)
    self.assertTrue(isinstance(response_data, dict))

    if test_after_request is not None:
        test_after_request(self)

    # Check using Accept: text/html
    response = self.client.post(url, data, content_type='application/json', HTTP_ACCEPT='text/html')
    self.assertEqual(response.status_code, 401)
    self.assertTrue('WWW-Authenticate' in response)

    # Content type of the response should be text/html
    self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    if test_after_request is not None:
        test_after_request(self)


def check_post_requires_permission(self, url, data, test_after_request=None):

    # Authenticate
    self.client.login(username='emptyuser', password='admin')

    response = self.client.post(url, data, content_type='application/json', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 403)

    if test_after_request is not None:
        test_after_request(self)


def check_post_bad_request_syntax(self, url):

    # Authenticate
    self.client.login(username='user_with_workspaces', password='admin')

    # Test bad json syntax
    response = self.client.post(url, 'bad syntax', content_type='application/json', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 400)
    response_data = json.loads(response.content)
    self.assertTrue(isinstance(response_data, dict))


def check_put_bad_request_syntax(self, url):

    # Authenticate
    self.client.login(username='user_with_workspaces', password='admin')

    # Test bad json syntax
    response = self.client.put(url, 'bad syntax', content_type='application/json', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 400)
    response_data = json.loads(response.content)
    self.assertTrue(isinstance(response_data, dict))


def check_put_requires_authentication(self, url, data, test_after_request=None):

    response = self.client.put(url, data, HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 401)
    self.assertTrue('WWW-Authenticate' in response)

    # Error response should be a dict
    self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
    response_data = json.loads(response.content)
    self.assertTrue(isinstance(response_data, dict))

    if test_after_request is not None:
        test_after_request(self)

    # Check using Accept: text/html
    response = self.client.put(url, data, HTTP_ACCEPT='text/html')
    self.assertEqual(response.status_code, 401)
    self.assertTrue('WWW-Authenticate' in response)

    # Content type of the response should be text/html
    self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    if test_after_request is not None:
        test_after_request(self)


def check_put_requires_permission(self, url, data):

    # Authenticate
    self.client.login(username='emptyuser', password='admin')

    response = self.client.put(url, data, content_type='application/json', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 403)


def check_delete_requires_authentication(self, url, test_after_request=None):

    response = self.client.delete(url, HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 401)
    self.assertTrue('WWW-Authenticate' in response)

    # Error response should be a dict
    self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
    response_data = json.loads(response.content)
    self.assertTrue(isinstance(response_data, dict))

    if test_after_request is not None:
        test_after_request(self)

    # Check using Accept: text/html
    response = self.client.delete(url, HTTP_ACCEPT='text/html')
    self.assertEqual(response.status_code, 401)
    self.assertTrue('WWW-Authenticate' in response)

    # Content type of the response should be text/html
    self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    if test_after_request is not None:
        test_after_request(self)


def check_delete_requires_permission(self, url, test_after_request=None):

    # Authenticate
    self.client.login(username='emptyuser', password='admin')

    response = self.client.delete(url, HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 403)

    if test_after_request is not None:
        test_after_request(self)


class ApplicationMashupAPI(WirecloudTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('rest_api', 'fiware-ut-11')

    def setUp(self):
        super(ApplicationMashupAPI, self).setUp()

        self.client = Client()

    def test_features(self):

        url = reverse('wirecloud.features')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_workspace_collection_get_requires_authentication(self):

        url = reverse('wirecloud.workspace_collection')
        check_get_requires_authentication(self, url)

    def test_workspace_collection_read(self):

        url = reverse('wirecloud.workspace_collection')

        self.client.login(username='admin', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, list))
        self.assertTrue(isinstance(response_data[0], dict))

    def test_workspace_collection_post_requires_authentication(self):

        url = reverse('wirecloud.workspace_collection')

        data = {
            'name': 'test',
        }

        def test_workspace_not_created(self):
            # Workspace should be not created
            self.assertFalse(Workspace.objects.filter(name='test').exists())

        check_post_requires_authentication(self, url, json.dumps(data), test_workspace_not_created)

    def test_workspace_collection_post(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        data = {
            'name': 'test',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        # Check basic response structure
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertEqual(response_data['name'], 'test')
        self.assertTrue(isinstance(response_data['wiring'], dict))

        # Workspace should be created
        self.assertTrue(Workspace.objects.filter(creator=1, name='test').exists())

    def test_workspace_collection_post_conflict(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'name': 'ExistingWorkspace',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 409)

    def test_workspace_collection_post_allow_renaming(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'allow_renaming': True,
            'name': 'ExistingWorkspace'
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertNotEqual(response_data['name'], 'ExistingWorkspace')
        self.assertTrue(isinstance(response_data['wiring'], dict))

        # Workspace should be created
        self.assertTrue(Workspace.objects.filter(creator=4, name=response_data['name']).exists())

    def test_workspace_collection_post_creation_from_nonexistent_mashup(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/nonexistent-mashup/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

    def test_workspace_collection_post_creation_from_operator(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/TestOperator/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

    def test_workspace_collection_post_creation_from_mashup_dry_run(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'dry_run': True,
            'mashup': 'Wirecloud/test-mashup/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Make the request (now using a string for the dry_run option)
        data = {
            'dry_run': 'True',
            'mashup': 'Wirecloud/test-mashup/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

    def test_workspace_collection_post_creation_from_mashup(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        # Check basic response structure
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertEqual(response_data['name'], 'Test Mashup')
        self.assertTrue(isinstance(response_data['wiring'], dict))

        # Workspace should be created
        self.assertTrue(Workspace.objects.filter(creator=2, name='Test Mashup').exists())

    def test_workspace_collection_post_creation_from_mashup_missing_dependencies(self):

        url = reverse('wirecloud.workspace_collection')

        # Make Test and TestOperator unavailable to normuser
        test_widget = CatalogueResource.objects.get(short_name='Test')
        test_widget.public = False
        test_widget.users.clear()
        test_widget.save()

        test_operator = CatalogueResource.objects.get(short_name='TestOperator')
        test_operator.public = False
        test_operator.users.clear()
        test_operator.save()

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup-dependencies/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

        # Check basic response structure
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('description' in response_data)
        self.assertTrue('details' in response_data)
        self.assertTrue('missingDependencies' in response_data['details'])
        missingDependencies = set(response_data['details']['missingDependencies'])
        self.assertEqual(len(response_data['details']['missingDependencies']), len(missingDependencies))
        self.assertEqual(missingDependencies, set((
            'Wirecloud/nonavailable-operator/1.0',
            'Wirecloud/nonavailable-widget/1.0',
            'Wirecloud/TestOperator/1.0',
            'Wirecloud/Test/1.0',
        )))

        # Workspace should not be created
        self.assertFalse(Workspace.objects.filter(creator=2, name='Test Mashup').exists())

    def test_workspace_collection_post_creation_from_mashup_missing_dependencies_dry_run(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup-dependencies/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

        # Check basic response structure
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('description' in response_data)
        self.assertTrue('details' in response_data)
        self.assertTrue('missingDependencies' in response_data['details'])
        self.assertEqual(set(response_data['details']['missingDependencies']), set((
            'Wirecloud/nonavailable-operator/1.0',
            'Wirecloud/nonavailable-widget/1.0',
        )))

        # Workspace should not be created
        self.assertFalse(Workspace.objects.filter(creator=2, name='Test Mashup').exists())

    def test_workspace_collection_post_empty_required_fields(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {}
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

        # Check basic response structure
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('description' in response_data)

    def test_workspace_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.workspace_collection')
        check_post_bad_request_syntax(self, url)

    def test_workspace_entry_get_requires_authentication(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 1})
        check_get_requires_authentication(self, url)

    def test_workspace_entry_read_requires_permission(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 1})
        check_get_requires_permission(self, url)

    def test_workspace_entry_read(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        # Response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertEqual(response_data['name'], 'ExistingWorkspace')
        self.assertEqual(response_data['creator'], 'user_with_workspaces')
        self.assertTrue('wiring' in response_data)

        self.assertTrue('tabs' in response_data)
        self.assertTrue(isinstance(response_data['tabs'], list))
        self.assertTrue(len(response_data['tabs']) > 0)
        self.assertTrue(isinstance(response_data['tabs'][0], dict))
        self.assertTrue('id' in response_data['tabs'][0])
        self.assertTrue('name' in response_data['tabs'][0])
        self.assertTrue('preferences' in response_data['tabs'][0])
        self.assertTrue(isinstance(response_data['tabs'][0]['preferences'], dict))
        self.assertTrue('iwidgets' in response_data['tabs'][0])
        self.assertTrue(isinstance(response_data['tabs'][0]['iwidgets'], list))

        self.assertTrue('preferences' in response_data)
        self.assertTrue(isinstance(response_data['preferences'], dict))

    def test_workspace_entry_delete_requires_authentication(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 1})

        def workspace_not_deleted(self):
            # Workspace should be not deleted
            self.assertTrue(Workspace.objects.filter(name='ExistingWorkspace').exists())

        check_delete_requires_authentication(self, url, workspace_not_deleted)

    def test_workspace_entry_delete_requires_permission(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 1})
        check_delete_requires_permission(self, url)

    def test_workspace_entry_delete(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Workspace should be removed
        self.assertFalse(Workspace.objects.filter(name='ExistingWorkspace').exists())

    def test_workspace_wiring_entry_put_requires_authentication(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 1})
        workspace = Workspace.objects.get(id=1)
        old_wiring_status = json.loads(workspace.wiringStatus)

        data = json.dumps({
            'operators': [{'name': 'Operator1'}],
            'connections': [],
        })
        response = self.client.put(url, data, content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Error response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

        # Workspace wiring status should not have change
        workspace = Workspace.objects.get(id=1)
        wiring_status = json.loads(workspace.wiringStatus)
        self.assertEqual(wiring_status, old_wiring_status)

        # Check using Accept: text/html
        response = self.client.put(url, data, content_type='application/json', HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Content type of the response should be text/html
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    def test_workspace_wiring_entry_put_requires_permission(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 1})
        data = {
            'operators': {'0': {'name': 'Operator1'}},
            'connections': [],
        }
        check_put_requires_permission(self, url, json.dumps(data))

    def test_workspace_wiring_entry_put(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 1})
        new_wiring_status = {
            'operators': {'0': {'name': 'Operator1'}},
            'connections': [],
        }

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = json.dumps(new_wiring_status)
        response = self.client.put(url, data, content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Workspace wiring status should have change
        workspace = Workspace.objects.get(id=1)
        wiring_status = json.loads(workspace.wiringStatus)
        self.assertEqual(wiring_status, new_wiring_status)

    def test_workspace_wiring_entry_put_bad_request_syntax(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 1})
        check_put_bad_request_syntax(self, url)

    def test_tab_collection_post_requires_authentication(self):

        url = reverse('wirecloud.tab_collection', kwargs={'workspace_id': 1})

        data = {
            'name': 'rest_api_test',
        }

        def test_tab_not_created(self):
            # Tab should be not created
            self.assertFalse(Tab.objects.filter(name='rest_api_test').exists())

        check_post_requires_authentication(self, url, json.dumps(data), test_tab_not_created)

    def test_tab_collection_post_requires_permission(self):

        url = reverse('wirecloud.tab_collection', kwargs={'workspace_id': 1})

        data = {
            'name': 'rest_api_test',
        }
        check_post_requires_permission(self, url, json.dumps(data))

    def test_tab_collection_post(self):

        url = reverse('wirecloud.tab_collection', kwargs={'workspace_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'name': 'rest_api_test',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        # Check basic response structure
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['name'], 'rest_api_test')

        # Tab should be created
        self.assertTrue(Tab.objects.filter(name='rest_api_test').exists())

    def test_tab_collection_post_conflict(self):

        url = reverse('wirecloud.tab_collection', kwargs={'workspace_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'name': 'ExistingTab',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 409)

    def test_tab_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.tab_collection', kwargs={'workspace_id': 1})
        check_post_bad_request_syntax(self, url)

    def test_tab_entry_put_requires_authentication(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 1})
        data = {
            'name': 'new tab name'
        }
        check_put_requires_authentication(self, url, data)

    def test_tab_entry_put_requires_permission(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 1})
        data = {
            'name': 'new tab name'
        }
        check_put_requires_permission(self, url, json.dumps(data))

    def test_tab_entry_put(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 3, 'tab_id': 103})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request (rename tab)
        data = {
            'name': 'new tab name'
        }
        response = self.client.put(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Tab should be renamed
        tab2 = Tab.objects.get(pk=103)
        self.assertEqual(tab2.name, 'new tab name')
        self.assertFalse(tab2.visible)

        # Mark second tab as the default tab
        data = {
            'visible': True
        }
        response = self.client.put(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Tab should be marked as the default one
        tab2 = Tab.objects.get(pk=103)
        self.assertEqual(tab2.name, 'new tab name')
        self.assertTrue(tab2.visible)
        tab1 = Tab.objects.get(pk=102)
        self.assertFalse(tab1.visible)

        # Mark first tab as the default tab
        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 3, 'tab_id': 102})
        data = {
            'visible': 'true'
        }
        response = self.client.put(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Tab should be marked as the default one
        tab2 = Tab.objects.get(pk=103)
        self.assertFalse(tab2.visible)
        tab1 = Tab.objects.get(pk=102)
        self.assertTrue(tab1.visible)

    def test_tab_entry_put_bad_request_syntax(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 1})
        check_put_bad_request_syntax(self, url)

    def test_tab_entry_delete_requires_authentication(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 1})

        def tab_not_deleted(self):
            # Tab should be not deleted
            self.assertTrue(Tab.objects.filter(name='ExistingTab').exists())

        check_delete_requires_authentication(self, url, tab_not_deleted)

    def test_tab_entry_delete_requires_permission(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 1})
        check_delete_requires_permission(self, url)

    def test_tab_entry_delete(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Tab should be removed
        self.assertFalse(Tab.objects.filter(name='ExistingTab').exists())

    def test_tab_entry_delete_read_only_widgets(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 3, 'tab_id': 103})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

        # Tab should not be removed
        self.assertTrue(Tab.objects.filter(pk=103).exists())

    def test_iwidget_collection_post_requires_authentication(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})

        # Make the request
        data = {
            'widget': 'Wirecloud/Test/1.0',
        }
        check_post_requires_authentication(self, url, json.dumps(data))

    def test_iwidget_collection_post_requires_permission(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})
        data = {
            'widget': 'Wirecloud/Test/1.0',
        }
        check_post_requires_permission(self, url, json.dumps(data))

    def test_iwidget_collection_post(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'widget': 'Wirecloud/Test/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_collection_post_creation_from_nonexistent_widget(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'widget': 'Wirecloud/nonexistent-widget/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_collection_post_creation_from_nonavailable_widget(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})

        # Make Wirecloud/Test/1.0 not available to user_with_workspaces
        test_widget = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='1.0')
        test_widget.public = False
        test_widget.users.clear()
        test_widget.save()

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'widget': 'Wirecloud/Test/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})
        check_post_bad_request_syntax(self, url)

    def test_iwidget_entry_post_requires_authentication(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Make the request
        data = {
            'name': 'New Name',
        }

        def iwidget_not_created(self):
            # IWidget should be not updated
            iwidget = IWidget.objects.get(pk=2)
            self.assertNotEqual(iwidget.name, 'New Name')

        check_post_requires_authentication(self, url, json.dumps(data), iwidget_not_created)

    def test_iwidget_entry_post_requires_permission(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        data = {
            'name': 'New Name',
        }
        check_post_requires_permission(self, url, json.dumps(data))

    def test_iwidget_entry_post(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'name': 'New Name',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, '')

        # Check that the iwidget name has been changed
        iwidget = IWidget.objects.get(pk=2)
        self.assertEqual(iwidget.name, 'New Name')

    def test_iwidget_entry_post_bad_request_syntax(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        check_post_bad_request_syntax(self, url)

    def test_iwidget_preferences_entry_post_requires_authentication(self):

        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Make the request
        data = {
            'text': 'new value',
        }

        def iwidget_preference_not_created(self):
            # IWidget preferences should not be updated
            variable_value = VariableValue.objects.get(
                user__username='user_with_workspaces',
                variable__vardef__name='text',
                variable__iwidget__id=2
            )
            self.assertNotEqual(variable_value.value, 'new value')

        check_post_requires_authentication(self, url, json.dumps(data), iwidget_preference_not_created)

    def test_iwidget_preferences_entry_post_requires_permission(self):

        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        data = {
            'text': 'new value',
        }
        check_post_requires_permission(self, url, json.dumps(data))

    def test_iwidget_preferences_entry_post(self):

        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'text': 'new value',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, '')

        # IWidget preferences should be updated
        variable_value = VariableValue.objects.get(
            user__username='user_with_workspaces',
            variable__vardef__name='text',
            variable__iwidget__id=2
        )
        self.assertEqual(variable_value.value, 'new value')

    def test_iwidget_preferences_entry_post_bad_request_syntax(self):

        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        check_post_bad_request_syntax(self, url)

    def test_iwidget_entry_delete_requires_authentication(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        def iwidget_not_deleted(self):
            # IWidget should not be deleted
            IWidget.objects.get(pk=2)

        check_delete_requires_authentication(self, url, iwidget_not_deleted)

    def test_iwidget_entry_delete_requires_permission(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        check_delete_requires_permission(self, url)

    def test_iwidget_entry_delete(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, '')

        # IWidget should be deleted
        self.assertRaises(IWidget.DoesNotExist, IWidget.objects.get, pk=2)

    def test_iwidget_entry_delete_read_only(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 3, 'tab_id': 103, 'iwidget_id': 4})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

        # IWidget should not be deleted
        IWidget.objects.get(pk=4)

class ResourceManagementAPI(WirecloudTestCase):

    fixtures = ('selenium_test_data',)
    tags = ('rest_api', 'fiware-ut-11')

    def test_resource_collection_get_requires_authentication(self):

        url = reverse('wirecloud_showcase.resource_collection')
        check_get_requires_authentication(self, url)

    def test_resource_collection_read(self):

        url = reverse('wirecloud_showcase.resource_collection')

        self.client.login(username='admin', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        for resource_id in response_data:
            resource = response_data[resource_id]
            self.assertTrue(isinstance(resource, dict))
            self.assertIn('type', resource)
            self.assertIn(resource['type'], CatalogueResource.RESOURCE_TYPES)
            self.assertIn('vendor', resource)
            self.assertIn('name', resource)
            self.assertIn('version', resource)

    def test_resource_collection_post_requires_authentication(self):

        url = reverse('wirecloud_showcase.resource_collection')
        check_post_requires_authentication(self, url, '{}')

    def test_resource_collection_post_widget(self):

        url = reverse('wirecloud_showcase.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('type', response_data)
        self.assertEqual(response_data['type'], 'widget')
        self.assertIn('vendor', response_data)
        self.assertEqual(response_data['vendor'], 'Wirecloud')
        self.assertIn('name', response_data)
        self.assertEqual(response_data['name'], 'Test_Selenium')
        self.assertIn('version', response_data)
        self.assertEqual(response_data['version'], '1.0')

    def test_resource_collection_post_widget_without_enough_filesystem_permissions(self):

        url = reverse('wirecloud_showcase.resource_collection')

        resource_id = [
            'Wirecloud',
            'Test_Selenium',
            '1.0'
        ]
        local_dir = catalogue.wgt_deployer.get_base_dir(*resource_id)
        os.makedirs(local_dir)
        os.chmod(local_dir, 0)

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_resource_collection_post_widget_invalid_html_encoding(self):

        url = reverse('wirecloud_showcase.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Invalid_HTML_Encoding_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_resource_collection_post_operator(self):

        url = reverse('wirecloud_showcase.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_TestOperatorSelenium_1.0.zip'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        response_data = json.loads(response.content)
        self.assertIn('type', response_data)
        self.assertEqual(response_data['type'], 'operator')
        self.assertIn('vendor', response_data)
        self.assertEqual(response_data['vendor'], 'Wirecloud')
        self.assertIn('name', response_data)
        self.assertEqual(response_data['name'], 'TestOperatorSelenium')
        self.assertIn('version', response_data)
        self.assertEqual(response_data['version'], '1.0')

    def test_resource_collection_post_mashup(self):

        url = reverse('wirecloud_showcase.resource_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_TestMashup2_1.0.zip'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        response_data = json.loads(response.content)
        self.assertIn('type', response_data)
        self.assertEqual(response_data['type'], 'mashup')
        self.assertIn('vendor', response_data)
        self.assertEqual(response_data['vendor'], 'Wirecloud')
        self.assertIn('name', response_data)
        self.assertEqual(response_data['name'], 'TestMashup2')
        self.assertIn('version', response_data)
        self.assertEqual(response_data['version'], '1.0')

    def test_resource_collection_post_missing_dependencies(self):

        # Make Test and TestOperator unavailable to normuser
        test_widget = CatalogueResource.objects.get(short_name='Test')
        test_widget.public = False
        test_widget.users.clear()
        test_widget.save()

        test_operator = CatalogueResource.objects.get(short_name='TestOperator')
        test_operator.public = False
        test_operator.users.clear()
        test_operator.save()

        url = reverse('wirecloud_showcase.resource_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_TestMashup2_1.0.zip'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

    def test_resource_collection_post_using_octet_stream(self):

        url = reverse('wirecloud_showcase.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('type', response_data)
        self.assertIn(response_data['type'], CatalogueResource.RESOURCE_TYPES)
        self.assertIn('vendor', response_data)
        self.assertIn('name', response_data)
        self.assertIn('version', response_data)

    def test_resource_collection_post_using_bad_packaged_resouce_from_uri(self):

        url = reverse('wirecloud_showcase.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        data = {
            'packaged': True,
            'template_uri': 'http://localhost:8001/test-mashup.rdf'
        }
        response = self.client.post(url, json.dumps(data), content_type="application/json", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)

    def test_resource_collection_post_using_octet_stream_error(self):

        url = reverse('wirecloud_showcase.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        response = self.client.post(url, 'invalid content', content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)

    def test_resource_entry_get_requires_authentication(self):

        url = reverse('wirecloud_showcase.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})
        check_get_requires_authentication(self, url)

    def test_resource_entry_read(self):

        resource_id = [
            'Wirecloud',
            'Test',
            '1.0'
        ]
        url = reverse('wirecloud_showcase.resource_entry', args=resource_id)
        file_name = '_'.join(resource_id) + '.wgt'
        local_dir = catalogue.wgt_deployer.get_base_dir(*resource_id)
        dst_file = os.path.join(local_dir, file_name)

        if not os.path.exists(local_dir):
            os.makedirs(local_dir)

        src_file = os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt')
        shutil.copy(src_file, dst_file)

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/x-widget+mashable-application-component')

    def test_resource_entry_read_requires_permission(self):

        resource_id = (
            'Wirecloud',
            'TestOperator',
            '1.0',
        )
        url = reverse('wirecloud_showcase.resource_entry', args=resource_id)
        check_get_requires_permission(self, url)

    def test_resource_entry_delete_requires_authentication(self):

        url = reverse('wirecloud_showcase.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})
        check_delete_requires_authentication(self, url)

    def test_resource_entry_delete(self):

        url = reverse('wirecloud_showcase.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})

        self.client.login(username='admin', password='admin')

        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)


class ExtraApplicationMashupAPI(WirecloudTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('extra_rest_api',)

    def test_iwidget_collection_get_requires_authentication(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 2, 'tab_id': 101})
        check_get_requires_authentication(self, url)

    def test_iwidget_collection_read(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 2, 'tab_id': 101})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, list))

    def test_iwidget_entry_get_requires_authentication(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        check_get_requires_authentication(self, url)

    def test_iwidget_entry_read(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_resource_description_entry_get_requires_authentication(self):

        url = reverse('wirecloud_showcase.resource_description_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})
        check_get_requires_authentication(self, url)

    def test_resource_description_entry_read(self):

        resource_id = [
            'Wirecloud',
            'Test',
            '1.0'
        ]
        url = reverse('wirecloud_showcase.resource_description_entry', args=resource_id)

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')

    def test_resource_description_entry_read_requires_permission(self):

        resource_id = (
            'Wirecloud',
            'TestOperator',
            '1.0',
        )
        url = reverse('wirecloud_showcase.resource_description_entry', args=resource_id)
        check_get_requires_permission(self, url)

    def test_market_collection_get_requires_authentication(self):

        url = reverse('wirecloud.market_collection')
        check_get_requires_authentication(self, url)

    def test_market_collection_get(self):

        url = reverse('wirecloud.market_collection')

        # Authenticate
        self.client.login(username='user_with_markets', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_market_collection_post_requires_authentication(self):

        url = reverse('wirecloud.market_collection')
        data = {
            'name': 'new_market',
            'options': {
                'type': 'wirecloud',
                'url': 'http://example.com'
            }
        }
        check_post_requires_authentication(self, url, json.dumps(data))

    def test_market_collection_post(self):

        url = reverse('wirecloud.market_collection')

        # Authenticate
        self.client.login(username='user_with_markets', password='admin')

        # Make request
        data = {
            'name': 'new_market',
            'options': {
                'type': 'wirecloud',
                'url': 'http://example.com'
            }
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

    def test_market_entry_delete_requires_authentication(self):

        url = reverse('wirecloud.market_entry', kwargs={'user': 'user_with_markets', 'market': 'deleteme'})
        check_delete_requires_authentication(self, url)

    def test_market_entry_delete(self):

        url = reverse('wirecloud.market_entry', kwargs={'user': 'user_with_markets', 'market': 'deleteme'})

        # Authenticate
        self.client.login(username='user_with_markets', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

    def test_market_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.market_collection')
        check_post_bad_request_syntax(self, url)

    def test_platform_preference_collection_get_requires_authentication(self):

        url = reverse('wirecloud.platform_preferences')
        check_get_requires_authentication(self, url)

    def test_platform_preference_collection_read(self):

        url = reverse('wirecloud.platform_preferences')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_platform_preference_collection_post_requires_authentication(self):

        url = reverse('wirecloud.platform_preferences')

        data = {
            'pref1': {'value': '5'},
            'pref2': {'value': 'false'}
        }
        check_post_requires_authentication(self, url, json.dumps(data))

    def test_platform_preference_collection_post(self):

        url = reverse('wirecloud.platform_preferences')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {
            'pref1': {'value': '5'},
            'pref2': {'value': 'false'}
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, '')

    def test_platform_preference_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.platform_preferences')
        check_post_bad_request_syntax(self, url)

    def test_workspace_entry_post_requires_authentication(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 2})

        data = {
            'name': 'RenamedWorkspace',
            'active': True,
        }

        def workspace_not_changed(self):
            user_workspace = UserWorkspace.objects.get(pk=2)
            self.assertEqual(user_workspace.workspace.name, 'Workspace')
            self.assertEqual(user_workspace.active, True)

        check_post_requires_authentication(self, url, json.dumps(data), workspace_not_changed)

    def test_workspace_entry_post_requires_permission(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 2})

        data = {
            'name': 'RenamedWorkspace',
            'active': True,
        }

        def workspace_not_changed(self):
            user_workspace = UserWorkspace.objects.get(pk=2)
            self.assertEqual(user_workspace.workspace.name, 'Workspace')
            self.assertEqual(user_workspace.active, True)

        check_post_requires_permission(self, url, json.dumps(data), workspace_not_changed)

    def test_workspace_entry_post(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {
            'name': 'RenamedWorkspace',
            'active': False,
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        user_workspace = UserWorkspace.objects.get(pk=2)
        self.assertEqual(user_workspace.workspace.name, data['name'])
        self.assertEqual(user_workspace.active, False)

        data = {
            'name': 'Workspace',
            'active': 'True',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        user_workspace = UserWorkspace.objects.get(pk=2)
        self.assertEqual(user_workspace.workspace.name, data['name'])
        self.assertEqual(user_workspace.active, True)

    def test_workspace_entry_post_bad_request_syntax(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 2})
        check_post_bad_request_syntax(self, url)

    def test_workspace_variable_collection_post_requires_authentication(self):

        url = reverse('wirecloud.variable_collection', kwargs={'workspace_id': 2})

        data = [
            {'id': 2, 'value': 'new_value'}
        ]
        check_post_requires_authentication(self, url, json.dumps(data))

    def test_workspace_variable_collection_post(self):

        # TODO change the value of a property

        url = reverse('wirecloud.variable_collection', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = [
            {'id': 2, 'value': 'new_value'}
        ]
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Check the new value
        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 2})
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content)
        self.assertEqual(response_data['tabs'][0]['iwidgets'][0]['variables']['text']['value'], 'new_value')

    def test_workspace_variable_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.variable_collection', kwargs={'workspace_id': 2})
        check_post_bad_request_syntax(self, url)

    def test_workspace_merge_service_post_requires_authentication(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        data = [
            {'id': 2, 'value': 'new_value'}
        ]
        check_post_requires_authentication(self, url, json.dumps(data))

    def test_workspace_merge_service_post(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Check new workspace status
        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 2})
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content)
        self.assertEqual(len(response_data['tabs']), 3)
        self.assertEqual(len(response_data['tabs'][0]['iwidgets']), 2)
        self.assertEqual(len(response_data['tabs'][1]['iwidgets']), 1)
        self.assertEqual(len(response_data['tabs'][2]['iwidgets']), 1)

    def test_workspace_merge_service_post_from_workspace(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'workspace': '3',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Check new workspace status
        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 2})
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content)
        self.assertEqual(len(response_data['tabs']), 3)
        self.assertEqual(len(response_data['tabs'][0]['iwidgets']), 2)
        self.assertEqual(len(response_data['tabs'][1]['iwidgets']), 1)
        self.assertEqual(len(response_data['tabs'][2]['iwidgets']), 1)

    def test_workspace_merge_service_post_from_nonexistent_mashup(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/nonexistent-mashup/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

    def test_workspace_merge_service_post_bad_request_syntax(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})
        check_post_bad_request_syntax(self, url)

    def test_workspace_preference_collection_get_requires_authentication(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})
        check_get_requires_authentication(self, url)

    def test_workspace_preference_collection_read_requires_permission(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})
        check_get_requires_permission(self, url)

    def test_workspace_preference_collection_read(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_workspace_preference_collection_post_requires_authentication(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})

        data = {
            'pref1': {'inherit': 'false', 'value': '5'},
            'pref2': {'inherit': 'true', 'value': 'false'}
        }
        check_post_requires_authentication(self, url, json.dumps(data))

    def test_workspace_preference_collection_post_requires_permission(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})
        data = {
            'pref1': {'inherit': 'false', 'value': '5'},
            'pref2': {'inherit': 'true', 'value': 'false'}
        }
        check_post_requires_permission(self, url, json.dumps(data))

    def test_workspace_preference_collection_post(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {
            'pref1': {'inherit': 'false', 'value': '5'},
            'pref2': {'inherit': 'true', 'value': 'false'}
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, '')

    def test_workspace_preference_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})
        check_post_bad_request_syntax(self, url)

    def test_tab_preference_collection_get_requires_authentication(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})
        check_get_requires_authentication(self, url)

    def test_tab_preference_collection_read_requires_permission(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})
        check_get_requires_permission(self, url)

    def test_tab_preference_collection_read(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_tab_preference_collection_post_requires_authentication(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})

        data = {
            'pref1': {'inherit': 'false', 'value': '5'},
            'pref2': {'inherit': 'true', 'value': 'false'}
        }
        check_post_requires_authentication(self, url, json.dumps(data))

    def test_tab_preference_collection_post_requires_permission(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})
        data = {
            'pref1': '5',
            'pref2': 'true',
        }
        check_post_requires_permission(self, url, json.dumps(data))

    def test_tab_preference_collection_post(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {
            'pref1': '5',
            'pref2': 'true',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, '')

    def test_tab_preference_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})
        check_post_bad_request_syntax(self, url)

    def test_workspace_publish_requires_authentication(self):

        url = reverse('wirecloud.workspace_publish', kwargs={'workspace_id': 2})

        data = {
            'vendor': 'Wirecloud',
            'name': 'test-published-mashup',
            'version': '1.0.5',
            'email': 'test@example.com'
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

    def test_workspace_publish(self):

        url = reverse('wirecloud.workspace_publish', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {
            'vendor': 'Wirecloud',
            'name': 'test-published-mashup',
            'version': '1.0.5',
            'email': 'test@example.com'
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

    def test_workspace_publish_bad_provided_data(self):

        url = reverse('wirecloud.workspace_publish', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Test empty parameter
        data = {
            'name': ''
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

        # Test invalid version
        data = {
            'vendor': 'Wirecloud',
            'name': 'test-published-mashup',
            'version': '1.0.05',
            'email': 'test@example.com'
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_workspace_publish_bad_request_syntax(self):

        url = reverse('wirecloud.workspace_publish', kwargs={'workspace_id': 2})
        check_post_bad_request_syntax(self, url)
