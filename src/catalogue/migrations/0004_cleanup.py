# encoding: utf-8
import datetime

from south.db import db
from south.v2 import SchemaMigration


class Migration(SchemaMigration):

    def forwards(self, orm):

        db.rename_table('catalogue_gadgetresource', 'catalogue_catalogueresource')
        db.rename_table('catalogue_gadgetresource_organization', 'catalogue_catalogueresource_organization')
        db.rename_column(
            'catalogue_catalogueresource_organization',
            'gadgetresource_id',
            'catalogueresource_id')

        db.delete_column('catalogue_catalogueresource', 'solution')

        # Changing field 'CatalogueResource.popularity'
        db.alter_column('catalogue_catalogueresource', 'popularity', self.gf('django.db.models.fields.DecimalField')(max_digits=2, decimal_places=1))

        # Deleting field 'CatalogueResource.gadget_uri'
        db.delete_column('catalogue_catalogueresource', 'gadget_uri')

        # Deleting field 'CatalogueResource.size'
        db.delete_column('catalogue_catalogueresource', 'size')

        # Changing field 'CatalogueResource.iphone_image_uri'
        db.alter_column('catalogue_catalogueresource', 'iphone_image_uri', self.gf('django.db.models.fields.CharField')(default='', max_length=200))

        # Changing field 'CatalogueResource.creation_date'
        db.alter_column('catalogue_catalogueresource', 'creation_date', self.gf('django.db.models.fields.DateTimeField')(default=datetime.date(2011, 6, 13)))

        # Changing field 'CatalogueResource.image_uri'
        db.alter_column('catalogue_catalogueresource', 'image_uri', self.gf('django.db.models.fields.CharField')(default='', max_length=200))

        # Adding field 'CatalogueResource.type'
        db.add_column('catalogue_catalogueresource', 'type', self.gf('django.db.models.fields.IntegerField')(default=0, max_length=4, null=False), keep_default=False)

    def backwards(self, orm):

        # Deleting field 'CatalogueResource.type'
        db.delete_column('catalogue_catalogueresource', 'type')

        # Adding field 'CatalogueResource.gadget_uri'
        db.add_column('catalogue_catalogueresource', 'gadget_uri', self.gf('django.db.models.fields.CharField')(max_length=200, null=True, blank=True), keep_default=False)

        # Adding field 'CatalogueResource.size'
        db.add_column('catalogue_catalogueresource', 'size', self.gf('django.db.models.fields.CharField')(max_length=10, null=True, blank=True), keep_default=False)

        # Changing field 'CatalogueResource.iphone_image_uri'
        db.alter_column('catalogue_catalogueresource', 'iphone_image_uri', self.gf('django.db.models.fields.CharField')(max_length=200, null=True))

        # Changing field 'CatalogueResource.creation_date'
        db.alter_column('catalogue_catalogueresource', 'creation_date', self.gf('django.db.models.fields.DateTimeField')(null=True))

        # Changing field 'CatalogueResource.image_uri'
        db.alter_column('catalogue_catalogueresource', 'image_uri', self.gf('django.db.models.fields.CharField')(max_length=200, null=True))

        # Changing field 'CatalogueResource.popularity'
        db.alter_column('catalogue_catalogueresource', 'popularity', self.gf('django.db.models.fields.DecimalField')(null=True, max_digits=2, decimal_places=1))

        db.add_column('catalogue_catalogueresource', 'solution', self.gf('django.db.models.fields.BooleanField')(default=False), keep_default=False)

        db.rename_column(
            'catalogue_catalogueresource_organization',
            'catalogueresource_id',
            'gadgetresource_id')
        db.rename_table('catalogue_catalogueresource_organization', 'catalogue_gadgetresource_organization')
        db.rename_table('catalogue_catalogueresource', 'catalogue_gadgetresource')

    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
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
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'}),
        },
        'catalogue.application': {
            'Meta': {'object_name': 'Application'},
            'app_code': ('django.db.models.fields.IntegerField', [], {'primary_key': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'image_uri': ('django.db.models.fields.URLField', [], {'max_length': '200', 'null': 'True'}),
            'monthly_price': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'resources': ('django.db.models.fields.related.ManyToManyField', [], {'blank': 'True', 'related_name': "'resources'", 'null': 'True', 'symmetrical': 'False', 'to': "orm['catalogue.CatalogueResource']"}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'subscription_price': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'tag': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.Tag']"}),
            'template_uri': ('django.db.models.fields.URLField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'type': ('django.db.models.fields.IntegerField', [], {'max_length': '4'}),
            'vendor': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
        },
        'catalogue.capability': {
            'Meta': {'unique_together': "(('name', 'value', 'resource'),)", 'object_name': 'Capability'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'resource': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.CatalogueResource']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
        },
        'catalogue.catalogueresource': {
            'Meta': {'unique_together': "(('short_name', 'vendor', 'version'),)", 'object_name': 'CatalogueResource'},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'certification': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'certification'", 'null': 'True', 'to': "orm['auth.Group']"}),
            'creation_date': ('django.db.models.fields.DateTimeField', [], {}),
            'creator': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']", 'null': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'display_name': ('django.db.models.fields.CharField', [], {'max_length': '250', 'null': 'True', 'blank': 'True'}),
            'fromWGT': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ie_compatible': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'image_uri': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'iphone_image_uri': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'}),
            'license': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True', 'blank': 'True'}),
            'mail': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'mashup_id': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'organization': ('django.db.models.fields.related.ManyToManyField', [], {'blank': 'True', 'related_name': "'organization'", 'null': 'True', 'symmetrical': 'False', 'to': "orm['auth.Group']"}),
            'popularity': ('django.db.models.fields.DecimalField', [], {'default': '0', 'max_digits': '2', 'decimal_places': '1'}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'template_uri': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'vendor': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'version': ('django.db.models.fields.CharField', [], {'max_length': '150'}),
            'wiki_page_uri': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
        },
        'catalogue.category': {
            'Meta': {'object_name': 'Category'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '50'}),
            'organizations': ('django.db.models.fields.related.ManyToManyField', [], {'blank': 'True', 'related_name': "'organizations'", 'null': 'True', 'symmetrical': 'False', 'to': "orm['auth.Group']"}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.Category']", 'null': 'True', 'blank': 'True'}),
            'tags': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['catalogue.Tag']", 'symmetrical': 'False'}),
        },
        'catalogue.gadgetwiring': {
            'Meta': {'object_name': 'GadgetWiring'},
            'friendcode': ('django.db.models.fields.CharField', [], {'max_length': '30', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'idResource': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.CatalogueResource']"}),
            'wiring': ('django.db.models.fields.CharField', [], {'max_length': '5'}),
        },
        'catalogue.tag': {
            'Meta': {'object_name': 'Tag'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '20'}),
        },
        'catalogue.usertag': {
            'Meta': {'unique_together': "(('tag', 'idUser', 'idResource'),)", 'object_name': 'UserTag'},
            'criteria': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'idResource': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.CatalogueResource']"}),
            'idUser': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'tag': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.Tag']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'}),
            'weight': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'}),
        },
        'catalogue.uservote': {
            'Meta': {'unique_together': "(('idUser', 'idResource'),)", 'object_name': 'UserVote'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'idResource': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.CatalogueResource']"}),
            'idUser': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'vote': ('django.db.models.fields.SmallIntegerField', [], {}),
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
        }
    }

    complete_apps = ['catalogue']
