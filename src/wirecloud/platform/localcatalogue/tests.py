# -*- coding: utf-8 -*-

# Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import unicode_literals

from io import BytesIO
import json
import os.path
import zipfile

from django.contrib.auth.models import User, Group
from django.core.urlresolvers import reverse
from django.test import Client
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from wirecloud.catalogue import utils as catalogue
from wirecloud.catalogue.models import CatalogueResource
import wirecloud.commons
from wirecloud.commons.utils import expected_conditions as WEC
from wirecloud.commons.utils.template import TemplateParser, TemplateParseException
from wirecloud.commons.utils.testcases import uses_extra_resources, DynamicWebServer, WirecloudSeleniumTestCase, WirecloudTestCase
from wirecloud.commons.utils.wgt import WgtFile
from wirecloud.platform.localcatalogue.utils import install_resource, install_resource_to_user
import wirecloud.platform.widget.utils
from wirecloud.platform.models import Widget, XHTML


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


BASIC_HTML_GADGET_CODE = b"<html><body><p>widget code</p></body></html>"


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

    def build_simple_wgt(self, template_name, html_content=None, other_files=()):

        template = self.read_template(template_name)

        f = BytesIO()
        zf = zipfile.ZipFile(f, 'w')
        zf.writestr('config.xml', template)
        zf.writestr('test.html', html_content or BASIC_HTML_GADGET_CODE)
        zf.writestr('doc/', b'') # TODO
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
        self.assertEqual(data['smartphoneimage'], 'images/catalogue_iphone.png')
        self.assertEqual(data['doc'], 'doc/index.html')
        self.assertEqual(data['license'], 'Apache License 2.0')
        self.assertEqual(data['licenseurl'], 'http://www.apache.org/licenses/LICENSE-2.0.html')

        self.assertEqual(len(data['properties']), 1)
        self.assertEqual(data['properties'], [{'default': '', 'secure': False, 'name': 'prop', 'label': 'Property label', 'type': 'text', 'description': ''}])

        self.assertEqual(len(data['preferences']), 1)
        self.assertEqual(data['preferences'], [{'default': 'value', 'secure': False, 'name': 'pref', 'label': 'Preference label', 'type': 'list', 'options': [{'value': '1', 'label': 'Option name'}], 'readonly': False, 'description': 'Preference description', 'value': None}])

        self.assertEqual(len(data['wiring']['inputs']), 1)
        self.assertEqual(data['wiring']['inputs'], [{'name': 'slot', 'label': 'Slot label', 'type': 'text', 'description': '','friendcode': 'test_friend_code', 'actionlabel': ''}])

        self.assertEqual(len(data['wiring']['outputs']), 1)
        self.assertEqual(data['wiring']['outputs'], [{'name': 'event', 'label': 'Event label', 'type': 'text', 'description': '', 'friendcode': 'test_friend_code'}])

    def test_widget_with_minimal_info(self):

        file_contents = self.build_simple_wgt('template9.xml')
        resource = install_resource_to_user(self.user, file_contents=file_contents)

        resource_info = json.loads(resource.json_description)
        self.assertEqual(resource.vendor, 'Wirecloud')
        self.assertEqual(resource.short_name, 'test')
        self.assertEqual(resource.version, '0.1')
        self.assertEqual(resource_info['email'], 'test@example.com')
        self.assertFalse(resource.public)
        self.assertEqual(tuple(resource.users.values_list('username', flat=True)), ('test',))
        self.assertEqual(tuple(resource.groups.values_list('name', flat=True)), ())

    def test_basic_widget_creation(self):

        file_contents = self.build_simple_wgt('template1.xml', other_files=('images/catalogue.png', 'images/catalogue_iphone.png', 'doc/index.html'))
        resource = install_resource_to_user(self.user, file_contents=file_contents)

        self.check_basic_widget_info(resource)

    def test_basic_widget_creation_from_rdf(self):

        file_contents = self.build_simple_wgt('template1.rdf', other_files=('images/catalogue.png', 'images/catalogue_iphone.png',))
        resource = install_resource_to_user(self.user, file_contents=file_contents)

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
        widget_id = {'vendor': 'Wirecloud', 'name': 'test', 'version': '0.1'}

        file_contents = self.build_simple_wgt('template1.xml')
        resource = install_resource_to_user(self.user, file_contents=file_contents)
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
        file_contents = self.build_simple_wgt('template1.xml', b'code')
        resource = install_resource_to_user(self.user, file_contents=file_contents)

        response = client.get(reverse('wirecloud.widget_code_entry', kwargs=widget_id))
        self.assertEqual(response.status_code, 200)
        new_code = response.content

        self.assertNotEqual(old_code, new_code)

    def test_widget_with_missing_translation_indexes(self):

        file_contents = self.build_simple_wgt('template3.xml')

        self.assertRaises(TemplateParseException, install_resource, file_contents, self.user)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

    def test_widget_with_notused_translation_indexes(self):

        file_contents = self.build_simple_wgt('template4.xml')

        self.assertRaises(TemplateParseException, install_resource, file_contents, self.user)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='test', version='0.1')

    def test_template_translations(self):

        file_contents = self.build_simple_wgt('template1.xml', other_files=('images/catalogue.png', 'images/catalogue_iphone.png',))

        resource = install_resource_to_user(self.user, file_contents=file_contents)

        self.changeLanguage('es')
        data = resource.get_processed_info(process_urls=False)
        self.assertEqual(data['vendor'], 'Wirecloud')
        self.assertEqual(data['name'], 'test')
        self.assertEqual(data['version'], '0.1')
        self.assertEqual(data['title'], 'Widget de prueba')
        self.assertEqual(data['description'], 'Descripción del Widget de pruebas')
        self.assertEqual(data['image'], 'images/catalogue.png')
        self.assertEqual(data['smartphoneimage'], 'images/catalogue_iphone.png')
        self.assertEqual(data['doc'], 'doc/index.html')

        self.assertEqual(len(data['properties']), 1)
        self.assertEqual(data['properties'], [{'default': '', 'secure': False, 'name': 'prop', 'label': 'Etiqueta de la propiedad', 'type': 'text', 'description': ''}])

        self.assertEqual(len(data['preferences']), 1)
        self.assertEqual(data['preferences'], [{'default': 'value', 'secure': False, 'name': 'pref', 'label': 'Etiqueta de la preferencia', 'type': 'list', 'options': [{'value': '1', 'label': 'Nombre de la opción'}], 'readonly': False, 'description': 'Descripción de la preferencia', 'value': None}])

        self.assertEqual(len(data['wiring']['inputs']), 1)
        self.assertEqual(data['wiring']['inputs'], [{'name': 'slot', 'label': 'Etiqueta del endpoint de entrada', 'type': 'text', 'description': '','friendcode': 'test_friend_code', 'actionlabel': ''}])

        self.assertEqual(len(data['wiring']['outputs']), 1)
        self.assertEqual(data['wiring']['outputs'], [{'name': 'event', 'label': 'Etiqueta del endpoint de salida', 'type': 'text', 'description': '', 'friendcode': 'test_friend_code'}])

    def test_repeated_translation_indexes(self):

        file_contents = self.build_simple_wgt('template2.xml')

        resource = install_resource(file_contents, self.user)

        data = resource.get_processed_info()
        self.assertEqual(data['title'], 'Test Widget')
        self.assertEqual(data['version'], '0.2')

        self.assertEqual(len(data['properties']), 1)
        self.assertEqual(data['properties'], [{'default': '', 'secure': False, 'name': 'prop', 'label': 'Label', 'type': 'text', 'description': ''}])

        self.assertEqual(len(data['preferences']), 1)
        self.assertEqual(data['preferences'], [{'default': 'value', 'secure': False, 'name': 'pref', 'label': 'Label', 'readonly': False, 'type': 'text', 'description': 'Preference description', 'value': None}])

        self.assertEqual(len(data['wiring']['inputs']), 1)
        self.assertEqual(data['wiring']['inputs'], [{'name': 'slot', 'label': 'Label', 'type': 'text', 'description': '','friendcode': 'test_friend_code', 'actionlabel': ''}])

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
        resource = install_resource_to_user(self.user, file_contents=file_contents)

        self.assertEqual(resource.vendor, 'Wirecloud Test Suite')
        self.assertEqual(resource.short_name, 'Test Mashup')
        self.assertEqual(resource.version, '1')
        self.assertTrue(resource.is_available_for(self.user))

    def test_basic_mashup_rdf(self):

        file_contents = self.build_simple_wgt(os.path.join('..', '..', 'workspace', 'test-data', 'wt1.rdf'))
        resource = install_resource_to_user(self.user, file_contents=file_contents)

        self.assertEqual(resource.vendor, 'Wirecloud Test Suite')
        self.assertEqual(resource.short_name, 'Test Mashup')
        self.assertEqual(resource.version, '1')
        self.assertTrue(resource.is_available_for(self.user))


