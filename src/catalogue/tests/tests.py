# -*- coding: utf-8 -*-

import codecs
import os
from shutil import rmtree
from tempfile import mkdtemp

from django.conf import settings
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.test import TransactionTestCase, TestCase, Client
from django.utils import simplejson

import catalogue.utils
from catalogue.utils import add_resource_from_template
from catalogue.get_json_catalogue_data import get_resource_data
from catalogue.models import CatalogueResource, WidgetWiring
from commons import http_utils
from wirecloudcommons.test import FakeDownloader, LocalizedTestCase
from wirecloudcommons.utils.template import TemplateParseException
from wirecloudcommons.utils.wgt import WgtDeployer


# Avoid nose to repeat these tests (they are run through __init__.py)
__test__ = False


class AddWidgetTestCase(LocalizedTestCase):

    def setUp(self):
        super(AddWidgetTestCase, self).setUp()

        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.template_uri = "http://example.com/path/widget.xml"
        f = open(os.path.join(os.path.dirname(__file__), 'test-data/template1.xml'), 'rb')
        self.template = f.read()
        f.close()

    def test_add_resource_from_template(self):

        widget = add_resource_from_template(self.template_uri, self.template, self.user)

        events = WidgetWiring.objects.filter(idResource=widget, wiring='out')
        self.assertTrue(events.count() == 1 and events[0].friendcode == 'test_friend_code')

        slots = WidgetWiring.objects.filter(idResource=widget, wiring='in')
        self.assertTrue(slots.count() == 1 and slots[0].friendcode == 'test_friend_code')

    def test_add_resource_from_template_translations(self):

        widget = add_resource_from_template(self.template_uri, self.template, self.user)
        self.changeLanguage('en')
        data = get_resource_data(widget, self.user)

        self.assertEqual(data['displayName'], 'Test Widget')
        self.assertEqual(data['description'], 'Test Widget description')

        self.changeLanguage('es')
        data = get_resource_data(widget, self.user)

        self.assertEqual(data['displayName'], u'Widget de pruebas')
        self.assertEqual(data['description'], u'Descripción del Widget de pruebas')


