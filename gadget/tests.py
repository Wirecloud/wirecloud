# -*- coding: utf-8 -*-

import os.path
from shutil import rmtree
from tempfile import mkdtemp
from urllib2 import URLError, HTTPError

from django.conf import settings
from django.test import TestCase

from commons import http_utils
from commons.exceptions import TemplateParseException
from commons.get_data import get_gadget_data
from commons.test import LocalizedTestCase
from gadget.gadgetCodeParser import parse_gadget_code
from gadget.models import Gadget


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


class GCPRemoteCodeTests(TestCase):
    """Gadget Code Parser tests that load the code from a remote url"""

    def setUp(self):
        super(GCPRemoteCodeTests, self).setUp()
        self._original_function = http_utils.download_http_content
        http_utils.download_http_content = FakeDownloader()

    def tearDown(self):
        super(GCPRemoteCodeTests, self).tearDown()
        http_utils.download_http_content = self._original_function

    def test_parse_gadget_code(self):
        http_utils.download_http_content.set_response("http://example.com/code", "gadget code")

        xhtml = parse_gadget_code('http://example.com/',
                                  'http://example.com/code',
                                  'http://example.com/gadget',
                                  'text/html', False)
        self.assertEquals(xhtml.uri, 'http://example.com/gadget/xhtml')
        self.assertEquals(xhtml.code, 'gadget code')
        self.assertEquals(xhtml.url, 'http://example.com/code')
        self.assertEquals(xhtml.content_type, 'text/html')

        # simulate an HTTP Error
        http_utils.download_http_content.reset()
        http_utils.download_http_content.set_http_error("http://example.com/code")
        self.assertRaises(TemplateParseException, parse_gadget_code,
                          'http://example.com',
                          'http://example.com/code',
                          'http://example.com/gadget',
                          'text/html', False)

        # simulate an URL Error
        http_utils.download_http_content.reset()
        http_utils.download_http_content.set_url_error("http://example.com/code")
        self.assertRaises(TemplateParseException, parse_gadget_code,
                          'http://example.com',
                          'http://example.com/code',
                          'http://example.com/gadget',
                          'text/html', False)

    def test_invalid_scheme(self):
        self.assertRaises(TemplateParseException, parse_gadget_code,
                          'http://example.com',
                          'file:///tmp/code',
                          'http://example.com/gadget',
                          'text/html', False)


class GCPLocalCodeTests(TestCase):
    """Gadget Code Parser tests that load the code from a local WGT resource"""

    def setUp(self):
        super(GCPLocalCodeTests, self).setUp()

        self.old_GADGETS_DEPLOYMENT_DIR = settings.GADGETS_DEPLOYMENT_DIR
        self.old_GADGETS_DEPLOYMENT_TMPDIR = settings.GADGETS_DEPLOYMENT_TMPDIR
        settings.GADGETS_DEPLOYMENT_DIR = mkdtemp()
        settings.GADGETS_DEPLOYMENT_TMPDIR = mkdtemp()

    def tearDown(self):
        super(GCPLocalCodeTests, self).tearDown()

        rmtree(settings.GADGETS_DEPLOYMENT_DIR, ignore_errors=True)
        rmtree(settings.GADGETS_DEPLOYMENT_TMPDIR)
        settings.GADGETS_DEPLOYMENT_DIR = self.old_GADGETS_DEPLOYMENT_DIR
        settings.GADGETS_DEPLOYMENT_TMPDIR = self.old_GADGETS_DEPLOYMENT_TMPDIR

    def _create_gadget_code(self, filename, code):
        path = os.path.join(settings.GADGETS_DEPLOYMENT_DIR, os.path.dirname(filename))
        if not os.path.isdir(path):
            os.makedirs(path)

        fd = open(os.path.join(settings.GADGETS_DEPLOYMENT_DIR, filename), 'w')
        fd.write(code)
        fd.close()

    def test_parse_gadget_code_from_wgt(self):
        self._create_gadget_code('test/Morfeo/Test_Gadget1/0.1/gcp_test.html', 'gadget code')
        xhtml = parse_gadget_code('http://example.com',
                                  'deployment/gadgets/test/Morfeo/Test_Gadget1/0.1/gcp_test.html',
                                  'http://example.com/gadget1',
                                  'text/html', True)
        self.assertEquals(xhtml.uri, 'http://example.com/gadget1/xhtml')
        self.assertEquals(xhtml.code, 'gadget code')
        self.assertEquals(xhtml.url, 'deployment/gadgets/test/Morfeo/Test_Gadget1/0.1/gcp_test.html')
        self.assertEquals(xhtml.content_type, 'text/html')

        # now with an absolute path
        self._create_gadget_code('test/Morfeo/Test_Gadget2/0.1/gcp_test.html', 'gadget code')
        xhtml = parse_gadget_code('http://example.com',
                                  '/deployment/gadgets/test/Morfeo/Test_Gadget2/0.1/gcp_test.html',  # absolute path
                                  'http://example.com/gadget2',
                                  'text/html', True)
        self.assertEquals(xhtml.uri, 'http://example.com/gadget2/xhtml')
        self.assertEquals(xhtml.code, 'gadget code')
        self.assertEquals(xhtml.url, '/deployment/gadgets/test/Morfeo/Test_Gadget2/0.1/gcp_test.html')
        self.assertEquals(xhtml.content_type, 'text/html')

        # now with a non existing file
        self.assertRaises(TemplateParseException, parse_gadget_code,
                          'http://example.com',
                          '/deployment/gadgets/non_existing_file.html',
                          'http://example.com/gadget2',
                          'text/html', True)


class ShowcaseTestCase(LocalizedTestCase):

    fixtures = ['test_data']

    def setUp(self):
        super(ShowcaseTestCase, self).setUp()

    def testTranslations(self):
        gadget = Gadget.objects.get(pk=1)

        self.changeLanguage('en')
        data = get_gadget_data(gadget)
        self.assertEqual(data['displayName'], 'Test Gadget')

        self.changeLanguage('es')
        data = get_gadget_data(gadget)
        self.assertEqual(data['displayName'], 'Gadget de prueba')
