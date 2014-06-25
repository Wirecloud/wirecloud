# -*- coding: utf-8 -*-
from south.db import db
from south.v2 import SchemaMigration


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Application'
        db.create_table('oauth2provider_application', (
            ('client_id', self.gf('django.db.models.fields.CharField')(max_length=40, primary_key=True)),
            ('client_secret', self.gf('django.db.models.fields.CharField')(max_length=40)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=40)),
            ('home_url', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('redirect_uri', self.gf('django.db.models.fields.CharField')(max_length=255, blank=True)),
        ))
        db.send_create_signal('oauth2provider', ['Application'])

        # Adding model 'Code'
        db.create_table('oauth2provider_code', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('client', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['oauth2provider.Application'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('scope', self.gf('django.db.models.fields.CharField')(max_length=255, blank=True)),
            ('code', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('expires_in', self.gf('django.db.models.fields.CharField')(max_length=40, blank=True)),
        ))
        db.send_create_signal('oauth2provider', ['Code'])

        # Adding unique constraint on 'Code', fields ['client', 'code']
        db.create_unique('oauth2provider_code', ['client_id', 'code'])

        # Adding model 'Token'
        db.create_table('oauth2provider_token', (
            ('token', self.gf('django.db.models.fields.CharField')(max_length=40, primary_key=True)),
            ('client', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['oauth2provider.Application'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('scope', self.gf('django.db.models.fields.CharField')(max_length=255, blank=True)),
            ('token_type', self.gf('django.db.models.fields.CharField')(max_length=10)),
            ('refresh_token', self.gf('django.db.models.fields.CharField')(max_length=40, blank=True)),
            ('expires_in', self.gf('django.db.models.fields.CharField')(max_length=40, blank=True)),
        ))
        db.send_create_signal('oauth2provider', ['Token'])

    def backwards(self, orm):
        # Removing unique constraint on 'Code', fields ['client', 'code']
        db.delete_unique('oauth2provider_code', ['client_id', 'code'])

        # Deleting model 'Application'
        db.delete_table('oauth2provider_application')

        # Deleting model 'Code'
        db.delete_table('oauth2provider_code')

        # Deleting model 'Token'
        db.delete_table('oauth2provider_token')

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
            'expires_in': ('django.db.models.fields.CharField', [], {'max_length': '40', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'scope': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'oauth2provider.token': {
            'Meta': {'object_name': 'Token'},
            'client': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['oauth2provider.Application']"}),
            'expires_in': ('django.db.models.fields.CharField', [], {'max_length': '40', 'blank': 'True'}),
            'refresh_token': ('django.db.models.fields.CharField', [], {'max_length': '40', 'blank': 'True'}),
            'scope': ('django.db.models.fields.CharField', [], {'max_length': '255', 'blank': 'True'}),
            'token': ('django.db.models.fields.CharField', [], {'max_length': '40', 'primary_key': 'True'}),
            'token_type': ('django.db.models.fields.CharField', [], {'max_length': '10'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        }
    }

    complete_apps = ['oauth2provider']
