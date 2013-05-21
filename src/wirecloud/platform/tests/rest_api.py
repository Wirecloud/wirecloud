# -*- coding: utf-8 -*-

# Copyright 2013 Universidad Politécnica de Madrid

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


import os
from tempfile import mkdtemp
import shutil

from django.core.urlresolvers import reverse
from django.test import Client
from django.utils import simplejson

from wirecloud.catalogue import utils as catalogue
from wirecloud.catalogue.models import CatalogueResource
import wirecloud.commons.test
from wirecloud.commons.test import LocalDownloader, WirecloudTestCase
from wirecloud.commons.utils import downloader
from wirecloud.commons.utils.wgt import WgtDeployer
from wirecloud.platform.models import IWidget, Tab, Workspace
from wirecloud.platform.widget import utils as showcase


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


class ApplicationMashupAPI(WirecloudTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('rest_api')

    @classmethod
    def setUpClass(cls):
        super(ApplicationMashupAPI, cls).setUpClass()

        cls.client = Client()
        cls._original_download_function = staticmethod(downloader.download_http_content)
        downloader.download_http_content = LocalDownloader({
            'http': {
                'localhost:8001': os.path.join(os.path.dirname(wirecloud.commons.test.__file__), 'test-data', 'src'),
            },
        })

    @classmethod
    def tearDownClass(cls):

        downloader.download_http_content = cls._original_download_function

    def test_features(self):

        url = reverse('wirecloud.features')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_workspace_collection_read_requires_authentication(self):

        url = reverse('wirecloud.workspace_collection')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)

    def test_workspace_collection_read(self):

        url = reverse('wirecloud.workspace_collection')

        self.client.login(username='admin', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, list))
        self.assertTrue(isinstance(response_data[0], dict))

    def test_workspace_collection_post_requires_authentication(self):

        url = reverse('wirecloud.workspace_collection')

        data = {
            'name': 'test',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Error response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

        # Workspace should be not created
        self.assertFalse(Workspace.objects.filter(name='test').exists())

        # Check using Accept: text/html
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Content type of the response should be text/html
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    def test_workspace_collection_post(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        data = {
            'name': 'test',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        # Check basic response structure
        response_data = simplejson.loads(response.content)
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
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 409)

    def test_workspace_collection_post_creation_from_mashup(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup/1.0',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        # Check basic response structure
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertEqual(response_data['name'], 'Test Mashup')
        self.assertTrue(isinstance(response_data['wiring'], dict))

        # Workspace should be created
        self.assertTrue(Workspace.objects.filter(creator=2, name='Test Mashup').exists())

    def test_workspace_entry_read_requires_authentication(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 1})

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Error response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

        # Workspace should be not deleted
        self.assertTrue(Workspace.objects.filter(name='ExistingWorkspace').exists())

        # Check using Accept: text/html
        response = self.client.delete(url, HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Content type of the response should be text/html
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    def test_workspace_entry_read(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        # Response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = simplejson.loads(response.content)
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

        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Error response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

        # Workspace should be not deleted
        self.assertTrue(Workspace.objects.filter(name='ExistingWorkspace').exists())

        # Check using Accept: text/html
        response = self.client.delete(url, HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Content type of the response should be text/html
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

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
        old_wiring_status = simplejson.loads(workspace.wiringStatus)

        data = simplejson.dumps({
            'operators': [{'name': 'Operator1'}],
            'connections': [],
        })
        response = self.client.put(url, data, content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Error response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

        # Workspace wiring status should not have change
        workspace = Workspace.objects.get(id=1)
        wiring_status = simplejson.loads(workspace.wiringStatus)
        self.assertEqual(wiring_status, old_wiring_status)

        # Check using Accept: text/html
        response = self.client.put(url, data, content_type='application/json', HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Content type of the response should be text/html
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    def test_workspace_wiring_entry_put(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 1})
        new_wiring_status = {
            'operators': [{'name': 'Operator1'}],
            'connections': [],
        }

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = simplejson.dumps(new_wiring_status)
        response = self.client.put(url, data, content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Workspace wiring status should have change
        workspace = Workspace.objects.get(id=1)
        wiring_status = simplejson.loads(workspace.wiringStatus)
        self.assertEqual(wiring_status, new_wiring_status)

    def test_tab_collection_post_requires_authentication(self):

        url = reverse('wirecloud.tab_collection', kwargs={'workspace_id': 1})

        data = {
            'name': 'rest_api_test',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Error response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

        # Tab should be not created
        self.assertFalse(Tab.objects.filter(name='rest_api_test').exists())

        # Check using Accept: text/html
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Content type of the response should be text/html
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    def test_tab_collection_post(self):

        url = reverse('wirecloud.tab_collection', kwargs={'workspace_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'name': 'rest_api_test',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        # Check basic response structure
        response_data = simplejson.loads(response.content)
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
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 409)

    def test_tab_entry_delete_requires_authentication(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 1})

        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Error response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

        # Tab should be not deleted
        self.assertTrue(Tab.objects.filter(name='ExistingTab').exists())

        # Check using Accept: text/html
        response = self.client.delete(url, HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Content type of the response should be text/html
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    def test_tab_entry_delete(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Tab should be removed
        self.assertFalse(Tab.objects.filter(name='ExistingTab').exists())

    def test_iwidget_collection_post_requires_authentication(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})

        # Make the request
        data = {
            'widget': 'Wirecloud/Test/1.0',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # IWidget should be not created
        # TODO

    def test_iwidget_collection_post(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'widget': 'Wirecloud/Test/1.0',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_entry_post_requires_authentication(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Make the request
        data = {
            'name': 'New Name',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # IWidget should be not updated
        iwidget = IWidget.objects.get(pk=2)
        self.assertNotEqual(iwidget.name, 'New Name')

    def test_iwidget_entry_post(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'name': 'New Name',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, '')

        # Check that the iwidget name has been changed
        iwidget = IWidget.objects.get(pk=2)
        self.assertEqual(iwidget.name, 'New Name')


class ResourceManagementAPI(WirecloudTestCase):

    fixtures = ('selenium_test_data',)
    tags = ('rest_api')

    @classmethod
    def setUpClass(cls):
        super(ResourceManagementAPI, cls).setUpClass()

        cls.client = Client()
        cls._original_download_function = staticmethod(downloader.download_http_content)
        downloader.download_http_content = LocalDownloader({
            'http': {
                'localhost:8001': os.path.join(os.path.dirname(wirecloud.commons.test.__file__), 'test-data', 'src'),
            },
        })

        # catalogue deployer
        cls.old_catalogue_deployer = catalogue.wgt_deployer
        cls.catalogue_tmp_dir = mkdtemp()
        catalogue.wgt_deployer = WgtDeployer(cls.catalogue_tmp_dir)

        # showcase deployer
        cls.old_deployer = showcase.wgt_deployer
        cls.showcase_tmp_dir = mkdtemp()
        showcase.wgt_deployer = WgtDeployer(cls.showcase_tmp_dir)

    @classmethod
    def tearDownClass(cls):

        downloader.download_http_content = cls._original_download_function

        # deployers
        catalogue.wgt_deployer = cls.old_catalogue_deployer
        shutil.rmtree(cls.catalogue_tmp_dir, ignore_errors=True)
        showcase.wgt_deployer = cls.old_deployer
        shutil.rmtree(cls.showcase_tmp_dir, ignore_errors=True)

        super(ResourceManagementAPI, cls).tearDownClass()

    def test_resource_collection_read_requires_authentication(self):

        url = reverse('wirecloud_showcase.resource_collection')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)

    def test_resource_collection_read(self):

        url = reverse('wirecloud_showcase.resource_collection')

        self.client.login(username='admin', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = simplejson.loads(response.content)
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

        response = self.client.post(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)

    def test_resource_collection_post(self):

        url = reverse('wirecloud_showcase.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('type', response_data)
        self.assertIn(response_data['type'], CatalogueResource.RESOURCE_TYPES)
        self.assertIn('vendor', response_data)
        self.assertIn('name', response_data)
        self.assertIn('version', response_data)

    def test_resource_collection_post_using_octet_stream(self):

        url = reverse('wirecloud_showcase.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('type', response_data)
        self.assertIn(response_data['type'], CatalogueResource.RESOURCE_TYPES)
        self.assertIn('vendor', response_data)
        self.assertIn('name', response_data)
        self.assertIn('version', response_data)

    def test_resource_entry_read_requires_authentication(self):

        url = reverse('wirecloud_showcase.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)

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

    def test_resource_entry_delete_requires_authentication(self):

        url = reverse('wirecloud_showcase.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})

        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)

    def test_resource_entry_delete(self):

        url = reverse('wirecloud_showcase.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})

        self.client.login(username='admin', password='admin')

        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)


class ExtraApplicationMashupAPI(WirecloudTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('extra_rest_api',)

    @classmethod
    def setUpClass(cls):
        super(ExtraApplicationMashupAPI, cls).setUpClass()

        cls.client = Client()
        cls._original_download_function = staticmethod(downloader.download_http_content)
        downloader.download_http_content = LocalDownloader({
            'http': {
                'localhost:8001': os.path.join(os.path.dirname(wirecloud.commons.test.__file__), 'test-data', 'src'),
            },
        })

    @classmethod
    def tearDownClass(cls):

        downloader.download_http_content = cls._original_download_function

        super(ExtraApplicationMashupAPI, cls).tearDownClass()

    def test_iwidget_collection_read_requires_authentication(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 2, 'tab_id': 101})

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

    def test_iwidget_collection_read(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 2, 'tab_id': 101})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, list))

    def test_iwidget_entry_read_requires_authentication(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

    def test_iwidget_entry_read(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_platform_preference_collection_read_requires_authentication(self):

        url = reverse('wirecloud.platform_preferences')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

    def test_platform_preference_collection_read(self):

        url = reverse('wirecloud.platform_preferences')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_platform_preference_collection_post_requires_authentication(self):

        url = reverse('wirecloud.platform_preferences')

        data = {
            'pref1': {'value': '5'},
            'pref2': {'value': 'false'}
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

    def test_platform_preference_collection_post(self):

        url = reverse('wirecloud.platform_preferences')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {
            'pref1': {'value': '5'},
            'pref2': {'value': 'false'}
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, '')

    def test_workspace_preference_collection_read_requires_authentication(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

    def test_workspace_preference_collection_read(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_workspace_preference_collection_post_requires_authentication(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})

        data = {
            'pref1': {'inherit': 'false', 'value': '5'},
            'pref2': {'inherit': 'true', 'value': 'false'}
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

    def test_workspace_preference_collection_post(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {
            'pref1': {'inherit': 'false', 'value': '5'},
            'pref2': {'inherit': 'true', 'value': 'false'}
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, '')

    def test_tab_preference_collection_read_requires_authentication(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

    def test_tab_preference_collection_read(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = simplejson.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_tab_preference_collection_post_requires_authentication(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})

        data = {
            'pref1': {'inherit': 'false', 'value': '5'},
            'pref2': {'inherit': 'true', 'value': 'false'}
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

    def test_tab_preference_collection_post(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {
            'pref1': '5',
            'pref2': 'true',
        }
        response = self.client.post(url, simplejson.dumps(data), content_type='application/json', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, '')
