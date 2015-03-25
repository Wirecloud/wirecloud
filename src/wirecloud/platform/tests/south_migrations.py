# -*- coding: utf-8 -*-

# Copyright (c) 2014-2015 CoNWeT Lab., Universidad Politécnica de Madrid

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

import json

from django.test import TestCase
from mock import Mock, patch, DEFAULT
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

    def fill_orm_external_models(self, orm):

        available_models = {
            'auth.user': Mock(),
            'auth.group': Mock(),
            'catalogue.catalogueresource': Mock(),
            'platform.iwidget': Mock(),
            'platform.market': Mock(),
            'platform.position': Mock(),
            'platform.publishedworkspace': Mock(),
            'platform.tab': Mock(),
            'platform.variable': Mock(),
            'platform.variabledef': Mock(),
            'platform.widget': Mock(),
            'platform.workspace': Mock(),
            'platform.xhtml': Mock(),
        }
        orm.__getitem__ = lambda self, model: available_models[model.lower()]

    def check_basic_migration_forwards(self, migration_name, **extra_mocks):
        migration = self._pick_migration(migration_name)
        orm = Mock(autospec=migration.orm())
        self.fill_orm_external_models(orm)
        with patch.multiple('wirecloud.platform.south_migrations.' + migration_name, db=DEFAULT, autospec=True, **extra_mocks):
            migration_instance = migration.migration_instance()
            with patch.object(migration_instance, 'gf', autospec=True):
                migration_instance.forwards(orm)

    def check_basic_migration_backwards(self, migration_name, **extra_mocks):
        migration = self._pick_migration(migration_name)
        orm = Mock(autospec=migration.prev_orm())
        self.fill_orm_external_models(orm)
        with patch.multiple('wirecloud.platform.south_migrations.' + migration_name, db=DEFAULT, autospec=True, **extra_mocks):
            migration_instance = migration.migration_instance()
            with patch.object(migration_instance, 'gf', autospec=True):
                migration_instance.backwards(orm)

    def test_initial_forwards(self):
        self.check_basic_migration_forwards('0001_initial', models=DEFAULT)

    def test_initial_backwards(self):
        self.check_basic_migration_backwards('0001_initial')

    def test_add_field_variabledef_readonly__add_field_variabledef_value_forwards(self):
        self.check_basic_migration_forwards('0002_auto__add_field_variabledef_readonly__add_field_variabledef_value')

    def test_add_field_variabledef_readonly__add_field_variabledef_value_backwards(self):
        self.check_basic_migration_backwards('0002_auto__add_field_variabledef_readonly__add_field_variabledef_value')

    def test_chg_field_variabledef_action_label__chg_field_variabledef_label_forwards(self):
        self.check_basic_migration_forwards('0003_auto__chg_field_variabledef_action_label__chg_field_variabledef_label_')

    def test_chg_field_variabledef_action_label__chg_field_variabledef_label_backwards(self):
        self.check_basic_migration_backwards('0003_auto__chg_field_variabledef_action_label__chg_field_variabledef_label_')

    def test_fix_operator_deployment_dir_forwards(self):

        migration = self._pick_migration("0004_fix_operator_deployment_dir")

        operator1 = Mock()
        orm = Mock(autospec=migration.orm())
        self.fill_orm_external_models(orm)
        orm['catalogue.CatalogueResource'].objects.filter.return_value = TestQueryResult([operator1])

        with patch.multiple('wirecloud.platform.south_migrations.0004_fix_operator_deployment_dir', catalogue_utils=DEFAULT, showcase_utils=DEFAULT, WgtFile=DEFAULT) as mocks:
            wgt_file = Mock()
            mocks['WgtFile'].return_value = wgt_file
            migration.migration_instance().forwards(orm)
            mocks['showcase_utils'].wgt_deployer.deploy.assert_called_once_with(wgt_file)

    def test_fix_operator_deployment_dir_backwards(self):

        migration = self._pick_migration("0004_fix_operator_deployment_dir")

        operator1 = Mock()
        orm = Mock(autospec=migration.prev_orm())
        self.fill_orm_external_models(orm)
        orm['catalogue.CatalogueResource'].objects.filter.return_value = TestQueryResult([operator1])

        with patch.multiple('wirecloud.platform.south_migrations.0004_fix_operator_deployment_dir', catalogue_utils=DEFAULT, showcase_utils=DEFAULT, WgtFile=DEFAULT) as mocks:
            wgt_file = Mock()
            mocks['WgtFile'].return_value = wgt_file
            migration.migration_instance().backwards(orm)
            mocks['catalogue_utils'].wgt_deployer.deploy.assert_called_once_with(wgt_file)

    def test_update_wiring_status_operator_prefs_structure_forwards(self):

        migration = self._pick_migration("0005_update_wiring_status_operator_prefs_structure")

        workspace1 = Mock()
        workspace1.wiringStatus = '{"operators": {"1": {"preferences": {"pref1": "val1"}}, "2": {}, "3": {"preferences": {}}}}'

        workspace2 = Mock()
        workspace2.wiringStatus = '{"operators": {}}'

        workspace3 = Mock()
        workspace3.wiringStatus = 'invalid_wiring'

        orm = Mock(autospec=migration.orm())
        orm.Workspace.objects.all.return_value = TestQueryResult([workspace1, workspace2, workspace3])
        self.fill_orm_external_models(orm)

        # Pass migration
        migration.migration_instance().forwards(orm)

        # Check the migration has gone well
        self.assertEqual(json.loads(workspace1.wiringStatus), {"operators": {"1": {"preferences": {"pref1": {"readonly": False, "hidden": False, "value": "val1"}}}, "2": {"preferences": {}}, "3": {"preferences": {}}}})
        self.assertTrue(workspace1.save.called)
        self.assertEqual(workspace2.wiringStatus, '{"operators": {}}')
        self.assertTrue(workspace2.save.called)
        self.assertEqual(workspace3.wiringStatus, 'invalid_wiring')
        self.assertFalse(workspace3.save.called)

    def test_update_wiring_status_operator_prefs_structure_backwards(self):

        migration = self._pick_migration("0005_update_wiring_status_operator_prefs_structure")

        workspace1 = Mock()
        workspace1.wiringStatus = '{"operators": {"1": {"preferences": {"pref1": {"readonly": false, "hidden": false, "value": "val1"}}}, "2": {}, "3": {"preferences": {}}}}'

        workspace2 = Mock()
        workspace2.wiringStatus = '{"operators": {}}'

        workspace3 = Mock()
        workspace3.wiringStatus = 'invalid_wiring'

        orm = Mock(autospec=migration.prev_orm())
        orm.Workspace.objects.all.return_value = TestQueryResult([workspace1, workspace2, workspace3])
        self.fill_orm_external_models(orm)

        # Pass migration
        migration.migration_instance().backwards(orm)

        # Check the migration has gone well
        self.assertEqual(json.loads(workspace1.wiringStatus), {"operators": {"1": {"preferences": {"pref1": "val1"}}, "2": {"preferences": {}}, "3": {"preferences": {}}}})
        self.assertTrue(workspace1.save.called)
        self.assertEqual(workspace2.wiringStatus, '{"operators": {}}')
        self.assertTrue(workspace2.save.called)
        self.assertEqual(workspace3.wiringStatus, 'invalid_wiring')
        self.assertFalse(workspace3.save.called)

    def test_del_contextoption_forwards(self):
        self.check_basic_migration_forwards('0006_auto__del_contextoption')

    def test_del_contextoption_backwards(self):
        self.check_basic_migration_backwards('0006_auto__del_contextoption')

    def test_add_field_workspace_public_forwards(self):
        self.check_basic_migration_forwards('0007_auto__add_field_workspace_public')

    def test_add_field_workspace_public_backwards(self):
        self.check_basic_migration_backwards('0007_auto__add_field_workspace_public')

    def test_del_grouppublishedworkspace__del_publishedworkspace_forwards(self):
        self.check_basic_migration_forwards('0008_auto__del_grouppublishedworkspace__del_publishedworkspace')

    def test_del_grouppublishedworkspace__del_publishedworkspace_backwards(self):
        self.check_basic_migration_backwards('0008_auto__del_grouppublishedworkspace__del_publishedworkspace')

    def test_add_field_variable_value_forwards(self):
        self.check_basic_migration_forwards('0009_add_field_variable_value')

    def test_add_field_variable_value_backwards(self):
        self.check_basic_migration_backwards('0009_add_field_variable_value')

    def test_del_variablevalue__del_unique_variablevalue_variable_user_forwards(self):
        self.check_basic_migration_forwards('0011_del_variablevalue__del_unique_variablevalue_variable_user')

    def test_del_variablevalue__del_unique_variablevalue_variable_user_backwards(self):
        self.check_basic_migration_backwards('0011_del_variablevalue__del_unique_variablevalue_variable_user')

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

    def test_improve_workspace_metadata_forwards(self):
        self.check_basic_migration_forwards('0014_improve_workspace_metadata')

    def test_improve_workspace_metadata_backwards(self):
        self.check_basic_migration_backwards('0014_improve_workspace_metadata')

    def test_rename_targetOrganizations_to_groups_forwards(self):
        self.check_basic_migration_forwards('0015_rename_targetOrganizations_to_groups')

    def test_rename_targetOrganizations_to_groups_backwards(self):
        self.check_basic_migration_backwards('0015_rename_targetOrganizations_to_groups')

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
