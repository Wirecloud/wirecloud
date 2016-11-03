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


(function (se, utils) {

    "use strict";

    var TextField, oninput, onfocus, onblur, onkeypress;

    oninput = function oninput() {
        this.dispatchEvent('change');
    };

    onfocus = function onfocus() {
        this.dispatchEvent('focus');
    };

    onblur = function onblur() {
        this.dispatchEvent('blur');
    };

    onkeypress = function onkeypress(event) {
        if (utils.normalizeKey(event) === "Enter") {
            this.dispatchEvent('submit');
        }
    };

    /**
     * @constructor
     * @name StyledElements.TextField
     * @extends StyledElements.InputElement
     */
    TextField = function TextField(options) {
        var defaultOptions = {
            'initialValue': '',
            'class': '',
            'placeholder': null
        };
        options = utils.merge(defaultOptions, options);

        StyledElements.InputElement.call(this, options.initialValue, ['change', 'focus', 'blur', 'submit', 'keydown']);

        this.inputElement = document.createElement("input");
        this.inputElement.setAttribute("type", "text");

        this.wrapperElement = this.inputElement;
        this.wrapperElement.className = "se-text-field";
        if (options.class !== "") {
            this.wrapperElement.className += " " + options.class;
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

        this.inputElement.addEventListener('mousedown', utils.stopPropagationListener, true);
        this.inputElement.addEventListener('click', utils.stopPropagationListener, true);
        this.inputElement.addEventListener('input', this._oninput, true);
        this.inputElement.addEventListener('focus', this._onfocus, true);
        this.inputElement.addEventListener('blur', this._onblur, true);
        this.inputElement.addEventListener('keypress', this._onkeypress, true);

        this._onkeydown_bound = element_onkeydown.bind(this);
        this.inputElement.addEventListener('keydown', this._onkeydown_bound, false);
    };
    utils.inherit(TextField, StyledElements.InputElement);

    TextField.prototype.setPlaceholder = function setPlaceholder(placeholder) {
        this.inputElement.setAttribute('placeholder', placeholder);
    };

    TextField.prototype.destroy = function destroy() {

        this.inputElement.removeEventListener('mousedown', utils.stopPropagationListener, true);
        this.inputElement.removeEventListener('click', utils.stopPropagationListener, true);
        this.inputElement.removeEventListener('input', this._oninput, true);
        this.inputElement.removeEventListener('focus', this._onfocus, true);
        this.inputElement.removeEventListener('blur', this._onblur, true);
        this.inputElement.removeEventListener('keypress', this._onkeypress, true);
        this.inputElement.removeEventListener('keydown', this._onkeydown_bound, false);

        delete this._oninput;
        delete this._onfocus;
        delete this._onblur;
        delete this._onkeypress;
        delete this._onkeydown_bound;

        StyledElements.InputElement.prototype.destroy.call(this);
    };

    StyledElements.TextField = TextField;

    // =========================================================================
    // PRIVATE MEMBERS
    // =========================================================================

    var propagate_keys = ['Escape', 'Enter'];

    var element_onkeydown = function element_onkeydown(event) {
        var modifiers, key;

        modifiers = utils.extractModifiers(event);
        key = utils.normalizeKey(event);

        if ((!modifiers.altKey && !modifiers.metaKey && !modifiers.ctrlKey && propagate_keys.indexOf(key) === -1) || key === 'Backspace') {
            event.stopPropagation();
        }

        if (this.enabled) {
            modifiers.preventDefault = event.preventDefault.bind(event);
            modifiers.stopPropagation = event.stopPropagation.bind(event);
            modifiers.key = key;
            this.dispatchEvent('keydown', modifiers, key);
        }
    };

})(StyledElements, StyledElements.Utils);
