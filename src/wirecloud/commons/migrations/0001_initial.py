# -*- coding: utf-8 -*-
from south.db import db
from south.v2 import SchemaMigration


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Translation'
        db.create_table('wirecloudcommons_translation', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('text_id', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('element_id', self.gf('django.db.models.fields.IntegerField')()),
            ('table', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('language', self.gf('django.db.models.fields.CharField')(max_length=2)),
            ('default', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('value', self.gf('django.db.models.fields.TextField')(blank=True)),
        ))
        db.send_create_signal('commons', ['Translation'])

    def backwards(self, orm):
        # Deleting model 'Translation'
        db.delete_table('wirecloudcommons_translation')

    models = {
        'commons.translation': {
            'Meta': {'object_name': 'Translation', 'db_table': "'wirecloudcommons_translation'"},
            'default': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'element_id': ('django.db.models.fields.IntegerField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '2'}),
            'table': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'text_id': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'value': ('django.db.models.fields.TextField', [], {'blank': 'True'})
        }
    }

    complete_apps = ['commons']
