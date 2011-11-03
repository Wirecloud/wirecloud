/*
*     (C) Copyright 2009 Telefonica Investigacion y Desarrollo
*     S.A.Unipersonal (Telefonica I+D)
*
*     This file is part of Morfeo EzWeb Platform.
*
*     Morfeo EzWeb Platform is free software: you can redistribute it and/or modify
*     it under the terms of the GNU Affero General Public License as published by
*     the Free Software Foundation, either version 3 of the License, or
*     (at your option) any later version.
*
*     Morfeo EzWeb Platform is distributed in the hope that it will be useful,
*     but WITHOUT ANY WARRANTY; without even the implied warranty of
*     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*     GNU Affero General Public License for more details.
*
*     You should have received a copy of the GNU Affero General Public License
*     along with Morfeo EzWeb Platform.  If not, see <http://www.gnu.org/licenses/>.
*
*     Info about members and contributors of the MORFEO project
*     is available at
*
*     http://morfeo-project.org
 */


/**
 *
 */
var InputValidationError = new Object();
InputValidationError.NO_ERROR       = 0;
InputValidationError.REQUIRED_ERROR = 1;
InputValidationError.URL_ERROR      = 2;
InputValidationError.EMAIL_ERROR    = 3;
InputValidationError.ID_ERROR       = 4;
InputValidationError.COLOR_ERROR    = 5;
InputValidationError.BOOLEAN_ERROR  = 6;
InputValidationError.VERSION_ERROR  = 7;


function ValidationErrorManager() {
	this.fieldsWithErrorById = new Object();
}

ValidationErrorManager.prototype._addValidationError = function(errorCode, fieldName) {
	if (this.fieldsWithErrorById[errorCode] == undefined)
		this.fieldsWithErrorById[errorCode] = new Array();

	this.fieldsWithErrorById[errorCode].push(fieldName);
}

ValidationErrorManager.prototype.validate = function(field) {
	var errorCode = field.checkValue();
	if (errorCode != InputValidationError.NO_ERROR)
		this._addValidationError(errorCode, field.getLabel());
}

ValidationErrorManager.prototype._buildErrorMsg = function(errorCode) {
	var msg;

	errorCode = parseInt(errorCode);
	switch (errorCode) {
	case InputValidationError.REQUIRED_ERROR:
		msg = gettext("The following required fields are empty: %(fields)s.");
		break;
	case InputValidationError.URL_ERROR:
		msg = gettext("The following fields do not contain a valid URL: %(fields)s.");
		break;
	case InputValidationError.EMAIL_ERROR:
		msg = gettext("The following fields do not contain a valid E-Mail address: %(fields)s.");
		break;
	case InputValidationError.VERSION_ERROR:
		msg = gettext("The following field do not contain a valid version number: %(fields)s.");
		break;
	case InputValidationError.ID_ERROR:
		msg = gettext("The following fields contain invalid characters: %(fields)s.");
		break;
	case InputValidationError.COLOR_ERROR:
		msg = gettext("The following fields do not contain a valid color value: %(fields)s.");
		break;
	}

	var fields = "";
	for (var i = 0; i < this.fieldsWithErrorById[errorCode].length; i++)
		fields += ", " + this.fieldsWithErrorById[errorCode][i];

	fields = fields.substring(2);
	return interpolate(msg, {'fields': fields}, true);
}

ValidationErrorManager.prototype.toHTML = function() {
	var errorMsg = "";

	for (errorCode in this.fieldsWithErrorById)
		errorMsg += "<p>" + this._buildErrorMsg(errorCode) + "</p>";

	return errorMsg;
}


/**
 * @abstract
 */
function InputInterface(fieldId, options) {
	if (arguments.length == 0)
		return;

	this._fieldId = fieldId;
	this._defaultValue = options['defaultValue'];
	this._label = options['label'];
	this._required = options['required'] ? options['required'] : false;

	if (options['description']) {
		this._description = options['description'];
	} else {
		this._description = options['label'];
	}
}

InputInterface.prototype.getValue = function() {
	return this.inputElement.value;
}

InputInterface.prototype.setValue = function(newValue) {
	if (this.isValidValue(newValue))
		this._setValue(newValue);
}

