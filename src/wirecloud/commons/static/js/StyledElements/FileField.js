/*
 *     Copyright (c) 2013-2016 CoNWeT Lab., Universidad Politécnica de Madrid
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

    const onclick = function onclick(e) {
        if (e.target === this.inputElement) {
            return;
        }

        this.inputElement.click();
        e.stopPropagation();
        e.preventDefault();
        return false;
    };

    const onchange = function onchange() {
        const file = this.getValue();
        const filename = file != null ? file.name : "";
        this.name_preview.textContent = filename;
        this.name_preview.setAttribute('title', filename);
        this.dispatchEvent('change');
    };

    const onfocus = function onfocus() {
        this.wrapperElement.classList.add('focus');
        this.dispatchEvent('focus');
    };

    const onblur = function onblur() {
        this.wrapperElement.classList.remove('focus');
        this.dispatchEvent('blur');
    };

    se.FileField = class FileField extends se.InputElement {

        constructor(options) {
            var defaultOptions = {
                'class': ''
            };
            options = utils.merge(defaultOptions, options);

            super(options.initialValue, ['change', 'focus', 'blur']);

            this.layout = new StyledElements.HorizontalLayout({'class': 'se-file-field input input-append'});
            this.wrapperElement = this.layout.wrapperElement;
            if (options.class !== "") {
                this.wrapperElement.className += " " + options.class;
            }

            const wrapper = document.createElement('div');
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
            button.className = 'se-btn';
            var button_span = document.createElement('span');
            button_span.textContent = utils.gettext('Select');
            button.appendChild(button_span);
            this.layout.getEastContainer().appendChild(button);

            /* Internal events */
            this._onchange = onchange.bind(this);
            this._onclick = onclick.bind(this);
            this._onfocus = onfocus.bind(this);
            this._onblur = onblur.bind(this);

            this.inputElement.addEventListener('mousedown', utils.stopPropagationListener, true);
            this.wrapperElement.addEventListener('click', this._onclick, true);
            this.inputElement.addEventListener('change', this._onchange, true);
            this.inputElement.addEventListener('focus', this._onfocus, true);
            this.inputElement.addEventListener('blur', this._onblur, true);
        }

        repaint() {
            this.layout.repaint();
        }

        insertInto(element, refElement) {
            super.insertInto(element, refElement);
            this.repaint();
        }

        getValue() {
            return this.inputElement.files[0];
        }

        destroy() {
            this.inputElement.removeEventListener('mousedown', utils.stopPropagationListener, true);
            this.wrapperElement.removeEventListener('click', this._onclick, true);
            this.inputElement.removeEventListener('change', this._onchange, true);
            this.inputElement.removeEventListener('focus', this._onfocus, true);
            this.inputElement.removeEventListener('blur', this._onblur, true);

            delete this._onchange;
            delete this._onfocus;
            delete this._onblur;

            super.destroy();
        }

    }

})(StyledElements, StyledElements.Utils);
