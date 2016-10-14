/*
 *     Copyright (c) 2012-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (utils) {

    "use strict";

    StyledElements.ToggleButton = function ToggleButton(options) {
        var defaultOptions = {
            'initiallyChecked': false
        };
        options = utils.merge(defaultOptions, options);

        StyledElements.Button.call(this, options);

        Object.defineProperty(this, 'active', {
            get: function get() {
                return this.hasClassName('active');
            },
            set: function set(value) {
                this.toggleClassName('active', value);
            }
        });

        // Init status
        this.active = options.initiallyChecked;
    };
    utils.inherit(StyledElements.ToggleButton, StyledElements.Button);

    StyledElements.ToggleButton.prototype._clickCallback = function _clickCallback(event) {
        event.stopPropagation();
        this.click();
    };

    StyledElements.ToggleButton.prototype.click = function click() {

        if (this.enabled) {
            this.active = !this.active;
            this.dispatchEvent('click');
        }

        return this;
    };

})(StyledElements.Utils);
