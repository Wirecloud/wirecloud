# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
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

import errno
from io import BytesIO
import json
import os
from unittest.mock import MagicMock, Mock, patch

from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.http import Http404
from django.test import Client, TestCase, TransactionTestCase
from django.test.utils import override_settings

import wirecloud.catalogue.utils
from wirecloud.catalogue.models import CatalogueResource
from wirecloud.catalogue.utils import get_resource_data
from wirecloud.catalogue.views import serve_catalogue_media
from wirecloud.commons.utils.template import TemplateParseException
from wirecloud.commons.utils.testcases import uses_extra_resources, WirecloudTestCase
from wirecloud.commons.utils.wgt import InvalidContents


# Avoid nose to repeat these tests (they are run through wirecloud/catalogue/tests/__init__.py)
__test__ = False


class CatalogueSearchTestCase(WirecloudTestCase, TestCase):

    # TODO this API should be moved to /api/search

    fixtures = ('catalogue_search_data',)
    tags = ('wirecloud-catalogue', 'wirecloud-catalogue-search', 'wirecloud-noselenium', 'wirecloud-catalogue-noselenium', 'wirecloud-search-api')
    populate = False

    WIRECLOUD_RESULTS = {'Wirecloud/TestOperator/2.0', 'Wirecloud/test-mashup/1.0.5', 'Wirecloud/Book-Reader/1.5', 'Wirecloud/Test/2.5', 'CoNWeT-Lab/Clock_Now/1.11'}
    MASHABLE_RESULTS = {'Wirecloud/test-mashup/1.0', 'Wirecloud/Test/2.5', 'CoNWeT/test-mashup-dependencies/1.5.5'}

    @classmethod
    def setUpClass(cls):

        super(CatalogueSearchTestCase, cls).setUpClass()
        cls.base_url = reverse('wirecloud_catalogue.resource_collection')

    def setUp(self):

        super(CatalogueSearchTestCase, self).setUp()
        self.client = Client()

    def test_basic_search_by_scope(self):

        self.client.login(username='emptyuser', password='admin')

        response = self.client.get(self.base_url + '?scope=widget')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        widgets = [i['type'] for i in result_json['results']].count('widget')
        self.assertEqual(result_json['pagelen'], 4)
        self.assertEqual(result_json['pagelen'], widgets)
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 6)

        response = self.client.get(self.base_url + '?scope=widget,mashup')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        results_by_type = [i['type'] for i in result_json['results']]
        new_request_widgets = results_by_type.count('widget')
        new_request_mashups = results_by_type.count('mashup')
        self.assertEqual(widgets, new_request_widgets)
        self.assertEqual(result_json['pagelen'], 6)
        self.assertEqual(result_json['pagelen'], new_request_widgets + new_request_mashups)

        self.client.logout()

        self.client.login(username='admin', password='admin')

        response = self.client.get(self.base_url + '?scope=widget&staff=true')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        widgets = [i['type'] for i in result_json['results']].count('widget')
        self.assertEqual(result_json['pagelen'], widgets)
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 7)

    def test_basic_search_with_args_not_supported(self):

        self.client.login(username='emptyuser', password='admin')

        response = self.client.get(self.base_url + '?staff=true')
        self.assertEqual(response.status_code, 403)

        response = self.client.get(self.base_url + '?scope=application')
        self.assertEqual(response.status_code, 400)

        response = self.client.get(self.base_url + '?orderby=type')
        self.assertEqual(response.status_code, 400)

    def test_basic_search_with_orderby(self):

        self.client.login(username='emptyuser', password='admin')

        response = self.client.get(self.base_url + '?orderby=-creation_date')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['pagelen'], 8)

        response = self.client.get(self.base_url + '?orderby=creation_date')
        self.assertEqual(response.status_code, 200)
        result2_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(result2_json['pagelen'], 8)
        self.assertEqual(result2_json['pagelen'], len(result2_json['results']))
        self.assertEqual(result2_json['results'][0], result_json['results'][-1])

    def check_last_page(self, response):

        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(result_json['pagenum'], 3)
        self.assertEqual(result_json['pagelen'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['total'], 11)
        self.assertEqual(result_json['pagecount'], 3)
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 3)

    def test_basic_search_with_pagination(self):

        self.client.login(username='admin', password='admin')

        # Less hits than the maxresults parameter
        response = self.client.get(self.base_url + '?staff=true&maxresults=15')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(result_json['pagenum'], 1)
        self.assertEqual(result_json['pagecount'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['total'], result_json['pagelen'])
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 17)

        # Exactly maxresults hits
        response = self.client.get(self.base_url + '?staff=true&maxresults=11')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(result_json['pagenum'], 1)
        self.assertEqual(result_json['pagecount'], 1)
        self.assertEqual(result_json['pagelen'], 11)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['total'], 11)
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 17)

        # Paginated response returning maxresults results
        response = self.client.get(self.base_url + '?staff=true&pagenum=2&maxresults=5')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(result_json['pagenum'], 2)
        self.assertEqual(result_json['pagelen'], 5)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertGreater(result_json['total'], 10)
        self.assertGreater(result_json['pagecount'], 2)
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 9)

        # Paginated response returning less than maxresults results
        response = self.client.get(self.base_url + '?staff=true&pagenum=3&maxresults=5')
        self.check_last_page(response)

        # Requesting a page beyond pagecount
        response = self.client.get(self.base_url + '?staff=true&pagenum=5&maxresults=5')
        self.check_last_page(response)

    def test_search_field_collapsing(self):
        self.client.login(username='admin', password='admin')

        # Less hits than the maxresults parameter
        response = self.client.get(self.base_url + '?q=test&staff=true&maxresults=15')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(result_json['pagenum'], 1)
        self.assertEqual(result_json['pagecount'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['pagelen'], 6)
        self.assertEqual(result_json['total'], result_json['pagelen'])
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 11)

    def test_basic_search_with_querytext(self):

        self.client.login(username='myuser', password='admin')

        # keywords terms and mashable are in the description of the
        # Wirecloud/Test/1.5 widget
        result = self.client.get(self.base_url + '?q=term+mashable')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.5")
        self.assertEqual(len(result_json['results'][0]['others']), 0)

        # keywords mashable and application are in the description of the
        # Wirecloud/Test/{1.5,2.0,2.5} widgets and the Wirecloud/test-mashup/1.0
        # mashup
        result = self.client.get(self.base_url + '?q=mashable+application')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 2)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.0")
        self.assertEqual(len(result_json['results'][0]['others']), 0)
        self.assertEqual(result_json['results'][1]['version'], "2.5")
        self.assertEqual(len(result_json['results'][1]['others']), 2)

        # keyword mashable is present in the description of the
        # Wirecloud/Test/{1.5,2.0,2.5} widgets and the Wirecloud/test-mashup/1.0
        # and the Wirecloud/test-mashup-dependencies/1.5.5 mashups
        result = self.client.get(self.base_url + '?q=mashable')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 3)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.5.5")
        self.assertEqual(len(result_json['results'][0]['others']), 0)
        self.assertEqual(result_json['results'][1]['version'], "1.0")
        self.assertEqual(len(result_json['results'][1]['others']), 0)
        self.assertEqual(result_json['results'][2]['version'], "2.5")
        self.assertEqual(len(result_json['results'][2]['others']), 2)

        # keywords output and digit are present in the description of the
        # Wirecloud/Test/1.5 widget (inside the description of the
        # outputendpoint endpoint)
        result = self.client.get(self.base_url + '?q=output+digit')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.5")
        self.assertEqual(len(result_json['results'][0]['others']), 0)

        # Switch session user to MyUser
        self.client.logout()
        self.client.login(username='MyUser', password='admin')

        # keywords test, mashup and dependencies are present in the description
        # of the Wirecloud/test-mashup-dependencies/{1.5.5,1.10.5} mashups, but
        # MyUser only has access to Wirecloud/test-mashup-dependencies/1.10.5
        result = self.client.get(self.base_url + '?q=test+mashup+dependencies')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.10.5")
        self.assertEqual(len(result_json['results'][0]['others']), 0)

    def test_basic_search_with_querytext_empty(self):

        self.client.login(username='myuser', password='admin')

        # Empty query
        result = self.client.get(self.base_url + '?q=totally+uncorrectable+search+giving+an+empty+resultset')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagenum'], 1)
        self.assertEqual(result_json['pagelen'], 0)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))

    def test_basic_search_with_staff(self):

        self.client.login(username='admin', password='admin')

        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(result_json['pagenum'], 1)
        self.assertEqual(result_json['pagelen'], 9)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['total'], result_json['pagelen'])
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 13)

        response = self.client.get(self.base_url + '?staff=true')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(result_json['pagenum'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['total'], 11)
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 17)

    @override_settings(FORCE_PROTO=None, FORCE_DOMAIN=None)
    def test_search_absolute_urls(self):

        self.client.login(username='admin', password='admin')

        response = self.client.get(self.base_url, HTTP_HOST="wirecloud.example.com")
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        for result in result_json['results']:
            if result['name'] == 'sky_weather':
                self.assertTrue(result['image'].startswith('http://wirecloud.example.com/'))
                self.assertTrue(result['smartphoneimage'].startswith('http://wirecloud.example.com/'))
            else:
                self.assertEqual(result['image'], '')
                self.assertEqual(result['smartphoneimage'], '')

    def test_basic_search_partial_word(self):

        self.client.login(username='myuser', password='admin')

        # Search using a partial word: ashabl (full word: mashable)
        result = self.client.get(self.base_url + '?q=ashabl')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], len(self.MASHABLE_RESULTS))
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(set([component['uri'] for component in result_json['results']]), self.MASHABLE_RESULTS)

    def test_advanced_search_prefix(self):

        self.client.login(username='myuser', password='admin')

        # Search using a prefix: wire (full word: wirecloud)
        result = self.client.get(self.base_url + '?q=wire')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['pagelen'], len(self.WIRECLOUD_RESULTS))
        self.assertEqual(set([component['uri'] for component in result_json['results']]), self.WIRECLOUD_RESULTS)

    def test_advanced_search_phrase_with_prefix(self):

        self.client.login(username='myuser', password='admin')

        # Search a full word: weather
        # Jointly with a prefix: inter (full word: interface)
        result = self.client.get(self.base_url + '?q=weather+inter')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.5.5")
        self.assertEqual(len(result_json['results'][0]['others']), 0)


