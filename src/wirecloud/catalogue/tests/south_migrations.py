# -*- coding: utf-8 -*-

# Copyright (c) 2014 CoNWeT Lab., Universidad Politécnica de Madrid

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

from django.test import TestCase
from mock import Mock, patch
from south.migration import Migrations
import six


class TestQueryResult(object):

    def __init__(self, result):
        self.result = result

    def __iter__(self):
        return self.result.__iter__()

    def count(self):
        return len(self.result)


class CatalogueSouthMigrationsTestCase(TestCase):

    tags = ('catalogue-migrations',)

    def _pick_migration(self, migration_name):
        """
        This method will pick a migration object from the catalogue app
        """
        migrations = Migrations('catalogue')
        for migration in migrations:
            if migration.full_name().split('.')[-1] == migration_name:
                return migration

        return None

    def test_remove_tag_vote_and_category_support_backwards(self):
        migration = self._pick_migration('0003_remove_tag_vote_and_category_support')
        orm = Mock(autospec=migration.prev_orm())
        available_models = {
            'auth.user': Mock(),
            'auth.group': Mock(),
            'catalogue.catalogueresource': Mock(),
            'catalogue.category': Mock(),
            'catalogue.tag': Mock(),
        }
        orm.__getitem__ = lambda self, model: available_models[model.lower()]
        with patch('wirecloud.catalogue.south_migrations.0003_remove_tag_vote_and_category_support.db', autospec=True):
            with patch('wirecloud.catalogue.south_migrations.0003_remove_tag_vote_and_category_support.models', autospec=True):
                migration_instance = migration.migration_instance()
                with patch.object(migration_instance, 'gf', autospec=True):
                    migration_instance.backwards(orm)

    def test_refresh_resource_cache_forwards_no_resources(self):
        migration = self._pick_migration('0004_refresh_resource_cache')
        orm = Mock(autospec=migration.orm())
        orm.CatalogueResource.objects.all.return_value = TestQueryResult([])
        migration.migration_instance().forwards(orm)

    def test_metadata_cleanup_migration_backwards(self):
        migration = self._pick_migration('0005_metadata_cleanup')
        orm = Mock(autospec=migration.prev_orm())
        self.assertRaises(RuntimeError, migration.migration_instance().backwards, orm)

    def test_remove_resources_from_template_url_forwards_no_conflict(self):
        migration = self._pick_migration('0007_remove_resources_from_template_url')
        orm = Mock(autospec=migration.orm())
        orm.CatalogueResource.objects.filter.return_value = TestQueryResult([])
        migration.migration_instance().forwards(orm)
        orm.CatalogueResource.objects.filter.assert_called_once_with(fromWGT=False)

    def test_remove_resources_from_template_url_forwards_conflict(self):

        resource_from_template = Mock()
        resource_from_template.vendor = 'Wirecloud'
        resource_from_template.short_name = 'test'
        resource_from_template.version = '1.0'
        resource_from_template.fromWGT = True

        migration = self._pick_migration('0007_remove_resources_from_template_url')
        orm = Mock(autospec=migration.orm())
        orm.CatalogueResource.objects.filter.return_value = TestQueryResult([resource_from_template])
        with self.settings(WIRECLOUD_REMOVE_UNSUPPORTED_RESOURCES_MIGRATION=False):
            self.assertRaises(Exception, migration.migration_instance().forwards, orm)
        self.assertEqual(len(resource_from_template.delete.mock_calls), 0)
        orm.CatalogueResource.objects.filter.assert_called_once_with(fromWGT=False)

    def test_remove_resources_from_template_url_forwards_conflict_allow_remove(self):

        resource_from_template = Mock()
        resource_from_template.vendor = 'Wirecloud'
        resource_from_template.short_name = 'test'
        resource_from_template.version = '1.0'
        resource_from_template.fromWGT = True

        migration = self._pick_migration('0007_remove_resources_from_template_url')
        orm = Mock(autospec=migration.orm())
        orm.CatalogueResource.objects.filter.return_value = TestQueryResult([resource_from_template])
        with self.settings(WIRECLOUD_REMOVE_UNSUPPORTED_RESOURCES_MIGRATION=True):
            migration.migration_instance().forwards(orm)
        self.assertEqual(len(resource_from_template.delete.mock_calls), 1)
        orm.CatalogueResource.objects.filter.assert_called_once_with(fromWGT=False)

    def test_remove_resources_from_template_url_backwards(self):
        migration = self._pick_migration('0007_remove_resources_from_template_url')
        orm = Mock(autospec=migration.prev_orm())
        migration.migration_instance().backwards(orm)
