/*global gettext, InputValidationError, ParametrizedTextInputInterface, StyledElements, Wirecloud*/

(function () {

    "use strict";

    var VALID_SOURCE_VALUES = ['current', 'default', 'custom'];
    var VALID_STATUS_VALUES = ['normal', 'hidden', 'readonly'];

    var updateInputElement = function updateInputElement() {
        switch (this.source) {
        case 'default':
            this.inputElement.setValue('');
            break;
        case 'current':
            this.inputElement.setValue(ParametrizedTextInputInterface.prototype.escapeValue(this.variable.value));
            break;
        case 'custom':
            this.inputElement.setValue(this.value);
        }
    };

    var updateButton = function updateButton() {
        if (this.source === 'default') {
            this.buttonElement.setLabel(gettext('Parametrize'));
        } else {
            this.buttonElement.setLabel(gettext('Modify'));
        }

        if (this.status !== 'normal') {
            this.readOnlyIcon.classList.add('readOnly');
            this.readOnlyIcon.title = gettext("This value won't be editable by the user");
        } else {
            this.readOnlyIcon.classList.remove('readOnly');
            this.readOnlyIcon.title = gettext("This value will be editable by the user");
        }

        if (this.status !== 'hidden') {
            this.visibilityIcon.classList.add('visible');
            this.visibilityIcon.title = gettext("This value will be visible to the user");
        } else {
            this.visibilityIcon.classList.remove('visible');
            this.visibilityIcon.title = gettext("This value won't be visible to the user");
        }
    };

    /**
     *
     */
    var ParametrizableValueInputInterface = function ParametrizableValueInputInterface(fieldId, options) {
        StyledElements.InputInterface.call(this, fieldId, options);

        this.parentWindow = options.parentWindow;
        this.variable = options.variable;
        this.canBeHidden = options.canBeHidden;

        this.wrapperElement = document.createElement('div');
        this.wrapperElement.className = "parametrizable_input";

        this.readOnlyIcon = document.createElement('div');
        this.readOnlyIcon.className = 'readOnlyIcon';
        this.wrapperElement.appendChild(this.readOnlyIcon);

        this.visibilityIcon = document.createElement('div');
        this.visibilityIcon.className = 'visibilityIcon';
        this.wrapperElement.appendChild(this.visibilityIcon);
        if (!this.canBeHidden) {
            this.visibilityIcon.style.visibility = 'hidden';
        }

        this.inputElement = new StyledElements.StyledTextField();
        this.inputElement.disable();
        this.inputElement.insertInto(this.wrapperElement);

        this.buttonElement = new StyledElements.StyledButton({text: ''});
        this.buttonElement.addEventListener('click', function () {
            var dialog = new Wirecloud.ui.ParametrizeWindowMenu(this);
            dialog.show(this.parentWindow);
            dialog.setValue(this.getValue());
        }.bind(this));
        this.buttonElement.insertInto(this.wrapperElement);
    };
    ParametrizableValueInputInterface.prototype = new StyledElements.InputInterface();

    ParametrizableValueInputInterface.prototype._checkValue = function _checkValue(newValue) {
        return InputValidationError.NO_ERROR;
    };

    ParametrizableValueInputInterface.prototype.getValue = function getValue() {
        var value = {
            'source': this.source,
            'status': this.status
        };

        if (this.source !== 'default') {
            value.value = this.inputElement.getValue();
        }

        return value;
    };

    ParametrizableValueInputInterface.prototype._setValue = function _setValue(newValue) {
        if (newValue == null || VALID_SOURCE_VALUES.indexOf(newValue.source) === -1) {
            this.source = 'current';
        } else {
            this.source = newValue.source;
        }

        if (newValue == null || typeof newValue.value !== 'string') {
            this.value = '';
        } else {
            this.value = newValue.value;
        }

        if (newValue == null || VALID_STATUS_VALUES.indexOf(newValue.status) === -1) {
            this.status = 'normal';
        } else if (!this.canBeHidden && newValue.status === 'hidden') {
            this.status = 'readOnly';
        } else {
            this.status = newValue.status;
        }

        updateInputElement.call(this);
        updateButton.call(this);
    };

    ParametrizableValueInputInterface.prototype.insertInto = function insertInto(element) {
        element.appendChild(this.wrapperElement);
    };

    Wirecloud.ui.ParametrizableValueInputInterface = ParametrizableValueInputInterface;

})();
