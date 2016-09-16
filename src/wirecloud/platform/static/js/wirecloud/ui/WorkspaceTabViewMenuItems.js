/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    ns.WorkspaceTabViewMenuItems = function WorkspaceTabViewMenuItems(tab) {
        se.DynamicMenuItems.call(this);

        Object.defineProperties(this, {
            tab: {
                value: tab
            }
        });
    };

    // =========================================================================
    // PUBLIC MEMBERS
    // =========================================================================

    utils.inherit(ns.WorkspaceTabViewMenuItems, se.DynamicMenuItems, {

        /**
         * @override
         */
        build: function build() {
            var item, items;

            items = [];

            item = new se.MenuItem(utils.gettext("Rename"), function () {
                (new Wirecloud.ui.RenameWindowMenu(this, utils.gettext('Rename Workspace Tab'))).show();
            }.bind(this.tab));
            item.addIconClass("fa fa-pencil");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Set as initial"), function () {
                this.setInitial();
            }.bind(this.tab));
            item.addIconClass("fa fa-home");
            item.setDisabled(this.tab.model.initial);
            items.push(item);

            item = new se.MenuItem(utils.gettext("Settings"), function () {
                this.showSettings();
            }.bind(this.tab));
            item.addIconClass("fa fa-cog");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Remove"), function () {
                this.remove();
            }.bind(this.tab));
            item.addIconClass("fa fa-trash");
            item.setDisabled(!this.tab.model.isAllowed('remove'));
            items.push(item);

            return items;
        }

    });

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
