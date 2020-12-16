/*
 *     Copyright (c) 2014-2016 CoNWeT Lab., Universidad Politécnica de Madrid
 *     Copyright (c) 2020 Future Internet Consulting and Development Solutions S.L.
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

    ns.MACSelectionWindowMenu = class MACSelectionWindowMenu extends ns.WindowMenu {

        constructor(title, options) {
            super(title, 'mac_selection_dialog', ['select']);

            this.macsearch = new Wirecloud.ui.MACSearch({
                scope: options.scope,
                resourceButtonIconClass: 'fa fa-check',
                resourceButtonTooltip: utils.gettext('Select'),
                resourceButtonListener: function (resource) {
                    this._closeListener();
                    this.dispatchEvent('select', resource);
                }.bind(this)
            });
            this.macsearch.insertInto(this.windowContent);

            // Accept button
            this.button = new se.Button({
                text: utils.gettext('Close'),
                class: 'btn-primary'
            });
            this.button.insertInto(this.windowBottom);
            this.button.addEventListener("click", this._closeListener);
        }

        /**
         * @override
         */
        setFocus() {
            this.macsearch.focus();
        }

        /**
         * @override
         */
        show(parentWindow) {
            this.macsearch.refresh();
            super.show(parentWindow);
        }

    }

})(Wirecloud.ui, StyledElements, Wirecloud.Utils);
