/*
 *     Copyright (c) 2013-2015 CoNWeT Lab., Universidad Politécnica de Madrid
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

    const onFocus = function onFocus(e) {
        const range = document.createRange();
        range.selectNodeContents(this.wrapperElement);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        document.addEventListener('mousedown', this._onBlur, false);
    };

    const onKeydown = function onKeydown(e) {
        if (e.keyCode === 13) { // enter
            this._onBlur();
        } else if (e.keyCode === 27) { // esc
            this.wrapperElement.textContent = this._prev_content;
            this._onBlur();
        }
    };

    const onBlur = function onBlur(e) {
        if (!this.wrapperElement.hasAttribute('contenteditable')) {
            return;
        }

        document.removeEventListener('mousedown', this._onBlur, false);

        const new_content = this.wrapperElement.textContent;
        this.wrapperElement.textContent = new_content;
        if (this._prev_content !== new_content) {
            this.dispatchEvent('change', new_content);
        }
        this.disableEdition();
    };

    se.EditableElement = class EditableElement extends se.StyledElement {

        constructor(options) {

            super(['change']);

            this.wrapperElement = document.createElement('span');
            this.setTextContent(options.initialContent);

            this._onFocus = onFocus.bind(this);
            this._onKeydown = onKeydown.bind(this);
            this._onBlur = onBlur.bind(this);

            this.wrapperElement.addEventListener('focus', this._onFocus, true);
            this.wrapperElement.addEventListener('keydown', this._onKeydown, true);
            this.wrapperElement.addEventListener('blur', this._onBlur, true);
        }

        disableEdition() {
            if (this.wrapperElement.hasAttribute('contenteditable')) {
                this.wrapperElement.removeEventListener('mousedown', utils.stopPropagationListener, true);
                this.wrapperElement.removeAttribute('contenteditable');
                this.wrapperElement.blur();
                this.wrapperElement.scrollLeft = 0;
                this.wrapperElement.scrollTop = 0;
            }
        }

        enableEdition() {
            if (!this.wrapperElement.hasAttribute('contenteditable')) {
                this.wrapperElement.addEventListener('mousedown', utils.stopPropagationListener, true);
                this.wrapperElement.setAttribute('contenteditable', 'true');
                this._prev_content = this.wrapperElement.textContent;
            }
            this.wrapperElement.focus();
        }

        setTextContent(textContent) {
            this.wrapperElement.textContent = textContent;

            return this;
        }

        destroy() {
            this.wrapperElement.removeEventListener('focus', this._onFocus, true);
            this.wrapperElement.removeEventListener('keydown', this._onKeydown, true);
            this.wrapperElement.removeEventListener('blur', this._onBlur, true);

            this._onFocus = null;
            this._onKeydown = null;
            this._onBlur = null;

            StyledElements.StyledElement.prototype.destroy.call(this);
        }

    }

})(StyledElements, StyledElements.Utils);
