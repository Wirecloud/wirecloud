# -*- coding: utf-8 -*-
# Generated by Django 1.11.20 on 2019-05-15 18:57

from django.conf import settings
from django.db import migrations, models
import django.db.migrations.operations.special
import django.db.models.deletion
import wirecloud.commons.fields
import wirecloud.platform.workspace.models


# Functions from the following migrations need manual copying.
# Move them and any dependencies into this file, then update the
# RunPython operations to refer to the local versions:
# wirecloud.platform.migrations.0009_migrate_public_markets

class Migration(migrations.Migration):

    replaces = [('platform', '0001_initial'), ('platform', '0002_auto_20160127_1143'), ('platform', '0003_remove_userworkspace_active'), ('platform', '0004_auto_20160915_0024'), ('platform', '0005_add_multiuser_variable_support'), ('platform', '0006_remove_iwidget_refused_version'), ('platform', '0007_remove_value_size_constraints_from_preference_models'), ('platform', '0008_market_public'), ('platform', '0009_migrate_public_markets'), ('platform', '0010_make_market_user_required'), ('platform', '0011_workspace_searchable'), ('platform', '0012_workspace_and_tab_title'), ('platform', '0013_workspace_and_tab_title_data'), ('platform', '0014_workspace_and_tab_title_not_null'), ('platform', '0015_remove_organization_models')]

    initial = True

    dependencies = [
        ('auth', '0008_alter_user_username_max_length'),
        ('catalogue', '0002_alter_json_description'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Constant',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('concept', models.CharField(max_length=255, unique=True, verbose_name='Concept')),
                ('value', models.CharField(max_length=256, verbose_name='Value')),
            ],
            options={
                'db_table': 'wirecloud_constant',
            },
        ),
        migrations.CreateModel(
            name='IWidget',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('widget_uri', models.CharField(max_length=250, verbose_name='Widget URI')),
                ('name', models.CharField(max_length=250, verbose_name='Name')),
                ('layout', models.IntegerField(default=0, verbose_name='Layout')),
                ('positions', wirecloud.commons.fields.JSONField(blank=True, default={})),
                ('readOnly', models.BooleanField(default=False, verbose_name='Read Only')),
                ('variables', wirecloud.commons.fields.JSONField(blank=True, default={})),
            ],
            options={
                'db_table': 'wirecloud_iwidget',
            },
        ),
        migrations.CreateModel(
            name='Market',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, verbose_name='Name')),
                ('public', models.BooleanField(default=False, verbose_name='Public')),
                ('options', wirecloud.commons.fields.JSONField(default={}, verbose_name='Options')),
                ('user', models.ForeignKey(blank=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
            options={
                'db_table': 'wirecloud_market',
            },
        ),
        migrations.CreateModel(
            name='MarketUserData',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, verbose_name='Name')),
                ('value', models.CharField(max_length=250, verbose_name='Value')),
                ('market', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='platform.Market', verbose_name='Market')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='User')),
            ],
            options={
                'db_table': 'wirecloud_marketuserdata',
            },
        ),
        migrations.CreateModel(
            name='PlatformPreference',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=250, verbose_name='Name')),
                ('value', models.TextField(verbose_name='Value')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'wirecloud_platformpreference',
            },
        ),
        migrations.CreateModel(
            name='Tab',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=30, verbose_name='Name')),
                ('title', models.CharField(max_length=30, verbose_name='Title')),
                ('visible', models.BooleanField(default=False, verbose_name='Visible')),
                ('position', models.IntegerField(blank=True, null=True)),
            ],
            options={
                'db_table': 'wirecloud_tab',
            },
        ),
        migrations.CreateModel(
            name='TabPreference',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=250, verbose_name='Name')),
                ('inherit', models.BooleanField(default=False, verbose_name='Inherit')),
                ('value', models.TextField(verbose_name='Value')),
                ('tab', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='platform.Tab')),
            ],
            options={
                'db_table': 'wirecloud_tabpreference',
            },
        ),
        migrations.CreateModel(
            name='UserWorkspace',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('manager', models.CharField(blank=True, max_length=100, verbose_name='Manager')),
                ('reason_ref', models.CharField(blank=True, help_text='Reference to the reason why it was added. Used by Workspace Managers to sync workspaces', max_length=100, verbose_name='Reason Ref')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'wirecloud_userworkspace',
            },
        ),
        migrations.CreateModel(
            name='Widget',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('resource', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='catalogue.CatalogueResource')),
            ],
            options={
                'db_table': 'wirecloud_widget',
                'ordering': ('resource__vendor', 'resource__short_name', 'resource__version'),
            },
        ),
        migrations.CreateModel(
            name='Workspace',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=30, verbose_name='Name')),
                ('title', models.CharField(max_length=255, verbose_name='Title')),
                ('creation_date', models.BigIntegerField(default=wirecloud.platform.workspace.models.now_timestamp, verbose_name='Creation Date')),
                ('last_modified', models.BigIntegerField(blank=True, null=True, verbose_name='Last Modification Date')),
                ('searchable', models.BooleanField(default=True, verbose_name='Searchable')),
                ('public', models.BooleanField(default=False, verbose_name='Available to all users')),
                ('description', models.TextField(blank=True, max_length=140, verbose_name='Description')),
                ('longdescription', models.TextField(blank=True, verbose_name='Long description')),
                ('forcedValues', wirecloud.commons.fields.JSONField(blank=True, default={})),
                ('wiringStatus', wirecloud.commons.fields.JSONField(blank=True, default={})),
                ('creator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='creator', to=settings.AUTH_USER_MODEL, verbose_name='Creator')),
                ('groups', models.ManyToManyField(blank=True, to='auth.Group', verbose_name='Groups')),
                ('users', models.ManyToManyField(through='platform.UserWorkspace', to=settings.AUTH_USER_MODEL, verbose_name='Users')),
            ],
            options={
                'db_table': 'wirecloud_workspace',
            },
        ),
        migrations.CreateModel(
            name='WorkspacePreference',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=250, verbose_name='Name')),
                ('inherit', models.BooleanField(default=False, verbose_name='Inherit')),
                ('value', models.TextField(verbose_name='Value')),
                ('workspace', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='platform.Workspace')),
            ],
            options={
                'db_table': 'wirecloud_workspacepreference',
            },
        ),
        migrations.CreateModel(
            name='XHTML',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('uri', models.CharField(max_length=255, unique=True, verbose_name='URI')),
                ('code', models.TextField(blank=True, verbose_name='Code')),
                ('code_timestamp', models.BigIntegerField(blank=True, null=True, verbose_name='Cache timestamp')),
                ('url', models.CharField(max_length=500, verbose_name='URL')),
                ('content_type', models.CharField(blank=True, max_length=50, null=True, verbose_name='Content type')),
                ('use_platform_style', models.BooleanField(default=False, verbose_name='Uses platform style')),
                ('cacheable', models.BooleanField(default=True, verbose_name='Cacheable')),
            ],
            options={
                'db_table': 'wirecloud_xhtml',
            },
        ),
        migrations.AddField(
            model_name='widget',
            name='xhtml',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='platform.XHTML'),
        ),
        migrations.AddField(
            model_name='userworkspace',
            name='workspace',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='platform.Workspace'),
        ),
        migrations.AddField(
            model_name='tab',
            name='workspace',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='platform.Workspace', verbose_name='Workspace'),
        ),
        migrations.AddField(
            model_name='iwidget',
            name='tab',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='platform.Tab', verbose_name='Tab'),
        ),
        migrations.AddField(
            model_name='iwidget',
            name='widget',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='platform.Widget', verbose_name='Widget'),
        ),
        migrations.AlterUniqueTogether(
            name='workspace',
            unique_together=set([('creator', 'name')]),
        ),
        migrations.AlterUniqueTogether(
            name='tab',
            unique_together=set([('name', 'workspace')]),
        ),
        migrations.AlterUniqueTogether(
            name='marketuserdata',
            unique_together=set([('market', 'user', 'name')]),
        ),
        migrations.AlterUniqueTogether(
            name='market',
            unique_together=set([('user', 'name')]),
        ),
    ]
