# -*- coding: utf-8 -*-

# Copyright (c) 2013-2017 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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

import filecmp
import json
from lxml import etree
import os
from unittest.mock import Mock, patch

from django.core.urlresolvers import reverse
from django.contrib.auth.models import User, Group
from django.test import Client, TestCase, TransactionTestCase

from wirecloud.catalogue import utils as catalogue
from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.testcases import uses_extra_resources, WirecloudTestCase
from wirecloud.platform.models import IWidget, Tab, Workspace, UserWorkspace, WorkspacePreference
from wirecloud.platform.widget import utils as localcatalogue
from wirecloud.platform.workspace.utils import encrypt_value


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


def check_not_found_response(self, method, url, body=None):

    if method in ('get', 'delete'):
        response = getattr(self.client, method)(url, HTTP_ACCEPT='application/json')
    else:
        response = getattr(self.client, method)(url, body, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 404)
    self.assertEqual(response['Content-Type'], 'application/json; charset=utf-8')


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
    response_data = json.loads(response.content.decode('utf-8'))
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
    response_data = json.loads(response.content.decode('utf-8'))
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
    response_data = json.loads(response.content.decode('utf-8'))
    self.assertTrue(isinstance(response_data, dict))


def check_post_bad_request_syntax(self, url, username='user_with_workspaces'):

    # Authenticate
    self.client.login(username=username, password='admin')

    # Test bad json syntax
    response = self.client.post(url, 'bad syntax', content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 400)
    response_data = json.loads(response.content.decode('utf-8'))
    self.assertTrue(isinstance(response_data, dict))


def check_post_bad_provided_data(self, url, data):

    response = self.client.post(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 400)
    response_data = json.loads(response.content.decode('utf-8'))
    self.assertTrue(isinstance(response_data, dict))


def check_put_bad_request_content_type(self, url):

    # Authenticate
    self.client.login(username='user_with_workspaces', password='admin')

    # Test bad json syntax
    response = self.client.put(url, 'bad content type', content_type='bad/content-type; charset=UTF-8', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 415)
    response_data = json.loads(response.content.decode('utf-8'))
    self.assertTrue(isinstance(response_data, dict))


def check_put_bad_request_syntax(self, url):

    # Authenticate
    self.client.login(username='user_with_workspaces', password='admin')

    # Test bad json syntax
    response = self.client.put(url, 'bad syntax', content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 400)
    response_data = json.loads(response.content.decode('utf-8'))
    self.assertTrue(isinstance(response_data, dict))


def check_put_requires_authentication(self, url, data, test_after_request=None):

    response = self.client.put(url, data, HTTP_ACCEPT='application/json')
    self.assertEqual(response.status_code, 401)
    self.assertTrue('WWW-Authenticate' in response)

    # Error response should be a dict
    self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
    response_data = json.loads(response.content.decode('utf-8'))
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
    response_data = json.loads(response.content.decode('utf-8'))
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


def check_delete_requires_permission(self, url, test_after_request=None, user="emptyuser"):

    # Authenticate
    self.client.login(username=user, password='admin')

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
        self.assertEqual(response.status_code, 200)
        json.loads(response.content.decode('utf-8'))

        new_etag = response['ETag']
    else:
        new_etag = current_etag

    # There are no changes in the workspaces, so next requests so return a 304 error code
    cached_response = self.client.get(url, HTTP_ACCEPT='application/json', HTTP_IF_NONE_MATCH=new_etag)
    self.assertEqual(cached_response.status_code, 304)

    return new_etag


def prepare_missing_dependencies_test():

    # Make Test and TestOperator unavailable to any user
    test_widget = CatalogueResource.objects.get(short_name='Test')
    test_widget.public = False
    test_widget.users.clear()
    test_widget.save()

    test_operator = CatalogueResource.objects.get(short_name='TestOperator')
    test_operator.public = False
    test_operator.users.clear()
    test_operator.save()


def check_missing_dependencies_respose(testcase, response):

    # Check basic response structure
    response_data = json.loads(response.content.decode('utf-8'))
    testcase.assertTrue(isinstance(response_data, dict))
    testcase.assertTrue('description' in response_data)
    testcase.assertTrue('details' in response_data)
    testcase.assertTrue('missingDependencies' in response_data['details'])
    missingDependencies = set(response_data['details']['missingDependencies'])
    testcase.assertEqual(len(response_data['details']['missingDependencies']), len(missingDependencies))
    testcase.assertEqual(missingDependencies, set((
        'Wirecloud/nonavailable-operator/1.0',
        'Wirecloud/nonavailable-widget/1.0',
        'Wirecloud/TestOperator/1.0',
        'Wirecloud/Test/1.0',
    )))


def check_get_request(self, url, *args, **kwargs):
    response = self.client.get(url, *args, **kwargs)
    self.assertIn('ETag', response)
    initial_etag = response['ETag']

    head_response = self.client.head(url, *args, **kwargs)
    self.assertIn('ETag', head_response)
    head_etag = head_response['ETag']

    self.assertEqual(response.status_code, head_response.status_code)
    for header in response._headers:
        # Ignore Date and Last-Modified headers
        if header in ('date', 'last-modified'):
            continue
        self.assertEqual(response[header], head_response[header])
    self.assertEqual(initial_etag, head_etag)

    cached_response = self.client.get(url, *args, HTTP_IF_NONE_MATCH=initial_etag, **kwargs)
    self.assertEqual(cached_response.status_code, 304)

    return response