class CatalogueAPITestCase(TestCase):

    fixtures = ['catalogue_test_data']

    def setUp(self):

        super(CatalogueAPITestCase, self).setUp()

        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.client = Client()

    def test_basic_listing(self):

        self.client.login(username='test', password='test')

        base_url = reverse('wirecloud_catalogue.resource_list', kwargs={'pag': 1, 'offset': 10})

        # List widgets in alphabetical order (short_name)
        result = self.client.get(base_url + '?orderby=short_name&search_boolean=AND&scope=widget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 5)
        self.assertTrue(len(result_json['resources'][0]) > 0)
        self.assertEqual(result_json['resources'][0]['name'], 'awidget')

        # List widgets in reverse alphabetical order (short_name)
        result = self.client.get(base_url + '?orderby=-short_name&search_boolean=AND&scope=widget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 5)
        self.assertTrue(len(result_json['resources'][0]) > 0)
        self.assertEqual(result_json['resources'][0]['name'], 'zwidget')

    def test_simple_search(self):

        self.client.login(username='test', password='test')

        # Search widgets using "widget1" as keyword
        base_url = reverse('wirecloud_catalogue.simple_search', kwargs={'pag': 1, 'offset': 10, 'criteria': 'simple_or'})
        result = self.client.get(base_url + '?orderby=-popularity&search_criteria=widget1&search_boolean=AND&scope=widget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)

        # Search widgets providing "friendcode2" events
        base_url = reverse('wirecloud_catalogue.simple_search', kwargs={'pag': 1, 'offset': 10, 'criteria': 'event'})
        result = self.client.get(base_url + '?orderby=-popularity&search_criteria=friendcode2&search_boolean=AND&scope=widget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(len(result_json['resources'][0]['versions']), 1)
        widget_data = result_json['resources'][0]
        self.assertEqual(widget_data['name'], 'widget1')
        self.assertEqual(widget_data['versions'][0]['version'], '1.10')

        # Search widgets consuming "friendcode2" events
        base_url = reverse('wirecloud_catalogue.simple_search', kwargs={'pag': 1, 'offset': 10, 'criteria': 'slot'})
        result = self.client.get(base_url + '?orderby=short_name&search_criteria=friendcode2&search_boolean=AND&scope=widget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(len(result_json['resources'][0]['versions']), 2)
        widget_data = result_json['resources'][0]
        self.assertEqual(widget_data['name'], 'widget1')

    def test_global_search(self):

        self.client.login(username='test', password='test')

        base_url = reverse('wirecloud_catalogue.global_search', kwargs={'pag': 1, 'offset': 10})

        # Search widgets using "widget1" as keyword
        result = self.client.get(base_url + '?orderby=-popularity&search_criteria=widget1&search_criteria=&search_criteria=&search_criteria=&search_criteria=&search_criteria=&search_boolean=AND&scope=widget')
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)

        # Search by keyworkd "widget1" and by event "friendcode2"
        result = self.client.get(base_url + '?orderby=-popularity&search_criteria=widget1&search_criteria=&search_criteria=&search_criteria=&search_criteria=friendcode2&search_criteria=&search_boolean=AND&scope=widget')
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(len(result_json['resources'][0]['versions']), 1)
        widget_data = result_json['resources'][0]
        self.assertEqual(widget_data['name'], 'widget1')
        self.assertEqual(widget_data['versions'][0]['version'], '1.10')

        # Search by keyworkd "widget2" and by event "friendcode2"
        result = self.client.get(base_url + '?orderby=-popularity&search_criteria=widget2&search_criteria=&search_criteria=&search_criteria=&search_criteria=friendcode2&search_criteria=&search_boolean=AND&scope=widget')
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 0)

        # Search by keyworkd "widget1" or by event "friendcode2"
        result = self.client.get(base_url + '?orderby=-popularity&search_criteria=widget1&search_criteria=&search_criteria=&search_criteria=&search_criteria=friendcode2&search_criteria=&search_boolean=OR&scope=widget')
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(len(result_json['resources'][0]['versions']), 2)

    def test_last_version_query(self):

        self.client.login(username='test', password='test')
        resources = simplejson.dumps([
            {'name': 'widget1', 'vendor': 'Test'},
            {'name': 'inexistantwidget', 'vendor': 'Test'},
        ])
        result = self.client.post(reverse('wirecloud_catalogue.resource_versions'), {'resources': resources})
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertTrue('resources' in result_json)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(result_json['resources'][0]['lastVersion'], '1.10')

    def test_vote_queries(self):

        User.objects.create_user('test2', 'test@example.com', 'test')
        vote_url = reverse('wirecloud_catalogue.resource_vote', kwargs={'vendor': 'Test', 'name': 'widget1', 'version': '1.2'})

        self.client.login(username='test', password='test')
        result = self.client.post(vote_url, {'vote': 3})
        self.assertEqual(result.status_code, 200)

        self.client.login(username='test2', password='test')
        result = self.client.post(vote_url, {'vote': 4})
        self.assertEqual(result.status_code, 200)

        result_json = simplejson.loads(result.content)
        self.assertTrue('voteData' in result_json)
        self.assertTrue('popularity' in result_json['voteData'])
        self.assertEqual(result_json['voteData']['popularity'], '3.5')
        self.assertTrue('user_vote' in result_json['voteData'])
        self.assertEqual(result_json['voteData']['user_vote'], 4)


class PublishTestCase(TransactionTestCase):

    tags = ('fiware-ut-4',)

    def setUp(self):
        super(PublishTestCase, self).setUp()
        self._original_function = http_utils.download_http_content
        http_utils.download_http_content = FakeDownloader()
        self.user = User.objects.create_user('test', 'test@example.com', 'test')

    def tearDown(self):
        super(PublishTestCase, self).tearDown()
        http_utils.download_http_content = self._original_function

    def read_template(self, *filename):
        f = codecs.open(os.path.join(os.path.dirname(__file__), *filename), 'rb')
        contents = f.read()
        f.close()

        return contents

    def test_publish_empty_mashup_xml(self):
        template_uri = "http://example.com/path/mashup.xml"
        template = self.read_template('test-data', 'mt1.xml')

        mashup = add_resource_from_template(template_uri, template, self.user)
        self.assertEquals(mashup.vendor, 'Wirecloud Test Suite')
        self.assertEquals(mashup.short_name, 'Test Mashup')
        self.assertEquals(mashup.version, '1')
        self.assertEquals(mashup.description, 'This template defines an empty mashup')
        self.assertEquals(mashup.author, 'test')

    def test_publish_empty_mashup_rdf(self):
        template_uri = "http://example.com/path/mashup.rdf"
        template = self.read_template('test-data', 'mt1.rdf')

        mashup = add_resource_from_template(template_uri, template, self.user)
        self.assertEquals(mashup.vendor, 'Wirecloud Test Suite')
        self.assertEquals(mashup.short_name, 'Test Mashup')
        self.assertEquals(mashup.version, '1')
        self.assertEquals(mashup.description, 'This template defines an empty mashup')
        self.assertEquals(mashup.author, 'test')

    def test_publish_invalid_mashup(self):
        template_uri = "http://example.com/path/mashup.rdf"
        template = self.read_template('test-data', 'invalid-mt1.rdf')

        self.assertRaises(TemplateParseException, add_resource_from_template, template_uri, template, self.user)


class WGTDeploymentTestCase(TransactionTestCase):

    def setUp(self):
        super(WGTDeploymentTestCase, self).setUp()

        self.old_CATALOGUE_MEDIA_ROOT = settings.CATALOGUE_MEDIA_ROOT
        settings.CATALOGUE_MEDIA_ROOT = mkdtemp()
        self.old_deployer = catalogue.utils.wgt_deployer
        catalogue.utils.wgt_deployer = WgtDeployer(settings.CATALOGUE_MEDIA_ROOT)
        self.resource_collection_url = reverse('wirecloud_catalogue.resource_collection')

    def tearDown(self):
        rmtree(settings.CATALOGUE_MEDIA_ROOT, ignore_errors=True)
        settings.CATALOGUE_MEDIA_ROOT = self.old_CATALOGUE_MEDIA_ROOT
        catalogue.utils.wgt_deployer = self.old_deployer

        super(WGTDeploymentTestCase, self).tearDown()

    def test_wgt_uploading_requires_login(self):
        c = Client()

        f = open(os.path.join(os.path.dirname(__file__), 'test-data/basic_widget.wgt'))
        response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')
        f.close()

        self.assertFalse(response.status_code > 200 and response.status_code < 300)

    def test_upload_of_basic_wgt(self):
        User.objects.create_user('test', 'test@example.com', 'test')
        widget_path = catalogue.utils.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')
        c = Client()

        f = open(os.path.join(os.path.dirname(__file__), 'test-data/basic_widget.wgt'))
        c.login(username='test', password='test')
        response = c.post(self.resource_collection_url, {'file': f}, HTTP_HOST='www.example.com')
        f.close()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(os.path.isdir(widget_path), True)
        widget = CatalogueResource.objects.get(vendor='Morfeo', short_name='Test', version='0.1')
        self.assertEqual(widget.template_uri, 'Morfeo_Test_0.1.wgt')
        self.assertEqual(widget.image_uri, 'images/catalogue.png')

        resource_entry_url = reverse('wirecloud_catalogue.resource_entry', kwargs={
            'vendor': 'Morfeo',
            'name': 'Test',
            'version': '0.1',
        })
        c.login(username='test', password='test')
        response = c.delete(resource_entry_url, HTTP_HOST='www.example.com')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(os.path.exists(widget_path), False)
