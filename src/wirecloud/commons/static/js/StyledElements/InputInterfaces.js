/*
 *     Copyright (c) 2011-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    se.InputValidationError = {
        NO_ERROR: 0,
        REQUIRED_ERROR: 1,
        URL_ERROR: 2,
        EMAIL_ERROR: 3,
        ID_ERROR: 4,
        COLOR_ERROR: 5,
        BOOLEAN_ERROR: 6,
        VERSION_ERROR: 7,
        OUT_OF_RANGE_ERROR: 8,
        SCREEN_SIZES_ERROR: 9
    };

    se.ValidationErrorManager = class ValidationErrorManager {

        constructor() {
            this.fieldsWithErrorById = {};
        }

        _addValidationError(errorCode, fieldName) {
            if (this.fieldsWithErrorById[errorCode] === undefined) {
                this.fieldsWithErrorById[errorCode] = [];
            }

            this.fieldsWithErrorById[errorCode].push(fieldName);
        }

        validate(field) {
            const errorCode = field.checkValue();
            if (errorCode !== StyledElements.InputValidationError.NO_ERROR) {
                field._setError(true);
                this._addValidationError(errorCode, field.getLabel());
            } else {
                field._setError(false);
            }
        }

        _buildErrorMsg(errorCode) {
            let msg;

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
            case StyledElements.InputValidationError.SCREEN_SIZES_ERROR:
                msg = StyledElements.Utils.gettext("The sceen sizes are not correct. They must cover the whole range of possible screen sizes without gaps or overlaps.");
                break;
            }

            let fields = "";
            for (let i = 0; i < this.fieldsWithErrorById[errorCode].length; i += 1) {
                fields += ", " + this.fieldsWithErrorById[errorCode][i];
            }

            fields = fields.substring(2);
            return utils.interpolate(msg, {'fields': fields});
        }

        toHTML() {
            const errorMsgs = [];

            for (const errorCode in this.fieldsWithErrorById) {
                if (this.fieldsWithErrorById.hasOwnProperty(errorCode)) {
                    errorMsgs.push(this._buildErrorMsg(errorCode));
                }
            }

            return errorMsgs;
        }

    }

    /**
     *
     */
    se.PasswordInputInterface = class PasswordInputInterface extends se.InputInterface {

        constructor(fieldId, options) {
            super(fieldId, options);

            this.inputElement = new StyledElements.PasswordField(options);
        }

    };

    se.PasswordInputInterface.parse = StyledElements.TextInputInterface.parse;
    se.PasswordInputInterface.stringify = StyledElements.TextInputInterface.stringify;

    /**
     *
     */
    se.ListInputInterface = class ListInputInterface extends se.InputInterface {

        constructor(fieldId, options) {
            super(fieldId, options);

            this.inputElement = new StyledElements.List(options);
        }

        static parse(value) {
            return JSON.parse(value);
        };

        static stringify(value) {
            return JSON.stringify(value);
        };

        _normalize(value) {
            if (!Array.isArray(value)) {
                value = [];
            }
        };

        _setValue(newValue) {
            this.inputElement.cleanSelection();
            this.inputElement.addSelection(newValue);
        };

        getValue() {
            return this.inputElement.getSelection();
        };

        isEmpty() {
            return this.getValue().length === 0;
        };

    }

    /**
     *
     */
    se.NumberInputInterface = class NumberInputInterface extends se.InputInterface {

        constructor(fieldId, options) {
            super(fieldId, options);

            this.inputElement = new StyledElements.NumericField(options);
        };

        static parse(value) {
            return Number(value);
        }

        _normalize(value) {
            if (value == null) {
                return 0;
            } else {
                return Number(value);
            }
        }

        _checkValue(newValue) {
            if (!Number.isFinite(newValue) || newValue < this.inputElement.options.min || newValue > this.inputElement.options.max) {
                return StyledElements.InputValidationError.OUT_OF_RANGE_ERROR;
            }

            return StyledElements.InputValidationError.NO_ERROR;
        }

    }

    /**
     *
     */
    se.LongTextInputInterface = class LongTextInputInterface extends se.InputInterface {

        constructor(fieldId, options) {
            super(fieldId, options);

            this.inputElement = new StyledElements.TextArea(options);
            this.events.blur = this.inputElement.events.blur;
        }

    }

    se.LongTextInputInterface.prototype.parse = StyledElements.TextInputInterface.prototype.parse;
    se.LongTextInputInterface.prototype.stringify = StyledElements.TextInputInterface.prototype.stringify;

    /**
     *
     */
    se.URLInputInterface = class URLInputInterface extends se.TextInputInterface {

        constructor(fieldId, options) {
            super(fieldId, options);
            this.inputElement.type = "url";
        }

        _checkValue(newValue) {
            return this.inputElement.validationMessage !== "" ? se.InputValidationError.NO_ERROR : se.InputValidationError.URL_ERROR;
        }

    }


    /**
     *
     */
    se.EMailInputInterface = class EMailInputInterface extends se.TextInputInterface {

        constructor(fieldId, options) {
            super(fieldId, options);
            this.inputElement.type = "email";
        }

        _checkValue(newValue) {
            return this.inputElement.validationMessage !== "" ? se.InputValidationError.NO_ERROR : se.InputValidationError.EMAIL_ERROR;
        }

    };

    /**
     *
     */
    se.BooleanInputInterface = class BooleanInputInterface extends se.InputInterface {

        constructor(fieldId, options) {
            super(fieldId, options);

            if (typeof options.initialValue === 'string') {
                options.initiallyChecked = options.initialValue.toLowerCase() === 'true';
            } else if (typeof options.initialValue === 'boolean') {
                options.initiallyChecked = options.initialValue;
            }
            this.inputElement = new StyledElements.CheckBox(options);
        }

        static parse(value) {
            return ("" + value).trim().toLowerCase() === 'true';
        }

        static stringify(value) {
            return "" + value;
        }

        isEmpty() {
            return false;
        }

        _normalize(value) {
            return !!value;
        }

        _checkValue(newValue) {
            return (typeof newValue === 'boolean') ? StyledElements.InputValidationError.NO_ERROR : StyledElements.InputValidationError.BOOLEAN_ERROR;
        }

    }

    /**
     *
     */
    se.SelectInputInterface = class SelectInputInterface extends se.InputInterface {

        constructor(fieldId, desc) {
            if (!('required' in desc)) {
                desc.required = true;
            }

            super(fieldId, desc);

            if (typeof desc.entries === 'function') {
                this._update = desc.entries;
            } else if (desc.initialEntries && !this.required) {
                let i, found = false;

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
        }

        static parse(value) {
            return value;
        }

        static stringify(value) {
            return "" + value;
        }

        _setValue(newValue) {
            let entries;

            if (this._update) {
                this.inputElement.clear();
                entries = this._update();
                if (!this.required) {
                    entries = [{label: '---------', value: null}].concat(entries);
                }
                this.inputElement.addEntries(entries);
            }
            this.inputElement.setValue(newValue);
        }

        _checkValue(newValue) {
            let newValueId;

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
        }

    }

    /**
     *
     */
    se.HiddenInputInterface = class HiddenInputInterface extends se.InputInterface {

        constructor(fieldId, options) {
            super(fieldId, options);

            this.inputElement = new StyledElements.HiddenField(options);
        }

    }

    /**
     *
     */
    se.ButtonGroupInputInterface = class ButtonGroupInputInterface extends se.InputInterface {

        constructor(fieldId, fieldDesc) {
            let ButtonClass, buttonDesc, i, button, label;

            super(fieldId, fieldDesc);

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
        }

        insertInto(element) {
            element.appendChild(this.wrapperElement);
        }

        _setValue(newValue) {
            this.inputElement.setValue(newValue);
        }

        _setError(error) {
            // TODO
        }

    }

    /**
     *
     */
    se.FileInputInterface = class FileInputInterface extends se.InputInterface {

        constructor(fieldId, fieldDesc) {
            super(fieldId, fieldDesc);

            this.inputElement = new StyledElements.FileField(fieldDesc);
        };

        getValue() {
            return this.inputElement.getValue();
        };

        _setValue(newValue) {
            // TODO
        };

        _setError(error) {
            // TODO
        };

        setDisabled(disable) {
            this.inputElement.disabled = !!disable;
        };

    }

    /**
     *
     */
    se.FieldSetInterface = class FieldSetInterface extends se.InputInterface {

        constructor(fieldId, fieldDesc, factory) {
            this.form = new StyledElements.Form(fieldDesc.fields, {
                factory: factory,
                useHtmlForm: false,
                acceptButton: false,
                cancelButton: false,
                legend: false
            });
        }

        repaint() {
            return this.form.repaint();
        }

        insertInto(element) {
            this.form.insertInto(element);
        }

        getValue() {
            return this.form.getData();
        }

        _setValue(newValue) {
            return this.form.setData(newValue);
        }

        _setError(error) {
            // TODO
        }

    }

    /**
     *
     */
    se.CodeInputInterface = class CodeInputInterface extends se.InputInterface {

        constructor(fieldId, fieldDesc) {
            super(fieldId, fieldDesc);

            this.inputElement = new StyledElements.CodeArea(fieldDesc);
        }

        static parse(value) {
            return value;
        }

        static stringify(value) {
            return value;
        }

    }

})(StyledElements, StyledElements.Utils);
