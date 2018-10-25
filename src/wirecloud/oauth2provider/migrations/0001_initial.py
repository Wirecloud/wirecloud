# -*- coding: utf-8 -*-
from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Application',
            fields=[
                ('client_id', models.CharField(max_length=40, serialize=False, verbose_name='Client ID', primary_key=True)),
                ('client_secret', models.CharField(max_length=40, verbose_name='Client secret')),
                ('name', models.CharField(max_length=40, verbose_name='Application Name')),
                ('home_url', models.CharField(max_length=255, verbose_name='URL')),
                ('redirect_uri', models.CharField(max_length=255, verbose_name='Redirect URI', blank=True)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Code',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('scope', models.CharField(max_length=255, verbose_name='Scope', blank=True)),
                ('code', models.CharField(max_length=255, verbose_name='Code')),
                ('creation_timestamp', models.CharField(max_length=40, verbose_name='Creation timestamp')),
                ('expires_in', models.CharField(max_length=40, verbose_name='Expires in', blank=True)),
                ('client', models.ForeignKey(to='oauth2provider.Application')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='Token',
            fields=[
                ('token', models.CharField(max_length=40, serialize=False, verbose_name='Token', primary_key=True)),
                ('scope', models.CharField(max_length=255, verbose_name='Scope', blank=True)),
                ('token_type', models.CharField(max_length=10, verbose_name='Token type')),
                ('refresh_token', models.CharField(max_length=40, verbose_name='Refresh token', blank=True)),
                ('creation_timestamp', models.CharField(max_length=40, verbose_name='Creation timestamp')),
                ('expires_in', models.CharField(max_length=40, verbose_name='Expires in', blank=True)),
                ('client', models.ForeignKey(to='oauth2provider.Application')),
                ('user', models.ForeignKey(to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AlterUniqueTogether(
            name='code',
            unique_together=set([('client', 'code')]),
        ),
    ]
