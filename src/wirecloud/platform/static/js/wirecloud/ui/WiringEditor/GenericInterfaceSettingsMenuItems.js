/*
 *     DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS HEADER
 *
 *     Copyright (c) 2012-2013 Universidad Politécnica de Madrid
 *     Copyright (c) 2012-2013 the Center for Open Middleware
 *
 *     Licensed under the Apache License, Version 2.0 (the
 *     "License"); you may not use this file except in compliance
 *     with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing,
 *     software distributed under the License is distributed on an
 *     "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *     KIND, either express or implied.  See the License for the
 *     specific language governing permissions and limitations
 *     under the License.
 */

/*global gettext, StyledElements, Wirecloud, LayoutManagerFactory*/

(function () {

    "use strict";

    var GenericInterfaceSettingsMenuItems, clickCallback;

    GenericInterfaceSettingsMenuItems = function GenericInterfaceSettingsMenuItems(geinterface) {
        this.geinterface = geinterface;
        if (this.geinterface.ioperator) {
            this.instance = this.geinterface.ioperator;
        } else {
            this.instance = this.geinterface.iwidget;
        }
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
        item.setDisabled(this.instance.meta.preferenceList.length === 0);
        items.push(item);

        item = new StyledElements.MenuItem(gettext('Logs'), function () {
            var dialog = new Wirecloud.ui.LogWindowMenu(this.entity.logManager);
            dialog.show();
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
