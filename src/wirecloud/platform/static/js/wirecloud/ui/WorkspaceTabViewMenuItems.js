/*
 *     Copyright (c) 2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    ns.WorkspaceTabViewMenuItems = class WorkspaceTabViewMenuItems extends se.DynamicMenuItems {

        constructor(tab) {
            super();

            Object.defineProperties(this, {
                tab: {
                    value: tab
                }
            });
        }

        /**
         * @override
         */
        build() {
            const items = [];

            let item = new se.MenuItem(utils.gettext("Rename"), () => {
                (new Wirecloud.ui.RenameWindowMenu(this.tab.model, utils.gettext('Rename Workspace Tab'))).show();
            });
            item.addIconClass("fas fa-pencil-alt");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Set as initial"), function () {
                this.tab.model.setInitial();
            });
            item.addIconClass("fas fa-home");
            item.setDisabled(this.tab.model.initial);
            items.push(item);

            item = new se.MenuItem(utils.gettext("Settings"), function () {
                this.showSettings();
            }.bind(this.tab));
            item.addIconClass("fas fa-cog");
            items.push(item);

            item = new se.MenuItem(utils.gettext("Remove"), () => {
                if (this.tab.widgets.length) {
                    const dialog = new Wirecloud.ui.AlertWindowMenu(utils.gettext("The tab's widgets will also be removed. Would you like to continue?"));
                    dialog.setHandler(() => {
                        this.tab.model.remove();
                    }).show();
                } else {
                    this.tab.model.remove();
                }
            });
            item.addIconClass("fas fa-trash");
            item.setDisabled(!this.tab.model.isAllowed('remove'));
            items.push(item);

            return items;
        }

    }

})(Wirecloud.ui, StyledElements, StyledElements.Utils);
