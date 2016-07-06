/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    /**
     * @interface
     * @name StyledElements.InputElement
     * @extends {StyledElements.StyledElement}
     */
    var InputElement = function InputElement(defaultValue, events) {
        this.inputElement = null;
        this.defaultValue = defaultValue;

        StyledElements.StyledElement.call(this, events);
    };
    utils.inherit(InputElement, StyledElements.StyledElement);

    /**
     * Current value of this Input Element
     *
     * @since 0.6.2
     * @member {String}
     * @name StyledElements.InputElement#value
     */
    Object.defineProperty(InputElement.prototype, 'value', {
        get: function () {return this.getValue();},
        set: function (value) {return this.setValue(value);}
    });

    /**
     * Returns current value of this Input Element
     *
     * @since 0.5
     * @kind function
     * @name StyledElements.InputElement#getValue
     * @returns {} current value
     */
    InputElement.prototype.getValue = function getValue() {
        return this.inputElement.value;
    };

    /**
     * Sets a new value for this InputElement
     *
     * @since 0.5
     * @kind function
     * @name StyledElements.InputElement#setValue
     * @param {} newValue - A new value
     * @returns {StyledElements.InputElement}
     *      The instance on which the method has been called
     */
    InputElement.prototype.setValue = function setValue(newValue) {
        var oldValue = this.inputElement.value;

        this.inputElement.value = newValue;

        if ('change' in this.events && newValue !== oldValue) {
            this.dispatchEvent('change');
        }

        return this;
    };

    /**
     * Resets the value for this InputElement using the default value
     *
     * @since 0.5
     * @kind function
     * @name StyledElements.InputElement#reset
     */
    InputElement.prototype.reset = function reset() {
        return this.setValue(this.defaultValue);
    };

    InputElement.prototype.enable = function enable() {
        StyledElements.StyledElement.prototype.enable.call(this);
        this.inputElement.disabled = false;

        return this;
    };

    InputElement.prototype.disable = function disable() {
        StyledElements.StyledElement.prototype.disable.call(this);
        this.inputElement.disabled = true;

        return this;
    };

    InputElement.prototype.blur = function blur() {
        this.inputElement.blur();

        return this;
    };

    InputElement.prototype.focus = function focus() {
        this.inputElement.focus();

        return this;
    };

    StyledElements.InputElement = InputElement;

})(StyledElements.Utils);
