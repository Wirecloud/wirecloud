# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration
from commons.utils import db_table_exists


class Migration(SchemaMigration):

    def forwards(self, orm):

        if db_table_exists('gadgetGenerator_template'):
            return

        # Adding model 'Template'
        db.create_table('gadgetGenerator_template', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=250)),
            ('defaultContext', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('gadgetGenerator', ['Template'])

        # Adding model 'TemplateInstance'
        db.create_table('gadgetGenerator_templateinstance', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('context', self.gf('django.db.models.fields.TextField')()),
            ('template', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['gadgetGenerator.Template'])),
        ))
        db.send_create_signal('gadgetGenerator', ['TemplateInstance'])

    def backwards(self, orm):

        # Deleting model 'Template'
        db.delete_table('gadgetGenerator_template')

        # Deleting model 'TemplateInstance'
        db.delete_table('gadgetGenerator_templateinstance')

    models = {
        'gadgetGenerator.template': {
            'Meta': {'object_name': 'Template'},
            'defaultContext': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '250'})},
        'gadgetGenerator.templateinstance': {
            'Meta': {'object_name': 'TemplateInstance'},
            'context': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'template': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gadgetGenerator.Template']"})
        }
    }

    complete_apps = ['gadgetGenerator']
