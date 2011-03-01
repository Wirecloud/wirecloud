# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration
from commons.utils import db_table_exists

class Migration(SchemaMigration):

    def forwards(self, orm):

        if db_table_exists('translator_translation'):
            return

        # Adding model 'Translation'
        db.create_table('translator_translation', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('text_id', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('element_id', self.gf('django.db.models.fields.IntegerField')()),
            ('table', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('language', self.gf('django.db.models.fields.CharField')(max_length=2)),
            ('default', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('value', self.gf('django.db.models.fields.TextField')(null=True)),
        ))
        db.send_create_signal('translator', ['Translation'])


    def backwards(self, orm):

        # Deleting model 'Translation'
        db.delete_table('translator_translation')


    models = {
        'translator.translation': {
            'Meta': {'object_name': 'Translation'},
            'default': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'element_id': ('django.db.models.fields.IntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '2'}),
            'table': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'text_id': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'value': ('django.db.models.fields.TextField', [], {'null': 'True'})
        }
    }

    complete_apps = ['translator']
