/*
 *     (C) Copyright 2012-2013 Universidad Politécnica de Madrid
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

/*global gettext, OpManagerFactory, StyledElements, Wirecloud, WorkspaceItems, WorkspaceListItems*/

(function () {

    "use strict";

    var WorkspaceView = function WorkspaceView(id, options) {
        options.id = 'workspace';
        StyledElements.Alternative.call(this, id, options);

        this.wsMenu = new StyledElements.PopupMenu();
        this.wsMenu.append(new WorkspaceListItems(function (workspace) {
            OpManagerFactory.getInstance().changeActiveWorkspace(workspace);
        }));
        this.wsMenu.appendSeparator();
        this.wsMenu.append(new WorkspaceItems());

        this.wsMenu.append(new StyledElements.MenuItem(gettext('New workspace'), function () {
            this.createWorkspaceWindow.show();
        }.bind(this)));

        this.wsMenu.append(new StyledElements.MenuItem(gettext('Publish'), function () {
            LayoutManagerFactory.getInstance().viewsByName.marketplace.waitMarketListReady(function () {
                var window = new Wirecloud.ui.PublishWorkspaceWindowMenu(OpManagerFactory.getInstance().activeWorkspace);
                window.show();
            });
        }.bind(this)));
    };
    WorkspaceView.prototype = new StyledElements.Alternative();

    WorkspaceView.prototype.view_name = 'workspace';

    WorkspaceView.prototype.getBreadcrum = function getBreadcrum() {
        var workspace, workspace_name, entries;

        workspace = OpManagerFactory.getInstance().activeWorkspace;
        if (workspace != null) {
            // TODO
            // Moved here to ensure the initial theme has been loaded
            if (this.createWorkspaceWindow == null) {
                this.createWorkspaceWindow = new Wirecloud.ui.NewWorkspaceWindowMenu();
            }

            entries = [
                {
                    'label': workspace.workspaceGlobalInfo.creator
                }, {
                    'label': workspace.getName(),
                    'menu': this.wsMenu
                }
            ];
        } else {
            entries = [{
                'label': gettext('loading...')
            }];
        }

        return entries;
    };

    WorkspaceView.prototype.destroy = function destroy() {

        if (this.wsMenu) {
            this.wsMenu.destroy();
            this.wsMenu = null;
        }

        StyledElements.Alternative.destroy();
    };

    window.WorkspaceView = WorkspaceView;

})();
