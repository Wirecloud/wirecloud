# -*- coding: utf-8 -*-

# Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

import filecmp
import json
from lxml import etree
import os

from django.core.urlresolvers import reverse
from django.test import Client

from wirecloud.catalogue import utils as catalogue
from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.testcases import uses_extra_resources, WirecloudTestCase
from wirecloud.platform.models import IWidget, Tab, Variable, Workspace, UserWorkspace, WorkspacePreference
from wirecloud.platform.widget import utils as localcatalogue


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


def check_get_requires_permission(self, url):

    # Authenticate
    self.client.login(username='emptyuser', password='admin')

    response = self.client.get(url, HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'application/json; charset=utf-8')

    # Wirecloud only supports application/json, but error responses may be
    # returned using other formats
    response = self.client.get(url, HTTP_ACCEPT='application/json; q=0.2, text/plain')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'text/plain; charset=utf-8')

    response = self.client.get(url, HTTP_ACCEPT='application/json; q=0.2, application/xml')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'application/xml; charset=utf-8')

    response = self.client.get(url, HTTP_ACCEPT='application/json; q=0.2, text/html')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'text/html; charset=utf-8')


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

    response = self.client.post(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 401)
    self.assertTrue('WWW-Authenticate' in response)

    # Error response should be a dict
    self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
    response_data = json.loads(response.content)
    self.assertTrue(isinstance(response_data, dict))

    if test_after_request is not None:
        test_after_request(self)

    # Check using Accept: text/html
    response = self.client.post(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='text/html')
    self.assertEqual(response.status_code, 401)
    self.assertTrue('WWW-Authenticate' in response)

    # Content type of the response should be text/html
    self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    if test_after_request is not None:
        test_after_request(self)


