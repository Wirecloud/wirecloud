# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration
from commons.utils import db_table_exists
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):

        if db_table_exists('catalogue_translation'):
            return

        # Adding model 'Translation'
        db.create_table('catalogue_translation', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('text_id', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('element_id', self.gf('django.db.models.fields.IntegerField')()),
            ('table', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('language', self.gf('django.db.models.fields.CharField')(max_length=2)),
            ('value', self.gf('django.db.models.fields.TextField')(null=True)),
            ('default', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('catalogue', ['Translation'])

        # Adding model 'GadgetResource'
        db.create_table('catalogue_gadgetresource', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('short_name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('display_name', self.gf('django.db.models.fields.CharField')(max_length=250, null=True, blank=True)),
            ('vendor', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('version', self.gf('django.db.models.fields.CharField')(max_length=150)),
            ('ie_compatible', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('solution', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('author', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('mail', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('creator', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'], null=True, blank=True)),
            ('description', self.gf('django.db.models.fields.TextField')()),
            ('size', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, blank=True)),
            ('license', self.gf('django.db.models.fields.CharField')(max_length=20, null=True, blank=True)),
            ('gadget_uri', self.gf('django.db.models.fields.CharField')(max_length=200, null=True, blank=True)),
            ('creation_date', self.gf('django.db.models.fields.DateTimeField')(null=True)),
            ('image_uri', self.gf('django.db.models.fields.CharField')(max_length=200, null=True)),
            ('iphone_image_uri', self.gf('django.db.models.fields.CharField')(max_length=200, null=True, blank=True)),
            ('wiki_page_uri', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('template_uri', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('mashup_id', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('certification', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='certification', null=True, to=orm['auth.Group'])),
            ('popularity', self.gf('django.db.models.fields.DecimalField')(null=True, max_digits=2, decimal_places=1)),
            ('fromWGT', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('catalogue', ['GadgetResource'])

        # Adding unique constraint on 'GadgetResource', fields ['short_name', 'vendor', 'version']
        db.create_unique('catalogue_gadgetresource', ['short_name', 'vendor', 'version'])

        # Adding M2M table for field organization on 'GadgetResource'
        db.create_table('catalogue_gadgetresource_organization', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('gadgetresource', models.ForeignKey(orm['catalogue.gadgetresource'], null=False)),
            ('group', models.ForeignKey(orm['auth.group'], null=False))
        ))
        db.create_unique('catalogue_gadgetresource_organization', ['gadgetresource_id', 'group_id'])

        # Adding model 'Capability'
        db.create_table('catalogue_capability', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('resource', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.GadgetResource'])),
        ))
        db.send_create_signal('catalogue', ['Capability'])

        # Adding unique constraint on 'Capability', fields ['name', 'value', 'resource']
        db.create_unique('catalogue_capability', ['name', 'value', 'resource_id'])

        # Adding model 'UserRelatedToGadgetResource'
        db.create_table('catalogue_userrelatedtogadgetresource', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('gadget', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.GadgetResource'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('added_by', self.gf('django.db.models.fields.NullBooleanField')(null=True, blank=True)),
            ('preferred_by', self.gf('django.db.models.fields.NullBooleanField')(null=True, blank=True)),
        ))
        db.send_create_signal('catalogue', ['UserRelatedToGadgetResource'])

        # Adding unique constraint on 'UserRelatedToGadgetResource', fields ['gadget', 'user']
        db.create_unique('catalogue_userrelatedtogadgetresource', ['gadget_id', 'user_id'])

        # Adding model 'GadgetWiring'
        db.create_table('catalogue_gadgetwiring', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('friendcode', self.gf('django.db.models.fields.CharField')(max_length=30, null=True, blank=True)),
            ('wiring', self.gf('django.db.models.fields.CharField')(max_length=5)),
            ('idResource', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.GadgetResource'])),
        ))
        db.send_create_signal('catalogue', ['GadgetWiring'])

        # Adding model 'Tag'
        db.create_table('catalogue_tag', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=20)),
        ))
        db.send_create_signal('catalogue', ['Tag'])

        # Adding model 'UserTag'
        db.create_table('catalogue_usertag', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('tag', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.Tag'])),
            ('weight', self.gf('django.db.models.fields.CharField')(max_length=20, null=True)),
            ('criteria', self.gf('django.db.models.fields.CharField')(max_length=20, null=True)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=20, null=True)),
            ('idUser', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('idResource', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.GadgetResource'])),
        ))
        db.send_create_signal('catalogue', ['UserTag'])

        # Adding unique constraint on 'UserTag', fields ['tag', 'idUser', 'idResource']
        db.create_unique('catalogue_usertag', ['tag_id', 'idUser_id', 'idResource_id'])

        # Adding model 'Category'
        db.create_table('catalogue_category', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=50)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.Category'], null=True, blank=True)),
        ))
        db.send_create_signal('catalogue', ['Category'])

        # Adding M2M table for field tags on 'Category'
        db.create_table('catalogue_category_tags', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('category', models.ForeignKey(orm['catalogue.category'], null=False)),
            ('tag', models.ForeignKey(orm['catalogue.tag'], null=False))
        ))
        db.create_unique('catalogue_category_tags', ['category_id', 'tag_id'])

        # Adding M2M table for field organizations on 'Category'
        db.create_table('catalogue_category_organizations', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('category', models.ForeignKey(orm['catalogue.category'], null=False)),
            ('group', models.ForeignKey(orm['auth.group'], null=False))
        ))
        db.create_unique('catalogue_category_organizations', ['category_id', 'group_id'])

        # Adding model 'UserVote'
        db.create_table('catalogue_uservote', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('idUser', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('idResource', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.GadgetResource'])),
            ('vote', self.gf('django.db.models.fields.SmallIntegerField')()),
        ))
        db.send_create_signal('catalogue', ['UserVote'])

        # Adding unique constraint on 'UserVote', fields ['idUser', 'idResource']
        db.create_unique('catalogue_uservote', ['idUser_id', 'idResource_id'])

        # Adding model 'Application'
        db.create_table('catalogue_application', (
            ('tag', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.Tag'])),
            ('app_code', self.gf('django.db.models.fields.IntegerField')(primary_key=True)),
            ('template_uri', self.gf('django.db.models.fields.URLField')(max_length=200, null=True, blank=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('short_name', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('description', self.gf('django.db.models.fields.TextField')()),
            ('image_uri', self.gf('django.db.models.fields.URLField')(max_length=200, null=True)),
            ('vendor', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('subscription_price', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('monthly_price', self.gf('django.db.models.fields.CharField')(max_length=100)),
        ))
        db.send_create_signal('catalogue', ['Application'])

        # Adding M2M table for field resources on 'Application'
        db.create_table('catalogue_application_resources', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('application', models.ForeignKey(orm['catalogue.application'], null=False)),
            ('gadgetresource', models.ForeignKey(orm['catalogue.gadgetresource'], null=False))
        ))
        db.create_unique('catalogue_application_resources', ['application_id', 'gadgetresource_id'])


    def backwards(self, orm):

        # Removing unique constraint on 'UserVote', fields ['idUser', 'idResource']
        db.delete_unique('catalogue_uservote', ['idUser_id', 'idResource_id'])

        # Removing unique constraint on 'UserTag', fields ['tag', 'idUser', 'idResource']
        db.delete_unique('catalogue_usertag', ['tag_id', 'idUser_id', 'idResource_id'])

        # Removing unique constraint on 'UserRelatedToGadgetResource', fields ['gadget', 'user']
        db.delete_unique('catalogue_userrelatedtogadgetresource', ['gadget_id', 'user_id'])

        # Removing unique constraint on 'Capability', fields ['name', 'value', 'resource']
        db.delete_unique('catalogue_capability', ['name', 'value', 'resource_id'])

        # Removing unique constraint on 'GadgetResource', fields ['short_name', 'vendor', 'version']
        db.delete_unique('catalogue_gadgetresource', ['short_name', 'vendor', 'version'])

        # Deleting model 'Translation'
        db.delete_table('catalogue_translation')

        # Deleting model 'GadgetResource'
        db.delete_table('catalogue_gadgetresource')

        # Removing M2M table for field organization on 'GadgetResource'
        db.delete_table('catalogue_gadgetresource_organization')

        # Deleting model 'Capability'
        db.delete_table('catalogue_capability')

        # Deleting model 'UserRelatedToGadgetResource'
        db.delete_table('catalogue_userrelatedtogadgetresource')

        # Deleting model 'GadgetWiring'
        db.delete_table('catalogue_gadgetwiring')

        # Deleting model 'Tag'
        db.delete_table('catalogue_tag')

        # Deleting model 'UserTag'
        db.delete_table('catalogue_usertag')

        # Deleting model 'Category'
        db.delete_table('catalogue_category')

        # Removing M2M table for field tags on 'Category'
        db.delete_table('catalogue_category_tags')

        # Removing M2M table for field organizations on 'Category'
        db.delete_table('catalogue_category_organizations')

        # Deleting model 'UserVote'
        db.delete_table('catalogue_uservote')

        # Deleting model 'Application'
        db.delete_table('catalogue_application')

        # Removing M2M table for field resources on 'Application'
        db.delete_table('catalogue_application_resources')


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
        'catalogue.application': {
            'Meta': {'object_name': 'Application'},
            'app_code': ('django.db.models.fields.IntegerField', [], {'primary_key': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'image_uri': ('django.db.models.fields.URLField', [], {'max_length': '200', 'null': 'True'}),
            'monthly_price': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'resources': ('django.db.models.fields.related.ManyToManyField', [], {'blank': 'True', 'related_name': "'resources'", 'null': 'True', 'symmetrical': 'False', 'to': "orm['catalogue.GadgetResource']"}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'subscription_price': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'tag': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.Tag']"}),
            'template_uri': ('django.db.models.fields.URLField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'vendor': ('django.db.models.fields.CharField', [], {'max_length': '250'})
        },
        'catalogue.capability': {
            'Meta': {'unique_together': "(('name', 'value', 'resource'),)", 'object_name': 'Capability'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'resource': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.GadgetResource']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'catalogue.category': {
            'Meta': {'object_name': 'Category'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '50'}),
            'organizations': ('django.db.models.fields.related.ManyToManyField', [], {'blank': 'True', 'related_name': "'organizations'", 'null': 'True', 'symmetrical': 'False', 'to': "orm['auth.Group']"}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.Category']", 'null': 'True', 'blank': 'True'}),
            'tags': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['catalogue.Tag']", 'symmetrical': 'False'})
        },
        'catalogue.gadgetresource': {
            'Meta': {'unique_together': "(('short_name', 'vendor', 'version'),)", 'object_name': 'GadgetResource'},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'certification': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'certification'", 'null': 'True', 'to': "orm['auth.Group']"}),
            'creation_date': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'creator': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']", 'null': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'display_name': ('django.db.models.fields.CharField', [], {'max_length': '250', 'null': 'True', 'blank': 'True'}),
            'fromWGT': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'gadget_uri': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ie_compatible': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'image_uri': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True'}),
            'iphone_image_uri': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'license': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True', 'blank': 'True'}),
            'mail': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'mashup_id': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'organization': ('django.db.models.fields.related.ManyToManyField', [], {'blank': 'True', 'related_name': "'organization'", 'null': 'True', 'symmetrical': 'False', 'to': "orm['auth.Group']"}),
            'popularity': ('django.db.models.fields.DecimalField', [], {'null': 'True', 'max_digits': '2', 'decimal_places': '1'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'size': ('django.db.models.fields.CharField', [], {'max_length': '10', 'null': 'True', 'blank': 'True'}),
            'solution': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'template_uri': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'vendor': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'version': ('django.db.models.fields.CharField', [], {'max_length': '150'}),
            'wiki_page_uri': ('django.db.models.fields.CharField', [], {'max_length': '200'})
        },
        'catalogue.gadgetwiring': {
            'Meta': {'object_name': 'GadgetWiring'},
            'friendcode': ('django.db.models.fields.CharField', [], {'max_length': '30', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'idResource': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.GadgetResource']"}),
            'wiring': ('django.db.models.fields.CharField', [], {'max_length': '5'})
        },
        'catalogue.tag': {
            'Meta': {'object_name': 'Tag'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '20'})
        },
        'catalogue.translation': {
            'Meta': {'object_name': 'Translation'},
            'default': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'element_id': ('django.db.models.fields.IntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '2'}),
            'table': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'text_id': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'value': ('django.db.models.fields.TextField', [], {'null': 'True'})
        },
        'catalogue.userrelatedtogadgetresource': {
            'Meta': {'unique_together': "(('gadget', 'user'),)", 'object_name': 'UserRelatedToGadgetResource'},
            'added_by': ('django.db.models.fields.NullBooleanField', [], {'null': 'True', 'blank': 'True'}),
            'gadget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.GadgetResource']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'preferred_by': ('django.db.models.fields.NullBooleanField', [], {'null': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"})
        },
        'catalogue.usertag': {
            'Meta': {'unique_together': "(('tag', 'idUser', 'idResource'),)", 'object_name': 'UserTag'},
            'criteria': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'idResource': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.GadgetResource']"}),
            'idUser': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'tag': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.Tag']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'}),
            'weight': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'})
        },
        'catalogue.uservote': {
            'Meta': {'unique_together': "(('idUser', 'idResource'),)", 'object_name': 'UserVote'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'idResource': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.GadgetResource']"}),
            'idUser': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'vote': ('django.db.models.fields.SmallIntegerField', [], {})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        }
    }

    complete_apps = ['catalogue']
