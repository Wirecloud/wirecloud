# -*- coding: utf-8 -*-

import os
from shutil import rmtree
from tempfile import mkdtemp

from django.conf import settings
from django.contrib.auth.models import User
from django.test import TransactionTestCase, TestCase, Client
from django.utils import simplejson

import catalogue.utils
from catalogue.utils import add_resource_from_template
from catalogue.get_json_catalogue_data import get_resource_data
from catalogue.models import GadgetWiring
from commons.test import LocalizedTestCase
from commons.wgt import WgtDeployer


# Avoid nose to repeat these tests (they are run through __init__.py)
__test__ = False


class AddGadgetTestCase(LocalizedTestCase):

    def setUp(self):
        super(AddGadgetTestCase, self).setUp()

        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.template_uri = "http://example.com/path/gadget.xml"
        f = open(os.path.join(os.path.dirname(__file__), 'template1.xml'), 'rb')
        self.template = f.read()
        f.close()

    def test_add_resource_from_template(self):

        gadget = add_resource_from_template(self.template_uri, self.template, self.user)

        events = GadgetWiring.objects.filter(idResource=gadget, wiring='out')
        self.assertTrue(events.count() == 1 and events[0].friendcode == 'test_friend_code')

        slots = GadgetWiring.objects.filter(idResource=gadget, wiring='in')
        self.assertTrue(slots.count() == 1 and slots[0].friendcode == 'test_friend_code')

    def test_add_resource_from_template_translations(self):

        gadget = add_resource_from_template(self.template_uri, self.template, self.user)
        self.changeLanguage('en')
        data = get_resource_data(gadget, self.user)

        self.assertEqual(data['displayName'], 'Test Gadget')
        self.assertEqual(data['description'], 'Test Gadget description')

        self.changeLanguage('es')
        data = get_resource_data(gadget, self.user)

        self.assertEqual(data['displayName'], u'Gadget de pruebas')
        self.assertEqual(data['description'], u'Descripción del Gadget de pruebas')



