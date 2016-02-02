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

from django.test import TestCase
from mock import Mock, patch
from south.migration import Migrations

# from wirecloud.fiware.south_migrations.0001_switch_to_actorId import db_table_exists
db_table_exists = __import__('wirecloud.fiware.south_migrations.0001_switch_to_actorId', globals(), locals(), ['db_table_exists'], 0).db_table_exists

# Avoid nose to repeat these tests (they are run through wirecloud/fiware/tests/__init__.py)
__test__ = False


class TestQueryResult(object):

    def __init__(self, result):
        self.result = result
        self.update = Mock()
        self.delete = Mock()

    def __iter__(self):
        return self.result.__iter__()

    def count(self):
        return len(self.result)


class FIWARESouthMigrationsTestCase(TestCase):

    tags = ('wirecloud-migrations', 'wirecloud-fiware-migrations', 'wirecloud-noselenium')

    def _pick_migration(self, migration_name):
        """
        This method will pick a migration object from the catalogue app
        """
        migrations = Migrations('fiware')
        for migration in migrations:
            if migration.full_name().split('.')[-1] == migration_name:
                return migration

        return None

    def prepare_basic_data(self, uid_field, repeated):

        users = []

        for user_id in (1, 67, 100, 80):
            user = Mock()
            user.extra_data = {
                "username": 'test%s' % user_id,
                "uid": user_id
            }
            user.uid = "%s" % user.extra_data[uid_field]
            user.user.last_login_date = user_id
            users.append(user)

        if repeated:
            user = Mock()
            if uid_field == 'uid':
                user.extra_data = {
                    "username": "test1",
                    "uid": 50
                }
            else:
                user.extra_data = {
                    "username": "test60",
                    "uid": 1
                }
            user.uid = "%s" % user.extra_data[uid_field]
            users.append(user)

        return users

    def prepare_orm(self, spec):
        orm = Mock(autospec=spec)
        items = {
            "social_auth.UserSocialAuth": Mock()
        }
        orm.__getitem__ = lambda self, name: items[name]
        return orm

    def check_users_after_execution(self, success, uid_field, users):

        for auth_user in users:
            self.assertEqual(auth_user.save.called, success)
            self.assertEqual(auth_user.uid, "%s" % auth_user.extra_data[uid_field])
            self.assertFalse(auth_user.delete.called)
            self.assertFalse(auth_user.user.delete.called)

    def test_db_table_exists(self):
        with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.connection') as connection_mock:
            connection_mock.introspection.get_table_list.return_value = ('other_table', 'social_auth_usersocialauth')
            self.assertTrue(db_table_exists('social_auth_usersocialauth'))

    def test_db_table_exists_exception(self):
        with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.connection') as connection_mock:
            connection_mock.cursor.side_effect = Exception()
            self.assertRaises(Exception, db_table_exists, 'social_auth_usersocialauth')

    def test_switch_to_actorId_forwards(self):

        users = self.prepare_basic_data('username', False)
        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',)):
            with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.db_table_exists', return_value=True):
                migration.migration_instance().forwards(orm)

        self.check_users_after_execution(True, 'uid', users)

    def test_switch_to_actorId_forwards_repeated_uid(self):

        users = self.prepare_basic_data('username', True)

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',)):
            with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.db_table_exists', return_value=True):
                self.assertRaises(Exception, migration.migration_instance().forwards, orm)

        self.check_users_after_execution(False, 'username', users)

    def test_switch_to_actorId_forwards_missing_uid(self):

        users = self.prepare_basic_data('username', False)
        del users[1].extra_data['uid']

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',), WIRECLOUD_REMOVE_UNSUPPORTED_FIWARE_USERS=False):
            with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.db_table_exists', return_value=True):
                self.assertRaises(Exception, migration.migration_instance().forwards, orm)

        self.check_users_after_execution(False, 'username', users)

    def test_switch_to_actorId_forwards_missing_uid_autoremove(self):

        users = self.prepare_basic_data('username', False)
        del users[1].extra_data['uid']
        user_to_be_removed = users[1]
        users[1].user.delete.side_effect = lambda: users.remove(user_to_be_removed)

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',), WIRECLOUD_REMOVE_UNSUPPORTED_FIWARE_USERS=True):
            with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.db_table_exists', return_value=True):
                migration.migration_instance().forwards(orm)

        self.assertTrue(user_to_be_removed.user.delete.called)
        self.assertFalse(user_to_be_removed.delete.called)
        self.check_users_after_execution(True, 'uid', users)

    def test_switch_to_actorId_forwards_missing_uid_autodisconnect(self):

        users = self.prepare_basic_data('username', False)
        del users[1].extra_data['uid']
        user_to_be_removed = users[1]
        users[1].delete.side_effect = lambda: users.remove(user_to_be_removed)

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',), WIRECLOUD_REMOVE_UNSUPPORTED_FIWARE_USERS="disconnect"):
            with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.db_table_exists', return_value=True):
                migration.migration_instance().forwards(orm)

        self.assertFalse(user_to_be_removed.user.delete.called)
        self.assertTrue(user_to_be_removed.delete.called)
        self.check_users_after_execution(True, 'uid', users)

    def test_switch_to_actorId_forwards_idm_integration_not_enabled(self):

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.orm())
        with self.settings(INSTALLED_APPS=()):
            with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.db_table_exists', return_value=False):
                migration.migration_instance().forwards(orm)

        self.assertFalse(orm['social_auth.UserSocialAuth'].objects.all.called)

    def test_switch_to_actorId_forwards_before_social_auth(self):

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.orm())
        with self.settings(INSTALLED_APPS=('social_auth')):
            with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.db_table_exists', return_value=False):
                migration.migration_instance().forwards(orm)

        self.assertFalse(orm['social_auth.UserSocialAuth'].objects.all.called)

    def test_switch_to_actorId_backwards(self):

        users = self.prepare_basic_data('uid', False)
        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.prev_orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',)):
            with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.db_table_exists', return_value=True):
                migration.migration_instance().backwards(orm)

        self.check_users_after_execution(True, 'username', users)

    def test_switch_to_actorId_backwards_repeated_uid(self):

        users = self.prepare_basic_data('uid', True)

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.prev_orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',)):
            with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.db_table_exists', return_value=True):
                self.assertRaises(Exception, migration.migration_instance().backwards, orm)

        self.check_users_after_execution(False, 'uid', users)

    def test_switch_to_actorId_backwards_missing_username(self):

        users = self.prepare_basic_data('uid', False)
        del users[1].extra_data['username']

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.prev_orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',), WIRECLOUD_REMOVE_UNSUPPORTED_FIWARE_USERS=False):
            with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.db_table_exists', return_value=True):
                self.assertRaises(Exception, migration.migration_instance().backwards, orm)

        self.check_users_after_execution(False, 'uid', users)

    def test_switch_to_actorId_backwards_idm_integration_not_enabled(self):

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.prev_orm())
        with self.settings(INSTALLED_APPS=()):
            with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.db_table_exists', return_value=False):
                migration.migration_instance().backwards(orm)

        self.assertFalse(orm['social_auth.UserSocialAuth'].objects.all.called)

    def test_switch_to_actorId_backwards_before_social_auth(self):

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.prev_orm())
        with self.settings(INSTALLED_APPS=('social_auth')):
            with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.db_table_exists', return_value=False):
                migration.migration_instance().backwards(orm)

        self.assertFalse(orm['social_auth.UserSocialAuth'].objects.all.called)

    def test_switch_to_username_forwards(self):

        users = self.prepare_basic_data('uid', False)
        migration = self._pick_migration('0002_switch_to_username')
        orm = self.prepare_orm(migration.orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',)):
            # db_table_exists is used from 0001_switch_to_actorId in this case
            with patch('wirecloud.fiware.south_migrations.0001_switch_to_actorId.db_table_exists', return_value=True):
                migration.migration_instance().forwards(orm)

        self.check_users_after_execution(True, 'username', users)

    def test_switch_to_username_backwards_social_auth_enabled(self):

        migration = self._pick_migration('0002_switch_to_username')
        orm = self.prepare_orm(migration.orm())

        with self.settings(INSTALLED_APPS=('social_auth',)):
            with patch('wirecloud.fiware.south_migrations.0002_switch_to_username.db_table_exists', return_value=True):
                self.assertRaises(RuntimeError, migration.migration_instance().backwards, orm)

    def test_switch_to_username_backwards_social_auth_disabled(self):

        migration = self._pick_migration('0002_switch_to_username')
        orm = self.prepare_orm(migration.orm())

        with self.settings(INSTALLED_APPS=()):
            with patch('wirecloud.fiware.south_migrations.0002_switch_to_username.db_table_exists', return_value=True):
                migration.migration_instance().backwards(orm)

    def test_switch_to_username_backwards_social_auth_no_tables(self):

        migration = self._pick_migration('0002_switch_to_username')
        orm = self.prepare_orm(migration.orm())

        with self.settings(INSTALLED_APPS=()):
            with patch('wirecloud.fiware.south_migrations.0002_switch_to_username.db_table_exists', return_value=True):
                migration.migration_instance().backwards(orm)
