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

/*global gettext, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var onTabRemove = function onTabRemove(tab) {
        if (tab.getIWidgets().length !== 0) {
            var msg = gettext('Do you really want to delete the tab "%(tabName)s"?');
            msg = Wirecloud.Utils.interpolate(msg, {tabName: tab.getName()});
            var dialog = new Wirecloud.ui.AlertWindowMenu();
            dialog.setMsg(new StyledElements.Fragment(msg));
            dialog.setHandler(tab.workspace.removeTab.bind(tab.workspace, tab));
            dialog.show();
        } else {
            tab.workspace.removeTab(tab);
        }
    };

    var TabMenuItems = function TabMenuItems(tab) {
        StyledElements.DynamicMenuItems.call(this);

        this.tab = tab;
    };
    TabMenuItems.prototype = new StyledElements.DynamicMenuItems();

    TabMenuItems.prototype.build = function build() {
        var items, item;

        items = [];

        items.push(new StyledElements.MenuItem(
            gettext("Rename"),
            function () {
                (new Wirecloud.ui.RenameWindowMenu(this, 'updateInfo')).show();
            }.bind(this.tab)
        ));

        if (!this.tab.tabInfo.visible) {
            items.push(new StyledElements.MenuItem(
                gettext("Mark as Visible"),
                this.tab.markAsVisible.bind(this.tab)
            ));
        }

        item = new StyledElements.MenuItem(
            gettext("Remove"),
            onTabRemove.bind(null, this.tab)
        );
        items.push(item);
        item.setDisabled(!this.tab.isAllowed('remove'));

        items.push(new StyledElements.MenuItem(
            gettext("Settings"),
            function () {
                this.getPreferencesWindow().show();
            }.bind(this.tab)
        ));

        return items;
    };

    window.TabMenuItems = TabMenuItems;

})();
