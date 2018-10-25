# -*- coding: utf-8 -*-
from django.db import migrations, models

from wirecloud.platform.migration_utils import workspace_and_tab_title_data_forwards

class Migration(migrations.Migration):

    dependencies = [
        ('platform', '0012_workspace_and_tab_title'),
    ]

    operations = [
        # Copy name into title if title is None or an empty string for both workspaces and tabs
        migrations.RunPython(workspace_and_tab_title_data_forwards, migrations.RunPython.noop),
    ]
