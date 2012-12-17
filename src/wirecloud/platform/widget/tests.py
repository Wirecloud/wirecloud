# -*- coding: utf-8 -*-

import codecs
import os.path
from shutil import rmtree
from tempfile import mkdtemp

from django.conf import settings
from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.test import TransactionTestCase, Client
from django.utils.unittest import TestCase

from commons import http_utils
from wirecloud.commons.test import FakeDownloader, LocalizedTestCase
from wirecloud.commons.utils.template import TemplateParser, TemplateParseException
from wirecloud.commons.utils.wgt import WgtDeployer, WgtFile
from wirecloud.platform import plugins
from wirecloud.platform.get_data import get_widget_data
import wirecloud.platform.widget.utils
from wirecloud.platform.models import Widget
from wirecloud.platform.widget.utils import create_widget_from_template, create_widget_from_wgt, fix_widget_code, get_or_add_widget_from_catalogue
from wirecloud.platform.widget.views import deleteWidget
from wirecloud.platform.workspace.utils import create_published_workspace_from_template


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False

BASIC_HTML_GADGET_CODE = "<html><body><p>widget code</p></body></html>"


class CodeTransformationTestCase(TestCase):

    @classmethod
    def setUpClass(cls):
        if hasattr(settings, 'FORCE_DOMAIN'):
            cls.old_FORCE_DOMAIN = settings.FORCE_DOMAIN
        if hasattr(settings, 'FORCE_PROTO'):
            cls.old_FORCE_PROTO = settings.FORCE_PROTO

        settings.FORCE_DOMAIN = 'example.com'
        settings.FORCE_PROTO = 'http'
        cls.OLD_WIRECLOUD_PLUGINS = getattr(settings, 'WIRECLOUD_PLUGINS', ())

        settings.WIRECLOUD_PLUGINS = ()
        plugins.clear_cache()

        super(CodeTransformationTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, 'old_FORCE_DOMAIN'):
            settings.FORCE_DOMAIN = cls.old_FORCE_DOMAIN
        else:
            del settings.FORCE_DOMAIN

        if hasattr(cls, 'old_FORCE_PROTO'):
            settings.FORCE_PROTO = cls.old_FORCE_PROTO
        else:
            del settings.FORCE_PROTO

        settings.WIRECLOUD_PLUGINS = cls.OLD_WIRECLOUD_PLUGINS
        plugins.clear_cache()

        super(CodeTransformationTestCase, cls).tearDownClass()

    def read_file(self, *filename):
        f = codecs.open(os.path.join(os.path.dirname(__file__), *filename), 'rb')
        contents = f.read()
        f.close()

        return contents

    def test_basic_html(self):
        initial_code = self.read_file('test-data/xhtml1-initial.html')
        final_code = fix_widget_code(initial_code, 'http://server.com/widget', 'text/html', None) + '\n'
        expected_code = self.read_file('test-data/xhtml1-expected.html')
        self.assertEqual(final_code, expected_code)

    def test_basic_xhtml(self):
        initial_code = self.read_file('test-data/xhtml2-initial.html')
        final_code = fix_widget_code(initial_code, 'http://server.com/widget', 'application/xhtml+xml', None) + '\n'
        expected_code = self.read_file('test-data/xhtml2-expected.html')
        self.assertEqual(final_code, expected_code)

    def test_xhtml_without_head_element(self):
        initial_code = self.read_file('test-data/xhtml3-initial.html')
        final_code = fix_widget_code(initial_code, 'http://server.com/widget', 'application/xhtml+xml', None) + '\n'
        expected_code = self.read_file('test-data/xhtml3-expected.html')
        self.assertEqual(final_code, expected_code)


