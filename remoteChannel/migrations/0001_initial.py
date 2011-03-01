# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration
from commons.utils import db_table_exists

class Migration(SchemaMigration):

    def forwards(self, orm):

        if db_table_exists('remoteChannel_remotechannel'):
            return

        # Adding model 'RemoteChannel'
        db.create_table('remoteChannel_remotechannel', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('url', self.gf('django.db.models.fields.URLField')(unique=True, max_length=200)),
            ('value', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
        ))
        db.send_create_signal('remoteChannel', ['RemoteChannel'])


    def backwards(self, orm):

        # Deleting model 'RemoteChannel'
        db.delete_table('remoteChannel_remotechannel')


    models = {
        'remoteChannel.remotechannel': {
            'Meta': {'object_name': 'RemoteChannel'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'url': ('django.db.models.fields.URLField', [], {'unique': 'True', 'max_length': '200'}),
            'value': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['remoteChannel']
