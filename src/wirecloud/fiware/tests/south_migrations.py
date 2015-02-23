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

from django.test import TestCase
from django.utils import unittest
from mock import Mock, patch
from south.migration import Migrations
import six

from wirecloud.fiware.plugins import IDM_SUPPORT_ENABLED


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

    tags = ('wirecloud-migrations', 'fiware-migrations')

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

        for user_id in (1, 67, 100):
            user = Mock()
            user.extra_data = {
                "username": 'test%s' % user_id,
                "uid": user_id
            }
            user.uid = "%s" % user.extra_data[uid_field]
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

    def test_switch_to_actorId_forwards(self):

        users = self.prepare_basic_data('username', False)
        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',)):
            migration.migration_instance().forwards(orm)

        self.check_users_after_execution(True, 'uid', users)

    def test_switch_to_actorId_forwards_repeated_uid(self):

        users = self.prepare_basic_data('username', True)

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',)):
            self.assertRaises(Exception, migration.migration_instance().forwards, orm)

        self.check_users_after_execution(False, 'username', users)

    def test_switch_to_actorId_forwards_missing_uid(self):

        users = self.prepare_basic_data('username', False)
        del users[1].extra_data['uid']

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',), WIRECLOUD_REMOVE_UNSUPPORTED_FIWARE_USERS=False):
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
            migration.migration_instance().forwards(orm)

        self.assertFalse(user_to_be_removed.user.delete.called)
        self.assertTrue(user_to_be_removed.delete.called)
        self.check_users_after_execution(True, 'uid', users)

    def test_switch_to_actorId_forwards_idm_integration_not_enabled(self):

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.orm())
        with self.settings(INSTALLED_APPS=()):
            migration.migration_instance().forwards(orm)

        self.assertFalse(orm['social_auth.UserSocialAuth'].objects.all.called)

    def test_switch_to_actorId_backwards(self):

        users = self.prepare_basic_data('uid', False)
        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.prev_orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',)):
            migration.migration_instance().backwards(orm)

        self.check_users_after_execution(True, 'username', users)

    def test_switch_to_actorId_backwards_repeated_uid(self):

        users = self.prepare_basic_data('uid', True)

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.prev_orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',)):
            self.assertRaises(Exception, migration.migration_instance().backwards, orm)

        self.check_users_after_execution(False, 'uid', users)

    def test_switch_to_actorId_backwards_missing_username(self):

        users = self.prepare_basic_data('uid', False)
        del users[1].extra_data['username']

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.prev_orm())
        orm['social_auth.UserSocialAuth'].objects.all.return_value = TestQueryResult(users)
        with self.settings(INSTALLED_APPS=('social_auth',), WIRECLOUD_REMOVE_UNSUPPORTED_FIWARE_USERS=False):
            self.assertRaises(Exception, migration.migration_instance().backwards, orm)

        self.check_users_after_execution(False, 'uid', users)

    def test_switch_to_actorId_backwards_idm_integration_not_enabled(self):

        migration = self._pick_migration('0001_switch_to_actorId')
        orm = self.prepare_orm(migration.prev_orm())
        with self.settings(INSTALLED_APPS=()):
            migration.migration_instance().backwards(orm)

        self.assertFalse(orm['social_auth.UserSocialAuth'].objects.all.called)