/**
 * Returns the label for this InputInterface.
 *
 * @returns {String}
 */
InputInterface.prototype.getLabel = function() {
	return this._label;
}

/**
 * Returns the description for this InputInterface.
 *
 * @returns {String}
 */
InputInterface.prototype.getDescription = function() {
	return this._description;
}

/**
 * Returns the defaultValue for this InputInterface.
 *
 * @returns {Object}
 */
InputInterface.prototype.getDefaultValue = function() {
	return this._defaultValue;
}

/**
 * Checks if this InputInterface is currently empty.
 *
 * @returns {Boolean}
 */
InputInterface.prototype.isEmpty = function() {
	return this.getValue() == "";
}

/**
 * @private
 *
 * Must be implemented by child classes. This method checks that the given value
 * is valid for this <code>InputInterface</code>. Things as checking if the
 * value is empty but required is out of scope of this method.
 */
InputInterface.prototype._checkValue = function(newValue) {
	return InputValidationError.NO_ERROR;
}

/**
 * Checks if the given value is valid for this InputInterface.
 *
 */
InputInterface.prototype.checkValue = function(newValue) {
	if (newValue === undefined)
		newValue = this.getValue();

	if (this._required && (newValue == undefined || newValue === ""))
		return InputValidationError.REQUIRED_ERROR;

	if (!this._required && newValue === "")
		return InputValidationError.NO_ERROR;

	return this._checkValue(newValue);
}

/**
 * Checks if the given value is valid for this InputInterface.
 *
 * @retuns {Boolean}
 */
InputInterface.prototype.isValidValue = function(newValue) {
	return this.checkValue(newValue) === InputValidationError.NO_ERROR;
}

/**
 * Sets the value for this interface without checking its correctness.
 *
 * @param newValue
 *
 * @see <code>InputInterface.setValue</code>
 */
InputInterface.prototype._setValue = function(newValue) {
	if (newValue == null)
		newValue = "";

	this.inputElement.value = newValue;
}

/**
 * Resets the current interface value to the default one.
 */
InputInterface.prototype.reset = function() {
	this._setValue(this._defaultValue);
}

/**
 * Sets the focus on this input interface.
 */
InputInterface.prototype.focus = function() {
	this.inputElement.focus();
}

/**
 * TODO
 * Sets the focus on this input interface.
 */
InputInterface.prototype.setDisabled = function(disabled) {
	if (disabled)
		this.inputElement.setAttribute('disabled', 'disabled');
	else
		this.inputElement.removeAttribute('disabled');
}

/**
 * Inserts this InputInterface into the given DOM Element.
 *
 * @param {Element} element
 */
InputInterface.prototype._insertInto = function(element) {
	element.appendChild(this.inputElement);
}

/**
 *
 * @param {String} value
 *
 * @return {Object}
 */
InputInterface.prototype.parseFromPersistence = function(value) {
	return value;
}

/**
 *
 */
function TextInputInterface(fieldId, options) {
	if (arguments.length == 0)
		return;

	InputInterface.call(this, fieldId, options);

	this.inputElement = document.createElement('input');
	Element.extend(this.inputElement);
	this.inputElement.setAttribute('type', 'text');
}
TextInputInterface.prototype = new InputInterface();

/**
 *
 */
function PasswordInputInterface(fieldId, options) {
	if (arguments.length == 0)
		return;

	InputInterface.call(this, fieldId, options);

	this.inputElement = document.createElement('input');
	Element.extend(this.inputElement);
	this.inputElement.setAttribute('type', 'password');
}
PasswordInputInterface.prototype = new InputInterface();

/**
 *
 */
function IntegerInputInterface(fieldId, options) {
	if (arguments.length == 0)
		return;

	InputInterface.call(this, fieldId, options);

	this.inputElement = document.createElement('input');
	Element.extend(this.inputElement);
	this.inputElement.setAttribute('type', 'text');
}
IntegerInputInterface.prototype = new InputInterface();

IntegerInputInterface.prototype.getValue = function() {
	var value = this.inputElement.value;
	if (value == "")
		return 0; // TODO defaultValue?

	return parseInt(value);
}

