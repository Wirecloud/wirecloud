# -*- coding: utf-8 -*-

# Copyright (c) 2012-2013 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

import os.path
from shutil import rmtree
from tempfile import mkdtemp

from django.contrib.auth.models import User, Group
from django.core.urlresolvers import reverse
from django.test import Client

from wirecloud.catalogue import utils as catalogue
from wirecloud.catalogue.models import CatalogueResource
import wirecloud.commons
from wirecloud.commons.utils.template import TemplateParser, TemplateParseException
from wirecloud.commons.utils.testcases import cleartree, DynamicWebServer, WirecloudSeleniumTestCase, WirecloudTestCase
from wirecloud.commons.utils.wgt import WgtDeployer, WgtFile
from wirecloud.platform.localcatalogue.utils import install_resource, install_resource_to_user
import wirecloud.platform.widget.utils
from wirecloud.platform.models import Widget, XHTML


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


BASIC_HTML_GADGET_CODE = "<html><body><p>widget code</p></body></html>"


class LocalCatalogueTestCase(WirecloudTestCase):

    fixtures = ('test_data',)
    servers = {
        'http': {
            'example.com': DynamicWebServer(),
        }
    }
    tags = ('localcatalogue',)

    def setUp(self):
        super(LocalCatalogueTestCase, self).setUp()
        self.user = User.objects.get(username='test')

    def read_template(self, *template):
        f = open(os.path.join(os.path.dirname(__file__), 'test-data', *template))
        contents = f.read()
        f.close()

        return contents

    def check_basic_widget_info(self, resource):

        data = resource.get_processed_info()
        self.assertEqual(data['vendor'], 'Wirecloud')
        self.assertEqual(data['name'], 'test')
        self.assertEqual(data['version'], '0.1')
        self.assertEqual(data['description'], 'Test Widget description')
        self.assertEqual(data['image_uri'], 'http://example.com/path/images/catalogue.png')
        self.assertEqual(data['iphone_image_uri'], 'http://example.com/path/images/catalogue_iphone.png')
        self.assertEqual(data['doc_uri'], 'http://example.com/path/doc/index.html')

        self.assertEqual(len(data['properties']), 1)
        self.assertEqual(data['properties'], [{u'default_value': u'', u'secure': False, u'name': u'prop', u'label': u'Property label', u'type': u'text', u'description': u''}])

        self.assertEqual(len(data['preferences']), 1)
        self.assertEqual(data['preferences'], [{u'default_value': u'value', u'secure': False, u'name': u'pref', u'label': u'Preference label', u'type': u'list', u'options': [{u'value': u'1', u'label': u'Option name'}], u'readonly': False, u'description': u'Preference description', u'value': None}])

        self.assertEqual(len(data['wiring']['inputs']), 1)
        self.assertEqual(data['wiring']['inputs'], [{u'name': u'slot', u'label': u'Slot label', u'type': u'text', u'description': u'',u'friendcode': u'test_friend_code', u'actionlabel': u''}])

        self.assertEqual(len(data['wiring']['outputs']), 1)
        self.assertEqual(data['wiring']['outputs'], [{u'name': u'event', u'label': u'Event label', u'type': u'text', u'description': u'', u'friendcode': u'test_friend_code'}])

    def test_basic_widget_creation(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template1.xml')

        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.xml', {'content': template})
        self.network._servers['http']['example.com'].add_response('GET', '/path/test.html', {'content': BASIC_HTML_GADGET_CODE})
        resource = install_resource_to_user(self.user, file_contents=template, templateURL=template_uri)

        self.assertEqual(resource.vendor, 'Wirecloud')
        self.assertEqual(resource.short_name, 'test')
        self.assertEqual(resource.version, '0.1')
        self.assertEqual(resource.public, False)
        self.assertEqual(tuple(resource.users.values_list('username', flat=True)), (u'test',))
        self.assertEqual(tuple(resource.groups.values_list('name', flat=True)), ())

        self.check_basic_widget_info(resource)

    def test_basic_widget_creation_from_rdf(self):
        template_uri = "http://example.com/path/widget.rdf"
        template = self.read_template('template1.rdf')

        parser = TemplateParser(template)
        data = parser.get_resource_info()
        self.assertIn('requirements', data)
        self.assertItemsEqual(data['requirements'], ({'type': 'feature', 'name': 'Wirecloud'},))

        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.rdf', {'content': template})
        self.network._servers['http']['example.com'].add_response('GET', '/path/test.html', {'content': BASIC_HTML_GADGET_CODE})
        resource = install_resource(template, template_uri, self.user, False)

        self.check_basic_widget_info(resource)

    def test_basic_operator_creation_from_rdf(self):
        template = self.read_template('operatorTemplate1.rdf')
        parser = TemplateParser(template)
        data = parser.get_resource_info()

        self.assertEqual(data['vendor'], 'Wirecloud')
        self.assertEqual(data['name'], 'test operator')
        self.assertEqual(data['type'], 'operator')
        self.assertEqual(data['version'], '0.1')
        self.assertEqual(data['email'], 'test@example.com')
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

        resource.delete()
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

        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.xml', {'content': template})
        self.network._servers['http']['example.com'].add_response('GET', '/path/test.html', {'content': BASIC_HTML_GADGET_CODE})
        resource = install_resource_to_user(self.user, file_contents=template, templateURL=template_uri)
        resource_pk = resource.pk
        xhtml_pk = resource.widget.pk

        # Cache widget code
        response = client.get(reverse('wirecloud.widget_code_entry', kwargs=widget_id))
        self.assertEqual(response.status_code, 200)
        old_code = response.content

        resource.delete()
        self.assertRaises(XHTML.DoesNotExist, XHTML.objects.get, pk=xhtml_pk)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, resource__pk=resource_pk)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, pk=resource_pk)

        # Use a different xhtml code
        self.network._servers['http']['example.com'].add_response('GET', '/path/test.html', {'content': 'cache'})
        install_resource_to_user(self.user, file_contents=template, templateURL=template_uri)

        response = client.get(reverse('wirecloud.widget_code_entry', kwargs=widget_id))
        self.assertEqual(response.status_code, 200)
        new_code = response.content

        self.assertNotEqual(old_code, new_code)

    def test_widget_template_with_missing_translation_indexes(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template3.xml')

        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.xml', {'content': template})
        self.network._servers['http']['example.com'].add_response('GET', '/path/test.html', {'content': BASIC_HTML_GADGET_CODE})
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

    def test_widget_template_with_notused_translation_indexes(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template4.xml')

        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.xml', {'content': template})
        self.network._servers['http']['example.com'].add_response('GET', '/path/test.html', {'content': BASIC_HTML_GADGET_CODE})
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

    def test_template_translations(self):

        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template1.xml')

        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.xml', {'content': template})
        self.network._servers['http']['example.com'].add_response('GET', '/path/test.html', {'content': BASIC_HTML_GADGET_CODE})
        resource = install_resource_to_user(self.user, file_contents=template, templateURL=template_uri)

        self.changeLanguage('es')
        data = resource.get_processed_info()
        self.assertEqual(data['vendor'], 'Wirecloud')
        self.assertEqual(data['name'], 'test')
        self.assertEqual(data['version'], '0.1')
        self.assertEqual(data['display_name'], 'Widget de prueba')
        self.assertEqual(data['description'], u'Descripción del Widget de pruebas')
        self.assertEqual(data['image_uri'], 'http://example.com/path/images/catalogue.png')
        self.assertEqual(data['iphone_image_uri'], 'http://example.com/path/images/catalogue_iphone.png')
        self.assertEqual(data['doc_uri'], 'http://example.com/path/doc/index.html')

        self.assertEqual(len(data['properties']), 1)
        self.assertEqual(data['properties'], [{u'default_value': u'', u'secure': False, u'name': u'prop', u'label': u'Etiqueta de la propiedad', u'type': u'text', u'description': u''}])

        self.assertEqual(len(data['preferences']), 1)
        self.assertEqual(data['preferences'], [{u'default_value': u'value', u'secure': False, u'name': u'pref', u'label': u'Etiqueta de la preferencia', u'type': u'list', u'options': [{u'value': u'1', u'label': u'Nombre de la opción'}], u'readonly': False, u'description': u'Descripción de la preferencia', u'value': None}])

        self.assertEqual(len(data['wiring']['inputs']), 1)
        self.assertEqual(data['wiring']['inputs'], [{u'name': u'slot', u'label': u'Etiqueta del endpoint de entrada', u'type': u'text', u'description': u'',u'friendcode': u'test_friend_code', u'actionlabel': u''}])

        self.assertEqual(len(data['wiring']['outputs']), 1)
        self.assertEqual(data['wiring']['outputs'], [{u'name': u'event', u'label': u'Etiqueta del endpoint de salida', u'type': u'text', u'description': u'', u'friendcode': u'test_friend_code'}])

    def test_repeated_translation_indexes(self):
        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template2.xml')

        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.xml', {'content': template})
        self.network._servers['http']['example.com'].add_response('GET', '/path/test.html', {'content': BASIC_HTML_GADGET_CODE})
        resource = install_resource(template, template_uri, self.user, False)

        data = resource.get_processed_info()
        self.assertEqual(data['display_name'], 'Test Widget')
        self.assertEqual(data['version'], '0.2')

        self.assertEqual(len(data['properties']), 1)
        self.assertEqual(data['properties'], [{u'default_value': u'', u'secure': False, u'name': u'prop', u'label': u'Label', u'type': u'text', u'description': u''}])

        self.assertEqual(len(data['preferences']), 1)
        self.assertEqual(data['preferences'], [{u'default_value': u'value', u'secure': False, u'name': u'pref', u'label': u'Label', u'readonly': False, u'type': u'text', u'description': u'Preference description', u'value': None}])

        self.assertEqual(len(data['wiring']['inputs']), 1)
        self.assertEqual(data['wiring']['inputs'], [{u'name': u'slot', u'label': u'Label', u'type': u'text', u'description': u'',u'friendcode': u'test_friend_code', u'actionlabel': u''}])

        self.assertEqual(len(data['wiring']['outputs']), 1)
        self.assertEqual(data['wiring']['outputs'], [{u'name': u'event', u'label': u'Label', u'type': u'text', u'description': u'', u'friendcode': u'test_friend_code'}])

    def test_widgets_with_invalid_format(self):
        template_uri = "http://example.com/path/widget.xml"
        self.network._servers['http']['example.com'].add_response('GET', '/path/test.html', {'content': BASIC_HTML_GADGET_CODE})

        template = self.read_template('template5.xml')
        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.xml', {'content': template})
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

        template = self.read_template('template6.xml')
        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.xml', {'content': template})
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

        template = self.read_template('template7.xml')
        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.xml', {'content': template})
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

    def test_widget_with_unmet_requirements(self):

        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template8.xml')

        parser = TemplateParser(template)
        data = parser.get_resource_info()
        self.assertIn('requirements', data)
        self.assertItemsEqual(data['requirements'], ({'type': 'feature', 'name': 'nonexistent-feature'}, {'type': 'feature', 'name': 'Wirecloud'},))

        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.xml', {'content': template})
        self.assertRaises(Exception, install_resource, template, template_uri, self.user, False)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, resource__vendor='Example', resource__short_name='test', resource__version='0.1')

    def test_widget_with_unmet_requirements_rdf(self):

        template_uri = "http://example.com/path/widget.xml"
        template = self.read_template('template8.rdf')

        parser = TemplateParser(template)
        data = parser.get_resource_info()
        self.assertIn('requirements', data)
        self.assertItemsEqual(data['requirements'], ({'type': 'feature', 'name': 'nonexistent-feature'}, {'type': 'feature', 'name': 'Wirecloud'},))

        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.xml', {'content': template})
        self.assertRaises(Exception, install_resource, template, template_uri, self.user, False)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, resource__vendor='Example', resource__short_name='test', resource__version='0.1')

    def test_widgets_with_invalid_format_rdf(self):
        template_uri = "http://example.com/path/widget.rdf"
        self.network._servers['http']['example.com'].add_response('GET', '/path/test.html', {'content': BASIC_HTML_GADGET_CODE})

        template = self.read_template('template5.rdf')
        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.rdf', {'content': template})
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)

        template = self.read_template('template6.rdf')
        self.network._servers['http']['example.com'].add_response('GET', '/path/widget.rdf', {'content': template})
        self.assertRaises(TemplateParseException, install_resource, template, template_uri, self.user, False)

    def test_basic_mashup(self):

        template_uri = "http://example.com/path/mashup.xml"
        template = self.read_template('..', '..', 'workspace', 'test-data', 'wt1.xml')
        self.network._servers['http']['example.com'].add_response('GET', '/path/mashup.xml', {'content': template})
        resource = install_resource_to_user(self.user, file_contents=template, templateURL=template_uri)

        self.assertEqual(resource.vendor, 'Wirecloud Test Suite')
        self.assertEqual(resource.short_name, 'Test Mashup')
        self.assertEqual(resource.version, '1')
        self.assertTrue(resource.is_available_for(self.user))

    def test_basic_mashup_rdf(self):

        template_uri = "http://example.com/path/mashup.rdf"
        template = self.read_template('..', '..', 'workspace', 'test-data', 'wt1.rdf')
        self.network._servers['http']['example.com'].add_response('GET', '/path/mashup.rdf', {'content': template})
        resource = install_resource_to_user(self.user, file_contents=template, templateURL=template_uri)

        self.assertEqual(resource.vendor, 'Wirecloud Test Suite')
        self.assertEqual(resource.short_name, 'Test Mashup')
        self.assertEqual(resource.version, '1')
        self.assertTrue(resource.is_available_for(self.user))


