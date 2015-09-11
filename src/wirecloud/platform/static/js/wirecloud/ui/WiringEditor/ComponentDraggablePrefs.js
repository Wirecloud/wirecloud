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
     * Create a new instance of class ComponentDraggablePrefs.
     * @extends {DynamicMenuItems}
     *
     * @constructor
     */
    ns.ComponentDraggablePrefs = utils.defineClass({

        constructor: function ComponentDraggablePrefs(component) {
            this.component = component;
        },

        inherit: se.DynamicMenuItems,

        members: {

            _createMenuItem: function _createMenuItem(title, iconClass, onclick, isEnabled){
                var item;

                item = new se.MenuItem(title, onclick);
                item.addIconClass('icon-' + iconClass);

                if (isEnabled != null) {
                    item.enabled = isEnabled.call(this.component);
                }

                return item;
            },

            /**
             * @override
             */
            build: function build() {
                var item1 = getItemCollapse.call(this.component),
                    item2 = getItemSortEndpoints.call(this.component);

                return [
                    this._createMenuItem(item1.title, item1.icon, function () {
                        this.collapsed = !this.collapsed;
                    }.bind(this.component), canCollapseEndpoints),
                    this._createMenuItem(item2.title, item2.icon, function () {
                        if (this.sortingEndpoints) {
                            this.stopSortableEndpoints();
                        } else {
                            this.startSortableEndpoints();
                        }
                    }.bind(this.component), canSortEndpoints),
                    this._createMenuItem(gettext("Logs"), "tags", function () {
                        this.showLogs();
                    }.bind(this.component)),
                    this._createMenuItem(gettext("Settings"), "gear", function () {
                        this.showSettings();
                    }.bind(this.component), canShowSettings)
                ];
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    function canCollapseEndpoints() {
        return this.hasEndpoints() && !this.background && !this.sortingEndpoints;
    }

    function canSortEndpoints() {
        return this.hasSortableEndpoints() && !this.background && !this.missing && !this.collapsed;
    }

    function canShowSettings() {
        return this.hasSettings();
    }

    function getItemCollapse() {
        if (this.collapsed) {
            return {title: gettext("Expand"), icon: "collapse-top"};
        } else {
            return {title: gettext("Collapse"), icon: "collapse"};
        }
    }

    function getItemSortEndpoints() {
        if (this.sortingEndpoints) {
            return {title: gettext("Stop ordering"), icon: "sort"};
        } else {
            return {title: gettext("Order endpoints"), icon: "sort"};
        }
    }

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
