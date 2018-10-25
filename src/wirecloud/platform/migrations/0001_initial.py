# -*- coding: utf-8 -*-
from django.db import models, migrations
import wirecloud.platform.workspace.models
import wirecloud.commons.fields
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('catalogue', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Constant',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('concept', models.CharField(unique=True, max_length=255, verbose_name='Concept')),
                ('value', models.CharField(max_length=256, verbose_name='Value')),
            ],
            options={
                'db_table': 'wirecloud_constant',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='IWidget',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('widget_uri', models.CharField(max_length=250, verbose_name='Widget URI')),
                ('name', models.CharField(max_length=250, verbose_name='Name')),
                ('layout', models.IntegerField(default=0, verbose_name='Layout')),
                ('positions', wirecloud.commons.fields.JSONField(default={}, blank=True)),
                ('refused_version', models.CharField(max_length=150, null=True, verbose_name='Refused Version', blank=True)),
                ('readOnly', models.BooleanField(default=False, verbose_name='Read Only')),
                ('variables', wirecloud.commons.fields.JSONField(default={}, blank=True)),
            ],
            options={
                'db_table': 'wirecloud_iwidget',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Market',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=50, verbose_name='Name')),
                ('options', wirecloud.commons.fields.JSONField(default={}, verbose_name='Options')),
                ('user', models.ForeignKey(on_delete=models.CASCADE, verbose_name='User', blank=True, to=settings.AUTH_USER_MODEL, null=True)),
            ],
            options={
                'db_table': 'wirecloud_market',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='MarketUserData',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=50, verbose_name='Name')),
                ('value', models.CharField(max_length=250, verbose_name='Value')),
                ('market', models.ForeignKey(on_delete=models.CASCADE, verbose_name='Market', to='platform.Market')),
                ('user', models.ForeignKey(on_delete=models.CASCADE, verbose_name='User', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'wirecloud_marketuserdata',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Organization',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('group', models.OneToOneField(to='auth.Group')),
                ('user', models.OneToOneField(to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='PlatformPreference',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=250, verbose_name='Name')),
                ('value', models.CharField(max_length=250, verbose_name='Value')),
                ('user', models.ForeignKey(on_delete=models.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'wirecloud_platformpreference',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Tab',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=30, verbose_name='Name')),
                ('visible', models.BooleanField(default=False, verbose_name='Visible')),
                ('position', models.IntegerField(null=True, blank=True)),
            ],
            options={
                'db_table': 'wirecloud_tab',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='TabPreference',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=250, verbose_name='Name')),
                ('inherit', models.BooleanField(default=False, verbose_name='Inherit')),
                ('value', models.CharField(max_length=250, verbose_name='Value')),
                ('tab', models.ForeignKey(on_delete=models.CASCADE, to='platform.Tab')),
            ],
            options={
                'db_table': 'wirecloud_tabpreference',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Team',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=80, verbose_name='name')),
                ('organization', models.ForeignKey(on_delete=models.CASCADE, to='platform.Organization')),
                ('users', models.ManyToManyField(related_name='teams', verbose_name='users', to=settings.AUTH_USER_MODEL, blank=True)),
            ],
            options={
                'verbose_name': 'team',
                'verbose_name_plural': 'teams',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='UserWorkspace',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('active', models.BooleanField(default=False, verbose_name='Active')),
                ('manager', models.CharField(max_length=100, verbose_name='Manager', blank=True)),
                ('reason_ref', models.CharField(help_text='Reference to the reason why it was added. Used by Workspace Managers to sync workspaces', max_length=100, verbose_name='Reason Ref', blank=True)),
                ('user', models.ForeignKey(on_delete=models.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'wirecloud_userworkspace',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Widget',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('resource', models.OneToOneField(to='catalogue.CatalogueResource')),
            ],
            options={
                'ordering': ('resource__vendor', 'resource__short_name', 'resource__version'),
                'db_table': 'wirecloud_widget',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Workspace',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=30, verbose_name='Name')),
                ('creation_date', models.BigIntegerField(default=wirecloud.platform.workspace.models.now_timestamp, verbose_name='Creation Date')),
                ('last_modified', models.BigIntegerField(null=True, verbose_name='Last Modification Date', blank=True)),
                ('public', models.BooleanField(default=False, verbose_name='Available to all users')),
                ('description', models.TextField(max_length=140, verbose_name='Description', blank=True)),
                ('longdescription', models.TextField(verbose_name='Long description', blank=True)),
                ('forcedValues', wirecloud.commons.fields.JSONField(default={}, blank=True)),
                ('wiringStatus', wirecloud.commons.fields.JSONField(default={}, blank=True)),
                ('creator', models.ForeignKey(on_delete=models.CASCADE, related_name='creator', verbose_name='Creator', to=settings.AUTH_USER_MODEL)),
                ('groups', models.ManyToManyField(to='auth.Group', null=True, verbose_name='Groups', blank=True)),
                ('users', models.ManyToManyField(to=settings.AUTH_USER_MODEL, verbose_name='Users', through='platform.UserWorkspace')),
            ],
            options={
                'db_table': 'wirecloud_workspace',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='WorkspacePreference',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=250, verbose_name='Name')),
                ('inherit', models.BooleanField(default=False, verbose_name='Inherit')),
                ('value', models.CharField(max_length=250, verbose_name='Value')),
                ('workspace', models.ForeignKey(on_delete=models.CASCADE, to='platform.Workspace')),
            ],
            options={
                'db_table': 'wirecloud_workspacepreference',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='XHTML',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('uri', models.CharField(unique=True, max_length=255, verbose_name='URI')),
                ('code', models.TextField(verbose_name='Code', blank=True)),
                ('code_timestamp', models.BigIntegerField(null=True, verbose_name='Cache timestamp', blank=True)),
                ('url', models.CharField(max_length=500, verbose_name='URL')),
                ('content_type', models.CharField(max_length=50, null=True, verbose_name='Content type', blank=True)),
                ('use_platform_style', models.BooleanField(default=False, verbose_name='Uses platform style')),
                ('cacheable', models.BooleanField(default=True, verbose_name='Cacheable')),
            ],
            options={
                'db_table': 'wirecloud_xhtml',
            },
            bases=(models.Model,),
        ),
        migrations.AlterUniqueTogether(
            name='workspace',
            unique_together=set([('creator', 'name')]),
        ),
        migrations.AddField(
            model_name='widget',
            name='xhtml',
            field=models.ForeignKey(on_delete=models.CASCADE, to='platform.XHTML'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='userworkspace',
            name='workspace',
            field=models.ForeignKey(on_delete=models.CASCADE, to='platform.Workspace'),
            preserve_default=True,
        ),
        migrations.AlterUniqueTogether(
            name='team',
            unique_together=set([('organization', 'name')]),
        ),
        migrations.AddField(
            model_name='tab',
            name='workspace',
            field=models.ForeignKey(on_delete=models.CASCADE, verbose_name='Workspace', to='platform.Workspace'),
            preserve_default=True,
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
        migrations.AddField(
            model_name='iwidget',
            name='tab',
            field=models.ForeignKey(on_delete=models.CASCADE, verbose_name='Tab', to='platform.Tab'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='iwidget',
            name='widget',
            field=models.ForeignKey(on_delete=models.CASCADE, verbose_name='Widget', to='platform.Widget', null=True),
            preserve_default=True,
        ),
    ]
