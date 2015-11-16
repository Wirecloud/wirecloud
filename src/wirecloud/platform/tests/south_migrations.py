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

from __future__ import unicode_literals

import json
import os

from django.test import TestCase
from mock import Mock, patch, DEFAULT
from south.migration import Migrations


# Avoid nose to repeat these tests (they are run through wirecloud/platform/tests/__init__.py)
__test__ = False


class TestQueryResult(object):

    def __init__(self, result):
        self.result = result
        self.update = Mock()
        self.delete = Mock()

    def __iter__(self):
        return self.result.__iter__()

    def __getitem__(self, index):
        return self.result[index]

    def exists(self):
        return len(self.result) > 0

    def count(self):
        return len(self.result)


class PlatformSouthMigrationsTestCase(TestCase):

    tags = ('wirecloud-migrations', 'wirecloud-platform-migrations')

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
            'auth.user': Mock(_meta=Mock(abstract=False)),
            'auth.group': Mock(_meta=Mock(abstract=False)),
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
            'platform.organization': Mock(_meta=Mock(abstract=False)),
            'platform.team': Mock(_meta=Mock(abstract=False)),
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

    def _read_json_fixtures(self, *args):
        testdir_path = os.path.join(os.path.dirname(__file__), 'test-data')
        json_fixtures = []

        for filename in args:
            file_opened = open(os.path.join(testdir_path, filename + '.json'))
            json_fixtures.append(json.loads(file_opened.read()))
            file_opened.close()

        if len(json_fixtures) == 0:
            return None

        if len(json_fixtures) == 1:
            return json_fixtures[0]

        return tuple(json_fixtures)

    def test_restructure_behaviour_oriented_wiring_forwards(self):
        input_file, output_file, output_file_no_views = self._read_json_fixtures('wiringstatus_v1.0', 'wiringstatus_v2.0', 'wiringstatus_v2.0_no_views')

        empty1_workspace = Mock(wiringStatus='{}')
        empty2_workspace = Mock(wiringStatus='')
        empty_v1_workspace = Mock(wiringStatus='{"connections": [], "operators": {}}')

        workspace = Mock(wiringStatus=json.dumps(input_file))

        del input_file['views']
        workspace_no_views = Mock(wiringStatus=json.dumps(input_file))

        migration = self._pick_migration('0017_restructure_behaviour_oriented_wiring')
        orm = Mock(autospec=migration.orm())
        orm.Workspace.objects.all.return_value = TestQueryResult([empty1_workspace, empty2_workspace, empty_v1_workspace, workspace, workspace_no_views])
        migration.migration_instance().forwards(orm)

        from wirecloud.platform.wiring.utils import get_wiring_skeleton

        self.assertEqual(json.loads(empty1_workspace.wiringStatus), get_wiring_skeleton())
        self.assertEqual(json.loads(empty2_workspace.wiringStatus), get_wiring_skeleton())
        self.assertEqual(json.loads(empty_v1_workspace.wiringStatus), get_wiring_skeleton())
        self.assertEqual(json.loads(workspace.wiringStatus), output_file)
        self.assertEqual(json.loads(workspace_no_views.wiringStatus), output_file_no_views)

        for workspace in orm.Workspace.objects.all():
            self.assertEqual(workspace.save.call_count, 1)

    def test_restructure_behaviour_oriented_wiring_backwards(self):
        migration = self._pick_migration('0017_restructure_behaviour_oriented_wiring')
        orm = Mock(autospec=migration.prev_orm())
        self.assertRaises(RuntimeError, migration.migration_instance().backwards, orm)

    def test_delete_widget_height_and_width_fields_forwards(self):
        self.check_basic_migration_forwards('0018_auto__del_field_widget_height__del_field_widget_width')

    def test_delete_widget_height_and_width_fields_backwards(self):
        self.check_basic_migration_backwards('0018_auto__del_field_widget_height__del_field_widget_width')

    def test_add_field_iwidget_variables_forwards(self):
        self.check_basic_migration_forwards('0019_auto__add_field_iwidget_variables')

    def test_add_field_iwidget_variables_backwards(self):
        self.check_basic_migration_backwards('0019_auto__add_field_iwidget_variables')

    def test_widget_variables_forwards(self):

        var1 = Mock(vardef=Mock(type='B'), value='true')
        var1.vardef.name = 'bool'
        var2 = Mock(vardef=Mock(type='N'), value='2')
        var2.vardef.name = 'number'
        var3 = Mock(vardef=Mock(name='text', type='S'), value='hello world')
        var3.vardef.name = 'text'
        var4 = Mock(vardef=Mock(type='B'), value='2')
        var4.vardef.name = 'bool2'
        var5 = Mock(vardef=Mock(type='N', default_value='3'), value='true')
        var5.vardef.name = 'number2'
        var6 = Mock(vardef=Mock(type='N'), value='true')
        var6.vardef.name = 'number3'

        empty_iwidget = Mock()
        empty_iwidget.variable_set.all.return_value = []

        iwidget = Mock()
        iwidget.variable_set.all.return_value = [var1, var2, var3, var4, var5, var6]

        migration = self._pick_migration('0020_widget_variables')
        orm = Mock(autospec=migration.orm())
        orm.IWidget.objects.all.return_value = TestQueryResult([empty_iwidget, iwidget])
        migration.migration_instance().forwards(orm)

        self.assertEqual(empty_iwidget.save.call_count, 1)
        self.assertEqual(iwidget.save.call_count, 1)
        self.assertEqual(iwidget.variables, {
            "bool": True,
            "bool2": False,
            "number": 2.0,
            "number2": 3,
            "number3": 0,
            "text": "hello world",
        })

    def test_widget_variables_backwards(self):
        migration = self._pick_migration('0020_widget_variables')
        orm = Mock(autospec=migration.prev_orm())
        self.assertRaises(RuntimeError, migration.migration_instance().backwards, orm)

    def test_del_variable__del_variabledef_forwards(self):
        self.check_basic_migration_forwards('0021_auto__del_variable__del_variabledef')

    def test_del_variable__del_variabledef_backwards(self):
        self.check_basic_migration_backwards('0021_auto__del_variable__del_variabledef')

    def test_add_field_iwidget_positions_forwards(self):
        self.check_basic_migration_forwards('0022_auto__add_field_iwidget_positions')

    def test_add_field_iwidget_positions_backwards(self):
        self.check_basic_migration_backwards('0022_auto__add_field_iwidget_positions')

    def test_widget_positions_forwards(self):

        iwidget1 = Mock()
        iwidget1.positions = {}
        iwidget1.icon_position = None
        iwidget1.position.posX = 1
        iwidget1.position.posY = 2
        iwidget1.position.posZ = 3
        iwidget1.position.height = 10
        iwidget1.position.width = 20
        iwidget1.position.minimized = False
        iwidget1.position.fulldragboard = False

        iwidget2 = Mock()
        iwidget2.positions = {}
        iwidget2.icon_position.posX = 0
        iwidget2.icon_position.posY = 0
        iwidget2.position.posX = 1
        iwidget2.position.posY = 2
        iwidget2.position.posZ = 3
        iwidget2.position.height = 10
        iwidget2.position.width = 20
        iwidget2.position.minimized = False
        iwidget2.position.fulldragboard = False

        iwidget3 = Mock()
        iwidget3.positions = {}
        iwidget3.icon_position.posX = -1
        iwidget3.icon_position.posY = 5
        iwidget3.position.posX = -7
        iwidget3.position.posY = 2
        iwidget3.position.posZ = 3
        iwidget3.position.height = 10
        iwidget3.position.width = 20
        iwidget3.position.minimized = False
        iwidget3.position.fulldragboard = False

        iwidget4 = Mock()
        iwidget4.positions = {}
        iwidget4.icon_position.posX = 3
        iwidget4.icon_position.posY = -5
        iwidget4.position.posX = 1
        iwidget4.position.posY = -2
        iwidget4.position.posZ = -3
        iwidget4.position.height = 0
        iwidget4.position.width = -4
        iwidget4.position.minimized = False
        iwidget4.position.fulldragboard = False

        migration = self._pick_migration('0023_widget_positions')
        orm = Mock(autospec=migration.orm())
        orm.IWidget.objects.all.return_value = TestQueryResult([iwidget1, iwidget2, iwidget3, iwidget4])
        migration.migration_instance().forwards(orm)

        self.assertEqual(iwidget1.save.call_count, 1)
        self.assertEqual(iwidget1.positions, {"widget": {"top": 1, "left": 2, "zIndex": 3, "height": 10, "width": 20, "minimized": False, "fulldragboard": False}})
        self.assertEqual(iwidget2.save.call_count, 1)
        self.assertEqual(iwidget2.positions, {"icon": {"top": 0, "left": 0}, "widget": {"top": 1, "left": 2, "zIndex": 3, "height": 10, "width": 20, "minimized": False, "fulldragboard": False}})
        self.assertEqual(iwidget3.save.call_count, 1)
        self.assertEqual(iwidget3.positions, {"icon": {"top": 0, "left": 5}, "widget": {"top": 0, "left": 2, "zIndex": 3, "height": 10, "width": 20, "minimized": False, "fulldragboard": False}})
        self.assertEqual(iwidget4.save.call_count, 1)
        self.assertEqual(iwidget4.positions, {"icon": {"top": 3, "left": 0}, "widget": {"top": 1, "left": 0, "zIndex": 0, "height": 1, "width": 1, "minimized": False, "fulldragboard": False}})

    def test_widget_positions_backwards(self):
        migration = self._pick_migration('0023_widget_positions')
        orm = Mock(autospec=migration.prev_orm())
        self.assertRaises(RuntimeError, migration.migration_instance().backwards, orm)

    def test_del_position__del_field_iwidget_icon_position__del_field_iwidget_forwards(self):
        self.check_basic_migration_forwards('0024_auto__del_position__del_field_iwidget_icon_position__del_field_iwidget')

    def test_del_position__del_field_iwidget_icon_position__del_field_iwidget_backwards(self):
        self.check_basic_migration_backwards('0024_auto__del_position__del_field_iwidget_icon_position__del_field_iwidget')

    def test_chg_json_fields_forwards(self):
        self.check_basic_migration_forwards('0025_chg_json_fields')

    def test_chg_json_fields_backwards(self):
        self.check_basic_migration_backwards('0025_chg_json_fields')

    def test_add_organization_models_forwards(self):
        self.check_basic_migration_forwards('0026_add_organization_models')

    def test_add_organization_models_backwards(self):
        self.check_basic_migration_backwards('0026_add_organization_models')

    def test_add_field_iwidget_widget_uri_forwards(self):
        iwidget1 = Mock(widget=Mock(resource=Mock(vendor="Wirecloud", short_name="Test", version="1.0")))
        iwidget2 = Mock(widget=Mock(resource=Mock(vendor="Other", short_name="widget", version="2.0")))

        migration = self._pick_migration('0027_add_field_iwidget_widget_uri')
        orm = Mock(autospec=migration.orm())
        select_related_mock = Mock()
        select_related_mock.all.return_value = TestQueryResult([iwidget1, iwidget2])
        orm.IWidget.objects.select_related.return_value = select_related_mock
        migration.migration_instance().forwards(orm)

        self.assertEqual(iwidget1.save.call_count, 1)
        self.assertEqual(iwidget1.widget_uri, "Wirecloud/Test/1.0")
        self.assertEqual(iwidget2.save.call_count, 1)
        self.assertEqual(iwidget2.widget_uri, "Other/widget/2.0")

    def test_add_field_iwidget_widget_uri_backwards(self):
        self.check_basic_migration_backwards('0027_add_field_iwidget_widget_uri')

    def test_allow_null_field_iwidget_widget_forwards(self):
        self.check_basic_migration_forwards('0028_allow_null_field_iwidget_widget')

    def test_allow_null_field_iwidget_widget_backwards(self):
        migration = self._pick_migration('0028_allow_null_field_iwidget_widget')
        orm = Mock(autospec=migration.prev_orm())
        self.assertRaises(RuntimeError, migration.migration_instance().backwards, orm)

    def test_remove_local_catalogue_from_markets_forwards(self):
        migration = self._pick_migration('0029_remove_local_catalogue_from_markets')
        orm = Mock(autospec=migration.orm())
        orm.Market.objects.filter.return_value = TestQueryResult([])
        migration.migration_instance().forwards(orm)

    def test_remove_local_catalogue_from_markets_forwards_exists(self):
        migration = self._pick_migration('0029_remove_local_catalogue_from_markets')
        orm = Mock(autospec=migration.orm())
        orm.Market.objects.filter.return_value = TestQueryResult([Mock(url=None)])
        migration.migration_instance().forwards(orm)

    def test_remove_local_catalogue_from_markets_backwards(self):
        self.check_basic_migration_backwards('0029_remove_local_catalogue_from_markets')
