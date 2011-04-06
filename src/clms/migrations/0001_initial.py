# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):

        # Adding model 'Content'
        db.create_table('clms_content', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('type_content', self.gf('django.db.models.fields.CharField')(default='H', max_length=2)),
            ('url', self.gf('django.db.models.fields.URLField')(max_length=200, null=True, blank=True)),
            ('html', self.gf('django.db.models.fields.TextField')(max_length=50000, null=True, blank=True)),
            ('image', self.gf('stdimage.fields.StdImageField')(max_length=100, null=True, blank=True)),
            ('preview', self.gf('stdimage.fields.StdImageField')(max_length=100, null=True, blank=True)),
        ))
        db.send_create_signal('clms', ['Content'])

        # Adding model 'Panel'
        db.create_table('clms_panel', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('lang', self.gf('django.db.models.fields.CharField')(max_length=200, null=True, blank=True)),
            ('content', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['clms.Content'], null=True, blank=True)),
            ('category_id', self.gf('django.db.models.fields.PositiveIntegerField')(null=True, blank=True)),
        ))
        db.send_create_signal('clms', ['Panel'])

        # Adding model 'PanelDispatcher'
        db.create_table('clms_paneldispatcher', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('panel_default', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='default', null=True, to=orm['clms.Panel'])),
            ('token_number', self.gf('django.db.models.fields.PositiveIntegerField')(max_length=10)),
        ))
        db.send_create_signal('clms', ['PanelDispatcher'])

        # Adding M2M table for field panels on 'PanelDispatcher'
        db.create_table('clms_paneldispatcher_panels', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('paneldispatcher', models.ForeignKey(orm['clms.paneldispatcher'], null=False)),
            ('panel', models.ForeignKey(orm['clms.panel'], null=False))
        ))
        db.create_unique('clms_paneldispatcher_panels', ['paneldispatcher_id', 'panel_id'])

        # Adding model 'LayoutTemplate'
        db.create_table('clms_layouttemplate', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('html', self.gf('django.db.models.fields.TextField')(max_length=50000)),
            ('tokens', self.gf('django.db.models.fields.CommaSeparatedIntegerField')(max_length=200)),
            ('image', self.gf('stdimage.fields.StdImageField')(max_length=100, null=True, blank=True)),
        ))
        db.send_create_signal('clms', ['LayoutTemplate'])

        # Adding model 'Layout'
        db.create_table('clms_layout', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('layout_template', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['clms.LayoutTemplate'], null=True, blank=True)),
            ('image', self.gf('stdimage.fields.StdImageField')(max_length=100, null=True, blank=True)),
            ('categories', self.gf('django.db.models.fields.CommaSeparatedIntegerField')(max_length=200, null=True, blank=True)),
            ('description', self.gf('django.db.models.fields.TextField')(max_length=2000)),
        ))
        db.send_create_signal('clms', ['Layout'])

        # Adding M2M table for field panels_dispatched on 'Layout'
        db.create_table('clms_layout_panels_dispatched', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('layout', models.ForeignKey(orm['clms.layout'], null=False)),
            ('paneldispatcher', models.ForeignKey(orm['clms.paneldispatcher'], null=False))
        ))
        db.create_unique('clms_layout_panels_dispatched', ['layout_id', 'paneldispatcher_id'])

        # Adding model 'FavouriteLayout'
        db.create_table('clms_favouritelayout', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'], unique=True)),
        ))
        db.send_create_signal('clms', ['FavouriteLayout'])

        # Adding M2M table for field layout on 'FavouriteLayout'
        db.create_table('clms_favouritelayout_layout', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('favouritelayout', models.ForeignKey(orm['clms.favouritelayout'], null=False)),
            ('layout', models.ForeignKey(orm['clms.layout'], null=False))
        ))
        db.create_unique('clms_favouritelayout_layout', ['favouritelayout_id', 'layout_id'])

        # Adding model 'DefaultUserLayout'
        db.create_table('clms_defaultuserlayout', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'], unique=True)),
            ('layout', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['clms.Layout'])),
        ))
        db.send_create_signal('clms', ['DefaultUserLayout'])


    def backwards(self, orm):

        # Deleting model 'Content'
        db.delete_table('clms_content')

        # Deleting model 'Panel'
        db.delete_table('clms_panel')

        # Deleting model 'PanelDispatcher'
        db.delete_table('clms_paneldispatcher')

        # Removing M2M table for field panels on 'PanelDispatcher'
        db.delete_table('clms_paneldispatcher_panels')

        # Deleting model 'LayoutTemplate'
        db.delete_table('clms_layouttemplate')

        # Deleting model 'Layout'
        db.delete_table('clms_layout')

        # Removing M2M table for field panels_dispatched on 'Layout'
        db.delete_table('clms_layout_panels_dispatched')

        # Deleting model 'FavouriteLayout'
        db.delete_table('clms_favouritelayout')

        # Removing M2M table for field layout on 'FavouriteLayout'
        db.delete_table('clms_favouritelayout_layout')

        # Deleting model 'DefaultUserLayout'
        db.delete_table('clms_defaultuserlayout')


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
        'clms.content': {
            'Meta': {'object_name': 'Content'},
            'html': ('django.db.models.fields.TextField', [], {'max_length': '50000', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image': ('stdimage.fields.StdImageField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'preview': ('stdimage.fields.StdImageField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'type_content': ('django.db.models.fields.CharField', [], {'default': "'H'", 'max_length': '2'}),
            'url': ('django.db.models.fields.URLField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'})
        },
        'clms.defaultuserlayout': {
            'Meta': {'object_name': 'DefaultUserLayout'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'layout': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['clms.Layout']"}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']", 'unique': 'True'})
        },
        'clms.favouritelayout': {
            'Meta': {'object_name': 'FavouriteLayout'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'layout': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['clms.Layout']", 'symmetrical': 'False'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']", 'unique': 'True'})
        },
        'clms.layout': {
            'Meta': {'object_name': 'Layout'},
            'categories': ('django.db.models.fields.CommaSeparatedIntegerField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.TextField', [], {'max_length': '2000'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image': ('stdimage.fields.StdImageField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'layout_template': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['clms.LayoutTemplate']", 'null': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'panels_dispatched': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['clms.PanelDispatcher']", 'symmetrical': 'False'})
        },
        'clms.layouttemplate': {
            'Meta': {'object_name': 'LayoutTemplate'},
            'html': ('django.db.models.fields.TextField', [], {'max_length': '50000'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'image': ('stdimage.fields.StdImageField', [], {'max_length': '100', 'null': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'tokens': ('django.db.models.fields.CommaSeparatedIntegerField', [], {'max_length': '200'})
        },
        'clms.panel': {
            'Meta': {'object_name': 'Panel'},
            'category_id': ('django.db.models.fields.PositiveIntegerField', [], {'null': 'True', 'blank': 'True'}),
            'content': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['clms.Content']", 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'lang': ('django.db.models.fields.CharField', [], {'max_length': '200', 'null': 'True', 'blank': 'True'})
        },
        'clms.paneldispatcher': {
            'Meta': {'object_name': 'PanelDispatcher'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'panel_default': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'default'", 'null': 'True', 'to': "orm['clms.Panel']"}),
            'panels': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['clms.Panel']", 'symmetrical': 'False'}),
            'token_number': ('django.db.models.fields.PositiveIntegerField', [], {'max_length': '10'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        }
    }

    complete_apps = ['clms']