class ApplicationMashupAPI(WirecloudTestCase, TransactionTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces', 'extra_wiring_test_data')
    tags = ('wirecloud-rest-api', 'wirecloud-noselenium')
    populate = False
    use_search_indexes = False

    def setUp(self):
        super(ApplicationMashupAPI, self).setUp()

        self.client = Client()

    def test_feature_collection_get(self):

        url = reverse('wirecloud.features')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_workspace_collection_get(self):

        url = reverse('wirecloud.workspace_collection')

        self.client.login(username='admin', password='admin')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content.decode('utf-8'))
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
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertTrue(isinstance(response_data["id"], str))  # id must be an string
        self.assertEqual(response_data['name'], 'test')
        self.assertEqual(response_data['title'], 'test')
        self.assertTrue(isinstance(response_data['wiring'], dict))

        # Workspace should be created
        self.assertTrue(Workspace.objects.filter(creator=1, name='test').exists())

    def test_workspace_collection_post_title(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        data = {
            'title': 'nÉw wörkspace'
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        # Check basic response structure
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertTrue(isinstance(response_data["id"], str))  # id must be an string
        self.assertEqual(response_data['name'], 'new-workspace')
        self.assertEqual(response_data['title'], 'nÉw wörkspace')
        self.assertTrue(isinstance(response_data['wiring'], dict))

        # Workspace should be created
        self.assertTrue(Workspace.objects.filter(creator=1, name='new-workspace').exists())

    def test_workspace_collection_post_from_workspace(self):

        # Make TestOperator available to emptyuser
        test_widget = CatalogueResource.objects.get(short_name='TestOperator')
        test_widget.public = True
        test_widget.save()

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='emptyuser', password='admin')

        # Make the request
        # workspace 4 (owner: user_with_workspaces, name: public-workspace, title: Public Workspace) is readable and copyable by emptyuser
        data = {
            'workspace': '4',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(response_data['owner'], 'emptyuser')
        self.assertEqual(response_data['name'], 'public-workspace')
        self.assertEqual(response_data['title'], 'Public Workspace')
        public_preference = response_data['preferences'].get('public', {'value': 'False', 'inherit': False})
        self.assertEqual(public_preference['value'], 'false')

    def test_workspace_collection_post_from_workspace_allow_renaming(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # workspace 3 (owner: user_with_workspaces, name: Pending Events)
        data = {
            'allow_renaming': True,
            'workspace': '3',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(response_data['owner'], 'user_with_workspaces')
        self.assertEqual(response_data['name'], 'pending-events-2')
        self.assertEqual(response_data['title'], 'Pending Events')
        public_preference = response_data['preferences'].get('public', {'value': 'False', 'inherit': False})
        self.assertEqual(public_preference['value'], 'false')

    def test_workspace_collection_post_from_workspace_requires_permission(self):

        url = reverse('wirecloud.workspace_collection')

        # workspace 3 (owner: user_with_workspaces, name: Pending Events) is not readable by emptyuser
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

    def test_workspace_collection_post_mashup_and_workspace(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup/1.0',
            'workspace': '3',
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
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertTrue(isinstance(response_data["id"], str))  # id must be an string
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
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertTrue(isinstance(response_data["id"], str))  # id must be an string
        self.assertEqual(response_data['name'], 'test-mashup')
        self.assertEqual(response_data['title'], 'Test Mashup')
        self.assertTrue(isinstance(response_data['wiring'], dict))

        # Workspace should be created
        self.assertTrue(Workspace.objects.filter(creator=2, name='test-mashup').exists())

    @uses_extra_resources(('Wirecloud_ParameterizedMashup_1.0.zip',), shared=True)
    def test_workspace_collection_post_creation_from_mashup_with_preferences(self):

        url = reverse('wirecloud.workspace_collection')

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'name': 'test',
            'mashup': 'Wirecloud/ParameterizedMashup/1.0',
            'preferences': {
                'password_param': 'password from api',
                'text_param': 'text from api',
            }
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        # Check basic response structure
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertTrue(isinstance(response_data["id"], str))  # id must be an string
        self.assertEqual(response_data['name'], 'test')
        self.assertTrue(isinstance(response_data['wiring'], dict))
        self.assertEqual(response_data['preferences']['password_param'], {'inherit': False, 'value': 'password from api'})
        self.assertEqual(response_data['preferences']['text_param'], {'inherit': False, 'value': 'text from api'})

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

        prepare_missing_dependencies_test()

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup-dependencies/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)
        check_missing_dependencies_respose(self, response)

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
        response_data = json.loads(response.content.decode('utf-8'))
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
        response_data = json.loads(response.content.decode('utf-8'))
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
        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        # Response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertTrue(isinstance(response_data["id"], str))  # id must be an string
        self.assertFalse(response_data['shared'])
        self.assertEqual(response_data['name'], 'ExistingWorkspace')
        self.assertEqual(response_data['owner'], 'user_with_workspaces')
        self.assertTrue('wiring' in response_data)

        self.assertEqual(response_data['description'], 'This is an <b>example</b> of workspace')
        self.assertEqual(response_data['longdescription'], '<p>This is an <strong>example</strong> of workspace</p>')
        self.assertTrue('tabs' in response_data)
        self.assertTrue(isinstance(response_data['tabs'], list))
        self.assertTrue(len(response_data['tabs']) > 0)
        self.assertTrue(isinstance(response_data['tabs'][0], dict))
        self.assertTrue('id' in response_data['tabs'][0])
        self.assertTrue(isinstance(response_data['tabs'][0]['id'], str))  # id must be an string
        self.assertTrue('name' in response_data['tabs'][0])
        self.assertTrue('preferences' in response_data['tabs'][0])
        self.assertTrue(isinstance(response_data['tabs'][0]['preferences'], dict))
        self.assertTrue('iwidgets' in response_data['tabs'][0])
        self.assertTrue(isinstance(response_data['tabs'][0]['iwidgets'], list))

        self.assertTrue('preferences' in response_data)
        self.assertTrue(isinstance(response_data['preferences'], dict))

    def test_workspace_entry_get_not_found(self):
        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 404})
        check_not_found_response(self, 'get', url)

    def test_workspace_entry_get_allows_anonymous_requests(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 4})

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        # Response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue('id' in response_data)
        self.assertTrue(isinstance(response_data["id"], str))  # id must be an string
        self.assertTrue(response_data['shared'])
        self.assertEqual(response_data['name'], 'public-workspace')
        self.assertEqual(response_data['title'], 'Public Workspace')
        self.assertEqual(response_data['owner'], 'user_with_workspaces')

    def test_workspace_entry_cache(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 4})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make initial request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        json.loads(response.content.decode('utf-8'))
        etag = response['ETag']

        # There are no changes in the workspaces, so next requests so return a 304 error code
        response = self.client.get(url, HTTP_ACCEPT='application/json', HTTP_IF_NONE_MATCH=etag)
        self.assertEqual(response.status_code, 304)

        # TODO those tests should live in they own method
        # Update widget position
        def update_widget_position():
            url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 4, 'tab_id': 104})
            data = [
                {"id": "5", "top": 24, "left": 6}
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

    def test_workspace_entry_delete_requires_permission_shared(self):
        # This workspace has been shared with normuser but normuser is not the owner
        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 10})
        check_delete_requires_permission(self, url, user="normuser")

    def test_workspace_entry_delete(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Workspace should be removed
        self.assertFalse(Workspace.objects.filter(name='ExistingWorkspace').exists())

    def test_workspace_entry_delete_shared(self):
        # This workspace has been shared with normuser
        self.assertGreater(Workspace.objects.get(pk=10).users.count(), 1)
        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 10})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Workspace should be removed
        self.assertFalse(Workspace.objects.filter(pk=10).exists())

    def test_workspace_entry_delete_not_found(self):
        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'delete', url)

    def test_workspace_resource_collection_get(self):

        url = reverse('wirecloud.workspace_resource_collection', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue(response_data["Wirecloud/TestOperator/1.0"]["js_files"][0].startswith('http'))

    def test_workspace_resource_collection_get_not_found(self):

        url = reverse('wirecloud.workspace_resource_collection', kwargs={'workspace_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def test_workspace_resource_collection_get_no_process_urls(self):

        url = reverse('wirecloud.workspace_resource_collection', kwargs={'workspace_id': 2}) + '?process_urls=false'

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data["Wirecloud/TestOperator/1.0"]["js_files"][0], "js/main.js")

    def test_workspace_resource_collection_get_requires_permission(self):

        url = reverse('wirecloud.workspace_resource_collection', kwargs={'workspace_id': 1})
        check_get_requires_permission(self, url)

    def test_workspace_wiring_entry_put_requires_authentication(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 1})
        workspace = Workspace.objects.get(id=1)
        old_wiring_status = workspace.wiringStatus

        data = json.dumps({
            'operators': {'0': {'name': 'Wirecloud/TestOperator/1.0', 'preferences': {}}},
            'connections': [],
        })
        response = self.client.put(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Error response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

        # Workspace wiring status should not have change
        workspace = Workspace.objects.get(id=1)
        self.assertEqual(workspace.wiringStatus, old_wiring_status)

        # Check using Accept: text/html
        response = self.client.put(url, data, content_type='application/json; charset=UTF-8', HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Content type of the response should be text/html
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    def test_workspace_wiring_entry_put_requires_permission(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 1})
        data = {
            'operators': {'0': {'name': 'Wirecloud/TestOperator/1.0', 'preferences': {}}},
            'connections': [],
        }
        check_put_requires_permission(self, url, json.dumps(data))

    def test_workspace_wiring_entry_put(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 1})
        new_wiring_status = {
            'operators': {'0': {'name': 'Wirecloud/TestOperator/1.0', 'preferences': {}, 'properties': {}}},
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
            self.assertEqual(workspace.wiringStatus, new_wiring_status)
        check_cache_is_purged(self, 1, update_workspace_wiring)

    def test_workspace_wiring_entry_put_not_found(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {
            'operators': {'0': {'name': 'Wirecloud/TestOperator/1.0', 'preferences': {}}},
            'connections': [],
        }
        check_not_found_response(self, 'put', url, json.dumps(data))

    def test_workspace_wiring_entry_put_bad_request_syntax(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 1})
        check_put_bad_request_syntax(self, url)

    def test_workspace_wiring_entry_patch_requires_authentication(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 1})
        workspace = Workspace.objects.get(id=1)
        old_wiring_status = workspace.wiringStatus

        data = json.dumps([{
            'op': "add",
            'path': "/operators/0",
            'value': {'operators': {'0': {'name': 'Wirecloud/TestOperator/1.0', 'preferences': {}, 'properties': {}}}},
        }])

        response = self.client.patch(url, data, content_type='application/json-patch+json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Error response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

        # Workspace wiring status should not have change
        workspace = Workspace.objects.get(id=1)
        self.assertEqual(workspace.wiringStatus, old_wiring_status)

        # Check using Accept: text/html
        response = self.client.patch(url, data, content_type='application/json-patch+json; charset=UTF-8', HTTP_ACCEPT='text/html')
        self.assertEqual(response.status_code, 401)
        self.assertTrue('WWW-Authenticate' in response)

        # Content type of the response should be text/html
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'text/html')

    def test_workspace_wiring_entry_patch(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 1})
        new_wiring_status = {
            'operators': {'0': {'name': 'Wirecloud/TestOperator/1.0', 'preferences': {}, 'properties': {}}},
            'connections': [],
        }

        data = json.dumps([{
            'op': "add",
            'path': "/operators/0",
            'value': new_wiring_status["operators"]["0"],
        }])

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        def patch_workspace_wiring():
            response = self.client.patch(url, data, content_type='application/json-patch+json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)

            # Workspace wiring status should have change
            workspace = Workspace.objects.get(id=1)
            self.assertEqual(workspace.wiringStatus["operators"], new_wiring_status["operators"])
        check_cache_is_purged(self, 1, patch_workspace_wiring)

    def test_workspace_wiring_entry_patch_not_found(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = json.dumps([{
            'op': "add",
            'path': "/operators/0",
            'value': {'name': 'Wirecloud/TestOperator/1.0', 'preferences': {}}
        }])

        response = self.client.patch(url, data, content_type='application/json-patch+json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 404)

    @uses_extra_resources(('Wirecloud_TestOperatorSecure_1.0.zip',), shared=True)
    def test_workspace_wiring_entry_patch_preference_value(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 202})

        data = [{
            "op": "replace",
            "path": "/operators/2/preferences/pref_secure/value",
            "value": 'helloWorld',
        }]

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')
        response = self.client.patch(url, json.dumps(data), content_type='application/json-patch+json; charset=UTF-8')

        self.assertEqual(response.status_code, 204)

        # Check if preferences changed
        self.assertEqual(Workspace.objects.get(pk=202).wiringStatus["operators"]["2"]["preferences"]["pref_secure"]["value"]["users"]["4"], encrypt_value("helloWorld"))
        # Other preferences should not be modified
        self.assertEqual(Workspace.objects.get(pk=202).wiringStatus["operators"]["2"]["preferences"]["username"]["value"]["users"]["4"], "test_username")

    def test_workspace_wiring_entry_patch_preference_value_missing_operator_permission(self):
        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 203})

        data = [{
            "op": "replace",
            "path": "/operators/1/preferences/pref_secure/value",
            "value": 'helloWorld',
        }]

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')
        response = self.client.patch(url, json.dumps(data), content_type='application/json-patch+json; charset=UTF-8')

        self.assertEqual(response.status_code, 403)

    def test_workspace_wiring_entry_patch_preference_value_read_only_permission(self):
        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 202})

        data = [{
            "op": "replace",
            "path": "/operators/2/preferences/username/value",
            "value": 'helloWorld',
        }]

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.patch(url, json.dumps(data), content_type='application/json-patch+json; charset=UTF-8')
        self.assertEqual(response.status_code, 403)

        # Check if preferences changed
        self.assertEqual(Workspace.objects.get(pk=202).wiringStatus["operators"]["2"]["preferences"]["username"]["value"]["users"]["4"], "test_username")

    def test_workspace_wiring_entry_patch_empty_request(self):

        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 202})

        data = []

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.patch(url, json.dumps(data), content_type='application/json-patch+json; charset=UTF-8')
        self.assertEqual(response.status_code, 204)

    def test_workspace_wiring_entry_patch_preference_value_nonexistent_preference(self):
        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 202})

        data = [{
            "op": "replace",
            "path": "/operators/1/preferences/doesNotExist/value",
            "value": 'helloWorld',
        }]

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.patch(url, json.dumps(data), content_type='application/json-patch+json; charset=UTF-8')
        self.assertEqual(response.status_code, 422)

        self.assertFalse("doesNotExist" in Workspace.objects.get(pk=202).wiringStatus["operators"]["2"]["preferences"])

    def test_workspace_wiring_entry_patch_invalid_patch_operation(self):
        url = reverse('wirecloud.workspace_wiring', kwargs={'workspace_id': 202})

        data = {"this": "isNotAPatch"}

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.patch(url, json.dumps(data), content_type='application/json-patch+json; charset=UTF-8')
        self.assertEqual(response.status_code, 400)

    def test_operator_variables_entry_get_requires_authentication(self):
        url = reverse('wirecloud.operator_variables', kwargs={'workspace_id': 202, 'operator_id': 2})

        check_get_requires_authentication(self, url)

    def test_operator_variables_entry_get_requires_permission(self):
        url = reverse('wirecloud.operator_variables', kwargs={'workspace_id': 202, 'operator_id': 2})

        check_get_requires_permission(self, url)

    def test_operator_variables_entry_get_missing_operator(self):
        url = reverse('wirecloud.operator_variables', kwargs={'workspace_id': 202, 'operator_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        expectedResult = {
            'preferences': {},
            'properties': {}
        }

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(response_data, expectedResult)

    @uses_extra_resources(('Wirecloud_TestOperatorSecure_1.0.zip',), shared=True)
    def test_operator_variables_entry_get(self):
        url = reverse('wirecloud.operator_variables', kwargs={'workspace_id': 202, 'operator_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        expectedResult = {
            'preferences': {
                'pref_secure': {
                    'hidden': False,
                    'name': 'pref_secure',
                    'readonly': False,
                    'secure': True,
                    'value': '********'
                },
                'username': {
                    'hidden': False,
                    'name': 'username',
                    'readonly': False,
                    'secure': False,
                    'value': 'test_username'
                }
            },
            'properties': {}
        }

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(response_data, expectedResult)

    def test_operator_variables_entry_get_workspace_not_found(self):
        url = reverse('wirecloud.operator_variables', kwargs={'workspace_id': 404, 'operator_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def test_operator_variables_entry_get_operator_not_found(self):
        url = reverse('wirecloud.operator_variables', kwargs={'workspace_id': 202, 'operator_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

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
                'title': 'rest_api_test'
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 201)

            # Check basic response structure
            response_data = json.loads(response.content.decode('utf-8'))
            self.assertTrue(isinstance(response_data, dict))
            self.assertIn("id", response_data)
            self.assertTrue(isinstance(response_data["id"], str))  # id must be an string
            self.assertEqual(response_data['name'], 'rest_api_test')
            self.assertEqual(response_data['title'], 'rest_api_test')
            self.assertEqual(response_data['iwidgets'], [])

            # Tab should be created
            self.assertTrue(Tab.objects.filter(name='rest_api_test').exists())
        check_cache_is_purged(self, 1, create_workspace_tab)

    def test_tab_collection_post(self):

        url = reverse('wirecloud.tab_collection', kwargs={'workspace_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        def create_workspace_tab():
            data = {
                'name': 'rest_api_test',
                'title': 'Rest API Test'
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 201)

            # Check basic response structure
            response_data = json.loads(response.content.decode('utf-8'))
            self.assertTrue(isinstance(response_data, dict))
            self.assertIn("id", response_data)
            self.assertTrue(isinstance(response_data["id"], str))  # id must be an string
            self.assertEqual(response_data['name'], 'rest_api_test')
            self.assertEqual(response_data['title'], 'Rest API Test')
            self.assertEqual(response_data['iwidgets'], [])

            # Tab should be created
            self.assertTrue(Tab.objects.filter(name='rest_api_test').exists())
        check_cache_is_purged(self, 1, create_workspace_tab)

    def test_tab_collection_post_only_name(self):

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
            response_data = json.loads(response.content.decode('utf-8'))
            self.assertTrue(isinstance(response_data, dict))
            self.assertIn("id", response_data)
            self.assertTrue(isinstance(response_data["id"], str))  # id must be an string
            self.assertEqual(response_data['name'], 'rest_api_test')
            self.assertEqual(response_data['title'], 'rest_api_test')
            self.assertEqual(response_data['iwidgets'], [])

            # Tab should be created
            self.assertTrue(Tab.objects.filter(name='rest_api_test').exists())
        check_cache_is_purged(self, 1, create_workspace_tab)

    def test_tab_collection_post_only_title(self):

        url = reverse('wirecloud.tab_collection', kwargs={'workspace_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        def create_workspace_tab():
            data = {
                'title': 'Rest apí test',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 201)

            # Check basic response structure
            response_data = json.loads(response.content.decode('utf-8'))
            self.assertTrue(isinstance(response_data, dict))
            self.assertIn("id", response_data)
            self.assertTrue(isinstance(response_data["id"], str))  # id must be an string
            self.assertEqual(response_data['name'], 'rest-api-test')
            self.assertEqual(response_data['title'], 'Rest apí test')
            self.assertEqual(response_data['iwidgets'], [])

            # Tab should be created
            self.assertTrue(Tab.objects.filter(name='rest-api-test').exists())
        check_cache_is_purged(self, 1, create_workspace_tab)

    def test_tab_collection_post_not_found(self):
        url = reverse('wirecloud.tab_collection', kwargs={'workspace_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'name': 'rest_api_test'}
        check_not_found_response(self, 'post', url, json.dumps(data))

    def test_tab_collection_post_missing_name(self):

        url = reverse('wirecloud.tab_collection', kwargs={'workspace_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {}
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

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

    def test_tab_entry_get_requires_permission(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 1})
        check_get_requires_permission(self, url)

    def test_tab_entry_get(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        # Response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertTrue('id' in response_data)
        self.assertTrue(isinstance(response_data["id"], str))  # id must be an string
        self.assertEqual(response_data['name'], 'ExistingTab')
        self.assertEqual(response_data['visible'], True)
        self.assertTrue('preferences' in response_data)
        self.assertTrue(isinstance(response_data['preferences'], dict))
        self.assertTrue('iwidgets' in response_data)
        self.assertTrue(isinstance(response_data['iwidgets'], list))

    def test_tab_entry_get_workspace_not_found(self):
        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 404, 'tab_id': 1})
        check_not_found_response(self, 'get', url)

    def test_tab_entry_get_tab_not_found(self):
        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 404})
        check_not_found_response(self, 'get', url)

    def test_tab_entry_get_allows_anonymous_requests(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 4, 'tab_id': 104})

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        # Response should be a dict
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue('id' in response_data)
        self.assertTrue(isinstance(response_data["id"], str))  # id must be an string
        self.assertEqual(response_data['name'], 'Tab')
        self.assertTrue('preferences' in response_data)
        self.assertTrue(isinstance(response_data['preferences'], dict))
        self.assertTrue('iwidgets' in response_data)
        self.assertTrue(isinstance(response_data['iwidgets'], list))

    def test_tab_entry_post_requires_authentication(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 1})
        data = {
            'name': 'new tab name'
        }
        check_post_requires_authentication(self, url, data)

    def test_tab_entry_post_requires_permission(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 1})
        data = {
            'name': 'new tab name'
        }
        check_post_requires_permission(self, url, json.dumps(data))

    def test_tab_entry_post(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 3, 'tab_id': 103})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request (rename tab)
        def update_workspace_tab_name():
            data = {
                'name': 'new tab name'
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
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
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
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
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

        # Tab should be marked as the default one
        tab2 = Tab.objects.get(pk=103)
        self.assertFalse(tab2.visible)
        tab1 = Tab.objects.get(pk=102)
        self.assertTrue(tab1.visible)

    def test_tab_entry_post_conflict(self):
        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 3, 'tab_id': 102})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'name': 'Tab 2'}
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 409)

    def test_tab_entry_post_workspace_not_found(self):
        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 404, 'tab_id': 103})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'name': 'new tab name'}
        check_not_found_response(self, 'post', url, json.dumps(data))

    def test_tab_entry_post_tab_not_found(self):
        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 3, 'tab_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'name': 'new tab name'}
        check_not_found_response(self, 'post', url, json.dumps(data))

    def test_tab_entry_post_bad_request_syntax(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 1, 'tab_id': 1})
        check_post_bad_request_syntax(self, url)

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

    def test_tab_entry_delete_workspace_not_found(self):
        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 404, 'tab_id': 103})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'delete', url)

    def test_tab_entry_delete_tab_not_found(self):
        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 3, 'tab_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'delete', url)

    def test_tab_entry_delete_read_only_widgets(self):

        url = reverse('wirecloud.tab_entry', kwargs={'workspace_id': 3, 'tab_id': 103})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        response_data = json.loads(response.content.decode('utf-8'))
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

    def test_tab_order_post_workspace_not_found(self):
        url = reverse('wirecloud.tab_order', kwargs={'workspace_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = (103, 102)
        check_not_found_response(self, 'post', url, json.dumps(data))

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
            self.assertEqual(response.status_code, 201)
            response_data = json.loads(response.content.decode('utf-8'))
            self.assertTrue(isinstance(response_data, dict))
        check_cache_is_purged(self, 1, add_iwidget_to_workspace)

    def test_iwidget_collection_post_workspace_not_found(self):
        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 404, 'tab_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'widget': 'Wirecloud/Test/1.0'}
        check_not_found_response(self, 'post', url, json.dumps(data))

    def test_iwidget_collection_post_tab_not_found(self):
        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'widget': 'Wirecloud/Test/1.0'}
        check_not_found_response(self, 'post', url, json.dumps(data))

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
        response_data = json.loads(response.content.decode('utf-8'))
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
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_collection_post_creation_missing_required_widget_parameter(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {}
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_collection_post_invalid_value(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'widget': 'Wirecloud/Test/1.0',
            'height': False,
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_collection_post_bad_request_content_type(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})
        check_post_bad_request_content_type(self, url)

    def test_iwidget_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})
        check_post_bad_request_syntax(self, url)

    def test_iwidget_collection_put(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 2, 'tab_id': 101})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        def place_iwidgets():
            data = [
                {'id': 1, 'left': 0, 'top': 0, 'width': 10, 'height': 10},
                {'id': 2, 'left': 9.5, 'top': 10.5, 'width': 10.5, 'height': 10.5}
            ]
            real_method = Workspace.save
            with patch('wirecloud.platform.workspace.models.Workspace.save', autospec=True, side_effect=real_method) as save_mock:
                response = self.client.put(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
                self.assertEqual(save_mock.call_count, 1)
                self.assertEqual(response.status_code, 204)
        check_cache_is_purged(self, 2, place_iwidgets)

    def test_iwidget_collection_put_workspace_not_found(self):
        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 404, 'tab_id': 1})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = [{'id': 1, 'left': 0, 'top': 0, 'width': 10, 'height': 10}]
        check_not_found_response(self, 'put', url, json.dumps(data))

    def test_iwidget_collection_put_tab_not_found(self):
        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = [{'id': 1, 'left': 0, 'top': 0, 'width': 10, 'height': 10}]
        check_not_found_response(self, 'put', url, json.dumps(data))

    def test_iwidget_collection_put_requires_permission(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})
        data = [
            {'id': 1, 'icon_left': 0}
        ]
        check_put_requires_permission(self, url, json.dumps(data))

    def test_iwidget_collection_put_invalid_value(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 2, 'tab_id': 101})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = [
            {'id': 1, 'icon_left': -1}
        ]
        response = self.client.put(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_collection_put_nonexistent_iwidget(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 2, 'tab_id': 101})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = [
            {'id': 1234, 'icon_left': 0}
        ]
        response = self.client.put(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

    def test_iwidget_collection_put_bad_request_content_type(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})
        check_put_bad_request_content_type(self, url)

    def test_iwidget_collection_put_bad_request_syntax(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 1, 'tab_id': 1})
        check_put_bad_request_syntax(self, url)

    def test_widget_code_entry_get_operator(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'TestOperator', 'version': '1.0', 'file_path': '/test.html'}
        url = reverse('wirecloud.showcase_media', kwargs=widget_id) + '?entrypoint=true'

        # Authenticate
        self.client.login(username='admin', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 404)

    def test_widget_code_entry_get_cached(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0', 'file_path': '/test.html'}
        url = reverse('wirecloud.showcase_media', kwargs=widget_id) + '?entrypoint=true'

        CACHED_CODE = "<html><head></head><body>cached hello world!</body></html>"
        xhtml = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='1.0').widget.xhtml
        xhtml.cacheable = True
        xhtml.code = CACHED_CODE
        xhtml.save()

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 200)
        self.assertIn("cached hello world!", response.content.decode('utf-8'))

    def test_widget_code_entry_get_html_in_folder(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0', 'file_path': 'Wirecloud/Test/1.0/html/index.html'}
        url = reverse('wirecloud.showcase_media', kwargs=widget_id) + '?entrypoint=true'

        HTML_CODE = b"<html><head></head><body>infolder test!</body></html>"
        xhtml = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='1.0').widget.xhtml
        xhtml.url = "Wirecloud/Test/1.0/html/index.html"
        xhtml.save()

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        with patch('wirecloud.platform.widget.views.download_local_file', return_value=HTML_CODE):
            response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 200)
        self.assertIn("infolder test!", response.content.decode('utf-8'))

    def test_widget_code_entry_get_bad_encoding(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'}
        url_args = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0', 'file_path': '/test.html'}
        url = reverse('wirecloud.showcase_media', kwargs=url_args) + '?entrypoint=true'

        # Prepare invalid widget code
        base_dir = localcatalogue.wgt_deployer.get_base_dir(**widget_id)
        os.makedirs(base_dir)
        with open(os.path.join(base_dir, 'test.html'), 'wb') as f:
            f.write('<html><div>á</div</html>'.encode('iso-8859-15'))
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='1.0')
        json_description = resource.json_description

        json_description['contents']['contenttype'] = 'application/xhtml+xml'
        resource.json_description = json_description
        resource.save()

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 502)
        self.assertIn('Widget code was not encoded using the specified charset (utf-8', response.content.decode('utf-8'))

    def test_widget_code_entry_get_bad_encoding_noncacheable(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'}
        url_args = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0', 'file_path': '/test.html'}
        url = reverse('wirecloud.showcase_media', kwargs=url_args) + '?entrypoint=true'

        # Prepare invalid widget code
        base_dir = localcatalogue.wgt_deployer.get_base_dir(**widget_id)
        os.makedirs(base_dir)
        with open(os.path.join(base_dir, 'test.html'), 'wb') as f:
            f.write('<html><div>á</div</html>'.encode('iso-8859-15'))
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='1.0')
        json_description = resource.json_description

        json_description['contents']['contenttype'] = 'application/xhtml+xml'
        resource.json_description = json_description
        resource.save()

        from wirecloud.platform.models import XHTML
        xhtml = XHTML.objects.get(pk=1)
        xhtml.cacheable = False
        xhtml.save()

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 502)
        self.assertIn('Widget code was not encoded using the specified charset (utf-8', response.content.decode('utf-8'))

    def test_widget_code_entry_get_html_missing(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0', 'file_path': '/test.html'}
        url = reverse('wirecloud.showcase_media', kwargs=widget_id) + '?entrypoint=true'

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 404)
        self.assertIn('Widget code not found', response.content.decode('utf-8'))

    def test_widget_code_entry_get_ioerror(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0', 'file_path': '/test.html'}
        url = reverse('wirecloud.showcase_media', kwargs=widget_id) + '?entrypoint=true'

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        with patch('wirecloud.platform.widget.views.download_local_file', side_effect=IOError):
            response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
            self.assertEqual(response.status_code, 500)

    def test_widget_code_entry_get_invalid_html(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'}
        url_args = {'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0', 'file_path': '/test.html'}
        url = reverse('wirecloud.showcase_media', kwargs=url_args) + '?entrypoint=true'

        # Prepare invalid widget code
        base_dir = localcatalogue.wgt_deployer.get_base_dir(**widget_id)
        os.makedirs(base_dir)
        with open(os.path.join(base_dir, 'test.html'), 'wb') as f:
            f.write(b'<html><div></div</html>')
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='1.0')
        json_description = resource.json_description

        json_description['contents']['contenttype'] = 'application/xhtml+xml'
        resource.json_description = json_description
        resource.save()

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 502)
        self.assertIn('Error processing widget code', response.content.decode('utf-8'))

    def test_widget_code_entry_get_widget_not_found(self):

        widget_id = {'vendor': 'Wirecloud', 'name': 'inexistent', 'version': '1.0', 'file_path': '/index.html'}
        url = reverse('wirecloud.showcase_media', kwargs=widget_id) + '?entrypoint=true'

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def test_iwidget_entry_post_requires_authentication(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Make the request
        data = {
            'title': 'New Title',
        }

        def iwidget_not_created(self):
            # IWidget should be not updated
            iwidget = IWidget.objects.get(pk=2)
            self.assertNotEqual(iwidget.name, 'New Title')

        check_post_requires_authentication(self, url, json.dumps(data), iwidget_not_created)

    def test_iwidget_entry_post_requires_permission(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        data = {
            'title': 'New Title',
        }
        check_post_requires_permission(self, url, json.dumps(data))

    def test_iwidget_entry_post(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        def update_iwidget_name():
            data = {
                'title': 'New Title',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content.decode('utf-8'), '')

            # Check that the iwidget name has been changed
            iwidget = IWidget.objects.get(pk=2)
            self.assertEqual(iwidget.name, 'New Title')
        check_cache_is_purged(self, 2, update_iwidget_name)

    def test_iwidget_entry_post_move_between_tabs(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 3, 'tab_id': 102, 'iwidget_id': 3})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        def update_iwidget_tab():
            data = {
                'tab': 103,
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content.decode('utf-8'), '')

            # Check iwidget has been moved to the new tab
            iwidget = IWidget.objects.get(pk=3)
            self.assertEqual(iwidget.tab.id, 103)
        check_cache_is_purged(self, 3, update_iwidget_tab)

    def test_iwidget_entry_post_invalid_target_tab(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'tab': 404,
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_entry_post_workspace_not_found(self):

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'title': 'New Title'}
        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 404, 'tab_id': 101, 'iwidget_id': 2})
        check_not_found_response(self, 'post', url, json.dumps(data))

    def test_iwidget_entry_post_tab_not_found(self):

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'title': 'New Title'}
        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 404, 'iwidget_id': 2})
        check_not_found_response(self, 'post', url, json.dumps(data))

    def test_iwidget_entry_post_iwidget_not_found(self):

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'title': 'New Title'}
        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 404})
        check_not_found_response(self, 'post', url, json.dumps(data))

    def test_iwidget_entry_post_emtpy_name(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        def update_iwidget_name():
            data = {
                'title': '',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content.decode('utf-8'), '')

            # Check that the iwidget name has been changed
            iwidget = IWidget.objects.get(pk=2)
            self.assertEqual(iwidget.name, 'Test')
        check_cache_is_purged(self, 2, update_iwidget_name)

    @uses_extra_resources(('Wirecloud_Test_2.0.wgt',), shared=True)
    def test_iwidget_entry_post_upgrade(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        def upgrade_widget():
            data = {
                'widget': 'Wirecloud/Test/2.0',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content.decode('utf-8'), '')

            # Check that the iwidget name has been changed
            iwidget = IWidget.objects.get(pk=2)
            self.assertEqual(iwidget.widget.resource.local_uri_part, 'Wirecloud/Test/2.0')
        check_cache_is_purged(self, 2, upgrade_widget)

    def test_iwidget_entry_post_upgrade_inexistent_widget(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'widget': 'Wirecloud/inexistent/2.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_entry_post_upgrade_operator(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'widget': 'Wirecloud/TestOperator/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def check_iwidget_entry_post_invalid_position_value(self, field, value, error_code):
        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the requests
        data = {}
        data[field] = value
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, error_code)

    def test_iwidget_entry_post_invalid_top_position_type(self):
        self.check_iwidget_entry_post_invalid_position_value('top', 'a', 400)

    def test_iwidget_entry_post_invalid_left_position_value(self):
        self.check_iwidget_entry_post_invalid_position_value('left', -2, 422)

    def test_iwidget_entry_post_invalid_width_value(self):
        self.check_iwidget_entry_post_invalid_position_value('width', 0, 422)

    def test_iwidget_entry_post_invalid_height_type(self):
        self.check_iwidget_entry_post_invalid_position_value('height', 'a', 400)

    def test_iwidget_entry_post_invalid_icon_top_type(self):
        self.check_iwidget_entry_post_invalid_position_value('icon_top', 'a', 400)

    def test_iwidget_entry_post_invalid_icon_left_type(self):
        self.check_iwidget_entry_post_invalid_position_value('icon_left', True, 400)

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
            variables = IWidget.objects.get(pk=2).variables
            self.assertNotEqual(variables['text'], 'new value')

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
            self.assertEqual(response.content.decode('utf-8'), '')

            # IWidget preferences should be updated
            variables = IWidget.objects.get(pk=2).variables
            self.assertEqual(variables['text']["users"]["4"], 'new value')

        check_cache_is_purged(self, 2, update_iwidget_preference)

    def test_widget_preferences_post_workspace_not_found(self):

        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 404, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'text': 'new value'}
        check_not_found_response(self, 'post', url, json.dumps(data))

    def test_widget_preferences_post_tab_not_found(self):

        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 404, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'text': 'new value'}
        check_not_found_response(self, 'post', url, json.dumps(data))

    def test_widget_preferences_post_iwidget_not_found(self):

        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'text': 'new value'}
        check_not_found_response(self, 'post', url, json.dumps(data))

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
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_preferences_entry_post_readonly_preference(self):

        resource = CatalogueResource.objects.get(vendor="Wirecloud", short_name="Test", version="1.0")
        json_description = resource.json_description

        json_description['preferences'] = [{'secure': False, 'name': 'text', 'default': 'initial text', 'label': 'text', 'type': 'text', 'description': 'text preference', 'readonly': True}]
        resource.json_description = json.dumps(json_description)
        resource.save()

        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'text': 'new value',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_preferences_entry_get_requires_authentication(self):
        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        check_get_requires_authentication(self, url)

    def test_iwidget_preferences_entry_get_requires_permission(self):
        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        check_get_requires_permission(self, url)

    def test_iwidget_preferences_entry_get(self):
        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        expectedResult = {
            "boolean": {"readonly": False, "hidden": False, "name": "boolean", "value": False, "secure": False},
            "text": {"readonly": False, "hidden": False, "name": "text", "value": "initial text", "secure": False},
            "password": {"readonly": False, "hidden": False, "name": "password", "value": "default", "secure": False},
            "list": {"readonly": False, "hidden": False, "name": "list", "value": "default", "secure": False},
            "number": {"readonly": False, "hidden": False, "name": "number", "value": 2, "secure": False}
        }

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(response_data, expectedResult)

    def test_iwidget_preferences_entry_get_workspace_not_found(self):
        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 404, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def test_iwidget_preferences_entry_get_tab_not_found(self):
        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 404, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def test_iwidget_preferences_entry_get_iwidget_not_found(self):
        url = reverse('wirecloud.iwidget_preferences', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def _todo_create_property(self, multiuser=False):

        # TODO
        resource = CatalogueResource.objects.get(vendor="Wirecloud", short_name="Test", version="1.0")
        json_description = resource.json_description

        json_description['properties'] = [{'secure': False, 'name': 'prop', 'default': '', 'label': '', 'type': 'text', 'multiuser': multiuser}]
        resource.json_description = json.dumps(json_description)
        resource.save()
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
            variables = IWidget.objects.get(pk=2).variables
            self.assertNotIn('prop', variables)

        check_post_requires_authentication(self, url, json.dumps(data), iwidget_preference_not_created)

    def test_iwidget_properties_entry_post_requires_permission(self):
        self._todo_create_property()

        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        data = {
            'prop': 'new value',
        }
        check_post_requires_permission(self, url, json.dumps(data))

    def test_iwidget_properties_entry_post_multiuser_requires_permission(self):
        self._todo_create_property(True)

        # Authenticate
        self.client.login(username='emptyuser', password='admin')

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
            self.assertEqual(response.content.decode('utf-8'), '')

            # IWidget properties should be updated
            variables = IWidget.objects.get(pk=2).variables

            self.assertEqual(variables['prop']['users']['4'], 'new value')
        check_cache_is_purged(self, 2, update_iwidget_property)

    def test_iwidget_properties_entry_post_multiuser(self):
        self._todo_create_property(True)

        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        def update_iwidget_multiuser_property():
            data = {
                'prop': 'new value',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)
            self.assertEqual(response.content.decode('utf-8'), '')

            # IWidget properties should be updated
            variables = IWidget.objects.get(pk=2).variables
            self.assertEqual(variables['prop']['users']['4'], 'new value')
        check_cache_is_purged(self, 2, update_iwidget_multiuser_property)

    def test_widget_properties_post_workspace_not_found(self):

        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 404, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'prop': 'new value'}
        check_not_found_response(self, 'post', url, json.dumps(data))

    def test_widget_properties_post_tab_not_found(self):

        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 2, 'tab_id': 404, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'prop': 'new value'}
        check_not_found_response(self, 'post', url, json.dumps(data))

    def test_widget_properties_post_iwidget_not_found(self):

        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'text': 'new value'}
        check_not_found_response(self, 'post', url, json.dumps(data))

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
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_properties_entry_get_requires_authentication(self):
        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 6, 'tab_id': 106, 'iwidget_id': 111})

        check_get_requires_authentication(self, url)

    def test_iwidget_properties_entry_get_requires_permission(self):
        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 6, 'tab_id': 106, 'iwidget_id': 111})

        check_get_requires_permission(self, url)

    def test_iwidget_properties_entry_get(self):
        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 6, 'tab_id': 106, 'iwidget_id': 111})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        expectedResult = {
            'prop': {'readonly': False, 'secure': False, 'hidden': False, 'value': 'default', 'name': 'prop'},
            'prop2': {'readonly': False, 'secure': False, 'hidden': False, 'value': 'default2', 'name': 'prop2'}
        }

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(response_data, expectedResult)

    def test_iwidget_properties_entry_get_workspace_not_found(self):
        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 404, 'tab_id': 106, 'iwidget_id': 111})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def test_iwidget_properties_entry_get_tab_not_found(self):
        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 6, 'tab_id': 404, 'iwidget_id': 111})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def test_iwidget_properties_entry_get_iwidget_not_found(self):
        url = reverse('wirecloud.iwidget_properties', kwargs={'workspace_id': 6, 'tab_id': 106, 'iwidget_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

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
            self.assertEqual(response.content.decode('utf-8'), '')

            # IWidget should be deleted
            self.assertRaises(IWidget.DoesNotExist, IWidget.objects.get, pk=2)
        check_cache_is_purged(self, 2, delete_iwidget_from_workspace)

    def test_iwidget_entry_delete_workspace_not_found(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 404, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'delete', url)

    def test_iwidget_entry_delete_tab_not_found(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 404, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'delete', url)

    def test_iwidget_entry_delete_iwidget_not_found(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'delete', url)

    def test_iwidget_entry_delete_read_only(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 3, 'tab_id': 103, 'iwidget_id': 4})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

        # IWidget should not be deleted
        IWidget.objects.get(pk=4)


class ResourceManagementAPI(WirecloudTestCase, TransactionTestCase):

    fixtures = ('selenium_test_data',)
    tags = ('wirecloud-rest-api', 'wirecloud-resource-rest-api', 'wirecloud-noselenium')
    populate = False
    use_search_indexes = False

    def test_resource_collection_allows_anonymous_queries(self):

        url = reverse('wirecloud.resource_collection')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_resource_collection_get(self):

        url = reverse('wirecloud.resource_collection')

        self.client.login(username='admin', password='admin')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content.decode('utf-8'))
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

    def test_resource_collection_get_multiple_groups(self):

        user_with_workspaces = User.objects.get(username='user_with_workspaces')
        user_with_workspaces.groups.create(name='test1')
        user_with_workspaces.groups.create(name='test2')

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_resource_collection_get_no_process_urls(self):

        url = reverse('wirecloud.resource_collection') + '?process_urls=false'

        self.client.login(username='admin', password='admin')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content.decode('utf-8'))
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

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('type', response_data)
        self.assertEqual(response_data['type'], 'widget')
        self.assertIn('vendor', response_data)
        self.assertEqual(response_data['vendor'], 'Wirecloud')
        self.assertIn('name', response_data)
        self.assertEqual(response_data['name'], 'Test_Selenium')
        self.assertIn('version', response_data)
        self.assertEqual(response_data['version'], '1.0')

    @uses_extra_resources(('Wirecloud_Test_Selenium_1.0-dev.wgt',), users=["admin"], shared=True, creator="admin")
    def test_resource_collection_post_dev_widget(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0-dev.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('type', response_data)
        self.assertEqual(response_data['type'], 'widget')
        self.assertIn('vendor', response_data)
        self.assertEqual(response_data['vendor'], 'Wirecloud')
        self.assertIn('name', response_data)
        self.assertEqual(response_data['name'], 'Test_Selenium')
        self.assertIn('version', response_data)
        self.assertEqual(response_data['version'], '1.0-devuser_with_workspaces')

    def test_resource_collection_post_widget_without_enough_filesystem_permissions(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            with patch('wirecloud.commons.utils.wgt.WgtFile.extract_file', side_effect=OSError(13, 'Permission denied')):
                response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_resource_collection_post_widget_invalid_html_encoding(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Invalid_HTML_Encoding_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_resource_collection_post_resource_missing_config_xml(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Missing_Config_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_resource_collection_post_resource_missing_contents_file(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Missing_HTML_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_resource_collection_post_resource_invalid_config_xml(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Invalid_Config_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['description'], 'Error parsing config.xml descriptor file: No valid parser found')

    def test_resource_collection_post_resource_read_zip_file_exception(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_invalid-file-header_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['description'], 'The uploaded file is not a valid zip file')

    def test_resource_collection_post_resource_missing_required_features(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Missing_Features_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, data={'file': f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content.decode('utf-8'))
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

        response_data = json.loads(response.content.decode('utf-8'))
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

        response_data = json.loads(response.content.decode('utf-8'))
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

    def test_resource_collection_post_using_resource_url(self):

        url = reverse('wirecloud.resource_collection')

        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            self.network._servers['http']['example.com'].add_response('GET', '/widget.wgt', {'content': f.read()})

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        data = {
            'url': 'http://example.com/widget.wgt'
        }
        response = self.client.post(url, json.dumps(data), content_type="application/json", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('type', response_data)
        self.assertIn(response_data['type'], CatalogueResource.RESOURCE_TYPES)
        self.assertIn('vendor', response_data)
        self.assertIn('name', response_data)
        self.assertIn('version', response_data)

    def test_resource_collection_post_using_octet_stream(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('type', response_data)
        self.assertIn(response_data['type'], CatalogueResource.RESOURCE_TYPES)
        self.assertIn('vendor', response_data)
        self.assertIn('name', response_data)
        self.assertIn('version', response_data)

    def test_resource_collection_post_using_multipart(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, {"file": f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('type', response_data)
        self.assertIn(response_data['type'], CatalogueResource.RESOURCE_TYPES)
        self.assertIn('vendor', response_data)
        self.assertIn('name', response_data)
        self.assertIn('version', response_data)

    def test_resource_collection_post_using_multipart_missing_file(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        response = self.client.post(url, data={'install_embedded_resources': True}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['description'], 'Missing component file in the request')

    def test_resource_collection_post_using_multipart_invalid_zip_file(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(__file__, 'rb') as f:
            response = self.client.post(url, data={'install_embedded_resources': True, "file": f}, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['description'], 'The uploaded file is not a zip file')

    def test_resource_collection_post_duplicated(self):

        url = reverse('wirecloud.resource_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('type', response_data)
        self.assertIn(response_data['type'], CatalogueResource.RESOURCE_TYPES)
        self.assertIn('vendor', response_data)
        self.assertIn('name', response_data)
        self.assertIn('version', response_data)

    def test_resource_collection_post_install_embedded_components(self):

        url = reverse('wirecloud.resource_collection') + '?install_embedded_resources=true'

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_TestMashupEmbedded_2.0.zip'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('resource_details', response_data)
        self.assertIn('type', response_data['resource_details'])
        self.assertIn(response_data['resource_details']['type'], CatalogueResource.RESOURCE_TYPES)
        self.assertIn('vendor', response_data['resource_details'])
        self.assertIn('name', response_data['resource_details'])
        self.assertIn('version', response_data['resource_details'])
        self.assertEqual(len(response_data['resource_details']['embedded']), 3)

        self.assertIn('extra_resources', response_data)
        self.assertEqual(len(response_data['extra_resources']), 2)

    def check_mashup_upload(self, mashup):

        url = reverse('wirecloud.resource_collection') + '?install_embedded_resources=true'

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_%s_1.0.zip' % mashup), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 400)

        return json.loads(response.content.decode('utf-8'))

    def test_resource_collection_post_install_invalid_embedded_component(self):

        response_data = self.check_mashup_upload('TestMashupInvalidEmbeddedComponent')
        self.assertIn('Wirecloud_invalid-operator_1.0.wgt', response_data['description'])
        self.assertRegexpMatches(response_data['details'], "^Unable to process component description file: .+")

    def test_resource_collection_post_install_invalid_embedded_component_format(self):

        response_data = self.check_mashup_upload('TestMashupInvalidEmbeddedComponentFormat')
        self.assertIn('Wirecloud_invalid-operator_1.0.wgt', response_data['description'])
        self.assertEqual(response_data['details'], "Unable to process component description file")

    def test_resource_collection_post_install_obsolete_embedded_component(self):

        response_data = self.check_mashup_upload('TestMashupObsoleteEmbeddedComponent')
        self.assertIn('Wirecloud_obsolete-widget_1.0.wgt', response_data['description'])
        self.assertRegexpMatches(response_data['details'], "Component description uses a no longer supported format$")

    def test_resource_collection_post_install_invalid_wgt_embedded_component(self):

        response_data = self.check_mashup_upload('TestMashupInvalidWGTEmbeddedComponent')
        self.assertIn('Wirecloud_invalid-operator_1.0.wgt', response_data['description'])
        self.assertEqual(response_data['details'], "File is not a zip file")

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

    def test_resource_collection_post_public(self):

        url = reverse('wirecloud.resource_collection') + '?public=true'

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test_Selenium', version='1.0')
        self.assertTrue(resource.public)
        self.assertEqual(list(resource.users.values_list('username', flat=True)), [])

    def test_resource_collection_post_public_normuser(self):

        url = reverse('wirecloud.resource_collection') + '?public=true'

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)

        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='Test_Selenium', version='1.0')

    def test_resource_collection_post_user_list(self):

        url = reverse('wirecloud.resource_collection') + '?users=user_with_workspaces,user_with_markets'

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        resource = CatalogueResource.objects.get(vendor= 'Wirecloud', short_name= 'Test_Selenium', version= '1.0')
        self.assertEqual(list(resource.users.values_list('username', flat=True)), ['user_with_markets','user_with_workspaces'])

    def test_resource_collection_post_user_list_normuser(self):

        url = reverse('wirecloud.resource_collection') + '?users=user_with_workspaces,user_with_markets'

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='Test_Selenium', version='1.0')

    def test_resource_collection_post_user_list_empty(self):
        url = reverse('wirecloud.resource_collection') + '?users='

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        resource = CatalogueResource.objects.get(vendor= 'Wirecloud', short_name= 'Test_Selenium', version= '1.0')
        self.assertEqual(list(resource.users.values_list('username', flat=True)), ['admin'])

    def test_resource_collection_post_group_list(self):

        url = reverse('wirecloud.resource_collection') + '?groups=org'

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        resource = CatalogueResource.objects.get(vendor= 'Wirecloud', short_name= 'Test_Selenium', version= '1.0')
        self.assertEqual(list(resource.users.values_list('username', flat=True)), [])
        self.assertEqual(list(resource.groups.values_list('name', flat=True)), ['org'])

    def test_resource_collection_post_group_normuser(self):

        url = reverse('wirecloud.resource_collection') + '?groups=normusers'

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)

        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='Test_Selenium', version='1.0')

    def test_resource_collection_post_org_by_owner(self):

        url = reverse('wirecloud.resource_collection') + '?groups=org'

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        resource = CatalogueResource.objects.get(vendor= 'Wirecloud', short_name= 'Test_Selenium', version= '1.0')
        self.assertEqual(list(resource.users.values_list('username', flat=True)), [])
        self.assertEqual(list(resource.groups.values_list('name', flat=True)), ['org'])

    def test_resource_collection_post_org_by_member(self):

        url = reverse('wirecloud.resource_collection') + '?groups=org'

        # Authenticate
        self.client.login(username='normuser', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)

        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='Test_Selenium', version='1.0')

    def test_resource_collection_post_group_list_empty(self):
        url = reverse('wirecloud.resource_collection') + '?groups='

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        with open(os.path.join(self.shared_test_data_dir, 'Wirecloud_Test_Selenium_1.0.wgt'), 'rb') as f:
            response = self.client.post(url, f.read(), content_type="application/octet-stream", HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

        resource = CatalogueResource.objects.get(vendor= 'Wirecloud', short_name= 'Test_Selenium', version= '1.0')
        self.assertEqual(list(resource.users.values_list('username', flat=True)), ['admin'])
        self.assertEqual(list(resource.groups.values_list('name', flat=True)), [])

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
        response = self.client.get(url, HTTP_ACCEPT='*/*')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/x-widget+mashable-application-component')

    def test_resource_entry_get_not_found(self):

        resource_id = ['Wirecloud', 'Test', '404']
        url = reverse('wirecloud.resource_entry', args=resource_id)

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

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
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='1.0')
        self.assertFalse(resource.users.filter(username='admin').exists())

    def test_resource_entry_delete(self):

        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='1.0')
        resource.users.clear()
        resource.users.add(2)
        resource.public = False
        resource.save()

        url = reverse('wirecloud.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})

        self.client.login(username='normuser', password='admin')

        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='Test', version='1.0')

    def test_resource_entry_delete_not_found(self):

        resource_id = ['Wirecloud', 'Test', '404']
        url = reverse('wirecloud.resource_entry', args=resource_id)

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'delete', url)


class ExtraApplicationMashupAPI(WirecloudTestCase, TransactionTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces', 'extra_wiring_test_data')
    tags = ('wirecloud-rest-api', 'wirecloud-extra-rest-api', 'wirecloud-noselenium')
    populate = False
    use_search_indexes = False

    def test_iwidget_collection_get_requires_authentication(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 2, 'tab_id': 101})
        check_get_requires_authentication(self, url)

    def test_iwidget_collection_get(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 2, 'tab_id': 101})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, list))

    def test_iwidget_collection_get_workspace_not_found(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 404, 'tab_id': 101})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def test_iwidget_collection_get_tab_not_found(self):

        url = reverse('wirecloud.iwidget_collection', kwargs={'workspace_id': 2, 'tab_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def test_iwidget_entry_get_requires_authentication(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})
        check_get_requires_authentication(self, url)

    def test_iwidget_entry_get(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_iwidget_entry_get_missing_widget_deleted(self):

        iwidget = IWidget.objects.get(pk=2)
        iwidget.widget = None
        iwidget.save()
        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['widget'], "Wirecloud/Test/1.0")
        self.assertEqual(response_data['preferences'], {})
        self.assertEqual(response_data['properties'], {})

    def test_iwidget_entry_get_missing_widget_uninstalled(self):

        user_with_workspaces = User.objects.get(username='user_with_workspaces')
        iwidget = IWidget.objects.get(pk=2)
        iwidget.widget.resource.public = False
        iwidget.widget.resource.users.remove(user_with_workspaces)
        iwidget.widget.resource.save()
        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['widget'], "Wirecloud/Test/1.0")
        self.assertEqual(response_data['preferences'], {})
        self.assertEqual(response_data['properties'], {})

    def test_iwidget_entry_get_workspace_not_found(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 404, 'tab_id': 101, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def test_iwidget_entry_get_tab_not_found(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 404, 'iwidget_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def test_iwidget_entry_get_iwidget_not_found(self):

        url = reverse('wirecloud.iwidget_entry', kwargs={'workspace_id': 2, 'tab_id': 101, 'iwidget_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def test_resource_description_entry_get(self):

        resource_id = ['Wirecloud', 'Test', '1.0']
        url = reverse('wirecloud.resource_description_entry', args=resource_id)

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(response_data["contents"]["src"].startswith('http'))

    def test_resource_description_entry_get_not_found(self):

        resource_id = ['Wirecloud', 'Test', '404']
        url = reverse('wirecloud.resource_description_entry', args=resource_id)

        # Authenticate
        self.client.login(username='admin', password='admin')

        check_not_found_response(self, 'get', url)

    def test_resource_description_entry_get_no_process_urls(self):

        resource_id = ['Wirecloud', 'Test', '1.0']
        url = reverse('wirecloud.resource_description_entry', args=resource_id) + '?process_urls=false'

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertFalse(response_data["contents"]["src"].startswith('http'))

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt',), shared=True, deploy_only=True)
    def test_resource_description_entry_get_including_files_widget(self):

        resource_id = ['Wirecloud', 'Test', '1.0']
        url = reverse('wirecloud.resource_description_entry', args=resource_id) + '?include_wgt_files=true'

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make the request
        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(set(response_data['wgt_files']), set(['images/catalogue_iphone.png', 'images/catalogue.png', 'test.html', 'config.xml', 'DESCRIPTION.md', 'CHANGELOG.md', 'doc/index.md']))

    @uses_extra_resources(('Wirecloud_TestOperator_1.0.zip',), shared=True, deploy_only=True)
    def test_resource_description_entry_get_including_files_operator(self):

        resource_id = ['Wirecloud', 'TestOperator', '1.0']
        url = reverse('wirecloud.resource_description_entry', args=resource_id) + '?include_wgt_files=true'

        # Authenticate
        self.client.login(username='emptyuser', password='admin')

        # Make the request
        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(set(response_data['wgt_files']), set(['images/catalogue_iphone.png', 'images/catalogue.png', 'js/main.js', 'config.xml']))

    def test_market_collection_get_requires_authentication(self):

        url = reverse('wirecloud.market_collection')
        check_get_requires_authentication(self, url)

    def test_market_collection_get(self):

        url = reverse('wirecloud.market_collection')

        # Authenticate
        self.client.login(username='user_with_markets', password='admin')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, list))

    def test_market_collection_post_requires_authentication(self):

        url = reverse('wirecloud.market_collection')
        data = {
            'name': 'new_market',
            'type': 'wirecloud',
            'url': 'http://example.com'
        }
        check_post_requires_authentication(self, url, json.dumps(data))

    def test_market_collection_post(self):

        url = reverse('wirecloud.market_collection')

        # Authenticate
        self.client.login(username='user_with_markets', password='admin')

        # Make request
        data = {
            'name': 'new_market',
            'type': 'wirecloud',
            'url': 'http://example.com'
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
            'user': 'user_with_markets',
            'type': 'wirecloud',
            'url': 'http://example.com'
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)

    def test_market_collection_post_other_user_requires_permission(self):

        url = reverse('wirecloud.market_collection')
        data = {
            'name': 'new_market',
            'user': 'user_with_markets',
            'type': 'wirecloud',
            'url': 'http://example.com'
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
            'type': 'wirecloud',
            'url': 'http://example.com'
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        json.loads(response.content.decode('utf-8'))

    def test_market_collection_post_requires_absolute_url(self):

        url = reverse('wirecloud.market_collection')

        # Authenticate
        self.client.login(username='admin', password='admin')

        # Make request
        data = {
            'name': 'new_market',
            'user': 'user_with_markets',
            'type': 'wirecloud',
            'url': 'relative/url'
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

    def test_market_collection_post_bad_request_content_type(self):

        url = reverse('wirecloud.market_collection')
        check_post_bad_request_content_type(self, url)

    def test_market_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.market_collection')
        check_post_bad_request_syntax(self, url)

    def test_market_entry_delete_requires_authentication(self):

        url = reverse('wirecloud.market_entry', kwargs={'user': 'user_with_markets', 'market': 'deleteme'})
        check_delete_requires_authentication(self, url)

    def test_market_entry_delete_requires_permission(self):

        url = reverse('wirecloud.market_entry', kwargs={'user': 'user_with_markets', 'market': 'deleteme'})
        check_delete_requires_permission(self, url)

    def test_market_entry_delete(self):

        url = reverse('wirecloud.market_entry', kwargs={'user': 'user_with_markets', 'market': 'deleteme'})

        # Authenticate
        self.client.login(username='user_with_markets', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)

    def test_market_entry_delete_not_found(self):

        url = reverse('wirecloud.market_entry', kwargs={'user': 'user_with_markets', 'market': 'notfound'})

        # Authenticate
        self.client.login(username='user_with_markets', password='admin')

        check_not_found_response(self, 'delete', url)

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
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertIn('details', response_data)

    def test_market_publish_service_bad_request_syntax(self):

        url = reverse('wirecloud.publish_on_other_marketplace')
        check_post_bad_request_syntax(self, url)

    def test_platform_context_collection_get(self):

        url = reverse('wirecloud.platform_context_collection')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['platform']['username']['value'], 'user_with_workspaces')

    def test_platform_context_collection_get_allows_anonymous_requests(self):

        url = reverse('wirecloud.platform_context_collection')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['platform']['username']['value'], 'anonymous')

    def test_platform_preference_collection_get(self):

        url = reverse('wirecloud.platform_preferences')

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_platform_preference_collection_get_allows_anonymous_requests(self):

        url = reverse('wirecloud.platform_preferences')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
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
        self.assertEqual(response.content.decode('utf-8'), '')

    def test_platform_preference_collection_bad_request_content_type(self):

        url = reverse('wirecloud.platform_preferences')
        check_post_bad_request_content_type(self, url)

    def test_platform_preference_collection_post_bad_request_syntax(self):

        url = reverse('wirecloud.platform_preferences')
        check_post_bad_request_syntax(self, url)

    def test_workspace_collection_get_allows_anonymous_requests(self):

        url = reverse('wirecloud.workspace_collection')

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)

        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, list))
        self.assertEqual(len(response_data), 1)
        self.assertEqual(response_data[0]['name'], 'public-workspace')
        self.assertEqual(response_data[0]['title'], 'Public Workspace')

    def test_workspace_entry_post_requires_authentication(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 2})

        data = {
            'name': 'RenamedWorkspace',
        }

        def workspace_not_changed(self):
            user_workspace = UserWorkspace.objects.get(pk=2)
            self.assertEqual(user_workspace.workspace.name, 'Workspace')

        check_post_requires_authentication(self, url, json.dumps(data), workspace_not_changed)

    def test_workspace_entry_post_requires_permission(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 2})

        data = {
            'name': 'RenamedWorkspace',
        }

        def workspace_not_changed(self):
            user_workspace = UserWorkspace.objects.get(pk=2)
            self.assertEqual(user_workspace.workspace.name, 'Workspace')

        check_post_requires_permission(self, url, json.dumps(data), workspace_not_changed)

    def test_workspace_entry_post(self):

        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Update workspace name
        def update_workspace_name():
            data = {
                'name': 'RenamedWorkspace',
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)

            user_workspace = UserWorkspace.objects.get(pk=2)
            self.assertEqual(user_workspace.workspace.name, data['name'])

        check_cache_is_purged(self, 2, update_workspace_name)

        # Update workspace descriptions
        def update_workspace_descriptions():
            data = {
                "description": "My dashboard",
                "longdescription": "A dashboard description using **Markdown** _Syntax_"
            }
            response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 204)

            user_workspace = UserWorkspace.objects.get(pk=2)
            self.assertEqual(user_workspace.workspace.description, data['description'])
            self.assertEqual(user_workspace.workspace.longdescription, data['longdescription'])
        check_cache_is_purged(self, 2, update_workspace_descriptions)

    def test_workspace_entry_post_conflict(self):
        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'name': 'ExistingWorkspace'}
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 409)

    def test_workspace_entry_post_workspace_not_found(self):
        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'name': 'new name'}
        check_not_found_response(self, 'post', url, json.dumps(data))

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

    def test_workspace_merge_service_post_workspace_not_found(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'mashup': 'Wirecloud/test-mashup/1.0'}
        check_not_found_response(self, 'post', url, json.dumps(data))

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

    def test_workspace_merge_service_post_from_noowned_mashup(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        test_mashup = CatalogueResource.objects.get(short_name='test-mashup-dependencies')
        test_mashup.public = False
        test_mashup.users.clear()
        test_mashup.save()

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup-dependencies/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

    @uses_extra_resources(('Wirecloud_test-mashup-dependencies_1.0.wgt',), shared=True, deploy_only=True)
    def test_workspace_merge_service_post_from_mashup_missing_dependencies(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        prepare_missing_dependencies_test()

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/test-mashup-dependencies/1.0',
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)
        check_missing_dependencies_respose(self, response)

    def test_workspace_merge_service_post_from_widget(self):

        url = reverse('wirecloud.workspace_merge', kwargs={'to_ws_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        # Make the request
        data = {
            'mashup': 'Wirecloud/Test/1.0',
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

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_workspace_prefrences_collection_get_not_found(self):
        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

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
            self.assertEqual(response.content.decode('utf-8'), '')
        check_cache_is_purged(self, 2, update_workspace_preferences)

    def test_workspace_prefrences_collection_post_not_found(self):
        url = reverse('wirecloud.workspace_entry', kwargs={'workspace_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'pref1': {'inherit': False, 'value': '5'}}
        check_not_found_response(self, 'post', url, json.dumps(data))

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
            self.assertEqual(response.content.decode('utf-8'), '')
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

        response = check_get_request(self, url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))

    def test_tab_preference_collection_get_workspace_not_found(self):
        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 404, 'tab_id': 101})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

    def test_tab_preference_collection_get_tab_not_found(self):
        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        check_not_found_response(self, 'get', url)

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
            self.assertEqual(response.content.decode('utf-8'), '')
        check_cache_is_purged(self, 2, update_workspace_tab_preferences)

    def test_tab_preference_collection_post_workspace_not_found(self):
        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 404, 'tab_id': 101})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'pref1': '5'}
        check_not_found_response(self, 'post', url, json.dumps(data))

    def test_tab_preference_collection_post_tab_not_found(self):
        url = reverse('wirecloud.tab_preferences', kwargs={'workspace_id': 2, 'tab_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {'pref1': '5'}
        check_not_found_response(self, 'post', url, json.dumps(data))

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
        }
        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 201)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(response_data['vendor'], 'Wirecloud')
        self.assertEqual(response_data['name'], 'test-published-mashup')
        self.assertEqual(response_data['title'], 'Mashup (Rest API Test)')
        self.assertEqual(response_data['version'], '1.0.5')

    def test_workspace_publish_workspace_not_found(self):
        url = reverse('wirecloud.workspace_publish', kwargs={'workspace_id': 404})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        data = {
            'vendor': 'Wirecloud',
            'name': 'test-published-mashup',
            'version': '1.0.5',
        }
        check_not_found_response(self, 'post', url, json.dumps(data))

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

        original_catalogue_image = os.path.join(self.shared_test_data_dir, 'src/context-inspector/images/catalogue.png')
        original_smartphone_image = os.path.join(self.shared_test_data_dir, 'src/context-inspector/images/smartphone.png')
        with open(original_catalogue_image, 'rb') as f1:
            with open(original_smartphone_image, 'rb') as f2:
                response = self.client.post(url, {'json': json.dumps(data), 'image': f1, 'smartphoneimage': f2}, HTTP_ACCEPT='application/json')

        self.assertEqual(response.status_code, 201)

        # Check images has been uploaded
        test_mashup = CatalogueResource.objects.get(short_name='test-published-mashup')
        base_dir = catalogue.wgt_deployer.get_base_dir('Wirecloud', 'test-published-mashup', '1.0.5')
        test_mashup_info = test_mashup.json_description

        image_path = os.path.join(base_dir, test_mashup_info['image'])
        self.assertTrue(filecmp.cmp(original_catalogue_image, image_path))

        smartphone_image_path = os.path.join(base_dir, test_mashup_info['smartphoneimage'])
        self.assertTrue(filecmp.cmp(original_smartphone_image, smartphone_image_path))

    def test_workspace_publish_including_longdescription(self):

        url = reverse('wirecloud.workspace_publish', kwargs={'workspace_id': 2})

        # Authenticate
        self.client.login(username='user_with_workspaces', password='admin')

        longdescription = 'Description using *MarkDown* syntax'
        data = {
            'vendor': 'Wirecloud',
            'name': 'test-published-mashup',
            'version': '1.0.5',
            'email': 'test@example.com',
            'description': 'Short description',
            'longdescription': longdescription
        }

        response = self.client.post(url, json.dumps(data), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')

        self.assertEqual(response.status_code, 201)

        # Check long description field has been converted into a file
        test_mashup = CatalogueResource.objects.get(short_name='test-published-mashup')
        base_dir = catalogue.wgt_deployer.get_base_dir('Wirecloud', 'test-published-mashup', '1.0.5')
        test_mashup_info = test_mashup.json_description

        image_path = os.path.join(base_dir, test_mashup_info['longdescription'])
        with open(image_path, 'rb') as f:
            self.assertEqual(f.read(), longdescription.encode('utf-8'))

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
        response_data = json.loads(response.content.decode('utf-8'))
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
        }
        check_post_bad_provided_data(self, url, json.dumps(data))

        # Test invalid vendor
        data = {
            'vendor': 'Wire/cloud',
            'name': 'test-published-mashup',
            'version': '1.0.5',
        }
        check_post_bad_provided_data(self, url, json.dumps(data))

        # Test invalid name
        data = {
            'vendor': 'Wirecloud',
            'name': 'test/published/mashup',
            'version': '1.0.5',
        }
        check_post_bad_provided_data(self, url, json.dumps(data))

        # Test invalid version
        data = {
            'vendor': 'Wirecloud',
            'name': 'test-published-mashup',
            'version': '1.0.05',
        }
        check_post_bad_provided_data(self, url, json.dumps(data))

    def test_workspace_publish_bad_request_syntax(self):

        url = reverse('wirecloud.workspace_publish', kwargs={'workspace_id': 2})
        check_post_bad_request_syntax(self, url)


