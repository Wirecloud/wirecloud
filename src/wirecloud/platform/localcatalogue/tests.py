# -*- coding: utf-8 -*-

# Copyright (c) 2012-2017 CoNWeT Lab., Universidad Politécnica de Madrid
# Copyright (c) 2019 Future Internet Consulting and Development Solutions S.L.

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

from io import BytesIO
import os.path
import time
from unittest.mock import Mock
import zipfile

from django.contrib.auth.models import User, Group
from django.core.exceptions import PermissionDenied
from django.core.urlresolvers import reverse
from django.db import IntegrityError
from django.test import Client, TransactionTestCase
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from wirecloud.catalogue import utils as catalogue
from wirecloud.catalogue.models import CatalogueResource
import wirecloud.commons
from wirecloud.commons.utils import expected_conditions as WEC
from wirecloud.commons.utils.template import TemplateParser, TemplateParseException
from wirecloud.commons.utils.testcases import uses_extra_resources, DynamicWebServer, WirecloudSeleniumTestCase, WirecloudTestCase, wirecloud_selenium_test_case
from wirecloud.commons.utils.wgt import InvalidContents, WgtFile
from wirecloud.platform.localcatalogue.utils import add_m2m, install_resource, install_component, fix_dev_version
import wirecloud.platform.widget.utils
from wirecloud.platform.models import Widget, XHTML


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


BASIC_HTML_GADGET_CODE = b"<html><body><p>widget code</p></body></html>"