class CatalogueAPITestCase(WirecloudTestCase, TransactionTestCase):

    fixtures = ('catalogue_test_data',)
    tags = ('wirecloud-catalogue', 'wirecloud-noselenium', 'wirecloud-catalogue-noselenium')
    populate = False
    use_search_indexes = False

    @classmethod
    def setUpClass(cls):

        cls.basic_request_meta = {
            'HTTP_ACCEPT': 'application/json',
            'content_type': 'application/json',
        }
        super(CatalogueAPITestCase, cls).setUpClass()

    def setUp(self):

        super(CatalogueAPITestCase, self).setUp()

        self.client = Client()

    def test_last_version_query(self):

        self.client.login(username='test', password='admin')
        resources = json.dumps([
            {'name': 'widget1', 'vendor': 'Test'},
            {'name': 'inexistantwidget', 'vendor': 'Test'},
        ])
        result = self.client.post(reverse('wirecloud_catalogue.resource_versions'), resources, **self.basic_request_meta)
        self.assertEqual(result.status_code, 200)
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertTrue('resources' in result_json)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(result_json['resources'][0]['lastVersion'], '1.10')

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt',), shared=True, public=True)
    def test_resource_entry_get(self):

        url = reverse('wirecloud_catalogue.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(response_data['version'], '1.0')
        self.assertNotIn('versions', response_data)

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt',), shared=True, public=True)
    @uses_extra_resources(('Wirecloud_Test_2.0.wgt',), shared=True, public=False, users=('test',))
    def test_resource_entry_get_all_versions(self):

        url = reverse('wirecloud_catalogue.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test'})

        # Authenticate
        self.client.login(username='test', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(response_data['versions']), 2)

    def test_resource_entry_get_all_empty(self):

        url = reverse('wirecloud_catalogue.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test'})

        # Authenticate
        self.client.login(username='test', password='admin')

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt',), shared=True, public=True)
    @uses_extra_resources(('Wirecloud_Test_2.0.wgt',), shared=True, public=False, users=('test',))
    def test_resource_entry_get_all_versions_anonymous(self):

        url = reverse('wirecloud_catalogue.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test'})

        # Make the request
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(response_data['versions']), 1)

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt',), shared=True, creator="test")
    def test_resource_entry_delete(self):

        url = reverse('wirecloud_catalogue.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})

        # Authenticate
        self.client.login(username='test', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(response_data['affectedVersions']), 1)

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt',), shared=True, creator="test")
    def test_resource_entry_delete_unauthorized(self):

        url = reverse('wirecloud_catalogue.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})

        # Authenticate
        self.client.login(username='otheruser', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt',), shared=True, creator="test")
    def test_resource_entry_delete_organization_member(self):

        url = reverse('wirecloud_catalogue.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})

        # Authenticate
        self.client.login(username='test2', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(response_data['affectedVersions']), 1)

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt', 'Wirecloud_Test_2.0.wgt'), shared=True, creator="test")
    def test_resource_entry_delete_all_versions_unauthorized(self):

        url = reverse('wirecloud_catalogue.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test'})

        # Authenticate
        self.client.login(username='otheruser', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt', 'Wirecloud_Test_2.0.wgt'), shared=True, creator="test")
    def test_resource_entry_delete_all_versions(self):

        url = reverse('wirecloud_catalogue.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test'})

        # Authenticate
        self.client.login(username='test', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(response_data['affectedVersions']), 2)

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt',), shared=True, creator="test")
    @uses_extra_resources(('Wirecloud_Test_2.0.wgt',), shared=True, creator="test2")
    def test_resource_entry_delete_all_versions_mixed_creators(self):

        url = reverse('wirecloud_catalogue.resource_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test'})

        # Authenticate
        self.client.login(username='test', password='admin')

        # Make the request
        response = self.client.delete(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'].split(';', 1)[0], 'application/json')
        response_data = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(response_data['affectedVersions']), 2)

    def test_resource_userguide_entry_missing_component(self):

        url = reverse('wirecloud_catalogue.resource_userguide_entry', kwargs={'vendor': 'Wirecloud', 'name': 'nonexistent', 'version': '1.0'})

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 404)

    @uses_extra_resources(('Wirecloud_Test_Selenium_1.0.wgt',), shared=True, public=True)
    def test_resource_userguide_entry_component_missing_userguide(self):

        # Test_Selenium exists but doesn't provide an userguide
        url = reverse('wirecloud_catalogue.resource_userguide_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test_Selenium', 'version': '1.0'})

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 404)

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt',), shared=True, public=True)
    def test_resource_userguide_entry_error_reading_userguide(self):

        url = reverse('wirecloud_catalogue.resource_userguide_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})

        with patch('wirecloud.catalogue.views.download_local_file', side_effect=Exception):
            response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
            self.assertEqual(response.status_code, 200)
            response_text = response.content.decode('utf-8').lower()
            self.assertIn('error', response_text)
            self.assertIn('userguide', response_text)

    def test_resource_userguide_entry_external_doc(self):

        url = reverse('wirecloud_catalogue.resource_userguide_entry', kwargs={'vendor': 'Test', 'name': 'widget1', 'version': '1.2'})

        with patch('wirecloud.catalogue.views.download_local_file', side_effect=Exception):
            response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
            self.assertEqual(response.status_code, 200)
            response_text = response.content.decode('utf-8').lower()
            self.assertIn('http://example.org/doc', response_text)

    @uses_extra_resources(('Wirecloud_Test_2.0.wgt',), shared=True, public=True)
    def test_resource_changelog_entry_from_version(self):

        url = reverse('wirecloud_catalogue.resource_changelog_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '2.0'}) + '?from=1.0'

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('1.0', response.content.decode('utf-8'))

    def test_resource_changelog_entry_missing_component(self):

        url = reverse('wirecloud_catalogue.resource_changelog_entry', kwargs={'vendor': 'Wirecloud', 'name': 'nonexistent', 'version': '1.0'})

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 404)

    @uses_extra_resources(('Wirecloud_Test_Selenium_1.0.wgt',), shared=True, public=True)
    def test_resource_changelog_entry_component_missing_changelog(self):

        # Test_Selenium doesn't provide a changelog
        url = reverse('wirecloud_catalogue.resource_changelog_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test_Selenium', 'version': '1.0'})

        response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
        self.assertEqual(response.status_code, 404)

    @uses_extra_resources(('Wirecloud_Test_1.0.wgt',), shared=True, public=True)
    def test_resource_userguide_entry_error_reading_changelog(self):

        url = reverse('wirecloud_catalogue.resource_changelog_entry', kwargs={'vendor': 'Wirecloud', 'name': 'Test', 'version': '1.0'})

        with patch('wirecloud.catalogue.views.download_local_file', side_effect=Exception):
            response = self.client.get(url, HTTP_ACCEPT='application/xhtml+xml')
            self.assertEqual(response.status_code, 200)
            response_text = response.content.decode('utf-8').lower()
            self.assertIn('error', response_text)
            self.assertIn('changelog', response_text)


