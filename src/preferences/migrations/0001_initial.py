# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration
from commons.utils import db_table_exists

class Migration(SchemaMigration):

    def forwards(self, orm):

        if db_table_exists('preferences_platformpreference'):
            return

        # Adding model 'PlatformPreference'
        db.create_table('preferences_platformpreference', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=250)),
        ))
        db.send_create_signal('preferences', ['PlatformPreference'])

        # Adding model 'WorkSpacePreference'
        db.create_table('preferences_workspacepreference', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('workspace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['workspace.WorkSpace'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('inherit', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=250)),
        ))
        db.send_create_signal('preferences', ['WorkSpacePreference'])

        # Adding model 'TabPreference'
        db.create_table('preferences_tabpreference', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('tab', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['workspace.Tab'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('inherit', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=250)),
        ))
        db.send_create_signal('preferences', ['TabPreference'])


    def backwards(self, orm):

        # Deleting model 'PlatformPreference'
        db.delete_table('preferences_platformpreference')

        # Deleting model 'WorkSpacePreference'
        db.delete_table('preferences_workspacepreference')

        # Deleting model 'TabPreference'
        db.delete_table('preferences_tabpreference')


    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'layout.branding': {
            'Meta': {'object_name': 'Branding'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'link': ('django.db.models.fields.URLField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'logo': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'viewer_logo': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'})
        },
        'preferences.platformpreference': {
            'Meta': {'object_name': 'PlatformPreference'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '250'})
        },
        'preferences.tabpreference': {
            'Meta': {'object_name': 'TabPreference'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inherit': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'tab': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.Tab']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '250'})
        },
        'preferences.workspacepreference': {
            'Meta': {'object_name': 'WorkSpacePreference'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inherit': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'workspace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.WorkSpace']"})
        },
        'workspace.abstractvariable': {
            'Meta': {'object_name': 'AbstractVariable'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '10'})
        },
        'workspace.tab': {
            'Meta': {'object_name': 'Tab'},
            'abstract_variable': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.AbstractVariable']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'position': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'visible': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'workspace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.WorkSpace']"})
        },
        'workspace.userworkspace': {
            'Meta': {'object_name': 'UserWorkSpace'},
            'active': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'workspace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.WorkSpace']"})
        },
        'workspace.workspace': {
            'Meta': {'object_name': 'WorkSpace'},
            'branding': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['layout.Branding']", 'null': 'True', 'blank': 'True'}),
            'creator': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'creator'", 'null': 'True', 'to': "orm['auth.User']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'targetOrganizations': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': "orm['auth.Group']", 'null': 'True', 'blank': 'True'}),
            'users': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.User']", 'through': "orm['workspace.UserWorkSpace']", 'symmetrical': 'False'})
        }
    }

    complete_apps = ['preferences']
