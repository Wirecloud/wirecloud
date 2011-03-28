# -*- coding: utf-8 -*-

import os
from shutil import rmtree
from tempfile import mkdtemp

from django.conf import settings
from django.contrib.auth.models import User
from django.test import TestCase, Client

from catalogue.utils import add_resource_from_template_uri
from catalogue.get_json_catalogue_data import get_gadgetresource_data
from catalogue.models import GadgetWiring
from commons.test import LocalizedTestCase


class AddGadgetTestCase(TestCase):

    def setUp(self):
        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.template_uri = 'file://' + os.path.join(os.path.dirname(__file__), 'template1.xml')

    def test_add_resource_from_template_uri(self):
        _junk, gadget = add_resource_from_template_uri(self.template_uri, self.user)

        events = GadgetWiring.objects.filter(idResource=gadget, wiring='out')
        self.assertTrue(events.count() == 1 and events[0].friendcode == 'test_friend_code')

        slots = GadgetWiring.objects.filter(idResource=gadget, wiring='in')
        self.assertTrue(slots.count() == 1 and slots[0].friendcode == 'test_friend_code')


class TranslationTestCase(LocalizedTestCase):

    def setUp(self):
        super(TranslationTestCase, self).setUp()

        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.template_uri = 'file://' + os.path.join(os.path.dirname(__file__), 'template1.xml')

    def testTranslations(self):
        _junk, gadget = add_resource_from_template_uri(self.template_uri, self.user)
        self.changeLanguage('en')
        data = get_gadgetresource_data(gadget, self.user)

        self.assertEqual(data['displayName'], 'Test Gadget')
        self.assertEqual(data['description'], 'Test Gadget description')

        self.changeLanguage('es')
        data = get_gadgetresource_data(gadget, self.user)

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
