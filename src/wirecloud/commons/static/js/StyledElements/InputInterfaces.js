/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function () {

    "use strict";

    var ValidationErrorManager, InputValidationError = {};
    InputValidationError.NO_ERROR           = 0;
    InputValidationError.REQUIRED_ERROR     = 1;
    InputValidationError.URL_ERROR          = 2;
    InputValidationError.EMAIL_ERROR        = 3;
    InputValidationError.ID_ERROR           = 4;
    InputValidationError.COLOR_ERROR        = 5;
    InputValidationError.BOOLEAN_ERROR      = 6;
    InputValidationError.VERSION_ERROR      = 7;
    InputValidationError.OUT_OF_RANGE_ERROR = 8;
    StyledElements.InputValidationError = InputValidationError;


    ValidationErrorManager = function ValidationErrorManager() {
        this.fieldsWithErrorById = {};
    };

    ValidationErrorManager.prototype._addValidationError = function _addValidationError(errorCode, fieldName) {
        if (this.fieldsWithErrorById[errorCode] === undefined) {
            this.fieldsWithErrorById[errorCode] = [];
        }

        this.fieldsWithErrorById[errorCode].push(fieldName);
    };

    ValidationErrorManager.prototype.validate = function validate(field) {
        var errorCode = field.checkValue();
        if (errorCode !== StyledElements.InputValidationError.NO_ERROR) {
            field._setError(true);
            this._addValidationError(errorCode, field.getLabel());
        } else {
            field._setError(false);
        }
    };

    ValidationErrorManager.prototype._buildErrorMsg = function _buildErrorMsg(errorCode) {
        var msg, fields, i;

        errorCode = parseInt(errorCode, 10);
        switch (errorCode) {
        case StyledElements.InputValidationError.REQUIRED_ERROR:
            msg = StyledElements.Utils.gettext("The following required fields are empty: %(fields)s.");
            break;
        case StyledElements.InputValidationError.URL_ERROR:
            msg = StyledElements.Utils.gettext("The following fields do not contain a valid URL: %(fields)s.");
            break;
        case StyledElements.InputValidationError.EMAIL_ERROR:
            msg = StyledElements.Utils.gettext("The following fields do not contain a valid E-Mail address: %(fields)s.");
            break;
        case StyledElements.InputValidationError.VERSION_ERROR:
            msg = StyledElements.Utils.gettext("The following field do not contain a valid version number: %(fields)s.");
            break;
        case StyledElements.InputValidationError.ID_ERROR:
            msg = StyledElements.Utils.gettext("The following fields contain invalid characters: %(fields)s.");
            break;
        case StyledElements.InputValidationError.COLOR_ERROR:
            msg = StyledElements.Utils.gettext("The following fields do not contain a valid color value: %(fields)s.");
            break;
        case StyledElements.InputValidationError.OUT_OF_RANGE_ERROR:
            msg = StyledElements.Utils.gettext("The following fields does contain an out of range value: %(fields)s.");
            break;
        }

        fields = "";
        for (i = 0; i < this.fieldsWithErrorById[errorCode].length; i += 1) {
            fields += ", " + this.fieldsWithErrorById[errorCode][i];
        }

        fields = fields.substring(2);
        return StyledElements.Utils.interpolate(msg, {'fields': fields});
    };

    ValidationErrorManager.prototype.toHTML = function toHTML() {
        var errorCode, errorMsgs = [];

        for (errorCode in this.fieldsWithErrorById) {
            if (this.fieldsWithErrorById.hasOwnProperty(errorCode)) {
                errorMsgs.push(this._buildErrorMsg(errorCode));
            }
        }

        return errorMsgs;
    };
    StyledElements.ValidationErrorManager = ValidationErrorManager;

    /**
     *
     */
    var PasswordInputInterface = function PasswordInputInterface(fieldId, options) {
        if (arguments.length === 0) {
            return;
        }

        StyledElements.InputInterface.call(this, fieldId, options);

        this.inputElement = new StyledElements.PasswordField(options);
    };
    PasswordInputInterface.prototype = new StyledElements.InputInterface();

    PasswordInputInterface.parse = StyledElements.TextInputInterface.parse;
    PasswordInputInterface.stringify = StyledElements.TextInputInterface.stringify;

    StyledElements.PasswordInputInterface = PasswordInputInterface;

    /**
     *
     */
    var ListInputInterface = function ListInputInterface(fieldId, options) {
        if (arguments.length === 0) {
            return;
        }

        StyledElements.InputInterface.call(this, fieldId, options);

        this.inputElement = new StyledElements.List(options);
    };
    ListInputInterface.prototype = new StyledElements.InputInterface();

    ListInputInterface.prototype.parse = function parse(value) {
        return JSON.parse(value);
    };

    ListInputInterface.prototype.stringify = function stringify(value) {
        return JSON.stringify(value);
    };

    ListInputInterface.prototype._normalize = function _normalize(value) {
        if (!Array.isArray(value)) {
            value = [];
        }
    };

    ListInputInterface.prototype._setValue = function _setValue(newValue) {
        this.inputElement.cleanSelection();
        this.inputElement.addSelection(newValue);
    };

    ListInputInterface.prototype.getValue = function getValue() {
        return this.inputElement.getSelection();
    };

    ListInputInterface.prototype.isEmpty = function isEmpty() {
        return this.getValue().length === 0;
    };
    StyledElements.ListInputInterface = ListInputInterface;

    /**
     *
     */
    var NumberInputInterface = function NumberInputInterface(fieldId, options) {
        if (arguments.length === 0) {
            return;
        }

        StyledElements.InputInterface.call(this, fieldId, options);

        this.inputElement = new StyledElements.NumericField(options);
    };
    NumberInputInterface.prototype = new StyledElements.InputInterface();

    NumberInputInterface.parse = function parse(value) {
        return Number(value);
    };

    NumberInputInterface.prototype._normalize = function _normalize(value) {
        if (value == null) {
            return 0;
        } else {
            return Number(value);
        }
    };

    NumberInputInterface.prototype._checkValue = function _checkValue(newValue) {
        if (!Number.isFinite(newValue) || newValue < this.inputElement.options.min || newValue > this.inputElement.options.max) {
            return StyledElements.InputValidationError.OUT_OF_RANGE_ERROR;
        }

        return StyledElements.InputValidationError.NO_ERROR;
    };

    StyledElements.NumberInputInterface = NumberInputInterface;

    /**
     *
     */
    var LongTextInputInterface = function LongTextInputInterface(fieldId, options) {
        StyledElements.InputInterface.call(this, fieldId, options);

        this.inputElement = new StyledElements.TextArea(options);
        this.events.blur = this.inputElement.events.blur;
    };
    LongTextInputInterface.prototype = new StyledElements.InputInterface();

    LongTextInputInterface.parse = StyledElements.TextInputInterface.parse;
    LongTextInputInterface.stringify = StyledElements.TextInputInterface.stringify;

    StyledElements.LongTextInputInterface = LongTextInputInterface;

    /**
     *
     */
    var URLInputInterface = function URLInputInterface(fieldId, options) {
        if (arguments.length === 0) {
            return;
        }

        StyledElements.TextInputInterface.call(this, fieldId, options);
    };
    URLInputInterface.prototype = new StyledElements.TextInputInterface();

    URLInputInterface.parse = StyledElements.TextInputInterface.parse;
    URLInputInterface.stringify = StyledElements.TextInputInterface.stringify;

    URLInputInterface.prototype._URLChecker = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

    URLInputInterface.prototype._checkValue = function _checkValue(newValue) {
        return this._URLChecker.test(newValue) ? StyledElements.InputValidationError.NO_ERROR : StyledElements.InputValidationError.URL_ERROR;
    };

    StyledElements.URLInputInterface = URLInputInterface;

    /**
     *
     */
    var EMailInputInterface = function EMailInputInterface(fieldId, options) {
        StyledElements.TextInputInterface.call(this, fieldId, options);
    };
    EMailInputInterface.prototype = new StyledElements.TextInputInterface();

    EMailInputInterface.prototype._EMailChecker = /^[\w\d._%+-]+@[\w\d.\-]+\.[\w]{2,4}$/;

    EMailInputInterface.prototype._checkValue = function _checkValue(newValue) {
        return this._EMailChecker.test(newValue) ? StyledElements.InputValidationError.NO_ERROR : StyledElements.InputValidationError.EMAIL_ERROR;
    };

    StyledElements.EMailInputInterface = EMailInputInterface;

    /**
     *
     */
    var BooleanInputInterface = function BooleanInputInterface(fieldId, options) {
        StyledElements.InputInterface.call(this, fieldId, options);

        if (typeof options.initialValue === 'string') {
            options.initiallyChecked = options.initialValue.toLowerCase() === 'true';
        } else if (typeof options.initialValue === 'boolean') {
            options.initiallyChecked = options.initialValue;
        }
        this.inputElement = new StyledElements.CheckBox(options);
    };
    BooleanInputInterface.prototype = new StyledElements.InputInterface();

    BooleanInputInterface.parse = function parse(value) {
        return ("" + value).trim().toLowerCase() === 'true';
    };

    BooleanInputInterface.stringify = function stringify(value) {
        return "" + value;
    };

    BooleanInputInterface.prototype.isEmpty = function isEmpty() {
        return false;
    };

    BooleanInputInterface.prototype._normalize = function _normalize(value) {
        return !!value;
    };

    BooleanInputInterface.prototype._checkValue = function _checkValue(newValue) {
        return (typeof newValue === 'boolean') ? StyledElements.InputValidationError.NO_ERROR : StyledElements.InputValidationError.BOOLEAN_ERROR;
    };

    StyledElements.BooleanInputInterface = BooleanInputInterface;

    /**
     *
     */
    var SelectInputInterface = function SelectInputInterface(fieldId, desc) {

        if (!('required' in desc)) {
            desc.required = true;
        }

        StyledElements.InputInterface.call(this, fieldId, desc);

        if (typeof desc.entries === 'function') {
            this._update = desc.entries;
        } else if (desc.initialEntries && !this.required) {
            var i, found = false;

            for (i = 0; i < desc.initialEntries.length; i += 1) {
                if (this._isEmptyValue(desc.initialEntries[i].value)) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                desc.initialEntries = [{label: '---------', value: null}].concat(desc.initialEntries);
            }
        }
        this.inputElement = new StyledElements.Select(desc);
    };
    SelectInputInterface.prototype = new StyledElements.InputInterface();

    SelectInputInterface.parse = function parse(value) {
        return value;
    };

    SelectInputInterface.stringify = function stringify(value) {
        return "" + value;
    };

    SelectInputInterface.prototype._setValue = function _setValue(newValue) {
        var entries;

        if (this._update) {
            this.inputElement.clear();
            entries = this._update();
            if (!this.required) {
                entries = [{label: '---------', value: null}].concat(entries);
            }
            this.inputElement.addEntries(entries);
        }
        this.inputElement.setValue(newValue);
    };

    SelectInputInterface.prototype._checkValue = function _checkValue(newValue) {
        var newValueId;

        if (typeof newValue !== 'string') {
            try {
                newValueId = this.inputElement.idFunc(newValue);
            } catch (e) {
            }
        } else {
            newValueId = newValue;
        }

        if (typeof newValueId !== 'string' || !(newValueId in this.inputElement.optionValues)) {
            return StyledElements.InputValidationError.OUT_OF_RANGE_ERROR;
        } else {
            return StyledElements.InputValidationError.NO_ERROR;
        }
    };

    StyledElements.SelectInputInterface = SelectInputInterface;

    /**
     *
     */
    var HiddenInputInterface = function HiddenInputInterface(fieldId, options) {
        StyledElements.InputInterface.call(this, fieldId, options);

        this.inputElement = new StyledElements.StyledHiddenField(options);
    };
    HiddenInputInterface.prototype = new StyledElements.InputInterface();

    StyledElements.HiddenInputInterface = HiddenInputInterface;

    /**
     *
     */
    var ButtonGroupInputInterface = function ButtonGroupInputInterface(fieldId, fieldDesc) {
        var ButtonClass, buttonDesc, i, button, label;

        if (arguments.length === 0) {
            return;
        }

        StyledElements.InputInterface.call(this, fieldId, fieldDesc);

        this.inputElement = new StyledElements.ButtonsGroup(fieldId);
        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = 'button_group';

        switch (fieldDesc.kind) {
        case 'radio':
            ButtonClass = StyledElements.RadioButton;
            break;
        case 'checkbox':
            ButtonClass = StyledElements.CheckBox;
            break;
        default:
            throw new Error();
        }

        for (i = 0; i < fieldDesc.buttons.length; i += 1) {
            buttonDesc = fieldDesc.buttons[i];

            label = document.createElement('label');
            label.className = fieldDesc.kind;
            button = new ButtonClass({group: this.inputElement, value: buttonDesc.value, secondInput: buttonDesc.secondInput});
            button.insertInto(label);
            label.appendChild(document.createTextNode(buttonDesc.label));
            if (buttonDesc.secondInput) {
                buttonDesc.secondInput.insertInto(label);
            }
            this.wrapperElement.appendChild(label);
        }

        if ('initialValue' in fieldDesc) {
            this.inputElement.setValue(fieldDesc.initialValue);
        }
    };
    ButtonGroupInputInterface.prototype = new StyledElements.InputInterface();
    ButtonGroupInputInterface.prototype.insertInto = function insertInto(element) {
        element.appendChild(this.wrapperElement);
    };

    ButtonGroupInputInterface.prototype._setValue = function _setValue(newValue) {
        this.inputElement.setValue(newValue);
    };

    ButtonGroupInputInterface.prototype._setError = function _setError(error) {
        // TODO
    };

    StyledElements.ButtonGroupInputInterface = ButtonGroupInputInterface;

    /**
     *
     */
    var FileInputInterface = function FileInputInterface(fieldId, fieldDesc) {

        StyledElements.InputInterface.call(this, fieldId, fieldDesc);

        this.inputElement = new StyledElements.FileField(fieldDesc);
    };
    FileInputInterface.prototype = new StyledElements.InputInterface();

    FileInputInterface.prototype.getValue = function getValue() {
        return this.inputElement.getValue();
    };

    FileInputInterface.prototype._setValue = function _setValue(newValue) {
        // TODO
    };

    FileInputInterface.prototype._setError = function _setError(error) {
        // TODO
    };

    FileInputInterface.prototype.setDisabled = function setDisabled(disable) {
        this.inputElement.disabled = !!disable;
    };

    StyledElements.FileInputInterface = FileInputInterface;

    /**
     *
     */
    var MultivaluedInputInterface = function MultivaluedInputInterface(fieldId, fieldDesc) {
        this.entries = [];
        this.fields = fieldDesc.fields;
        this.wrapperElement = new StyledElements.Container();
        this._addEntry();
    };
    MultivaluedInputInterface.prototype = new StyledElements.InputInterface();

    MultivaluedInputInterface.prototype._addEntry = function _addEntry() {
        var entry, fields;

        entry = {};
        entry.wrapper = document.createElement('div');

        fields = {
            '': {
                type: 'lineLayout',
                fields: this.fields
            }
        };

        entry.form = new StyledElements.Form(fields, {
            useHtmlForm: false,
            acceptButton: false,
            cancelButton: false,
            legend: false
        });
        entry.form.wrapperElement.style.display = "inline-block";
        entry.form.wrapperElement.style.verticalAlign = "middle";

        entry.form.insertInto(entry.wrapper);

        entry.addRowButton = new StyledElements.Button({text: '+'});
        entry.addRowButton.addEventListener('click', function () {
            this._addEntry();
        }.bind(this));
        entry.addRowButton.insertInto(entry.wrapper);

        entry.removeRowButton = new StyledElements.Button({text: '-'});
        entry.removeRowButton.addEventListener('click', function () {
            this.control._removeEntry(entry);
        }.bind({control: this, entry: entry}));
        entry.removeRowButton.insertInto(entry.wrapper);

        this.entries.push(entry);
        this.wrapperElement.appendChild(entry.wrapper);

        return entry;
    };

    MultivaluedInputInterface.prototype._removeEntry = function _removeEntry(entry) {
        var index;

        this.wrapperElement.removeChild(entry.wrapper);
        index = this.entries.indexOf(entry);
        this.entries.splice(index, 1);
        entry.form.destroy();

        if (this.entries.length === 0) {
            this._addEntry();
        }
    };

    MultivaluedInputInterface.prototype._removeAllEntries = function _removeAllEntries() {
        var i, entry;
        for (i = 0; i < this.entries.length; i += 1) {
            entry = this.entries[i];
            this.wrapperElement.removeChild(entry.wrapper);
            entry.form.destroy();
        }
        this.entries = [];
    };

    MultivaluedInputInterface.prototype.getValue = function getValue() {
        var i, data = [];

        for (i = 0; i < this.entries.length; i += 1) {
            data.push(this.entries[i].form.getData());
        }

        return data;
    };

    MultivaluedInputInterface.prototype._setValue = function _setValue(newValue) {
        var i, entry;

        this._removeAllEntries();

        if (!(newValue instanceof Array)) {
            newValue = [];
        }

        for (i = 0; i < newValue.length; i += 1) {
            entry = this._addEntry();
            entry.form.setData(newValue[i]);
        }

        if (this.entries.length === 0) {
            this._addEntry();
        }
    };

    MultivaluedInputInterface.prototype._setError = function _setError(error) {
        // TODO
    };

    StyledElements.MultivaluedInputInterface = MultivaluedInputInterface;

    /**
     *
     */
    var FieldSetInterface = function FieldSetInterface(fieldId, fieldDesc, factory) {
        this.form = new StyledElements.Form(fieldDesc.fields, {
            factory: factory,
            useHtmlForm: false,
            acceptButton: false,
            cancelButton: false,
            legend: false
        });
    };
    FieldSetInterface.prototype = new StyledElements.InputInterface();

    FieldSetInterface.prototype.repaint = function repaint() {
        return this.form.repaint();
    };

    FieldSetInterface.prototype.insertInto = function insertInto(element) {
        this.form.insertInto(element);
    };

    FieldSetInterface.prototype.getValue = function getValue() {
        return this.form.getData();
    };

    FieldSetInterface.prototype._setValue = function _setValue(newValue) {
        return this.form.setData(newValue);
    };

    FieldSetInterface.prototype._setError = function _setError(error) {
        // TODO
    };

    StyledElements.FieldSetInterface = FieldSetInterface;

})();
