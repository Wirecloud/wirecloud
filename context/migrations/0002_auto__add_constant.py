# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration


class Migration(SchemaMigration):

    def forwards(self, orm):

        # Adding model 'Constant'
        db.create_table('context_constant', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('concept', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['context.Concept'], unique=True)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=256)),
        ))
        db.send_create_signal('context', ['Constant'])

    def backwards(self, orm):

        # Deleting model 'Constant'
        db.delete_table('context_constant')

    models = {
        'context.concept': {
            'Meta': {'object_name': 'Concept'},
            'adaptor': ('django.db.models.fields.CharField', [], {'max_length': '256', 'null': 'True'}),
            'concept': ('django.db.models.fields.CharField', [], {'max_length': '255', 'primary_key': 'True'}),
            'source': ('django.db.models.fields.CharField', [], {'max_length': '4'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '4'}),
        },
        'context.conceptname': {
            'Meta': {'object_name': 'ConceptName'},
            'concept': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['context.Concept']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
        },
        'context.constant': {
            'Meta': {'object_name': 'Constant'},
            'concept': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['context.Concept']", 'unique': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
        },
    }

    complete_apps = ['context']
