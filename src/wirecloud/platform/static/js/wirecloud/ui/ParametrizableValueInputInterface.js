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

/* globals StyledElements, Wirecloud */


(function (utils) {

    "use strict";

    var VALID_SOURCE_VALUES = ['current', 'default', 'custom'];
    var VALID_STATUS_VALUES = ['normal', 'hidden', 'readonly'];

    var updateInputElement = function updateInputElement() {
        switch (this.source) {
        case 'default':
            this.inputElement.setValue('');
            break;
        case 'current':
            this.inputElement.setValue(Wirecloud.ui.ParametrizedTextInputInterface.prototype.escapeValue(this.variable.value));
            break;
        case 'custom':
            this.inputElement.setValue(this.value);
        }
    };

    var updateButton = function updateButton() {
        if (this.source === 'default') {
            this.buttonElement.setLabel(utils.gettext('Parametrize'));
        } else {
            this.buttonElement.setLabel(utils.gettext('Modify'));
        }

        if (this.status !== 'normal') {
            this.readOnlyIcon.classList.add('readOnly');
            this.readOnlyIcon.title = utils.gettext("This value won't be editable by the user");
        } else {
            this.readOnlyIcon.classList.remove('readOnly');
            this.readOnlyIcon.title = utils.gettext("This value will be editable by the user");
        }

        if (this.status !== 'hidden') {
            this.visibilityIcon.classList.add('visible');
            this.visibilityIcon.title = utils.gettext("This value will be visible to the user");
        } else {
            this.visibilityIcon.classList.remove('visible');
            this.visibilityIcon.title = utils.gettext("This value won't be visible to the user");
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

        this.inputElement = new StyledElements.TextField();
        this.inputElement.disable();
        this.inputElement.insertInto(this.wrapperElement);

        this.buttonElement = new StyledElements.Button({text: ''});
        this.buttonElement.addEventListener('click', function () {
            var dialog = new Wirecloud.ui.ParametrizeWindowMenu(this);
            dialog.show(this.parentWindow);
            dialog.setValue(this.getValue());
        }.bind(this));
        this.buttonElement.insertInto(this.wrapperElement);
    };
    ParametrizableValueInputInterface.prototype = new StyledElements.InputInterface();

    ParametrizableValueInputInterface.prototype._checkValue = function _checkValue(newValue) {
        return StyledElements.InputValidationError.NO_ERROR;
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
            this.status = 'readonly';
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

})(Wirecloud.Utils);
