# -*- coding: utf-8 -*-

import os
from shutil import rmtree
from tempfile import mkdtemp

from django.conf import settings
from django.contrib.auth.models import User
from django.test import TestCase, Client
from django.utils import simplejson

from catalogue.utils import add_resource_from_template_uri
from catalogue.get_json_catalogue_data import get_resource_data
from catalogue.models import GadgetWiring
from commons.test import LocalizedTestCase


# Avoid nose to repeat these tests (they are run through __init__.py)
__test__ = False


class AddGadgetTestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.template_uri = 'file://' + os.path.join(os.path.dirname(__file__), 'template1.xml')

    def test_add_resource_from_template_uri(self):
        gadget = add_resource_from_template_uri(self.template_uri, self.user)

        events = GadgetWiring.objects.filter(idResource=gadget, wiring='out')
        self.assertTrue(events.count() == 1 and events[0].friendcode == 'test_friend_code')

        slots = GadgetWiring.objects.filter(idResource=gadget, wiring='in')
        self.assertTrue(slots.count() == 1 and slots[0].friendcode == 'test_friend_code')


class CatalogueAPITestCase(TestCase):

    fixtures = ['catalogue_test_data']

    def setUp(self):

        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.client = Client()

    def test_basic_listing(self):

        self.client.login(username='test', password='test')

        # List gadgets in alphabetical order (short_name)
        result = self.client.get('/user/test/catalogue/resource/1/10?orderby=short_name&search_boolean=AND&scope=gadget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 4)
        self.assertTrue(len(result_json['resources'][0]) > 0)
        self.assertEqual(result_json['resources'][0]['name'], 'agadget')

        # List gadgets in reverse alphabetical order (short_name)
        result = self.client.get('/user/test/catalogue/resource/1/10?orderby=-short_name&search_boolean=AND&scope=gadget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 4)
        self.assertTrue(len(result_json['resources'][0]) > 0)
        self.assertEqual(result_json['resources'][0]['name'], 'zgadget')

    def test_simple_search(self):

        self.client.login(username='test', password='test')

        # Search gadgets using "gadget1" as keyword
        result = self.client.get('/user/test/catalogue/search/simple_or/1/10?orderby=-popularity&search_criteria=gadget1&search_boolean=AND&scope=gadget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)

        # Search gadgets providing "friendcode2" events
        result = self.client.get('/user/test/catalogue/search/event/1/10?orderby=-popularity&search_criteria=friendcode2&search_boolean=AND&scope=gadget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(len(result_json['resources'][0]['versions']), 1)
        gadget_data = result_json['resources'][0]
        self.assertEqual(gadget_data['name'], 'gadget1')
        self.assertEqual(gadget_data['versions'][0]['version'], '1.10')

        # Search gadgets consuming "friendcode2" events
        result = self.client.get('/user/test/catalogue/search/slot/1/10?orderby=short_name&search_criteria=friendcode2&search_boolean=AND&scope=gadget')

        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(len(result_json['resources'][0]['versions']), 2)
        gadget_data = result_json['resources'][0]
        self.assertEqual(gadget_data['name'], 'gadget1')

    def test_global_search(self):

        self.client.login(username='test', password='test')

        # Search gadgets using "gadget1" as keyword
        result = self.client.get('/user/test/catalogue/globalsearch/1/10?orderby=-popularity&search_criteria=gadget1&search_criteria=&search_criteria=&search_criteria=&search_criteria=&search_criteria=&search_boolean=AND&scope=gadget')
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)

        # Search by keyworkd "gadget1" and by event "friendcode2"
        result = self.client.get('/user/test/catalogue/globalsearch/1/10?orderby=-popularity&search_criteria=gadget1&search_criteria=&search_criteria=&search_criteria=&search_criteria=friendcode2&search_criteria=&search_boolean=AND&scope=gadget')
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(len(result_json['resources'][0]['versions']), 1)
        gadget_data = result_json['resources'][0]
        self.assertEqual(gadget_data['name'], 'gadget1')
        self.assertEqual(gadget_data['versions'][0]['version'], '1.10')

        # Search by keyworkd "gadget2" and by event "friendcode2"
        result = self.client.get('/user/test/catalogue/globalsearch/1/10?orderby=-popularity&search_criteria=gadget2&search_criteria=&search_criteria=&search_criteria=&search_criteria=friendcode2&search_criteria=&search_boolean=AND&scope=gadget')
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertEqual(len(result_json['resources']), 0)

        # Search by keyworkd "gadget1" or by event "friendcode2"
        result = self.client.get('/user/test/catalogue/globalsearch/1/10?orderby=-popularity&search_criteria=gadget1&search_criteria=&search_criteria=&search_criteria=&search_criteria=friendcode2&search_criteria=&search_boolean=OR&scope=gadget')
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
        result = self.client.post('/user/test/catalogue/versions', {'resources': resources})
        self.assertEqual(result.status_code, 200)
        result_json = simplejson.loads(result.content)
        self.assertTrue('resources' in result_json)
        self.assertEqual(len(result_json['resources']), 1)
        self.assertEqual(result_json['resources'][0]['lastVersion'], '1.10')

    def test_vote_queries(self):

        User.objects.create_user('test2', 'test@example.com', 'test')

        self.client.login(username='test', password='test')
        result = self.client.post('/user/test/catalogue/voting/Test/gadget1/1.2', {'vote': 3})
        self.assertEqual(result.status_code, 200)

        self.client.login(username='test2', password='test')
        result = self.client.post('/user/test2/catalogue/voting/Test/gadget1/1.2', {'vote': 4})
        self.assertEqual(result.status_code, 200)

        result_json = simplejson.loads(result.content)
        self.assertTrue('voteData' in result_json)
        self.assertTrue('popularity' in result_json['voteData'])
        self.assertEqual(result_json['voteData']['popularity'], '3.5')
        self.assertTrue('user_vote' in result_json['voteData'])
        self.assertEqual(result_json['voteData']['user_vote'], 4)


class TranslationTestCase(LocalizedTestCase):

    def setUp(self):
        super(TranslationTestCase, self).setUp()

        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.template_uri = 'file://' + os.path.join(os.path.dirname(__file__), 'template1.xml')

    def testTranslations(self):
        gadget = add_resource_from_template_uri(self.template_uri, self.user)
        self.changeLanguage('en')
        data = get_resource_data(gadget, self.user)

        self.assertEqual(data['displayName'], 'Test Gadget')
        self.assertEqual(data['description'], 'Test Gadget description')

        self.changeLanguage('es')
        data = get_resource_data(gadget, self.user)

        self.assertEqual(data['displayName'], u'Gadget de pruebas')
        self.assertEqual(data['description'], u'Descripción del Gadget de pruebas')


class WGTDeploymentTestCase(TestCase):

    urls = 'catalogue.tests.urls'

    def setUp(self):
        self.old_GADGETS_DEPLOYMENT_DIR = settings.GADGETS_DEPLOYMENT_DIR
        self.old_GADGETS_DEPLOYMENT_TMPDIR = settings.GADGETS_DEPLOYMENT_TMPDIR
        settings.GADGETS_DEPLOYMENT_DIR = mkdtemp()
        settings.GADGETS_DEPLOYMENT_TMPDIR = mkdtemp()
        self.user = User.objects.create_user('test', 'test@example.com', 'test')

    def tearDown(self):
        rmtree(settings.GADGETS_DEPLOYMENT_DIR, ignore_errors=True)
        rmtree(settings.GADGETS_DEPLOYMENT_TMPDIR)
        settings.GADGETS_DEPLOYMENT_DIR = self.old_GADGETS_DEPLOYMENT_DIR
        settings.GADGETS_DEPLOYMENT_TMPDIR = self.old_GADGETS_DEPLOYMENT_TMPDIR

    def testBasicWGTDeploymentFailsWithoutLogin(self):
        c = Client()

        f = open(os.path.join(os.path.dirname(__file__), 'basic_gadget.wgt'))
        response = c.post('/deployment/gadgets/', {'file': f}, HTTP_HOST='www.example.com')
        f.close()

        self.assertEqual(response.status_code, 403)

    def testBasicWGTDeployment(self):
        c = Client()

        f = open(os.path.join(os.path.dirname(__file__), 'basic_gadget.wgt'))
        c.login(username='test', password='test')
        response = c.post('/deployment/gadgets/', {'file': f}, HTTP_HOST='www.example.com')
        f.close()

        self.assertEqual(response.status_code, 200)
