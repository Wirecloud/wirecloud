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


var WorkspaceView = function (id, options) {
    options.id = 'workspace';
    StyledElements.Alternative.call(this, id, options);

    this.createWorkspaceWindow = new CreateWindowMenu('workSpace');
    this.renameWorkspaceWindow = new RenameWindowMenu(null);

    this.wsMenu = new StyledElements.PopupMenu();
    this.wsMenu.append(new WorkspaceItems(function (workspace) {
        OpManagerFactory.getInstance().changeActiveWorkSpace(workspace);
    }));
    this.wsMenu.appendSeparator();
    this.wsMenu.append(new StyledElements.MenuItem(gettext('Rename'), function () {
        this.renameWorkspaceWindow.show();
    }.bind(this)));
    this.wsMenu.append(new StyledElements.MenuItem(gettext('Settings'), function () {
        LayoutManagerFactory.getInstance().showPreferencesWindow('workspace', OpManagerFactory.getInstance().activeWorkSpace.preferences);
    }.bind(this)));
    this.wsMenu.append(new StyledElements.MenuItem(gettext('New workspace'), function () {
        this.createWorkspaceWindow.show();
    }.bind(this)));
};
WorkspaceView.prototype = new StyledElements.Alternative();

WorkspaceView.prototype.view_name = 'workspace';
WorkspaceView.prototype.getSubMenuItems = function () {
    return WorkSpace.prototype.getSubMenuItems();
};

WorkspaceView.prototype.getBreadcrum = function () {
    var workspace, workspace_name;

    workspace = OpManagerFactory.getInstance().activeWorkSpace;
    if (workspace != null) {
        workspace_name = workspace.getName();
    } else {
        workspace_name = gettext('loading...');
    }

    return [
        {
            'label': ezweb_user_name,
        },
        {
            'label': workspace_name,
            'menu': this.wsMenu
        }
    ];
};

WorkspaceView.prototype.destroy = function() {

    if (this.wsMenu) {
        this.wsMenu.destroy();
        this.wsMenu = null;
    }

    StyledElements.Alternative.destroy();
};
