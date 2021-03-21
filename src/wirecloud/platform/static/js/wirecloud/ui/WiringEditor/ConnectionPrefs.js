/*
 *     Copyright (c) 2015-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    const canCustomize = function canCustomize() {
        return !this.readonly && !this.background;
    };

    const canRestore = function canRestore() {
        return !this.readonly && !this.background;
    };

    const getCustomizeTitle = function getCustomizeTitle() {
        return this.editable ? utils.gettext("Stop customizing") : utils.gettext("Customize");
    };

    /**
     * Create a new instance of class ConnectionPrefs.
     * @extends {DynamicMenuItems}
     *
     * @constructor
     * @param {Connection} connection
     *      [TODO: description]
     */
    ns.ConnectionPrefs = class ConnectionPrefs extends se.DynamicMenuItems {

        constructor(connection) {
            super();
            this.connection = connection;
        }

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
        _createMenuItem(title, iconClass, onclick, isEnabled) {
            const item = new se.MenuItem(title, onclick);
            item.addIconClass(iconClass);

            if (isEnabled != null) {
                item.enabled = isEnabled.call(this.connection);
            }

            return item;
        }

        /**
         * @override
         */
        build() {
            return [
                this._createMenuItem(getCustomizeTitle.call(this.connection), "fas fa-magic", function () {
                    this.editable = !this.editable;
                }.bind(this.connection), canCustomize),
                this._createMenuItem(utils.gettext("Restore defaults"), "fas fa-undo", function () {
                    this.restoreDefaults();
                }.bind(this.connection), canRestore)
            ];
        }

    }

})(Wirecloud.ui.WiringEditor, StyledElements, StyledElements.Utils);
