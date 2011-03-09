import os.path
from urllib2 import URLError, HTTPError

from django.conf import settings
from django.test import TestCase

from commons import http_utils
from commons.exceptions import TemplateParseException
from gadget.gadgetCodeParser import parse_gadget_code


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
        self._resources = []

    def tearDown(self):
        super(GCPLocalCodeTests, self).tearDown()
        for resource in self._resources:
            os.unlink(os.path.join(settings.BASEDIR, resource))

    def _create_gadget_code(self, filename, code):
        fd = open(os.path.join(settings.BASEDIR, filename), 'w')
        fd.write(code)
        fd.close()
        self._resources.append(filename)

    def test_parse_gadget_code_from_wgt(self):
        self._create_gadget_code('gcp_test1.html', 'gadget code')
        xhtml = parse_gadget_code('http://example.com',
                                  'gcp_test1.html',
                                  'http://example.com/gadget1',
                                  'text/html', True)
        self.assertEquals(xhtml.uri, 'http://example.com/gadget1/xhtml')
        self.assertEquals(xhtml.code, 'gadget code')
        self.assertEquals(xhtml.url, 'gcp_test1.html')
        self.assertEquals(xhtml.content_type, 'text/html')

        # now with an absolute path
        self._create_gadget_code('gcp_test2.html', 'gadget code')
        xhtml = parse_gadget_code('http://example.com',
                                  '/gcp_test2.html',  # absolute path
                                  'http://example.com/gadget2',
                                  'text/html', True)
        self.assertEquals(xhtml.uri, 'http://example.com/gadget2/xhtml')
        self.assertEquals(xhtml.code, 'gadget code')
        self.assertEquals(xhtml.url, '/gcp_test2.html')
        self.assertEquals(xhtml.content_type, 'text/html')

        # now with a non existing file
        self.assertRaises(TemplateParseException, parse_gadget_code,
                          'http://example.com',
                          'non_existing_file.html',
                          'http://example.com/gadget2',
                          'text/html', True)
