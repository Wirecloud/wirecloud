/*
 *     Copyright (c) 2011-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global gettext, interpolate, Form, SelectInputInterface, StyledElements */
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


var ValidationErrorManager = function ValidationErrorManager() {
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
    if (errorCode !== InputValidationError.NO_ERROR) {
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
    case InputValidationError.REQUIRED_ERROR:
        msg = "The following required fields are empty: %(fields)s.";
        break;
    case InputValidationError.URL_ERROR:
        msg = "The following fields do not contain a valid URL: %(fields)s.";
        break;
    case InputValidationError.EMAIL_ERROR:
        msg = "The following fields do not contain a valid E-Mail address: %(fields)s.";
        break;
    case InputValidationError.VERSION_ERROR:
        msg = "The following field do not contain a valid version number: %(fields)s.";
        break;
    case InputValidationError.ID_ERROR:
        msg = "The following fields contain invalid characters: %(fields)s.";
        break;
    case InputValidationError.COLOR_ERROR:
        msg = "The following fields do not contain a valid color value: %(fields)s.";
        break;
    case InputValidationError.OUT_OF_RANGE_ERROR:
        msg = "The following fields does contain an out of range value: %(fields)s.";
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

/**
 *
 */
function TextInputInterface(fieldId, options) {
    if (arguments.length === 0) {
        return;
    }

    InputInterface.call(this, fieldId, options);

    this.inputElement = new StyledElements.StyledTextField(options);
}
TextInputInterface.prototype = new InputInterface();

TextInputInterface.parse = function parse(value) {
    return value;
};

TextInputInterface.stringify = function stringify(value) {
    return value;
};

TextInputInterface.prototype.assignDefaultButton = function assignDefaultButton(button) {
    this.inputElement.addEventListener('submit', function () {
        button.click();
    });
};

/**
 *
 */
function PasswordInputInterface(fieldId, options) {
    if (arguments.length === 0) {
        return;
    }

    InputInterface.call(this, fieldId, options);

    this.inputElement = new StyledElements.StyledPasswordField(options);
}
PasswordInputInterface.prototype = new InputInterface();

PasswordInputInterface.parse = TextInputInterface.parse;
PasswordInputInterface.stringify = TextInputInterface.stringify;

/**
 *
 */
function ListInputInterface(fieldId, options) {
    if (arguments.length === 0) {
        return;
    }

    InputInterface.call(this, fieldId, options);

    this.inputElement = new StyledElements.StyledList(options);
}
ListInputInterface.prototype = new InputInterface();

ListInputInterface.prototype.parse = function parse(value) {
    return JSON.parse(value);
};

ListInputInterface.prototype.stringify = function stringify(value) {
    return JSON.stringify(value);
};

ListInputInterface.prototype._setValue = function _setValue(newValue) {
    if (newValue === null || newValue === undefined) {
        newValue = [];
    }

    this.inputElement.cleanSelection();
    this.inputElement.addSelection(newValue);
};

ListInputInterface.prototype.getValue = function getValue() {
    return this.inputElement.getSelection();
};

ListInputInterface.prototype.isEmpty = function isEmpty() {
    return this.getValue().length === 0;
};

/**
 *
 */
function NumberInputInterface(fieldId, options) {
    if (arguments.length === 0) {
        return;
    }

    InputInterface.call(this, fieldId, options);

    this.inputElement = new StyledElements.StyledNumericField(options);
}
NumberInputInterface.prototype = new InputInterface();

NumberInputInterface.parse = function parse(value) {
    return Number(value);
};

NumberInputInterface.prototype._normalize = function _normalize(value) {
    return Number(value);
};

NumberInputInterface.prototype._checkValue = function _checkValue(newValue) {
    if (!Number.isFinite(newValue) || newValue < this.inputElement.options.min || newValue > this.inputElement.options.max) {
        return InputValidationError.OUT_OF_RANGE_ERROR;
    }

    return InputValidationError.NO_ERROR;
};

/**
 *
 */
function LongTextInputInterface(fieldId, options) {
    InputInterface.call(this, fieldId, options);

    this.inputElement = new StyledElements.StyledTextArea(options);
}
LongTextInputInterface.prototype = new InputInterface();

LongTextInputInterface.parse = TextInputInterface.parse;
LongTextInputInterface.stringify = TextInputInterface.stringify;

/**
 *
 */
function URLInputInterface(fieldId, options) {
    if (arguments.length === 0) {
        return;
    }

    TextInputInterface.call(this, fieldId, options);
};
URLInputInterface.prototype = new TextInputInterface();

URLInputInterface.parse = TextInputInterface.parse;
URLInputInterface.stringify = TextInputInterface.stringify;

URLInputInterface.prototype._URLChecker = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

URLInputInterface.prototype._checkValue = function _checkValue(newValue) {
    return this._URLChecker.test(newValue) ? InputValidationError.NO_ERROR : InputValidationError.URL_ERROR;
};

/**
 *
 */
function EMailInputInterface(fieldId, options) {
    TextInputInterface.call(this, fieldId, options);
}
EMailInputInterface.prototype = new TextInputInterface();

EMailInputInterface.prototype._EMailChecker = /[\w\d][\w\-]*@[\w\d\-]+\.[\w\d]+/;

EMailInputInterface.prototype._checkValue = function _checkValue(newValue) {
    return this._EMailChecker.test(newValue) ? InputValidationError.NO_ERROR : InputValidationError.EMAIL_ERROR;
};

/**
 *
 */
function BooleanInputInterface(fieldId, options) {
    InputInterface.call(this, fieldId, options);

    if (typeof options.initialValue === 'string') {
        options.initiallyChecked = options.initialValue.toLowerCase() === 'true';
    } else if (typeof options.initialValue === 'boolean') {
        options.initiallyChecked = options.initialValue;
    }
    this.inputElement = new StyledElements.StyledCheckBox(options);
}
BooleanInputInterface.prototype = new InputInterface();

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
    return (typeof newValue === 'boolean') ? InputValidationError.NO_ERROR : InputValidationError.BOOLEAN_ERROR;
};

/**
 *
 */
function SelectInputInterface(fieldId, desc) {

    if (!('required' in desc)) {
        desc.required = true;
    }

    InputInterface.call(this, fieldId, desc);

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
    this.inputElement = new StyledElements.StyledSelect(desc);
}
SelectInputInterface.prototype = new InputInterface();

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
    var value, newValueId;

    if (typeof newValue !== 'string') {
        try {
            newValueId = this.inputElement.idFunc(newValue);
        } catch (e) {
        }
    } else {
        newValueId = newValue;
    }

    if (typeof newValueId !== 'string' || !(newValueId in this.inputElement.optionValues)) {
        return InputValidationError.OUT_OF_RANGE_ERROR;
    } else {
        return InputValidationError.NO_ERROR;
    }
};