class AdministrationAPI(WirecloudTestCase, TestCase):

    fixtures = ('selenium_test_data',)
    tags = ('wirecloud-rest-api', 'wirecloud-rest-api-admin', 'wirecloud-noselenium')
    populate = False
    use_search_indexes = False

    @classmethod
    def setUpClass(cls):
        super(AdministrationAPI, cls).setUpClass()
        cls.su_url = reverse('wirecloud.switch_user_service')

    def check_current_user(self, user):

        url = reverse('wirecloud.platform_context_collection')
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertTrue(isinstance(response_data, dict))
        self.assertEqual(response_data['platform']['username']['value'], user)

    def test_switch_user(self):

        self.client.login(username='admin', password='admin')

        response = self.client.post(self.su_url, '{"username": "user_with_workspaces"}', content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 204)
        self.check_current_user('user_with_workspaces')

    def test_switch_user_inexistent_user(self):

        self.client.login(username='admin', password='admin')

        response = self.client.post(self.su_url, '{"username": "inexistentuser"}', content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 404)
        self.check_current_user('admin')

    def test_switch_user_requires_permissions(self):

        self.client.login(username='user_with_workspaces', password='admin')

        response = self.client.post(self.su_url, '{"username": "admin"}', content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        self.check_current_user('user_with_workspaces')

    def test_switch_user_bad_request_syntax(self):

        check_post_bad_request_syntax(self, self.su_url, username="admin")

    def test_switch_user_bad_request_content(self):

        self.client.login(username='admin', password='admin')

        response = self.client.post(self.su_url, json.dumps({}), content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 422)

    def test_switch_user_no_backend(self):

        self.client.login(username='admin', password='admin')

        with patch('wirecloud.commons.views.auth', autospec=True) as auth:
            auth.get_backends.return_value = ()
            response = self.client.post(self.su_url, '{"username": "user_with_workspaces"}', content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 404)

    def test_switch_user_no_associated_backend(self):

        self.client.login(username='admin', password='admin')
        backend1 = Mock()
        backend1.get_user.return_value = None
        backend2 = Mock()
        backend2.get_user.side_effect = Exception()

        with patch('wirecloud.commons.views.auth', autospec=True) as auth:
            auth.get_backends.return_value = (backend1, backend2)
            response = self.client.post(self.su_url, '{"username": "user_with_workspaces"}', content_type='application/json; charset=UTF-8', HTTP_ACCEPT='application/json')
            self.assertEqual(response.status_code, 404)
