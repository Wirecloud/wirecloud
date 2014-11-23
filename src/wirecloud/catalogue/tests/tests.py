# -*- coding: utf-8 -*-

# Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

import codecs
import json
import os

from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.test import Client
from django.test.utils import override_settings

import wirecloud.catalogue.utils
from wirecloud.catalogue.utils import add_resource_from_template, get_resource_data
from wirecloud.catalogue.models import CatalogueResource, Version
from wirecloud.commons.utils.template import TemplateParseException
from wirecloud.commons.utils.testcases import LocalFileSystemServer, WirecloudTestCase


# Avoid nose to repeat these tests (they are run through __init__.py)
__test__ = False


class CatalogueSearchTestCase(WirecloudTestCase):

    fixtures = ('catalogue_search_data',)
    tags = ('catalogue', 'catalogue-search')

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

        response = self.client.get(self.base_url+'?staff=true')
        self.assertEqual(response.status_code, 403)

        response = self.client.get(self.base_url+'?scope=application')
        self.assertEqual(response.status_code, 400)

        response = self.client.get(self.base_url+'?orderby=type')
        self.assertEqual(response.status_code, 400)

    def test_basic_search_with_orderby(self):

        self.client.login(username='emptyuser', password='admin')

        response = self.client.get(self.base_url+'?orderby=-creation_date')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['pagelen'], 8)

        response = self.client.get(self.base_url+'?orderby=creation_date')
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

    def test_basic_search_with_querytext(self):

        self.client.login(username='myuser', password='admin')

        result = self.client.get(self.base_url+'?q=term+mashable')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.5")
        self.assertEqual(len(result_json['results'][0]['others']), 2)

        result = self.client.get(self.base_url+'?q=mashable+application')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 2)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.0")
        self.assertEqual(len(result_json['results'][0]['others']), 1)

        result = self.client.get(self.base_url+'?q=mashable')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 3)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.5.5")
        self.assertEqual(len(result_json['results'][0]['others']), 0)
        self.assertEqual(result_json['results'][1]['version'], "1.0")
        self.assertEqual(len(result_json['results'][1]['others']), 1)

        result = self.client.get(self.base_url+'?q=output+digit')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.5")
        self.assertEqual(len(result_json['results'][0]['others']), 2)

        # Empty query
        result = self.client.get(self.base_url+'?q=totally+uncorrectable+search+giving+an+empty+resultset')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagenum'], 1)
        self.assertEqual(result_json['pagelen'], 0)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))

        self.client.logout()
        self.client.login(username='MyUser', password='admin')

        result = self.client.get(self.base_url+'?q=test+mashup+dependencies')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.10.5")
        self.assertEqual(len(result_json['results'][0]['others']), 1)

    def test_basic_search_with_staff(self):

        self.client.login(username='admin', password='admin')

        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(result_json['pagenum'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['total'], result_json['pagelen'])
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 13)

        response = self.client.get(self.base_url+'?staff=true')
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

        response = self.client.get(self.base_url + '?q=mashable+application+component', HTTP_HOST="wirecloud.example.com")
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        for result in result_json['results']:
            self.assertTrue(result['image'].startswith('http://wirecloud.example.com/'))
            self.assertTrue(result['smartphoneimage'].startswith('http://wirecloud.example.com/'))

    def test_version_order(self):

        self.assertLess(Version('1.0'), Version('1.11a1'))
        self.assertLess(Version('1.11a1'), Version('1.11a2'))
        self.assertLess(Version('1.11a2'), Version('1.11b1'))
        self.assertLess(Version('1.11b1'), Version('1.11rc1'))
        self.assertLess(Version('1.11rc1'), Version('1.11'))
        self.assertLess(Version('1.11'), Version('1.11.5.1'))
        self.assertLess(Version('1.11.5.1'), Version('1.11.5.4'))
        self.assertLess(Version('1.11.5.4'), Version('1.100'))

        self.assertGreater(Version('1.0', reverse=True), Version('1.11a1', reverse=True))
        self.assertGreater(Version('1.11b1', reverse=True), Version('1.11rc1', reverse=True))

        self.assertEqual(Version('1.0'), Version('1.0.0'))
        self.assertEqual(Version('1.0', reverse=True), Version('1.0.0', reverse=True))

        self.assertRaises(ValueError, Version, '-0')
        self.assertRaises(ValueError, Version, '0.a')

    def test_basic_search_with_query_correction(self):

        self.client.login(username='myuser', password='admin')

        result = self.client.get(self.base_url+'?q=wercloud')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['corrected_q'], 'wirecloud')
        self.assertEqual(result_json['pagelen'], 4)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.5")
        self.assertEqual(len(result_json['results'][0]['others']), 0)

        result = self.client.get(self.base_url+'?q=mashble')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['corrected_q'], 'mashable')
        self.assertEqual(result_json['pagelen'], 3)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.5.5")

    def test_advanced_search_for_prefixes_and_suffixes(self):

        self.client.login(username='myuser', password='admin')

        result = self.client.get(self.base_url+'?q=wire')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 4)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['vendor'], "Wirecloud")
        self.assertEqual(result_json['results'][0]['version'], "1.5")
        self.assertEqual(len(result_json['results'][0]['others']), 0)

        result = self.client.get(self.base_url+'?q=shu')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 3)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['title'], "Mashup Sky Weather")
        self.assertEqual(result_json['results'][0]['version'], "3.0")
        self.assertEqual(len(result_json['results'][0]['others']), 0)

        result = self.client.get(self.base_url+'?q=weather+inter')
        result_json = json.loads(result.content.decode('utf-8'))
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.5.5")
        self.assertEqual(len(result_json['results'][0]['others']), 0)