/**
 *
 */
function HiddenInputInterface(fieldId, options) {
    InputInterface.call(this, fieldId, options);

    this.inputElement = new StyledElements.StyledHiddenField(options);
}
HiddenInputInterface.prototype = new InputInterface();


/**
 *
 */
function ButtonGroupInputInterface(fieldId, fieldDesc) {
    var ButtonClass, buttonDesc, i, button, label;

    if (arguments.length === 0) {
        return;
    }

    InputInterface.call(this, fieldId, fieldDesc);

    this.inputElement = new StyledElements.ButtonsGroup(fieldId);
    this.wrapperElement = document.createElement('div');
    this.wrapperElement.className = 'button_group';

    switch (fieldDesc.kind) {
    case 'radio':
        ButtonClass = StyledElements.StyledRadioButton;
        break;
    case 'checkbox':
        ButtonClass = StyledElements.StyledCheckBox;
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
ButtonGroupInputInterface.prototype = new InputInterface();
ButtonGroupInputInterface.prototype.insertInto = function insertInto(element) {
    element.appendChild(this.wrapperElement);
};

ButtonGroupInputInterface.prototype._setValue = function _setValue(newValue) {
    this.inputElement.setValue(newValue);
};

ButtonGroupInputInterface.prototype._setError = function _setError(error) {
    // TODO
};

/**
 *
 */
function FileInputInterface(fieldId, fieldDesc) {

    InputInterface.call(this, fieldId, fieldDesc);

    this.inputElement = new StyledElements.StyledFileField(fieldDesc);
}
FileInputInterface.prototype = new InputInterface();

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

/**
 *
 */
function MultivaluedInputInterface(fieldId, fieldDesc) {
    this.entries = [];
    this.fields = fieldDesc.fields;
    this.wrapperElement = new StyledElements.Container();
    this._addEntry();
}
MultivaluedInputInterface.prototype = new InputInterface();

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

    entry.form = new Form(fields, {
        useHtmlForm: false,
        acceptButton: false,
        cancelButton: false,
        legend: false
    });
    entry.form.wrapperElement.style.display = "inline-block";
    entry.form.wrapperElement.style.verticalAlign = "middle";

    entry.form.insertInto(entry.wrapper);

    entry.addRowButton = new StyledElements.StyledButton({text: '+'});
    entry.addRowButton.addEventListener('click', function () {
        this._addEntry();
    }.bind(this));
    entry.addRowButton.insertInto(entry.wrapper);

    entry.removeRowButton = new StyledElements.StyledButton({text: '-'});
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
    var i, form, entry;

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

/**
 *
 */
var FieldSetInterface = function FieldSetInterface(fieldId, fieldDesc, factory) {
    this.form = new Form(fieldDesc.fields, {
        factory: factory,
        useHtmlForm: false,
        acceptButton: false,
        cancelButton: false,
        legend: false
    });
};
FieldSetInterface.prototype = new InputInterface();

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

/**
 *
 */
function ParametrizedTextInputInterface(fieldId, options) {
    var i, param, contextFields, option;

    InputInterface.call(this, fieldId, options);

    this.variable = options.variable;
    this.parameters = this.getAvailableParameters();

    this.wrapperElement = new StyledElements.Container({
        'class': 'parametrized_text_input'
    });

    this.resetButton = new StyledElements.StyledButton({
        'text': gettext('Use current value')
    });
    this.resetButton.addEventListener('click', function () {
        this.inputElement.setValue(this.escapeValue(this.variable.value));
    }.bind(this));
    this.wrapperElement.appendChild(this.resetButton);

    this.selectorWrapperElement = new StyledElements.Container({
        'class': 'context_selector'
    });
    this.wrapperElement.appendChild(this.selectorWrapperElement);

    this.mainSelect = document.createElement('select');
    for (i = 0; i < this.parameters.length; i += 1) {
        param = this.parameters[i];
        option = new Option(param.label, param.value);
        try {
            this.mainSelect.add(option, null);
        } catch (e) {
            this.mainSelect.add(option);
        }
    }
    this.mainSelect.addEventListener('change', this._updateSecondSelect.bind(this), true);
    this.selectorWrapperElement.appendChild(this.mainSelect);

    this.secondSelect = document.createElement('select');
    this.selectorWrapperElement.appendChild(this.secondSelect);
    this.secondSelect.addEventListener('change', this._updateDescription.bind(this), true);

    this.addButton = new StyledElements.StyledButton({
        'text': gettext('Add')
    });
    this.addButton.addEventListener('click', function () {
        var prefix, suffix, parameter, start, input;

        input = this.inputElement.inputElement;
        start = input.selectionStart;
        prefix = input.value.substr(0, start);
        suffix = input.value.substr(input.selectionEnd);
        parameter = this.mainSelect.value + '.' + this.secondSelect.value;

        this.inputElement.setValue(prefix + '%(' + parameter + ')' + suffix);
        input.selectionStart = start;
        input.selectionEnd = start + parameter.length + 3;
    }.bind(this));
    this.selectorWrapperElement.appendChild(this.addButton);

    this.descriptionDiv = document.createElement('div');
    this.descriptionDiv.className = 'description';
    this.wrapperElement.appendChild(this.descriptionDiv);

    this.inputElement = new StyledElements.StyledTextArea();
    this.wrapperElement.appendChild(this.inputElement);

    // Initialize
    this._updateSecondSelect();
}
ParametrizedTextInputInterface.prototype = new InputInterface();

ParametrizedTextInputInterface.prototype._ESCAPE_RE = new RegExp("(%+)(\\([a-zA-Z]\\w*(?:\\.[a-zA-Z]\\w*)*\\))");
ParametrizedTextInputInterface.prototype._ESCAPE_FUNC = function () {
    var str, i;

    i = arguments[1].length * 2;
    str = '';
    while ((i -= 1) >= 0) {
        str += '%';
    }

    return str + arguments[2];
};

ParametrizedTextInputInterface.prototype._CONTEXT_PARAMS = null;
ParametrizedTextInputInterface.prototype.getAvailableParameters = function getAvailableParameters() {
    var concepts, contextFields, conceptName, dashIndex, provider, concept, parameters, label;

    if (ParametrizedTextInputInterface.prototype._CONTEXT_PARAMS === null) {
        concepts = Wirecloud.activeWorkspace.contextManager._concepts;
        contextFields = {
            '': []
        };
        for (conceptName in concepts) {
            concept = concepts[conceptName];
            dashIndex = conceptName.indexOf('-');
            provider = conceptName.substring(0, dashIndex);
            if (!(provider in contextFields)) {
                contextFields[provider] = [];
            }
            label = interpolate('%(label)s (%(concept)s)', {
                label: concept._label,
                concept: conceptName
            }, true);
            contextFields[provider].push({
                label: label,
                description: concept._description,
                value: conceptName
            });
        }

        parameters = [
            {
                label: gettext('User'),
                value: 'user',
                fields: [
                    {
                        label: gettext('User Name'),
                        description: '',
                        value: 'username'
                    },
                    {
                        label: gettext('First Name'),
                        description: '',
                        value: 'first_name'
                    },
                    {
                        label: gettext('Last Name'),
                        description: '',
                        value: 'last_name'
                    }
                ]
            },
            {
                label: gettext('Context'),
                value: 'context',
                fields: contextFields['']
            }
        ];
        delete contextFields[''];
        for (conceptName in contextFields) {
            parameters.push({
                label: conceptName,
                value: 'context',
                fields: contextFields[conceptName]
            });
        }
        ParametrizedTextInputInterface.prototype._CONTEXT_PARAMS = parameters;
    }

    return ParametrizedTextInputInterface.prototype._CONTEXT_PARAMS;
};

ParametrizedTextInputInterface.prototype.escapeValue = function escapeValue(value) {
    switch (typeof value) {
    case "number":
    case "boolean":
        value = value.toString();
        break;
    default:
        if (value == null) {
            value = "";
        }
    }

    return value.replace(ParametrizedTextInputInterface.prototype._ESCAPE_RE,
        ParametrizedTextInputInterface.prototype._ESCAPE_FUNC);
};

ParametrizedTextInputInterface.prototype._updateSecondSelect = function _updateSecondSelect() {
    var fields, field, i;

    this.secondSelect.innerHTML = '';

    fields = this.parameters[this.mainSelect.selectedIndex].fields;

    for (i = 0; i < fields.length; i += 1) {
        field = fields[i];
        try {
            this.secondSelect.add(new Option(field.label, field.value), null);
        } catch (e) {
            this.secondSelect.add(new Option(field.label, field.value));
        }
    }

    this._updateDescription();
};

ParametrizedTextInputInterface.prototype._updateDescription = function _updateDescription() {
    var fields, field;

    fields = this.parameters[this.mainSelect.selectedIndex].fields;
    field = fields[this.secondSelect.selectedIndex];
    this.descriptionDiv.textContent = field.description;
};

ParametrizedTextInputInterface.prototype._setError = function _setError() {
};

ParametrizedTextInputInterface.prototype._setValue = function _setValue(newValue) {
    this.inputElement.value = newValue;
    if (this.update) {
        this.update();
    }
};

ParametrizedTextInputInterface.prototype.setDisabled = function setDisabled(disabled) {

    this.mainSelect.disabled = !!disabled;
    this.secondSelect.disabled = !!disabled;
    this.addButton.setDisabled(disabled);
    this.resetButton.setDisabled(disabled);
    this.inputElement.setDisabled(disabled);
};

ParametrizedTextInputInterface.prototype.insertInto = function insertInto(element) {
    this.wrapperElement.insertInto(element);
};
