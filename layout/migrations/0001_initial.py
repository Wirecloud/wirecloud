# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration
from commons.utils import db_table_exists

class Migration(SchemaMigration):

    def forwards(self, orm):

        if db_table_exists('layout_branding'):
            return

        # Adding model 'Branding'
        db.create_table('layout_branding', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('logo', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, blank=True)),
            ('viewer_logo', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, blank=True)),
            ('link', self.gf('django.db.models.fields.URLField')(max_length=500, null=True, blank=True)),
        ))
        db.send_create_signal('layout', ['Branding'])

        # Adding model 'Theme'
        db.create_table('layout_theme', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=250)),
            ('theme_css', self.gf('django.db.models.fields.TextField')()),
            ('images', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('layout', ['Theme'])

        # Adding model 'Layout'
        db.create_table('layout_layout', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=250)),
            ('templates', self.gf('django.db.models.fields.TextField')()),
            ('elements', self.gf('django.db.models.fields.TextField')()),
            ('layout_css', self.gf('django.db.models.fields.TextField')()),
            ('theme', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Theme'])),
        ))
        db.send_create_signal('layout', ['Layout'])

        # Adding model 'SkinTemplate'
        db.create_table('layout_skintemplate', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('properties', self.gf('django.db.models.fields.TextField')()),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=25)),
            ('layout', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Layout'], null=True, blank=True)),
            ('template_file', self.gf('django.db.models.fields.CharField')(max_length=25)),
        ))
        db.send_create_signal('layout', ['SkinTemplate'])

        # Adding model 'Skin'
        db.create_table('layout_skin', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('creator', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'], null=True, blank=True)),
            ('properties', self.gf('django.db.models.fields.TextField')()),
            ('skin_template', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.SkinTemplate'])),
            ('layout', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Layout'], null=True, blank=True)),
            ('default', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('layout', ['Skin'])

        # Adding unique constraint on 'Skin', fields ['name', 'layout']
        db.create_unique('layout_skin', ['name', 'layout_id'])

        # Adding model 'ThemeBranding'
        db.create_table('layout_themebranding', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('theme', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Theme'])),
            ('branding', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Branding'])),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=25)),
        ))
        db.send_create_signal('layout', ['ThemeBranding'])

        # Adding unique constraint on 'ThemeBranding', fields ['theme', 'branding', 'type']
        db.create_unique('layout_themebranding', ['theme_id', 'branding_id', 'type'])

        # Adding model 'SkinOrganization'
        db.create_table('layout_skinorganization', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('skin', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Skin'])),
            ('organization', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.Group'])),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=25)),
        ))
        db.send_create_signal('layout', ['SkinOrganization'])

        # Adding unique constraint on 'SkinOrganization', fields ['skin', 'organization', 'type']
        db.create_unique('layout_skinorganization', ['skin_id', 'organization_id', 'type'])

        # Adding model 'BrandingOrganization'
        db.create_table('layout_brandingorganization', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('branding', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Branding'])),
            ('organization', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.Group'])),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=25)),
        ))
        db.send_create_signal('layout', ['BrandingOrganization'])

        # Adding unique constraint on 'BrandingOrganization', fields ['branding', 'organization', 'type']
        db.create_unique('layout_brandingorganization', ['branding_id', 'organization_id', 'type'])


    def backwards(self, orm):

        # Removing unique constraint on 'BrandingOrganization', fields ['branding', 'organization', 'type']
        db.delete_unique('layout_brandingorganization', ['branding_id', 'organization_id', 'type'])

        # Removing unique constraint on 'SkinOrganization', fields ['skin', 'organization', 'type']
        db.delete_unique('layout_skinorganization', ['skin_id', 'organization_id', 'type'])

        # Removing unique constraint on 'ThemeBranding', fields ['theme', 'branding', 'type']
        db.delete_unique('layout_themebranding', ['theme_id', 'branding_id', 'type'])

        # Removing unique constraint on 'Skin', fields ['name', 'layout']
        db.delete_unique('layout_skin', ['name', 'layout_id'])

        # Deleting model 'Branding'
        db.delete_table('layout_branding')

        # Deleting model 'Theme'
        db.delete_table('layout_theme')

        # Deleting model 'Layout'
        db.delete_table('layout_layout')

        # Deleting model 'SkinTemplate'
        db.delete_table('layout_skintemplate')

        # Deleting model 'Skin'
        db.delete_table('layout_skin')

        # Deleting model 'ThemeBranding'
        db.delete_table('layout_themebranding')

        # Deleting model 'SkinOrganization'
        db.delete_table('layout_skinorganization')

        # Deleting model 'BrandingOrganization'
        db.delete_table('layout_brandingorganization')


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
        'layout.brandingorganization': {
            'Meta': {'unique_together': "(('branding', 'organization', 'type'),)", 'object_name': 'BrandingOrganization'},
            'branding': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['layout.Branding']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'organization': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.Group']"}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '25'})
        },
        'layout.layout': {
            'Meta': {'object_name': 'Layout'},
            'elements': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'layout_css': ('django.db.models.fields.TextField', [], {}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '250'}),
            'templates': ('django.db.models.fields.TextField', [], {}),
            'theme': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['layout.Theme']"})
        },
        'layout.skin': {
            'Meta': {'unique_together': "(('name', 'layout'),)", 'object_name': 'Skin'},
            'creator': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']", 'null': 'True', 'blank': 'True'}),
            'default': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'layout': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['layout.Layout']", 'null': 'True', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'properties': ('django.db.models.fields.TextField', [], {}),
            'skin_template': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['layout.SkinTemplate']"})
        },
        'layout.skinorganization': {
            'Meta': {'unique_together': "(('skin', 'organization', 'type'),)", 'object_name': 'SkinOrganization'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'organization': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.Group']"}),
            'skin': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['layout.Skin']"}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '25'})
        },
        'layout.skintemplate': {
            'Meta': {'object_name': 'SkinTemplate'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'layout': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['layout.Layout']", 'null': 'True', 'blank': 'True'}),
            'properties': ('django.db.models.fields.TextField', [], {}),
            'template_file': ('django.db.models.fields.CharField', [], {'max_length': '25'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '25'})
        },
        'layout.theme': {
            'Meta': {'object_name': 'Theme'},
            'default_brandings': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': "orm['layout.Branding']", 'null': 'True', 'through': "orm['layout.ThemeBranding']", 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'images': ('django.db.models.fields.TextField', [], {}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '250'}),
            'theme_css': ('django.db.models.fields.TextField', [], {})
        },
        'layout.themebranding': {
            'Meta': {'unique_together': "(('theme', 'branding', 'type'),)", 'object_name': 'ThemeBranding'},
            'branding': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['layout.Branding']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'theme': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['layout.Theme']"}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '25'})
        }
    }

    complete_apps = ['layout']
