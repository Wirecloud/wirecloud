# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration


class Migration(SchemaMigration):

    depends_on = (
        ("connectable", "0004_remove_remotechannel_app"),
    )

    def forwards(self, orm):

        # Deleting model 'RemoteChannel'
        db.delete_table('remoteChannel_remotechannel')

    def backwards(self, orm):

        # Adding model 'RemoteChannel'
        db.create_table('remoteChannel_remotechannel', (
            ('url', self.gf('django.db.models.fields.URLField')(max_length=200, unique=True)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('value', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
        ))
        db.send_create_signal('remoteChannel', ['RemoteChannel'])

    models = {}

    complete_apps = ['remoteChannel']
