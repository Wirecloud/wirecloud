/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    // =========================================================================
    // CLASS DEFINITION
    // =========================================================================

    ns.WorkspaceViewMenuItems = function WorkspaceViewMenuItems(workspace) {
        se.DynamicMenuItems.call(this);

        Object.defineProperties(this, {
            workspace: {
                value: workspace
            }
        });
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(ns.WorkspaceViewMenuItems, se.DynamicMenuItems, {

        /**
         * @override
         */
        build: function build() {
            var item, items;

            items = [];

            item = new se.MenuItem(utils.gettext("New workspace"), function () {
                (new Wirecloud.ui.NewWorkspaceWindowMenu()).show();
            }.bind(this.workspace));
            item.addIconClass("fa fa-plus");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Rename"), function () {
                (new Wirecloud.ui.RenameWindowMenu(this, utils.gettext('Rename Workspace'))).show();
            }.bind(this.workspace));
            item.addIconClass("fa fa-pencil");
            item.setDisabled(!this.workspace.model.isAllowed('rename'));
            items.push(item);

            item = new se.MenuItem(utils.gettext("Share"), function () {
                (new Wirecloud.ui.SharingWindowMenu(this)).show();
            }.bind(this.workspace));
            item.addIconClass("fa fa-share");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Upload to my resources"), function () {
                Wirecloud.UserInterfaceManager.views.marketplace.waitMarketListReady({
                    onComplete: function () {
                        var dialog = new Wirecloud.ui.PublishWorkspaceWindowMenu(this);
                        dialog.show();
                    }.bind(this)
                });
            }.bind(this.workspace));
            item.addIconClass("fa fa-archive");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Embed"), function () {
                (new Wirecloud.ui.EmbedCodeWindowMenu(utils.gettext("Embed Code"), this)).show();
            }.bind(this.workspace));
            item.addIconClass("fa fa-code");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Settings"), function () {
                this.showSettings();
            }.bind(this.workspace));
            item.addIconClass("fa fa-cog");
            item.setDisabled(!this.workspace.model.isAllowed('update_preferences'));
            items.push(item);

            item = new se.MenuItem(utils.gettext("Remove"), function () {
                this.remove();
            }.bind(this.workspace));
            item.addIconClass("fa fa-trash");
            item.setDisabled(!this.workspace.model.isAllowed('remove'));
            items.push(item);

            return items;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
