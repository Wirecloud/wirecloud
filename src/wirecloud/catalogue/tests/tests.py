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

import codecs
import json
import os
from shutil import rmtree
from tempfile import mkdtemp

from django.conf import settings
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.test import TransactionTestCase, TestCase, Client

import wirecloud.catalogue.utils
from wirecloud.catalogue.utils import add_resource_from_template, get_resource_data
from wirecloud.catalogue.models import CatalogueResource
from wirecloud.commons.utils.template import TemplateParseException
from wirecloud.commons.utils.testcases import LocalFileSystemServer, WirecloudTestCase
from wirecloud.commons.utils.wgt import WgtDeployer


# Avoid nose to repeat these tests (they are run through __init__.py)
__test__ = False


class AddWidgetTestCase(WirecloudTestCase):

    servers = {
        'http': {
            'example.com': LocalFileSystemServer(os.path.join(os.path.dirname(__file__), 'test-data')),
        },
    }
    @classmethod
    def setUpClass(cls):

        super(AddWidgetTestCase, cls).setUpClass()

        cls.template_uri = "http://example.com/template1.xml"
        f = open(os.path.join(os.path.dirname(__file__), 'test-data/template1.xml'), 'rb')
        cls.template = f.read()
        f.close()

    def setUp(self):
        super(AddWidgetTestCase, self).setUp()

        self.user = User.objects.create_user('test', 'test@example.com', 'test')

    def test_add_resource_from_template(self):

        widget = add_resource_from_template(self.template_uri, self.template, self.user)
        widget_info = widget.get_processed_info()

        self.assertEqual(widget.vendor, 'Morfeo')
        self.assertEqual(widget.short_name, 'Test')
        self.assertEqual(widget.version, '0.1')
        self.assertEqual(widget_info['wiring'], {
            'inputs': [
                {'friendcode': 'test_friend_code', 'name': 'slot', 'actionlabel': '', 'label': 'Slot label', 'type': 'text', 'description': ''}
            ],
            'outputs': [
                {'description': '', 'type': 'text', 'friendcode': 'test_friend_code', 'name': 'event', 'label': 'Event label'}
            ]
        })

    def test_add_resource_from_template_translations(self):

        widget = add_resource_from_template(self.template_uri, self.template, self.user)
        self.changeLanguage('en')
        data = get_resource_data(widget, self.user)

        self.assertEqual(data['title'], 'Test Widget')
        self.assertEqual(data['description'], 'Test Widget description')

        self.changeLanguage('es')
        data = get_resource_data(widget, self.user)

        self.assertEqual(data['title'], u'Widget de pruebas')
        self.assertEqual(data['description'], u'Descripción del Widget de pruebas')


