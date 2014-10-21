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

from south.db import db
from south.v2 import SchemaMigration


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding field 'Code.creation_timestamp'
        db.add_column('oauth2provider_code', 'creation_timestamp',
                      self.gf('django.db.models.fields.CharField')(default='0', max_length=40),
                      keep_default=False)

        # Adding field 'Token.creation_timestamp'
        db.add_column('oauth2provider_token', 'creation_timestamp',
                      self.gf('django.db.models.fields.CharField')(default='0', max_length=40),
                      keep_default=False)

    def backwards(self, orm):
        # Deleting field 'Code.creation_timestamp'
        db.delete_column('oauth2provider_code', 'creation_timestamp')

        # Deleting field 'Token.creation_timestamp'
        db.delete_column('oauth2provider_token', 'creation_timestamp')

    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'oauth2provider.application': {
            'Meta': {'object_name': 'Application'},
            'client_id': ('django.db.models.fields.CharField', [], {'max_length': '40', 'primary_key': 'True'}),
            'client_secret': ('django.db.models.fields.CharField', [], {'max_length': '40'}),
            'home_url': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '40'}),
            'redirect_uri': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'})
        },
        'oauth2provider.code': {
            'Meta': {'unique_together': "(('client', 'code'),)", 'object_name': 'Code'},
            'client': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['oauth2provider.Application']"}),
            'code': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'creation_timestamp': ('django.db.models.fields.CharField', [], {'max_length': '40'}),
            'expires_in': ('django.db.models.fields.CharField', [], {'max_length': '40', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'scope': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'oauth2provider.token': {
            'Meta': {'object_name': 'Token'},
            'client': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['oauth2provider.Application']"}),
            'creation_timestamp': ('django.db.models.fields.CharField', [], {'max_length': '40'}),
            'expires_in': ('django.db.models.fields.CharField', [], {'max_length': '40', 'blank': 'True'}),
            'refresh_token': ('django.db.models.fields.CharField', [], {'max_length': '40', 'blank': 'True'}),
            'scope': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'token': ('django.db.models.fields.CharField', [], {'max_length': '40', 'primary_key': 'True'}),
            'token_type': ('django.db.models.fields.CharField', [], {'max_length': '10'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        }
    }

    complete_apps = ['oauth2provider']
