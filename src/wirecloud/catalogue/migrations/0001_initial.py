# -*- coding: utf-8 -*-
from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CatalogueResource',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('vendor', models.CharField(max_length=250, verbose_name='Vendor')),
                ('short_name', models.CharField(max_length=250, verbose_name='Name')),
                ('version', models.CharField(max_length=150, verbose_name='Version')),
                ('type', models.SmallIntegerField(verbose_name='Type', choices=[(0, 'Widget'), (1, 'Mashup'), (2, 'Operator')])),
                ('public', models.BooleanField(default=False, verbose_name='Available to all users')),
                ('creation_date', models.DateTimeField(verbose_name='creation_date')),
                ('template_uri', models.CharField(max_length=200, verbose_name='templateURI', blank=True)),
                ('popularity', models.DecimalField(default=0, verbose_name='popularity', max_digits=2, decimal_places=1)),
                ('json_description', models.TextField(verbose_name='JSON description')),
                ('creator', models.ForeignKey(on_delete=models.CASCADE, related_name='uploaded_resources', blank=True, to=settings.AUTH_USER_MODEL, null=True)),
                ('groups', models.ManyToManyField(related_name='local_resources', verbose_name='Groups', to='auth.Group', blank=True)),
                ('users', models.ManyToManyField(related_name='local_resources', verbose_name='Users', to=settings.AUTH_USER_MODEL, blank=True)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AlterUniqueTogether(
            name='catalogueresource',
            unique_together=set([('short_name', 'vendor', 'version')]),
        ),
    ]