class CatalogueSuggestionTestCase(WirecloudTestCase):

    fixtures = ('catalogue_search_data',)
    tags = ('catalogue', 'catalogue-suggestion')

    @classmethod
    def setUpClass(cls):

        super(CatalogueSuggestionTestCase, cls).setUpClass()
        cls.base_url = reverse('wirecloud_catalogue.resource_suggestion')

    def setUp(self):

        super(CatalogueSuggestionTestCase, self).setUp()
        self.client = Client()

    def test_basic_suggestion(self):

        self.client.login(username='admin', password='admin')

        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(result_json['terms']), 50)

        response = self.client.get(self.base_url + '?top=20')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(result_json['terms']), 40)

        response = self.client.get(self.base_url + '?p=double+prefix')
        self.assertEqual(response.status_code, 400)

        response = self.client.get(self.base_url + '?top=fail')
        self.assertEqual(response.status_code, 400)

        response = self.client.get(self.base_url + '?p=wire')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content.decode('utf-8'))
        self.assertEqual(len(result_json['terms']), 8)


class CatalogueAPITestCase(WirecloudTestCase):

    fixtures = ('catalogue_test_data',)
    tags = ('catalogue',)

    @classmethod
    def setUpClass(cls):

        cls.basic_request_meta = {
            'HTTP_ACCEPT': 'application/json',
            'content_type': 'application/json',
        }
        super(CatalogueAPITestCase, cls).setUpClass()

    def setUp(self):

        super(CatalogueAPITestCase, self).setUp()

        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.client = Client()

    def test_last_version_query(self):

        self.client.login(username='test', password='test')
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


class PublishTestCase(WirecloudTestCase):

    tags = ('catalogue', 'fiware-ut-4')

    def setUp(self):
        super(PublishTestCase, self).setUp()
        self.user = User.objects.create_user('test', 'test@example.com', 'test')

    def read_template(self, *filename):
        f = codecs.open(os.path.join(os.path.dirname(__file__), *filename), 'rb')
        contents = f.read()
        f.close()

        return contents

    def check_basic_mashup_info(self, mashup):
        mashup_info = mashup.get_processed_info()

        self.assertEqual(mashup.vendor, 'Wirecloud')
        self.assertEqual(mashup.short_name, 'Test Mashup')
        self.assertEqual(mashup.version, '1')

        self.assertEqual(mashup_info['description'], 'This template defines an empty mashup')
        self.assertEqual(mashup_info['authors'], [{'name': 'test'}])

    def test_publish_empty_mashup_xml(self):
        template_uri = "http://example.com/path/mashup.xml"
        template = self.read_template('test-data', 'mt1.xml')

        mashup = add_resource_from_template(template_uri, template, self.user)
        self.check_basic_mashup_info(mashup)

    def test_publish_empty_mashup_rdf(self):
        template_uri = "http://example.com/path/mashup.rdf"
        template = self.read_template('test-data', 'mt1.rdf')

        mashup = add_resource_from_template(template_uri, template, self.user)
        self.check_basic_mashup_info(mashup)

    def test_publish_invalid_mashup(self):
        template_uri = "http://example.com/path/mashup.rdf"
        template = self.read_template('test-data', 'invalid-mt1.rdf')

        self.assertRaises(TemplateParseException, add_resource_from_template, template_uri, template, self.user)


