# encoding: utf-8

from south.db import db
from south.v2 import DataMigration


class Migration(DataMigration):

    def forwards(self, orm):

        # Migrate translations to the translator application
        for translation in orm.Translation.objects.all():
            orm['translator.Translation'].objects.create(table=translation.table,
                text_id=translation.text_id,
                element_id=translation.element_id,
                value=translation.value,
                language=translation.language,
                default=translation.default)

        # Deleting model 'Translation'
        db.delete_table('catalogue_translation')

    def backwards(self, orm):

        # Adding model 'Translation'
        db.create_table('catalogue_translation', (
            ('text_id', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('language', self.gf('django.db.models.fields.CharField')(max_length=2)),
            ('default', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('table', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('element_id', self.gf('django.db.models.fields.IntegerField')()),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('value', self.gf('django.db.models.fields.TextField')(null=True)),
        ))
        db.send_create_signal('catalogue', ['Translation'])

        # Migrate translations from the translator application
        for translation in orm['translator.Translation'].objects.all():
            if not translation.table.startswith('catalogue.'):
                continue

            orm.Translation.objects.create(table=translation.table,
                text_id=translation.text_id,
                element_id=translation.element_id,
                value=translation.value,
                language=translation.language,
                default=translation.default)

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
            'resources': ('django.db.models.fields.related.ManyToManyField', [], {'blank': 'True', 'related_name': "'resources'", 'null': 'True', 'symmetrical': 'False', 'to': "orm['catalogue.GadgetResource']"}),
            'short_name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'subscription_price': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'tag': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.Tag']"}),
            'template_uri': ('django.db.models.fields.URLField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'vendor': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
        },
        'catalogue.capability': {
            'Meta': {'unique_together': "(('name', 'value', 'resource'),)", 'object_name': 'Capability'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'resource': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.GadgetResource']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
        },
        'catalogue.category': {
            'Meta': {'object_name': 'Category'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '50'}),
            'organizations': ('django.db.models.fields.related.ManyToManyField', [], {'blank': 'True', 'related_name': "'organizations'", 'null': 'True', 'symmetrical': 'False', 'to': "orm['auth.Group']"}),
            'parent': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.Category']", 'null': 'True', 'blank': 'True'}),
            'tags': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['catalogue.Tag']", 'symmetrical': 'False'}),
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
            'wiki_page_uri': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
        },
        'catalogue.gadgetwiring': {
            'Meta': {'object_name': 'GadgetWiring'},
            'friendcode': ('django.db.models.fields.CharField', [], {'max_length': '30', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'idResource': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.GadgetResource']"}),
            'wiring': ('django.db.models.fields.CharField', [], {'max_length': '5'}),
        },
        'catalogue.tag': {
            'Meta': {'object_name': 'Tag'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '20'}),
        },
        'catalogue.translation': {
            'Meta': {'object_name': 'Translation'},
            'default': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'element_id': ('django.db.models.fields.IntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '2'}),
            'table': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'text_id': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'value': ('django.db.models.fields.TextField', [], {'null': 'True'}),
        },
        'catalogue.userrelatedtogadgetresource': {
            'Meta': {'unique_together': "(('gadget', 'user'),)", 'object_name': 'UserRelatedToGadgetResource'},
            'added_by': ('django.db.models.fields.NullBooleanField', [], {'null': 'True', 'blank': 'True'}),
            'gadget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.GadgetResource']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'preferred_by': ('django.db.models.fields.NullBooleanField', [], {'null': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
        },
        'catalogue.usertag': {
            'Meta': {'unique_together': "(('tag', 'idUser', 'idResource'),)", 'object_name': 'UserTag'},
            'criteria': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'idResource': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.GadgetResource']"}),
            'idUser': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'tag': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.Tag']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'}),
            'weight': ('django.db.models.fields.CharField', [], {'max_length': '20', 'null': 'True'}),
        },
        'catalogue.uservote': {
            'Meta': {'unique_together': "(('idUser', 'idResource'),)", 'object_name': 'UserVote'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'idResource': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['catalogue.GadgetResource']"}),
            'idUser': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'vote': ('django.db.models.fields.SmallIntegerField', [], {}),
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
        },
        'translator.translation': {
            'Meta': {'object_name': 'Translation'},
            'default': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'element_id': ('django.db.models.fields.IntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'language': ('django.db.models.fields.CharField', [], {'max_length': '2'}),
            'table': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'text_id': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'value': ('django.db.models.fields.TextField', [], {'null': 'True'}),
        },
    }

    complete_apps = ['translator', 'catalogue']
