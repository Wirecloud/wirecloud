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
};
WorkspaceItems.prototype = new StyledElements.DynamicMenuItems();

WorkspaceItems.prototype.build = function () {
    var current_workspace, item, items;

    items = [];
    current_workspace = OpManagerFactory.getInstance().activeWorkspace;

    item = new StyledElements.MenuItem(gettext('Rename'), function () {
        (new Wirecloud.ui.RenameWindowMenu(opManager.activeWorkspace, 'rename')).show();
    }.bind(this));
    items.push(item);
    item.setDisabled(current_workspace == null || !current_workspace.isAllowed('rename_workspace'));

    item = new StyledElements.MenuItem(gettext('Settings'), function () {
        current_workspace.getPreferencesWindow().show();
    });
    items.push(item);
    item.setDisabled(current_workspace == null || !current_workspace.isAllowed('change_workspace_preferences'));

    item = new StyledElements.MenuItem(gettext("Remove"), function() {
        var msg = gettext('Do you really want to remove the "%(workspaceName)s" workspace?');
        msg = interpolate(msg, {workspaceName: current_workspace.workspaceState.name}, true);
        var dialog = new Wirecloud.ui.AlertWindowMenu();
        dialog.setMsg(msg);
        dialog.setHandler(function () {
                current_workspace.delete();
            });
        dialog.show();
    }.bind(this));
    items.push(item);
    item.setDisabled(current_workspace == null || !current_workspace.isAllowed('remove'));

    item = new StyledElements.MenuItem(gettext('New workspace'), function () {
        var dialog = new Wirecloud.ui.NewWorkspaceWindowMenu();
        dialog.show();
    }.bind(this));
    items.push(item);

    item = new StyledElements.MenuItem(gettext('Upload to local catalogue'), function () {
        LayoutManagerFactory.getInstance().viewsByName.marketplace.waitMarketListReady(function () {
            var dialog = new Wirecloud.ui.PublishWorkspaceWindowMenu(OpManagerFactory.getInstance().activeWorkspace);
            dialog.show();
        });
    }.bind(this));
    items.push(item);
    item.setDisabled(current_workspace == null);

    return items;
};
