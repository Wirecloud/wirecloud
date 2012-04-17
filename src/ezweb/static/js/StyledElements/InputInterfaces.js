/*jslint white: true, onevar: true, undef: true, nomen: true, eqeqeq: true, plusplus: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true, nomen: false  */
/*global $, window, document, EzWebExt, SelectInputInterface, StyledElements, jQuery, Form */
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


function ValidationErrorManager() {
    this.fieldsWithErrorById = {};
}

ValidationErrorManager.prototype._addValidationError = function (errorCode, fieldName) {
    if (this.fieldsWithErrorById[errorCode] === undefined) {
        this.fieldsWithErrorById[errorCode] = [];
    }

    this.fieldsWithErrorById[errorCode].push(fieldName);
};

ValidationErrorManager.prototype.validate = function (field) {
    var errorCode = field.checkValue();
    if (errorCode !== InputValidationError.NO_ERROR) {
        field._setError(true);
        this._addValidationError(errorCode, field.getLabel());
    } else {
        field._setError(false);
    }
};

ValidationErrorManager.prototype._buildErrorMsg = function (errorCode) {
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
    return EzWebExt.interpolate(msg, {'fields': fields});
};

ValidationErrorManager.prototype.toHTML = function () {
    var errorCode, errorMsgs = [];

    for (errorCode in this.fieldsWithErrorById) {
        if (this.fieldsWithErrorById.hasOwnProperty(errorCode)) {
            errorMsgs.push(this._buildErrorMsg(errorCode));
        }
    }

    return errorMsgs;
};


/**
 * @abstract
 */
function InputInterface(fieldId, options) {
    if (arguments.length === 0) {
        return;
    }

    options.name = fieldId;
    this._fieldId = fieldId;
    this._initialValue = options.initialValue;
    this._defaultValue = options.defaultValue;
    this._label = options.label;
    this._required = options.required ? options.required : false;
    this._readOnly = !!options.readOnly;
    this._hidden = !!options.hidden;

    if (options.description) {
        this._description = options.description;
    } else {
        this._description = options.label;
    }
}

InputInterface.prototype.getValue = function () {
    return this.inputElement.getValue();
};

InputInterface.prototype.setValue = function (newValue) {
    if (this.isValidValue(newValue)) {
        this._setValue(newValue);
    }
};

/**
 * Returns the label for this InputInterface.
 *
 * @returns {String}
 */
InputInterface.prototype.getLabel = function () {
    return this._label;
};

/**
 * Returns the description for this InputInterface.
 *
 * @returns {String}
 */
InputInterface.prototype.getDescription = function () {
    return this._description;
};

/**
 * Returns the defaultValue for this InputInterface.
 *
 * @returns {Object}
 */
InputInterface.prototype.getDefaultValue = function () {
    return this._defaultValue;
};

/**
 * Checks if this InputInterface is currently empty.
 *
 * @returns {Boolean}
 */
InputInterface.prototype.isEmpty = function () {
    return this._isEmptyValue(this.getValue());
};

/**
 * Checks if value is considered Empty by this InputInterface.
 * The value must be normalized before doing the check.
 *
 * @returns {Boolean}
 */
InputInterface.prototype._isEmptyValue = function (value) {
    return value === "" || value == null;
};

InputInterface.prototype._normalize = function (value) {
    if (value == null) {
        return value;
    } else {
        return ("" + value).strip();
    }
};

/**
 * @private
 *
 * Must be implemented by child classes. This method checks that the given value
 * is valid for this <code>InputInterface</code>. Things as checking if the
 * value is empty but required is out of scope of this method.
 */
InputInterface.prototype._checkValue = function (newValue) {
    return InputValidationError.NO_ERROR;
};

/**
 * Checks if the given value is valid for this InputInterface.
 *
 */