class WGTDeploymentTestCase(WirecloudTestCase, TransactionTestCase):

    tags = ('wirecloud-catalogue', 'wirecloud-noselenium', 'wirecloud-catalogue-noselenium')
    populate = False

    def setUp(self):
        super(WGTDeploymentTestCase, self).setUp()

        self.resource_collection_url = reverse('wirecloud_catalogue.resource_collection')
        self.user = User.objects.create_user('wirecloud', 'test@example.com', 'test')

    def test_wgt_uploading_requires_login(self):
        c = Client()

        with open(os.path.join(os.path.dirname(__file__), 'test-data/basic_widget.wgt'), 'rb') as f:
            response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')

        self.assertFalse(response.status_code > 200 and response.status_code < 300)

    def test_wgt_upload_invalid_component_multipart_form(self):
        c = Client()
        c.login(username='wirecloud', password='test')
        response = c.post(self.resource_collection_url, {'file': BytesIO(b"invalidcontent")}, HTTP_HOST='www.example.com')
        self.assertEqual(response.status_code, 400)

    def test_wgt_upload_missing_component_multipart_form(self):
        c = Client()
        c.login(username='wirecloud', password='test')
        response = c.post(self.resource_collection_url, {}, HTTP_HOST='www.example.com')
        self.assertEqual(response.status_code, 400)

    def test_wgt_upload_invalid_component_octet_stream(self):
        c = Client()
        c.login(username='wirecloud', password='test')
        response = c.post(self.resource_collection_url, "invalidcontent", content_type='application/octet-stream', HTTP_HOST='www.example.com')
        self.assertEqual(response.status_code, 400)

    @patch("wirecloud.catalogue.views.install_component")
    def test_wgt_upload_parse_exception(self, install_component):
        c = Client()
        c.login(username='wirecloud', password='test')
        install_component.side_effect = TemplateParseException('test')
        with open(os.path.join(os.path.dirname(__file__), 'test-data/basic_widget.wgt'), 'rb') as f:
            response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')
        self.assertEqual(response.status_code, 400)

    @patch("wirecloud.catalogue.views.install_component")
    def test_wgt_upload_invalid_contents(self, install_component):
        c = Client()
        c.login(username='wirecloud', password='test')
        install_component.side_effect = InvalidContents('test')
        with open(os.path.join(os.path.dirname(__file__), 'test-data/basic_widget.wgt'), 'rb') as f:
            response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')
        self.assertEqual(response.status_code, 400)

    @patch("wirecloud.catalogue.views.install_component")
    def test_wgt_upload_oserror(self, install_component):
        c = Client()
        c.login(username='wirecloud', password='test')
        install_component.side_effect = OSError()
        with open(os.path.join(os.path.dirname(__file__), 'test-data/basic_widget.wgt'), 'rb') as f:
            self.assertRaises(OSError, c.post, self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')

    @patch("wirecloud.catalogue.views.install_component")
    def test_wgt_upload_oserror_eacces(self, install_component):
        c = Client()
        c.login(username='wirecloud', password='test')
        install_component.side_effect = OSError(errno.EACCES, "a")
        with open(os.path.join(os.path.dirname(__file__), 'test-data/basic_widget.wgt'), 'rb') as f:
            response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')
        self.assertEqual(response.status_code, 500)

    @patch("wirecloud.catalogue.views.install_component")
    def test_wgt_upload_already_published(self, install_component):
        c = Client()
        c.login(username='wirecloud', password='test')
        install_component.return_value = (False, None)
        with open(os.path.join(os.path.dirname(__file__), 'test-data/basic_widget.wgt'), 'rb') as f:
            response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')
        self.assertEqual(response.status_code, 409)

    def test_upload_of_basic_packaged_widget(self):
        widget_path = wirecloud.catalogue.utils.wgt_deployer.get_base_dir('Wirecloud', 'Test', '0.1')
        c = Client()

        c.login(username='wirecloud', password='test')
        with open(os.path.join(os.path.dirname(__file__), 'test-data/basic_widget.wgt'), 'rb') as f:
            response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')

        self.assertEqual(response.status_code, 201)
        self.assertTrue(os.path.isdir(widget_path))
        self.assertTrue(os.path.exists(os.path.join(widget_path, 'images/catalogue.png')))
        self.assertTrue(os.path.exists(os.path.join(widget_path, 'images/smartphone.png')))
        self.assertTrue(os.path.exists(os.path.join(widget_path, 'documentation/images/image.png')))
        self.assertTrue(os.path.exists(os.path.join(widget_path, 'documentation/index.html')))
        self.assertFalse(os.path.exists(os.path.join(widget_path, 'test.html')))
        widget = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='0.1')
        widget_info = widget.json_description
        self.assertEqual(widget.template_uri, 'Wirecloud_Test_0.1.wgt')
        self.assertEqual(widget_info['image'], 'images/catalogue.png')

        resource_entry_url = reverse('wirecloud_catalogue.resource_entry', kwargs={
            'vendor': 'Wirecloud',
            'name': 'Test',
            'version': '0.1',
        })
        c.login(username='test', password='test')
        response = c.delete(resource_entry_url, HTTP_HOST='www.example.com')

        self.assertEqual(response.status_code, 200)
        self.assertFalse(os.path.exists(widget_path))

    def test_upload_of_packaged_widget(self):

        c = Client()

        c.login(username='wirecloud', password='test')
        with open(os.path.join(os.path.dirname(__file__), '../../commons/test-data/Wirecloud_Test_1.0.wgt'), 'rb') as f:
            response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')

        self.assertEqual(response.status_code, 201)
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='1.0')
        widget_info = get_resource_data(resource, self.user)
        self.assertEqual(widget_info['description'], 'This widget is used to test some of the features of the Wirecloud platform')
        self.assertEqual(widget_info['longdescription'], '<p>This widget is used for <strong>testing</strong> some of the features provided by Wirecloud</p>')

    def test_upload_of_packaged_operators(self):
        operator_path = wirecloud.catalogue.utils.wgt_deployer.get_base_dir('Wirecloud', 'basic-operator', '0.1')
        c = Client()

        c.login(username='wirecloud', password='test')
        with open(os.path.join(os.path.dirname(__file__), 'test-data/basic_operator.zip'), 'rb') as f:
            response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')

        self.assertEqual(response.status_code, 201)
        self.assertTrue(os.path.isdir(operator_path))
        self.assertTrue(os.path.exists(os.path.join(operator_path, 'images/catalogue.png')))
        self.assertTrue(os.path.exists(os.path.join(operator_path, 'doc/images/image.png')))
        self.assertTrue(os.path.exists(os.path.join(operator_path, 'doc/index.html')))
        operator = CatalogueResource.objects.get(vendor='Wirecloud', short_name='basic-operator', version='0.1')
        operator_info = operator.json_description
        self.assertEqual(operator.template_uri, 'Wirecloud_basic-operator_0.1.wgt')
        self.assertEqual(operator_info['image'], 'images/catalogue.png')

        resource_entry_url = reverse('wirecloud_catalogue.resource_entry', kwargs={
            'vendor': 'Wirecloud',
            'name': 'basic-operator',
            'version': '0.1',
        })
        c.login(username='test', password='test')
        response = c.delete(resource_entry_url, HTTP_HOST='www.example.com')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(os.path.exists(operator_path), False)