class ShowcaseTestCase(LocalizedTestCase):

    fixtures = ('catalogue_test_data', 'test_data')

    def setUp(self):
        super(ShowcaseTestCase, self).setUp()
        self._original_function = http_utils.download_http_content
        http_utils.download_http_content = FakeDownloader()
        self.user = User.objects.get(username='test')
        cache.clear()

    def tearDown(self):
        super(ShowcaseTestCase, self).tearDown()
        http_utils.download_http_content = self._original_function

    def read_template(self, *template):
        f = open(os.path.join(os.path.dirname(__file__), 'test-data', *template))
        contents = f.read()
        f.close()

        return contents

    def test_basic_widget_creation(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template1.xml')

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        widget = create_widget_from_template(template_uri, self.user)

        self.changeLanguage('en')
        data = get_widget_data(widget)
        self.assertEqual(data['uri'], 'Wirecloud/test/0.1')
        self.assertEqual(data['vendor'], 'Wirecloud')
        self.assertEqual(data['name'], 'test')
        self.assertEqual(data['version'], '0.1')

        self.assertEqual(data['variables']['prop']['label'], 'Property label')
        self.assertEqual(data['variables']['prop']['aspect'], 'PROP')
        self.assertEqual(data['variables']['pref']['label'], 'Preference label')
        self.assertEqual(data['variables']['pref']['value_options'], [['1', 'Option name']])
        self.assertEqual(data['variables']['pref']['aspect'], 'PREF')
        self.assertEqual(data['variables']['event']['label'], 'Event label')
        self.assertEqual(data['variables']['event']['aspect'], 'EVEN')
        self.assertEqual(data['variables']['slot']['label'], 'Slot label')
        self.assertEqual(data['variables']['slot']['aspect'], 'SLOT')

        self.assertEqual(data['variables']['language']['aspect'], 'ECTX')
        self.assertEqual(data['variables']['language']['concept'], 'language')
        self.assertEqual(data['variables']['user']['aspect'], 'ECTX')
        self.assertEqual(data['variables']['user']['concept'], 'username')
        self.assertEqual(data['variables']['width']['aspect'], 'GCTX')
        self.assertEqual(data['variables']['width']['concept'], 'widthInPixels')

    def test_basic_ezweb_widget_creation(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('old-template.xml')

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        widget = create_widget_from_template(template_uri, self.user)

        self.changeLanguage('en')
        data = get_widget_data(widget)
        self.assertEqual(data['uri'], 'Wirecloud/test/0.1')
        self.assertEqual(data['vendor'], 'Wirecloud')
        self.assertEqual(data['name'], 'test')
        self.assertEqual(data['version'], '0.1')

        self.assertEqual(data['variables']['prop']['label'], 'Property label')
        self.assertEqual(data['variables']['prop']['aspect'], 'PROP')
        self.assertEqual(data['variables']['pref']['label'], 'Preference label')
        self.assertEqual(data['variables']['pref']['value_options'], [['1', 'Option name']])
        self.assertEqual(data['variables']['pref']['aspect'], 'PREF')
        self.assertEqual(data['variables']['event']['label'], 'Event label')
        self.assertEqual(data['variables']['event']['aspect'], 'EVEN')
        self.assertEqual(data['variables']['slot']['label'], 'Slot label')
        self.assertEqual(data['variables']['slot']['aspect'], 'SLOT')

        self.assertEqual(data['variables']['language']['aspect'], 'ECTX')
        self.assertEqual(data['variables']['language']['concept'], 'language')
        self.assertEqual(data['variables']['user']['aspect'], 'ECTX')
        self.assertEqual(data['variables']['user']['concept'], 'username')
        self.assertEqual(data['variables']['width']['aspect'], 'GCTX')
        self.assertEqual(data['variables']['width']['concept'], 'widthInPixels')

    def test_basic_widget_creation_from_usdl(self):
        template_uri = "http://example.com/path/widget.rdf"
        template = self.read_template('template1.rdf')

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        widget = create_widget_from_template(template_uri, self.user)

        self.changeLanguage('en')
        data = get_widget_data(widget)
        self.assertEqual(data['name'], 'test')
        self.assertEqual(data['version'], '0.1')

        self.assertEqual(data['variables']['prop']['label'], u'Property Label')
        self.assertEqual(data['variables']['prop']['aspect'], 'PROP')
        self.assertEqual(data['variables']['pref']['label'], u'Preference Label')
        self.assertEqual(data['variables']['pref']['value_options'], [[u'1', u'Option Name']])
        self.assertEqual(data['variables']['pref']['aspect'], 'PREF')
        self.assertEqual(data['variables']['event']['label'], u'Event Label')
        self.assertEqual(data['variables']['event']['aspect'], 'EVEN')
        self.assertEqual(data['variables']['slot']['label'], u'Slot Label')
        self.assertEqual(data['variables']['slot']['aspect'], 'SLOT')

        self.assertEqual(data['variables']['language']['aspect'], 'ECTX')
        self.assertEqual(data['variables']['language']['concept'], 'language')
        self.assertEqual(data['variables']['user']['aspect'], 'ECTX')
        self.assertEqual(data['variables']['user']['concept'], 'username')
        self.assertEqual(data['variables']['width']['aspect'], 'GCTX')
        self.assertEqual(data['variables']['width']['concept'], 'widthInPixels')

    def test_basic_operator_creation_from_rdf(self):
        template = self.read_template('operatorTemplate1.rdf')
        parser = TemplateParser(template)
        data = parser.get_resource_info()

        self.assertEqual(data['name'], 'test operator')
        self.assertEqual(data['type'], 'operator')
        self.assertEqual(data['version'], '0.1')
        self.assertEqual(data['mail'], 'test@example.com')
        self.assertEqual(data['vendor'], 'Morfeo')
        self.assertEqual(data['wiring']['slots'][0]['label'], 'slot')
        self.assertEqual(data['wiring']['slots'][0]['type'], 'text')
        self.assertEqual(data['wiring']['slots'][0]['friendcode'], 'test_friend_code')
        self.assertEqual(data['wiring']['events'][0]['label'], 'event')
        self.assertEqual(data['wiring']['events'][0]['type'], 'text')
        self.assertEqual(data['wiring']['events'][0]['friendcode'], 'test_friend_code')
        self.assertEqual(data['preferences'][0]['label'], 'Preference label')
        self.assertEqual(data['preferences'][0]['description'], 'Preference description')
        self.assertEqual(data['preferences'][0]['default_value'], 'value')
        self.assertEqual(len(data['js_files']), 5)

        self.assertEqual(data['js_files'][0], '/examplecode1.js')
        self.assertEqual(data['js_files'][1], '/examplecode2.js')
        self.assertEqual(data['js_files'][2], '/examplecode3.js')
        self.assertEqual(data['js_files'][3], '/examplecode4.js')
        self.assertEqual(data['js_files'][4], '/examplecode5.js')

    def test_widget_deletion(self):
        deleteWidget(self.user, 'Test Widget', 'Test', '1.0.0')
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, vendor='Test', name='Test Widget', version='1.0.0')

    def test_widget_code_cache(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template1.xml')

        client = Client()
        client.login(username='test', password='test')
        widget_id = {
            'vendor': 'Wirecloud',
            'name': 'test',
            'version': '0.1',
        }

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        widget = create_widget_from_template(template_uri, self.user)
        widget.users.add(self.user)

        # Cache widget code
        response = client.get(reverse('wirecloud.widget_code_entry', kwargs=widget_id))
        self.assertEquals(response.status_code, 200)
        old_code = response.content

        deleteWidget(self.user, **widget_id)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, vendor='Morfeo', name='test', version='0.1')

        # Use a different xhtml code
        http_utils.download_http_content.set_response('http://example.com/path/test.html', 'cache')
        create_widget_from_template(template_uri, self.user)
        widget.users.add(self.user)

        response = client.get(reverse('wirecloud.widget_code_entry', kwargs=widget_id))
        self.assertEquals(response.status_code, 200)
        new_code = response.content

        self.assertNotEqual(old_code, new_code)

    def test_widget_deletion_usdl(self):
        template_uri = "http://example.com/path/widget.rdf"
        template = self.read_template('template1.rdf')

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        create_widget_from_template(template_uri, self.user)

        deleteWidget(self.user, 'test', 'Morfeo', '0.1')
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, vendor='Morfeo', name='test', version='0.1')

    def test_widget_creation_from_catalogue(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template1.xml')

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        widget = get_or_add_widget_from_catalogue('Wirecloud', 'test', '0.1', self.user)

        self.changeLanguage('en')
        data = get_widget_data(widget)
        self.assertEqual(data['uri'], 'Wirecloud/test/0.1')
        self.assertEqual(data['vendor'], 'Wirecloud')
        self.assertEqual(data['name'], 'test')
        self.assertEqual(data['version'], '0.1')

        self.assertEqual(data['variables']['prop']['label'], 'Property label')
        self.assertEqual(data['variables']['pref']['label'], 'Preference label')
        self.assertEqual(data['variables']['pref']['value_options'], [['1', 'Option name']])
        self.assertEqual(data['variables']['event']['label'], 'Event label')
        self.assertEqual(data['variables']['slot']['label'], 'Slot label')

        widget2 = get_or_add_widget_from_catalogue('Wirecloud', 'test', '0.1', self.user)
        self.assertEqual(widget, widget2)

    def test_widget_creation_from_catalogue_usdl(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template1.rdf')

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        widget = get_or_add_widget_from_catalogue('Morfeo', 'test', '0.1', self.user)

        self.changeLanguage('en')
        data = get_widget_data(widget)
        self.assertEqual(data['name'], 'test')
        self.assertEqual(data['version'], '0.1')

        self.assertEqual(data['variables']['prop']['label'], u'Property Label')
        self.assertEqual(data['variables']['pref']['label'], u'Preference Label')
        self.assertEqual(data['variables']['pref']['value_options'], [[u'1', u'Option Name']])
        self.assertEqual(data['variables']['event']['label'], u'Event Label')
        self.assertEqual(data['variables']['slot']['label'], u'Slot Label')

        widget2 = get_or_add_widget_from_catalogue('Morfeo', 'test', '0.1', self.user)
        self.assertEqual(widget, widget2)

    def test_widget_template_with_missing_translation_indexes(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template3.xml')

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        self.assertRaises(TemplateParseException, get_or_add_widget_from_catalogue, 'Morfeo', 'test', '0.1', self.user)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, vendor='Morfeo', name='test', version='0.1')

    def test_widget_template_with_notused_translation_indexes(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template4.xml')

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        self.assertRaises(TemplateParseException, get_or_add_widget_from_catalogue, 'Morfeo', 'test', '0.1', self.user)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, vendor='Morfeo', name='test', version='0.1')

    def testTranslations(self):
        widget = Widget.objects.get(pk=1)

        self.changeLanguage('en')
        data = get_widget_data(widget)
        self.assertEqual(data['displayName'], 'Test Widget')
        self.assertEqual(data['variables']['password']['label'], 'Password Pref')
        self.assertEqual(data['variables']['slot']['action_label'], 'Slot Action Label')

        self.changeLanguage('es')
        data = get_widget_data(widget)
        self.assertEqual(data['displayName'], 'Widget de prueba')
        self.assertEqual(data['variables']['password']['label'], u'Contraseña')
        self.assertEqual(data['variables']['slot']['action_label'], u'Etiqueta de acción del slot')

    def test_repeated_translation_indexes(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template2.xml')

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        widget = create_widget_from_template(template_uri, self.user)

        self.changeLanguage('en')
        data = get_widget_data(widget)
        self.assertEqual(data['displayName'], 'Test Widget')
        self.assertEqual(data['version'], '0.2')

        self.assertEqual(data['variables']['prop']['label'], 'Label')
        self.assertEqual(data['variables']['pref']['label'], 'Label')
        self.assertEqual(data['variables']['event']['label'], 'Label')
        self.assertEqual(data['variables']['slot']['label'], 'Label')

    def test_widgets_with_invalid_format(self):
        template_uri = "http://example.com/path/widget.xml"
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)

        template = self.read_template('template5.xml')
        http_utils.download_http_content.set_response(template_uri, template)
        self.assertRaises(TemplateParseException, create_widget_from_template, template_uri, self.user)

        template = self.read_template('template6.xml')
        http_utils.download_http_content.set_response(template_uri, template)
        self.assertRaises(TemplateParseException, create_widget_from_template, template_uri, self.user)

        template = self.read_template('template7.xml')
        http_utils.download_http_content.set_response(template_uri, template)
        self.assertRaises(TemplateParseException, create_widget_from_template, template_uri, self.user)

    def test_widget_with_unmet_requirements(self):

        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template8.xml')

        http_utils.download_http_content.set_response(template_uri, template)
        self.assertRaises(Exception, create_widget_from_template, template_uri, self.user)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, vendor='Example', name='Test', version='0.1')

    def test_widgets_with_invalid_format_usdl(self):
        template_uri = "http://example.com/path/widget.rdf"
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)

        template = self.read_template('template5.rdf')
        http_utils.download_http_content.set_response(template_uri, template)
        self.assertRaises(TemplateParseException, create_widget_from_template, template_uri, self.user)

        template = self.read_template('template6.rdf')
        http_utils.download_http_content.set_response(template_uri, template)
        self.assertRaises(TemplateParseException, create_widget_from_template, template_uri, self.user)

    def test_basic_mashup(self):
        template = self.read_template('..', '..', 'workspace', 'test-data', 'wt1.xml')
        workspace = create_published_workspace_from_template(template, self.user)

        self.assertEqual(workspace.vendor, 'Wirecloud Test Suite')
        self.assertEqual(workspace.name, 'Test Mashup')
        self.assertEqual(workspace.version, '1')
        self.assertEqual(workspace.creator, self.user)

    def test_basic_mashup_usdl(self):
        template = self.read_template('..', '..', 'workspace', 'test-data', 'wt1.rdf')
        workspace = create_published_workspace_from_template(template, self.user)

        self.assertEqual(workspace.vendor, 'Wirecloud Test Suite')
        self.assertEqual(workspace.name, 'Test Workspace')
        self.assertEqual(workspace.version, '1')
        self.assertEqual(workspace.creator, self.user)