class PackagedResourcesTestCase(WirecloudTestCase):

    tags = ('localcatalogue',)

    def setUp(self):

        super(PackagedResourcesTestCase, self).setUp()
        self.user = User.objects.create_user('test', 'test@example.com', 'test')

    def test_basic_packaged_widget_deployment(self):

        wgt_file = WgtFile(os.path.join(os.path.dirname(__file__), 'test-data', 'basic_widget.wgt'))
        catalogue_deployment_path = catalogue.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')
        deployment_path = wirecloud.platform.widget.utils.wgt_deployer.get_base_dir('Morfeo', 'Test', '0.1')

        install_resource_to_user(self.user, file_contents=wgt_file)
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

        self.assertRaises(TemplateParseException, install_resource, wgt_file, self.user)
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Morfeo', short_name='Test', version='0.1')
        self.assertFalse(os.path.exists(deployment_path))
        self.assertFalse(os.path.exists(catalogue_deployment_path))

    def test_basic_packaged_mashup_deployment(self):

        wgt_file = WgtFile(os.path.join(os.path.dirname(wirecloud.commons.__file__), 'test-data', 'Wirecloud_PackagedTestMashup_1.0.zip'))
        deployment_path = catalogue.wgt_deployer.get_base_dir('Wirecloud', 'PackagedTestMashup', '1.0')

        install_resource_to_user(self.user, file_contents=wgt_file)
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='PackagedTestMashup', version='1.0')
        self.assertTrue(os.path.isdir(deployment_path))

        resource.delete()
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='PackagedTestMashup', version='1.0')
        self.assertFalse(os.path.exists(deployment_path))

    def test_basic_packaged_operator_deployment(self):

        wgt_file = WgtFile(os.path.join(os.path.dirname(wirecloud.commons.__file__), 'test-data', 'Wirecloud_TestOperator_1.0.zip'))
        deployment_path = catalogue.wgt_deployer.get_base_dir('Wirecloud', 'TestOperator', '1.0')

        install_resource_to_user(self.user, file_contents=wgt_file)
        resource = CatalogueResource.objects.get(vendor='Wirecloud', short_name='TestOperator', version='1.0')
        self.assertTrue(os.path.isdir(deployment_path))

        resource.delete()
        self.assertRaises(CatalogueResource.DoesNotExist, CatalogueResource.objects.get, vendor='Wirecloud', short_name='TestOperator', version='1.0')
        self.assertFalse(os.path.exists(deployment_path))