IntegerInputInterface.prototype.parseFromPersistence = function(value) {
	return parseInt(value);
}

/**
 *
 */
function LongTextInputInterface(fieldId, options) {
	InputInterface.call(this, fieldId, options);

	this.inputElement = document.createElement('textarea');
	Element.extend(this.inputElement);
	this.inputElement.setAttribute('cols', '50');
	this.inputElement.setAttribute('rows', '3');
}
LongTextInputInterface.prototype = new InputInterface();

/**
 *
 */
function URLInputInterface(fieldId, options) {
	if (arguments.length == 0)
		return;

	TextInputInterface.call(this, fieldId, options);
}
URLInputInterface.prototype = new TextInputInterface();

URLInputInterface.prototype._URLChecker = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

URLInputInterface.prototype._checkValue = function(newValue) {
	return this._URLChecker.test(newValue) ? InputValidationError.NO_ERROR : InputValidationError.URL_ERROR;
}

/**
 *
 */
function FileURLInputInterface(fieldId, options) {
	URLInputInterface.call(this, fieldId, options);

	this.link = document.createElement('div');
	this.linkHandler = options.linkHandler;

	Element.extend(this.link);
	this.link.addClassName('window_link');
	this.link.innerHTML = gettext("Choose a local file");
	Event.observe(this.link, 'click', this.linkHandler)
}
FileURLInputInterface.prototype = new URLInputInterface();

FileURLInputInterface.prototype._insertInto = function(element){
	element.appendChild(this.inputElement);
	element.appendChild(this.link);
}

FileURLInputInterface.prototype.setDisabled = function(disabled){

	InputInterface.prototype.setDisabled.call(this, disabled);

	//this input interface has to disable the uploader link too
	if (disabled) {
		this.link.removeClassName('window_link');
		Event.stopObserving(this.link, 'click', this.linkHandler);
	}
	else {
		this.link.addClassName('window_link');
		Event.observe(this.link, 'click', this.linkHandler);
	}

}

/**
 *
 */
function EMailInputInterface(fieldId, options) {
	TextInputInterface.call(this, fieldId, options);
}
EMailInputInterface.prototype = new TextInputInterface();

EMailInputInterface.prototype._EMailChecker = /[\w\d][\w-]*@[\w\d-]+\.[\w\d]+/;

EMailInputInterface.prototype._checkValue = function(newValue) {
	return this._EMailChecker.test(newValue) ? InputValidationError.NO_ERROR : InputValidationError.EMAIL_ERROR;
}

/**
 *
 */
function VersionInputInterface(fieldId, options) {
	TextInputInterface.call(this, fieldId, options);

	this.sample = document.createElement('div');
	Element.extend(this.sample);
	this.sample.addClassName('explanation');
	this.sample.innerHTML = gettext('Format: X.X.X, where X is an integer.') + "<br/>" +
	gettext('Ex. "0.1", "1.11". NOTE: 1.01 should be 1.0.1');

}
VersionInputInterface.prototype = new TextInputInterface();


VersionInputInterface.prototype._checkValue = function(newValue) {
	var regexp1 = /^(\d+\.)*\d+$/;		//Format: XX.XX.XX
	var regexp2 = /^(0\d+\.)|(\.0\d+)/;	//01.01 not valid => 1.1

	//let's check if it is the correct format and there aren't any left 0
	return (regexp1.test(newValue) && !regexp2.test(newValue))? InputValidationError.NO_ERROR : InputValidationError.VERSION_ERROR;
}

VersionInputInterface.prototype._insertInto = function(element){
	element.appendChild(this.inputElement);
	element.appendChild(this.sample);
}

/**
 *
 */
function IdInputInterface(fieldId, options) {
	TextInputInterface.call(this, fieldId, options);
}
IdInputInterface.prototype = new TextInputInterface();

IdInputInterface.prototype._invalid_characters = ['/', '?', '&', ':'];

IdInputInterface.prototype._checkValue = function(newValue) {
	for (var i = 0; i < this._invalid_characters.length; i++) {
		var character = this._invalid_characters[i];
		if (this.inputElement.value.indexOf(character) >= 0)
			return InputValidationError.ID_ERROR;
	}

	return InputValidationError.NO_ERROR;
}

