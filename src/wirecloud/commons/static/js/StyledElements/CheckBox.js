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
     *
     */
    se.CheckBox = class CheckBox extends se.InputElement {

        constructor(options) {
            var defaultOptions = {
                'initialValue': false,
                'class': '',
                'group': null,
                'secondInput': null,
                'value': true
            };
            options = utils.merge(defaultOptions, options);

            // This is needed for backward compatibility
            if ('initiallyChecked' in options) {
                options.initialValue = options.initiallyChecked;
            }
            super(options.initialValue, ['change']);

            this.wrapperElement = document.createElement("input");
            this.wrapperElement.className = 'checkbox';

            this.wrapperElement.setAttribute("type", "checkbox");
            this.inputElement = this.wrapperElement;

            if (options.name != null) {
                this.inputElement.setAttribute("name", options.name);
            }

            if (options.id != null) {
                this.wrapperElement.setAttribute("id", options.id);
            }

            this.checkedValue = options.value;
            this.inputElement.setAttribute("value", options.value);
            this.secondInput = options.secondInput;
            this.setValue(options.initialValue);

            if (options.group instanceof StyledElements.ButtonsGroup) {
                this.wrapperElement.setAttribute("name", options.group.name);
                options.group.insertButton(this);
            } else if (typeof options.group === 'string') {
                this.wrapperElement.setAttribute("name", options.group);
            }

            /* Internal events */
            this.inputElement.addEventListener('mousedown', utils.stopPropagationListener, true);
            this.inputElement.addEventListener('click', utils.stopPropagationListener, true);
            this.inputElement.addEventListener(
                'change',
                () => {
                    if (this.enabled) {
                        if (this.secondInput != null) {
                            this.secondInput.setDisabled(!this.inputElement.checked);
                        }
                        this.dispatchEvent('change');
                    }
                },
                true
            );
        }

        reset() {
            this.setValue(this.defaultValue);
        }

        getValue() {
            if (this.checkedValue === true && this.secondInput == null) {
                return this.inputElement.checked;
            } else if (this.secondInput == null) {
                return this.inputElement.checked ? this.checkedValue : null;
            } else {
                return this.secondInput.getValue();
            }
        }

        setValue(newValue) {
            this.inputElement.checked = newValue != null && newValue !== false;
            if (this.secondInput != null) {
                this.secondInput.setDisabled(!this.inputElement.checked);
                if (this.inputElement.checked) {
                    this.secondInput.setValue(newValue);
                }
            }
        }

    }

})(StyledElements, StyledElements.Utils);
