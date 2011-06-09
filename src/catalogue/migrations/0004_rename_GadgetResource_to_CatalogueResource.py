# encoding: utf-8
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

    def backwards(self, orm):

        db.rename_column(
            'catalogue_catalogueresource_organization',
            'catalogueresource_id',
            'gadgetresource_id')
        db.rename_table('catalogue_catalogueresource_organization', 'catalogue_gadgetresource_organization')
        db.rename_table('catalogue_catalogueresource', 'catalogue_gadgetresource')

    models = {}

    complete_apps = ['catalogue']
