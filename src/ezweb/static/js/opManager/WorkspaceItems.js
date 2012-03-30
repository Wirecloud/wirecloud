/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/*jshint forin:true, eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser:true, indent:4, maxerr:50 */
/*global gettext, LayoutManagerFactory, OpManagerFactory, StyledElements*/

var WorkspaceItems = function () {
    StyledElements.DynamicMenuItems.call(this);

    this.renameWorkspaceWindow = new RenameWindowMenu(null);
};
WorkspaceItems.prototype = new StyledElements.DynamicMenuItems();

WorkspaceItems.prototype.build = function () {
    var current_workspace, items;

    items = [];
    current_workspace = OpManagerFactory.getInstance().activeWorkSpace;

    if (current_workspace.isAllowed('rename_workspace')) {
        items.push(new StyledElements.MenuItem(gettext('Rename'), function () {
            this.renameWorkspaceWindow.show();
        }.bind(this)));
    }

    if (current_workspace.isAllowed('change_workspace_preferences')) {
        items.push(new StyledElements.MenuItem(gettext('Settings'), function () {
            LayoutManagerFactory.getInstance().showPreferencesWindow('workspace', current_workspace.preferences);
        }));
    }

    if (current_workspace.isAllowed('remove')) {
        items.push(new StyledElements.MenuItem(gettext("Remove"), function() {
            var msg = gettext('Do you really want to remove the "%(workspaceName)s" workspace?');
            msg = interpolate(msg, {workspaceName: current_workspace.workSpaceState.name}, true);
            LayoutManagerFactory.getInstance().showYesNoDialog(msg, function() {
                current_workspace.delete();
            });
        }.bind(this)));
    }

    return items;
};
