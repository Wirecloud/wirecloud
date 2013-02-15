# -*- coding: utf-8 -*-

# Copyright 2012-2013 Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.


import os.path
from shutil import rmtree
from tempfile import mkdtemp

from django.contrib.auth.models import User, Group
from django.core.cache import cache
from django.core.urlresolvers import reverse
from django.test import TransactionTestCase, Client

from wirecloud.catalogue.models import CatalogueResource
from wirecloud.catalogue.utils import delete_resource
from wirecloud.commons.test import FakeDownloader, LocalizedTestCase, WirecloudSeleniumTestCase
from wirecloud.commons.utils import downloader
from wirecloud.commons.utils.template import TemplateParser, TemplateParseException
from wirecloud.commons.utils.wgt import WgtDeployer, WgtFile
from wirecloud.platform.get_data import get_widget_data
from wirecloud.platform.localcatalogue.utils import install_resource
import wirecloud.platform.widget.utils
from wirecloud.platform.models import Widget, XHTML
from wirecloud.platform.workspace.utils import create_published_workspace_from_template


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


BASIC_HTML_GADGET_CODE = "<html><body><p>widget code</p></body></html>"


class LocalCatalogueTestCase(LocalizedTestCase):

    fixtures = ('test_data',)

    def setUp(self):
        super(LocalCatalogueTestCase, self).setUp()
        self._original_function = downloader.download_http_content
        downloader.download_http_content = FakeDownloader()
        self.user = User.objects.get(username='test')
        cache.clear()

    def tearDown(self):
        super(LocalCatalogueTestCase, self).tearDown()
        downloader.download_http_content = self._original_function

    def read_template(self, *template):
        f = open(os.path.join(os.path.dirname(__file__), 'test-data', *template))
        contents = f.read()
        f.close()

        return contents

    def test_basic_widget_creation(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template1.xml')

        downloader.download_http_content.set_response(template_uri, template)
        downloader.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        resource = install_resource(template, template_uri, self.user, False)

        self.assertEqual(resource.vendor, 'Wirecloud')
        self.assertEqual(resource.short_name, 'test')
        self.assertEqual(resource.version, '0.1')
        self.assertEqual(resource.public, False)
        self.assertEqual(tuple(resource.users.values_list('username', flat=True)), (u'test',))

        widget = resource.widget

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

        downloader.download_http_content.set_response(template_uri, template)
        downloader.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        widget = install_resource(template, template_uri, self.user, False).widget

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

    def test_basic_widget_creation_from_rdf(self):
        template_uri = "http://example.com/path/widget.rdf"
        template = self.read_template('template1.rdf')

        downloader.download_http_content.set_response(template_uri, template)
        downloader.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        widget = install_resource(template, template_uri, self.user, False).widget

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

        self.assertEqual(data['vendor'], 'Wirecloud')
        self.assertEqual(data['name'], 'test operator')
        self.assertEqual(data['type'], 'operator')
        self.assertEqual(data['version'], '0.1')
        self.assertEqual(data['mail'], 'test@example.com')
        self.assertEqual(data['wiring']['inputs'][0]['label'], 'slot')
        self.assertEqual(data['wiring']['inputs'][0]['type'], 'text')
        self.assertEqual(data['wiring']['inputs'][0]['friendcode'], 'test_friend_code')
        self.assertEqual(data['wiring']['outputs'][0]['label'], 'event')
        self.assertEqual(data['wiring']['outputs'][0]['type'], 'text')
        self.assertEqual(data['wiring']['outputs'][0]['friendcode'], 'test_friend_code')
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
        resource = CatalogueResource.objects.get(vendor='Test', short_name='Test Widget', version='1.0.0')
        resource_pk = resource.pk
        xhtml_pk = resource.widget.pk

        delete_resource(resource, self.user)
        self.assertRaises(XHTML.DoesNotExist, XHTML.objects.get, pk=xhtml_pk)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, resource__pk=resource_pk)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, pk=resource_pk)

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

        downloader.download_http_content.set_response(template_uri, template)
        downloader.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        resource = install_resource(template, template_uri, self.user, False)
        resource_pk = resource.pk
        xhtml_pk = resource.widget.pk

        # Cache widget code
        response = client.get(reverse('wirecloud.widget_code_entry', kwargs=widget_id))
        self.assertEqual(response.status_code, 200)
        old_code = response.content

        delete_resource(resource, self.user)
        self.assertRaises(XHTML.DoesNotExist, XHTML.objects.get, pk=xhtml_pk)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, resource__pk=resource_pk)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, pk=resource_pk)

        # Use a different xhtml code
        downloader.download_http_content.set_response('http://example.com/path/test.html', 'cache')
        install_resource(template, template_uri, self.user, False)

        response = client.get(reverse('wirecloud.widget_code_entry', kwargs=widget_id))
        self.assertEqual(response.status_code, 200)
        new_code = response.content

        self.assertNotEqual(old_code, new_code)

    def test_widget_template_with_missing_translation_indexes(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template3.xml')

        downloader.download_http_content.set_response(template_uri, template)
        downloader.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

    def test_widget_template_with_notused_translation_indexes(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template4.xml')

        downloader.download_http_content.set_response(template_uri, template)
        downloader.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

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

        downloader.download_http_content.set_response(template_uri, template)
        downloader.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)
        widget = install_resource(template, template_uri, self.user, False).widget

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
        downloader.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)

        template = self.read_template('template5.xml')
        downloader.download_http_content.set_response(template_uri, template)
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

        template = self.read_template('template6.xml')
        downloader.download_http_content.set_response(template_uri, template)
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

        template = self.read_template('template7.xml')
        downloader.download_http_content.set_response(template_uri, template)
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

    def test_widget_with_unmet_requirements(self):

        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template8.xml')

        downloader.download_http_content.set_response(template_uri, template)
        self.assertRaises(Exception, install_resource, template, template_uri, self.user, False)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, resource__vendor='Example', resource__short_name='test', resource__version='0.1')

    def test_widgets_with_invalid_format_rdf(self):
        template_uri = "http://example.com/path/widget.rdf"
        downloader.download_http_content.set_response('http://example.com/path/test.html', BASIC_HTML_GADGET_CODE)

        template = self.read_template('template5.rdf')
        downloader.download_http_content.set_response(template_uri, template)
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)

        template = self.read_template('template6.rdf')
        downloader.download_http_content.set_response(template_uri, template)
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)

    def test_basic_mashup(self):
        template = self.read_template('..', '..', 'workspace', 'test-data', 'wt1.xml')
        workspace = create_published_workspace_from_template(template, self.user)

        self.assertEqual(workspace.vendor, 'Wirecloud Test Suite')
        self.assertEqual(workspace.name, 'Test Mashup')
        self.assertEqual(workspace.version, '1')
        self.assertEqual(workspace.creator, self.user)

    def test_basic_mashup_rdf(self):
        template = self.read_template('..', '..', 'workspace', 'test-data', 'wt1.rdf')
        workspace = create_published_workspace_from_template(template, self.user)

        self.assertEqual(workspace.vendor, 'Wirecloud Test Suite')
        self.assertEqual(workspace.name, 'Test Workspace')
        self.assertEqual(workspace.version, '1')
        self.assertEqual(workspace.creator, self.user)


