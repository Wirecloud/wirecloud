/*
 *     Copyright (c) 2008-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

/*global StyledElements*/

(function () {

    "use strict";

    /**
     *
     */
    var RadioButton = function RadioButton(options) {
        var defaultOptions = {
            'initiallyChecked': false,
            'class': '',
            'group': null,
            'value': null
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        StyledElements.InputElement.call(this, options.initiallyChecked, ['change']);

        this.wrapperElement = document.createElement("input");

        this.wrapperElement.setAttribute("type", "radio");
        if (options.value != null) {
            this.wrapperElement.setAttribute("value", options.value);
        }
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

        if (options.group instanceof StyledElements.ButtonsGroup) {
            this.wrapperElement.setAttribute("name", options.group.name);
            options.group.insertButton(this);
        } else if (typeof options.group === 'string') {
            this.wrapperElement.setAttribute("name", options.group);
        }

        Object.defineProperties(this, {
            checked: {get: property_checked_get, set: property_checked_set},
            value: {get: property_value_get}
        });

        /* Internal events */
        this.inputElement.addEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.inputElement.addEventListener('click', StyledElements.Utils.stopPropagationListener, true);
        this.wrapperElement.addEventListener('change', element_onchange.bind(this));
    };
    RadioButton.prototype = new StyledElements.InputElement();

    RadioButton.prototype.insertInto = function insertInto(element, refElement) {
        var checked = this.inputElement.checked; // Necesario para IE
        StyledElements.StyledElement.prototype.insertInto.call(this, element, refElement);
        this.inputElement.checked = checked; // Necesario para IE
    };

    RadioButton.prototype.reset = function reset() {
        this.inputElement.checked = this.defaultValue;

        return this;
    };

    RadioButton.prototype.setValue = function setValue(newValue) {
        this.inputElement.checked = newValue;

        return this;
    };

    StyledElements.RadioButton = RadioButton;

    // ==================================================================================
    // PRIVATE MEMBERS
    // ==================================================================================

    var property_checked_get = function property_checked_get() {
        return this.wrapperElement.checked;
    };

    var property_checked_set = function property_checked_set(checked) {

        if (typeof checked === 'boolean' && checked !== this.checked) {
            this.wrapperElement.checked = checked;
        }
    };

    var property_value_get = function property_value_get() {
        return this.wrapperElement.value;
    };

    var element_onchange = function element_onchange(event) {

        if (this.enabled) {
            this.trigger('change');
        }
    };

})(StyledElements, StyledElements.Utils);