InputInterface.prototype.checkValue = function (newValue) {
    if (newValue === undefined) {
        newValue = this.getValue();
    } else {
        newValue = this._normalize(newValue);
    }

    if (!(this instanceof SelectInputInterface)) {
        if (this._required && this._isEmptyValue(newValue)) {
            return InputValidationError.REQUIRED_ERROR;
        }

        if (!this._required && this._isEmptyValue(newValue)) {
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
InputInterface.prototype.isValidValue = function (newValue) {
    return this.checkValue(newValue) === InputValidationError.NO_ERROR;
};

/**
 * Sets the value for this interface without checking its correctness.
 *
 * @param newValue
 *
 * @see <code>InputInterface.setValue</code>
 */
InputInterface.prototype._setValue = function (newValue) {
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
InputInterface.prototype._setError = function (error) {
    if (error) {
        EzWebExt.addClassName(this.inputElement.wrapperElement, 'error');
    } else {
        EzWebExt.removeClassName(this.inputElement.wrapperElement, 'error');
    }
};

/**
 * Resets the current interface using its default value.
 */
InputInterface.prototype.resetToDefault = function () {
    this._setError(false);
    this._setValue(this._defaultValue);
};

/**
 * Resets the current interface using the initial value.
 */
InputInterface.prototype.reset = function () {
    this._setError(false);
    this._setValue(this._initialValue);
};

/**
 * Sets the focus on this input interface.
 */
InputInterface.prototype.focus = function () {
    this.inputElement.focus();
};

/**
 * Disables/enables this input interface.
 */
InputInterface.prototype.setDisabled = function (disable) {
    this.inputElement.setDisabled(this._readOnly || disable);
};

/**
 * Inserts this InputInterface into the given DOM Element.
 *
 * @param {Element} element
 */
InputInterface.prototype._insertInto = function (element) {
    this.inputElement.insertInto(element);
};

/**
 *
 * @param {String} value
 *
 * @return {Object}
 */
InputInterface.prototype.parseFromPersistence = function (value) {
    return value;
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

ListInputInterface.prototype._setValue = function (newValue) {
    if (newValue === null || newValue === undefined) {
        newValue = [];
    }

    this.inputElement.cleanSelection();
    this.inputElement.addSelection(newValue);
};

ListInputInterface.prototype.getValue = function () {
    return this.inputElement.getSelection();
};

ListInputInterface.prototype.isEmpty = function () {
    return this.getValue().length === 0;
};

/**
 *
 */
function IntegerInputInterface(fieldId, options) {
    if (arguments.length === 0) {
        return;
    }

    InputInterface.call(this, fieldId, options);

    this.inputElement = new StyledElements.StyledNumericField(options);
}
IntegerInputInterface.prototype = new InputInterface();

IntegerInputInterface.prototype.parseFromPersistence = function (value) {
    return parseInt(value, 10);
};

IntegerInputInterface.prototype._checkValue = function (newValue) {
    if (this.inputElement.min !== undefined) {
        if (newValue < parseInt(this.inputElement.min, 10)) {
            return InputValidationError.OUT_OF_RANGE_ERROR;
        }
    }
    if (this.inputElement.max !== undefined) {
        if (newValue < parseInt(this.inputElement.max, 10)) {
            return InputValidationError.OUT_OF_RANGE_ERROR;
        }
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

/**
 *
 */
function URLInputInterface(fieldId, options) {
    if (arguments.length === 0) {
        return;
    }

    TextInputInterface.call(this, fieldId, options);
}

URLInputInterface.prototype = new TextInputInterface();

URLInputInterface.prototype._URLChecker = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

URLInputInterface.prototype._checkValue = function (newValue) {
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

EMailInputInterface.prototype._checkValue = function (newValue) {
    return this._EMailChecker.test(newValue) ? InputValidationError.NO_ERROR : InputValidationError.EMAIL_ERROR;
};

/**
 *
 */
function BooleanInputInterface(fieldId, options) {
    InputInterface.call(this, fieldId, options);

    this.inputElement = new StyledElements.StyledCheckBox(options = options);
}
BooleanInputInterface.prototype = new InputInterface();

BooleanInputInterface.prototype.isEmpty = function () {
    return false;
};

BooleanInputInterface.prototype._checkValue = function (newValue) {
    return (typeof newValue === 'boolean') ? InputValidationError.NO_ERROR : InputValidationError.BOOLEAN_ERROR;
};

BooleanInputInterface.prototype.parseFromPersistence = function (value) {
    return typeof value === 'boolean' ? value : value.toLowerCase() === 'true';
};

/**
 *
 */
function SelectInputInterface(fieldId, fieldDesc) {
    var desc = fieldDesc;

    InputInterface.call(this, fieldId, fieldDesc);

    if (typeof desc.entries === 'function') {
        this._update = fieldDesc.entries;
    } else if (desc.initialEntries && !this._required) {
        desc = EzWebExt.clone(fieldDesc);
        desc.initialEntries = [{label: '---------', value: null}].concat(fieldDesc.initialEntries);
    }
    this.inputElement = new StyledElements.StyledSelect(desc);
}
SelectInputInterface.prototype = new InputInterface();

SelectInputInterface.prototype._setValue = function (newValue) {
    var entries;

    if (this._update) {
        this.inputElement.clear();
        entries = this._update();
        if (!this._required) {
            entries = [{label: '---------', value: null}].concat(entries);
        }
        this.inputElement.addEntries(entries);
    }
    this.inputElement.setValue(newValue);
};

SelectInputInterface.prototype._checkValue = function (newValue) {
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
        button = new ButtonClass(this.inputElement, buttonDesc.value);
        button.insertInto(label);
        label.appendChild(document.createTextNode(buttonDesc.label));
        this.wrapperElement.appendChild(label);
    }
}
ButtonGroupInputInterface.prototype = new InputInterface();
ButtonGroupInputInterface.prototype._insertInto = function (element) {
    element.appendChild(this.wrapperElement);
};

ButtonGroupInputInterface.prototype._setValue = function (newValue) {
    this.inputElement.setValue(newValue);
};

ButtonGroupInputInterface.prototype._setError = function (error) {
    // TODO
};

/**
 *
 */
function FileInputInterface(fieldId, fieldDesc) {

    InputInterface.call(this, fieldId, fieldDesc);

    this.inputElement = document.createElement('input');
    this.inputElement.setAttribute('type', 'file');
    this.inputElement.setAttribute('name', fieldId);

    this.wrapperElement = this.inputElement;
}
FileInputInterface.prototype = new InputInterface();

FileInputInterface.prototype._insertInto = function (element) {
    element.appendChild(this.wrapperElement);
};

FileInputInterface.prototype.getValue = function () {
    return this.inputElement.value;
};

FileInputInterface.prototype._setValue = function (newValue) {
    // TODO
};

FileInputInterface.prototype._setError = function (error) {
    // TODO
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

MultivaluedInputInterface.prototype._addEntry = function () {
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
    entry.addRowButton.addEventListener('click', EzWebExt.bind(function () {
        this._addEntry();
    }, this));
    entry.addRowButton.insertInto(entry.wrapper);

    entry.removeRowButton = new StyledElements.StyledButton({text: '-'});
    entry.removeRowButton.addEventListener('click', EzWebExt.bind(function () {
        this.control._removeEntry(entry);
    }, {control: this, entry: entry}));
    entry.removeRowButton.insertInto(entry.wrapper);

    this.entries.push(entry);
    this.wrapperElement.appendChild(entry.wrapper);

    return entry;
};

MultivaluedInputInterface.prototype._removeEntry = function (entry) {
    var index;

    this.wrapperElement.removeChild(entry.wrapper);
    index = this.entries.indexOf(entry);
    this.entries.splice(index, 1);
    entry.form.destroy();

    if (this.entries.length === 0) {
        this._addEntry();
    }
};

MultivaluedInputInterface.prototype._removeAllEntries = function () {
    var i, entry;
    for (i = 0; i < this.entries.length; i += 1) {
        entry = this.entries[i];
        this.wrapperElement.removeChild(entry.wrapper);
        entry.form.destroy();
    }
    this.entries = [];
};

MultivaluedInputInterface.prototype._insertInto = function (element) {
    this.wrapperElement.insertInto(element);
};

MultivaluedInputInterface.prototype.getValue = function () {
    var i, data = [];

    for (i = 0; i < this.entries.length; i += 1) {
        data.push(this.entries[i].form.getData());
    }

    return data;
};

MultivaluedInputInterface.prototype._setValue = function (newValue) {
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

MultivaluedInputInterface.prototype._setError = function (error) {
    // TODO
};

/**
 *
 */
var InterfaceFactory = function () {
    var mapping = {
        'boolean': BooleanInputInterface,
        'text': TextInputInterface,
        'hidden': HiddenInputInterface,
        'list': ListInputInterface,
        'integer': IntegerInputInterface,
        'longtext': LongTextInputInterface,
        'url': URLInputInterface,
        'email': EMailInputInterface,
        'select': SelectInputInterface,
        'buttons': ButtonGroupInputInterface,
        'file': FileInputInterface,
        'multivalued': MultivaluedInputInterface
    };

    this.createInterface = function (fieldId, fieldDesc) {
        var Class_ = mapping[fieldDesc.type];
        if (Class_ == null) {
            throw new Error(fieldDesc.type);
        }
        return new Class_(fieldId, fieldDesc);
    };

    this.addFieldType = function (type, class_) {
        if (!class_ instanceof InputInterface) {
            throw new TypeError();
        }
        if (mapping[type] !== undefined) {
            throw new Error();
        }

        mapping[type] = class_;
    };
};
InterfaceFactory = new InterfaceFactory();
