# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration
from django.db import models
from commons.utils import db_table_exists


class Migration(SchemaMigration):

    def forwards(self, orm):

        if db_table_exists('gadget_xhtml'):
            return

        # Adding model 'XHTML'
        db.create_table('gadget_xhtml', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('uri', self.gf('django.db.models.fields.CharField')(unique=True, max_length=255)),
            ('code', self.gf('django.db.models.fields.TextField')()),
            ('url', self.gf('django.db.models.fields.CharField')(max_length=500)),
            ('content_type', self.gf('django.db.models.fields.CharField')(max_length=50, null=True, blank=True)),
            ('cacheable', self.gf('django.db.models.fields.BooleanField')(default=True)),
        ))
        db.send_create_signal('gadget', ['XHTML'])

        # Adding model 'Gadget'
        db.create_table('gadget_gadget', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('uri', self.gf('django.db.models.fields.CharField')(max_length=500)),
            ('vendor', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('version', self.gf('django.db.models.fields.CharField')(max_length=150)),
            ('display_name', self.gf('django.db.models.fields.CharField')(max_length=250, null=True, blank=True)),
            ('xhtml', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['gadget.XHTML'])),
            ('author', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('mail', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('wikiURI', self.gf('django.db.models.fields.URLField')(max_length=200)),
            ('imageURI', self.gf('django.db.models.fields.URLField')(max_length=200)),
            ('iPhoneImageURI', self.gf('django.db.models.fields.URLField')(max_length=200)),
            ('width', self.gf('django.db.models.fields.IntegerField')(default=1)),
            ('height', self.gf('django.db.models.fields.IntegerField')(default=1)),
            ('description', self.gf('django.db.models.fields.TextField')()),
            ('menuColor', self.gf('django.db.models.fields.CharField')(default='FFFFFF', max_length=6)),
            ('shared', self.gf('django.db.models.fields.NullBooleanField')(default=False, null=True, blank=True)),
            ('last_update', self.gf('django.db.models.fields.DateTimeField')(null=True)),
        ))
        db.send_create_signal('gadget', ['Gadget'])

        # Adding unique constraint on 'Gadget', fields ['vendor', 'name', 'version']
        db.create_unique('gadget_gadget', ['vendor', 'name', 'version'])

        # Adding M2M table for field users on 'Gadget'
        db.create_table('gadget_gadget_users', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('gadget', models.ForeignKey(orm['gadget.gadget'], null=False)),
            ('user', models.ForeignKey(orm['auth.user'], null=False))
        ))
        db.create_unique('gadget_gadget_users', ['gadget_id', 'user_id'])

        # Adding model 'Capability'
        db.create_table('gadget_capability', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('gadget', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['gadget.Gadget'])),
        ))
        db.send_create_signal('gadget', ['Capability'])

        # Adding unique constraint on 'Capability', fields ['name', 'value', 'gadget']
        db.create_unique('gadget_capability', ['name', 'value', 'gadget_id'])

        # Adding model 'SharedVariableDef'
        db.create_table('gadget_sharedvariabledef', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
        ))
        db.send_create_signal('gadget', ['SharedVariableDef'])

        # Adding model 'VariableDef'
        db.create_table('gadget_variabledef', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=1)),
            ('aspect', self.gf('django.db.models.fields.CharField')(max_length=4)),
            ('label', self.gf('django.db.models.fields.CharField')(max_length=50, null=True)),
            ('action_label', self.gf('django.db.models.fields.CharField')(max_length=50, null=True)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=250, null=True)),
            ('friend_code', self.gf('django.db.models.fields.CharField')(max_length=30, null=True)),
            ('default_value', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('shared_var_def', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['gadget.SharedVariableDef'], null=True, blank=True)),
            ('gadget', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['gadget.Gadget'])),
        ))
        db.send_create_signal('gadget', ['VariableDef'])

        # Adding model 'UserPrefOption'
        db.create_table('gadget_userprefoption', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('variableDef', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['gadget.VariableDef'])),
        ))
        db.send_create_signal('gadget', ['UserPrefOption'])

        # Adding model 'VariableDefAttr'
        db.create_table('gadget_variabledefattr', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('variableDef', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['gadget.VariableDef'])),
        ))
        db.send_create_signal('gadget', ['VariableDefAttr'])

        # Adding model 'ContextOption'
        db.create_table('gadget_contextoption', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('concept', self.gf('django.db.models.fields.CharField')(max_length=256)),
            ('varDef', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['gadget.VariableDef'])),
        ))
        db.send_create_signal('gadget', ['ContextOption'])


    def backwards(self, orm):

        # Removing unique constraint on 'Capability', fields ['name', 'value', 'gadget']
        db.delete_unique('gadget_capability', ['name', 'value', 'gadget_id'])

        # Removing unique constraint on 'Gadget', fields ['vendor', 'name', 'version']
        db.delete_unique('gadget_gadget', ['vendor', 'name', 'version'])

        # Deleting model 'XHTML'
        db.delete_table('gadget_xhtml')

        # Deleting model 'Gadget'
        db.delete_table('gadget_gadget')

        # Removing M2M table for field users on 'Gadget'
        db.delete_table('gadget_gadget_users')

        # Deleting model 'Capability'
        db.delete_table('gadget_capability')

        # Deleting model 'SharedVariableDef'
        db.delete_table('gadget_sharedvariabledef')

        # Deleting model 'VariableDef'
        db.delete_table('gadget_variabledef')

        # Deleting model 'UserPrefOption'
        db.delete_table('gadget_userprefoption')

        # Deleting model 'VariableDefAttr'
        db.delete_table('gadget_variabledefattr')

        # Deleting model 'ContextOption'
        db.delete_table('gadget_contextoption')


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
        'gadget.capability': {
            'Meta': {'unique_together': "(('name', 'value', 'gadget'),)", 'object_name': 'Capability'},
            'gadget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gadget.Gadget']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'gadget.contextoption': {
            'Meta': {'object_name': 'ContextOption'},
            'concept': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'varDef': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gadget.VariableDef']"})
        },
        'gadget.gadget': {
            'Meta': {'unique_together': "(('vendor', 'name', 'version'),)", 'object_name': 'Gadget'},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'display_name': ('django.db.models.fields.CharField', [], {'max_length': '250', 'null': 'True', 'blank': 'True'}),
            'height': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'iPhoneImageURI': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imageURI': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'last_update': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'mail': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'menuColor': ('django.db.models.fields.CharField', [], {'default': "'FFFFFF'", 'max_length': '6'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'shared': ('django.db.models.fields.NullBooleanField', [], {'default': 'False', 'null': 'True', 'blank': 'True'}),
            'uri': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'users': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.User']", 'symmetrical': 'False'}),
            'vendor': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'version': ('django.db.models.fields.CharField', [], {'max_length': '150'}),
            'width': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'wikiURI': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'xhtml': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gadget.XHTML']"})
        },
        'gadget.sharedvariabledef': {
            'Meta': {'object_name': 'SharedVariableDef'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'})
        },
        'gadget.userprefoption': {
            'Meta': {'object_name': 'UserPrefOption'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'variableDef': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gadget.VariableDef']"})
        },
        'gadget.variabledef': {
            'Meta': {'object_name': 'VariableDef'},
            'action_label': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'aspect': ('django.db.models.fields.CharField', [], {'max_length': '4'}),
            'default_value': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '250', 'null': 'True'}),
            'friend_code': ('django.db.models.fields.CharField', [], {'max_length': '30', 'null': 'True'}),
            'gadget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gadget.Gadget']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'label': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'shared_var_def': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gadget.SharedVariableDef']", 'null': 'True', 'blank': 'True'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '1'})
        },
        'gadget.variabledefattr': {
            'Meta': {'object_name': 'VariableDefAttr'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'variableDef': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gadget.VariableDef']"})
        },
        'gadget.xhtml': {
            'Meta': {'object_name': 'XHTML'},
            'cacheable': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'code': ('django.db.models.fields.TextField', [], {}),
            'content_type': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'uri': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '500'})
        }
    }

    complete_apps = ['gadget']
