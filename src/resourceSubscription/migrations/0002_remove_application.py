# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration


class Migration(SchemaMigration):

    needed_by = (
        ('catalogue', '0005_del_application'),
    )

    def forwards(self, orm):

        # Deleting model 'Contract'
        db.delete_table('resourceSubscription_contract')

    def backwards(self, orm):

        # Adding model 'Contract'
        db.create_table('resourceSubscription_contract', (
            ('times_used', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('free', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('application', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.Application'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('resourceSubscription', ['Contract'])

    models = {}

    complete_apps = ['resourceSubscription']
