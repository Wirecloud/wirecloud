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

/*global StyledElements, Wirecloud*/

(function () {

    "use strict";

    var update = function update(inc) {
        var value = Number(this.inputElement.value);
        if (!isNaN(value)) {
            value = Math.round((value + inc) * 100) / 100;

            // Check for max & min values
            if (value > this.options.max) {
                value = this.options.max;
            } else if (value < this.options.min) {
                value = this.options.min;
            }
        } else if (inc > 0 && this.options.min !== Number.NEGATIVE_INFINITY) {
            value = this.options.min;
        } else if (inc < 0 && this.options.max !== Number.POSITIVE_INFINITY) {
            value = this.options.max;
        } else {
            value = 0;
        }

        this.inputElement.value = value;
    };

    var onfocus = function onfocus() {
        this.wrapperElement.classList.add('focus');
        this.events.focus.dispatch(this);
    };

    var onblur = function onblur() {
        this.wrapperElement.classList.remove('focus');
        this.events.blur.dispatch(this);
    };

    /**
     * @param options Una tabla hash con opciones. Los posibles valores son los
     * siguientes:
     *   - name: nombre que tendrá el elemento input (sólo es necesario cuando se
     *     está creando un formulario).
     *   - class: lista de clases separada por espacios que se asignará al div
     *     principal de este Numeric Field. Independientemente del valor de esta
     *     opción, siempre se le asignará la clase "styled_numeric_field" al div
     *     principal.
     *   - min: valor mínimo que permitirá este Numeric Field.
     *   - max: valor máximo que permitirá este Numeric Field.
     *
     */
    var StyledNumericField = function StyledNumericField(options) {
        var defaultOptions = {
            'initialValue': 0,
            'class': '',
            'min': Number.NEGATIVE_INFINITY,
            'max': Number.POSITIVE_INFINITY,
            'inc': 1
        };
        this.options = options = StyledElements.Utils.merge(defaultOptions, options);
        options.min = Number(options.min);
        options.max = Number(options.max);
        options.inc = Number(options.inc);
        options.initialValue = Number(options.initialValue);

        StyledElements.StyledInputElement.call(this, options.initialValue, ['change', 'focus', 'blur']);

        this.wrapperElement = document.createElement("div");
        this.wrapperElement.className = "se-numeric-field";
        this.inputElement = document.createElement("input");
        this.inputElement.setAttribute("type", "text");

        if (options.name != null) {
            this.inputElement.setAttribute("name", options.name);
        }

        if (options.id != null) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        this.inputElement.setAttribute("value", options.initialValue);

        var topButton = new StyledElements.StyledButton({'class': 'se-numeric-field-top-button', iconClass: 'icon-caret-up'});
        var bottomButton = new StyledElements.StyledButton({'class': 'se-numeric-field-bottom-button', iconClass: 'icon-caret-down'});

        /* Internal events */
        topButton.addEventListener("click", update.bind(this, options.inc));
        bottomButton.addEventListener("click", update.bind(this, -options.inc));
        this.inputElement.addEventListener("focus", onfocus.bind(this), true);
        this.inputElement.addEventListener("blur", onblur.bind(this), true);

        this.wrapperElement.appendChild(this.inputElement);
        topButton.insertInto(this.wrapperElement);
        bottomButton.insertInto(this.wrapperElement);
    };
    StyledNumericField.prototype = new StyledElements.StyledInputElement();

    StyledNumericField.prototype.getValue = function getValue() {
        return Number(this.inputElement.value);
    };

    StyledElements.StyledNumericField = StyledNumericField;

})();
