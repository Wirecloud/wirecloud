/*
 *  This file is part of Wirecloud.
 *  Copyright (C) 2015  CoNWeT Lab., Universidad Politécnica de Madrid
 *
 *  Wirecloud is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  License, or (at your option) any later version.
 *
 *  Wirecloud is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.
 */

/*global StyledElements, Wirecloud */


Wirecloud.ui.WiringEditor.ComponentPreferences = (function () {

    "use strict";

    /**
     * Create a new instance of class ComponentPreferences.
     * @class
     *
     * @param {GenericInterface} component
     */
    var ComponentPreferences = function ComponentPreferences(component) {
        this.component = component;
        this.componentType = component.componentType;

        if (this.componentType === 'operator') {
            this.application = component.ioperator;
        } else {
            this.application = component.iwidget;
        }
    };

    StyledElements.Utils.inherit(ComponentPreferences, StyledElements.DynamicMenuItems);

    /**
     * @public
     * @function
     *
     * @returns {Array.<MenuItem>} The list of items which can display in that moment.
     */
    ComponentPreferences.prototype.build = function build() {
        var itemList = [];

        if (displayItemSortEndpoints.call(this)) {
            if (this.component.editingPos) {
                itemList.push(new StyledElements.MenuItem(gettext("Stop sorting"), function () {
                    this.component.wiringEditor.ChangeObjectEditing(this.component);
                }.bind(this)));

                return itemList;
            } else {
                itemList.push(new StyledElements.MenuItem(gettext("Sort endpoints"), function () {
                    this.component.wiringEditor.ChangeObjectEditing(this.component);
                }.bind(this)));
            }
        }

        itemList.push(new StyledElements.MenuItem(gettext('Logs'), function () {
            var dialog = new Wirecloud.ui.LogWindowMenu(this.component.entity.logManager);

            dialog.show();
        }.bind(this)));

        if (displayItemSettings.call(this)) {
            itemList.push(new StyledElements.MenuItem(gettext("Settings"), function () {
                var dropdownMenu;

                if (this.componentType == 'operator') {
                    dropdownMenu = new Wirecloud.ui.OperatorPreferencesWindowMenu();
                } else {
                    dropdownMenu = new Wirecloud.Widget.PreferencesWindowMenu();
                }

                dropdownMenu.show(this.application);
            }.bind(this)));
        }

        return itemList;
    };

    var displayItemSortEndpoints = function displayItemSortEndpoints() {
        return !this.component.onbackground && !this.component.collapsed && (this.component.sourceAnchors.length > 1 || this.component.targetAnchors.length > 1);
    };

    var displayItemSettings = function displayItemSettings() {
        return !this.component.onbackground && this.application.meta.preferenceList.length > 0;
    };

    return ComponentPreferences;

})();
