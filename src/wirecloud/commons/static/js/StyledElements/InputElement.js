/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    /**
     * @interface
     * @name StyledElements.InputElement
     * @extends {StyledElements.StyledElement}
     */
    se.InputElement = class InputElement extends se.StyledElement {

        constructor(defaultValue, events) {
            super(events);

            this.inputElement = null;
            this.defaultValue = defaultValue;
        }

        /**
         * Current value of this Input Element
         *
         * @since 0.6.2
         * @member {String}
         * @name StyledElements.InputElement#value
         */
        get value() {
            return this.getValue();
        }

        set value(value) {
            return this.setValue(value);
        }

        /**
         * Returns current value of this Input Element
         *
         * @since 0.5
         * @kind function
         * @name StyledElements.InputElement#getValue
         * @returns {} current value
         */
        getValue() {
            return this.inputElement.value;
        }

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
        setValue(newValue) {
            var oldValue = this.inputElement.value;

            this.inputElement.value = newValue;

            if ('change' in this.events && newValue !== oldValue) {
                this.dispatchEvent('change');
            }

            return this;
        }

        /**
         * Resets the value for this InputElement using the default value
         *
         * @since 0.5
         * @kind function
         * @name StyledElements.InputElement#reset
         */
        reset() {
            return this.setValue(this.defaultValue);
        }

        enable() {
            StyledElements.StyledElement.prototype.enable.call(this);
            this.inputElement.disabled = false;

            return this;
        }

        disable() {
            StyledElements.StyledElement.prototype.disable.call(this);
            this.inputElement.disabled = true;

            return this;
        }

        blur() {
            this.inputElement.blur();

            return this;
        }

        focus() {
            this.inputElement.focus();

            return this;
        }

    }

})(StyledElements, StyledElements.Utils);
