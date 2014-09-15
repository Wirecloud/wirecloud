/*
 *     Copyright (c) 2012-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, LayoutManagerFactory, StyledElements*/

(function () {

    "use strict";

    var WorkspaceViewItems = function WorkspaceViewItems() {
        StyledElements.DynamicMenuItems.call(this);
    };
    WorkspaceViewItems.prototype = new StyledElements.DynamicMenuItems();

    WorkspaceViewItems.prototype.build = function () {
        var current_workspace, item, items;

        items = [];
        current_workspace = Wirecloud.activeWorkspace;

        item = new StyledElements.MenuItem(gettext('Rename'), function () {
            (new Wirecloud.ui.RenameWindowMenu(current_workspace, 'rename')).show();
        }.bind(this));
        items.push(item);
        item.setDisabled(current_workspace == null || !current_workspace.isAllowed('rename'));

        item = new StyledElements.MenuItem(gettext('Settings'), function () {
            current_workspace.getPreferencesWindow().show();
        });
        items.push(item);
        item.setDisabled(current_workspace == null || !current_workspace.isAllowed('update_preferences'));

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

        item = new StyledElements.MenuItem(gettext('Embed'), function () {
            var title = gettext('Embed Code');
            var path = Wirecloud.URLs.WORKSPACE_VIEW.evaluate({owner: encodeURIComponent(current_workspace.workspaceState.creator), name: encodeURIComponent(current_workspace.workspaceState.name)});
            var workspace_url = document.location.protocol + '//' + document.location.host + path + '?mode=embedded';
            var dialog = new Wirecloud.ui.EmbedCodeWindowMenu(title, '<iframe src="' + workspace_url + '" frameborder="0" allowfullscreen></iframe>');
            dialog.show();
        });
        items.push(item);

        item = new StyledElements.MenuItem(gettext('Upload to my resources'), function () {
            LayoutManagerFactory.getInstance().viewsByName.marketplace.waitMarketListReady({
                onComplete: function () {
                    var dialog = new Wirecloud.ui.PublishWorkspaceWindowMenu(current_workspace);
                    dialog.show();
                }
            });
        }.bind(this));
        items.push(item);
        item.setDisabled(current_workspace == null);

        return items;
    };

    Wirecloud.ui.WorkspaceViewItems = WorkspaceViewItems;

})();
