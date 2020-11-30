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

    se.InputInterface = class InputInterface extends se.StyledElement {

        /**
         * @constructor
         * @name StyledElements.InputInterface
         * @interface
         */
        constructor(fieldId, options) {

            super([]);

            options.name = fieldId;
            this._fieldId = fieldId;
            this._initialValue = options.initialValue;
            this._defaultValue = options.defaultValue;
            this._label = options.label;
            Object.defineProperties(this, {
                id: {
                    value: fieldId
                },
                required: {
                    value: 'required' in options ? !!options.required : false
                }
            });
            this._readOnly = !!options.readOnly;
            this._hidden = !!options.hidden;

            if (options.description) {
                this._description = options.description;
            } else {
                this._description = options.label;
            }
        }

        repaint() {
            this.inputElement.repaint();
        }

        getValue() {
            return this.inputElement.getValue();
        }

        setValue(newValue) {
            if (this.isValidValue(newValue)) {
                this._setValue(newValue);
            }
        }

        /**
         * Returns the label for this InputInterface.
         *
         * @returns {String}
         */
        getLabel() {
            return this._label;
        }

        /**
         * Returns the description for this InputInterface.
         *
         * @returns {String}
         */
        getDescription() {
            return this._description;
        }

        /**
         * Returns the defaultValue for this InputInterface.
         *
         * @returns {Object}
         */
        getDefaultValue() {
            return this._defaultValue;
        }

        /**
         * Checks if this InputInterface is currently empty.
         *
         * @returns {Boolean}
         */
        isEmpty() {
            return this._isEmptyValue(this.getValue());
        }

        /**
         * Checks if value is considered Empty by this InputInterface.
         * The value must be normalized before doing the check.
         *
         * @returns {Boolean}
         */
        _isEmptyValue(value) {
            return value === "" || value == null;
        }

        _normalize(value) {
            if (value == null) {
                return "";
            } else {
                return ("" + value).trim();
            }
        }

        /**
         * @private
         *
         * Must be implemented by child classes. This method checks that the given value
         * is valid for this <code>InputInterface</code>. Things as checking if the
         * value is empty but required is out of scope of this method.
         */
        _checkValue(newValue) {
            return StyledElements.InputValidationError.NO_ERROR;
        }

        /**
         * Checks if the given value is valid for this InputInterface.
         *
         */
        checkValue(newValue) {
            if (newValue === undefined) {
                newValue = this.getValue();
            } else {
                newValue = this._normalize(newValue);
            }

            if (!(this instanceof StyledElements.SelectInputInterface)) {
                if (this.required && this._isEmptyValue(newValue)) {
                    return StyledElements.InputValidationError.REQUIRED_ERROR;
                }

                if (!this.required && this._isEmptyValue(newValue)) {
                    return StyledElements.InputValidationError.NO_ERROR;
                }
            }

            return this._checkValue(newValue);
        }

        validate() {
            if (this.timeout != null) {
                clearTimeout(this.timeout);
            }

            var errorCode = this.checkValue();
            this._setError(errorCode !== StyledElements.InputValidationError.NO_ERROR);
        }

        /**
         * Checks if the given value is valid for this InputInterface.
         *
         * @retuns {Boolean}
         */
        isValidValue(newValue) {
            return this.checkValue(newValue) === StyledElements.InputValidationError.NO_ERROR;
        }

        /**
         * Sets the value for this interface without checking its correctness.
         *
         * @param newValue
         *
         * @see <code>InputInterface.setValue</code>
         */
        _setValue(newValue) {
            newValue = this._normalize(newValue);

            this.inputElement.setValue(newValue);
        }

        /**
         * Sets the error status for this interface.
         *
         * @param {Boolean} error
         */
        _setError(error) {
            if (error) {
                this.inputElement.wrapperElement.classList.add('error');
            } else {
                this.inputElement.wrapperElement.classList.remove('error');
            }
        }

        /**
         * Resets the current interface using its default value.
         */
        resetToDefault() {
            this._setError(false);
            this._setValue(this._defaultValue);
        }

        /**
         * Resets the current interface using the initial value.
         */
        reset() {
            this._setError(false);
            this._setValue(this._initialValue);
        }

        /**
         * Sets the focus on this input interface.
         */
        focus() {

            this.inputElement.focus();
        }

        /**
         * Disables/enables this input interface.
         */
        setDisabled(disable) {
            this.inputElement.setDisabled(this._readOnly || disable);
        }

        /**
         * Enables this input interface.
         */
        enable() {
            this.setDisabled(false);
        }

        /**
         * Disables this input interface.
         */
        disable() {
            this.setDisabled(true);
        }

        /**
         * Inserts this InputInterface into the given DOM Element.
         *
         * @param {Element} element
         */
        insertInto(element) {
            this.inputElement.insertInto(element);
        }

        assignDefaultButton(button) {
        }

    }

})(StyledElements, StyledElements.Utils);
