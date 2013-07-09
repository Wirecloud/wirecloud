/*
 *     Copyright (c) 2013 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2013 Center for Open Middleware
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

/*global Constants, gettext, LogManagerFactory, StyledElements, Wirecloud, LayoutManagerFactory*/

(function () {

    "use strict";

    var GenericInterfaceSettingsMenuItems, clickCallback;

    GenericInterfaceSettingsMenuItems = function GenericInterfaceSettingsMenuItems(geinterface) {
        this.geinterface = geinterface;
    };
    GenericInterfaceSettingsMenuItems.prototype = new StyledElements.DynamicMenuItems();

    GenericInterfaceSettingsMenuItems.prototype.build = function build(context) {
        var label;
        var item, items = [];

        item = new StyledElements.MenuItem(gettext('Reorder endpoints'), function () {
                this.wiringEditor.ChangeObjectEditing(this);
        }.bind(this.geinterface));
        item.setDisabled(this.geinterface.sourceAnchors.length <= 1 && this.geinterface.targetAnchors.length <= 1);
        items.push(item);

        item = new StyledElements.MenuItem(gettext('Settings'), function () {
            var window_menu;
            if (this.ioperator) {
                window_menu = new Wirecloud.ui.OperatorPreferencesWindowMenu();
                window_menu.show(this.ioperator);
            } else {
                window_menu = new Wirecloud.Widget.PreferencesWindowMenu();
                window_menu.show(this.iwidget);
            }
        }.bind(this.geinterface));
        items.push(item);

        if (this.geinterface.ioperator) {
            label = 'Minimize';
            items.push(new StyledElements.MenuItem(gettext(label), function () {
                var interval;

                if (this.isMinimized) {
                    this.restore();
                } else {
                    this.minimize();
                }
            }.bind(this.geinterface)));
        }

        return items;
    };

    Wirecloud.ui.WiringEditor.GenericInterfaceSettingsMenuItems = GenericInterfaceSettingsMenuItems;
})();
