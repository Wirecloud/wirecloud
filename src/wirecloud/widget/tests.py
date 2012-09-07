# -*- coding: utf-8 -*-

import os.path
from shutil import rmtree
from tempfile import mkdtemp

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TransactionTestCase

from commons import http_utils
from commons.exceptions import TemplateParseException
from commons.get_data import get_widget_data
from wirecloudcommons.utils.template import TemplateParser
from wirecloud.models import Widget
import wirecloud.widget.utils
from wirecloud.widget.utils import create_widget_from_template, create_widget_from_wgt, get_or_add_widget_from_catalogue
from wirecloud.widget.views import deleteWidget
from wirecloud.workspace.utils import create_published_workspace_from_template
from wirecloudcommons.test import FakeDownloader, LocalizedTestCase
from wirecloudcommons.utils.wgt import WgtDeployer, WgtFile


# Avoid nose to repeat these tests (they are run through wirecloud/tests/__init__.py)
__test__ = False

BASIC_HTML_GADGET_CODE = "<html><body><p>widget code</p></body></html>"


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
        self.assertEqual(len(data['js_files']), 5)

        self.assertEqual(data['js_files'][0], '/examplecode1.js')
        self.assertEqual(data['js_files'][1], '/examplecode2.js')
        self.assertEqual(data['js_files'][2], '/examplecode3.js')
        self.assertEqual(data['js_files'][3], '/examplecode4.js')
        self.assertEqual(data['js_files'][4], '/examplecode5.js')

    def test_widget_deletion(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template1.xml')

        http_utils.download_http_content.set_response(template_uri, template)
        http_utils.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        create_widget_from_template(template_uri, self.user)

        deleteWidget(self.user, 'test', 'Morfeo', '0.1')
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, vendor='Morfeo', name='test', version='0.1')

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
        widget = get_or_add_widget_from_catalogue('Morfeo', 'test', '0.1', self.user)

        self.changeLanguage('en')
        data = get_widget_data(widget)
        self.assertEqual(data['name'], 'test')
        self.assertEqual(data['version'], '0.1')

        self.assertEqual(data['variables']['prop']['label'], 'Property label')
        self.assertEqual(data['variables']['pref']['label'], 'Preference label')
        self.assertEqual(data['variables']['pref']['value_options'], [['1', 'Option name']])
        self.assertEqual(data['variables']['event']['label'], 'Event label')
        self.assertEqual(data['variables']['slot']['label'], 'Slot label')

        widget2 = get_or_add_widget_from_catalogue('Morfeo', 'test', '0.1', self.user)
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

        self.old_deployer = wirecloud.widget.utils.wgt_deployer
        self.tmp_dir = mkdtemp()
        wirecloud.widget.utils.wgt_deployer = WgtDeployer(self.tmp_dir)
        self.user = User.objects.create_user('test', 'test@example.com', 'test')

    def tearDown(self):
        rmtree(self.tmp_dir, ignore_errors=True)
        wirecloud.widget.utils.wgt_deployer = self.old_deployer

        super(WGTShowcaseTestCase, self).tearDown()

    def test_basic_wgt_deployment(self):
        wgt_file = WgtFile(os.path.join(os.path.dirname(__file__), 'test-data', 'basic_widget.wgt'))
        widget_path = wirecloud.widget.utils.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')

        create_widget_from_wgt(wgt_file, self.user)
        Widget.objects.get(vendor='Morfeo', name='Test', version='0.1')
        self.assertEqual(os.path.isdir(widget_path), True)

        deleteWidget(self.user, 'Test', 'Morfeo', '0.1')
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, vendor='Morfeo', name='Test', version='0.1')
        self.assertEqual(os.path.exists(widget_path), False)
