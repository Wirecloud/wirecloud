/*
 *     Copyright (c) 2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global gettext, StyledElements, Wirecloud */


(function (ns, se, utils) {

    "use strict";

    // ==================================================================================
    // CLASS DEFINITION
    // ==================================================================================

    /**
     * Create a new instance of class ComponentPrefs.
     * @extends {DynamicMenuItems}
     *
     * @constructor
     */
    ns.ComponentPrefs = utils.defineClass({

        constructor: function ComponentPrefs(component) {
            this.component = component;
        },

        inherit: se.DynamicMenuItems,

        members: {

            _createMenuItem: function _createMenuItem(title, iconClass, onclick, isEnabled){
                var item;

                item = new se.MenuItem(title, onclick);
                item.addIconClass('icon-' + iconClass);

                if (isEnabled != null) {
                    item.enabled = isEnabled.call(this);
                }

                return item;
            },

            /**
             * @override
             */
            build: function build() {
                return [
                    /* TODO: this._createMenuItem(gettext("Rename"), "pencil", function () {
                        showRenameModal.call(this);
                    }.bind(this)),*/
                    this._createMenuItem(gettext("Logs"), "tags", function () {
                        this.component.showLogs();
                    }.bind(this)),
                    this._createMenuItem(gettext("Settings"), "gear", function () {
                        this.component.showSettings();
                    }.bind(this), canShowSettings)
                ];
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var canShowSettings = function canShowSettings() {
        return this.component.hasSettings() && this.component._component.isAllowed('configure');
    };

    var showRenameModal = function showRenameModal() {
        var dialog = new Wirecloud.ui.FormWindowMenu([
                {name: 'title', label: gettext("Title"), type: 'text'},
            ],
            gettext("Rename component"),
            "component-rename-form");

        dialog.executeOperation = function (data) {
            // TODO: this.component.setTitle(data.title);
        }.bind(this);

        dialog.show();
        dialog.setValue({title: this.component.title});
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