class LocalCatalogueTestCase(WirecloudTestCase, TransactionTestCase):

    fixtures = ('test_data',)
    servers = {
        'http': {
            'example.com': DynamicWebServer(),
        }
    }
    tags = ('wirecloud-localcatalogue', 'wirecloud-noselenium', 'wirecloud-localcatalogue-noselenium')
    populate = False

    def setUp(self):
        super(LocalCatalogueTestCase, self).setUp()
        self.user = User.objects.get(username='test')
        self.user2 = User.objects.get(username='test2')
        self.group = Group.objects.get(name='normusers')

    def read_file(self, *template):
        path = os.path.normpath(os.path.join(os.path.dirname(__file__), 'test-data', *template))
        with open(path, 'rb') as f:
            return f.read()

    def build_simple_wgt(self, template_name, html_content=None, other_files=()):

        template = self.read_file(template_name)

        f = BytesIO()
        zf = zipfile.ZipFile(f, 'w')
        zf.writestr('config.xml', template)
        zf.writestr('test.html', html_content or BASIC_HTML_GADGET_CODE)
        zf.writestr('doc/', b'')
        zf.writestr('images/catalogue.png', b'')
        zf.writestr('images/catalogue_smartphone.png', b'')
        for of in other_files:
            zf.writestr(of, b'')
        zf.close()
        return WgtFile(f)

    def check_basic_widget_info(self, resource):

        self.assertEqual(resource.vendor, 'Wirecloud')
        self.assertEqual(resource.short_name, 'test')
        self.assertEqual(resource.version, '0.1')
        self.assertEqual(resource.public, False)
        self.assertEqual(tuple(resource.users.values_list('username', flat=True)), ('test',))
        self.assertEqual(tuple(resource.groups.values_list('name', flat=True)), ())

        data = resource.get_processed_info(process_urls=False)
        self.assertEqual(data['vendor'], 'Wirecloud')
        self.assertEqual(data['name'], 'test')
        self.assertEqual(data['version'], '0.1')
        self.assertEqual(data['description'], 'Test Widget description')
        self.assertEqual(data['image'], 'images/catalogue.png')
        self.assertEqual(data['smartphoneimage'], 'images/catalogue_smartphone.png')
        self.assertEqual(data['doc'], 'doc/index.html')
        self.assertEqual(data['license'], 'Apache License 2.0')
        self.assertEqual(data['licenseurl'], 'http://www.apache.org/licenses/LICENSE-2.0.html')

        self.assertEqual(len(data['properties']), 1)
        self.assertEqual(data['properties'], [{'default': '', 'secure': False, 'name': 'prop', 'label': 'Property label', 'type': 'text', 'description': '', 'multiuser': False}])

        self.assertEqual(len(data['preferences']), 1)
        self.assertEqual(data['preferences'], [
            {
                'default': 'value',
                'secure': False,
                'name': 'pref',
                'label': 'Preference label',
                'type': 'list',
                'options': [{'value': '1', 'label': 'Option name'}],
                'readonly': False,
                'description': 'Preference description',
                'value': None,
                'multiuser': False,
                'required': False,
            }
        ])

        self.assertEqual(len(data['wiring']['inputs']), 1)
        self.assertEqual(data['wiring']['inputs'], [{'name': 'slot', 'label': 'Slot label', 'type': 'text', 'description': '', 'friendcode': 'test_friend_code', 'actionlabel': ''}])

        self.assertEqual(len(data['wiring']['outputs']), 1)
        self.assertEqual(data['wiring']['outputs'], [{'name': 'event', 'label': 'Event label', 'type': 'text', 'description': '', 'friendcode': 'test_friend_code'}])

    def test_widget_with_minimal_info(self):

        file_contents = self.build_simple_wgt('template9.xml')
        added, resource = install_component(file_contents, executor_user=self.user, users=[self.user])

        self.assertTrue(added)
        resource_info = resource.json_description
        self.assertEqual(resource.vendor, 'Wirecloud')
        self.assertEqual(resource.short_name, 'test')
        self.assertEqual(resource.version, '0.1')
        self.assertEqual(resource_info['email'], 'test@example.com')
        self.assertFalse(resource.public)
        self.assertEqual(tuple(resource.users.values_list('username', flat=True)), ('test',))
        self.assertEqual(tuple(resource.groups.values_list('name', flat=True)), ())

    def test_basic_widget_creation(self):

        file_contents = self.build_simple_wgt('template1.xml', other_files=('doc/index.html',))
        added, resource = install_component(file_contents, executor_user=self.user, users=[self.user])

        self.assertTrue(added)
        self.check_basic_widget_info(resource)

    def test_basic_widget_creation_from_rdf(self):

        file_contents = self.build_simple_wgt('template1.rdf', other_files=('doc/index.html',))
        added, resource = install_component(file_contents, executor_user=self.user, users=[self.user])

        self.assertTrue(added)
        self.check_basic_widget_info(resource)

    def test_basic_operator_creation_from_rdf(self):
        template = self.read_file('operatorTemplate1.rdf')
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
        self.assertEqual(data['preferences'][0]['default'], 'value')
        self.assertEqual(len(data['js_files']), 5)

        self.assertEqual(data['js_files'][0], '/examplecode1.js')
        self.assertEqual(data['js_files'][1], '/examplecode2.js')
        self.assertEqual(data['js_files'][2], '/examplecode3.js')
        self.assertEqual(data['js_files'][3], '/examplecode4.js')
        self.assertEqual(data['js_files'][4], '/examplecode5.js')

    def test_widget_deletion(self):
        resource = CatalogueResource.objects.get(vendor='Test', short_name='Test Widget', version='1.0.0')
        resource_pk = resource.pk
        xhtml_pk = resource.widget.xhtml.pk

        resource.delete()
        self.assertRaises(XHTML.DoesNotExist, XHTML.objects.get, pk=xhtml_pk)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, resource__pk=resource_pk)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, pk=resource_pk)

    def test_widget_code_cache(self):

        client = Client()
        client.login(username='test', password='test')
        widget_code_path = {'vendor': 'Wirecloud', 'name': 'test', 'version': '0.1', 'file_path': 'index.html'}

        file_contents = self.build_simple_wgt('template1.xml', other_files=('doc/index.html',))
        added, resource = install_component(file_contents, executor_user=self.user, users=[self.user])
        self.assertTrue(added)
        resource_pk = resource.pk
        xhtml_pk = resource.widget.pk

        # Cache widget code
        response = client.get(reverse('wirecloud.showcase_media', kwargs=widget_code_path) + '?entrypoint=true')
        self.assertEqual(response.status_code, 200)
        old_code = response.content

        resource.delete()
        self.assertRaises(XHTML.DoesNotExist, XHTML.objects.get, pk=xhtml_pk)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, resource__pk=resource_pk)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, pk=resource_pk)

        # Use a different xhtml code
        file_contents = self.build_simple_wgt('template1.xml', b'code', other_files=('doc/index.html',))
        resource = install_component(file_contents, executor_user=self.user, users=[self.user])

        response = client.get(reverse('wirecloud.showcase_media', kwargs=widget_code_path) + '?entrypoint=true')
        self.assertEqual(response.status_code, 200)
        new_code = response.content

        self.assertNotEqual(old_code, new_code)

    def test_install_resource_requires_wgt_instance(self):

        self.assertRaises(TypeError, install_resource, None, self.user)

    def test_install_resource_restricted_dev(self):

        file_contents = WgtFile(BytesIO(self.read_file("..", "..", "..", "commons", "test-data", "Wirecloud_Test_Selenium_1.0-dev.wgt")))

        self.assertRaises(PermissionDenied, install_resource, file_contents, self.user, restricted=True)

    def test_install_resource_restricted_not_authorized_user(self):

        file_contents = WgtFile(BytesIO(self.read_file("..", "..", "..", "commons", "test-data", "Wirecloud_Test_Selenium_1.0.wgt")))

        self.assertRaises(PermissionDenied, install_resource, file_contents, self.user, restricted=True)

    def test_install_resource_restricted_authorized_user(self):

        file_contents = WgtFile(BytesIO(self.read_file("..", "..", "..", "commons", "test-data", "Wirecloud_Test_Selenium_1.0.wgt")))

        install_resource(file_contents, self.user2, restricted=True)

    def test_install_dev_resource(self):
        widgetT2 = self.build_simple_wgt('devwidget.json', b'code')
        r1 = install_resource(widgetT2, self.user2)
        r2 = install_resource(widgetT2, self.user2)
        self.assertNotEqual(r1, r2)

    def test_install_resource_to_group(self):

        wgt_file = self.build_simple_wgt('template1.xml', b'code', other_files=('doc/index.html',))

        added, resource = install_component(wgt_file, groups=[self.group])
        self.assertTrue(added)
        self.assertTrue(resource.is_available_for(self.user))
        self.assertTrue(resource.is_available_for(self.user2))

    def test_add_m2m_race(self):

        # Check add_m2m handles race conditions
        field = Mock()
        field.filter().exists.side_effect = (False, True)
        field.add.side_effect = IntegrityError
        add_m2m(field, Mock())

    def test_add_m2m_integrity_exception(self):

        # Check add_m2m reraise not handled exceptions
        field = Mock()
        field.filter().exists.return_value = False
        field.add.side_effect = IntegrityError
        self.assertRaises(IntegrityError, add_m2m, field, Mock())

    def test_install_resource_to_group_duplicated(self):

        resource = CatalogueResource.objects.get(vendor='Test', short_name='Test Widget', version='1.0.0')
        resource.groups.add(self.group)

        wgt_file = self.build_simple_wgt('template10.xml', b'code')

        added, resource = install_component(wgt_file, groups=[self.group])
        self.assertFalse(added)
        self.assertTrue(resource.is_available_for(self.user))
        self.assertTrue(resource.is_available_for(self.user2))

    def test_install_resource_to_all_users(self):

        wgt_file = self.build_simple_wgt('template1.xml', b'code', other_files=('doc/index.html',))

        added, resource = install_component(wgt_file, public=True)
        self.assertTrue(added)
        self.assertTrue(resource.public)
        self.assertTrue(resource.is_available_for(self.user))
        self.assertTrue(resource.is_available_for(self.user2))

    def test_fix_dev_version(self):

        wgt_file = self.build_simple_wgt('template11.xml', b'code', other_files=('doc/index.html',))
        original_template = wgt_file.get_template()
        original_version = TemplateParser(original_template).get_resource_info()['version']

        fix_dev_version(wgt_file, self.user)
        new_version = TemplateParser(wgt_file.get_template()).get_resource_info()['version']

        self.assertNotEqual(original_template, wgt_file.get_template())
        self.assertEqual(original_version + self.user.username, new_version)

    def test_install_resource_to_all_users_duplicated(self):

        CatalogueResource.objects.filter(vendor='Test', short_name='Test Widget', version='1.0.0').update(public=True)

        wgt_file = self.build_simple_wgt('template10.xml', b'code')

        added, resource = install_component(wgt_file, public=True)
        self.assertFalse(added)
        self.assertTrue(resource.public)
        self.assertTrue(resource.is_available_for(self.user))
        self.assertTrue(resource.is_available_for(self.user2))

    def test_widget_with_missing_translation_indexes(self):

        file_contents = self.build_simple_wgt('template3.xml')

        self.assertRaises(TemplateParseException, install_resource, file_contents, self.user)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

    def test_widget_with_notused_translation_indexes(self):

        file_contents = self.build_simple_wgt('template4.xml')

        self.assertRaises(TemplateParseException, install_resource, file_contents, self.user)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

    def test_template_translations(self):

        file_contents = self.build_simple_wgt('template1.xml', other_files=('doc/index.html',))

        added, resource = install_component(file_contents, executor_user=self.user, users=[self.user])

        self.assertTrue(added)
        self.changeLanguage('es')
        data = resource.get_processed_info(process_urls=False)
        self.assertEqual(data['vendor'], 'Wirecloud')
        self.assertEqual(data['name'], 'test')
        self.assertEqual(data['version'], '0.1')
        self.assertEqual(data['title'], 'Widget de prueba')
        self.assertEqual(data['description'], 'Descripción del Widget de pruebas')
        self.assertEqual(data['image'], 'images/catalogue.png')
        self.assertEqual(data['smartphoneimage'], 'images/catalogue_smartphone.png')
        self.assertEqual(data['doc'], 'doc/index.html')

        self.assertEqual(len(data['properties']), 1)
        self.assertEqual(data['properties'], [{'default': '', 'secure': False, 'name': 'prop', 'label': 'Etiqueta de la propiedad', 'type': 'text', 'description': '', 'multiuser': False}])

        self.assertEqual(len(data['preferences']), 1)
        self.assertEqual(data['preferences'], [
            {
                'default': 'value',
                'secure': False,
                'name': 'pref',
                'label': 'Etiqueta de la preferencia',
                'type': 'list',
                'options': [{'value': '1', 'label': 'Nombre de la opción'}],
                'readonly': False,
                'description': 'Descripción de la preferencia',
                'value': None,
                'multiuser': False,
                'required': False,
            }
        ])

        self.assertEqual(len(data['wiring']['inputs']), 1)
        self.assertEqual(data['wiring']['inputs'], [{'name': 'slot', 'label': 'Etiqueta del endpoint de entrada', 'type': 'text', 'description': '', 'friendcode': 'test_friend_code', 'actionlabel': ''}])

        self.assertEqual(len(data['wiring']['outputs']), 1)
        self.assertEqual(data['wiring']['outputs'], [{'name': 'event', 'label': 'Etiqueta del endpoint de salida', 'type': 'text', 'description': '', 'friendcode': 'test_friend_code'}])

    def test_repeated_translation_indexes(self):

        file_contents = self.build_simple_wgt('template2.xml')

        resource = install_resource(file_contents, self.user)

        data = resource.get_processed_info()
        self.assertEqual(data['title'], 'Test Widget')
        self.assertEqual(data['version'], '0.2')

        self.assertEqual(len(data['properties']), 1)
        self.assertEqual(data['properties'], [{'default': '', 'secure': False, 'name': 'prop', 'label': 'Label', 'type': 'text', 'description': '', 'multiuser': False}])

        self.assertEqual(len(data['preferences']), 1)
        self.assertEqual(data['preferences'], [
            {
                'default': 'value',
                'secure': False,
                'name': 'pref',
                'label': 'Label',
                'type': 'text',
                'readonly': False,
                'description': 'Preference description',
                'value': None,
                'multiuser': False,
                'required': False,
            }
        ])

        self.assertEqual(len(data['wiring']['inputs']), 1)
        self.assertEqual(data['wiring']['inputs'], [{'name': 'slot', 'label': 'Label', 'type': 'text', 'description': '', 'friendcode': 'test_friend_code', 'actionlabel': ''}])

        self.assertEqual(len(data['wiring']['outputs']), 1)
        self.assertEqual(data['wiring']['outputs'], [{'name': 'event', 'label': 'Label', 'type': 'text', 'description': '', 'friendcode': 'test_friend_code'}])

    def test_widgets_with_invalid_format(self):

        file_contents = self.build_simple_wgt('template5.xml')
        self.assertRaises(TemplateParseException, install_resource, file_contents, self.user)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

        file_contents = self.build_simple_wgt('template6.xml')
        self.assertRaises(TemplateParseException, install_resource, file_contents, self.user)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

        file_contents = self.build_simple_wgt('template7.xml')
        self.assertRaises(TemplateParseException, install_resource, file_contents, self.user)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

    def test_widget_with_unmet_requirements(self):

        file_contents = self.build_simple_wgt('template8.xml')

        self.assertRaises(Exception, install_resource, file_contents, self.user)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, resource__vendor='Example', resource__short_name='test', resource__version='0.1')

    def test_widget_with_unmet_requirements_rdf(self):

        file_contents = self.build_simple_wgt('template8.rdf')

        self.assertRaises(Exception, install_resource, file_contents, self.user)
        self.assertRaises(Widget.DoesNotExist, Widget.objects.get, resource__vendor='Example', resource__short_name='test', resource__version='0.1')

    def test_widgets_with_invalid_format_rdf(self):

        file_contents = self.build_simple_wgt('template5.rdf')
        self.assertRaises(TemplateParseException, install_resource, file_contents, self.user)

        file_contents = self.build_simple_wgt('template6.rdf')
        self.assertRaises(TemplateParseException, install_resource, file_contents, self.user)

    def test_basic_mashup(self):

        file_contents = self.build_simple_wgt(os.path.join('..', '..', 'workspace', 'test-data', 'wt1.xml'))
        added, resource = install_component(file_contents, executor_user=self.user, users=[self.user])

        self.assertTrue(added)
        self.assertEqual(resource.vendor, 'Wirecloud Test Suite')
        self.assertEqual(resource.short_name, 'test-mashup')
        self.assertEqual(resource.version, '1')
        self.assertTrue(resource.is_available_for(self.user))

    def test_basic_mashup_rdf(self):

        file_contents = self.build_simple_wgt(os.path.join('..', '..', 'workspace', 'test-data', 'wt1.rdf'))
        added, resource = install_component(file_contents, executor_user=self.user, users=[self.user])

        self.assertTrue(added)
        self.assertEqual(resource.vendor, 'Wirecloud Test Suite')
        self.assertEqual(resource.short_name, 'test-mashup')
        self.assertEqual(resource.version, '1')
        self.assertTrue(resource.is_available_for(self.user))

    def test_mashup_with_missing_embedded_resources(self):

        file_contents = self.build_simple_wgt('mashup_with_missing_embedded_resources.xml')
        self.assertRaises(InvalidContents, install_component, file_contents, self.user)

    def test_mashup_with_invalid_embedded_resources(self):

        file_contents = WgtFile(BytesIO(self.read_file("..", "..", "..", "commons", "test-data", "Wirecloud_mashup-with-invalid-macs_1.0.wgt")))
        try:
            install_component(file_contents, executor_user=self.user, users=[self.user])
            self.fail('InvalidContents exception not raised')
        except InvalidContents as e:
            self.assertIn('Invalid embedded file: ', e.message)


