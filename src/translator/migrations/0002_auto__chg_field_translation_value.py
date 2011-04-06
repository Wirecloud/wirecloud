# encoding: utf-8

from south.db import db
from south.v2 import SchemaMigration


class Migration(SchemaMigration):

    def forwards(self, orm):

        # Changing field 'Translation.value'
        db.alter_column('translator_translation', 'value', self.gf('django.db.models.fields.TextField')(default=''))

    def backwards(self, orm):

        # Changing field 'Translation.value'
        db.alter_column('translator_translation', 'value', self.gf('django.db.models.fields.TextField')(null=True))

    models = {
        'translator.translation': {
            'Meta': {'object_name': 'Translation'},
            'default': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'element_id': ('django.db.models.fields.IntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '2'}),
            'table': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'text_id': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'value': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
        }
    }

    complete_apps = ['translator']