class PackagedResourcesTestCase(WirecloudTestCase):

    tags = ('localcatalogue',)

    @classmethod
    def setUpClass(cls):

        super(PackagedResourcesTestCase, cls).setUpClass()

        cls.old_catalogue_deployer = catalogue.wgt_deployer
        cls.catalogue_tmp_dir = mkdtemp()
        catalogue.wgt_deployer = WgtDeployer(cls.catalogue_tmp_dir)

        cls.old_deployer = wirecloud.platform.widget.utils.wgt_deployer
        cls.tmp_dir = mkdtemp()
        wirecloud.platform.widget.utils.wgt_deployer = WgtDeployer(cls.tmp_dir)

    @classmethod
    def tearDownClass(cls):

        wirecloud.platform.widget.utils.wgt_deployer = cls.old_deployer
        rmtree(cls.tmp_dir, ignore_errors=True)
        catalogue.wgt_deployer = cls.old_catalogue_deployer
        rmtree(cls.catalogue_tmp_dir, ignore_errors=True)

        super(PackagedResourcesTestCase, cls).tearDownClass()

    def setUp(self):

        self.user = User.objects.create_user('test', 'test@example.com', 'test')

    def tearDown(self):

        cleartree(self.tmp_dir)
        cleartree(self.catalogue_tmp_dir)
        super(PackagedResourcesTestCase, self).tearDown()

    def test_basic_packaged_widget_deployment(self):

        wgt_file = WgtFile(os.path.join(os.path.dirname(__file__), 'test-data', 'basic_widget.wgt'))
        catalogue_deployment_path = catalogue.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')
        deployment_path = wirecloud.platform.widget.utils.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')

        install_resource_to_user(self.user, file_contents=wgt_file, packaged=True)
        resource = CatalogueResource.objects.get(vendor='Morfeo', short_name='Test', version='0.1')
        resource.widget
        self.assertTrue(os.path.isdir(deployment_path))
        self.assertTrue(os.path.isdir(catalogue_deployment_path))

        resource.delete()
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Morfeo', short_name='Test', version='0.1')
        self.assertFalse(os.path.exists(deployment_path))
        self.assertFalse(os.path.exists(catalogue_deployment_path))

    def test_invalid_packaged_widget_deployment(self):

        wgt_file = WgtFile(os.path.join(os.path.dirname(__file__), 'test-data', 'invalid_widget.wgt'))
        catalogue_deployment_path = catalogue.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')
        deployment_path = wirecloud.platform.widget.utils.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')

        self.assertRaises(TemplateParseException, install_resource, wgt_file, None, self.user, True)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Morfeo', short_name='Test', version='0.1')
        self.assertFalse(os.path.exists(deployment_path))
        self.assertFalse(os.path.exists(catalogue_deployment_path))

    def test_basic_packaged_mashup_deployment(self):

        wgt_file = WgtFile(os.path.join(os.path.dirname(wirecloud.commons.__file__), 'test-data', 'Wirecloud_PackagedTestMashup_1.0.zip'))
        deployment_path = catalogue.wgt_deployer.get_base_dir('Wirecloud', 'PackagedTestMashup', '1.0')

        install_resource_to_user(self.user, file_contents=wgt_file, packaged=True)
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='PackagedTestMashup', version='1.0')
        self.assertTrue(os.path.isdir(deployment_path))

        resource.delete()
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='PackagedTestMashup', version='1.0')
        self.assertFalse(os.path.exists(deployment_path))

    def test_basic_packaged_operator_deployment(self):

        wgt_file = WgtFile(os.path.join(os.path.dirname(wirecloud.commons.__file__), 'test-data', 'Wirecloud_TestOperator_1.0.zip'))
        deployment_path = catalogue.wgt_deployer.get_base_dir('Wirecloud', 'TestOperator', '1.0')

        install_resource_to_user(self.user, file_contents=wgt_file, packaged=True)
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='TestOperator', version='1.0')
        self.assertTrue(os.path.isdir(deployment_path))

        resource.delete()
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='TestOperator', version='1.0')
        self.assertFalse(os.path.exists(deployment_path))


class LocalCatalogueSeleniumTests(WirecloudSeleniumTestCase):

    tags = ('localcatalogue',)

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
        test_widget.users.clear()
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