class WGTShowcaseTestCase(TransactionTestCase):

    def setUp(self):
        super(WGTShowcaseTestCase, self).setUp()

        self.old_deployer = wirecloud.platform.widget.utils.wgt_deployer
        self.tmp_dir = mkdtemp()
        wirecloud.platform.widget.utils.wgt_deployer = WgtDeployer(self.tmp_dir)
        self.user = User.objects.create_user('test', 'test@example.com', 'test')

    def tearDown(self):
        rmtree(self.tmp_dir, ignore_errors=True)
        wirecloud.platform.widget.utils.wgt_deployer = self.old_deployer

        super(WGTShowcaseTestCase, self).tearDown()

    def test_basic_wgt_deployment(self):
        wgt_file = WgtFile(os.path.join(os.path.dirname(__file__), 'test-data', 'basic_widget.wgt'))
        widget_path = wirecloud.platform.widget.utils.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')

        create_widget_from_wgt(wgt_file, self.user)
        Widget.objects.get(vendor='Morfeo', name='Test', version='0.1')
        self.assertEqual(os.path.isdir(widget_path), True)

        deleteWidget(self.user, 'Test', 'Morfeo', '0.1')
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, vendor='Morfeo', name='Test', version='0.1')
        self.assertEqual(os.path.exists(widget_path), False)

    def test_invalid_wgt_deployment(self):
        wgt_file = WgtFile(os.path.join(os.path.dirname(__file__), 'test-data', 'invalid_widget.wgt'))
        wirecloud.platform.widget.utils.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')

        self.assertRaises(TemplateParseException, create_widget_from_wgt, wgt_file, self.user)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, vendor='Morfeo', name='Test', version='0.1.')
