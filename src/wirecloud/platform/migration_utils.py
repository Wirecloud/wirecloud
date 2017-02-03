# -*- coding: utf-8 -*-

# Copyright (c) 2017 CoNWeT Lab., Universidad Politécnica de Madrid

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

from __future__ import unicode_literals

from django.db import migrations, models
from django.db.migrations.exceptions import IrreversibleError
import six


def update_variables_structure(apps, schema_editor):

    mutate = lambda value, userID: {"users": {userID: value}}
    Workspace = apps.get_model("platform", "workspace")

    for workspace in Workspace.objects.select_related('creator').all():
        owner = workspace.creator.id

        # Update operators
        wiring = workspace.wiringStatus
        for op in wiring["operators"]:
            wiring["operators"][op]["preferences"] = {k: mutate(v, owner) for k, v in six.iteritems(wiring["operators"][op]["preferences"])}
        workspace.save()

        # Update widgets
        for tab in workspace.tab_set.all():
            for widget in tab.iwidget_set.all():
                widget.variables = {k: mutate(v, owner) for k, v in six.iteritems(widget.variables)}
                widget.save()


def reverse_variables_structure(apps, schema_editor):

    # Check no multiuser widgets
    CatalogueResource = apps.get_model("catalogue", "CatalogueResource")

    for component in CatalogueResource.objects.filter(type__in=(0, 2)).all():
        for property in component.json_description["properties"]:
            if property.get("multiuser", False):
                uri = component.vendor + '/' + component.short_name + '/' + component.version
                raise IrreversibleError("Component %s requires multiuser support. Uninstall it before downgrading." % uri)

    mutate = lambda value, userID: value["users"]["%s" % userID]
    Workspace = apps.get_model("platform", "workspace")
    for workspace in Workspace.objects.select_related('creator').all():
        owner = workspace.creator.id

        # Update operators
        wiring = workspace.wiringStatus
        for op in wiring["operators"]:
            wiring["operators"][op]["preferences"] = {k: mutate(v, owner) for k, v in six.iteritems(wiring["operators"][op]["preferences"])}
        workspace.save()

        # Update widgets
        for tab in workspace.tab_set.all():
            for widget in tab.iwidget_set.all():
                widget.variables = {k: mutate(v, owner) for k, v in six.iteritems(widget.variables)}
                widget.save()
