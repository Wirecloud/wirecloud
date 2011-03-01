# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration
from commons.utils import db_table_exists

class Migration(SchemaMigration):

    def forwards(self, orm):

        if db_table_exists('context_concept'):
            return

        # Adding model 'Concept'
        db.create_table('context_concept', (
            ('concept', self.gf('django.db.models.fields.CharField')(max_length=255, primary_key=True)),
            ('source', self.gf('django.db.models.fields.CharField')(max_length=4)),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=4)),
            ('adaptor', self.gf('django.db.models.fields.CharField')(max_length=256, null=True)),
        ))
        db.send_create_signal('context', ['Concept'])

        # Adding model 'ConceptName'
        db.create_table('context_conceptname', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=256)),
            ('concept', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['context.Concept'])),
        ))
        db.send_create_signal('context', ['ConceptName'])


    def backwards(self, orm):

        # Deleting model 'Concept'
        db.delete_table('context_concept')

        # Deleting model 'ConceptName'
        db.delete_table('context_conceptname')


    models = {
        'context.concept': {
            'Meta': {'object_name': 'Concept'},
            'adaptor': ('django.db.models.fields.CharField', [], {'max_length': '256', 'null': 'True'}),
            'concept': ('django.db.models.fields.CharField', [], {'max_length': '255', 'primary_key': 'True'}),
            'source': ('django.db.models.fields.CharField', [], {'max_length': '4'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '4'})
        },
        'context.conceptname': {
            'Meta': {'object_name': 'ConceptName'},
            'concept': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['context.Concept']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256'})
        }
    }

    complete_apps = ['context']
