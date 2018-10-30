# -*- coding: utf-8 -*-
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('platform', '0013_workspace_and_tab_title_data'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tab',
            name='title',
            field=models.CharField(max_length=30, null=False, verbose_name='Title'),
        ),
        migrations.AlterField(
            model_name='workspace',
            name='title',
            field=models.CharField(max_length=255, null=False, verbose_name='Title'),
        ),
    ]
