# -*- coding: utf-8 -*-

# Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid

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

import errno
from unittest.mock import Mock, patch, DEFAULT

from django.test import TestCase

from wirecloud.catalogue.utils import add_packaged_resource, update_resource_catalogue_cache
from wirecloud.commons.utils.template import TemplateParseException
from wirecloud.commons.utils.wgt import InvalidContents


# Avoid nose to repeat these tests (they are run through wirecloud/catalogue/tests/__init__.py)
__test__ = False


class TestQueryResult(object):

    def __init__(self, result):
        self.result = result

    def __iter__(self):
        return self.result.__iter__()

    def count(self):
        return len(self.result)


class CatalogueUtilsTestCase(TestCase):

    tags = ('wirecloud-catalogue', 'wirecloud-catalogue-noselenium', 'wirecloud-noselenium')

    def test_update_resource_catalogue_cache_no_resources(self):

        orm = Mock()
        orm.CatalogueResource.objects.all.return_value = TestQueryResult([])
        update_resource_catalogue_cache(orm)

    def build_mac_mocks(self):

        mac1 = Mock()
        mac1.vendor = "Wirecloud"
        mac1.short_name = "mac1"
        mac1.version = "1.0"
        mac1.template_uri = "Wirecloud_mac1_1.0.wgt"

        mac2 = Mock()
        mac2.vendor = "Wirecloud"
        mac2.short_name = "mac2"
        mac2.version = "1.0"
        mac2.template_uri = "Wirecloud_mac2_1.0.wgt"

        return mac1, mac2

    def test_update_resource_catalogue_cache(self):

        mac1, mac2 = self.build_mac_mocks()

        parser_mac1 = Mock()
        parser_mac1.get_resource_info.return_value = "mac1_json"
        parser_mac2 = Mock()
        parser_mac2.get_resource_info.return_value = "mac2_json"

        orm = Mock()
        orm.CatalogueResource.objects.all.return_value = TestQueryResult([mac1, mac2])
        with patch.multiple('wirecloud.catalogue.utils', WgtFile=DEFAULT, TemplateParser=DEFAULT, autospec=True) as context:
            context['TemplateParser'].side_effect = (parser_mac1, parser_mac2)

            update_resource_catalogue_cache(orm)

        self.assertTrue(mac1.save.called)
        self.assertFalse(mac1.delete.called)
        self.assertTrue(mac2.save.called)
        self.assertFalse(mac2.delete.called)

    def test_update_resource_catalogue_cache_unsupported_resource(self):

        mac1, mac2 = self.build_mac_mocks()

        parser_mac1 = Mock()
        parser_mac1.get_resource_info.return_value = "mac1_json"

        orm = Mock()
        orm.CatalogueResource.objects.all.return_value = TestQueryResult([mac1, mac2])
        with patch.multiple('wirecloud.catalogue.utils', WgtFile=DEFAULT, TemplateParser=DEFAULT, autospec=True) as context:
            context['TemplateParser'].side_effect = (parser_mac1, TemplateParseException('test'))

            with self.settings(WIRECLOUD_REMOVE_UNSUPPORTED_RESOURCES_MIGRATION=False):
                self.assertRaises(Exception, update_resource_catalogue_cache, orm)

        # It's not important if update_resource_catalogue_cache calls to the save method of mac1,
        # as it will be rolled back by the db engine
        self.assertFalse(mac1.delete.called)
        self.assertFalse(mac2.save.called)
        self.assertFalse(mac2.delete.called)

    def test_update_resource_catalogue_cache_autoremove_unsupported_resource(self):

        mac1, mac2 = self.build_mac_mocks()

        parser_mac1 = Mock()
        parser_mac1.get_resource_info.return_value = "mac1_json"

        orm = Mock()
        orm.CatalogueResource.objects.all.return_value = TestQueryResult([mac1, mac2])
        with patch.multiple('wirecloud.catalogue.utils', WgtFile=DEFAULT, TemplateParser=DEFAULT, autospec=True) as context:
            context['TemplateParser'].side_effect = (parser_mac1, TemplateParseException('test'))

            with self.settings(WIRECLOUD_REMOVE_UNSUPPORTED_RESOURCES_MIGRATION=True):
                update_resource_catalogue_cache(orm)

        self.assertTrue(mac1.save.called)
        self.assertFalse(mac1.delete.called)
        self.assertTrue(mac2.delete.called)

    def test_update_resource_catalogue_cache_from_normal_code(self):

        # test calling the update_resource_catalogue_cache function without using a custom ORM (like when it is called from south_migrations)

        mac1, mac2 = self.build_mac_mocks()

        parser_mac1 = Mock()
        parser_mac1.get_resource_info.return_value = "mac1_json"
        parser_mac2 = Mock()
        parser_mac2.get_resource_info.return_value = "mac2_json"

        CatalogueResource_mock = Mock()
        CatalogueResource_mock.objects.all.return_value = TestQueryResult([mac1, mac2])
        with patch('wirecloud.catalogue.utils.CatalogueResource', CatalogueResource_mock):
            with patch.multiple('wirecloud.catalogue.utils', WgtFile=DEFAULT, TemplateParser=DEFAULT, autospec=True) as context:
                context['TemplateParser'].side_effect = (parser_mac1, parser_mac2)

                update_resource_catalogue_cache()

        self.assertTrue(mac1.save.called)
        self.assertFalse(mac1.delete.called)
        self.assertTrue(mac2.save.called)
        self.assertFalse(mac2.delete.called)

    def test_update_resource_catalogue_cache_using_templates(self):

        # WireCloud should support external resources (through the template_url and fromWGT fields) for being able to migrate them

        mac1, mac2 = self.build_mac_mocks()
        mac1.fromWGT = False

        parser_mac1 = Mock()
        parser_mac1.get_resource_info.return_value = "mac1_json"
        parser_mac2 = Mock()
        parser_mac2.get_resource_info.return_value = "mac2_json"

        CatalogueResource_mock = Mock()
        CatalogueResource_mock.objects.all.return_value = TestQueryResult([mac1, mac2])
        with patch('wirecloud.catalogue.utils.CatalogueResource', CatalogueResource_mock):
            with patch.multiple('wirecloud.catalogue.utils', WgtFile=DEFAULT, TemplateParser=DEFAULT, download_http_content=DEFAULT, autospec=True) as context:
                context['TemplateParser'].side_effect = (parser_mac1, parser_mac2)

                update_resource_catalogue_cache()

        self.assertTrue(mac1.save.called)
        self.assertFalse(mac1.delete.called)
        self.assertTrue(mac2.save.called)
        self.assertFalse(mac2.delete.called)

    def test_update_resource_catalogue_cache_error_reading_wgt_file(self):

        mac1, mac2 = self.build_mac_mocks()

        parser_mac1 = Mock()
        parser_mac1.get_resource_info.return_value = "mac1_json"

        orm = Mock()
        orm.CatalogueResource.objects.all.return_value = TestQueryResult([mac1, mac2])
        with patch.multiple('wirecloud.catalogue.utils', WgtFile=DEFAULT, TemplateParser=DEFAULT, autospec=True) as context:
            context['WgtFile'].side_effect = (Mock(), IOError(errno.EPERM, "Forbidden"))
            context['TemplateParser'].side_effect = (parser_mac1, TemplateParseException('test'))

            with self.settings(WIRECLOUD_REMOVE_UNSUPPORTED_RESOURCES_MIGRATION=True):
                self.assertRaises(Exception, update_resource_catalogue_cache, orm)

        # It's not important if update_resource_catalogue_cache calls to the save method of mac1,
        # as it will be rolled back by the db engine
        self.assertFalse(mac1.delete.called)
        self.assertFalse(mac2.save.called)
        self.assertFalse(mac2.delete.called)

    def build_add_packaged_resouce_mocks(self, files, invalid_files):

        file_mocks = {}

        def read_file(key):
            if key not in files:
                raise KeyError()
            elif key in invalid_files:
                return 'á'.encode('iso-8859-1')
            else:
                mock = Mock()
                file_mocks[key] = mock
                return mock

        f = Mock()
        user = Mock()
        wgt_file = Mock()
        wgt_file.read.side_effect = read_file
        wgt_file.namelist.return_value = files
        template = Mock()
        template.get_resource_info.return_value = {
            'type': 'widget',
            'image': '',
            'smartphoneimage': '',
            'doc': 'doc/index.md',
            'longdescription': 'DESCRIPTION.md',
            'changelog': 'CHANGELOG.md',
            'contents': {
                'src': 'index.html',
                'charset': 'utf-8',
            },
            'version': '1.0',
            'vendor': 'Wirecloud',
            'name': 'Test'
        }

        return f, user, wgt_file, template, file_mocks

    def test_add_packaged_resource_invalid_longdescription_encoding(self):
        f, user, wgt_file, template, file_mocks = self.build_add_packaged_resouce_mocks(['index.html', 'DESCRIPTION.md', 'CHANGELOG.md'], ['DESCRIPTION.md'])

        with patch('wirecloud.catalogue.utils.extract_resource_media_from_package'):
            try:
                add_packaged_resource(f, user, wgt_file=wgt_file, template=template, deploy_only=True)
                self.fail('Expecting InvalidContents exception to be raised')
            except InvalidContents as e:
                self.assertIn('DESCRIPTION.md', str(e))
            wgt_file.read.assert_called_with('DESCRIPTION.md')

    def test_add_packaged_resource_missing_longdescription_file(self):
        f, user, wgt_file, template, file_mocks = self.build_add_packaged_resouce_mocks(['index.html', 'doc/index.md', 'CHANGELOG.md'], [])

        with patch('wirecloud.catalogue.utils.extract_resource_media_from_package'):
            try:
                add_packaged_resource(f, user, wgt_file=wgt_file, template=template, deploy_only=True)
                self.fail('Expecting InvalidContents exception to be raised')
            except InvalidContents as e:
                self.assertIn('DESCRIPTION.md', str(e))

    def test_add_packaged_resource_invalid_translated_longdescription_encoding(self):
        f, user, wgt_file, template, file_mocks = self.build_add_packaged_resouce_mocks(['index.html', 'DESCRIPTION.md', 'doc/index.md', 'DESCRIPTION.es.md', 'CHANGELOG.md'], ['DESCRIPTION.es.md'])

        with patch('wirecloud.catalogue.utils.extract_resource_media_from_package'):
            try:
                add_packaged_resource(f, user, wgt_file=wgt_file, template=template, deploy_only=True)
                self.fail('Expecting InvalidContents exception to be raised')
            except InvalidContents as e:
                self.assertIn('DESCRIPTION.es.md', str(e))

    def test_add_packaged_resource_missing_userguide_file(self):
        f, user, wgt_file, template, file_mocks = self.build_add_packaged_resouce_mocks(['index.html', 'DESCRIPTION.md', 'CHANGELOG.md'], [])

        with patch('wirecloud.catalogue.utils.extract_resource_media_from_package'):
            try:
                add_packaged_resource(f, user, wgt_file=wgt_file, template=template, deploy_only=True)
                self.fail('Expecting InvalidContents exception to be raised')
            except InvalidContents as e:
                self.assertIn('doc/index.md', str(e))

    def test_add_packaged_resource_invalid_translated_userguide_encoding(self):
        f, user, wgt_file, template, file_mocks = self.build_add_packaged_resouce_mocks(['index.html', 'DESCRIPTION.md', 'doc/index.md', 'doc/index.es.md', 'CHANGELOG.md'], ['doc/index.es.md'])

        with patch('wirecloud.catalogue.utils.extract_resource_media_from_package'):
            try:
                add_packaged_resource(f, user, wgt_file=wgt_file, template=template, deploy_only=True)
                self.fail('Expecting InvalidContents exception to be raised')
            except InvalidContents as e:
                self.assertIn('doc/index.es.md', str(e))

    def test_add_packaged_resource_missing_changelog_file(self):
        f, user, wgt_file, template, file_mocks = self.build_add_packaged_resouce_mocks(['index.html', 'doc/index.md', 'DESCRIPTION.md'], [])

        with patch('wirecloud.catalogue.utils.extract_resource_media_from_package'):
            try:
                add_packaged_resource(f, user, wgt_file=wgt_file, template=template, deploy_only=True)
                self.fail('Expecting InvalidContents exception to be raised')
            except InvalidContents as e:
                self.assertIn('CHANGELOG.md', str(e))

    def test_add_packaged_resource_invalid_translated_changelog_encoding(self):
        f, user, wgt_file, template, file_mocks = self.build_add_packaged_resouce_mocks(['index.html', 'DESCRIPTION.md', 'doc/index.md', 'CHANGELOG.es.md', 'CHANGELOG.md'], ['CHANGELOG.es.md'])

        with patch('wirecloud.catalogue.utils.extract_resource_media_from_package'):
            try:
                add_packaged_resource(f, user, wgt_file=wgt_file, template=template, deploy_only=True)
                self.fail('Expecting InvalidContents exception to be raised')
            except InvalidContents as e:
                self.assertIn('CHANGELOG.es.md', str(e))
