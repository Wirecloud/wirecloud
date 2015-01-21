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

/*global StyledElements */

(function () {

    "use strict";

    var StyledTextField, oninput, onfocus, onblur, onkeypress;

    oninput = function oninput() {
        this.events.change.dispatch(this);
    };

    onfocus = function onfocus() {
        this.events.focus.dispatch(this);
    };

    onblur = function onblur() {
        this.events.blur.dispatch(this);
    };

    onkeypress = function onkeypress(event) {
        if (event.keyCode === 13) { // enter
            this.events.submit.dispatch(this);
        }
    };

    /**
     * Añade un campo de texto.
     */
    StyledTextField = function StyledTextField(options) {
        var defaultOptions = {
            'initialValue': '',
            'class': '',
            'placeholder': null
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        StyledElements.StyledInputElement.call(this, options.initialValue, ['change', 'focus', 'blur', 'submit']);

        this.inputElement = document.createElement("input");
        this.inputElement.setAttribute("type", "text");

        this.wrapperElement = this.inputElement;
        this.wrapperElement.className = "se-text-field";
        if (options['class'] !== "") {
            this.wrapperElement.className += " " + options['class'];
        }

        if (options.name) {
            this.inputElement.setAttribute("name", options.name);
        }

        if (options.placeholder != null) {
            this.setPlaceholder(options.placeholder);
        }

        if (options.id != null) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        this.inputElement.setAttribute("value", options.initialValue);

        /* Internal events */
        this._oninput = oninput.bind(this);
        this._onfocus = onfocus.bind(this);
        this._onblur = onblur.bind(this);
        this._onkeypress = onkeypress.bind(this);

        this.inputElement.addEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.inputElement.addEventListener('click', StyledElements.Utils.stopPropagationListener, true);
        this.inputElement.addEventListener('input', this._oninput, true);
        this.inputElement.addEventListener('focus', this._onfocus, true);
        this.inputElement.addEventListener('blur', this._onblur, true);
        this.inputElement.addEventListener('keypress', this._onkeypress, true);
    };
    StyledTextField.prototype = new StyledElements.StyledInputElement();

    StyledTextField.prototype.setPlaceholder = function setPlaceholder(placeholder) {
        this.inputElement.setAttribute('placeholder', placeholder);
    };

    StyledTextField.prototype.destroy = function destroy() {

        this.inputElement.removeEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.inputElement.removeEventListener('click', StyledElements.Utils.stopPropagationListener, true);
        this.inputElement.removeEventListener('input', this._oninput, true);
        this.inputElement.removeEventListener('focus', this._onfocus, true);
        this.inputElement.removeEventListener('blur', this._onblur, true);
        this.inputElement.removeEventListener('keypress', this._onkeypress, true);

        delete this._oninput;
        delete this._onfocus;
        delete this._onblur;
        delete this._onkeypress;

        StyledElements.StyledInputElement.prototype.destroy.call(this);
    };

    StyledElements.StyledTextField = StyledTextField;

})();
