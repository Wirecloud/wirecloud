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

/*globals StyledElements, Wirecloud*/

(function () {

    "use strict";

    var StyledSelect, onchange, onfocus, onblur;

    onchange = function onchange(event) {
        if (this.enabled) {
            var optionList = event.target;
            this.textDiv.textContent = optionList[optionList.selectedIndex].text;
            this.events.change.dispatch(this);
        }
    };

    onfocus = function onfocus() {
        this.wrapperElement.classList.add('focus');
        this.events.focus.dispatch(this);
    };

    onblur = function onblur() {
        this.wrapperElement.classList.remove('focus');
        this.events.blur.dispatch(this);
    };

    /**
     *
     * Options:
     *     * initialEntries:
     *     * initialValue:
     *     * idFunc: In case you want to assign non-string values, you must provide
     *     a function for converting them into strings.
     */
    StyledSelect = function StyledSelect(options) {
        options = StyledElements.Utils.merge({
            'class': '',
            'initialEntries': [],
            'initialValue': null,
            'idFunc': function (value) {
                if (typeof value === 'string') {
                    return value;
                } else if (value === null || value === undefined) {
                    return '';
                } else if (typeof value === 'number') {
                    return '' + value;
                } else {
                    throw new TypeError();
                }
            }
        },
        options);

        StyledElements.StyledInputElement.call(this, options.initialValue, ['change', 'focus', 'blur']);

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = StyledElements.Utils.prependWord(options['class'], "se-select");

        var div =  document.createElement("div");
        div.className = "se-select-arrow";
        this.inputElement = document.createElement("select");

        if (options.name) {
            this.inputElement.setAttribute("name", options.name);
        }

        if (options.id) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        this.textDiv = document.createElement("div");
        this.textDiv.className = "se-select-text";

        this.wrapperElement.appendChild(this.textDiv);
        this.wrapperElement.appendChild(div);
        this.wrapperElement.appendChild(this.inputElement);

        this.optionsByValue = {};
        this.optionValues = {};
        this.idFunc = options.idFunc;
        this.addEntries(options.initialEntries);

        /* Internal events */
        this._onchange = onchange.bind(this);
        this._onfocus = onfocus.bind(this);
        this._onblur = onblur.bind(this);

        this.inputElement.addEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.inputElement.addEventListener('click', StyledElements.Utils.stopPropagationListener, true);
        this.inputElement.addEventListener('change', this._onchange, true);
        this.inputElement.addEventListener('focus', this._onfocus, true);
        this.inputElement.addEventListener('blur', this._onblur, true);

        // initialize the textDiv with the initial selection
        var selectedIndex = this.inputElement.options.selectedIndex;
        if (selectedIndex !== -1) {
            this.textDiv.textContent = this.inputElement.options[selectedIndex].text;
        }
    };
    StyledSelect.prototype = new StyledElements.StyledInputElement();

    StyledSelect.prototype.getLabel = function getLabel() {
        return this.textDiv.textContent;
    };

    StyledSelect.prototype.getValue = function getValue() {
        return this.optionValues[this.inputElement.value];
    };

    StyledSelect.prototype.setValue = function setValue(newValue) {
        if (typeof newValue !== 'string') {
            try {
                newValue = this.idFunc(newValue);
            } catch (e) {
                newValue = null;
            }
        }

        // TODO exception if the newValue is not listened in the option list?
        if (newValue === null || !(newValue in this.optionValues)) {
            if (this.defaultValue != null) {
                newValue = this.defaultValue;
            } else if (this.inputElement.options.length > 0) {
                newValue = this.inputElement.options[0].value;
            } else {
                StyledElements.StyledInputElement.prototype.setValue.call(this, '');
                this.textDiv.textContent = '';
                return;
            }
        }

        StyledElements.StyledInputElement.prototype.setValue.call(this, newValue);
        this.textDiv.textContent = this.optionsByValue[newValue];
    };

    /**
     * @param {null|Array} newEntries Entries to add. This method does nothing if
     * newEntries is null.
     */
    StyledSelect.prototype.addEntries = function addEntries(newEntries) {
        var oldSelectedIndex, optionValue, optionLabel;

        oldSelectedIndex = this.inputElement.options.selectedIndex;

        if (newEntries == null || newEntries.length === 0) {
            return;
        }

        for (var i = 0; i < newEntries.length; i++) {
            var option = document.createElement("option");
            if (newEntries[i] instanceof Array) {
                optionValue = newEntries[i][0];
                optionLabel = newEntries[i][1];
            } else {
                optionValue = newEntries[i].value;
                optionLabel = newEntries[i].label;
            }
            optionLabel = optionLabel ? optionLabel : optionValue;

            var realValue = optionValue;
            if (typeof optionValue !== 'string') {
                optionValue = this.idFunc(optionValue);
            }
            option.setAttribute("value", optionValue);
            option.appendChild(document.createTextNode(optionLabel));

            if (this.defaultValue == optionValue) {
                option.setAttribute("selected", "selected");
            }

            this.inputElement.appendChild(option);
            this.optionValues[optionValue] = realValue;
            this.optionsByValue[optionValue] = optionLabel;
        }

        // initialize the textDiv with the initial selection
        var selectedIndex = this.inputElement.options.selectedIndex;
        if (oldSelectedIndex !== selectedIndex) {
            this.textDiv.textContent = this.inputElement.options[selectedIndex].text;
        }
    };

    StyledSelect.prototype.clear = function clear() {
        // Clear textDiv
        this.textDiv.textContent = "";

        // Clear select element options
        this.inputElement.textContent = "";

        this.optionsByValue = {};
        this.optionsValues = {};
    };

    StyledSelect.prototype.destroy = function destroy() {

        this.inputElement.removeEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.inputElement.removeEventListener('click', StyledElements.Utils.stopPropagationListener, true);
        this.inputElement.removeEventListener('change', this._onchange, true);
        this.inputElement.removeEventListener('focus', this._onfocus, true);
        this.inputElement.removeEventListener('blur', this._onblur, true);

        delete this._onchange;
        delete this._onfocus;
        delete this._onblur;

        StyledElements.StyledInputElement.prototype.destroy.call(this);
    };

    StyledElements.StyledSelect = StyledSelect;

})();
