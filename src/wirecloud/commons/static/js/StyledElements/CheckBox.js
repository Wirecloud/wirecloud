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
/*global EzWebExt, StyledElements*/

(function () {

    "use strict";

    /**
     *
     */
    var CheckBox = function StyledCheckBox(options) {

        var defaultOptions = {
            'initiallyChecked': false,
            'class': '',
            'group': null,
            'value': null
        };
        options = EzWebExt.merge(defaultOptions, options);

        StyledElements.StyledInputElement.call(this, options.initiallyChecked, ['change']);

        this.wrapperElement = document.createElement("input");

        this.wrapperElement.setAttribute("type", "checkbox");
        this.inputElement = this.wrapperElement;

        if (options.name != null) {
            this.inputElement.setAttribute("name", options.name);
        }

        if (options.id != null) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        if (options.initiallyChecked === true) {
            this.inputElement.setAttribute("checked", true);
        }

        if (options.value != null) {
            this.inputElement.setAttribute("value", options.value);
        }

        if (options.group instanceof StyledElements.ButtonsGroup) {
            this.wrapperElement.setAttribute("name", options.group.getName());
            options.group.insertButton(this);
        } else if (typeof options.group === 'string') {
            this.wrapperElement.setAttribute("name", options.group);
        }

        /* Internal events */
        this.inputElement.addEventListener('mousedown', EzWebExt.stopPropagationListener, true);
        this.inputElement.addEventListener('click', EzWebExt.stopPropagationListener, true);
        this.inputElement.addEventListener('change',
                                    function () {
                                        if (this.enabled) {
                                            this.events.change.dispatch(this);
                                        }
                                    }.bind(this),
                                    true);
    };

    CheckBox.prototype = new StyledElements.StyledInputElement();

    CheckBox.prototype.reset = function reset() {
        this.inputElement.checked = this.defaultValue;
    };

    CheckBox.prototype.getValue = function getValue() {
        return this.inputElement.checked;
    };

    CheckBox.prototype.setValue = function setValue(newValue) {
        this.inputElement.checked = newValue;
    };

    StyledElements.StyledCheckBox = CheckBox;
})();
