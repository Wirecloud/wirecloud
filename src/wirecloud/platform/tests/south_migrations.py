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
        self.update = Mock()
        self.delete = Mock()

    def __iter__(self):
        return self.result.__iter__()

    def count(self):
        return len(self.result)


class PlatformSouthMigrationsTestCase(TestCase):

    tags = ('wirecloud-migrations',)

    def _pick_migration(self, migration_name):
        """
        This method will pick a migration object from the catalogue app
        """
        migrations = Migrations('platform')
        for migration in migrations:
            if migration.full_name().split('.')[-1] == migration_name:
                return migration

        return None

    def test_remove_userprefoption_model_and_metadata_fields_backwards(self):

        migration = self._pick_migration('0012_remove_userprefoption_model_and_metadata_fields')
        orm = Mock(autospec=migration.prev_orm())
        available_models = {
            'platform.variabledef': Mock(),
        }
        orm.__getitem__ = lambda self, model: available_models[model.lower()]
        with patch('wirecloud.platform.south_migrations.0012_remove_userprefoption_model_and_metadata_fields.db', autospec=True):
            migration_instance = migration.migration_instance()
            with patch.object(migration_instance, 'gf', autospec=True):
                migration_instance.backwards(orm)

    def test_del_variabledefattr_backwards(self):

        migration = self._pick_migration('0013_del_variabledefattr')
        orm = Mock(autospec=migration.prev_orm())
        available_models = {
            'platform.variabledef': Mock(),
        }
        orm.__getitem__ = lambda self, model: available_models[model.lower()]
        with patch('wirecloud.platform.south_migrations.0013_del_variabledefattr.db', autospec=True):
            migration_instance = migration.migration_instance()
            with patch.object(migration_instance, 'gf', autospec=True):
                migration_instance.backwards(orm)

    def test_improve_workspace_metadata_backwards(self):

        migration = self._pick_migration('0014_improve_workspace_metadata')
        orm = Mock(autospec=migration.prev_orm())
        with patch('wirecloud.platform.south_migrations.0014_improve_workspace_metadata.db', autospec=True):
            migration.migration_instance().backwards(orm)

    def test_rename_targetOrganizations_to_groups_backwards(self):

        migration = self._pick_migration('0015_rename_targetOrganizations_to_groups')
        orm = Mock(autospec=migration.prev_orm())
        with patch('wirecloud.platform.south_migrations.0015_rename_targetOrganizations_to_groups.db', autospec=True):
            migration.migration_instance().backwards(orm)

    def test_restructure_layout_preferences_forwards(self):

        empty_workspace = Mock()
        empty_workspace_layout_pref = Mock()
        empty_workspace_layout_preferences = TestQueryResult([])
        empty_workspace.workspacepreference_set.filter.side_effect = lambda **kwargs: empty_workspace_layout_pref if kwargs.get('name') == 'layout' else empty_workspace_layout_preferences
        empty_workspace.tab_set.all.return_value = TestQueryResult([])

        workspace = Mock()
        workspace_layout_pref = Mock()
        workspace_columns_pref = Mock()
        workspace_columns_pref.name = 'columns'
        workspace_columns_pref.value = 15
        workspace_layout_preferences = TestQueryResult([workspace_columns_pref])
        workspace.workspacepreference_set.filter.side_effect = lambda **kwargs: workspace_layout_pref if kwargs.get('name', '') == 'layout' else workspace_layout_preferences

        workspace_tab = Mock()
        workspace_tab_layout_pref = Mock()
        workspace_tab_columns_pref = Mock()
        workspace_tab_columns_pref.name = 'columns'
        workspace_tab_columns_pref.value = 15
        workspace_tab_layout_preferences = TestQueryResult([workspace_tab_columns_pref])
        workspace_tab.tabpreference_set.filter.side_effect = lambda **kwargs: workspace_tab_layout_pref if kwargs.get('name', '') == 'layout' else workspace_tab_layout_preferences

        workspace_empty_tab = Mock()
        workspace_empty_tab_layout_pref = Mock()
        workspace_empty_tab_layout_preferences = TestQueryResult([])
        workspace_empty_tab.tabpreference_set.filter.side_effect = lambda **kwargs: workspace_empty_tab_layout_pref if kwargs.get('name', '') == 'layout' else workspace_empty_tab_layout_preferences
        workspace.tab_set.all.return_value = TestQueryResult([workspace_empty_tab, workspace_tab])

        migration = self._pick_migration('0016_restructure_layout_preferences')
        orm = Mock(autospec=migration.orm())
        orm.Workspace.objects.all.return_value = TestQueryResult([empty_workspace, workspace])
        migration.migration_instance().forwards(orm)

        self.assertTrue(empty_workspace_layout_pref.update.called)
        self.assertEqual(empty_workspace_layout_preferences.delete.call_count, 0)
        self.assertFalse(empty_workspace.workspacepreference_set.create.called)

        self.assertTrue(workspace_layout_pref.update.called)
        self.assertTrue(workspace_layout_preferences.delete.called)
        self.assertTrue(workspace_tab_layout_preferences.delete.called)
        self.assertFalse(workspace_empty_tab_layout_preferences.delete.called)
        self.assertTrue(workspace.workspacepreference_set.create.called)

    def test_restructure_layout_preferences_backwards(self):

        migration = self._pick_migration('0016_restructure_layout_preferences')
        orm = Mock(autospec=migration.prev_orm())
        self.assertRaises(RuntimeError, migration.migration_instance().backwards, orm)
