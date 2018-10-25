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

from django.db.migrations.exceptions import IrreversibleError


def workspace_and_tab_title_data_forwards(apps, schema_editor):
    # Migrate workspace titles
    workspaces = apps.get_model("platform", "workspace")
    for workspace in workspaces.objects.all():
        if workspace.title is None or workspace.title.strip() is "":
            workspace.title = workspace.name
            workspace.save()
            #workspace.title if workspace.title is not None and workspace.title.strip() != "" else workspace.name

    # Migrate tab titles
    tabs = apps.get_model("platform", "tab")
    for tab in tabs.objects.all():
        if tab.title is None or tab.title.strip() is "":
            tab.title = tab.name
            tab.save()


def mutate_forwards_operator(preference, userID):
    preference["value"] = {"users": {"%s" % userID: preference.get("value", "")}}
    return preference


def mutate_forwards_widget(preference, userID):
    preference = {"users": {"%s" % userID: preference}}
    return preference


def mutate_backwards_operator(preference, userID):
    preference["value"] = preference["value"]["users"]["%s" % userID]
    return preference


def mutate_backwards_widget(preference, userID):
    preference = preference["users"]["%s" % userID]
    return preference


def multiuser_variables_structure_forwards(apps, schema_editor):

    Workspace = apps.get_model("platform", "workspace")

    for workspace in Workspace.objects.select_related('creator').all():
        owner = workspace.creator.id

        # Update operators
        wiring = workspace.wiringStatus
        for op in wiring["operators"]:
            wiring["operators"][op]["preferences"] = {k: mutate_forwards_operator(v, owner) for k, v in wiring["operators"][op].get("preferences", {}).items()}
            wiring["operators"][op]["properties"] = {}  # Create properties structure
        workspace.save()

        # Update widgets
        for tab in workspace.tab_set.all():
            for widget in tab.iwidget_set.all():
                widget.variables = {k: mutate_forwards_widget(v, owner) for k, v in widget.variables.items()}
                widget.save()


def multiuser_variables_structure_backwards(apps, schema_editor):

    # Check no multiuser widgets
    CatalogueResource = apps.get_model("catalogue", "CatalogueResource")

    for component in CatalogueResource.objects.filter(type__in=(0, 2)).all():
        for property in component.json_description["properties"]:
            if property.get("multiuser", False):
                uri = component.vendor + '/' + component.short_name + '/' + component.version
                raise IrreversibleError("Component %s requires multiuser support. Uninstall it before downgrading." % uri)

    Workspace = apps.get_model("platform", "workspace")
    for workspace in Workspace.objects.select_related('creator').all():
        owner = workspace.creator.id

        # Update operators
        wiring = workspace.wiringStatus
        for op in wiring["operators"]:
            wiring["operators"][op]["preferences"] = {k: mutate_backwards_operator(v, owner) for k, v in wiring["operators"][op]["preferences"].items()}
            # Remove operator properties
            if 'properties' in wiring["operators"][op]:
                del wiring["operators"][op]['properties']
        workspace.save()

        # Update widgets
        for tab in workspace.tab_set.all():
            for widget in tab.iwidget_set.all():
                widget.variables = {k: mutate_backwards_widget(v, owner) for k, v in widget.variables.items()}
                widget.save()