class WGTLocalCatalogueTestCase(TransactionTestCase):

    def setUp(self):
        super(WGTLocalCatalogueTestCase, self).setUp()

        self.old_deployer = wirecloud.platform.widget.utils.wgt_deployer
        self.tmp_dir = mkdtemp()
        wirecloud.platform.widget.utils.wgt_deployer = WgtDeployer(self.tmp_dir)
        self.user = User.objects.create_user('test', 'test@example.com', 'test')

    def tearDown(self):
        rmtree(self.tmp_dir, ignore_errors=True)
        wirecloud.platform.widget.utils.wgt_deployer = self.old_deployer

        super(WGTLocalCatalogueTestCase, self).tearDown()

    def test_basic_wgt_deployment(self):
        wgt_file = WgtFile(os.path.join(os.path.dirname(__file__), 'test-data', 'basic_widget.wgt'))
        widget_path = wirecloud.platform.widget.utils.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')

        install_resource(wgt_file, None, self.user, True)
        resource = CatalogueResource.objects.get(vendor='Morfeo', short_name='Test', version='0.1')
        resource.widget
        self.assertEqual(os.path.isdir(widget_path), True)

        delete_resource(resource, self.user)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Morfeo', short_name='Test', version='0.1')
        self.assertEqual(os.path.exists(widget_path), False)

    def test_invalid_wgt_deployment(self):
        wgt_file = WgtFile(os.path.join(os.path.dirname(__file__), 'test-data', 'invalid_widget.wgt'))
        wirecloud.platform.widget.utils.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')

        self.assertRaises(TemplateParseException, install_resource, wgt_file, None, self.user, True)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Morfeo', short_name='Test', version='0.1')


class LocalCatalogueSeleniumTests(WirecloudSeleniumTestCase):

    def test_public_resources(self):

        self.login()

        self.add_widget_to_mashup('Test')

        self.login(username='normuser')

        self.add_widget_to_mashup('Test')

    def test_resource_visibility(self):

        norm_user = User.objects.get(username='normuser')
        normusers_group = Group.objects.get(name='normusers')
        test_widget = CatalogueResource.objects.get(short_name='Test')

        self.login(username='normuser')

        self.search_resource('Test')
        widget = self.search_in_catalogue_results('Test')
        self.assertIsNotNone(widget)

        test_widget.public = False
        test_widget.save()

        self.search_resource('Test')
        widget = self.search_in_catalogue_results('Test')
        self.assertIsNone(widget)

        test_widget.users.add(norm_user)

        self.search_resource('Test')
        widget = self.search_in_catalogue_results('Test')
        self.assertIsNotNone(widget)

        test_widget.users.remove(norm_user)
        test_widget.groups.add(normusers_group)

        self.search_resource('Test')
        widget = self.search_in_catalogue_results('Test')
        self.assertIsNotNone(widget)

    def test_resource_deletion(self):

        self.login()

        self.add_widget_to_mashup('Test')
        self.delete_resource('Test')

        self.assertEqual(self.count_iwidgets(), 0)

        self.login(username='normuser')

        self.search_resource('Test')
        widget = self.search_in_catalogue_results('Test')
        self.assertIsNone(widget)

    def test_resource_uninstall(self):

        test_widget = CatalogueResource.objects.get(short_name='Test')
        test_widget.public = False
        test_widget.save()
        test_widget.users.add(User.objects.get(username='admin'))
        test_widget.users.add(User.objects.get(username='normuser'))

        self.login(username='normuser')

        self.add_widget_to_mashup('Test')
        self.uninstall_resource('Test')

        self.assertEqual(self.count_iwidgets(), 0)

        self.login()

        self.add_widget_to_mashup('Test')

    def test_resources_are_always_deletable_by_superusers(self):

        self.login()

        self.delete_resource('Test')
        self.delete_resource('TestOperator')
        self.delete_resource('Test Mashup')
