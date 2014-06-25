# -*- coding: utf-8 -*-
from south.db import db
from south.v2 import SchemaMigration


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting model 'Translation'
        db.delete_table('wirecloudcommons_translation')

    def backwards(self, orm):
        # Adding model 'Translation'
        db.create_table('wirecloudcommons_translation', (
            ('text_id', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('language', self.gf('django.db.models.fields.CharField')(max_length=2)),
            ('default', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('table', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('element_id', self.gf('django.db.models.fields.IntegerField')()),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('value', self.gf('django.db.models.fields.TextField')(blank=True)),
        ))
        db.send_create_signal('commons', ['Translation'])

    models = {}

    complete_apps = ['commons']
