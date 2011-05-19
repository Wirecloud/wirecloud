# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration


class Migration(SchemaMigration):

    def forwards(self, orm):

        # Adding field 'Concept.label'
        db.add_column('context_concept', 'label', self.gf('django.db.models.fields.CharField')(default='', max_length=50), keep_default=False)

        # Adding field 'Concept.description'
        db.add_column('context_concept', 'description', self.gf('django.db.models.fields.TextField')(default='', blank=True), keep_default=False)

    def backwards(self, orm):

        # Deleting field 'Concept.label'
        db.delete_column('context_concept', 'label')

        # Deleting field 'Concept.description'
        db.delete_column('context_concept', 'description')

    models = {
        'context.concept': {
            'Meta': {'object_name': 'Concept'},
            'adaptor': ('django.db.models.fields.CharField', [], {'max_length': '256', 'null': 'True'}),
            'concept': ('django.db.models.fields.CharField', [], {'max_length': '255', 'primary_key': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'label': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
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
        }
    }

    complete_apps = ['context']
