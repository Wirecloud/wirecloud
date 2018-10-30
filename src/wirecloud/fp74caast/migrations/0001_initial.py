# -*- coding: utf-8 -*-
from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('platform', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Profile4CaaSt',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('id_4CaaSt', models.CharField(max_length=255)),
                ('user_workspace', models.OneToOneField(to='platform.UserWorkspace')),
            ],
            options={
                'verbose_name': '4CaaSt Profile',
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='TenantProfile',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('id_4CaaSt', models.CharField(max_length=255)),
                ('user', models.OneToOneField(related_name='tenantprofile_4CaaSt', to=settings.AUTH_USER_MODEL)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
    ]