/**
 *
 */
function ColorInputInterface(fieldId, options) {
	InputInterface.call(this, fieldId, options);

	this.inputElement = document.createElement('input');
	Element.extend(this.inputElement);
	this.inputElement.setAttribute('maxlength', 11);
	this.inputElement.setAttribute('type', 'text');
	this.inputElement.setAttribute('class', 'color_input');
	//var inputId = this._fieldId + '_input';
	var inputId = this._fieldId;
	this.inputElement.setAttribute('id', inputId);

}
ColorInputInterface.prototype = new InputInterface();

ColorInputInterface.prototype._hexChecker = new RegExp('^#?[a-fA-F0-9]{6}$');
ColorInputInterface.prototype._hexExtractor = new RegExp('^#?([0-9A-F]{6})$');

ColorInputInterface.prototype._checkValue = function(newValue) {
	return this._hexChecker.test(newValue) ? InputValidationError.NO_ERROR : InputValidationError.COLOR_ERROR;
}

ColorInputInterface.prototype.getValue = function() {
	var value = this.inputElement.value;
	if (value == "")
		return value;

	return this._hexExtractor.exec(value.toUpperCase())[1];
}

ColorInputInterface.prototype._insertInto = function(element) {
	element.appendChild(this.inputElement);
	if (!this.picker)
		this.picker = new jscolor.color(this.inputElement, {'hash':'true'});

/*
	element.appendChild(this.button);
	element.appendChild(this.sample);

	var colorpicker301 = document.createElement('div');
	Element.extend(colorpicker301);
	colorpicker301.setAttribute('id', 'colorpicker301');
	colorpicker301.addClassName('colorpicker301');
	element.appendChild(colorpicker301, element.firstChild);
*/

}

/**
 *
 */
function BooleanInputInterface(fieldId, options) {
	InputInterface.call(this, fieldId, options);

	this.inputElement = document.createElement('input');
	Element.extend(this.inputElement);
	this.inputElement.setAttribute('type', 'checkbox');
}
BooleanInputInterface.prototype = new InputInterface();

BooleanInputInterface.prototype.isEmpty = function() {
	return false;
}

BooleanInputInterface.prototype.getValue = function() {
	return this.inputElement.checked;
}

BooleanInputInterface.prototype._setValue = function(newValue) {
	if (newValue == null)
		newValue = false;

	this.inputElement.checked = newValue;
}

BooleanInputInterface.prototype._checkValue = function(newValue) {
	return (typeof newValue == 'boolean') ? InputValidationError.NO_ERROR : InputValidationError.BOOLEAN_ERROR;
}

BooleanInputInterface.prototype.parseFromPersistence = function(value) {
	return typeof value == 'boolean' ? value : value == 'True';
}

BooleanInputInterface.prototype.setOnclickHandler = function(handler){
	this.inputElement.onclick = handler;
}

/**
 * TODO improve this class
 */
function RadioButtonInputInterface(fieldId, options) {
	InputInterface.call(this, fieldId, options);

	this.inputElement = document.createElement('input');
	Element.extend(this.inputElement);
	this.inputElement.setAttribute('type', 'radio');
	this.inputElement.setAttribute('name', options.name);
	if(this._defaultValue)
		this.inputElement.setAttribute('defaultChecked', 'defaultChecked');

	if ('onclick' in options)
		this.inputElement.observe('click', options['onclick'], true, fieldId);
}
RadioButtonInputInterface.prototype = new InputInterface();

RadioButtonInputInterface.prototype.getValue = function() {
	return this.inputElement.checked;
}

RadioButtonInputInterface.prototype._setValue = function(newValue) {
	if (newValue == null)
		newValue = false;

	this.inputElement.checked = newValue;
}

/**
 *
 */
function SelectInputInterface(fieldId, fieldDesc) {
	InputInterface.call(this, fieldId, fieldDesc);

	this.inputElement = document.createElement('select');

	for (var i = 0; i < fieldDesc.options.length; i++) {
		var option = new Option(fieldDesc.options[i].label, fieldDesc.options[i].value);
		try {
			this.inputElement.add(option, null);
		} catch (e) {
			this.inputElement.add(option); // IE < 8
		}
	}
}
SelectInputInterface.prototype = new InputInterface();