class CatalogueAPITestCase(TestCase):

    fixtures = ['catalogue_test_data']
    urls = 'catalogue.urls'

    def setUp(self):

        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.client = Client()

    def test_basic_listing(self):

        self.client.login(username='test', password='test')

        # List gadgets in alphabetical order (short_name)
        result = self.client.get('////resource/1/10?orderby=short_name&search_boolean=AND&scope=gadget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 5)
        self.assertTrue(len(result_json['resources'][0]) > 0)
        self.assertEqual(result_json['resources'][0]['name'], 'agadget')

        # List gadgets in reverse alphabetical order (short_name)
        result = self.client.get('////resource/1/10?orderby=-short_name&search_boolean=AND&scope=gadget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 5)
        self.assertTrue(len(result_json['resources'][0]) > 0)
        self.assertEqual(result_json['resources'][0]['name'], 'zgadget')

    def test_simple_search(self):

        self.client.login(username='test', password='test')

        # Search gadgets using "gadget1" as keyword
        result = self.client.get('////search/simple_or/1/10?orderby=-popularity&search_criteria=gadget1&search_boolean=AND&scope=gadget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)

        # Search gadgets providing "friendcode2" events
        result = self.client.get('////search/event/1/10?orderby=-popularity&search_criteria=friendcode2&search_boolean=AND&scope=gadget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(len(result_json['resources'][0]['versions']), 1)
        gadget_data = result_json['resources'][0]
        self.assertEqual(gadget_data['name'], 'gadget1')
        self.assertEqual(gadget_data['versions'][0]['version'], '1.10')

        # Search gadgets consuming "friendcode2" events
        result = self.client.get('////search/slot/1/10?orderby=short_name&search_criteria=friendcode2&search_boolean=AND&scope=gadget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(len(result_json['resources'][0]['versions']), 2)
        gadget_data = result_json['resources'][0]
        self.assertEqual(gadget_data['name'], 'gadget1')

    def test_global_search(self):

        self.client.login(username='test', password='test')

        # Search gadgets using "gadget1" as keyword
        result = self.client.get('////globalsearch/1/10?orderby=-popularity&search_criteria=gadget1&search_criteria=&search_criteria=&search_criteria=&search_criteria=&search_criteria=&search_boolean=AND&scope=gadget')
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)

        # Search by keyworkd "gadget1" and by event "friendcode2"
        result = self.client.get('////globalsearch/1/10?orderby=-popularity&search_criteria=gadget1&search_criteria=&search_criteria=&search_criteria=&search_criteria=friendcode2&search_criteria=&search_boolean=AND&scope=gadget')
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(len(result_json['resources'][0]['versions']), 1)
        gadget_data = result_json['resources'][0]
        self.assertEqual(gadget_data['name'], 'gadget1')
        self.assertEqual(gadget_data['versions'][0]['version'], '1.10')

        # Search by keyworkd "gadget2" and by event "friendcode2"
        result = self.client.get('////globalsearch/1/10?orderby=-popularity&search_criteria=gadget2&search_criteria=&search_criteria=&search_criteria=&search_criteria=friendcode2&search_criteria=&search_boolean=AND&scope=gadget')
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 0)

        # Search by keyworkd "gadget1" or by event "friendcode2"
        result = self.client.get('////globalsearch/1/10?orderby=-popularity&search_criteria=gadget1&search_criteria=&search_criteria=&search_criteria=&search_criteria=friendcode2&search_criteria=&search_boolean=OR&scope=gadget')
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(len(result_json['resources'][0]['versions']), 2)

    def test_last_version_query(self):

        self.client.login(username='test', password='test')
        resources = simplejson.dumps([
            {'name': 'gadget1', 'vendor': 'Test'},
            {'name': 'inexistantgadget', 'vendor': 'Test'},
        ])
        result = self.client.post('////versions', {'resources': resources})
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertTrue('resources' in result_json)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(result_json['resources'][0]['lastVersion'], '1.10')

    def test_vote_queries(self):

        User.objects.create_user('test2', 'test@example.com', 'test')

        self.client.login(username='test', password='test')
        result = self.client.post('////voting/Test/gadget1/1.2', {'vote': 3})
        self.assertEqual(result.status_code, 200)

        self.client.login(username='test2', password='test')
        result = self.client.post('////voting/Test/gadget1/1.2', {'vote': 4})
        self.assertEqual(result.status_code, 200)

        result_json = simplejson.loads(result.content)
        self.assertTrue('voteData' in result_json)
        self.assertTrue('popularity' in result_json['voteData'])
        self.assertEqual(result_json['voteData']['popularity'], '3.5')
        self.assertTrue('user_vote' in result_json['voteData'])
        self.assertEqual(result_json['voteData']['user_vote'], 4)



class WGTDeploymentTestCase(TransactionTestCase):

    urls = 'catalogue.urls'

    def setUp(self):
        super(WGTDeploymentTestCase, self).setUp()

        self.old_CATALOGUE_MEDIA_ROOT = settings.CATALOGUE_MEDIA_ROOT
        settings.CATALOGUE_MEDIA_ROOT = mkdtemp()
        self.old_deployer = catalogue.utils.wgt_deployer
        catalogue.utils.wgt_deployer = WgtDeployer(settings.CATALOGUE_MEDIA_ROOT)

    def tearDown(self):
        rmtree(settings.CATALOGUE_MEDIA_ROOT, ignore_errors=True)
        settings.CATALOGUE_MEDIA_ROOT = self.old_CATALOGUE_MEDIA_ROOT
        catalogue.utils.wgt_deployer = self.old_deployer

    def testBasicWGTDeploymentFailsWithoutLogin(self):
        c = Client()

        f = open(os.path.join(os.path.dirname(__file__), 'basic_gadget.wgt'))
        response = c.post('////resource', {'file': f}, HTTP_HOST='www.example.com')
        f.close()

        self.assertFalse(response.status_code > 200 and response.status_code < 300)

    def testBasicWGTDeployment(self):
        User.objects.create_user('test', 'test@example.com', 'test')
        gadget_path = catalogue.utils.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')
        c = Client()

        f = open(os.path.join(os.path.dirname(__file__), 'basic_gadget.wgt'))
        c.login(username='test', password='test')
        response = c.post('////resource', {'file': f}, HTTP_HOST='www.example.com')
        f.close()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(os.path.isdir(gadget_path), True)

        c.login(username='test', password='test')
        response = c.delete('////resource/Morfeo/Test/0.1', HTTP_HOST='www.example.com')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(os.path.exists(gadget_path), False)