class CatalogueSearchTestCase(WirecloudTestCase):

    fixtures = ('catalogue_search_data',)
    tags = ('catalogue',)

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
        result_json = json.loads(response.content)
        widgets = [i['type'] for i in result_json['results']].count('widget')
        self.assertEqual(result_json['pagelen'], 4)
        self.assertEqual(result_json['pagelen'], widgets)
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 6)
        self.client.logout()

        self.client.login(username='admin', password='admin')

        response = self.client.get(self.base_url + '?scope=widget&staff=True')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content)
        widgets = [i['type'] for i in result_json['results']].count('widget')
        self.assertEqual(result_json['pagelen'], widgets)
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 7)

    def test_basic_search_with_args_not_supported(self):

        self.client.login(username='emptyuser', password='admin')

        response = self.client.get(self.base_url+'?staff=True')
        self.assertEqual(response.status_code, 403)

        response = self.client.get(self.base_url+'?scope=application')
        self.assertEqual(response.status_code, 400)

        response = self.client.get(self.base_url+'?orderby=type')
        self.assertEqual(response.status_code, 400)

    def test_basic_search_with_orderby(self):

        self.client.login(username='emptyuser', password='admin')

        response = self.client.get(self.base_url+'?orderby=-creation_date')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content)
        self.assertEqual(result_json['pagelen'], 8)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))

        response = self.client.get(self.base_url+'?orderby=creation_date')
        self.assertEqual(response.status_code, 200)
        result2_json = json.loads(response.content)
        self.assertEqual(result2_json['pagelen'], 8)
        self.assertEqual(result2_json['pagelen'], len(result2_json['results']))
        self.assertEqual(result2_json['results'][0], result_json['results'][-1])

    def test_basic_search_with_pagination(self):

        self.client.login(username='admin', password='admin')

        response = self.client.get(self.base_url+'?staff=True&pagelen=15')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content)
        self.assertEqual(result_json['pagenum'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['total'], 11)
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 17)

        response = self.client.get(self.base_url+'?staff=True&pagenum=2')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content)
        self.assertEqual(result_json['pagenum'], 2)
        self.assertEqual(result_json['pagelen'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['total'], 11)
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 3)

        response = self.client.get(self.base_url+'?staff=True&pagenum=2&pagelen=5')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content)
        self.assertEqual(result_json['pagenum'], 2)
        self.assertEqual(result_json['pagelen'], 5)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['total'], 10)
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 9)

    def test_basic_search_with_querytext(self):

        self.client.login(username='myuser', password='admin')

        result = self.client.get(self.base_url+'?q=term+mashable')
        result_json = json.loads(result.content)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.5")
        self.assertEqual(len(result_json['results'][0]['others']), 2)

        result = self.client.get(self.base_url+'?q=mashable+application')
        result_json = json.loads(result.content)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 2)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.5")
        self.assertEqual(len(result_json['results'][0]['others']), 0)

        result = self.client.get(self.base_url+'?q=mashable')
        result_json = json.loads(result.content)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result_json['pagelen'], 3)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['results'][0]['version'], "1.5")
        self.assertEqual(len(result_json['results'][0]['others']), 0)
        self.assertEqual(result_json['results'][1]['version'], "1.5")
        self.assertEqual(len(result_json['results'][1]['others']), 0)

    def test_basic_search_with_staff(self):

        self.client.login(username='admin', password='admin')

        response = self.client.get(self.base_url)
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content)
        self.assertEqual(result_json['pagenum'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['total'], 9)
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 13)

        response = self.client.get(self.base_url+'?staff=True')
        self.assertEqual(response.status_code, 200)
        result_json = json.loads(response.content)
        self.assertEqual(result_json['pagenum'], 1)
        self.assertEqual(result_json['pagelen'], len(result_json['results']))
        self.assertEqual(result_json['total'], 10)
        n = result_json['pagelen'] + sum([len(i['others']) for i in result_json['results']])
        self.assertEqual(n, 14)


class CatalogueAPITestCase(WirecloudTestCase):

    fixtures = ('selenium_test_data', 'catalogue_search_data')

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
        result_json = json.loads(result.content)
        self.assertTrue('resources' in result_json)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(result_json['resources'][0]['lastVersion'], '1.10')


class PublishTestCase(WirecloudTestCase):

    tags = ('fiware-ut-4',)

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
        self.assertEqual(mashup_info['authors'], 'test')

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


class WGTDeploymentTestCase(TransactionTestCase):

    def setUp(self):
        super(WGTDeploymentTestCase, self).setUp()

        self.old_CATALOGUE_MEDIA_ROOT = settings.CATALOGUE_MEDIA_ROOT
        settings.CATALOGUE_MEDIA_ROOT = mkdtemp()
        self.old_deployer = wirecloud.catalogue.utils.wgt_deployer
        wirecloud.catalogue.utils.wgt_deployer = WgtDeployer(settings.CATALOGUE_MEDIA_ROOT)
        self.resource_collection_url = reverse('wirecloud_catalogue.resource_collection')

    def tearDown(self):
        rmtree(settings.CATALOGUE_MEDIA_ROOT, ignore_errors=True)
        settings.CATALOGUE_MEDIA_ROOT = self.old_CATALOGUE_MEDIA_ROOT
        wirecloud.catalogue.utils.wgt_deployer = self.old_deployer

        super(WGTDeploymentTestCase, self).tearDown()

    def test_wgt_uploading_requires_login(self):
        c = Client()

        f = open(os.path.join(os.path.dirname(__file__), 'test-data/basic_widget.wgt'))
        response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')
        f.close()

        self.assertFalse(response.status_code > 200 and response.status_code < 300)

    def test_upload_of_packaged_widget(self):
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
