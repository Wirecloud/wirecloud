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

/*jshint forin:true, eqnull:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser:true, indent:4, maxerr:50 */
/*global gettext, LayoutManagerFactory, StyledElements*/

var TabMenuItems = function (tab) {
    StyledElements.DynamicMenuItems.call(this);

    this.tab = tab;
};
TabMenuItems.prototype = new StyledElements.DynamicMenuItems();

TabMenuItems.prototype.build = function () {
    var items, fulldragboard_label;

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

    if (this.tab.isAllowed('remove')) {
        items.push(new StyledElements.MenuItem(
            gettext("Remove"),
            this.tab.workspace.removeTab.bind(this.tab.workspace, this.tab)
        ));
    }

    /*
    this.menu.addOption('icon-show-floating',
        gettext("Show Floating Widget"),
        function(e) {
            this.FloatingWidgetsMenu.clearOptions();
            this.getDragboard().fillFloatingWidgetsMenu(this.FloatingWidgetsMenu);
            LayoutManagerFactory.getInstance().showDropDownMenu('TabOpsSubMenu',this.FloatingWidgetsMenu, Event.pointerX(e), Event.pointerY(e));
        }.bind(this),
        4);
    */

    items.push(new StyledElements.MenuItem(
        gettext("Settings"),
        function () {
            LayoutManagerFactory.getInstance().showPreferencesWindow('tab', this.preferences);
        }.bind(this.tab)
    ));

    return items;
};
