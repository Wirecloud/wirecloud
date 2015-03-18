# -*- coding: utf-8 -*-

# Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.test import TestCase
from mock import Mock, patch, DEFAULT

from wirecloud.catalogue.utils import update_resource_catalogue_cache
from wirecloud.commons.utils.template import TemplateParseException


class TestQueryResult(object):

    def __init__(self, result):
        self.result = result

    def __iter__(self):
        return self.result.__iter__()

    def count(self):
        return len(self.result)


class CatalogueUtilsTestCase(TestCase):

    tags = ('wirecloud-catalogue',)

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
            with patch.multiple('wirecloud.catalogue.utils', WgtFile=DEFAULT, TemplateParser=DEFAULT, autospec=True) as context:
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
