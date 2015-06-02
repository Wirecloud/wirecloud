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


from __future__ import unicode_literals

from django.conf import settings
from django.db import connection
from south.v2 import DataMigration


def db_table_exists(table):

    try:
        cursor = connection.cursor()
        table_names = connection.introspection.get_table_list(cursor)
    except:
        raise Exception("unable to determine if the table '%s' exists" % table)
    else:
        return table in table_names


def swith_to_username(orm):

    if 'social_auth' not in settings.INSTALLED_APPS or not db_table_exists('social_auth_usersocialauth'):
        return

    ids = set()
    for user in orm['social_auth.UserSocialAuth'].objects.all():
        if user.extra_data['username'] in ids:
            raise Exception('Duplicated username: %s' % user.extra_data['username'])

        ids.add(user.extra_data['username'])

    for user in orm['social_auth.UserSocialAuth'].objects.all():
        user.uid = user.extra_data['username']

        user.save()


class Migration(DataMigration):

    def forwards(self, orm):

        if 'social_auth' not in settings.INSTALLED_APPS or not db_table_exists('social_auth_usersocialauth'):
            return

        ids = set()
        users_to_remove = []
        last_login_date = None
        for user in orm['social_auth.UserSocialAuth'].objects.all():
            if user.extra_data.get('uid', None) is None:
                users_to_remove.append(user)

                if last_login_date is None or user.user.last_login > last_login_date:
                    last_login_date = user.user.last_login

                continue

            if user.extra_data['uid'] in ids:
                raise Exception('Duplicated uid: %s' % user.extra_data['uid'])

            ids.add(user.extra_data['uid'])

        remove_users = getattr(settings, 'WIRECLOUD_REMOVE_UNSUPPORTED_FIWARE_USERS', False)
        if remove_users is True:
            for user in users_to_remove:
                user.user.delete()
        elif remove_users == "disconnect":
            for user in users_to_remove:
                user.delete()
        elif len(users_to_remove) > 0:
            raise Exception('User without uid information (using username as uid). FIWARE integration now relies on uids (actorId), so we cannot migrate it. Users can fill this information signing in again using their FIWARE account, alternativelly, you can make use of the WIRECLOUD_REMOVE_UNSUPPORTED_FIWARE_USERS=True setting for automatically remove those users or WIRECLOUD_REMOVE_UNSUPPORTED_FIWARE_USERS="disconnect" for disconnecting those users from their FIWARE accounts\n\n%s users without actorId info: %s\n\nLast login date: %s' % (len(users_to_remove), list(user.username for user in users_to_remove), last_login_date))

        for user in orm['social_auth.UserSocialAuth'].objects.all():
            user.uid = "%s" % user.extra_data['uid']
            user.save()

    def backwards(self, orm):

        swith_to_username(orm)

    models = {
        u'auth.group': {
            'Meta': {'object_name': 'Group'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'auth.permission': {
            'Meta': {'ordering': "(u'content_type__app_label', u'content_type__model', u'codename')", 'unique_together': "((u'content_type', u'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['contenttypes.ContentType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "u'user_set'", 'blank': 'True', 'to': u"orm['auth.Group']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "u'user_set'", 'blank': 'True', 'to': u"orm['auth.Permission']"}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        u'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'social_auth.association': {
            'Meta': {'unique_together': "(('server_url', 'handle'),)", 'object_name': 'Association'},
            'assoc_type': ('django.db.models.fields.CharField', [], {'max_length': '64'}),
            'handle': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'issued': ('django.db.models.fields.IntegerField', [], {'db_index': 'True'}),
            'lifetime': ('django.db.models.fields.IntegerField', [], {}),
            'secret': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'server_url': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        },
        'social_auth.nonce': {
            'Meta': {'unique_together': "(('server_url', 'timestamp', 'salt'),)", 'object_name': 'Nonce'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'salt': ('django.db.models.fields.CharField', [], {'max_length': '40'}),
            'server_url': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'timestamp': ('django.db.models.fields.IntegerField', [], {'db_index': 'True'})
        },
        'social_auth.usersocialauth': {
            'Meta': {'unique_together': "(('provider', 'uid'),)", 'object_name': 'UserSocialAuth'},
            'extra_data': ('social_auth.fields.JSONField', [], {'default': "'{}'"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'provider': ('django.db.models.fields.CharField', [], {'max_length': '32'}),
            'uid': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'social_auth'", 'to': u"orm['auth.User']"})
        }
    }

    complete_apps = ['social_auth', 'fiware']
    symmetrical = True
