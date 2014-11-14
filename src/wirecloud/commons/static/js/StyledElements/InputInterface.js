/*
 *     Copyright (c) 2008-2013 CoNWeT Lab., Universidad Politécnica de Madrid
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
/*global InputValidationError, StyledElements*/

(function () {

    "use strict";

    /**
     * @abstract
     */
    var InputInterface = function InputInterface(fieldId, options) {
        if (arguments.length === 0) {
            return;
        }

        StyledElements.StyledElement.call(this, []);

        options.name = fieldId;
        this._fieldId = fieldId;
        this._initialValue = options.initialValue;
        this._defaultValue = options.defaultValue;
        this._label = options.label;
        Object.defineProperty(this, 'required', {value: 'required' in options ? !!options.required : false});
        this._readOnly = !!options.readOnly;
        this._hidden = !!options.hidden;

        if (options.description) {
            this._description = options.description;
        } else {
            this._description = options.label;
        }
    };
    InputInterface.prototype = new StyledElements.StyledElement();

    InputInterface.prototype.repaint = function repaint() {
        this.inputElement.repaint();
    };

    InputInterface.prototype.getValue = function getValue() {
        return this.inputElement.getValue();
    };

    InputInterface.prototype.setValue = function setValue(newValue) {
        if (this.isValidValue(newValue)) {
            this._setValue(newValue);
        }
    };

    /**
     * Returns the label for this InputInterface.
     *
     * @returns {String}
     */
    InputInterface.prototype.getLabel = function getLabel() {
        return this._label;
    };

    /**
     * Returns the description for this InputInterface.
     *
     * @returns {String}
     */
    InputInterface.prototype.getDescription = function getDescription() {
        return this._description;
    };

    /**
     * Returns the defaultValue for this InputInterface.
     *
     * @returns {Object}
     */
    InputInterface.prototype.getDefaultValue = function getDefaultValue() {
        return this._defaultValue;
    };

    /**
     * Checks if this InputInterface is currently empty.
     *
     * @returns {Boolean}
     */
    InputInterface.prototype.isEmpty = function isEmpty() {
        return this._isEmptyValue(this.getValue());
    };

    /**
     * Checks if value is considered Empty by this InputInterface.
     * The value must be normalized before doing the check.
     *
     * @returns {Boolean}
     */
    InputInterface.prototype._isEmptyValue = function _isEmptyValue(value) {
        return value === "" || value == null;
    };

    InputInterface.prototype._normalize = function _normalize(value) {
        if (value == null) {
            return value;
        } else {
            return ("" + value).trim();
        }
    };

    /**
     * @private
     *
     * Must be implemented by child classes. This method checks that the given value
     * is valid for this <code>InputInterface</code>. Things as checking if the
     * value is empty but required is out of scope of this method.
     */
    InputInterface.prototype._checkValue = function _checkValue(newValue) {
        return InputValidationError.NO_ERROR;
    };

    /**
     * Checks if the given value is valid for this InputInterface.
     *
     */
    InputInterface.prototype.checkValue = function checkValue(newValue) {
        if (newValue === undefined) {
            newValue = this.getValue();
        } else {
            newValue = this._normalize(newValue);
        }

        if (!(this instanceof SelectInputInterface)) {
            if (this.required && this._isEmptyValue(newValue)) {
                return InputValidationError.REQUIRED_ERROR;
            }

            if (!this.required && this._isEmptyValue(newValue)) {
                return InputValidationError.NO_ERROR;
            }
        }

        return this._checkValue(newValue);
    };

    /**
     * Checks if the given value is valid for this InputInterface.
     *
     * @retuns {Boolean}
     */
    InputInterface.prototype.isValidValue = function isValidValue(newValue) {
        return this.checkValue(newValue) === InputValidationError.NO_ERROR;
    };

    /**
     * Sets the value for this interface without checking its correctness.
     *
     * @param newValue
     *
     * @see <code>InputInterface.setValue</code>
     */
    InputInterface.prototype._setValue = function _setValue(newValue) {
        if (newValue === null || newValue === undefined) {
            newValue = "";
        }

        this.inputElement.setValue(newValue);
    };

    /**
     * Sets the error status for this interface.
     *
     * @param {Boolean} error
     */
    InputInterface.prototype._setError = function _setError(error) {
        if (error) {
            this.inputElement.wrapperElement.classList.add('error');
        } else {
            this.inputElement.wrapperElement.classList.remove('error');
        }
    };

    /**
     * Resets the current interface using its default value.
     */
    InputInterface.prototype.resetToDefault = function resetToDefault() {
        this._setError(false);
        this._setValue(this._defaultValue);
    };

    /**
     * Resets the current interface using the initial value.
     */
    InputInterface.prototype.reset = function reset() {
        this._setError(false);
        this._setValue(this._initialValue);
    };

    /**
     * Sets the focus on this input interface.
     */
    InputInterface.prototype.focus = function focus() {

        this.inputElement.focus();
    };

    /**
     * Disables/enables this input interface.
     */
    InputInterface.prototype.setDisabled = function setDisabled(disable) {
        this.inputElement.setDisabled(this._readOnly || disable);
    };

    /**
     * Enables this input interface.
     */
    InputInterface.prototype.enable = function enable() {
        this.setDisabled(false);
    };

    /**
     * Disables this input interface.
     */
    InputInterface.prototype.disable = function disable() {
        this.setDisabled(true);
    };

    /**
     * Inserts this InputInterface into the given DOM Element.
     *
     * @param {Element} element
     */
    InputInterface.prototype.insertInto = function insertInto(element) {
        this.inputElement.insertInto(element);
    };

    InputInterface.prototype.assignDefaultButton = function assignDefaultButton(button) {
    };

    window.InputInterface = InputInterface;

})();