class WGTDeploymentTestCase(WirecloudTestCase):

    tags = ('catalogue',)

    def setUp(self):
        super(WGTDeploymentTestCase, self).setUp()

        self.resource_collection_url = reverse('wirecloud_catalogue.resource_collection')

    def test_wgt_uploading_requires_login(self):
        c = Client()

        f = open(os.path.join(os.path.dirname(__file__), 'test-data/basic_widget.wgt'))
        response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')
        f.close()

        self.assertFalse(response.status_code > 200 and response.status_code < 300)

    def test_upload_of_basic_packaged_widget(self):
        User.objects.create_user('test', 'test@example.com', 'test')
        widget_path = wirecloud.catalogue.utils.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')
        c = Client()

        f = open(os.path.join(os.path.dirname(__file__), 'test-data/basic_widget.wgt'))
        c.login(username='test', password='test')
        response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')
        f.close()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(os.path.isdir(widget_path))
        self.assertTrue(os.path.exists(os.path.join(widget_path, 'images/catalogue.png')))
        self.assertTrue(os.path.exists(os.path.join(widget_path, 'images/smartphone.png')))
        self.assertTrue(os.path.exists(os.path.join(widget_path, 'documentation/images/image.png')))
        self.assertTrue(os.path.exists(os.path.join(widget_path, 'documentation/index.html')))
        self.assertFalse(os.path.exists(os.path.join(widget_path, 'test.html')))
        widget = CatalogueResource.objects.get(vendor='Morfeo', short_name='Test', version='0.1')
        widget_info = json.loads(widget.json_description)
        self.assertEqual(widget.template_uri, 'Morfeo_Test_0.1.wgt')
        self.assertEqual(widget_info['image'], 'images/catalogue.png')

        resource_entry_url = reverse('wirecloud_catalogue.resource_entry', kwargs={
            'vendor': 'Morfeo',
            'name': 'Test',
            'version': '0.1',
        })
        c.login(username='test', password='test')
        response = c.delete(resource_entry_url, HTTP_HOST='www.example.com')

        self.assertEqual(response.status_code, 200)
        self.assertFalse(os.path.exists(widget_path))

    def test_upload_of_packaged_widget(self):

        user = User.objects.create_user('test', 'test@example.com', 'test')
        c = Client()

        c.login(username='test', password='test')
        with open(os.path.join(os.path.dirname(__file__), '../../commons/test-data/Wirecloud_Test_1.0.wgt')) as f:
            response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')

        self.assertEqual(response.status_code, 200)
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='Test', version='1.0')
        widget_info = get_resource_data(resource, user)
        self.assertEqual(widget_info['description'], 'This widget is used to test some of the features of the Wirecloud platform')
        self.assertEqual(widget_info['longdescription'], '<p>This widget is used for <strong>testing</strong> some of the features provided by Wirecloud</p>')

    def test_upload_of_packaged_operators(self):
        User.objects.create_user('test', 'test@example.com', 'test')
        operator_path = wirecloud.catalogue.utils.wgt_deployer.get_base_dir('Wirecloud', 'basic-operator', '0.1')
        c = Client()

        f = open(os.path.join(os.path.dirname(__file__), 'test-data/basic_operator.zip'))
        c.login(username='test', password='test')
        response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')
        f.close()

        self.assertEqual(response.status_code, 200)
        self.assertTrue(os.path.isdir(operator_path))
        self.assertTrue(os.path.exists(os.path.join(operator_path, 'images/catalogue.png')))
        self.assertTrue(os.path.exists(os.path.join(operator_path, 'doc/images/image.png')))
        self.assertTrue(os.path.exists(os.path.join(operator_path, 'doc/index.html')))
        operator = CatalogueResource.objects.get(vendor='Wirecloud', short_name='basic-operator', version='0.1')
        operator_info = json.loads(operator.json_description)
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