class PackagedResourcesTestCase(WirecloudTestCase, TransactionTestCase):

    tags = ('wirecloud-localcatalogue', 'wirecloud-noselenium', 'wirecloud-localcatalogue-noselenium')
    populate = False

    def setUp(self):

        super(PackagedResourcesTestCase, self).setUp()
        self.user = User.objects.create_user('test', 'test@example.com', 'test')

    def test_basic_packaged_widget_deployment(self):

        wgt_file = WgtFile(os.path.join(os.path.dirname(__file__), 'test-data', 'basic_widget.wgt'))
        catalogue_deployment_path = catalogue.wgt_deployer.get_base_dir('Wirecloud', 'Test', '0.1')
        deployment_path = wirecloud.platform.widget.utils.wgt_deployer.get_base_dir('Wirecloud', 'Test', '0.1')

        added, resource = install_component(wgt_file, users=[self.user])
        resource.widget
        self.assertTrue(added)
        self.assertTrue(os.path.isdir(deployment_path))
        self.assertTrue(os.path.isdir(catalogue_deployment_path))
        self.assertTrue(resource.is_available_for(self.user))

        resource.delete()
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='Test', version='0.1')
        self.assertFalse(os.path.exists(deployment_path))
        self.assertFalse(os.path.exists(catalogue_deployment_path))

    def test_invalid_packaged_widget_deployment(self):

        wgt_file = WgtFile(os.path.join(os.path.dirname(__file__), 'test-data', 'invalid_widget.wgt'))
        catalogue_deployment_path = catalogue.wgt_deployer.get_base_dir('Wirecloud', 'Test', '0.1')
        deployment_path = wirecloud.platform.widget.utils.wgt_deployer.get_base_dir('Wirecloud', 'Test', '0.1')

        self.assertRaises(TemplateParseException, install_resource, wgt_file, self.user)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='Test', version='0.1')
        self.assertFalse(os.path.exists(deployment_path))
        self.assertFalse(os.path.exists(catalogue_deployment_path))

    def test_basic_packaged_mashup_deployment(self):

        wgt_file = WgtFile(os.path.join(os.path.dirname(wirecloud.commons.__file__), 'test-data', 'Wirecloud_PackagedTestMashup_1.0.zip'))
        deployment_path = catalogue.wgt_deployer.get_base_dir('Wirecloud', 'PackagedTestMashup', '1.0')

        install_component(wgt_file, users=[self.user])
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='PackagedTestMashup', version='1.0')
        self.assertTrue(os.path.isdir(deployment_path))

        resource.delete()
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='PackagedTestMashup', version='1.0')
        self.assertFalse(os.path.exists(deployment_path))

    def test_basic_packaged_operator_deployment(self):

        wgt_file = WgtFile(os.path.join(os.path.dirname(wirecloud.commons.__file__), 'test-data', 'Wirecloud_TestOperator_1.0.zip'))
        deployment_path = catalogue.wgt_deployer.get_base_dir('Wirecloud', 'TestOperator', '1.0')

        install_component(wgt_file, users=[self.user])
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='TestOperator', version='1.0')
        self.assertTrue(os.path.isdir(deployment_path))

        resource.delete()
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='TestOperator', version='1.0')
        self.assertFalse(os.path.exists(deployment_path))