class CatalogueMediaTestCase(TestCase):

    tags = ('wirecloud-catalogue', 'wirecloud-catalogue-media', 'wirecloud-catalogue-noselenium', 'wirecloud-noselenium')

    def build_mocks(self, resource_type='widget'):

        get_object_or_404_mock = Mock()
        resource_mock = Mock()
        resource_mock.resource_type.return_value = resource_type
        get_object_or_404_mock.return_value = resource_mock

        request_mock = Mock()
        request_mock.method = 'GET'

        return request_mock, get_object_or_404_mock, Mock()

    def test_path_file_found_mashup(self):

        request, get_object_or_404_mock, build_downloadfile_response_mock = self.build_mocks('mashup')

        response_mock = Mock()
        response_mock.status_code = 200
        build_downloadfile_response_mock.return_value = response_mock

        with patch.multiple('wirecloud.catalogue.views', get_object_or_404=get_object_or_404_mock, build_downloadfile_response=build_downloadfile_response_mock):
            response = serve_catalogue_media(request, 'Wirecloud', 'Test', '1.0', 'image/catalogue.png')
            self.assertEqual(response, response_mock)

    def test_path_file_found_operator(self):

        request, get_object_or_404_mock, build_downloadfile_response_mock = self.build_mocks('operator')

        response_mock = Mock()
        response_mock.status_code = 200
        build_downloadfile_response_mock.return_value = response_mock

        with patch.multiple('wirecloud.catalogue.views', get_object_or_404=get_object_or_404_mock, build_downloadfile_response=build_downloadfile_response_mock):
            response = serve_catalogue_media(request, 'Wirecloud', 'Test', '1.0', 'image/catalogue.png')
            self.assertEqual(response, response_mock)

    def test_path_file_found_widget(self):

        request, get_object_or_404_mock, build_downloadfile_response_mock = self.build_mocks('widget')

        response_mock = Mock()
        response_mock.status_code = 200
        build_downloadfile_response_mock.return_value = response_mock

        with self.settings(USE_XSENDFILE=False):
            with patch.multiple('wirecloud.catalogue.views', get_object_or_404=get_object_or_404_mock, build_downloadfile_response=build_downloadfile_response_mock):
                response = serve_catalogue_media(request, 'Wirecloud', 'Test', '1.0', 'image/catalogue.png')
                self.assertEqual(response, response_mock)

    def test_path_file_not_found(self):

        request, get_object_or_404_mock, build_downloadfile_response_mock = self.build_mocks()

        build_downloadfile_response_mock.side_effect = Http404()

        with self.settings(USE_XSENDFILE=False):
            with patch.multiple('wirecloud.catalogue.views', get_object_or_404=get_object_or_404_mock, build_downloadfile_response=build_downloadfile_response_mock):
                self.assertRaises(Http404, serve_catalogue_media, request, 'Wirecloud', 'Test', '1.0', 'notfound.png')
                self.assertEqual(build_downloadfile_response_mock.call_count, 1)

    def test_path_outside_widget_folder(self):

        request, get_object_or_404_mock, build_downloadfile_response_mock = self.build_mocks()

        response_mock = MagicMock()
        response_mock.status_code = 302
        headers = {'Location': 'manage.py'}

        def set_header(key, value):
            headers[key] = value

        def get_header(key):
            return headers[key]

        response_mock.__setitem__.side_effect = set_header
        response_mock.__getitem__.side_effect = get_header
        build_downloadfile_response_mock.return_value = response_mock

        with patch.multiple('wirecloud.catalogue.views', get_object_or_404=get_object_or_404_mock, build_downloadfile_response=build_downloadfile_response_mock):
            response = serve_catalogue_media(request, 'Wirecloud', 'Test', '1.0', 'test/../../../../../../manage.py')
            self.assertEqual(response.status_code, 302)
            self.assertEqual(response['Location'], reverse('wirecloud_catalogue.media', kwargs={"vendor": 'Wirecloud', "name": 'Test', "version": '1.0', "file_path": 'manage.py'}))
            self.assertTrue(response['Location'].endswith('manage.py'))
