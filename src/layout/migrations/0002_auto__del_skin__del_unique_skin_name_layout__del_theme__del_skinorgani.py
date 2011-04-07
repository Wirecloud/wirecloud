# encoding: utf-8
from south.db import db
from south.v2 import SchemaMigration


class Migration(SchemaMigration):

    def forwards(self, orm):

        # Removing unique constraint on 'BrandingOrganization', fields ['branding', 'organization', 'type']
        db.delete_unique('layout_brandingorganization', ['branding_id', 'organization_id', 'type'])

        # Removing unique constraint on 'ThemeBranding', fields ['theme', 'branding', 'type']
        db.delete_unique('layout_themebranding', ['theme_id', 'branding_id', 'type'])

        # Removing unique constraint on 'SkinOrganization', fields ['skin', 'organization', 'type']
        db.delete_unique('layout_skinorganization', ['skin_id', 'organization_id', 'type'])

        # Removing unique constraint on 'Skin', fields ['name', 'layout']
        db.delete_unique('layout_skin', ['name', 'layout_id'])

        # Deleting model 'Skin'
        db.delete_table('layout_skin')

        # Deleting model 'Theme'
        db.delete_table('layout_theme')

        # Deleting model 'SkinOrganization'
        db.delete_table('layout_skinorganization')

        # Deleting model 'SkinTemplate'
        db.delete_table('layout_skintemplate')

        # Deleting model 'ThemeBranding'
        db.delete_table('layout_themebranding')

        # Deleting model 'Branding'
        db.delete_table('layout_branding')

        # Deleting model 'Layout'
        db.delete_table('layout_layout')

        # Deleting model 'BrandingOrganization'
        db.delete_table('layout_brandingorganization')

    def backwards(self, orm):

        # Adding model 'Skin'
        db.create_table('layout_skin', (
            ('skin_template', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.SkinTemplate'])),
            ('layout', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Layout'], null=True, blank=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('creator', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'], null=True, blank=True)),
            ('default', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('properties', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('layout', ['Skin'])

        # Adding unique constraint on 'Skin', fields ['name', 'layout']
        db.create_unique('layout_skin', ['name', 'layout_id'])

        # Adding model 'Theme'
        db.create_table('layout_theme', (
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250, unique=True)),
            ('theme_css', self.gf('django.db.models.fields.TextField')()),
            ('images', self.gf('django.db.models.fields.TextField')()),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('layout', ['Theme'])

        # Adding model 'SkinOrganization'
        db.create_table('layout_skinorganization', (
            ('organization', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.Group'])),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=25)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('skin', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Skin'])),
        ))
        db.send_create_signal('layout', ['SkinOrganization'])

        # Adding unique constraint on 'SkinOrganization', fields ['skin', 'organization', 'type']
        db.create_unique('layout_skinorganization', ['skin_id', 'organization_id', 'type'])

        # Adding model 'SkinTemplate'
        db.create_table('layout_skintemplate', (
            ('layout', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Layout'], null=True, blank=True)),
            ('template_file', self.gf('django.db.models.fields.CharField')(max_length=25)),
            ('properties', self.gf('django.db.models.fields.TextField')()),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=25)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('layout', ['SkinTemplate'])

        # Adding model 'ThemeBranding'
        db.create_table('layout_themebranding', (
            ('branding', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Branding'])),
            ('theme', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Theme'])),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=25)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('layout', ['ThemeBranding'])

        # Adding unique constraint on 'ThemeBranding', fields ['theme', 'branding', 'type']
        db.create_unique('layout_themebranding', ['theme_id', 'branding_id', 'type'])

        # Adding model 'Branding'
        db.create_table('layout_branding', (
            ('logo', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, blank=True)),
            ('link', self.gf('django.db.models.fields.URLField')(max_length=500, null=True, blank=True)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('viewer_logo', self.gf('django.db.models.fields.CharField')(max_length=500, null=True, blank=True)),
        ))
        db.send_create_signal('layout', ['Branding'])

        # Adding model 'Layout'
        db.create_table('layout_layout', (
            ('templates', self.gf('django.db.models.fields.TextField')()),
            ('elements', self.gf('django.db.models.fields.TextField')()),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250, unique=True)),
            ('theme', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Theme'])),
            ('layout_css', self.gf('django.db.models.fields.TextField')()),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('layout', ['Layout'])

        # Adding model 'BrandingOrganization'
        db.create_table('layout_brandingorganization', (
            ('branding', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['layout.Branding'])),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=25)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('organization', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.Group'])),
        ))
        db.send_create_signal('layout', ['BrandingOrganization'])

        # Adding unique constraint on 'BrandingOrganization', fields ['branding', 'organization', 'type']
        db.create_unique('layout_brandingorganization', ['branding_id', 'organization_id', 'type'])

    models = {}

    complete_apps = ['layout']
