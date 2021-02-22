/*
 *     Copyright 2012-2016 (c) CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2021 Future Internet Consulting and Development Solutions S.L.
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

/* globals StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    ns.WorkspaceListItems = class WorkspaceListItems extends se.DynamicMenuItems {

        constructor(handler) {
            super();

            this.handler = handler;
        }

        build() {
            const items = [];

            const username = Wirecloud.contextManager.get('username');
            const user_workspaces = Wirecloud.workspacesByUserAndName[username];

            if (user_workspaces == null || Object.keys(user_workspaces).length === 0) {
                items.push(new StyledElements.MenuItem(
                    utils.gettext('Empty workspace list'),
                    this.handler,
                    null
                ));
                items[0].disable();
                return items;
            }

            for (let workspace_name in user_workspaces) {
                const workspace = user_workspaces[workspace_name];

                items.push(new StyledElements.MenuItem(
                    workspace.title,
                    this.handler,
                    workspace
                ));
            }

            return items;
        }

    }

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