class LocalCatalogueSeleniumTests(WirecloudSeleniumTestCase):

    fixtures = ('initial_data', 'selenium_test_data', 'user_with_workspaces')
    tags = ('localcatalogue', 'localcatalogue-selenium')

    def test_basic_resource_details(self):

        self.login()

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

        with self.myresources_view as myresources:
            myresources.search('Test')
            widget = myresources.search_in_results('Test')
            self.assertIsNotNone(widget)

            test_widget.public = False
            test_widget.users.clear()
            test_widget.save()

            myresources.search('Test')
            widget = myresources.search_in_results('Test')
            self.assertIsNone(widget)

            test_widget.users.add(norm_user)

            myresources.search('Test')
            widget = myresources.search_in_results('Test')
            self.assertIsNotNone(widget)

            test_widget.users.remove(norm_user)
            test_widget.groups.add(normusers_group)

            myresources.search('Test')
            widget = myresources.search_in_results('Test')
            self.assertIsNotNone(widget)

    def test_resource_deletion(self):

        self.login()

        # Add a Test widget to the initial workspace and cache it
        self.add_widget_to_mashup('Test')
        self.change_current_workspace('Workspace')

        # Create a new workspace with a test widget
        self.create_workspace(name='Test')
        self.add_widget_to_mashup('Test')

        # Delete Test widget
        with self.myresources_view as myresources:
            myresources.delete_resource('Test')

        # Check current workspace has no widgets
        self.assertEqual(self.count_iwidgets(), 0)

        # Check initial workspace has no widgets
        self.change_current_workspace('Workspace')
        self.assertEqual(self.count_iwidgets(), 0)

        # Check normuser also has no access to the Test widget
        self.login(username='normuser')
        with self.myresources_view as myresources:
            myresources.search('Test')
            widget = myresources.search_in_results('Test')
            self.assertIsNone(widget)

    def test_public_resources_are_uninstallable(self):

        self.login(username='normuser')

        with self.myresources_view as myresources:
            myresources.uninstall_resource('Test', expect_error=True)

    def test_resource_uninstall(self):

        test_widget = CatalogueResource.objects.get(short_name='Test')
        test_widget.public = False
        test_widget.save()

        self.login(username='normuser')

        # Add a Test widget to the initial workspace and cache it
        self.add_widget_to_mashup('Test')
        self.change_current_workspace('Workspace')

        # Create a new workspace with a test widget
        self.create_workspace(name='Test')
        self.add_widget_to_mashup('Test')

        # Uninstall Test widget
        with self.myresources_view as myresources:
            myresources.uninstall_resource('Test')

        # Check current workspace has no widgets
        self.assertEqual(self.count_iwidgets(), 0)

        # Check initial workspace has no widgets
        self.change_current_workspace('Workspace')
        self.assertEqual(self.count_iwidgets(), 0)

        # Check admin still has access to the Test widget
        self.login()

        self.add_widget_to_mashup('Test')

    def test_resource_uninstall_last_usage(self):

        norm_user = User.objects.get(username='normuser')

        test_widget = CatalogueResource.objects.get(short_name='Test')
        test_widget.public = False
        test_widget.users.clear()
        test_widget.users.add(norm_user)
        test_widget.groups.clear()
        test_widget.save()

        self.login(username='normuser')

        # Add a Test widget to the initial workspace and cache it
        self.add_widget_to_mashup('Test')
        self.change_current_workspace('Workspace')

        # Create a new workspace with a test widget
        self.create_workspace(name='Test')
        self.add_widget_to_mashup('Test')

        # Uninstall Test widget
        with self.myresources_view as myresources:
            myresources.uninstall_resource('Test')

        # Check current workspace has no widgets
        self.assertEqual(self.count_iwidgets(), 0)

        # Check initial workspace has no widgets
        self.change_current_workspace('Workspace')
        self.assertEqual(self.count_iwidgets(), 0)

    def test_resources_are_always_deletable_by_superusers(self):

        self.login()

        with self.myresources_view as myresources:
            myresources.delete_resource('Test')
            myresources.delete_resource('TestOperator')
            myresources.delete_resource('Test Mashup')

    def check_multiversioned_widget(self, admin):

        with self.myresources_view as myresources:
            with myresources.search_in_results('Test') as test_widget:

                operations = [operation.text for operation in test_widget.details.find_elements_by_css_selector('.advanced_operations .styled_button')]
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

    @uses_extra_resources(('Wirecloud_Test_2.0.wgt',), shared=True, public=False, users=('user_with_workspaces',))
    def test_resource_uninstall_all_version(self):

        user_with_workspaces = User.objects.get(username='user_with_workspaces')

        test_widget = CatalogueResource.objects.get(short_name='Test', version='1.0')
        test_widget.public = False
        test_widget.users.clear()
        test_widget.users.add(user_with_workspaces)
        test_widget.groups.clear()
        test_widget.save()

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        self.add_widget_to_mashup('Test')

        # Uninstall all Test widget versions
        with self.myresources_view as myresources:
            myresources.uninstall_resource('Test')

        final_widgets = self.get_current_iwidgets()
        self.assertEqual(final_widgets, [])

    @uses_extra_resources(('Wirecloud_Test_2.0.wgt',), shared=True, public=False, users=('user_with_workspaces',))
    def test_resource_uninstall_version(self):

        self.login(username='user_with_workspaces', next='/user_with_workspaces/Pending Events')

        initial_widgets = self.get_current_iwidgets()

        # This is the only widget using version 2.0 and should automatically be
        # removed after uninstalling version 2.0 of the Test widget
        self.add_widget_to_mashup('Test')

        # Uninstall Test widget
        with self.myresources_view as myresources:
            myresources.uninstall_resource('Test', version="2.0")

        final_widgets = self.get_current_iwidgets()
        self.assertEqual(final_widgets, initial_widgets)

    @uses_extra_resources(('Wirecloud_Test_2.0.wgt',), shared=True)
    def test_resource_delete_all_version(self):

        self.login()

        # Delete all versions of the Test widget
        with self.myresources_view as myresources:
            myresources.delete_resource('Test')

        self.login(username='normuser')
        with self.myresources_view as myresources:
            myresources.search('Test')
            self.assertIsNone(myresources.search_in_results('Test'))

    @uses_extra_resources(('Wirecloud_Test_2.0.wgt',), shared=True)
    def test_resource_delete_version(self):

        self.login()

        # Delete Test widget
        with self.myresources_view as myresources:
            myresources.delete_resource('Test', version="1.0")

        self.login(username='normuser')
        with self.myresources_view as myresources:
            myresources.wait_catalogue_ready()

            with myresources.search_in_results('Test') as test_widget:

                version_list = test_widget.get_version_list()

                versions = set(version_list)
                self.assertEqual(len(versions), len(version_list), 'Repeated versions')
                self.assertEqual(versions, set(('v2.0',)))

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
        self.assertEqual(self.myresources_view.get_current_resource(), 'Test Mashup')
