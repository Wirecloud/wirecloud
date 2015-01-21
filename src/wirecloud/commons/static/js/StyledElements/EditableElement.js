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

/*global Wirecloud*/

(function () {

    var onFocus = function onFocus(e) {
        var range = document.createRange();
        range.selectNodeContents(this.wrapperElement);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);

        document.addEventListener('mousedown', this._onBlur, false);
    };

    var onKeydown = function onKeydown(e) {
        if (e.keyCode === 13) {
            this._onBlur();
        }
    };

    var onBlur = function onBlur(e) {
        if (!this.wrapperElement.hasAttribute('contenteditable')) {
            return;
        }

        document.removeEventListener('mousedown', this._onBlur, false);

        this.events.change.dispatch(this, this.wrapperElement.textContent);
        this.disableEdition();
    };

    var EditableElement = function EditableElement(options) {

        StyledElements.StyledElement.call(this, ['change']);

        this.wrapperElement = document.createElement('span');

        this.wrapperElement.textContent = options.initialContent;

        this._onFocus = onFocus.bind(this);
        this._onKeydown = onKeydown.bind(this);
        this._onBlur = onBlur.bind(this);

        this.wrapperElement.addEventListener('focus', this._onFocus, true);
        this.wrapperElement.addEventListener('keydown', this._onKeydown, true);
        this.wrapperElement.addEventListener('blur', this._onBlur, true);
    };
    EditableElement.prototype = new StyledElements.StyledElement();

    EditableElement.prototype.disableEdition = function disableEdition() {
        if (this.wrapperElement.hasAttribute('contenteditable')) {
            this.wrapperElement.removeEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
            this.wrapperElement.removeAttribute('contenteditable');
            this.wrapperElement.blur();
            this.wrapperElement.scrollLeft = 0;
            this.wrapperElement.scrollTop = 0;
        }
    };

    EditableElement.prototype.enableEdition = function enableEdition() {
        if (!this.wrapperElement.hasAttribute('contenteditable')) {
            this.wrapperElement.addEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
            this.wrapperElement.setAttribute('contenteditable', 'true');
        }
        this.wrapperElement.focus();
    };

    EditableElement.prototype.destroy = function destroy() {
        this.wrapperElement.removeEventListener('focus', this._onFocus, true);
        this.wrapperElement.removeEventListener('keydown', this._onKeydown, true);
        this.wrapperElement.removeEventListener('blur', this._onBlur, true);

        this._onFocus = null;
        this._onKeydown = null;
        this._onBlur = null;

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.EditableElement = EditableElement;

})();
