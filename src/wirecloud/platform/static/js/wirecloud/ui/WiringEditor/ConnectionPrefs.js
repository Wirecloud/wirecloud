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
     * Create a new instance of class ConnectionPrefs.
     * @extends {DynamicMenuItems}
     *
     * @constructor
     * @param {Connection} connection
     *      [TODO: description]
     */
    ns.ConnectionPrefs = utils.defineClass({

        constructor: function ConnectionPrefs(connection) {
            this.connection = connection;
        },

        inherit: se.DynamicMenuItems,

        members: {

            /**
             * [TODO: _createMenuItem description]
             * @protected
             *
             * @param {String} title
             *      [TODO: description]
             * @param {String} iconClass
             *      [TODO: description]
             * @param {Function} onclick
             *      [TODO: description]
             * @param {Boolean} isEnabled
             *      [TODO: description]
             * @returns {MenuItem}
             *      [TODO: description]
             */
            _createMenuItem: function _createMenuItem(title, iconClass, onclick, isEnabled) {
                var item;

                item = new se.MenuItem(title, onclick);
                item.addIconClass('icon-' + iconClass);

                if (isEnabled != null) {
                    item.enabled = isEnabled.call(this.connection);
                }

                return item;
            },

            /**
             * @override
             */
            build: function build() {
                return [
                    this._createMenuItem(getCustomizeTitle.call(this.connection), "magic", function () {
                        this.editable = !this.editable;
                    }.bind(this.connection), canCustomize),
                    this._createMenuItem(gettext("Restore defaults"), "undo", function () {
                        this.restoreDefaults();
                    }.bind(this.connection), canRestore)
                ];
            }

        }

    });

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var canCustomize = function canCustomize() {
        /*jshint validthis:true */
        return !this.readonly && !this.background;
    };

    var canRestore = function canRestore() {
        /*jshint validthis:true */
        return !this.readonly && !this.background;
    };

    var getCustomizeTitle = function getCustomizeTitle() {
        /*jshint validthis:true */
        return this.editable ? gettext("Stop customizing") : gettext("Customize");
    };

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