/**
 *
 */
function MultipleInputInterface(fieldId, fieldDesc) {
	InputInterface.call(this, fieldId, fieldDesc);

	this.inputElement = document.createElement('select');
	Element.extend(this.inputElement);

	this.inputElement.multiple = true;

	this.sample = document.createElement('div');
	Element.extend(this.sample);
	this.sample.addClassName('explanation');
	this.sample.setTextContent(gettext('Hold down "Control", or "Command" on a Mac, to select more than one item'));

	for (var i = 0; i < fieldDesc.options.length; i++) {
		var option = new Option(fieldDesc.options[i].label, fieldDesc.options[i].value);
		try {
			this.inputElement.add(option, null);
		} catch (e) {
			this.inputElement.add(option); // IE < 8
		}
	}
}
MultipleInputInterface.prototype = new InputInterface();

MultipleInputInterface.prototype._insertInto = function(element) {
	element.appendChild(this.inputElement);
	element.appendChild(this.sample);
}

MultipleInputInterface.prototype.getValue = function() {
	var value = [];

	if (!this.inputElement.checked)
		return value;

	var options = this.inputElement.options;
	var len = options.length;
	for (var i = 0; i < len; i++) {
		if (options[i].selected) {
			value.push(options[i].value);
		}
	}
	return value;
}

MultipleInputInterface.prototype._setValue = function(newValue) {
	if (newValue == null)
		newValue = [];

	this.inputElement.checked = newValue;
}

/**
 *
 */
function ParametrizableValueInputInterface(fieldId, options) {
    InputInterface.call(this, fieldId, options);

    this.parentWindow = options.parentWindow;
    this.variable = options.variable;
    this.canBeHidden = options.canBeHidden;

    this.wrapperElement = document.createElement('div');

    this.readOnlyIcon = document.createElement('div');
    Element.extend(this.readOnlyIcon);
    this.readOnlyIcon.addClassName('readOnlyIcon');
    this.wrapperElement.appendChild(this.readOnlyIcon);

    this.visibilityIcon = document.createElement('div');
    Element.extend(this.visibilityIcon);
    this.visibilityIcon.addClassName('visibilityIcon');
    this.wrapperElement.appendChild(this.visibilityIcon);
    if (!this.canBeHidden) {
        this.visibilityIcon.style.visibility = 'hidden';
    }

    this.inputElement = document.createElement('input');
    Element.extend(this.inputElement);
    this.inputElement.disabled = true;
    var inputId = this._fieldId;
    this.inputElement.setAttribute('id', inputId);
    this.wrapperElement.appendChild(this.inputElement);

    this.buttonElement = document.createElement('button');
    Element.extend(this.buttonElement);
    this.wrapperElement.appendChild(this.buttonElement);
    this.buttonElement.observe('click', function() {
        var dialog = new ParametrizeWindowMenu(this);
        dialog.show(this.parentWindow);
        dialog.setValue(this.getValue());
    }.bind(this));
}
ParametrizableValueInputInterface.prototype = new InputInterface();

ParametrizableValueInputInterface.prototype._checkValue = function(newValue) {
    return InputValidationError.NO_ERROR;
};

ParametrizableValueInputInterface.prototype.getValue = function() {
    var value = {
        'source': this.source,
        'status': this['status']
    };

    if (this.source !== 'default') {
        value.value = this.inputElement.value;
    }

    return value;
};

ParametrizableValueInputInterface.prototype.VALID_SOURCE_VALUES = ['current', 'default', 'custom'];
ParametrizableValueInputInterface.prototype.VALID_STATUS_VALUES = ['normal', 'hidden', 'readonly'];

