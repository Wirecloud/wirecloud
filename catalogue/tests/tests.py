import os

from django.contrib.auth.models import User
from django.test import TestCase

from catalogue.templateParser import TemplateParser
from catalogue.get_json_catalogue_data import get_gadgetresource_data


class TranslationTestCase(TestCase):

    def setUp(self):

        self.user = User.objects.create_user('test', 'test@example.com', 'test')
        self.template_uri = 'file://' + os.path.join(os.path.dirname(__file__), 'template1.xml')

    def testTranslations(self):
        templateParser = TemplateParser(self.template_uri, self.user)
        templateParser.parse()
        gadget = templateParser.get_gadget()
        data = get_gadgetresource_data(gadget, self.user)

        self.assertEqual(data['displayName'], 'Test Gadget')
        self.assertEqual(data['description'], 'Test Gadget description')
