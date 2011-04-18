# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration
from commons.utils import db_table_exists
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):

        if db_table_exists('workspace_workspace'):
            return

        # Adding model 'WorkSpace'
        db.create_table('workspace_workspace', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('creator', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='creator', null=True, to=orm['auth.User'])),
        ))
        db.send_create_signal('workspace', ['WorkSpace'])

        # Adding M2M table for field targetOrganizations on 'WorkSpace'
        db.create_table('workspace_workspace_targetOrganizations', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('workspace', models.ForeignKey(orm['workspace.workspace'], null=False)),
            ('group', models.ForeignKey(orm['auth.group'], null=False))
        ))
        db.create_unique('workspace_workspace_targetOrganizations', ['workspace_id', 'group_id'])

        # Adding model 'UserWorkSpace'
        db.create_table('workspace_userworkspace', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('workspace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['workspace.WorkSpace'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('active', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('workspace', ['UserWorkSpace'])

        # Adding model 'PublishedWorkSpace'
        db.create_table('workspace_publishedworkspace', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=10)),
            ('credentials', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('vendor', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('version', self.gf('django.db.models.fields.CharField')(max_length=150)),
            ('wikiURI', self.gf('django.db.models.fields.URLField')(max_length=200)),
            ('imageURI', self.gf('django.db.models.fields.URLField')(max_length=200)),
            ('description', self.gf('django.db.models.fields.TextField')()),
            ('author', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('mail', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('organization', self.gf('django.db.models.fields.CharField')(max_length=80, null=True, blank=True)),
            ('workspace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['workspace.WorkSpace'])),
            ('contratable', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('workspace', ['PublishedWorkSpace'])

        # Adding model 'Category'
        db.create_table('workspace_category', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('category_id', self.gf('django.db.models.fields.IntegerField')()),
            ('default_workspace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['workspace.PublishedWorkSpace'], null=True, blank=True)),
            ('new_workspace', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='new_workspace_', null=True, to=orm['workspace.PublishedWorkSpace'])),
        ))
        db.send_create_signal('workspace', ['Category'])

        # Adding model 'AbstractVariable'
        db.create_table('workspace_abstractvariable', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=10)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
        ))
        db.send_create_signal('workspace', ['AbstractVariable'])

        # Adding model 'SharedVariableValue'
        db.create_table('workspace_sharedvariablevalue', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('shared_var_def', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['gadget.SharedVariableDef'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('value', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
        ))
        db.send_create_signal('workspace', ['SharedVariableValue'])

        # Adding unique constraint on 'SharedVariableValue', fields ['shared_var_def', 'user']
        db.create_unique('workspace_sharedvariablevalue', ['shared_var_def_id', 'user_id'])

        # Adding model 'VariableValue'
        db.create_table('workspace_variablevalue', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('value', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('abstract_variable', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['workspace.AbstractVariable'])),
            ('shared_var_value', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['workspace.SharedVariableValue'], null=True, blank=True)),
        ))
        db.send_create_signal('workspace', ['VariableValue'])

        # Adding model 'WorkSpaceVariable'
        db.create_table('workspace_workspacevariable', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('workspace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['workspace.WorkSpace'])),
            ('abstract_variable', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['workspace.AbstractVariable'])),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=1)),
            ('aspect', self.gf('django.db.models.fields.CharField')(max_length=12)),
        ))
        db.send_create_signal('workspace', ['WorkSpaceVariable'])

        # Adding model 'Tab'
        db.create_table('workspace_tab', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('visible', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('position', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('workspace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['workspace.WorkSpace'])),
            ('abstract_variable', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['workspace.AbstractVariable'])),
        ))
        db.send_create_signal('workspace', ['Tab'])

    def backwards(self, orm):

        # Removing unique constraint on 'SharedVariableValue', fields ['shared_var_def', 'user']
        db.delete_unique('workspace_sharedvariablevalue', ['shared_var_def_id', 'user_id'])

        # Deleting model 'WorkSpace'
        db.delete_table('workspace_workspace')

        # Removing M2M table for field targetOrganizations on 'WorkSpace'
        db.delete_table('workspace_workspace_targetOrganizations')

        # Deleting model 'UserWorkSpace'
        db.delete_table('workspace_userworkspace')

        # Deleting model 'PublishedWorkSpace'
        db.delete_table('workspace_publishedworkspace')

        # Deleting model 'Category'
        db.delete_table('workspace_category')

        # Deleting model 'AbstractVariable'
        db.delete_table('workspace_abstractvariable')

        # Deleting model 'SharedVariableValue'
        db.delete_table('workspace_sharedvariablevalue')

        # Deleting model 'VariableValue'
        db.delete_table('workspace_variablevalue')

        # Deleting model 'WorkSpaceVariable'
        db.delete_table('workspace_workspacevariable')

        # Deleting model 'Tab'
        db.delete_table('workspace_tab')

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
        'gadget.sharedvariabledef': {
            'Meta': {'object_name': 'SharedVariableDef'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'})
        },
        'workspace.abstractvariable': {
            'Meta': {'object_name': 'AbstractVariable'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '10'})
        },
        'workspace.category': {
            'Meta': {'object_name': 'Category'},
            'category_id': ('django.db.models.fields.IntegerField', [], {}),
            'default_workspace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.PublishedWorkSpace']", 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'new_workspace': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'new_workspace_'", 'null': 'True', 'to': "orm['workspace.PublishedWorkSpace']"})
        },
        'workspace.publishedworkspace': {
            'Meta': {'object_name': 'PublishedWorkSpace'},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'contratable': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'credentials': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imageURI': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'mail': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'organization': ('django.db.models.fields.CharField', [], {'max_length': '80', 'null': 'True', 'blank': 'True'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '10'}),
            'vendor': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'version': ('django.db.models.fields.CharField', [], {'max_length': '150'}),
            'wikiURI': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'workspace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.WorkSpace']"})
        },
        'workspace.sharedvariablevalue': {
            'Meta': {'unique_together': "(('shared_var_def', 'user'),)", 'object_name': 'SharedVariableValue'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'shared_var_def': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gadget.SharedVariableDef']"}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'value': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'})
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
        'workspace.variablevalue': {
            'Meta': {'object_name': 'VariableValue'},
            'abstract_variable': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.AbstractVariable']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'shared_var_value': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.SharedVariableValue']", 'null': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'value': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'})
        },
        'workspace.workspace': {
            'Meta': {'object_name': 'WorkSpace'},
            'creator': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'creator'", 'null': 'True', 'to': "orm['auth.User']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'targetOrganizations': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': "orm['auth.Group']", 'null': 'True', 'blank': 'True'}),
            'users': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.User']", 'through': "orm['workspace.UserWorkSpace']", 'symmetrical': 'False'})
        },
        'workspace.workspacevariable': {
            'Meta': {'object_name': 'WorkSpaceVariable'},
            'abstract_variable': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.AbstractVariable']"}),
            'aspect': ('django.db.models.fields.CharField', [], {'max_length': '12'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '1'}),
            'workspace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.WorkSpace']"})
        }
    }

    complete_apps = ['workspace']
