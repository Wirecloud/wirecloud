# -*- coding: utf-8 -*-

import os.path
from shutil import rmtree
from tempfile import mkdtemp
from urllib2 import URLError, HTTPError

from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase

from commons import http_utils
from commons.exceptions import TemplateParseException
from commons.get_data import get_gadget_data
from commons.test import LocalizedTestCase
from gadget.models import Gadget
from gadget.utils import create_gadget_from_template, get_or_add_gadget_from_catalogue


BASIC_HTML_GADGET_CODE = "<html><body><p>gadget code</p></body></html>"


class FakeDownloader(object):

    def __init__(self):
        self.reset()

    def reset(self):
        self._responses = {}
        self._exceptions = {}

    def set_response(self, url, response):
        self._responses[url] = response

    def set_exception(self, url, exception):
        self._exceptions[url] = exception

    def set_http_error(self, url):
        self.set_exception(url, HTTPError('url', '404', 'Not Found', None, None))

    def set_url_error(self, url):
        self.set_exception(url, URLError('not valid'))

    def __call__(self, *args, **kwargs):
        url = args[0]

        if url in self._exceptions:
            raise self._exceptions[url]

        if url in self._responses:
            return self._responses[url]
        else:
            raise HTTPError('url', '404', 'Not Found', None, None)


class ShowcaseTestCase(LocalizedTestCase):

    fixtures = ['catalogue_test_data', 'test_data']

    def setUp(self):
        super(ShowcaseTestCase, self).setUp()
        self._original_function = http_utils.download_http_content
        http_utils.download_http_content = FakeDownloader()
        self.user = User.objects.get(username='test')
        cache.clear()

    def tearDown(self):
        super(ShowcaseTestCase, self).tearDown()
        http_utils.download_http_content = self._original_function

    def test_basic_gadget_creation(self):
        template_uri = "http://example.com/path/gadget.xml"
        f = open(os.path.join(os.path.dirname(__file__), 'tests', 'template1.xml'))
        template = f.read()
        f.close()

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        gadget = create_gadget_from_template(template_uri, self.user)

        self.changeLanguage('en')
        data = get_gadget_data(gadget)
        self.assertEqual(data['name'], 'test')
        self.assertEqual(data['version'], '0.1')

        self.assertEqual(data['variables']['prop']['label'], 'Property label')
        self.assertEqual(data['variables']['pref']['label'], 'Preference label')
        self.assertEqual(data['variables']['pref']['value_options'], [['1', 'Option name']])
        self.assertEqual(data['variables']['event']['label'], 'Event label')
        self.assertEqual(data['variables']['slot']['label'], 'Slot label')

        self.assertEqual(data['variables']['language']['aspect'], 'ECTX')
        self.assertEqual(data['variables']['language']['concept'], 'language')
        self.assertEqual(data['variables']['user']['aspect'], 'ECTX')
        self.assertEqual(data['variables']['user']['concept'], 'username')
        self.assertEqual(data['variables']['width']['aspect'], 'GCTX')
        self.assertEqual(data['variables']['width']['concept'], 'widthInPixels')
        self.assertEqual(data['variables']['lockStatus']['aspect'], 'GCTX')
        self.assertEqual(data['variables']['lockStatus']['concept'], 'lockStatus')

    def test_gadget_creation_from_catalogue(self):
        template_uri = "http://example.com/path/gadget.xml"
        f = open(os.path.join(os.path.dirname(__file__), 'tests', 'template1.xml'))
        template = f.read()
        f.close()

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        gadget = get_or_add_gadget_from_catalogue('Morfeo', 'test', '0.1', self.user)

        self.changeLanguage('en')
        data = get_gadget_data(gadget)
        self.assertEqual(data['name'], 'test')
        self.assertEqual(data['version'], '0.1')

        self.assertEqual(data['variables']['prop']['label'], 'Property label')
        self.assertEqual(data['variables']['pref']['label'], 'Preference label')
        self.assertEqual(data['variables']['pref']['value_options'], [['1', 'Option name']])
        self.assertEqual(data['variables']['event']['label'], 'Event label')
        self.assertEqual(data['variables']['slot']['label'], 'Slot label')

        gadget2 = get_or_add_gadget_from_catalogue('Morfeo', 'test', '0.1', self.user)
        self.assertEqual(gadget, gadget2)

    def test_gadget_template_with_missing_translation_indexes(self):
        template_uri = "http://example.com/path/gadget.xml"
        f = open(os.path.join(os.path.dirname(__file__), 'tests', 'template3.xml'))
        template = f.read()
        f.close()

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        self.assertRaises(TemplateParseException, get_or_add_gadget_from_catalogue, 'Morfeo', 'test', '0.1', self.user)

    def test_gadget_template_with_notused_translation_indexes(self):
        template_uri = "http://example.com/path/gadget.xml"
        f = open(os.path.join(os.path.dirname(__file__), 'tests', 'template4.xml'))
        template = f.read()
        f.close()

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        self.assertRaises(TemplateParseException, get_or_add_gadget_from_catalogue, 'Morfeo', 'test', '0.1', self.user)

    def testTranslations(self):
        gadget = Gadget.objects.get(pk=1)

        self.changeLanguage('en')
        data = get_gadget_data(gadget)
        self.assertEqual(data['displayName'], 'Test Gadget')
        self.assertEqual(data['variables']['password']['label'], 'Password Pref')
        self.assertEqual(data['variables']['slot']['action_label'], 'Slot Action Label')

        self.changeLanguage('es')
        data = get_gadget_data(gadget)
        self.assertEqual(data['displayName'], 'Gadget de prueba')
        self.assertEqual(data['variables']['password']['label'], u'Contraseña')
        self.assertEqual(data['variables']['slot']['action_label'], u'Etiqueta de acción del slot')

    def test_repeated_translation_indexes(self):
        template_uri = "http://example.com/path/gadget.xml"
        f = open(os.path.join(os.path.dirname(__file__), 'tests', 'template2.xml'))
        template = f.read()
        f.close()

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        gadget = create_gadget_from_template(template_uri, self.user)

        self.changeLanguage('en')
        data = get_gadget_data(gadget)
        self.assertEqual(data['displayName'], 'Test Gadget')
        self.assertEqual(data['version'], '0.2')

        self.assertEqual(data['variables']['prop']['label'], 'Label')
        self.assertEqual(data['variables']['pref']['label'], 'Label')
        self.assertEqual(data['variables']['event']['label'], 'Label')
        self.assertEqual(data['variables']['slot']['label'], 'Label')
