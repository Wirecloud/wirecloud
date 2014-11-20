/*
 *     Copyright (c) 2008-2014 CoNWeT Lab., Universidad Politécnica de Madrid
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

/* global StyledElements */

(function () {

    "use strict";

    /**
     * @abstract
     *
     */
    var StyledInputElement = function StyledInputElement(defaultValue, events) {
        this.inputElement = null;
        this.defaultValue = defaultValue;

        StyledElements.StyledElement.call(this, events);
    };
    StyledInputElement.prototype = new StyledElements.StyledElement();

    StyledInputElement.prototype.getValue = function getValue() {
        return this.inputElement.value;
    };

    StyledInputElement.prototype.setValue = function setValue(newValue) {
        this.inputElement.value = newValue;

        return this;
    };

    StyledInputElement.prototype.reset = function reset() {
        return this.setValue(this.defaultValue);
    };

    StyledInputElement.prototype.enable = function enable() {
        StyledElements.StyledElement.prototype.enable.call(this);
        this.inputElement.disabled = false;

        return this;
    };

    StyledInputElement.prototype.disable = function disable() {
        StyledElements.StyledElement.prototype.disable.call(this);
        this.inputElement.disabled = true;

        return this;
    };

    StyledInputElement.prototype.focus = function focus() {
        this.inputElement.focus();

        return this;
    };

    StyledElements.StyledInputElement = StyledInputElement;

})();