ParametrizableValueInputInterface.prototype._setValue = function(newValue) {
    if (newValue == null || this.VALID_SOURCE_VALUES.indexOf(newValue.source) === -1) {
        this.source = 'current';
    } else {
        this.source = newValue.source;
    }

    if (newValue == null || typeof newValue.value !== 'string') {
        this.value = '';
    } else {
        this.value = newValue.value;
    }

    if (newValue == null || this.VALID_STATUS_VALUES.indexOf(newValue['status']) === -1) {
        this['status'] = this.canBeHidden ? 'hidden' : 'normal';
    } else if (!this.canBeHidden && newValue['status'] === 'hidden') {
        this['status'] = 'readOnly';
    } else {
        this['status'] = newValue['status'];
    }

    this._updateInputElement();
    this._updateButton();
};

ParametrizableValueInputInterface.prototype._insertInto = function(element) {
    element.appendChild(this.wrapperElement);
};

ParametrizableValueInputInterface.prototype._updateInputElement = function() {
    switch (this.source) {
    case 'default':
        this.inputElement.value = '';
        break;
    case 'current':
        this.inputElement.value = ParametrizedTextInputInterface.prototype.escapeValue(this.variable.value);
        break;
    case 'custom':
        this.inputElement.value = this.value;
    }
};

ParametrizableValueInputInterface.prototype._updateButton = function() {
    if (this.source === 'default') {
        this.buttonElement.innerHTML = gettext('Parametrize');
    } else {
        this.buttonElement.innerHTML = gettext('Modify');
    }

    if (this['status'] !== 'normal') {
        this.readOnlyIcon.addClassName('readOnly');
        this.readOnlyIcon.title = gettext("This value won't be editable by the user");
    } else {
        this.readOnlyIcon.removeClassName('readOnly');
        this.readOnlyIcon.title = gettext("This value will be editable by the user");
    }

    if (this['status'] !== 'hidden') {
        this.visibilityIcon.addClassName('visible');
        this.visibilityIcon.title = gettext("This value will be visible to the user");
    } else {
        this.visibilityIcon.removeClassName('visible');
        this.visibilityIcon.title = gettext("This value won't be visible to the user");
    }
};

/**
 *
 */
function ParametrizedTextInputInterface(fieldId, options) {
    var i, param, contextFields, option;

    InputInterface.call(this, fieldId, options);

    this.variable = options.variable;
    this.parameters = this.getAvailableParameters();

    this.wrapperElement = document.createElement('div');
    this.wrapperElement.className = 'parametrized_text_input';

    this.resetButton = document.createElement('button');
    Element.extend(this.resetButton);
    this.resetButton.setTextContent(gettext('Use current value'));
    this.wrapperElement.appendChild(this.resetButton);
    this.resetButton.observe('click', function() {
        if (!this.inputElement.disabled) {
            this.inputElement.value = this.escapeValue(this.variable.value);
        }
    }.bind(this));

    this.selectorWrapperElement = document.createElement('div');
    this.selectorWrapperElement.className = 'context_selector';
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
    Element.observe(this.mainSelect, 'change', this._updateSecondSelect.bind(this));
    this.selectorWrapperElement.appendChild(this.mainSelect);

    this.secondSelect = document.createElement('select');
    this.selectorWrapperElement.appendChild(this.secondSelect);
    Element.observe(this.secondSelect, 'change', this._updateDescription.bind(this));

    this.addButton = document.createElement('button');
    Element.extend(this.addButton);
    this.addButton.setTextContent(gettext('Add'));
    this.selectorWrapperElement.appendChild(this.addButton);
    this.addButton.observe('click', function() {
        var prefix, suffix, parameter, start;

        if (this.inputElement.disabled) {
            return;
        }

        start = this.inputElement.selectionStart;
        prefix = this.inputElement.value.substr(0, start);
        suffix = this.inputElement.value.substr(this.inputElement.selectionEnd);
        parameter = this.mainSelect.value + '.' + this.secondSelect.value;

        this.inputElement.value = prefix + '%(' + parameter + ')' + suffix;
        this.inputElement.selectionStart = start;
        this.inputElement.selectionEnd = start + parameter.length + 3;
    }.bind(this));

    this.descriptionDiv = document.createElement('div');
    this.descriptionDiv.className = 'description';
    this.wrapperElement.appendChild(this.descriptionDiv);

    this.inputElement = document.createElement('textarea');
    this.inputElement.style.display = 'block';
    Element.extend(this.inputElement);
    this.inputElement.setAttribute('cols', '50');
    this.inputElement.setAttribute('rows', '3');
    this.wrapperElement.appendChild(this.inputElement);

    // Initialize
    this._updateSecondSelect();
}
ParametrizedTextInputInterface.prototype = new InputInterface();

