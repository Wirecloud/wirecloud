/*
 *     Copyright (c) 2008-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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


(function (utils) {

    "use strict";

    var PasswordField, oninput, onfocus, onblur;

    oninput = function oninput() {
        this.dispatchEvent('change');
    };

    onfocus = function onfocus() {
        this.dispatchEvent('focus');
    };

    onblur = function onblur() {
        this.dispatchEvent('blur');
    };

    /**
     * Añade un campo de texto.
     */
    PasswordField = function PasswordField(options) {
        var defaultOptions = {
            'initialValue': '',
            'class': ''
        };
        options = utils.merge(defaultOptions, options);

        StyledElements.InputElement.call(this, options.initialValue, ['change', 'focus', 'blur']);

        this.inputElement = document.createElement("input");
        this.inputElement.setAttribute("type", "password");

        this.wrapperElement = this.inputElement;
        this.wrapperElement.className = "se-password-field";
        if (options.class !== "") {
            this.wrapperElement.className += " " + options.class;
        }

        if ('name' in options) {
            this.inputElement.setAttribute("name", options.name);
        }

        if ('id' in options) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        this.inputElement.setAttribute("value", options.initialValue);

        /* Internal events */
        this._oninput = oninput.bind(this);
        this._onfocus = onfocus.bind(this);
        this._onblur = onblur.bind(this);

        this.inputElement.addEventListener('mousedown', utils.stopPropagationListener, true);
        this.inputElement.addEventListener('click', utils.stopPropagationListener, true);
        this.inputElement.addEventListener('input', this._oninput, true);
        this.inputElement.addEventListener('focus', this._onfocus, true);
        this.inputElement.addEventListener('blur', this._onblur, true);
        this.inputElement.addEventListener('keydown', utils.stopInputKeydownPropagationListener, false);
    };
    utils.inherit(PasswordField, StyledElements.InputElement);

    PasswordField.prototype.destroy = function destroy() {

        this.inputElement.removeEventListener('mousedown', utils.stopPropagationListener, true);
        this.inputElement.removeEventListener('click', utils.stopPropagationListener, true);
        this.inputElement.removeEventListener('input', this._oninput, true);
        this.inputElement.removeEventListener('focus', this._onfocus, true);
        this.inputElement.removeEventListener('blur', this._onblur, true);
        this.inputElement.removeEventListener('keydown', utils.stopInputKeydownPropagationListener, false);

        StyledElements.InputElement.prototype.destroy.call(this);
    };

    StyledElements.PasswordField = PasswordField;

})(StyledElements.Utils);
