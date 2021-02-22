/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2018-2021 Future Internet Consulting and Development Solutions S.L.
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

    ns.WorkspaceViewMenuItems = class WorkspaceViewMenuItems extends se.DynamicMenuItems {

        constructor(workspace) {
            super();

            Object.defineProperties(this, {
                workspace: {
                    value: workspace
                }
            });
        }

        /**
         * @override
         */
        build() {
            let item;

            const items = [];

            item = new se.MenuItem(utils.gettext("New workspace"), function () {
                (new Wirecloud.ui.NewWorkspaceWindowMenu()).show();
            }.bind(this.workspace));
            item.addIconClass("fas fa-plus");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Rename"), function () {
                (new Wirecloud.ui.RenameWindowMenu(this, utils.gettext('Rename Workspace'))).show();
            }.bind(this.workspace.model));
            item.addIconClass("fas fa-pencil-alt");
            item.setDisabled(!this.workspace.editing || !this.workspace.model.isAllowed('rename'));
            items.push(item);

            item = new se.MenuItem(utils.gettext("Share"), function () {
                (new Wirecloud.ui.SharingWindowMenu(this)).show();
            }.bind(this.workspace));
            item.addIconClass("fas fa-share");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Upload to my resources"), function () {
                Wirecloud.UserInterfaceManager.views.marketplace.waitMarketListReady({
                    onComplete: function () {
                        var dialog = new Wirecloud.ui.PublishWorkspaceWindowMenu(this);
                        dialog.show();
                    }.bind(this)
                });
            }.bind(this.workspace.model));
            item.addIconClass("fas fa-archive");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Embed"), function () {
                (new Wirecloud.ui.EmbedCodeWindowMenu(utils.gettext("Embed Code"), this)).show();
            }.bind(this.workspace));
            item.addIconClass("fas fa-code");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Settings"), function () {
                this.showSettings();
            }.bind(this.workspace));
            item.addIconClass("fas fa-cog");
            item.setDisabled(!this.workspace.editing || !this.workspace.model.isAllowed('update_preferences'));
            items.push(item);

            item = new se.MenuItem(utils.gettext("Duplicate"), () => {
                (new Wirecloud.ui.NewWorkspaceWindowMenu({
                    title: utils.interpolate(utils.gettext("Copy of %(title)s"), this.workspace.model),
                    workspace: this.workspace.model.id
                })).show();
            });
            item.addIconClass("fas fa-clone");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Remove"), () => {
                var dialog = new Wirecloud.ui.AlertWindowMenu(
                    utils.interpolate(utils.gettext('Do you really want to remove the "%(name)s" workspace?'), {
                        name: this.workspace.title
                    })
                );
                dialog.setHandler(() => {
                    return this.workspace.model.remove();
                }).show();
            });
            item.addIconClass("fas fa-trash");
            item.setDisabled(!this.workspace.model.isAllowed('remove'));
            items.push(item);

            return items;
        }

    }

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