ParametrizedTextInputInterface.prototype._ESCAPE_RE = new RegExp("(%+)(\\([a-zA-Z]\\w*(?:\\.[a-zA-Z]\\w*)*\\))");
ParametrizedTextInputInterface.prototype._ESCAPE_FUNC = function() {
    var str, i;

    i = arguments[1].length * 2;
    str = '';
    while ((i -= 1) >= 0) {
        str += '%';
    }

    return str + arguments[2];
};

ParametrizedTextInputInterface.prototype._CONTEXT_PARAMS = null;
ParametrizedTextInputInterface.prototype.getAvailableParameters = function() {
    var concepts, conceptName, dashIndex, provider, concept, parameters, label;

    if (ParametrizedTextInputInterface.prototype._CONTEXT_PARAMS === null) {
        concepts = OpManagerFactory.getInstance().activeWorkSpace.contextManager._concepts;
        contextFields = {
            '': []
        };
        for (conceptName in concepts) {
            concept = concepts[conceptName];
            if (concept._type !== 'GCTX') {
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
                    },
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

ParametrizedTextInputInterface.prototype.escapeValue = function(value) {
    return value.replace(ParametrizedTextInputInterface.prototype._ESCAPE_RE,
        ParametrizedTextInputInterface.prototype._ESCAPE_FUNC);
};

ParametrizedTextInputInterface.prototype._updateSecondSelect = function() {
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

ParametrizedTextInputInterface.prototype._updateDescription = function() {
    var fields, field;

    fields = this.parameters[this.mainSelect.selectedIndex].fields;
    field = fields[this.secondSelect.selectedIndex];
    this.descriptionDiv.setTextContent(field.description);
};

ParametrizedTextInputInterface.prototype._setValue = function(newValue) {
    this.inputElement.value = newValue;
    if (this.update) {
        this.update();
    }
};

ParametrizedTextInputInterface.prototype.setDisabled = function(disabled) {

    InputInterface.prototype.setDisabled.call(this, disabled);

    this.mainSelect.disabled = !!disabled;
    this.secondSelect.disabled = !!disabled;
    this.addButton.disabled = !!disabled;
    this.resetButton.disabled = !!disabled;
}

ParametrizedTextInputInterface.prototype._insertInto = function(element) {
    element.appendChild(this.wrapperElement);
};

/**
 *
 */
var InterfaceFactory = new Object();
InterfaceFactory.createInterface = function(fieldId, fieldDesc) {
	switch (fieldDesc.type) {
	case 'boolean':
		return new BooleanInputInterface(fieldId, fieldDesc);
	case 'id':
		return new IdInputInterface(fieldId, fieldDesc);
	case 'text':
		return new TextInputInterface(fieldId, fieldDesc);
	case 'password':
		return new PasswordInputInterface(fieldId, fieldDesc);
	case 'integer':
		return new IntegerInputInterface(fieldId, fieldDesc);
	case 'longtext':
		return new LongTextInputInterface(fieldId, fieldDesc);
	case 'color':
		return new ColorInputInterface(fieldId, fieldDesc);
	case 'url':
		return new URLInputInterface(fieldId, fieldDesc);
	case 'fileUrl':
		return new FileURLInputInterface(fieldId, fieldDesc);
	case 'email':
		return new EMailInputInterface(fieldId, fieldDesc);
	case 'version':
		return new VersionInputInterface(fieldId, fieldDesc);
	case 'select':
		return new SelectInputInterface(fieldId, fieldDesc);
	case 'multiple':
		return new MultipleInputInterface(fieldId, fieldDesc);
	case 'radio':
		return new RadioButtonInputInterface(fieldId, fieldDesc);
	case 'parametrizableValue':
		return new ParametrizableValueInputInterface(fieldId, fieldDesc);
	case 'parametrizedText':
		return new ParametrizedTextInputInterface(fieldId, fieldDesc);
	default:
		throw new Error(fieldDesc.type);
	}
}
