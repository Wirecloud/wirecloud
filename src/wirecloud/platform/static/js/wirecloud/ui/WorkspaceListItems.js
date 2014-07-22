/*
 *     Copyright 2012-2014 (c) CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global StyledElements, Wirecloud*/

(function () {

    "use strict";

    var WorkspaceListItems = function (handler) {
        StyledElements.DynamicMenuItems.call(this);

        this.handler = handler;
    };
    WorkspaceListItems.prototype = new StyledElements.DynamicMenuItems();

    WorkspaceListItems.prototype.build = function () {
        var workspace_name, items, workspace, username, user_workspaces;

        items = [];

        username = Wirecloud.contextManager.get('username');
        user_workspaces = Wirecloud.workspacesByUserAndName[username];

        if (user_workspaces == null || Object.keys(user_workspaces).length === 0) {
            items.push(new StyledElements.MenuItem(
                gettext('Empty workspace list'),
                this.handler,
                null
            ));
            items[0].disable();
            return items;
        }

        for (workspace_name in user_workspaces) {
            workspace = user_workspaces[workspace_name];

            items.push(new StyledElements.MenuItem(
                workspace_name,
                this.handler,
                workspace
            ));
        }

        return items;
    };

    Wirecloud.ui.WorkspaceListItems = WorkspaceListItems;

})();