def check_post_requires_permission(self, url, data, test_after_request=None):

    # Authenticate
    self.client.login(username='emptyuser', password='admin')

    response = self.client.post(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'application/json; charset=utf-8')

    if test_after_request is not None:
        test_after_request(self)

    # Wirecloud only supports application/json, but error responses may be
    # returned using other formats
    response = self.client.post(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json; q=0.2, text/plain')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'text/plain; charset=utf-8')

    response = self.client.post(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json; q=0.2, application/xml')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'application/xml; charset=utf-8')

    response = self.client.post(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json; q=0.2, text/html')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'text/html; charset=utf-8')


def check_post_bad_request_content_type(self, url):

    # Authenticate
    self.client.login(username='user_with_workspaces', password='admin')

    # Test bad json syntax
    response = self.client.post(url, 'bad content type', content_type='bad/content-type; charset=UTF-8', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 415)
    response_data = json.loads(response.content)
    self.assertTrue(isinstance(response_data, dict))


def check_post_bad_request_syntax(self, url):

    # Authenticate
    self.client.login(username='user_with_workspaces', password='admin')

    # Test bad json syntax
    response = self.client.post(url, 'bad syntax', content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 400)
    response_data = json.loads(response.content)
    self.assertTrue(isinstance(response_data, dict))


def check_post_bad_provided_data(self, url, data):

    response = self.client.post(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 400)
    response_data = json.loads(response.content)
    self.assertTrue(isinstance(response_data, dict))


def check_put_bad_request_syntax(self, url):

    # Authenticate
    self.client.login(username='user_with_workspaces', password='admin')

    # Test bad json syntax
    response = self.client.put(url, 'bad syntax', content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
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

    response = self.client.put(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'application/json; charset=utf-8')

    # Wirecloud only supports application/json, but error responses may be
    # returned using other formats
    response = self.client.put(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json; q=0.2, text/plain')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'text/plain; charset=utf-8')

    response = self.client.put(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json; q=0.2, application/xml')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'application/xml; charset=utf-8')

    response = self.client.put(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json; q=0.2, text/html')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'text/html; charset=utf-8')


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
    self.assertEqual(response['Content-Type'], 'application/json; charset=utf-8')

    if test_after_request is not None:
        test_after_request(self)

    # Wirecloud only supports application/json, but error responses may be
    # returned using other formats
    response = self.client.delete(url, HTTP_ACCEPT='application/json; q=0.2, text/plain')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'text/plain; charset=utf-8')

    response = self.client.delete(url, HTTP_ACCEPT='application/json; q=0.2, application/xml')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'application/xml; charset=utf-8')

    response = self.client.delete(url, HTTP_ACCEPT='application/json; q=0.2, text/html')
    self.assertEqual(response.status_code, 403)
    self.assertEqual(response['Content-Type'], 'text/html; charset=utf-8')


def check_cache_is_purged(self, workspace, change_function, current_etag=None, inverse=False):

    url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': workspace})
    if current_etag is None:
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        current_etag = response['ETag']

    change_function()

    if not inverse:
        response = self.client.get(url, HTTP_ACCEPT='application/json', HTTP_IF_NONE_MATCH=current_etag)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        json.loads(response.content)
        self.assertEqual(response.status_code, 200)

        new_etag = response['ETag']
    else:
        new_etag = current_etag

    # There are no changes in the workspaces, so next requests so return a 304 error code
    cached_response = self.client.get(url, HTTP_ACCEPT='application/json', HTTP_IF_NONE_MATCH=new_etag)
    self.assertEqual(cached_response.status_code, 304)

    return new_etag


class ApplicationMashupAPI(WirecloudTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('rest_api', 'fiware-ut-11')

    def setUp(self):
        super(ApplicationMashupAPI, self).setUp()

        self.client = Client()

    def test_feature_collection_get(self):

        url = reverse('wirecloud.features')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_workspace_collection_get(self):

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
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        # Check basic response structure
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertEqual(response_data['name'], 'test')
        self.assertTrue(isinstance(response_data['wiring'], dict))

        # Workspace should be created
        self.assertTrue(Workspace.objects.filter(creator=1, name='test').exists())

    def test_workspace_collection_post_from_workspace(self):

        # Make TestOperator available to emptyuser
        test_widget = CatalogueResource.objects.get(short_name='TestOperator')
        test_widget.public = True
        test_widget.save()

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='emptyuser', password='admin')

        # Make the request
        # workspace 4 (creator: user_with_workspaces, name: Public Workspace) is readable and copyable by emptyuser
        data = {
            'workspace': '4',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content)
        self.assertEqual(response_data['creator'], 'emptyuser')
        self.assertEqual(response_data['name'], 'Public Workspace')
        public_preference = response_data['preferences'].get('public', {'value': 'False', 'inherit': False})
        self.assertEqual(public_preference['value'], 'false')

    def test_workspace_collection_post_from_workspace_allow_renaming(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # workspace 3 (creator: user_with_workspaces, name: Pending Events)
        data = {
            'allow_renaming': True,
            'workspace': '3',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content)
        self.assertEqual(response_data['creator'], 'user_with_workspaces')
        self.assertEqual(response_data['name'], 'Pending Events 2')
        public_preference = response_data['preferences'].get('public', {'value': 'False', 'inherit': False})
        self.assertEqual(public_preference['value'], 'false')

    def test_workspace_collection_post_from_workspace_requires_permission(self):

        url = reverse('wirecloud.workspace_collection')

        # workspace 3 (creator: user_with_workspaces, name: Pending Events) is not readable by emptyuser
        data = {
            'workspace': '3',
        }
        check_post_requires_permission(self, url, json.dumps(data))

    def test_workspace_collection_post_bad_name(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'name': 'bad/name',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

        # Make another request with another invalid name
        data = {
            'name': '      ',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

    def test_workspace_collection_post_conflict(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'name': 'ExistingWorkspace',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
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
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
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
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

    def test_workspace_collection_post_creation_from_operator(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/TestOperator/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

    @uses_extra_resources(('Wirecloud_test-mashup_1.0.wgt',), shared=True, deploy_only=True)
    def test_workspace_collection_post_creation_from_mashup_dry_run(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'dry_run': True,
            'mashup': 'Wirecloud/test-mashup/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Make the request (now using a string for the dry_run option)
        data = {
            'dry_run': 'True',
            'mashup': 'Wirecloud/test-mashup/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

    @uses_extra_resources(('Wirecloud_test-mashup_1.0.wgt',), shared=True, deploy_only=True)
    def test_workspace_collection_post_creation_from_mashup(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        # Check basic response structure
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertEqual(response_data['name'], 'Test Mashup')
        self.assertTrue(isinstance(response_data['wiring'], dict))

        # Workspace should be created
        self.assertTrue(Workspace.objects.filter(creator=2, name='Test Mashup').exists())

    @uses_extra_resources(('Wirecloud_test-mashup_1.0.wgt',), shared=True, deploy_only=True)
    def test_workspace_collection_post_creation_from_mashup_conflict(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup/1.0',
            'name': 'ExistingWorkspace',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 409)

    def test_workspace_collection_post_creation_from_mashup_bad_id(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'mashup': 'bad/id',
            'name': 'NewWorkspace',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

    @uses_extra_resources(('Wirecloud_test-mashup-dependencies_1.0.wgt',), shared=True, deploy_only=True)
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
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
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

        # Make the request now accepting xml
        data = {
            'mashup': 'Wirecloud/test-mashup-dependencies/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json; q=0.2, application/xml')
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response['Content-Type'], 'application/xml; charset=utf-8')

        # Check basic response structure
        response_data = etree.fromstring(response.content)
        self.assertEqual(response_data.tag, 'error')
        self.assertEqual(len(response_data), 2)
        self.assertEqual(response_data[0].tag, 'description')
        self.assertEqual(response_data[1].tag, 'details')
        self.assertEqual(response_data[1][0].tag, 'missingDependencies')
        missingDependencies = [dependency.text for dependency in response_data[1][0]]
        missingDependenciesSet = set(missingDependencies)
        self.assertEqual(len(missingDependenciesSet), len(missingDependencies))
        self.assertEqual(missingDependenciesSet, set((
            'Wirecloud/nonavailable-operator/1.0',
            'Wirecloud/nonavailable-widget/1.0',
            'Wirecloud/TestOperator/1.0',
            'Wirecloud/Test/1.0',
        )))

    @uses_extra_resources(('Wirecloud_test-mashup-dependencies_1.0.wgt',), shared=True, deploy_only=True)
    def test_workspace_collection_post_creation_from_mashup_missing_dependencies_dry_run(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup-dependencies/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
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
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

        # Check basic response structure
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('description' in response_data)

    def test_workspace_collection_post_bad_request_content_type(self):
        check_post_bad_request_content_type(self, reverse('wirecloud.workspace_collection'))

    def test_workspace_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.workspace_collection')
        check_post_bad_request_syntax(self, url)

    def test_workspace_entry_get_requires_permission(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 1})
        check_get_requires_permission(self, url)

    def test_workspace_entry_get(self):

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
        self.assertFalse(response_data['shared'])
        self.assertEqual(response_data['name'], 'ExistingWorkspace')
        self.assertEqual(response_data['creator'], 'user_with_workspaces')
        self.assertTrue('wiring' in response_data)

        self.assertEqual(response_data['description'], 'This is an <b>example</b> of workspace')
        self.assertEqual(response_data['longdescription'], '<p>This is an <strong>example</strong> of workspace</p>')
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

    def test_workspace_entry_get_allows_anonymous_requests(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 4})

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        # Response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content)
        self.assertTrue('id' in response_data)
        self.assertTrue(response_data['shared'])
        self.assertEqual(response_data['name'], 'Public Workspace')
        self.assertEqual(response_data['creator'], 'user_with_workspaces')

    def test_workspace_entry_cache(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 4})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make initial request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        json.loads(response.content)
        etag = response['ETag']

        # There are no changes in the workspaces, so next requests so return a 304 error code
        response = self.client.get(url, HTTP_ACCEPT='application/json', HTTP_IF_NONE_MATCH=etag)
        self.assertEqual(response.status_code, 304)

        # TODO those tests should live in they own method
        # Update widget position
        def update_widget_position():
            url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 4, 'tab_id': 104})
            data = [
                {"id": 5, "top": 24, "left": 6}
            ]
            response = self.client.put(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)

        etag = check_cache_is_purged(self, 4, update_widget_position, etag)

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

    def test_workspace_resource_collection_get(self):

        url = reverse('wirecloud.workspace_resource_collection', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue(response_data["Wirecloud/TestOperator/1.0"]["js_files"][0].startswith('http'))

    def test_workspace_resource_collection_get_no_process_urls(self):

        url = reverse('wirecloud.workspace_resource_collection', kwargs={'workspace_id': 2}) + '?process_urls=false'

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data["Wirecloud/TestOperator/1.0"]["js_files"][0], "js/main.js")

    def test_workspace_resource_collection_get_requires_permission(self):

        url = reverse('wirecloud.workspace_resource_collection', kwargs={'workspace_id': 1})
        check_get_requires_permission(self, url)

    def test_workspace_wiring_entry_put_requires_authentication(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 1})
        workspace = Workspace.objects.get(id=1)
        old_wiring_status = json.loads(workspace.wiringStatus)

        data = json.dumps({
            'operators': [{'name': 'Operator1'}],
            'connections': [],
        })
        response = self.client.put(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
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
        response = self.client.put(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='text/html')
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
        def update_workspace_wiring():
            data = json.dumps(new_wiring_status)
            response = self.client.put(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)

            # Workspace wiring status should have change
            workspace = Workspace.objects.get(id=1)
            wiring_status = json.loads(workspace.wiringStatus)
            self.assertEqual(wiring_status, new_wiring_status)
        check_cache_is_purged(self, 1, update_workspace_wiring)

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
        def create_workspace_tab():
            data = {
                'name': 'rest_api_test',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 201)

            # Check basic response structure
            response_data = json.loads(response.content)
            self.assertTrue(isinstance(response_data, dict))
            self.assertEqual(response_data['name'], 'rest_api_test')

            # Tab should be created
            self.assertTrue(Tab.objects.filter(name='rest_api_test').exists())
        check_cache_is_purged(self, 1, create_workspace_tab)

    def test_tab_collection_post_conflict(self):

        url = reverse('wirecloud.tab_collection', kwargs={'workspace_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'name': 'ExistingTab',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 409)

    def test_tab_collection_post_bad_request_content_type(self):

        url = reverse('wirecloud.tab_collection', kwargs={'workspace_id': 1})
        check_post_bad_request_content_type(self, url)

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
        def update_workspace_tab_name():
            data = {
                'name': 'new tab name'
            }
            response = self.client.put(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)

            # Tab should be renamed
            tab2 = Tab.objects.get(pk=103)
            self.assertEqual(tab2.name, 'new tab name')
            self.assertFalse(tab2.visible)
        check_cache_is_purged(self, 3, update_workspace_tab_name)

        # Mark second tab as the default Tab
        def mark_workspace_tab_active():
            data = {
                'visible': True
            }
            response = self.client.put(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)

            # Tab should be marked as the default one
            tab2 = Tab.objects.get(pk=103)
            self.assertEqual(tab2.name, 'new tab name')
            self.assertTrue(tab2.visible)
            tab1 = Tab.objects.get(pk=102)
            self.assertFalse(tab1.visible)
        check_cache_is_purged(self, 3, mark_workspace_tab_active)

        # Mark first tab as the default tab
        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 3, 'tab_id': 102})
        data = {
            'visible': 'true'
        }
        response = self.client.put(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
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

    def test_tab_order_post_requires_authentication(self):

        url = reverse('wirecloud.tab_order', kwargs={'workspace_id': 3})

        data = (103, 102)

        check_post_requires_authentication(self, url, json.dumps(data))

    def test_tab_order_post_requires_permission(self):

        url = reverse('wirecloud.tab_order', kwargs={'workspace_id': 3})

        data = (103, 102)

        def test_tab_order_not_changed(self):
            self.assertEqual(tuple(Workspace.objects.get(pk=3).tab_set.order_by('position').values_list('pk', flat=True)), (102, 103))

        check_post_requires_permission(self, url, json.dumps(data), test_tab_order_not_changed)

    def test_tab_order_post(self):

        url = reverse('wirecloud.tab_order', kwargs={'workspace_id': 3})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = (103, 102)
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        self.assertEqual(tuple(Workspace.objects.get(pk=3).tab_set.order_by('position').values_list('pk', flat=True)), data)

    def test_tab_order_post_bad_request_content_type(self):

        url = reverse('wirecloud.tab_order', kwargs={'workspace_id': 3})
        check_post_bad_request_content_type(self, url)

    def test_tab_order_post_bad_request_syntax(self):

        url = reverse('wirecloud.tab_order', kwargs={'workspace_id': 3})
        check_post_bad_request_syntax(self, url)

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
        def add_iwidget_to_workspace():
            data = {
                'widget': 'Wirecloud/Test/1.0',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 200)
            response_data = json.loads(response.content)
            self.assertTrue(isinstance(response_data, dict))
        check_cache_is_purged(self, 1, add_iwidget_to_workspace)

    def test_iwidget_collection_post_creation_from_nonexistent_widget(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'widget': 'Wirecloud/nonexistent-widget/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
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
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_collection_post_bad_request_content_type(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})
        check_post_bad_request_content_type(self, url)

    def test_iwidget_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})
        check_post_bad_request_syntax(self, url)

    def test_widget_code_entry_get_operator(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'TestOperator', 'version': '1.0'}
        url = reverse('wirecloud.widget_code_entry', kwargs=widget_id)

        # Authenticate
        self.client.login(username='admin', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 404)

    def test_widget_code_entry_get_bad_encoding(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'}
        url = reverse('wirecloud.widget_code_entry', kwargs=widget_id)

        # Prepare invalid widget code
        base_dir = localcatalogue.wgt_deployer.get_base_dir(**widget_id)
        os.makedirs(base_dir)
        with open(os.path.join(base_dir, 'test.html'), 'wb') as f:
            f.write('<html><div>á</div</html>'.encode('iso-8859-15'))
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='1.0')
        json_description = json.loads(resource.json_description)
        json_description['contents']['contenttype'] = 'application/xhtml+xml'
        resource.json_description = json.dumps(json_description)
        resource.save()

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 502)
        self.assertIn('Widget code was not encoded using the specified charset (utf-8', response.content)

    def test_widget_code_entry_get_bad_encoding_noncacheable(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'}
        url = reverse('wirecloud.widget_code_entry', kwargs=widget_id)

        # Prepare invalid widget code
        base_dir = localcatalogue.wgt_deployer.get_base_dir(**widget_id)
        os.makedirs(base_dir)
        with open(os.path.join(base_dir, 'test.html'), 'wb') as f:
            f.write('<html><div>á</div</html>'.encode('iso-8859-15'))
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='1.0')
        json_description = json.loads(resource.json_description)
        json_description['contents']['contenttype'] = 'application/xhtml+xml'
        resource.json_description = json.dumps(json_description)
        resource.save()

        from wirecloud.platform.models import XHTML
        xhtml = XHTML.objects.get(pk=1)
        xhtml.cacheable = False
        xhtml.save()

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 502)
        self.assertIn('Widget code was not encoded using the specified charset (utf-8', response.content)

    def test_widget_code_entry_get_html_missing(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'}
        url = reverse('wirecloud.widget_code_entry', kwargs=widget_id)

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 502)
        self.assertIn('HTML code is not accessible', response.content)

    def test_widget_code_entry_get_invalid_html(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'}
        url = reverse('wirecloud.widget_code_entry', kwargs=widget_id)

        # Prepare invalid widget code
        base_dir = localcatalogue.wgt_deployer.get_base_dir(**widget_id)
        os.makedirs(base_dir)
        with open(os.path.join(base_dir, 'test.html'), 'wb') as f:
            f.write('<html><div></div</html>')
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='1.0')
        json_description = json.loads(resource.json_description)
        json_description['contents']['contenttype'] = 'application/xhtml+xml'
        resource.json_description = json.dumps(json_description)
        resource.save()

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 502)
        self.assertIn('Error processing widget code', response.content)

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
        def update_iwidget_name():
            data = {
                'name': 'New Name',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content, '')

            # Check that the iwidget name has been changed
            iwidget = IWidget.objects.get(pk=2)
            self.assertEqual(iwidget.name, 'New Name')
        check_cache_is_purged(self, 2, update_iwidget_name)

    def test_iwidget_entry_post_bad_request_content_type(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        check_post_bad_request_content_type(self, url)

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
            variable = Variable.objects.get(
                vardef__name='text',
                iwidget__id=2
            )
            self.assertNotEqual(variable.value, 'new value')

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
        def update_iwidget_preference():
            data = {
                'text': 'new value',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content, '')

            # IWidget preferences should be updated
            variable = Variable.objects.get(
                vardef__name='text',
                iwidget__id=2
            )
            self.assertEqual(variable.value, 'new value')

        check_cache_is_purged(self, 2, update_iwidget_preference)

    def test_iwidget_preferences_post_bad_request_content_type(self):

        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        check_post_bad_request_content_type(self, url)

    def test_iwidget_preferences_entry_post_bad_request_syntax(self):

        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        check_post_bad_request_syntax(self, url)

    def test_iwidget_preferences_entry_post_nonexistent_preference(self):

        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'nonexistent': 'new value',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_preferences_entry_post_readonly_preference(self):

        vardef = Variable.objects.get(vardef__name='text', iwidget__id=2).vardef
        vardef.readonly = True
        vardef.save()

        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'text': 'new value',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def _todo_create_property(self):

        # TODO
        from wirecloud.platform.models import VariableDef
        vardef = VariableDef.objects.create(widget_id=1, name="prop", aspect="PROP", type="T", secure=False, default_value="")
        Variable.objects.create(vardef=vardef, iwidget_id=2, value="default")
        # end TODO

    def test_iwidget_properties_entry_post_requires_authentication(self):

        self._todo_create_property()

        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Make the request
        data = {
            'prop': 'new value',
        }

        def iwidget_preference_not_created(self):
            # IWidget properties should not be updated
            variable = Variable.objects.get(
                vardef__name='prop',
                iwidget__id=2
            )
            self.assertNotEqual(variable.value, 'new value')

        check_post_requires_authentication(self, url, json.dumps(data), iwidget_preference_not_created)

    def test_iwidget_properties_entry_post_requires_permission(self):

        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        data = {
            'prop': 'new value',
        }
        check_post_requires_permission(self, url, json.dumps(data))

    def test_iwidget_properties_entry_post(self):

        self._todo_create_property()

        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        def update_iwidget_property():
            data = {
                'prop': 'new value',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content, '')

            # IWidget properties should be updated
            variable = Variable.objects.get(
                vardef__name='prop',
                iwidget__id=2
            )
            self.assertEqual(variable.value, 'new value')
        check_cache_is_purged(self, 2, update_iwidget_property)

    def test_iwidget_properties_entry_post_bad_request_content_type(self):

        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        check_post_bad_request_content_type(self, url)

    def test_iwidget_properties_entry_post_bad_request_syntax(self):

        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        check_post_bad_request_syntax(self, url)

    def test_iwidget_properties_entry_post_nonexistent_property(self):

        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'nonexistent': 'new value',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

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
        def delete_iwidget_from_workspace():
            response = self.client.delete(url, HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content, '')

            # IWidget should be deleted
            self.assertRaises(IWidget.DoesNotExist, IWidget.objects.get, pk=2)
        check_cache_is_purged(self, 2, delete_iwidget_from_workspace)

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

        url = reverse('wirecloud.resource_collection')
        check_get_requires_authentication(self, url)

    def test_resource_collection_get(self):

        url = reverse('wirecloud.resource_collection')

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

            if resource['type'] == 'operator':
                for js_file in resource['js_files']:
                    self.assertTrue(js_file.startswith('http'))
            elif resource['type'] == 'widget':
                self.assertTrue(resource['contents']['src'].startswith('http'))

    def test_resource_collection_get_no_process_urls(self):

        url = reverse('wirecloud.resource_collection') + '?process_urls=false'

        self.client.login(username='admin', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        for resource_id in response_data:
            resource = response_data[resource_id]
            self.assertIn('type', resource)
            if resource['type'] == 'operator':
                for js_file in resource['js_files']:
                    self.assertTrue(not js_file.startswith('http'))
            elif resource['type'] == 'widget':
                self.assertTrue(not resource['contents']['src'].startswith('http'))

    def test_resource_collection_post_requires_authentication(self):

        url = reverse('wirecloud.resource_collection')
        check_post_requires_authentication(self, url, '{}')

    def test_resource_collection_post_widget(self):

        url = reverse('wirecloud.resource_collection')

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

        url = reverse('wirecloud.resource_collection')

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

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Invalid_HTML_Encoding_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_resource_collection_post_resource_missing_config_xml(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Missing_Config_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_resource_collection_post_resource_missing_contents_file(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Missing_HTML_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_resource_collection_post_resource_invalid_config_xml(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Invalid_Config_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['description'], 'Error parsing config.xml descriptor file: No valid parser found')

    def test_resource_collection_post_resource_missing_required_features(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Missing_Features_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('inexistentfeature', response_data['description'])

    def test_resource_collection_post_operator(self):

        url = reverse('wirecloud.resource_collection')

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

        url = reverse('wirecloud.resource_collection')

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

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_TestMashup2_1.0.zip'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

    def test_resource_collection_post_using_octet_stream(self):

        url = reverse('wirecloud.resource_collection')

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

    def test_resource_collection_post_using_invalid_resource_url(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        data = {
            'url': 'http://localhost:8001/inexistentresource.wgt'
        }
        response = self.client.post(url, json.dumps(data), content_type="application/json", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 409)

    def test_resource_collection_post_using_octet_stream_error(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        response = self.client.post(url, 'invalid content', content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)

    def test_resource_entry_get_requires_authentication(self):

        url = reverse('wirecloud.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})
        check_get_requires_authentication(self, url)

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt',), shared=True, deploy_only=True)
    def test_resource_entry_get(self):

        resource_id = ['Wirecloud', 'Test', '1.0']
        url = reverse('wirecloud.resource_entry', args=resource_id)

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/x-widget+mashable-application-component')

    def test_resource_entry_get_requires_permission(self):

        resource_id = (
            'Wirecloud',
            'TestOperator',
            '1.0',
        )
        url = reverse('wirecloud.resource_entry', args=resource_id)
        check_get_requires_permission(self, url)

    def test_resource_entry_delete_requires_authentication(self):

        url = reverse('wirecloud.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})
        check_delete_requires_authentication(self, url)

    def test_resource_entry_delete_uninstall(self):

        url = reverse('wirecloud.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})

        self.client.login(username='admin', password='admin')

        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        resource = CatalogueResource.objects.get(vendor= 'Wirecloud', short_name= 'Test', version= '1.0')
        self.assertFalse(resource.users.filter(username='admin').exists())

    def test_resource_entry_delete(self):

        resource = CatalogueResource.objects.get(vendor= 'Wirecloud', short_name= 'Test', version= '1.0')
        resource.users.clear()
        resource.users.add(2)
        resource.public = False
        resource.save()

        url = reverse('wirecloud.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})

        self.client.login(username='normuser', password='admin')

        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor= 'Wirecloud', short_name= 'Test', version= '1.0')


class ExtraApplicationMashupAPI(WirecloudTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('extra_rest_api',)

    def test_iwidget_collection_get_requires_authentication(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 2, 'tab_id': 101})
        check_get_requires_authentication(self, url)

    def test_iwidget_collection_get(self):

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

    def test_iwidget_entry_get(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_resource_description_entry_get(self):

        resource_id = ['Wirecloud', 'Test', '1.0']
        url = reverse('wirecloud.resource_description_entry', args=resource_id)

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content)
        self.assertTrue(response_data["contents"]["src"].startswith('http'))

    def test_resource_description_entry_get_no_process_urls(self):

        resource_id = ['Wirecloud', 'Test', '1.0']
        url = reverse('wirecloud.resource_description_entry', args=resource_id) + '?process_urls=false'

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content)
        self.assertFalse(response_data["contents"]["src"].startswith('http'))

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt',), shared=True, deploy_only=True)
    def test_resource_description_entry_get_including_files(self):

        resource_id = ['Wirecloud', 'Test', '1.0']
        url = reverse('wirecloud.resource_description_entry', args=resource_id) + '?include_wgt_files=true'

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content)
        self.assertEqual(set(response_data['wgt_files']), set(['images/catalogue_iphone.png', 'images/catalogue.png', 'test.html', 'config.xml', 'DESCRIPTION.md', 'CHANGELOG.md', 'doc/index.md']))

    @uses_extra_resources(('Wirecloud_TestOperator_1.0.zip',), shared=True, deploy_only=True)
    def test_resource_description_entry_get_including_files_distributable_resource(self):

        resource_id = ['Wirecloud', 'TestOperator', '1.0']
        url = reverse('wirecloud.resource_description_entry', args=resource_id) + '?include_wgt_files=true'

        # Authenticate
        self.client.login(username='emptyuser', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content)
        self.assertEqual(set(response_data['wgt_files']), set(['images/catalogue_iphone.png', 'images/catalogue.png', 'js/main.js', 'config.xml']))

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
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

    def test_market_collection_post_other_user(self):

        url = reverse('wirecloud.market_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make request
        data = {
            'name': 'new_market',
            'options': {
                'user': 'user_with_markets',
                'type': 'wirecloud',
                'url': 'http://example.com'
            }
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

    def test_market_collection_post_other_user_requires_permission(self):

        url = reverse('wirecloud.market_collection')
        data = {
            'name': 'new_market',
            'options': {
                'user': 'user_with_markets',
                'type': 'wirecloud',
                'url': 'http://example.com'
            }
        }
        check_post_requires_permission(self, url, json.dumps(data))

    def test_market_collection_post_duplicated(self):

        url = reverse('wirecloud.market_collection')

        # Authenticate
        self.client.login(username='user_with_markets', password='admin')

        # Make request
        data = {
            'name': 'deleteme',
            'user': 'user_with_markets',
            'options': {
                'type': 'wirecloud',
                'url': 'http://example.com'
            }
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        json.loads(response.content)

    def test_market_collection_bad_request_content_type(self):

        url = reverse('wirecloud.market_collection')
        check_post_bad_request_content_type(self, url)

    def test_market_collection_bad_request_syntax(self):

        url = reverse('wirecloud.market_collection')
        check_post_bad_request_syntax(self, url)

    def test_market_entry_delete_requires_authentication(self):

        url = reverse('wirecloud.market_entry', kwargs={'user': 'user_with_markets', 'market': 'deleteme'})
        check_delete_requires_authentication(self, url)

    def test_market_entry_delete_requires_permission(self):

        url = reverse('wirecloud.market_entry', kwargs={'user': 'user_with_markets', 'market': 'deleteme'})
        check_delete_requires_permission(self, url)

    def test_market_entry_delete_local(self):

        url = reverse('wirecloud.market_entry', kwargs={'market': 'local'})

        # Authenticate
        self.client.login(username='admin', password='admin')

        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)

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

    def test_market_publish_service_requires_authentication(self):

        data = {'resource': 'Wirecloud/Test/1.0', 'marketplaces': [{'market': 'origin'}]}
        url = reverse('wirecloud.publish_on_other_marketplace')
        check_post_requires_authentication(self, url, json.dumps(data))

    @uses_extra_resources(('Wirecloud_TestOperator_1.0.zip',), shared=True, deploy_only=True)
    def test_market_publish_service_requires_permission(self):

        data = {'resource': 'Wirecloud/TestOperator/1.0', 'marketplaces': [{'market': 'origin'}]}
        url = reverse('wirecloud.publish_on_other_marketplace')
        check_post_requires_permission(self, url, json.dumps(data))

    @uses_extra_resources(('Wirecloud_TestOperator_1.0.zip',), shared=True, deploy_only=True)
    def test_market_publish_service_requires_error_reporting(self):

        url = reverse('wirecloud.publish_on_other_marketplace')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        data = {'resource': 'Wirecloud/TestOperator/1.0', 'marketplaces': [{'market': 'origin'}]}
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 502)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('details', response_data)

    def test_market_publish_service_bad_request_syntax(self):

        url = reverse('wirecloud.publish_on_other_marketplace')
        check_post_bad_request_syntax(self, url)

    def test_platform_context_collection_get(self):

        url = reverse('wirecloud.platform_context_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['username']['value'], 'user_with_workspaces')

    def test_platform_context_collection_get_allows_anonymous_requests(self):

        url = reverse('wirecloud.platform_context_collection')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['username']['value'], 'anonymous')

    def test_platform_preference_collection_get(self):

        url = reverse('wirecloud.platform_preferences')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, dict))

    def test_platform_preference_collection_get_allows_anonymous_requests(self):

        url = reverse('wirecloud.platform_preferences')

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
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, '')

    def test_platform_preference_collection_bad_request_content_type(self):

        url = reverse('wirecloud.platform_preferences')
        check_post_bad_request_content_type(self, url)

    def test_platform_preference_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.platform_preferences')
        check_post_bad_request_syntax(self, url)

    def test_workspace_collection_get_allows_anonymous_requests(self):

        url = reverse('wirecloud.workspace_collection')

        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content)
        self.assertTrue(isinstance(response_data, list))
        self.assertEqual(len(response_data), 1)
        self.assertEqual(response_data[0]['name'], 'Public Workspace')

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

        # Update workspace name
        def update_workspace_name():
            data = {
                'name': 'RenamedWorkspace',
                'active': False,
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)

            user_workspace = UserWorkspace.objects.get(pk=2)
            self.assertEqual(user_workspace.workspace.name, data['name'])
            self.assertEqual(user_workspace.active, False)

        check_cache_is_purged(self, 2, update_workspace_name)

        # Set workspace as active
        def mark_workspace_active():
            data = {
                'name': 'Workspace',
                'active': 'True',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)

            user_workspace = UserWorkspace.objects.get(pk=2)
            self.assertEqual(user_workspace.workspace.name, data['name'])
            self.assertEqual(user_workspace.active, True)
        check_cache_is_purged(self, 2, mark_workspace_active)

    def test_workspace_entry_post_bad_request_content_type(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 2})
        check_post_bad_request_content_type(self, url)

    def test_workspace_entry_post_bad_request_syntax(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 2})
        check_post_bad_request_syntax(self, url)

    @uses_extra_resources(('Wirecloud_test-mashup_1.0.wgt',), shared=True, deploy_only=True)
    def test_workspace_merge_service_post_requires_authentication(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        data = {
            'mashup': 'Wirecloud/test-mashup/1.0',
        }
        check_post_requires_authentication(self, url, json.dumps(data))

    @uses_extra_resources(('Wirecloud_test-mashup_1.0.wgt',), shared=True, deploy_only=True)
    def test_workspace_merge_service_post_requires_permission(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        data = {
            'mashup': 'Wirecloud/test-mashup/1.0',
        }
        check_post_requires_permission(self, url, json.dumps(data))

    @uses_extra_resources(('Wirecloud_test-mashup_1.0.wgt',), shared=True, deploy_only=True)
    def test_workspace_merge_service_post(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        def merge_workspaces():
            data = {
                'mashup': 'Wirecloud/test-mashup/1.0',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)

            # Check new workspace status_code
            workspace = Workspace.objects.get(pk=2)
            tabs = workspace.tab_set.order_by('position')[:]
            self.assertEqual(len(tabs), 3)
            self.assertEqual(tabs[0].iwidget_set.count(), 2)
            self.assertEqual(tabs[1].iwidget_set.count(), 1)
            self.assertEqual(tabs[2].iwidget_set.count(), 1)
        check_cache_is_purged(self, 2, merge_workspaces)

    def test_workspace_merge_service_post_required_paramateres(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {}
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')

        # Request should fail as the API requires you to provide a mashup or a workspace id
        self.assertEqual(response.status_code, 422)

    @uses_extra_resources(('Wirecloud_test-mashup_1.0.wgt',), shared=True, deploy_only=True)
    def test_workspace_merge_service_post_using_workspace_and_mashup_parameters(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup/1.0',
            'workspace': '3',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')

        # Request should fail as the API doesn't allow using both parameters, mashup and workspace, in the same request
        self.assertEqual(response.status_code, 422)

    def test_workspace_merge_service_post_from_workspace(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        def merge_workspaces():
            data = {
                'workspace': '3',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)

            # Check new workspace status
            workspace = Workspace.objects.get(pk=2)
            tabs = workspace.tab_set.order_by('position')[:]
            self.assertEqual(len(tabs), 3)
            self.assertEqual(tabs[0].iwidget_set.count(), 2)
            self.assertEqual(tabs[1].iwidget_set.count(), 1)
            self.assertEqual(tabs[2].iwidget_set.count(), 1)
        check_cache_is_purged(self, 2, merge_workspaces)

    def test_workspace_merge_service_post_from_mashup_bad_id(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'mashup': 'bad/id',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

    def test_workspace_merge_service_post_from_nonexistent_mashup(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/nonexistent-mashup/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

    def test_workspace_merge_service_post_bad_request_content_type(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})
        check_post_bad_request_content_type(self, url)

    def test_workspace_merge_service_post_bad_request_syntax(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})
        check_post_bad_request_syntax(self, url)

    def test_workspace_preference_collection_get_requires_authentication(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})
        check_get_requires_authentication(self, url)

    def test_workspace_preference_collection_get_requires_permission(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})
        check_get_requires_permission(self, url)

    def test_workspace_preference_collection_get(self):

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

        # Make the request
        def update_workspace_preferences():

            data = {
                'pref1': {'inherit': False, 'value': '5'},
                'pref2': {'inherit': True, 'value': 'false'},
                'public': {'inherit': False, 'value': 'true'}
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content, '')
        check_cache_is_purged(self, 2, update_workspace_preferences)

    def test_workspace_preference_collection_post_withoutchanges(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})
        WorkspacePreference.objects.create(workspace_id=2, name='pref1', inherit=False, value='5')
        WorkspacePreference.objects.create(workspace_id=2, name='pref2', inherit=True, value='false')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        def update_workspace_preferences():

            data = {
                'pref1': {'inherit': False, 'value': '5'},
                'pref2': {'inherit': True, 'value': 'false'}
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content, '')
        check_cache_is_purged(self, 2, update_workspace_preferences, inverse=True)

    def test_workspace_entry_preference_collection_post_bad_request_content_type(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})
        check_post_bad_request_content_type(self, url)

    def test_workspace_preference_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.workspace_preferences', kwargs={'workspace_id': 2})
        check_post_bad_request_syntax(self, url)

    def test_tab_preference_collection_get_requires_authentication(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})
        check_get_requires_authentication(self, url)

    def test_tab_preference_collection_get_requires_permission(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})
        check_get_requires_permission(self, url)

    def test_tab_preference_collection_get(self):

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

        # Make the request
        def update_workspace_tab_preferences():
            data = {
                'pref1': '5',
                'pref2': 'true',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content, '')
        check_cache_is_purged(self, 2, update_workspace_tab_preferences)

    def test_tab_preference_collection_post_bad_request_content_type(self):

        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 101})
        check_post_bad_request_content_type(self, url)

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
        check_post_requires_authentication(self, url, json.dumps(data))

    def test_workspace_publish(self):

        url = reverse('wirecloud.workspace_publish', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {
            'vendor': 'Wirecloud',
            'name': 'test-published-mashup',
            'title': 'Mashup (Rest API Test)',
            'version': '1.0.5',
            'email': 'test@example.com'
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.content)
        self.assertEqual(response_data['vendor'], 'Wirecloud')
        self.assertEqual(response_data['name'], 'test-published-mashup')
        self.assertEqual(response_data['title'], 'Mashup (Rest API Test)')
        self.assertEqual(response_data['version'], '1.0.5')

    def test_workspace_publish_including_images(self):

        url = reverse('wirecloud.workspace_publish', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {
            'vendor': 'Wirecloud',
            'name': 'test-published-mashup',
            'version': '1.0.5',
            'email': 'test@example.com'
        }

        original_catalogue_image = os.path.join(self.shared_test_data_dir, 'src/api-test/images/catalogue.png')
        original_smartphone_image = os.path.join(self.shared_test_data_dir, 'src/api-test/images/smartphone.png')
        with open(original_catalogue_image, 'rb') as f1:
            with open(original_smartphone_image, 'rb') as f2:
                response = self.client.post(url, {'json': json.dumps(data), 'image': f1, 'smartphoneimage': f2}, HTTP_ACCEPT='application/json')

        self.assertEqual(response.status_code, 201)

        # Check images has been uploaded
        test_mashup = CatalogueResource.objects.get(short_name='test-published-mashup')
        base_dir = catalogue.wgt_deployer.get_base_dir('Wirecloud', 'test-published-mashup', '1.0.5')
        test_mashup_info = json.loads(test_mashup.json_description)

        image_path = os.path.join(base_dir, test_mashup_info['image'])
        self.assertTrue(filecmp.cmp(original_catalogue_image, image_path))

        smartphone_image_path = os.path.join(base_dir, test_mashup_info['smartphoneimage'])
        self.assertTrue(filecmp.cmp(original_smartphone_image, smartphone_image_path))

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt', 'Wirecloud_TestOperator_1.0.zip'), shared=True, deploy_only=True)
    def test_workspace_publish_embedmacs(self):

        url = reverse('wirecloud.workspace_publish', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {
            'vendor': 'Wirecloud',
            'name': 'test-published-mashup',
            'title': 'Mashup (Rest API Test)',
            'version': '1.0.5',
            'embedmacs': True
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.content)
        self.assertEqual(response_data['vendor'], 'Wirecloud')
        self.assertEqual(response_data['name'], 'test-published-mashup')
        self.assertEqual(response_data['title'], 'Mashup (Rest API Test)')
        self.assertEqual(response_data['version'], '1.0.5')
        embedded_resources = set(['/'.join((resource['vendor'], resource['name'], resource['version'])) for resource in response_data['embedded']])
        self.assertEqual(embedded_resources, set(('Wirecloud/Test/1.0', 'Wirecloud/TestOperator/1.0')))

    def test_workspace_publish_bad_provided_data(self):

        url = reverse('wirecloud.workspace_publish', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Test missing parameters
        data = {}
        check_post_bad_provided_data(self, url, json.dumps(data))

        # Test empty name
        data = {
            'vendor': 'Wirecloud',
            'name': '',
            'version': '1.0.5',
            'email': 'test@example.com'
        }
        check_post_bad_provided_data(self, url, json.dumps(data))

        # Test invalid vendor
        data = {
            'vendor': 'Wire/cloud',
            'name': 'test-published-mashup',
            'version': '1.0.5',
            'email': 'test@example.com'
        }
        check_post_bad_provided_data(self, url, json.dumps(data))

        # Test invalid name
        data = {
            'vendor': 'Wirecloud',
            'name': 'test/published/mashup',
            'version': '1.0.5',
            'email': 'test@example.com'
        }
        check_post_bad_provided_data(self, url, json.dumps(data))

        # Test invalid version
        data = {
            'vendor': 'Wirecloud',
            'name': 'test-published-mashup',
            'version': '1.0.05',
            'email': 'test@example.com'
        }
        check_post_bad_provided_data(self, url, json.dumps(data))

    def test_workspace_publish_bad_request_syntax(self):

        url = reverse('wirecloud.workspace_publish', kwargs={'workspace_id': 2})
        check_post_bad_request_syntax(self, url)
