/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* globals StyledElements */


(function (se, utils) {

    "use strict";

    const defaultOptions = {
        initiallyChecked: false
    };
    Object.freeze(defaultOptions);

    se.ToggleButton = class ToggleButton extends se.Button {

        constructor(options) {
            options = utils.merge({}, defaultOptions, options);

            super(options);
            this.events.active = new StyledElements.Event(this);

            // Init status
            this.active = options.initiallyChecked;
        }

        get active() {
            return this.hasClassName('active');
        }

        set active(value) {
            // Convert value to boolean, just in case
            value = !!value;
            let current = this.hasClassName('active');
            if (current !== value) {
                this.toggleClassName('active', value);
                this.dispatchEvent('active', value);
            }
        }

        _clickCallback(event) {
            event.stopPropagation();
            this.click();
        }

        click() {

            if (this.enabled) {
                this.active = !this.active;
                this.dispatchEvent('click');
            }

            return this;
        }
    }

})(StyledElements, StyledElements.Utils);
