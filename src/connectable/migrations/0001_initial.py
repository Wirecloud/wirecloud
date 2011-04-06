# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration
from django.db import models
from commons.utils import db_table_exists


class Migration(SchemaMigration):

    depends_on = (
        ("remoteChannel", "0001_initial"),
    )

    def forwards(self, orm):

        if db_table_exists('connectable_filter'):
            return

        # Adding model 'Filter'
        db.create_table('connectable_filter', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('code', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('label', self.gf('django.db.models.fields.CharField')(max_length=50, null=True)),
            ('nature', self.gf('django.db.models.fields.CharField')(max_length=6)),
            ('category', self.gf('django.db.models.fields.CharField')(max_length=6, null=True)),
            ('help_text', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('params', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
        ))
        db.send_create_signal('connectable', ['Filter'])

        # Adding model 'RemoteSubscription'
        db.create_table('connectable_remotesubscription', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('remote_channel', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['remoteChannel.RemoteChannel'])),
            ('operation_code', self.gf('django.db.models.fields.CharField')(max_length=1)),
        ))
        db.send_create_signal('connectable', ['RemoteSubscription'])

        # Adding model 'InOut'
        db.create_table('connectable_inout', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('workspace_variable', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['workspace.WorkSpaceVariable'])),
            ('friend_code', self.gf('django.db.models.fields.CharField')(max_length=30, null=True, blank=True)),
            ('filter', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['connectable.Filter'], null=True)),
            ('filter_param_values', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('remote_subscription', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['connectable.RemoteSubscription'], null=True)),
            ('readOnly', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('connectable', ['InOut'])

        # Adding model 'In'
        db.create_table('connectable_in', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('variable', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['igadget.Variable'])),
        ))
        db.send_create_signal('connectable', ['In'])

        # Adding M2M table for field inouts on 'In'
        db.create_table('connectable_in_inouts', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('in', models.ForeignKey(orm['connectable.in'], null=False)),
            ('inout', models.ForeignKey(orm['connectable.inout'], null=False))
        ))
        db.create_unique('connectable_in_inouts', ['in_id', 'inout_id'])

        # Adding model 'Out'
        db.create_table('connectable_out', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('abstract_variable', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['workspace.AbstractVariable'])),
        ))
        db.send_create_signal('connectable', ['Out'])

        # Adding M2M table for field inouts on 'Out'
        db.create_table('connectable_out_inouts', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('out', models.ForeignKey(orm['connectable.out'], null=False)),
            ('inout', models.ForeignKey(orm['connectable.inout'], null=False))
        ))
        db.create_unique('connectable_out_inouts', ['out_id', 'inout_id'])

        # Adding model 'RelatedInOut'
        db.create_table('connectable_relatedinout', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('in_inout', self.gf('django.db.models.fields.related.ForeignKey')(related_name='in_inouts', to=orm['connectable.InOut'])),
            ('out_inout', self.gf('django.db.models.fields.related.ForeignKey')(related_name='out_inouts', to=orm['connectable.InOut'])),
        ))
        db.send_create_signal('connectable', ['RelatedInOut'])


    def backwards(self, orm):

        # Deleting model 'Filter'
        db.delete_table('connectable_filter')

        # Deleting model 'RemoteSubscription'
        db.delete_table('connectable_remotesubscription')

        # Deleting model 'InOut'
        db.delete_table('connectable_inout')

        # Deleting model 'In'
        db.delete_table('connectable_in')

        # Removing M2M table for field inouts on 'In'
        db.delete_table('connectable_in_inouts')

        # Deleting model 'Out'
        db.delete_table('connectable_out')

        # Removing M2M table for field inouts on 'Out'
        db.delete_table('connectable_out_inouts')

        # Deleting model 'RelatedInOut'
        db.delete_table('connectable_relatedinout')


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
        'connectable.filter': {
            'Meta': {'object_name': 'Filter'},
            'category': ('django.db.models.fields.CharField', [], {'max_length': '6', 'null': 'True'}),
            'code': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'help_text': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'label': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'nature': ('django.db.models.fields.CharField', [], {'max_length': '6'}),
            'params': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'})
        },
        'connectable.in': {
            'Meta': {'object_name': 'In'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inouts': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['connectable.InOut']", 'symmetrical': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'variable': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['igadget.Variable']"})
        },
        'connectable.inout': {
            'Meta': {'object_name': 'InOut'},
            'filter': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['connectable.Filter']", 'null': 'True'}),
            'filter_param_values': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'friend_code': ('django.db.models.fields.CharField', [], {'max_length': '30', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'readOnly': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'remote_subscription': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['connectable.RemoteSubscription']", 'null': 'True'}),
            'workspace_variable': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.WorkSpaceVariable']"})
        },
        'connectable.out': {
            'Meta': {'object_name': 'Out'},
            'abstract_variable': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.AbstractVariable']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inouts': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['connectable.InOut']", 'symmetrical': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'})
        },
        'connectable.relatedinout': {
            'Meta': {'object_name': 'RelatedInOut'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'in_inout': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'in_inouts'", 'to': "orm['connectable.InOut']"}),
            'out_inout': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'out_inouts'", 'to': "orm['connectable.InOut']"})
        },
        'connectable.remotesubscription': {
            'Meta': {'object_name': 'RemoteSubscription'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'operation_code': ('django.db.models.fields.CharField', [], {'max_length': '1'}),
            'remote_channel': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['remoteChannel.RemoteChannel']"})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
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
        'gadget.xhtml': {
            'Meta': {'object_name': 'XHTML'},
            'cacheable': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'code': ('django.db.models.fields.TextField', [], {}),
            'content_type': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'uri': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '500'})
        },
        'igadget.igadget': {
            'Meta': {'object_name': 'IGadget'},
            'gadget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gadget.Gadget']"}),
            'icon_position': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'Icon_Position'", 'null': 'True', 'to': "orm['igadget.Position']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'layout': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'menu_color': ('django.db.models.fields.CharField', [], {'default': "'FFFFFF'", 'max_length': '6'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'position': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'Position'", 'to': "orm['igadget.Position']"}),
            'readOnly': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'refused_version': ('django.db.models.fields.CharField', [], {'max_length': '150', 'null': 'True', 'blank': 'True'}),
            'tab': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.Tab']"}),
            'transparency': ('django.db.models.fields.BooleanField', [], {'default': 'False'})
        },
        'igadget.position': {
            'Meta': {'object_name': 'Position'},
            'fulldragboard': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'height': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'minimized': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'posX': ('django.db.models.fields.IntegerField', [], {}),
            'posY': ('django.db.models.fields.IntegerField', [], {}),
            'posZ': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'width': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        'igadget.variable': {
            'Meta': {'object_name': 'Variable'},
            'abstract_variable': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['workspace.AbstractVariable']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'igadget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['igadget.IGadget']"}),
            'vardef': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gadget.VariableDef']"})
        },
        'layout.branding': {
            'Meta': {'object_name': 'Branding'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'link': ('django.db.models.fields.URLField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'logo': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'}),
            'viewer_logo': ('django.db.models.fields.CharField', [], {'max_length': '500', 'null': 'True', 'blank': 'True'})
        },
        'remoteChannel.remotechannel': {
            'Meta': {'object_name': 'RemoteChannel'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'url': ('django.db.models.fields.URLField', [], {'unique': 'True', 'max_length': '200'}),
            'value': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'})
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

    complete_apps = ['connectable']
