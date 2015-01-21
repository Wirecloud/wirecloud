/*
 *     Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

    var StyledFileField, onchange, onclick, onfocus, onblur;

    onclick = function onclick(e) {
        if (e.target === this.inputElement) {
            return;
        }

        this.inputElement.click();
        e.stopPropagation();
        e.preventDefault();
        return false;
    };

    onchange = function onchange() {
        var file, filename;
        
        file = this.getValue();
        if (file != null) {
            filename = file.name;
        } else {
            filename = '';
        }
        this.name_preview.textContent = filename;
        this.name_preview.setAttribute('title', filename);
        this.events.change.dispatch(this);
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
     * Añade un campo de texto.
     */
    StyledFileField = function StyledFileField(options) {
        var defaultOptions = {
            'class': ''
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        StyledElements.StyledInputElement.call(this, options.initialValue, ['change', 'focus', 'blur']);

        this.layout = new StyledElements.HorizontalLayout({'class': 'se-file-field input input-append'});
        this.wrapperElement = this.layout.wrapperElement;
        if (options['class'] !== "") {
            this.wrapperElement.className += " " + options['class'];
        }

        var wrapper = document.createElement('div');
        wrapper.className = 'input_wrapper';
        this.wrapperElement.appendChild(wrapper);
        this.inputElement = document.createElement("input");
        this.inputElement.setAttribute("type", "file");
        this.inputElement.setAttribute('tabindex', 0);
        wrapper.appendChild(this.inputElement);

        if (options.name) {
            this.inputElement.setAttribute("name", options.name);
        }

        if (options.id != null) {
            this.wrapperElement.setAttribute("id", options.id);
        }

        this.name_preview = document.createElement('div');
        this.name_preview.className = 'filename';
        this.layout.getCenterContainer().appendChild(this.name_preview);

        /* Pseudo button */
        var button = document.createElement('div');
        button.className = 'styled_button';
        var button_span = document.createElement('span');
        button_span.textContent = gettext('Select');
        button.appendChild(button_span);
        this.layout.getEastContainer().appendChild(button);

        /* Internal events */
        this._onchange = onchange.bind(this);
        this._onclick = onclick.bind(this);
        this._onfocus = onfocus.bind(this);
        this._onblur = onblur.bind(this);

        this.inputElement.addEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.inputElement.addEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.wrapperElement.addEventListener('click', this._onclick, true);
        this.inputElement.addEventListener('change', this._onchange, true);
        this.inputElement.addEventListener('focus', this._onfocus, true);
        this.inputElement.addEventListener('blur', this._onblur, true);
    };
    StyledFileField.prototype = new StyledElements.StyledInputElement();

    StyledFileField.prototype.repaint = function repaint() {
        this.layout.repaint();
    };

    StyledFileField.prototype.insertInto = function insertInto(element, refElement) {
        StyledElements.StyledInputElement.prototype.insertInto.call(this, element, refElement);
        this.repaint();
    };

    StyledFileField.prototype.getValue = function getValue() {
        return this.inputElement.files[0];
    };

    StyledFileField.prototype.destroy = function destroy() {

        this.inputElement.removeEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.wrapperElement.removeEventListener('click', this._onclick, true);
        this.inputElement.removeEventListener('change', this._onchange, true);
        this.inputElement.removeEventListener('focus', this._onfocus, true);
        this.inputElement.removeEventListener('blur', this._onblur, true);

        delete this._onchange;
        delete this._onfocus;
        delete this._onblur;

        StyledElements.StyledInputElement.prototype.destroy.call(this);
    };

    StyledElements.StyledFileField = StyledFileField;

})();
