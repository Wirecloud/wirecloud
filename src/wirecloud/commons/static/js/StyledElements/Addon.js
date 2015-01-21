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

    var clickCallback = function clickCallback(e) {
        e.preventDefault();
        e.stopPropagation();

        if (this._related_input) {
            this._related_input.focus();
        }
    };

    var Addon = function Addon(options) {
        var button, defaultOptions = {
            'text': null,
            'title': '',
            'class': ''
        };
        options = StyledElements.Utils.merge(defaultOptions, options);

        StyledElements.StyledElement.call(this, []);

        this.wrapperElement = document.createElement("span");
        this.wrapperElement.className = StyledElements.Utils.appendWord(options['class'], "add-on");

        if (options.title) {
            this.setTitle(options.title);
        }

        if (options.text) {
            this.setLabel(options.text);
        }

        /* Event handlers */
        this._clickCallback = clickCallback.bind(this);

        this.wrapperElement.addEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.wrapperElement.addEventListener('click', this._clickCallback, true);
    };
    Addon.prototype = new StyledElements.Container();

    Addon.prototype.setDisabled = function setDisabled(disabled) {
        if (disabled) {
            this.addClassName('disabled');
        } else {
            this.removeClassName('disabled');
        }
        this.enabled = !disabled;
    };

    Addon.prototype.setLabel = function setLabel(label) {
        this.clear();
        this.wrapperElement.textContent = label;
    };

    Addon.prototype.setTitle = function setTitle(title) {
        this.wrapperElement.setAttribute('title', title);
    };

    Addon.prototype.assignInput = function assignInput(input) {
        this._related_input = input;
    };

    Addon.prototype.destroy = function destroy() {

        this.wrapperElement.removeEventListener('mousedown', StyledElements.Utils.stopPropagationListener, true);
        this.wrapperElement.removeEventListener('click', this._clickCallback, true);

        delete this.wrapperElement;
        delete this._clickCallback;

        StyledElements.StyledElement.prototype.destroy.call(this);
    };

    StyledElements.Addon = Addon;
})();
