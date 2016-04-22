/*
 *     Copyright (c) 2012-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global LayoutManagerFactory, StyledElements, Wirecloud */

(function (utils) {

    "use strict";

    var WorkspaceViewItems = function WorkspaceViewItems() {
        StyledElements.DynamicMenuItems.call(this);
    };
    WorkspaceViewItems.prototype = new StyledElements.DynamicMenuItems();

    WorkspaceViewItems.prototype.build = function () {
        var current_workspace, item, items;

        items = [];
        current_workspace = Wirecloud.activeWorkspace;

        item = new StyledElements.MenuItem(utils.gettext('Rename'), function () {
            (new Wirecloud.ui.RenameWindowMenu(current_workspace, 'rename')).show();
        }.bind(this));
        items.push(item);
        item.addIconClass('fa fa-pencil');
        item.setDisabled(current_workspace == null || !current_workspace.isAllowed('rename'));

        item = new StyledElements.MenuItem(utils.gettext('Settings'), function () {
            current_workspace.getPreferencesWindow().show();
        });
        items.push(item);
        item.addIconClass('fa fa-gear');
        item.setDisabled(current_workspace == null || !current_workspace.isAllowed('update_preferences'));

        item = new StyledElements.MenuItem(utils.gettext("Remove"), function () {
            var msg = utils.gettext('Do you really want to remove the "%(workspaceName)s" workspace?');
            msg = utils.interpolate(msg, {workspaceName: current_workspace.workspaceState.name});
            var dialog = new Wirecloud.ui.AlertWindowMenu();
            dialog.setMsg(msg);
            dialog.setHandler(function () {
                    current_workspace.delete();
                });
            dialog.show();
        }.bind(this));
        item.addIconClass('fa fa-trash');
        item.setDisabled(current_workspace == null || !current_workspace.isAllowed('remove'));
        items.push(item);

        item = new StyledElements.MenuItem(utils.gettext('New workspace'), function () {
            var dialog = new Wirecloud.ui.NewWorkspaceWindowMenu();
            dialog.show();
        }.bind(this));
        item.addIconClass('fa fa-plus');
        items.push(item);

        item = new StyledElements.MenuItem(utils.gettext('Embed'), function () {
            var title = utils.gettext('Embed Code');
            var dialog = new Wirecloud.ui.EmbedCodeWindowMenu(title, current_workspace);
            dialog.show();
        });
        item.addIconClass('fa fa-code');
        items.push(item);

        item = new StyledElements.MenuItem(utils.gettext("Share"), function () {
            var dialog = new Wirecloud.ui.SharingWindowMenu(current_workspace);
            dialog.show();
        });
        item.addIconClass('fa fa-share');
        item.setDisabled(current_workspace == null || !current_workspace.isAllowed('update_preferences'));
        items.push(item);

        item = new StyledElements.MenuItem(utils.gettext('Upload to my resources'), function () {
            LayoutManagerFactory.getInstance().viewsByName.marketplace.waitMarketListReady({
                onComplete: function () {
                    var dialog = new Wirecloud.ui.PublishWorkspaceWindowMenu(current_workspace);
                    dialog.show();
                }
            });
        }.bind(this));
        items.push(item);
        item.addIconClass('fa fa-archive');
        item.setDisabled(current_workspace == null);

        return items;
    };

    Wirecloud.ui.WorkspaceViewItems = WorkspaceViewItems;

})(Wirecloud.Utils);
