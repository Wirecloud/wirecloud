# -*- coding: utf-8 -*-
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'CatalogueResource'
        db.create_table(u'catalogue_catalogueresource', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('short_name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('display_name', self.gf('django.db.models.fields.CharField')(max_length=250, null=True, blank=True)),
            ('vendor', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('version', self.gf('django.db.models.fields.CharField')(max_length=150)),
            ('type', self.gf('django.db.models.fields.SmallIntegerField')()),
            ('ie_compatible', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('author', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('mail', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('creator', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='uploaded_resources', null=True, to=orm['auth.User'])),
            ('public', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('description', self.gf('django.db.models.fields.TextField')()),
            ('license', self.gf('django.db.models.fields.CharField')(max_length=20, null=True, blank=True)),
            ('creation_date', self.gf('django.db.models.fields.DateTimeField')()),
            ('image_uri', self.gf('django.db.models.fields.CharField')(max_length=200, blank=True)),
            ('iphone_image_uri', self.gf('django.db.models.fields.CharField')(max_length=200, blank=True)),
            ('wiki_page_uri', self.gf('django.db.models.fields.CharField')(max_length=200, blank=True)),
            ('template_uri', self.gf('django.db.models.fields.CharField')(max_length=200, blank=True)),
            ('popularity', self.gf('django.db.models.fields.DecimalField')(default=0, max_digits=2, decimal_places=1)),
            ('fromWGT', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('json_description', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal(u'catalogue', ['CatalogueResource'])

        # Adding unique constraint on 'CatalogueResource', fields ['short_name', 'vendor', 'version']
        db.create_unique(u'catalogue_catalogueresource', ['short_name', 'vendor', 'version'])

        # Adding M2M table for field users on 'CatalogueResource'
        db.create_table(u'catalogue_catalogueresource_users', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('catalogueresource', models.ForeignKey(orm[u'catalogue.catalogueresource'], null=False)),
            ('user', models.ForeignKey(orm[u'auth.user'], null=False))
        ))
        db.create_unique(u'catalogue_catalogueresource_users', ['catalogueresource_id', 'user_id'])

        # Adding M2M table for field groups on 'CatalogueResource'
        db.create_table(u'catalogue_catalogueresource_groups', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('catalogueresource', models.ForeignKey(orm[u'catalogue.catalogueresource'], null=False)),
            ('group', models.ForeignKey(orm[u'auth.group'], null=False))
        ))
        db.create_unique(u'catalogue_catalogueresource_groups', ['catalogueresource_id', 'group_id'])

        # Adding model 'WidgetWiring'
        db.create_table(u'catalogue_widgetwiring', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('friendcode', self.gf('django.db.models.fields.CharField')(max_length=30, null=True, blank=True)),
            ('wiring', self.gf('django.db.models.fields.CharField')(max_length=5)),
            ('idResource', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.CatalogueResource'])),
        ))
        db.send_create_signal(u'catalogue', ['WidgetWiring'])

        # Adding model 'Tag'
        db.create_table(u'catalogue_tag', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=20)),
        ))
        db.send_create_signal(u'catalogue', ['Tag'])

        # Adding model 'UserTag'
        db.create_table(u'catalogue_usertag', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('tag', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.Tag'])),
            ('weight', self.gf('django.db.models.fields.CharField')(max_length=20, null=True)),
            ('criteria', self.gf('django.db.models.fields.CharField')(max_length=20, null=True)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=20, null=True)),
            ('idUser', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('idResource', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.CatalogueResource'])),
        ))
        db.send_create_signal(u'catalogue', ['UserTag'])

        # Adding unique constraint on 'UserTag', fields ['tag', 'idUser', 'idResource']
        db.create_unique(u'catalogue_usertag', ['tag_id', 'idUser_id', 'idResource_id'])

        # Adding model 'Category'
        db.create_table(u'catalogue_category', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=50)),
            ('parent', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.Category'], null=True, blank=True)),
        ))
        db.send_create_signal(u'catalogue', ['Category'])

        # Adding M2M table for field tags on 'Category'
        db.create_table(u'catalogue_category_tags', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('category', models.ForeignKey(orm[u'catalogue.category'], null=False)),
            ('tag', models.ForeignKey(orm[u'catalogue.tag'], null=False))
        ))
        db.create_unique(u'catalogue_category_tags', ['category_id', 'tag_id'])

        # Adding M2M table for field organizations on 'Category'
        db.create_table(u'catalogue_category_organizations', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('category', models.ForeignKey(orm[u'catalogue.category'], null=False)),
            ('group', models.ForeignKey(orm[u'auth.group'], null=False))
        ))
        db.create_unique(u'catalogue_category_organizations', ['category_id', 'group_id'])

        # Adding model 'UserVote'
        db.create_table(u'catalogue_uservote', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('idUser', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('idResource', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['catalogue.CatalogueResource'])),
            ('vote', self.gf('django.db.models.fields.SmallIntegerField')()),
        ))
        db.send_create_signal(u'catalogue', ['UserVote'])

        # Adding unique constraint on 'UserVote', fields ['idUser', 'idResource']
        db.create_unique(u'catalogue_uservote', ['idUser_id', 'idResource_id'])

    def backwards(self, orm):
        # Removing unique constraint on 'UserVote', fields ['idUser', 'idResource']
        db.delete_unique(u'catalogue_uservote', ['idUser_id', 'idResource_id'])

        # Removing unique constraint on 'UserTag', fields ['tag', 'idUser', 'idResource']
        db.delete_unique(u'catalogue_usertag', ['tag_id', 'idUser_id', 'idResource_id'])

        # Removing unique constraint on 'CatalogueResource', fields ['short_name', 'vendor', 'version']
        db.delete_unique(u'catalogue_catalogueresource', ['short_name', 'vendor', 'version'])

        # Deleting model 'CatalogueResource'
        db.delete_table(u'catalogue_catalogueresource')

        # Removing M2M table for field users on 'CatalogueResource'
        db.delete_table('catalogue_catalogueresource_users')

        # Removing M2M table for field groups on 'CatalogueResource'
        db.delete_table('catalogue_catalogueresource_groups')

        # Deleting model 'WidgetWiring'
        db.delete_table(u'catalogue_widgetwiring')

        # Deleting model 'Tag'
        db.delete_table(u'catalogue_tag')

        # Deleting model 'UserTag'
        db.delete_table(u'catalogue_usertag')

        # Deleting model 'Category'
        db.delete_table(u'catalogue_category')

        # Removing M2M table for field tags on 'Category'
        db.delete_table('catalogue_category_tags')

        # Removing M2M table for field organizations on 'Category'
        db.delete_table('catalogue_category_organizations')

        # Deleting model 'UserVote'
        db.delete_table(u'catalogue_uservote')

    models = {
        u'auth.group': {
            'Meta': {'object_name': 'Group'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        u'auth.permission': {
            'Meta': {'ordering': "(u'content_type__app_label', u'content_type__model', u'codename')", 'unique_together': "((u'content_type', u'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['contenttypes.ContentType']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        u'catalogue.catalogueresource': {
            'Meta': {'unique_together': "(('short_name', 'vendor', 'version'),)", 'object_name': 'CatalogueResource'},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'creation_date': ('django.db.models.fields.DateTimeField', [], {}),
            'creator': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'uploaded_resources'", 'null': 'True', 'to': u"orm['auth.User']"}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'display_name': ('django.db.models.fields.CharField', [], {'max_length': '250', 'null': 'True', 'blank': 'True'}),
            'fromWGT': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'local_resources'", 'blank': 'True', 'to': u"orm['auth.Group']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ie_compatible': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'image_uri': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'iphone_image_uri': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'json_description': ('django.db.models.fields.TextField', [], {}),
            'license': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True', 'blank': 'True'}),
            'mail': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'popularity': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '2', 'decimal_places': '1'}),
            'public': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'template_uri': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'type': ('django.db.models.fields.SmallIntegerField', [], {}),
            'users': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'local_resources'", 'blank': 'True', 'to': u"orm['auth.User']"}),
            'vendor': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'version': ('django.db.models.fields.CharField', [], {'max_length': '150'}),
            'wiki_page_uri': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'})
        },
        u'catalogue.category': {
            'Meta': {'object_name': 'Category'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '50'}),
            'organizations': ('django.db.models.fields.related.ManyToManyField', [], {'blank': 'True', 'related_name': "'organizations'", 'null': 'True', 'symmetrical': 'False', 'to': u"orm['auth.Group']"}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['catalogue.Category']", 'null': 'True', 'blank': 'True'}),
            'tags': ('django.db.models.fields.related.ManyToManyField', [], {'to': u"orm['catalogue.Tag']", 'symmetrical': 'False'})
        },
        u'catalogue.tag': {
            'Meta': {'object_name': 'Tag'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '20'})
        },
        u'catalogue.usertag': {
            'Meta': {'unique_together': "(('tag', 'idUser', 'idResource'),)", 'object_name': 'UserTag'},
            'criteria': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'idResource': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['catalogue.CatalogueResource']"}),
            'idUser': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']"}),
            'tag': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['catalogue.Tag']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'}),
            'weight': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'})
        },
        u'catalogue.uservote': {
            'Meta': {'unique_together': "(('idUser', 'idResource'),)", 'object_name': 'UserVote'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'idResource': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['catalogue.CatalogueResource']"}),
            'idUser': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['auth.User']"}),
            'vote': ('django.db.models.fields.SmallIntegerField', [], {})
        },
        u'catalogue.widgetwiring': {
            'Meta': {'object_name': 'WidgetWiring'},
            'friendcode': ('django.db.models.fields.CharField', [], {'max_length': '30', 'null': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'idResource': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['catalogue.CatalogueResource']"}),
            'wiring': ('django.db.models.fields.CharField', [], {'max_length': '5'})
        },
        u'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        }
    }

    complete_apps = ['catalogue']
