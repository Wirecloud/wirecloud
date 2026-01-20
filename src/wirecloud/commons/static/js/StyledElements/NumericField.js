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

    const onfocus = function onfocus() {
        this.wrapperElement.classList.add('focus');
        this.dispatchEvent('focus');
    };

    const onblur = function onblur() {
        this.wrapperElement.classList.remove('focus');
        this.dispatchEvent('blur');
    };

    se.NumericField = class NumericField extends se.InputElement {

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
        constructor(options) {
            const defaultOptions = {
                'initialValue': 0,
                'class': '',
                'min': Number.NEGATIVE_INFINITY,
                'max': Number.POSITIVE_INFINITY,
                'inc': 1
            };

            options = utils.merge({}, defaultOptions, options);

            options.min = Number(options.min);
            options.max = Number(options.max);
            options.inc = Number(options.inc);
            options.initialValue = Number(options.initialValue);

            super(options.initialValue, ['change', 'focus', 'blur']);

            this.options = options;

            this.wrapperElement = document.createElement("div");
            this.wrapperElement.className = "se-numeric-field";
            this.inputElement = document.createElement("input");
            this.inputElement.setAttribute("type", "number");
            this.inputElement.setAttribute("step", options.inc);
            if (options.min !== Number.NEGATIVE_INFINITY) {
                this.inputElement.setAttribute("min", options.min);
            }

            if (options.max !== Number.POSITIVE_INFINITY) {
                this.inputElement.setAttribute("max", options.max);
            }

            if (options.name != null) {
                this.inputElement.setAttribute("name", options.name);
            }

            if (options.id != null) {
                this.wrapperElement.setAttribute("id", options.id);
            }

            this.inputElement.setAttribute("value", options.initialValue);

            /* Internal events */
            this.inputElement.addEventListener("focus", onfocus.bind(this), true);
            this.inputElement.addEventListener("blur", onblur.bind(this), true);
            this.inputElement.addEventListener("keydown", utils.stopInputKeydownPropagationListener, false);

            this.inputElement.addEventListener("input", (e) => {
                this.dispatchEvent('change', e);
            });

            this.wrapperElement.appendChild(this.inputElement);
        }

        getValue() {
            return Number(this.inputElement.value);
        }

    }

})(StyledElements, StyledElements.Utils);