@wirecloud_selenium_test_case
class LocalCatalogueSeleniumTests(WirecloudSeleniumTestCase):

    fixtures = ('selenium_test_data', 'user_with_workspaces')
    tags = ('wirecloud-localcatalogue', 'wirecloud-selenium', 'wirecloud-localcatalogue-selenium')
    populate = False

    def test_public_resources(self):
        # Check admin can make use of the public Test widget
        self.login(username="admin", next="/admin/Workspace")
        self.create_widget('Test')

        # Check normuser also can make use of the public Test widget
        self.login(username='normuser', next="/normuser/Workspace")
        self.create_widget('Test')

        # Also widget details can be accessed
        with self.myresources_view as myresources:
            myresources.wait_catalogue_ready()
            myresources.search('Test')
            with myresources.search_in_results('Test') as resource:

                tab = resource.switch_tab('Change Log')
                self.assertIsNotNone(tab, 'Missing change log tab')
                changelog_contents = WebDriverWait(self.driver, 5).until(WEC.element_be_enabled((By.CSS_SELECTOR, '.se-notebook-tab-content.changelog'), base_element=resource.details))
                headings = changelog_contents.find_elements_by_css_selector('h1')
                self.assertEqual(len(headings), 1)

                tab = resource.switch_tab('Documentation')
                self.assertIsNotNone(tab, 'Missing documentation tab')
                documentation_contents = WebDriverWait(self.driver, 5).until(WEC.element_be_enabled((By.CSS_SELECTOR, '.se-notebook-tab-content.documentation'), base_element=resource.details))
                headings = documentation_contents.find_elements_by_css_selector('h1, h2')
                self.assertEqual(len(headings), 2)

            # But cannot be uninstalled by normal users
            myresources.uninstall_resource('Test', expect_error=True)

    def test_resource_visibility(self):

        norm_user = User.objects.get(username='normuser')
        normusers_group = Group.objects.get(name='normusers')
        test_widget = CatalogueResource.objects.get(short_name='Test')

        self.login(username='normuser')

        with self.myresources_view as myresources:
            # Test widget is publicly visible by default
            myresources.search('Test')
            widget = myresources.search_in_results('Test')
            self.assertIsNotNone(widget)

            # Make Test widget unavailable
            test_widget.public = False
            test_widget.users.clear()
            test_widget.save()
            time.sleep(1)

            # Check normuser hasn't access the Test widget
            myresources.search('Test')
            widget = myresources.search_in_results('Test')
            self.assertIsNone(widget)

            # Make Test widget directly available to normuser
            test_widget.users.add(norm_user)
            time.sleep(1)

            # Check normuser has access to the Test widget
            myresources.search('Test')
            widget = myresources.search_in_results('Test')
            self.assertIsNotNone(widget)

            # Make Test widget available to normuser through the normusers group
            test_widget.users.remove(norm_user)
            test_widget.groups.add(normusers_group)
            time.sleep(1)

            # Check normuser has access to the Test widget
            myresources.search('Test')
            widget = myresources.search_in_results('Test')
            self.assertIsNotNone(widget)

    def test_resource_deletion_affects_other_workspaces(self):

        self.login(username="admin", next="/admin/Workspace")

        # Add a Test widget to the initial workspace and cache it
        self.create_widget('Test')
        self.change_current_workspace('Workspace')

        # Create a new workspace with a test widget
        self.create_workspace('Test')
        self.create_widget('Test')

        # Delete Test widget
        with self.myresources_view as myresources:
            myresources.delete_resource('Test')

        # Check current workspace has only a missing widget
        self.assertEqual(len(self.widgets), 1)
        self.assertEqual(self.widgets[0].error_count, 1)

        # Check initial workspace has only a missing widget
        self.change_current_workspace('Workspace')
        self.assertEqual(len(self.widgets), 1)
        self.assertEqual(self.widgets[0].wait_loaded().error_count, 1)

        # Check normuser also has no access to the Test widget
        self.login(username='normuser', next="/normuser/Workspace")
        with self.myresources_view as myresources:
            myresources.search('Test')
            widget = myresources.search_in_results('Test')
            self.assertIsNone(widget)

    def check_multiversioned_widget(self, admin):

        with self.myresources_view as myresources:
            with myresources.search_in_results('Test') as test_widget:

                operations = [operation.text for operation in test_widget.details.find_elements_by_css_selector('.advanced_operations .se-btn')]
                if admin:
                    self.assertIn('Delete all versions', operations)
                else:
                    self.assertNotIn('Delete all versions', operations)

                version_list = test_widget.get_version_list()
                versions = set(version_list)
                self.assertEqual(len(versions), len(version_list), 'Repeated versions')
                self.assertEqual(versions, set(('v1.0', 'v2.0')))

    @uses_extra_resources(('Wirecloud_Test_2.0.wgt',), shared=True)
    def test_resource_with_several_versions(self):

        self.login()
        self.check_multiversioned_widget(admin=True)

        self.login(username='normuser')
        self.check_multiversioned_widget(admin=False)

    @uses_extra_resources(
        (
            'Wirecloud_Test_2.0.wgt',
            'Wirecloud_Test_3.0.wgt',
            'Wirecloud_Test_Selenium_1.0.wgt',
            'Wirecloud_Test_Selenium_1.0-dev.wgt',
        ),
        shared=True,
        public=False,
        creator='user_with_workspaces',
        users=('user_with_workspaces',)
    )
    def test_resource_uninstall(self):

        user_with_workspaces = User.objects.get(username='user_with_workspaces')

        test_widget = CatalogueResource.objects.get(short_name='Test', version='1.0')
        test_widget.public = False
        test_widget.users.clear()
        test_widget.users.add(user_with_workspaces)
        test_widget.groups.clear()
        test_widget.save()

        self.login(username='user_with_workspaces', next="/user_with_workspaces/pending-events")

        # add a widget using Test v3.0
        widgetV3 = self.create_widget('Test')
        widgetT1 = self.create_widget('Test_Selenium', version='1.0')
        widgetT2 = self.create_widget('Test_Selenium', version='1.0-dev')

        # Uninstall Test widget
        with self.myresources_view as myresources:
            # Uninstall all versions of the Test_Selenium widget
            myresources.uninstall_resource('Test_Selenium')
            # Uninstall only one version of the Test widget
            myresources.uninstall_resource('Test', version="1.0")

        # The workspace should contain four missig widgets and a surviving widget
        self.assertEqual(len(self.widgets), 5)
        # Test v3.0 widget is just the surviving one
        self.assertEqual(widgetV3.wait_loaded().error_count, 0)

        # But both Test_Selenium widget should be now marked as missing
        self.assertEqual(widgetT1.wait_loaded().error_count, 1)
        self.assertEqual(widgetT2.wait_loaded().error_count, 1)

        with self.edit_mode:
            # As well as the two Test v1.0 widgets
            # one in the first tab and another in the second one
            self.assertEqual(self.find_widget(title="Test 1").error_count, 1)
            self.find_tab(title="Tab 2").click()
            self.assertEqual(self.find_widget(title="Test 2").wait_loaded().error_count, 1)

    @uses_extra_resources(
        (
            'Wirecloud_Test_2.0.wgt',
            'Wirecloud_Test_3.0.wgt',
            'Wirecloud_Test_Selenium_1.0.wgt',
            'Wirecloud_Test_Selenium_1.0-dev.wgt',
        ),
        shared=True,
        public=True,
        creator='user_with_workspaces'
    )
    def test_resource_delete(self):

        self.login()

        with self.myresources_view as myresources:
            # Delete all versions of the Test_Selenium widget
            myresources.delete_resource('Test_Selenium')
            # Delete version 1.0 of the Test widget
            myresources.delete_resource('Test', version="1.0")
            # Delete also TestOperator and Test Mashup to check that
            # those components can also be removed
            myresources.delete_resource('TestOperator')
            myresources.delete_resource('Test Mashup')

        self.login(username='normuser')
        with self.myresources_view as myresources:
            myresources.search('Test_Selenium')
            self.assertIsNone(myresources.search_in_results('Test_Selenium'))

            myresources.search('Test')
            with myresources.search_in_results('Test') as test_widget:

                version_list = test_widget.get_version_list()

                versions = set(version_list)
                self.assertEqual(len(versions), len(version_list), 'Repeated versions')
                self.assertEqual(versions, set(('v2.0', 'v3.0')))

    @uses_extra_resources(('Wirecloud_Test_2.0.wgt',), shared=True)
    def test_myresources_navigation(self):

        self.login(username="user_with_markets")

        # Fill navigation history
        with self.myresources_view as myresources:
            with myresources.search_in_results('Test') as resource:
                resource.switch_to('1.0')
                resource.switch_tab('Documentation')
            with myresources.search_in_results('Test Mashup'):
                pass

        catalogue_base_element = self.myresources_view.get_current_catalogue_base_element()

        # Check navigation history has been filled correctly
        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.get_current_view() == 'myresources')
        self.assertEqual(self.myresources_view.get_subview(), 'search')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.myresources_view.get_subview() == 'details')
        WebDriverWait(self.driver, timeout=5).until(WEC.element_be_enabled((By.CSS_SELECTOR, '.details_interface'), base_element=catalogue_base_element))
        self.assertEqual(self.myresources_view.get_current_resource(), 'Test Mashup')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.myresources_view.get_subview() == 'search')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.myresources_view.get_subview() == 'details')
        WebDriverWait(self.driver, timeout=5).until(WEC.element_be_enabled((By.CSS_SELECTOR, '.details_interface'), base_element=catalogue_base_element))
        self.assertEqual(self.myresources_view.get_current_resource(), 'Test')
        current_tab = self.driver.find_element_by_css_selector('.details_interface .se-notebook-tab.selected').text
        self.assertEqual(current_tab, 'Documentation')
        self.assertEqual(self.driver.find_element_by_css_selector('.details_interface .se-select.versions .se-select-text').text, 'v1.0')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_css_selector('.details_interface .se-notebook-tab.selected').text == 'Main Info')
        self.assertEqual(self.driver.find_element_by_css_selector('.details_interface .se-select.versions .se-select-text').text, 'v1.0')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_css_selector('.details_interface .se-select.versions .se-select-text').text == 'v2.0')
        current_tab = self.driver.find_element_by_css_selector('.details_interface .se-notebook-tab.selected').text
        self.assertEqual(current_tab, 'Main Info')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.myresources_view.get_subview() == 'search')

        self.driver.back()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.get_current_view() == 'workspace')

        # Replay navigation history
        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.get_current_view() == 'myresources')
        self.assertEqual(self.myresources_view.get_subview(), 'search')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.myresources_view.get_subview() == 'details')
        WebDriverWait(self.driver, timeout=5).until(WEC.element_be_enabled((By.CSS_SELECTOR, '.details_interface'), base_element=catalogue_base_element))
        self.assertEqual(self.myresources_view.get_current_resource(), 'Test')
        current_tab = self.driver.find_element_by_css_selector('.details_interface .se-notebook-tab.selected').text
        self.assertEqual(current_tab, 'Main Info')
        self.assertEqual(self.driver.find_element_by_css_selector('.details_interface .se-select.versions .se-select-text').text, 'v2.0')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_css_selector('.details_interface .se-select.versions .se-select-text').text == 'v1.0')
        self.assertEqual(current_tab, 'Main Info')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: driver.find_element_by_css_selector('.details_interface .se-notebook-tab.selected').text == 'Documentation')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.myresources_view.get_subview() == 'search')

        self.driver.forward()
        WebDriverWait(self.driver, timeout=5).until(lambda driver: self.myresources_view.get_subview() == 'details')
        WebDriverWait(self.driver, timeout=5).until(WEC.element_be_enabled((By.CSS_SELECTOR, '.details_interface'), base_element=catalogue_base_element))
        WebDriverWait(self.driver, timeout=1).until(lambda driver: self.myresources_view.get_current_resource(), 'Test Mashup')
