# -*- coding: utf-8 -*-
# Copyright (c) 2013-2014 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    depends_on = (
        ("catalogue", "0001_initial"),
    )

    def forwards(self, orm):
        # Adding model 'Constant'
        db.create_table('wirecloud_constant', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('concept', self.gf('django.db.models.fields.CharField')(unique=True, max_length=255)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=256)),
        ))
        db.send_create_signal('platform', ['Constant'])

        # Adding model 'Position'
        db.create_table('wirecloud_position', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('posX', self.gf('django.db.models.fields.IntegerField')()),
            ('posY', self.gf('django.db.models.fields.IntegerField')()),
            ('posZ', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('height', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('width', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('minimized', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('fulldragboard', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('platform', ['Position'])

        # Adding model 'IWidget'
        db.create_table('wirecloud_iwidget', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('widget', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.Widget'])),
            ('tab', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.Tab'])),
            ('layout', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('position', self.gf('django.db.models.fields.related.ForeignKey')(related_name='Position', to=orm['platform.Position'])),
            ('icon_position', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='Icon_Position', null=True, to=orm['platform.Position'])),
            ('refused_version', self.gf('django.db.models.fields.CharField')(max_length=150, null=True, blank=True)),
            ('readOnly', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('platform', ['IWidget'])

        # Adding model 'Variable'
        db.create_table('wirecloud_variable', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('vardef', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.VariableDef'])),
            ('iwidget', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.IWidget'])),
        ))
        db.send_create_signal('platform', ['Variable'])

        # Adding model 'Market'
        db.create_table('wirecloud_market', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'], null=True, blank=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('options', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('platform', ['Market'])

        # Adding unique constraint on 'Market', fields ['user', 'name']
        db.create_unique('wirecloud_market', ['user_id', 'name'])

        # Adding model 'MarketUserData'
        db.create_table('wirecloud_marketuserdata', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('market', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.Market'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=250)),
        ))
        db.send_create_signal('platform', ['MarketUserData'])

        # Adding unique constraint on 'MarketUserData', fields ['market', 'user', 'name']
        db.create_unique('wirecloud_marketuserdata', ['market_id', 'user_id', 'name'])

        # Adding model 'PlatformPreference'
        db.create_table('wirecloud_platformpreference', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=250)),
        ))
        db.send_create_signal('platform', ['PlatformPreference'])

        # Adding model 'WorkspacePreference'
        db.create_table('wirecloud_workspacepreference', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('workspace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.Workspace'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('inherit', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=250)),
        ))
        db.send_create_signal('platform', ['WorkspacePreference'])

        # Adding model 'TabPreference'
        db.create_table('wirecloud_tabpreference', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('tab', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.Tab'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('inherit', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=250)),
        ))
        db.send_create_signal('platform', ['TabPreference'])

        # Adding model 'XHTML'
        db.create_table('wirecloud_xhtml', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('uri', self.gf('django.db.models.fields.CharField')(unique=True, max_length=255)),
            ('code', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('code_timestamp', self.gf('django.db.models.fields.BigIntegerField')(null=True, blank=True)),
            ('url', self.gf('django.db.models.fields.CharField')(max_length=500)),
            ('content_type', self.gf('django.db.models.fields.CharField')(max_length=50, null=True, blank=True)),
            ('use_platform_style', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('cacheable', self.gf('django.db.models.fields.BooleanField')(default=True)),
        ))
        db.send_create_signal('platform', ['XHTML'])

        # Adding model 'Widget'
        db.create_table('wirecloud_widget', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('resource', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['catalogue.CatalogueResource'], unique=True)),
            ('xhtml', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.XHTML'])),
            ('width', self.gf('django.db.models.fields.IntegerField')(default=1)),
            ('height', self.gf('django.db.models.fields.IntegerField')(default=1)),
        ))
        db.send_create_signal('platform', ['Widget'])

        # Adding model 'VariableDef'
        db.create_table('wirecloud_variabledef', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=1)),
            ('secure', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('aspect', self.gf('django.db.models.fields.CharField')(max_length=4)),
            ('label', self.gf('django.db.models.fields.CharField')(max_length=150, null=True)),
            ('action_label', self.gf('django.db.models.fields.CharField')(max_length=50, null=True)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=250, null=True)),
            ('friend_code', self.gf('django.db.models.fields.CharField')(max_length=30, null=True)),
            ('default_value', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('widget', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.Widget'])),
            ('order', self.gf('django.db.models.fields.IntegerField')(default=0, blank=True)),
        ))
        db.send_create_signal('platform', ['VariableDef'])

        # Adding model 'UserPrefOption'
        db.create_table('wirecloud_userprefoption', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('variableDef', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.VariableDef'])),
        ))
        db.send_create_signal('platform', ['UserPrefOption'])

        # Adding model 'VariableDefAttr'
        db.create_table('wirecloud_variabledefattr', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('variableDef', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.VariableDef'])),
        ))
        db.send_create_signal('platform', ['VariableDefAttr'])

        # Adding model 'ContextOption'
        db.create_table('wirecloud_contextoption', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('concept', self.gf('django.db.models.fields.CharField')(max_length=256)),
            ('varDef', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.VariableDef'])),
        ))
        db.send_create_signal('platform', ['ContextOption'])

        # Adding model 'Workspace'
        db.create_table('wirecloud_workspace', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('creator', self.gf('django.db.models.fields.related.ForeignKey')(related_name='creator', to=orm['auth.User'])),
            ('forcedValues', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('wiringStatus', self.gf('django.db.models.fields.TextField')(blank=True)),
        ))
        db.send_create_signal('platform', ['Workspace'])

        # Adding unique constraint on 'Workspace', fields ['creator', 'name']
        db.create_unique('wirecloud_workspace', ['creator_id', 'name'])

        # Adding M2M table for field targetOrganizations on 'Workspace'
        db.create_table('wirecloud_workspace_targetOrganizations', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('workspace', models.ForeignKey(orm['platform.workspace'], null=False)),
            ('group', models.ForeignKey(orm['auth.group'], null=False))
        ))
        db.create_unique('wirecloud_workspace_targetOrganizations', ['workspace_id', 'group_id'])

        # Adding model 'UserWorkspace'
        db.create_table('wirecloud_userworkspace', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('workspace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.Workspace'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('active', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('manager', self.gf('django.db.models.fields.CharField')(max_length=100, blank=True)),
            ('reason_ref', self.gf('django.db.models.fields.CharField')(max_length=100, blank=True)),
        ))
        db.send_create_signal('platform', ['UserWorkspace'])

        # Adding model 'PublishedWorkspace'
        db.create_table('wirecloud_publishedworkspace', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('vendor', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('version', self.gf('django.db.models.fields.CharField')(max_length=150)),
            ('wikiURI', self.gf('django.db.models.fields.URLField')(max_length=200)),
            ('imageURI', self.gf('django.db.models.fields.URLField')(max_length=200)),
            ('description', self.gf('django.db.models.fields.TextField')()),
            ('author', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('creator', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('mail', self.gf('django.db.models.fields.CharField')(max_length=100)),
            ('workspace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.Workspace'], null=True, blank=True)),
            ('template', self.gf('django.db.models.fields.TextField')()),
            ('params', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('platform', ['PublishedWorkspace'])

        # Adding model 'GroupPublishedWorkspace'
        db.create_table('wirecloud_grouppublishedworkspace', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('group', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.Group'])),
            ('workspace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.PublishedWorkspace'])),
        ))
        db.send_create_signal('platform', ['GroupPublishedWorkspace'])

        # Adding model 'VariableValue'
        db.create_table('wirecloud_variablevalue', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('variable', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.Variable'])),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'])),
            ('value', self.gf('django.db.models.fields.TextField')(blank=True)),
        ))
        db.send_create_signal('platform', ['VariableValue'])

        # Adding unique constraint on 'VariableValue', fields ['variable', 'user']
        db.create_unique('wirecloud_variablevalue', ['variable_id', 'user_id'])

        # Adding model 'Tab'
        db.create_table('wirecloud_tab', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('visible', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('position', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('workspace', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['platform.Workspace'])),
        ))
        db.send_create_signal('platform', ['Tab'])

        # Adding unique constraint on 'Tab', fields ['name', 'workspace']
        db.create_unique('wirecloud_tab', ['name', 'workspace_id'])

    def backwards(self, orm):
        # Removing unique constraint on 'Tab', fields ['name', 'workspace']
        db.delete_unique('wirecloud_tab', ['name', 'workspace_id'])

        # Removing unique constraint on 'VariableValue', fields ['variable', 'user']
        db.delete_unique('wirecloud_variablevalue', ['variable_id', 'user_id'])

        # Removing unique constraint on 'Workspace', fields ['creator', 'name']
        db.delete_unique('wirecloud_workspace', ['creator_id', 'name'])

        # Removing unique constraint on 'MarketUserData', fields ['market', 'user', 'name']
        db.delete_unique('wirecloud_marketuserdata', ['market_id', 'user_id', 'name'])

        # Removing unique constraint on 'Market', fields ['user', 'name']
        db.delete_unique('wirecloud_market', ['user_id', 'name'])

        # Deleting model 'Constant'
        db.delete_table('wirecloud_constant')

        # Deleting model 'Position'
        db.delete_table('wirecloud_position')

        # Deleting model 'IWidget'
        db.delete_table('wirecloud_iwidget')

        # Deleting model 'Variable'
        db.delete_table('wirecloud_variable')

        # Deleting model 'Market'
        db.delete_table('wirecloud_market')

        # Deleting model 'MarketUserData'
        db.delete_table('wirecloud_marketuserdata')

        # Deleting model 'PlatformPreference'
        db.delete_table('wirecloud_platformpreference')

        # Deleting model 'WorkspacePreference'
        db.delete_table('wirecloud_workspacepreference')

        # Deleting model 'TabPreference'
        db.delete_table('wirecloud_tabpreference')

        # Deleting model 'XHTML'
        db.delete_table('wirecloud_xhtml')

        # Deleting model 'Widget'
        db.delete_table('wirecloud_widget')

        # Deleting model 'VariableDef'
        db.delete_table('wirecloud_variabledef')

        # Deleting model 'UserPrefOption'
        db.delete_table('wirecloud_userprefoption')

        # Deleting model 'VariableDefAttr'
        db.delete_table('wirecloud_variabledefattr')

        # Deleting model 'ContextOption'
        db.delete_table('wirecloud_contextoption')

        # Deleting model 'Workspace'
        db.delete_table('wirecloud_workspace')

        # Removing M2M table for field targetOrganizations on 'Workspace'
        db.delete_table('wirecloud_workspace_targetOrganizations')

        # Deleting model 'UserWorkspace'
        db.delete_table('wirecloud_userworkspace')

        # Deleting model 'PublishedWorkspace'
        db.delete_table('wirecloud_publishedworkspace')

        # Deleting model 'GroupPublishedWorkspace'
        db.delete_table('wirecloud_grouppublishedworkspace')

        # Deleting model 'VariableValue'
        db.delete_table('wirecloud_variablevalue')

        # Deleting model 'Tab'
        db.delete_table('wirecloud_tab')

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
        'catalogue.catalogueresource': {
            'Meta': {'unique_together': "(('short_name', 'vendor', 'version'),)", 'object_name': 'CatalogueResource'},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'creation_date': ('django.db.models.fields.DateTimeField', [], {}),
            'creator': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'uploaded_resources'", 'null': 'True', 'to': "orm['auth.User']"}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'display_name': ('django.db.models.fields.CharField', [], {'max_length': '250', 'null': 'True', 'blank': 'True'}),
            'fromWGT': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'local_resources'", 'blank': 'True', 'to': "orm['auth.Group']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
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
            'users': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'local_resources'", 'blank': 'True', 'to': "orm['auth.User']"}),
            'vendor': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'version': ('django.db.models.fields.CharField', [], {'max_length': '150'}),
            'wiki_page_uri': ('django.db.models.fields.CharField', [], {'max_length': '200', 'blank': 'True'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'platform.constant': {
            'Meta': {'object_name': 'Constant', 'db_table': "'wirecloud_constant'"},
            'concept': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '256'})
        },
        'platform.contextoption': {
            'Meta': {'object_name': 'ContextOption', 'db_table': "'wirecloud_contextoption'"},
            'concept': ('django.db.models.fields.CharField', [], {'max_length': '256'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'varDef': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.VariableDef']"})
        },
        'platform.grouppublishedworkspace': {
            'Meta': {'object_name': 'GroupPublishedWorkspace', 'db_table': "'wirecloud_grouppublishedworkspace'"},
            'group': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.Group']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'workspace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.PublishedWorkspace']"})
        },
        'platform.iwidget': {
            'Meta': {'object_name': 'IWidget', 'db_table': "'wirecloud_iwidget'"},
            'icon_position': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'Icon_Position'", 'null': 'True', 'to': "orm['platform.Position']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'layout': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'position': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'Position'", 'to': "orm['platform.Position']"}),
            'readOnly': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'refused_version': ('django.db.models.fields.CharField', [], {'max_length': '150', 'null': 'True', 'blank': 'True'}),
            'tab': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.Tab']"}),
            'widget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.Widget']"})
        },
        'platform.market': {
            'Meta': {'unique_together': "(('user', 'name'),)", 'object_name': 'Market', 'db_table': "'wirecloud_market'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'options': ('django.db.models.fields.TextField', [], {}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']", 'null': 'True', 'blank': 'True'})
        },
        'platform.marketuserdata': {
            'Meta': {'unique_together': "(('market', 'user', 'name'),)", 'object_name': 'MarketUserData', 'db_table': "'wirecloud_marketuserdata'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'market': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.Market']"}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '250'})
        },
        'platform.platformpreference': {
            'Meta': {'object_name': 'PlatformPreference', 'db_table': "'wirecloud_platformpreference'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '250'})
        },
        'platform.position': {
            'Meta': {'object_name': 'Position', 'db_table': "'wirecloud_position'"},
            'fulldragboard': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'height': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'minimized': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'posX': ('django.db.models.fields.IntegerField', [], {}),
            'posY': ('django.db.models.fields.IntegerField', [], {}),
            'posZ': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'width': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        'platform.publishedworkspace': {
            'Meta': {'object_name': 'PublishedWorkspace', 'db_table': "'wirecloud_publishedworkspace'"},
            'author': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'creator': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'description': ('django.db.models.fields.TextField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'imageURI': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'mail': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'params': ('django.db.models.fields.TextField', [], {}),
            'template': ('django.db.models.fields.TextField', [], {}),
            'vendor': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'version': ('django.db.models.fields.CharField', [], {'max_length': '150'}),
            'wikiURI': ('django.db.models.fields.URLField', [], {'max_length': '200'}),
            'workspace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.Workspace']", 'null': 'True', 'blank': 'True'})
        },
        'platform.tab': {
            'Meta': {'unique_together': "(('name', 'workspace'),)", 'object_name': 'Tab', 'db_table': "'wirecloud_tab'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'position': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'visible': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'workspace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.Workspace']"})
        },
        'platform.tabpreference': {
            'Meta': {'object_name': 'TabPreference', 'db_table': "'wirecloud_tabpreference'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inherit': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'tab': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.Tab']"}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '250'})
        },
        'platform.userprefoption': {
            'Meta': {'object_name': 'UserPrefOption', 'db_table': "'wirecloud_userprefoption'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'variableDef': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.VariableDef']"})
        },
        'platform.userworkspace': {
            'Meta': {'object_name': 'UserWorkspace', 'db_table': "'wirecloud_userworkspace'"},
            'active': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'manager': ('django.db.models.fields.CharField', [], {'max_length': '100', 'blank': 'True'}),
            'reason_ref': ('django.db.models.fields.CharField', [], {'max_length': '100', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'workspace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.Workspace']"})
        },
        'platform.variable': {
            'Meta': {'object_name': 'Variable', 'db_table': "'wirecloud_variable'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'iwidget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.IWidget']"}),
            'vardef': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.VariableDef']"})
        },
        'platform.variabledef': {
            'Meta': {'object_name': 'VariableDef', 'db_table': "'wirecloud_variabledef'"},
            'action_label': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True'}),
            'aspect': ('django.db.models.fields.CharField', [], {'max_length': '4'}),
            'default_value': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '250', 'null': 'True'}),
            'friend_code': ('django.db.models.fields.CharField', [], {'max_length': '30', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'label': ('django.db.models.fields.CharField', [], {'max_length': '150', 'null': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'order': ('django.db.models.fields.IntegerField', [], {'default': '0', 'blank': 'True'}),
            'secure': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '1'}),
            'widget': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.Widget']"})
        },
        'platform.variabledefattr': {
            'Meta': {'object_name': 'VariableDefAttr', 'db_table': "'wirecloud_variabledefattr'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'variableDef': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.VariableDef']"})
        },
        'platform.variablevalue': {
            'Meta': {'unique_together': "(('variable', 'user'),)", 'object_name': 'VariableValue', 'db_table': "'wirecloud_variablevalue'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'value': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'variable': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.Variable']"})
        },
        'platform.widget': {
            'Meta': {'ordering': "('resource__vendor', 'resource__short_name', 'resource__version')", 'object_name': 'Widget', 'db_table': "'wirecloud_widget'"},
            'height': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'resource': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['catalogue.CatalogueResource']", 'unique': 'True'}),
            'width': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            'xhtml': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.XHTML']"})
        },
        'platform.workspace': {
            'Meta': {'unique_together': "(('creator', 'name'),)", 'object_name': 'Workspace', 'db_table': "'wirecloud_workspace'"},
            'creator': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'creator'", 'to': "orm['auth.User']"}),
            'forcedValues': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '30'}),
            'targetOrganizations': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': "orm['auth.Group']", 'null': 'True', 'blank': 'True'}),
            'users': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.User']", 'through': "orm['platform.UserWorkspace']", 'symmetrical': 'False'}),
            'wiringStatus': ('django.db.models.fields.TextField', [], {'blank': 'True'})
        },
        'platform.workspacepreference': {
            'Meta': {'object_name': 'WorkspacePreference', 'db_table': "'wirecloud_workspacepreference'"},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'inherit': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'workspace': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['platform.Workspace']"})
        },
        'platform.xhtml': {
            'Meta': {'object_name': 'XHTML', 'db_table': "'wirecloud_xhtml'"},
            'cacheable': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'code': ('django.db.models.fields.TextField', [], {'blank': 'True'}),
            'code_timestamp': ('django.db.models.fields.BigIntegerField', [], {'null': 'True', 'blank': 'True'}),
            'content_type': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'uri': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'url': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'use_platform_style': ('django.db.models.fields.BooleanField', [], {'default': 'False'})
        }
    }

    complete_apps = ['platform']
